export function createAudioRecorder(onAudioFrame, config = {}) {
    const {
      sampleRate = 16000,
      frameSize = 512,
      numChannels = 1
    } = config;
  
    let audioContext = null;
    let source = null;
    let workletNode = null;
    let stream = null;
    let isActive = false;
  
    // The worklet processor code is defined inline as a string
    // It will be turned into a Blob and loaded as a module
    const workletCode = `
      // ---- AudioWorklet Processor with Internal Buffering ----
      class BufferingRecorderProcessor extends AudioWorkletProcessor {
        constructor(options) {
          super();
          // Get the desired frame size from parameters passed from the main thread
          this.frameSize = options.processorOptions.frameSize || 512;
          this.buffer = new Float32Array(this.frameSize);
          this.bufferIndex = 0;
  
          // Setup communication back to the main thread
          this.port.onmessage = (e) => {
            // Handle any incoming messages if needed
            if (e.data === 'flush' && this.bufferIndex > 0) {
              // Send whatever is in the buffer if a flush is requested
              this.port.postMessage(this.buffer.slice(0, this.bufferIndex));
              this.bufferIndex = 0;
            }
          };
        }
  
        process(inputs) {
          // 1. Get the microphone input channel (mono, channel 0)
          const input = inputs[0];
          if (!input || input.length === 0) {
            return true; // Keep processor alive
          }
          const inputChannel = input[0]; // Float32Array of 128 samples[citation:1]
  
          // 2. Copy samples into the internal buffer
          const remainingSpace = this.frameSize - this.bufferIndex;
          const samplesToCopy = Math.min(inputChannel.length, remainingSpace);
  
          // Copy this block of 128 samples into the accumulator
          this.buffer.set(inputChannel.slice(0, samplesToCopy), this.bufferIndex);
          this.bufferIndex += samplesToCopy;
  
          // 3. If buffer is full, send it and reset
          if (this.bufferIndex >= this.frameSize) {
            // Send a complete frame to the main thread
            this.port.postMessage(this.buffer);
  
            // Reset buffer index. If input block was larger than remaining space
            // (should not happen with 128-sample blocks), handle the overflow.
            this.bufferIndex = 0;
            const overflow = samplesToCopy - remainingSpace;
            if (overflow > 0) {
              // In practice, AudioWorklet block size is fixed at 128,
              // so this case is very unlikely for power-of-two frame sizes.
              this.buffer.set(inputChannel.slice(samplesToCopy, samplesToCopy + overflow));
              this.bufferIndex = overflow;
            }
          }
          return true; // Keep processor alive
        }
      }
  
      // Register the processor so the main thread can create a node from it[citation:1]
      registerProcessor('buffering-recorder-processor', BufferingRecorderProcessor);
    `;
  
    const start = async () => {
      if (isActive) return;
  
      try {
        // 1. Get access to the user's microphone
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: sampleRate,
            channelCount: numChannels,
            // echoCancellation: false,
            // noiseSuppression: false,
            // autoGainControl: false,

            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
  
        // 2. Create the Web Audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: sampleRate
        });
  
        // 3. Create a Blob from the worklet code and load it as a module
        const workletBlob = new Blob([workletCode], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(workletBlob);
        await audioContext.audioWorklet.addModule(workletUrl);
        URL.revokeObjectURL(workletUrl);
        
        // Firefox: Connecting AudioNodes from AudioContexts with different sample-rate is currently not supported.

        // 4. Create the audio node from the microphone stream
        source = audioContext.createMediaStreamSource(stream);
  
        // 5. Create the AudioWorkletNode, passing the desired frame size[citation:6]
        workletNode = new AudioWorkletNode(audioContext, 'buffering-recorder-processor', {
          processorOptions: { frameSize: frameSize } // Pass config to the processor
        });
  
        // 6. Listen for completed audio frames from the worklet
        workletNode.port.onmessage = (event) => {
          if (isActive && onAudioFrame) {
            // The processor sends a complete Float32Array of `frameSize`
            onAudioFrame(event.data);
          }
        };
  
        // 7. Connect the nodes: Microphone -> Worklet -> Destination
        source.connect(workletNode);
        workletNode.connect(audioContext.destination);
  
        isActive = true;
        //console.log('Recording started with', frameSize, 'sample frames.');
      } catch (error) {
        console.error('Error starting audio recorder:', error);
        cleanup();
        throw error;
      }
    };
  
    const stop = () => {
      if (!isActive) return;
      isActive = false;
      cleanup();
    };
  
    const cleanup = () => {
      // Send a flush command to get any remaining partial buffer
      if (workletNode && workletNode.port) {
        workletNode.port.postMessage('flush');
      }
  
      // Disconnect and stop all audio resources
      if (workletNode) {
        workletNode.disconnect();
        workletNode.port.onmessage = null;
      }
      if (source) source.disconnect();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
  
      workletNode = null;
      source = null;
      stream = null;
      audioContext = null;
    };
  
    // Return the public API
    return {
      start,
      stop,
      get isActive() { return isActive; },
      get sampleRate() { return sampleRate; },
      get frameSize() { return frameSize; }
    };
  }

/*
    // Usage Example:

    const recorder = createAudioRecorder((frame) => {
    console.log('Audio frame received:', frame);
        // frame is Float32Array with length 512 at 16000 Hz sample rate
    });

    // Start recording
    await recorder.start();

    // Stop when done
    recorder.stop();
*/