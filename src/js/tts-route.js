import BendisRouter from 'bendis/BendisRouter'
  export class TtsRouter extends BendisRouter{
      constructor(){
          super('tts-')
      }
  }
  customElements.define('tts-route', TtsRouter)