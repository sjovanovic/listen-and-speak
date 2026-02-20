
/**
 * Usage: 
 * 
 * <text-ticker></text-ticker>
 * 
 * JS:
 * textTicker.addText('Text')
 * 
 * CSS settings:
 * 
 text-ticker {
    --ticker-height: 60px;
    --ticker-speed: 8s;             Lower is faster 
    font-weight: bold;              Inherited by the ticker text 
    font-size: 1.2rem;              Inherited by the ticker text 
 }
 */
 const template = document.createElement('template');
 template.innerHTML = `
   <style>
     :host {
       display: block;
       width: 100%;
       height: var(--ticker-height, 48px);
       overflow: hidden;
       position: relative;
     }
 
     .ticker-item {
       position: absolute;
       white-space: nowrap;
       height: 100%;
       display: flex;
       align-items: center;
       top: 0;
       left: 100%; 
       will-change: transform;
       transition: transform linear; /* Duration set dynamically in JS */
     }
   </style>
 `;
 
 class ProfessionalTicker extends HTMLElement {
   constructor() {
     super();
     this.attachShadow({ mode: 'open' });
     this.shadowRoot.appendChild(template.content.cloneNode(true));
     
     this.queue = [];
     this.isProcessing = false;
     
     // CONFIGURATION
     this.pixelsPerSecond = 150; // Constant Speed
     this.gap = 80;              // Pixels between messages
   }
 
   addText(text) {
     this.queue.push(text);
     if (!this.isProcessing) {
       this._processQueue();
     }
   }
 
   async _processQueue() {
     if (this.queue.length === 0) {
       this.isProcessing = false;
       return;
     }
 
     this.isProcessing = true;
     const text = this.queue.shift();
     
     // Trigger animation and wait ONLY for the gap to clear
     try{
        await this._animate(text);
     }catch(err) {
        console.error('Animate error', err)
     }
     
     
     // Start next one immediately after gap is clear
     this._processQueue();
   }

   clear(){
    this.shadowRoot.querySelectorAll('.ticker-item').forEach(el => el.remove())
    this.queue = []
   }
 
   _animate(text) {
     return new Promise((resolve) => {
       const item = document.createElement('div');
       item.className = 'ticker-item';
       item.textContent = text;
       this.shadowRoot.appendChild(item);
 
       const containerWidth = this.offsetWidth;
       const itemWidth = item.offsetWidth;
       const totalDistance = containerWidth + itemWidth;
 
       // CALCULATION: Time = Distance / Speed
       const durationSeconds = totalDistance / this.pixelsPerSecond;
       
       // Calculate how long to wait before the NEXT item can start
       // We wait until the back of THIS item has moved 'gap' pixels into the screen
       const timeToClearGap = (itemWidth + this.gap) / this.pixelsPerSecond;
 
       requestAnimationFrame(() => {
         item.style.transitionDuration = `${durationSeconds}s`;
         item.style.transform = `translateX(-${totalDistance}px)`;
       });
 
       // Resolve the promise once the gap is clear so the next message can start
       setTimeout(resolve, timeToClearGap * 1000);
 
       // Clean up DOM after full exit
       item.addEventListener('transitionend', () => item.remove(), { once: true });
     });
   }
 }
 
 customElements.define('text-ticker', ProfessionalTicker);