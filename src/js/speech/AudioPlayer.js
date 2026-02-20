import { SAMPLE_RATE } from './constants.js'
import {QueuedAudioPlayer} from './QueuedAudioPlayer.js'

export class AudioPlayer{
  constructor(worker) {
    this.worker = worker;
    this.player = new QueuedAudioPlayer({
        sampleRate: SAMPLE_RATE, 
        queueExausted:()=>{
          this.worker.postMessage({type: "buffer_processed", percent: 100});
        },
    })
  }

  async queueAudio(audioData) {
    this.player.queueAudio(audioData)
  }

  stop() {
    this.player.stop()
    if (this.worker) {
      this.worker.postMessage({
        type: "stop"
      });
    }
  }
}