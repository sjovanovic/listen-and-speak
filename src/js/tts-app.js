  import layoutHtml from '../html/tts-app.html?html'
  import { TtsBase } from './tts-base'

  export class TtsApp extends TtsBase {
      constructor(state) {
        super()
        this.state = {...state}
        this.view.innerHTML = layoutHtml
      }
  }
  customElements.define('tts-app', TtsApp)
  