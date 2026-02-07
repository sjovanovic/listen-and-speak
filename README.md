# 🎤 Listen and Speak Web Component
A custom web component for local, in-browser voice interaction featuring Voice Activity Detection (VAD), Speech-to-Text (STT), and Text-to-Speech (TTS) using transformers.js. No server required — everything runs locally in the browser.

## ✨ Features
- 🔒 Privacy-First: All processing happens locally in the browser

- ⚡ Real-time Processing: Live audio capture and transcription

- 🤖 Powered by Transformers.js: Leverages WebAssembly and WebGPU for optimal performance

- 🎯 Voice Activity Detection: Automatically detects speech using Silero VAD

- 🗣️ Speech Recognition: Whisper model for accurate transcription

- 🔊 Speech Synthesis: Kokoro model for natural-sounding speech

- 📦 Modular Design: Easy to integrate into any web project

## 🚀 Installation
Via NPM
```bash
npm install listen-and-speak
```
Via CDN
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/listen-and-speak/dist/listen-and-speak.min.js"></script>
```
Manual Installation
```html
<script type="module" src="path/to/listen-and-speak.js"></script>
```
## 🎮 Basic Usage
```html
<listen-and-speak id="voiceUI"></listen-and-speak>


<script type="module">
  const voiceUI = document.querySelector('#voiceUI');
  
  // Start listening for speech
  voiceUI.listen();
  
  // Speak text
  voiceUI.speak('Hello, how can I help you today?');
</script>
```

The web component is invisible, for a basic visual UI there is an alternative component (the usage is the same):
```html
<listen-speak-ui></listen-speak-ui>
```

This demo speaks back whatever speech it detected:
```html
<listen-speak-ui speekback></listen-speak-ui>
```


## 📖 API Reference
### Methods
|Method|Description|Returns|
|---|---|---|
listen()|	Starts VAD and begins recording audio|	Promise&lt;void&gt;
stop()|	Stops recording and VAD|	void
speak(text)|	Converts text to speech|	Promise&lt;void&gt;
stopSpeech()|	Stops ongoing speech synthesis|	void

### Events

|Event |Description|Event Detail|
|---|---|---|
|speech-start|	Fired when speech detection begins|	null|
|speech-end|	Fired when speech detection ends|	null|
|frame|	Fired for each audio frame captured|	{frame: Float32Array}|
|progress|	Fired during model loading|	{type: string, progress: number}|
|transcription|	Fired when speech is transcribed|	{text: string}|
|error|	Fired on errors|	{error: string}|

### Properties
|Property|	Type|	Description|
|---|---|---|
isListening|	boolean|	Read-only. Whether VAD is active
isSpeaking|	boolean|	Read-only. Whether TTS is active
modelsLoaded|	boolean|	Read-only. Whether models are loaded

## 📝 Advanced Example
```javascript
import './listen-and-speak.js';

class VoiceAssistant {
  constructor() {
    this.voiceUI = document.createElement('listen-and-speak');
    document.body.appendChild(this.voiceUI);
    
    this.setupEventListeners();
    this.initialize();
  }
  
  async initialize() {
    // Wait for models to load
    await this.voiceUI.ready;
    console.log('Voice UI ready!');
  }
  
  setupEventListeners() {
    this.voiceUI.addEventListener('speech-start', () => {
      console.log('Speech detected');
      this.showListeningIndicator();
    });
    
    this.voiceUI.addEventListener('speech-end', async () => {
      console.log('Speech ended, processing...');
      this.hideListeningIndicator();
    });
    
    this.voiceUI.addEventListener('transcription', (ev) => {
      const text = ev.detail.text;
      console.log('Transcription:', text);
      this.processCommand(text);
    });
    
    this.voiceUI.addEventListener('progress', (ev) => {
      const { type, progress } = ev.detail;
      console.log(`Loading ${type}: ${progress}%`);
    });
    
    this.voiceUI.addEventListener('error', (ev) => {
      console.error('Voice UI Error:', ev.detail.error);
    });
  }
  
  async startConversation() {
    await this.voiceUI.listen();
    await this.voiceUI.speak('I am ready. How can I help you?');
  }
  
  processCommand(text) {
    // Your command processing logic here
    const response = this.generateResponse(text);
    this.voiceUI.speak(response);
  }
  
  generateResponse(text) {
    // Simple echo for demonstration
    return `You said: ${text}`;
  }
  
  showListeningIndicator() {
    // Visual feedback for listening state
  }
  
  hideListeningIndicator() {
    // Hide visual feedback
  }
}

// Initialize the assistant
const assistant = new VoiceAssistant();
assistant.startConversation();
```

## 🧠 Technical Details
### Models Used
- Voice Activity Detection: Silero VAD

- Speech-to-Text: OpenAI Whisper

- Text-to-Speech: Kokoro

### Performance Characteristics
- Audio Frame Size: 512 samples

- Sample Rate: 16000 Hz (16kHz)

- Model Loading: Cached in browser after first load

- Memory Usage: ~200-400MB for all models

- Initial Load Time: 30-60 seconds (first time only)

## ⚙️ Configuration
You can configure the component via attributes or JavaScript:

```html
<!-- Via attributes -->
<listen-and-speak 
  language="en"
  vad-threshold="0.5"
  auto-start="false"
  debug="true">
</listen-and-speak>

<!-- Via JavaScript -->
<script>
  const voiceUI = document.querySelector('listen-and-speak');
  voiceUI.language = 'en';
  voiceUI.vadThreshold = 0.5;
  voiceUI.autoStart = false;
</script>
```
## 🌐 Browser Compatibility
|Browser|	Support|	Notes|
|---|---|---|
Chrome 90+|	✅ Full|	Best performance
Firefox 88+|	✅ Full|	Good performance
Safari 15+|	⚠️ Partial|	Limited WebGPU support
Edge 90+|	✅ Full|	Based on Chromium

***Requirements:***

- Modern browser with WebAssembly and WebAudio API support

- WebGPU recommended for best performance (optional)

- 2GB+ RAM recommended for smooth operation

## 🚨 Limitations
1. First Load Time: Models are large (100MB+ each) and take time to download and initialize

2. Memory Intensive: Requires substantial RAM for all three models

3. Browser Support: Limited in older browsers and mobile devices

4. Accuracy: On-device models may have slightly lower accuracy than cloud alternatives

5. Languages: Supported languages depend on the underlying models

## 🔧 Development
```bash
# Clone the repository
git clone https://github.com/sjovanovic/listen-and-speak.git

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```
## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository

2. Create your feature branch (git checkout -b feature/AmazingFeature)

3. Commit your changes (git commit -m 'Add some AmazingFeature')

4. Push to the branch (git push origin feature/AmazingFeature)

5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments
- Transformers.js for making ML models accessible in the browser

- Silero VAD team for voice activity detection

- OpenAI Whisper team for speech recognition

- Kokoro team for text-to-speech

---
Note: This is a client-side only solution. For production use, consider implementing fallbacks or hybrid approaches for users with limited device capabilities.