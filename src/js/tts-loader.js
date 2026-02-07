  import layoutHtml from '../html/tts-loader.html?html'
  import { TtsBase } from './tts-base'

  export class TtsLoader extends TtsBase {
      constructor(state) {
        super()
        this.state = {
          percent:0,
          shown:false,
          status: 'Loading...',
          ...state
        }
        this.view.innerHTML = layoutHtml

        this.bind('percent', '.SimpleLoader')
        this.bind('show', '.Base', ({el, val})=> el.style.display = val ? 'flex' : 'none')
        this.bind('status', '.LoadingStatus')

        this.watch('percent', ({val})=>{
          if(this.hasAttribute('show')) return
          if(val > 0 && val < 100){
            if(!this.show) this.show = true
          }else{
            if(this.show) this.show = false
          }
        })
      }
      connectedCallback(){
        this.show = this.hasAttribute('show') && this.getAttribute('show') != 'false'
        if(this.hasAttribute('percent')) {
          this.percent = this.getAttribute('percent')
        }
      }

      set percent(pc){
        pc = Math.round(parseFloat(pc))
        if(isNaN(pc)) pc = 0
        if(pc > 100) pc = 100
        this.state.percent = pc
      }
      get percent(){
        return this.state.percent || 0
      }

      set show(shown){
        this.state.show = shown ? true : false
      }
      get show(){
        return this.state.show || false
      }

      set status(status){
        this.state.status = status
      }
      get status(){
        return this.state.status || ''
      }

      get observedAttributes() {
        return ['percent', 'show', 'status'];
      }
      attributeChangedCallback(name, oldValue, newValue){
        if(name == 'percent'){
          this.percent = newValue
        }else if(name == 'show'){
          this.state.show = this.hasAttribute(name) && newValue != 'false'
        }else if(name == 'status'){
          this.state.status = newValue
        }
      }
  }
  customElements.define('tts-loader', TtsLoader)
  