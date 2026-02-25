import { AudioPlayer } from "./AudioPlayer.js";

const THIS_SCRIPT = document.currentScript;

export class Speaker {
    constructor(opts={}){
        this.opts = {
          onProgress:function(progress){ console.log(`Loading model: ${progress}%`); },
          onVoices:function(){},
          onComplete:function(){},
          onLoadingStart:function(){},
          onReady:function(){},
          onStream:function(){},
          pathToWorker:'',
          ...opts
        }

        let workerUrl = this.opts.pathToWorker ? `${this.opts.pathToWorker}speaker-worker.js` : this.getWorkerUrl('speaker-worker.js')
        this.tts_worker = new Worker(workerUrl);
        this.audioPlayer = new AudioPlayer(this.tts_worker);
        this.tts_worker.addEventListener("message", (e) => this.messageReceived(e));
        this.tts_worker.addEventListener("error",  (e) => this.errorReceived(e));
        this.voiceId = 'expr-voice-2-m'

        this.ready = false
        this.speechQueue = []
    }


    getWorkerUrl(fileName){
      if(THIS_SCRIPT && THIS_SCRIPT.src) {
        return this.getScriptPath() + fileName
      }
      let url = this.getModuleUrlFallback()
      let path = url.split('/')
      path.pop()
      path = path.join('/') + '/' + fileName
      console.log('Worker path:', path)
      return path
    }

    getModuleUrlFallback() {
      try {
        throw new Error();
      } catch (error) {
        // Stack trace format varies by browser/engine
        const stackLine = error.stack.split('\n')[1]; // Get the first stack line after the error
        //console.log('stackLine', error.stack.split('\n'))
        // Extract URL using a regex (works in Chrome/Firefox/Safari)
        //const match = stackLine.match(/(https?:\/\/|file:\/\/\/)[^:\n]+/);
        const match = stackLine.match(/(https?:\/\/?[-a-zA-Z0-9\:\%\.]+?\/+|file:\/\/\/)[^:\n]+/);
        return match ? match[0] : null;
      }
    }

    getScriptPath(){
      let path = THIS_SCRIPT.src.split('/')
      path.pop()
      path = path.join('/') + '/'
      console.log('Worker path:', path)
      return path
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
            if(this.ready === true) {
              await this.audioPlayer.queueAudio(e.data.audio);
              this.opts.onStream(e.data) // data = {audio, text}
            } 
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
        this.ready = false;
        setTimeout(() => this.ready = true, 2000)
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
