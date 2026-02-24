
import { AUDIO_FRAME_SIZE, SAMPLE_RATE, SPEECH_ACTIVE_INTERVAL_MS, MAX_AUDIO_DURATION_SAMPLES } from './constants.js'
import { createAudioRecorder } from './recorder.js'
import { SileroVAD } from './silero-vad.js'



/**
 * Voice Activity Detection
 * 
 * Example:
 * 
 * let vad = new VAD({
 *      speechStart
 * })
 * 
 */
export class VAD {
    constructor(opts={}) {
        this.opts = {
            speechStart:function(){ console.log('Speech start') },
            speechEnd:function(){ console.log('Speech end') },
            onSpeech:function(buffer){ }, // provides the actual audio buffer recorded from speech start to speech end
            onFrame:function(frame){ }, // triggers on each recorded audio frame
            autostart:false,
            speechPauseMs: 500,
            numSaveFrames: 5,
            ...opts
        }

        this.lastFrames = []
        if(opts.autostart) this.start()
    }

    async start(){
        this.buffer = []
        this.currentFrame = null
        this.prevFrame = null

        this.processor = new SileroVAD()
        this.recorder = createAudioRecorder((frame) => {
            if(this.currentFrame) this.prevFrame = this.currentFrame
            this.currentFrame = frame
            // frame is Float32Array with length 512 at 16000 Hz sample rate
            if(this.processor) this.processor.process(frame).then(wasSpeech => {
                this.debounce(wasSpeech)
                this.opts.onFrame(frame, wasSpeech)
            })
        }, {
            sampleRate: SAMPLE_RATE,
            frameSize: AUDIO_FRAME_SIZE,
            numChannels: 1
        });
          
        // Start recording
        this.recorder.start()//.catch(console.error);
    }

    stop(){
        if(this.processor) this.processor = null
        if(this.recorder) this.recorder.stop();
    }

    get active(){
        return (this.recorder && this.recorder.isActive)
    }

    debounce(wasSpeech){
        if(!this.speaking && wasSpeech){
            this.speaking = true
            this.buffer = this.prevFrame ? [this.prevFrame] : []
            this.opts.speechStart()
        }
        if(wasSpeech && this.speaking === true){
            clearTimeout(this._ispeech)
            this.buffer.push(this.currentFrame)
            this._ispeech = setTimeout(()=>{
                if(this.speaking === true){
                    this.opts.speechEnd()
                    this.opts.onSpeech(this.flattenBuffer())
                }
                this.speaking = false
            }, this.opts.speechPauseMs)
        }
    }

    flattenBuffer(){
        let frames = this.buffer

        if (frames.length === 0) return new Float32Array(0);
        if (frames.length === 1) return frames[0].slice(); // Return copy of single frame
        
        // Calculate total length
        let totalLength = 0;
        for (let i = 0; i < frames.length; i++) {
            totalLength += frames[i].length;
        }
        
        const result = new Float32Array(totalLength);
        let offset = 0;
        
        // Copy all frames
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            result.set(frame, offset);
            offset += frame.length;
        }
        
        return result;
    }

    get sampleRate() {
        return SAMPLE_RATE
    }

}