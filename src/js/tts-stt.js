  import layoutHtml from '../html/tts-stt.html?html'
  import { TtsBase } from './tts-base'
  import { VAD } from './vad/vad.js'
  import { createSpeechRecognition } from './recognition/recognition.js'
  import { Whisper } from './recognition/whisper.js'
  import { Speaker } from './speech/speaker.js'

  export class TtsStt extends TtsBase {
      constructor(state) {
        super()
        this.state = {...state}
        this.view.innerHTML = layoutHtml
      }
      listen(){

        // implement STT (speech to text) from the browser
        // if(!this.recognition) this.recognition = createSpeechRecognition({
        //   onSpeech:(text)=>{
        //     console.log('Detected text:', text)
        //     this.dispatchEvent(new CustomEvent('transcription', {
        //       detail: {
        //         text
        //       },
        //       bubbles: true,
        //       composed: true
        //     }))
        //   },
        //   onSpeaking:(text) => {
        //     //console.log('Interim:', text)
        //   }
        // })

        // implement Speech Recognition (speech to text)
        if(!this.recognition) this.recognition = new Whisper({
          onProgress:(progress, info) =>{
            //console.log('Whisper loading', progress, info)
            this.dispatchEvent(new CustomEvent('progress', {
              detail: {
                type:'stt',
                progress,
                info
              },
              bubbles: true,
              composed: true
            }))
          }
        })

        // implement TTS (text to speech) synthesis
        if(!this.speaker) this.initSpeaker()

        // implement VAD (voice activity detection) then
        this.vad = new VAD({
          speechStart:()=>{
            this.dispatchEvent(new CustomEvent('speech-start', {
              detail: {},
              bubbles: true,
              composed: true
            }))
          },
          speechEnd:() => {
            this.dispatchEvent(new CustomEvent('speech-end', {
              detail: {},
              bubbles: true,
              composed: true
            }))
          },
          onSpeech:(buffer)=>{
            this.recognition.transcribe(buffer).then(res => {
              this.dispatchEvent(new CustomEvent('transcription', {
                detail: {
                  text: res.text
                },
                bubbles: true,
                composed: true
              }))
            })
          },
          onFrame:(frame)=>{
            this.dispatchEvent(new CustomEvent('frame', {
              detail: {
                frame: frame
              },
              bubbles: true,
              composed: true
            }))
          },
          speechThreshold: this.hasAttribute('vad-threshold') ? parseFloat(this.getAttribute('vad-threshold')) : undefined,
          stopThreshold: this.hasAttribute('vad-end-threshold') ? parseFloat(this.getAttribute('vad-end-threshold')) : undefined,
        })
        this.vad.start()
      }

      initSpeaker(){
        return new Promise((resolve, reject) => {
          // implement TTS (text to speech) synthesis
          if(!this.speaker) {
            this.speaker = new Speaker({
              onProgress:(progress, info) =>{
                this.dispatchEvent(new CustomEvent('progress', {
                  detail: {
                    type:'tts',
                    progress,
                    info
                  },
                  bubbles: true,
                  composed: true
                }))
              },
              onReady:()=>{
                resolve(this.speaker)
              },
              onStream:(data) => {
                let {audio, text} = data
                this.dispatchEvent(new CustomEvent('audio-stream', {
                  detail: {
                    audio, 
                    text
                  },
                  bubbles: true,
                  composed: true
                }))
              }
            });
          }else{
            resolve(this.speaker)
          }
        })
      }

      speak(text) {
        return this.initSpeaker().then((speaker)=>{
          speaker.speak(text)
        }).catch(err => {
          console.error(err)
        })
      }

      speakFiller(){
        this.speak(this.filler)
      }

      stopSpeech(){
        if(this.speaker) {
          this.speaker.stop()
        }
      }

      stop(){
        if(this.vad) this.vad.stop()
        if(this.recognition) this.recognition.stop()
        if(this.speaker) this.speaker.stop()
      }

      connectedCallback(){
        if(this.hasAttribute('auto-start') && this.gerAttribute('auto-start') == "true"){
          this.listen()
        }
      }

      disconnectedCallback(){
        this.stop()
      }

      get fillers(){
        return [
          "Just a moment, please...",
          "One moment while I think...",
          "Give me a second...",
          "Working on it...",
          "Processing your request...",
          "Let me look that up...",
          "Hang tight...",
          "Let me see what I can find...",
          "Thinking...",
          "Hmm, let me think...",
          "Good question! Let me check...",
          "Just gathering my thoughts...",
          "On it!",
          "I'm on it, thanks for your patience!",
          "Thanks for waiting...",
          "This might take a few seconds...",
          "I appreciate your patience...",
          "Still here, just thinking...",
          "Almost there...",
          "Just a bit longer...",
          "I'm looking into that...",
          "This is an interesting one, give me a moment...",
          "Let me double-check that for you...",
          "I want to make sure I get this right...",
          "Let me put on my thinking cap...",
          "My neurons are firing...",
          "Computing...",
          "Doing some mental gymnastics...",
          "Please hold while I retrieve that information...",
          "Your request is being processed...",
          "I'll have an answer for you shortly...",
          "Thank you for your patience as I look into this."
        ]
      }
      // random filler sentence
      get filler(){
        let fillers = this.fillers
        return fillers[Math.floor(Math.random()*fillers.length)]
      }
  }
  customElements.define('listen-and-speak', TtsStt)
  