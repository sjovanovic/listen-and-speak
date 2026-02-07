import { pipeline, RawAudio } from '@huggingface/transformers';
import cache from 'just-once'

export const SAMPLE_RATE = 16000

const getModel = cache(async (callback) => {
    // Xenova/whisper-tiny.en  Xenova/whisper-tiny Xenova/whisper-small.en
    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {progress_callback: callback});
    return transcriber
})

export class Whisper {
    constructor(opts={}) {
        this.opts = {
            onProgress:function(){},
            onTranscribeProgress:function(){},
            ...opts
        }
    }
    /**
     * Transcribe audio in form of Float16Array with sample rate of 16000
     * @param {Float16Array} data 
     * @returns {Object} output = {text:""}
     */
    async transcribe(data){
        data = this.normalizeAudio(data);
        if(!this.transcriber) this.transcriber = await getModel((e)=>{
            this.opts.onProgress(e.progress, e)
        })
        const output = await this.transcriber(data, {
            // task: 'transcribe',
            // language: 'en',
            return_timestamps: false,
            chunk_length_s: 30,
            force_full_sequences: false,
            callback_function: (data) => {
                this.opts.onTranscribeProgress(data);
            }
        });
        let text = output.text
        text = text.trim()
        if(text.startsWith('[') && text.endsWith(']')) {
            console.log(text)
            output.soudsLike = text
            output.text = ''
        }
        return output
    }
    /**
     * Normalize audio data to [-1, 1] range
     * @private
     */
    normalizeAudio(audioData) {
        if (audioData.length === 0) return audioData;

        let max = 0;
        for (let i = 0; i < audioData.length; i++) {
            const abs = Math.abs(audioData[i]);
            if (abs > max) max = abs;
        }

        if (max === 0) return audioData;

        const normalized = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
            normalized[i] = audioData[i] / max;
        }

        return normalized;
    }
    stop(){}
}