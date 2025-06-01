// Variáveis globais
let synth = window.speechSynthesis;
let utterance = null;
let isProcessing = false;
let isSpeaking = false;

// Elementos do DOM
document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const languageSelect = document.getElementById('language-select');
    const speedControl = document.getElementById('speed-control');
    const speedValue = document.getElementById('speed-value');
    const playBtn = document.getElementById('play-btn');
    const statusMessage = document.getElementById('status-message');
    const wordCount = document.getElementById('word-count');
    const charCount = document.getElementById('char-count');

    // Inicialização
    checkBrowserSupport();
    loadVoices();
    
    // Event listeners
    textInput.addEventListener('input', updateTextStats);
    speedControl.addEventListener('input', updateSpeedValue);
    playBtn.addEventListener('click', handlePlayStop);

    // Funções
    function checkBrowserSupport() {
        if (!('speechSynthesis' in window)) {
            statusMessage.textContent = 'Seu navegador não suporta a API de síntese de fala.';
            playBtn.disabled = true;
        }
    }

    function loadVoices() {
        // Garantir que as vozes estejam carregadas
        let voices = [];
        
        function setVoices() {
            voices = synth.getVoices();
            console.log("Vozes disponíveis:", voices.length);
        }
        
        setVoices();
        
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = setVoices;
        }
    }

    function updateTextStats() {
        const text = textInput.value;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const chars = text.length;
        
        wordCount.textContent = words;
        charCount.textContent = chars;
    }

    function updateSpeedValue() {
        const speed = speedControl.value;
        speedValue.textContent = `${speed}x`;
    }

    // Função para lidar com o botão de reprodução/parada
    function handlePlayStop() {
        if (isSpeaking) {
            stopSpeaking();
        } else {
            startSpeaking();
        }
    }

    // Função para parar a reprodução
    function stopSpeaking() {
        if (synth.speaking) {
            synth.cancel();
        }
        
        isSpeaking = false;
        isProcessing = false;
        playBtn.textContent = 'Reproduzir';
        statusMessage.textContent = 'Reprodução interrompida.';
    }

    // Função para selecionar as vozes Google prioritárias
    function selectGoogleVoice(voices, languageCode) {
        // Definir as vozes Google prioritárias
        const googleVoices = {
            'pt-BR': 'Google português do Brasil',
            'en-US': 'Google US English'
        };
        
        // Obter a voz prioritária para o idioma selecionado
        const priorityVoice = googleVoices[languageCode];
        
        // 1. Tentar encontrar a voz Google específica para o idioma
        if (priorityVoice) {
            const googleVoice = voices.find(voice => 
                voice.name.includes(priorityVoice)
            );
            
            if (googleVoice) {
                console.log(`Voz Google prioritária selecionada: ${googleVoice.name}`);
                return googleVoice;
            }
        }
        
        // 2. Tentar encontrar qualquer voz Google para o idioma
        const anyGoogleVoice = voices.find(voice => 
            voice.name.includes('Google') && 
            voice.lang.includes(languageCode.split('-')[0])
        );
        
        if (anyGoogleVoice) {
            console.log(`Voz Google alternativa selecionada: ${anyGoogleVoice.name}`);
            return anyGoogleVoice;
        }
        
        // 3. Tentar encontrar uma voz masculina para o idioma
        const maleVoice = voices.find(voice => 
            voice.lang.includes(languageCode.split('-')[0]) && 
            !voice.name.toLowerCase().includes('female') && 
            !voice.name.toLowerCase().includes('feminina')
        );
        
        if (maleVoice) {
            console.log(`Voz masculina selecionada: ${maleVoice.name}`);
            return maleVoice;
        }
        
        // 4. Usar qualquer voz para o idioma
        const anyVoice = voices.find(voice => 
            voice.lang.includes(languageCode.split('-')[0])
        );
        
        if (anyVoice) {
            console.log(`Voz no idioma selecionada: ${anyVoice.name}`);
            return anyVoice;
        }
        
        // 5. Como último recurso, usar a primeira voz disponível
        if (voices.length > 0) {
            console.log(`Primeira voz disponível selecionada: ${voices[0].name}`);
            return voices[0];
        }
        
        // Nenhuma voz encontrada
        console.log('Nenhuma voz disponível');
        return null;
    }

    // Função para iniciar a reprodução
    function startSpeaking() {
        if (isProcessing) return;
        
        const text = textInput.value.trim();
        if (text === '') {
            statusMessage.textContent = 'Por favor, digite algum texto para converter em fala.';
            return;
        }

        isProcessing = true;
        isSpeaking = true;
        statusMessage.textContent = 'Processando...';
        playBtn.textContent = 'Parar';

        // Criar nova utterance
        utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageSelect.value;
        utterance.rate = parseFloat(speedControl.value);
        
        // Selecionar a voz prioritária (Google)
        let voices = synth.getVoices();
        let selectedVoice = selectGoogleVoice(voices, languageSelect.value);
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log("Voz selecionada:", selectedVoice.name);
            statusMessage.textContent = `Processando com voz: ${selectedVoice.name}`;
        }

        // Eventos da utterance
        utterance.onend = () => {
            playBtn.textContent = 'Reproduzir';
            statusMessage.textContent = 'Reprodução concluída.';
            isProcessing = false;
            isSpeaking = false;
        };

        utterance.onerror = (event) => {
            playBtn.textContent = 'Reproduzir';
            statusMessage.textContent = `Erro: ${event.error}`;
            isProcessing = false;
            isSpeaking = false;
        };

        // Reproduzir
        synth.speak(utterance);
    }

    // Verificar periodicamente o estado da síntese de voz
    // Isso ajuda a garantir que o estado da interface esteja sempre correto
    setInterval(() => {
        if (!synth.speaking && isSpeaking) {
            // Se a síntese parou mas o estado ainda indica que está falando
            isSpeaking = false;
            isProcessing = false;
            playBtn.textContent = 'Reproduzir';
        }
    }, 100);

    // Inicialização adicional
    updateTextStats();
    updateSpeedValue();
});
