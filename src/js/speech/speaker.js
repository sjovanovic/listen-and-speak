import { AudioPlayer } from "./AudioPlayer.js";


export class Speaker {
    constructor(opts={}){
        this.opts = {
          onProgress:function(progress){ console.log(`Loading model: ${progress}%`); },
          onVoices:function(){},
          onComplete:function(){},
          onLoadingStart:function(){},
          onReady:function(){},
          pathToWorker:'',
          ...opts
        }
        //this.tts_worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
        this.tts_worker = new Worker(this.opts.pathToWorker + "speaker-worker.js");
        this.audioPlayer = new AudioPlayer(this.tts_worker);
        this.tts_worker.addEventListener("message", (e) => this.messageReceived(e));
        this.tts_worker.addEventListener("error",  (e) => this.errorReceived(e));
        this.voiceId = 'af_heart'

        this.ready = false
        this.speechQueue = []
    }

    async messageReceived(e){
        switch (e.data.status) {
        case "loading_model_start":
          //console.log("Loading model...")
          this.opts.onLoadingStart()
          break;
        case "loading_model_ready":
          //console.log("Model loaded successfully");
          if (e.data.voices) {
            //console.log('Voices available', e.data.voices)
            this.opts.onVoices(e.data.voice)
          }
          this.opts.onReady()
          this.ready = true
          if(this.speechQueue.length) {
            let text = this.speechQueue.join('; ')
            this.speechQueue.length = 0
            this.speak(text)
          }
          break;
        case "loading_model_progress":
          let {name, loaded, total, progress} = e.data.progress
          if (isNaN(progress)) progress = 0;
          this.opts.onProgress(Math.round(progress), {name, loaded, total, progress})
          break;
        case "stream_audio_data":
            await this.audioPlayer.queueAudio(e.data.audio);
          break;
        case "complete":
            //console.log("Streaming complete");
            this.opts.onComplete()
          break;
      }
    }

    errorReceived(e) {
      console.error("Speaker worker error:", e);
    }

    stop(){
        this.tts_worker.postMessage({ type: "stop" });
        if(this.audioPlayer) this.audioPlayer.stop();
    }

    speak(text){
      if(this.ready) {
        this.tts_worker.postMessage({ type: "generate", text: text, voice: this.voiceId });
      }else{
        this.speechQueue.push(text)
      }
    }
}
