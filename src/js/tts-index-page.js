  import layoutHtml from '../html/tts-index-page.html?html'
  import { TtsBase } from './tts-base'

  export class TtsIndexPage extends TtsBase {
      constructor(state) {
        super()
        this.state = {
          startLabel: '', //'▶',
          stopLabel:'⏹',
          ...state
        }
        this.view.innerHTML = layoutHtml

        

      }

      connectedCallback(){
        if(this.getAncestor('tts-route')) return
        this.init()
      }

      init(){
        this.ttsLoader = this.view.querySelector('.TTSLoader')
        this.sttLoader = this.view.querySelector('.STTLoader')
        this.listeningIcon = this.view.querySelector('.Listening')

        this.sts = this.view.querySelector('listen-and-speak')
        this.sts.addEventListener('transcription', (ev)=>{
            let {text} = ev.detail
            if(this.hasAttribute('speakback')){
              console.log('Said:', text)
              this.sts.speak(text)
            }
        })

        this.sts.addEventListener('speech-start', (ev)=>{
          this.listeningIcon.style.display = 'block'
          this.stopSpeaking()
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

        this.sts.addEventListener('audio-stream', (ev)=>{
          let {text} = ev.detail

          // display spoken text
          this.state.spokenText = text
        })

        let btn = this.startButton = this.view.querySelector('.StartButton')
        btn.addEventListener('click', ()=>{
          this.toggleListen()
        })

        this.bind('startLabel', '.StartButton')
        if(this.hasAttribute('start-label')){
          this.state.startLabel = this.getAttribute('start-label')
        }
        if(this.hasAttribute('stop-label')){
          this.state.stopLabel = this.getAttribute('stop-label')
        }

        this.ticker = this.view.querySelector('text-ticker')
        this.bind('spokenText', 'text-ticker', ({el, val}) => {
          this.ticker.addText(val)
        })

        // this.ticker.addText('Quick brown fox jumps over the lazy dog.')
        // setTimeout(()=>{
        //   this.ticker.addText('Foo bar baz.')
        // }, 1000)




        // setTimeout(()=>{
        //     this.speak('Quick brown fox jumps over the lazy dog.')
        //     setTimeout(()=>{
        //         this.speak('Foo bar baz.')
        //     }, 3000)
        // }, 1000)

        

        let ear = this.view.querySelector('.EarWrap')
        ear.addEventListener('click', ()=>{
          if(!ear.classList.contains('SRDisabled')) return
          ear.classList.remove('SRDisabled')
          this.listen()
        })


        this.view.querySelector('.Debug').addEventListener('click', ()=>this.debug())
      }

      get observedAttributes(){
        return ['start-label', 'stop-label']
      }
      attributeChangedCallback (name, oldValue, newValue) {
        if(name == 'start-label'){
          this.state.startLabel = newValue
        }else if(name == 'stop-label'){
          this.state.stopLabel = newValue
        }
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

      listen(){
        let btn = this.startButton
        btn.classList.add('Started')
        btn.innerHTML = this.state.stopLabel
        if(!this.sts.vad || !this.sts.vad.active){
          this.sts.listen()
        }
      }


      toggleListen(){
        let btn = this.startButton
        if(btn.classList.contains('Started')){
          this.stop()
        }else{
          this.listen()
        }
      }

      stop(){
        let btn = this.startButton
        btn.classList.remove('Started')
        btn.innerHTML = this.state.startLabel
        this.sts.stop()

        if(this.ticker) this.ticker.clear()
      }

      speak(text){
        this.sts.speak(text).then(()=>{
          if(!this.sts.vad || !this.sts.vad.active) {
            // indicate that the voice recognition is not active and enable button to activete it
            this.view.querySelector('.EarWrap').classList.add('SRDisabled')

            let btn = this.startButton
            btn.classList.add('Started')
            btn.innerHTML = this.state.stopLabel
          }
        })
      }

      stopSpeaking(){
        if(this.sts && this.sts.speaker) this.sts.stopSpeech()
        if(this.ticker) this.ticker.clear()
      }

      speakFiller(){
        if(this.sts) this.sts.speakFiller()
      }

      debug(){
        this.speak("The Japanese had already forgotten more neurosurgery than the Chinese had ever known.")
        setTimeout(()=>{
          this.speak("The black clinics of Chiba were the cutting edge, whole bodies of technique supplanted monthly, and still they couldn’t repair the damage he’d suffered in that Memphis hotel.")
        }, 1000)
      }
  }
  customElements.define('tts-index-page', TtsIndexPage)


  export class ListenSpeakUI extends TtsIndexPage {} 

  customElements.define('listen-speak-ui', ListenSpeakUI)
  