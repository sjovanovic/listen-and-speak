

export function createSpeechRecognition(opts={}){
    opts = {
        onSpeech:function(text){ console.log(text) },
        onSpeaking:function(text){  },
        onStart:function(){  },
        onEnd:function(){  },
        lang: "en-US",
        ...opts
    }

    // Create a new SpeechRecognition object
    const recognition = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        window.mozSpeechRecognition ||
        window.msSpeechRecognition)();

    // Set the language of the recognition
    recognition.lang = opts.lang;

    //recognition.continuous = true;
    recognition.interimResults = true;

    // Event listeners for the recognition
    recognition.onresult = (event) => {
        let {isFinal} = event.results[0]
        const transcript = event.results[0][0].transcript;
        if(isFinal){
            opts.onSpeech(transcript)
        }else{
            opts.onSpeaking(transcript)
        }
    };

    // Event listeners for the start and end of the recognition
    recognition.onstart = () => {
        opts.onStart()
    }
    recognition.onend = () => {
        opts.onEnd()
    }

    return {
        start: () => {
            try{
                recognition.start()
            }catch(err){}
        },
        stop: () => {
            try{
                recognition.stop()
            }catch(err){}
        }
    }
}