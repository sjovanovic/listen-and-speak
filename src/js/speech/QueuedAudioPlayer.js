/**
 * QueuedAudioPlayer - Plays a stream of float32 audio chunks gaplessly.
 * Uses an inline Web Worker to manage the queue and Web Audio for scheduling.
 */
export class QueuedAudioPlayer {
    /**
     * @param {number} sampleRate - Sample rate of the audio data (default: 24000).
     */
    constructor(opts={}) {
        this.opts = {
            sampleRate:24000, 
            queueExausted:function(){},
            ...opts
        }

      this.sampleRate = this.opts.sampleRate;
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.sampleRate,
      });
  
      // Scheduling state
      this.nextStartTime = 0;           // AudioContext time when the next chunk should start
      this.activeSources = new Set();    // Track active AudioBufferSourceNodes for stop()
      this.isActive = true;              // Becomes false after stop() to ignore late worker messages
  
      // Inline worker creation
      this.worker = this._createWorker();
      this._setupWorker();
    }
  
    /**
     * Creates an inline Web Worker from a string (no external file).
     * @private
     */
    _createWorker() {
      const workerCode = `
        let queue = [];               // Array of transferred Float32Array buffers
        let isSending = false;        // Whether we are in the middle of sending chunks
  
        self.onmessage = (e) => {
          const { type, data } = e.data;
  
          switch (type) {
            case 'queue': {
              // Add new audio data to the queue (data is an ArrayBuffer)
              queue.push(data);
              // If we are not currently sending, start the flow immediately
              if (!isSending) {
                isSending = true;
                _sendNextChunk();
              }
              break;
            }
  
            case 'ready': {
              // Main thread is ready for the next chunk
              _sendNextChunk();
              break;
            }
  
            case 'stop': {
              // Clear queue and reset state
              queue = [];
              isSending = false;
              break;
            }
          }
        };
  
        function _sendNextChunk() {
          if (queue.length > 0) {
            // Transfer the buffer back to the main thread (ownership moves)
            const buffer = queue.shift();
            self.postMessage({ type: 'chunk', data: buffer }, [buffer]);
          } else {
            // No more chunks – inform main thread and stop sending
            isSending = false;
            self.postMessage({ type: 'empty' });
          }
        }
      `;
  
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      URL.revokeObjectURL(url); // Clean up blob URL
      return worker;
    }
  
    /**
     * Sets up the worker message handler.
     * @private
     */
    _setupWorker() {
      this.worker.onmessage = (e) => {
        // Ignore messages if stop() was called and we haven't been re‑activated
        if (!this.isActive) return;
  
        const { type, data } = e.data;
  
        if (type === 'chunk') {
          // data is an ArrayBuffer – convert back to Float32Array and play
          const floatArray = new Float32Array(data);
          this._playChunk(floatArray);
        } else if (type === 'empty') {
          // Queue is empty – nothing more to do
          // (we keep isActive true so future queueAudio() will restart)

          this.opts.queueExausted()
        }
      };
    }
  
    /**
     * Queues an audio chunk for playback.
     * @param {Float32Array|number[]} audioData - Mono audio samples at 24 kHz.
     */
    queueAudio(audioData) {
      // Ensure we have a Float32Array (accept plain arrays as well)
      if (!(audioData instanceof Float32Array)) {
        audioData = new Float32Array(audioData);
      }
  
      // Reactivate if we were stopped (isActive will be set back to true)
      this.isActive = true;
  
      // Transfer the buffer to the worker (zero‑copy)
      this.worker.postMessage({ type: 'queue', data: audioData.buffer }, [audioData.buffer]);
  
      // Ensure the AudioContext is running (user gesture may be required, but we try)
      this._resumeContext();
  
      // If we weren't playing, the worker will start sending chunks automatically.
      // The worker sends the first chunk immediately when it receives 'queue'
      // if it was idle (isSending === false).
    }
  
    /**
     * Resumes the AudioContext if it's suspended.
     * @private
     */
    async _resumeContext() {
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch (err) {
          console.warn('Failed to resume AudioContext:', err);
        }
      }
    }
  
    /**
     * Plays a single chunk using Web Audio and requests the next one.
     * @param {Float32Array} float32Array - The audio samples.
     * @private
     */
    _playChunk(float32Array) {
      // Create an AudioBuffer with the correct sample rate and channel count
      const audioBuffer = this.audioContext.createBuffer(
        1,                          // mono
        float32Array.length,
        this.sampleRate
      );
      audioBuffer.copyToChannel(float32Array, 0);
  
      // Create and configure the source node
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
  
      // Schedule this chunk – ensure we don’t start in the past
      const startTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;
  
      // Track the source for potential stop() calls
      this.activeSources.add(source);
      source.onended = () => {
        this.activeSources.delete(source);
        source.disconnect();
      };
  
      // Tell the worker we are ready for the next chunk.
      // This will trigger the next chunk to be sent (if any) and scheduled at this.nextStartTime.
      this.worker.postMessage({ type: 'ready' });
    }
  
    /**
     * Stops playback immediately, clears the queue, and frees resources.
     */
    stop() {
      // Mark as inactive so we ignore any late worker messages
      this.isActive = false;
  
      // Stop all currently playing/scheduled sources
      this.activeSources.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // source may not have started yet – ignore
        }
      });
      this.activeSources.clear();
  
      // Reset scheduling state
      this.nextStartTime = 0;
  
      // Clear the worker's queue and reset its state
      this.worker.postMessage({ type: 'stop' });
  
      // Optionally suspend the AudioContext to save power
      if (this.audioContext.state === 'running') {
        this.audioContext.suspend();
      }
    }
  }