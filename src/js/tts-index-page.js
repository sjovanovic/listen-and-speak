  import layoutHtml from '../html/tts-index-page.html?html'
  import { TtsBase } from './tts-base'

  export class TtsIndexPage extends TtsBase {
      constructor(state) {
        super()
        this.state = {
          buttonText:'Start',
          ...state
        }
        this.view.innerHTML = layoutHtml

        this.ttsLoader = this.view.querySelector('.TTSLoader')
        this.sttLoader = this.view.querySelector('.STTLoader')
        this.listeningIcon = this.view.querySelector('.Listening')

        this.sts = this.view.querySelector('listen-and-speak')
        this.sts.addEventListener('transcription', (ev)=>{
            let {text} = ev.detail
            console.log('Said:', text)
            if(this.hasAttribute('speakback')){
              this.sts.speak(text)
            }
        })

        this.sts.addEventListener('speech-start', (ev)=>{
          this.listeningIcon.style.display = 'block'
        })
        this.sts.addEventListener('speech-end', (ev)=>{
          this.listeningIcon.style.display = null
        })

        this.sts.addEventListener('progress', (ev)=>{
          let {progress, type} = ev.detail
          if(type == 'tts'){
            this.ttsLoader.percent = progress
            this.ttsLoader.status = 'Loading Text To Speech...'
          }else if(type == 'stt'){
            this.sttLoader.percent = progress
            this.ttsLoader.status = 'Loading Speech To Text...'
          }
        })

        this.sts.addEventListener('frame', (ev)=>{
          let {frame} = ev.detail 
          let level = this.analyzeAudioFrame(frame)
          level = 1 + (level * 5)
          this.style.setProperty('--audio-level', level);
        })

        let btn = this.startButton = this.view.querySelector('.StartButton')
        btn.addEventListener('click', ()=>{
          if(btn.classList.contains('Started')){
            btn.classList.remove('Started')
            btn.innerHTML = 'Start'
            this.sts.stop()
          }else{
            btn.classList.add('Started')
            btn.innerHTML = '⏹'
            this.sts.listen()
          }
        })

        this.bind('buttonText', '.StartButton')

      }

      /**
       * Analyzes an audio frame and returns a normalized average level (0 to 1).
       * Uses Root Mean Square (RMS) for a perceptually relevant average.
       * @param {Float32Array} frame - The audio frame (e.g., 512 samples).
       * @returns {number} Normalized level between 0 and 1.
       */
      analyzeAudioFrame(frame) {
        // 1. Calculate the sum of squares
        let sumOfSquares = 0.0;
        for (let i = 0; i < frame.length; i++) {
            sumOfSquares += frame[i] * frame[i];
        }
        // 2. Calculate the Root Mean Square (RMS)
        const rms = Math.sqrt(sumOfSquares / frame.length);
        // 3. Normalize (RMS can be up to 1.0 for full-scale audio)
        // You can apply a scaling factor here if your signal is typically quiet.
        // For demonstration, we assume full scale. A more robust version might:
        // - Use a moving target for auto-leveling.
        // - Apply a logarithmic scale to better match human hearing.
        const normalizedLevel = Math.min(1.0, rms); // Clamp at 1.0
        return normalizedLevel;
      }

      stopSpeaking(){
        if(this.sts && this.sts.speaker) this.sts.speaker.stop()
      }
  }
  customElements.define('tts-index-page', TtsIndexPage)


  export class ListenSpeakUI extends TtsIndexPage {} 

  customElements.define('listen-speak-ui', ListenSpeakUI)
  