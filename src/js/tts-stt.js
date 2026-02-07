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
        //     this.dispatchEvent(new CustomEvent('speech', {
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
        if(!this.speaker) this.speaker = new Speaker({
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
          pathToWorker: this.hasAttribute('worker-dir') ? this.getAttribute('worker-dir') : ''
        });

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
              this.dispatchEvent(new CustomEvent('speech', {
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
          }
        })
        this.vad.start()
      }

      speak(text) {
        if(this.speaker) {
          this.speaker.speak(text)
        }
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

      disconnectedCallback(){
        this.stop()
      }
  }
  customElements.define('listen-and-speak', TtsStt)
  