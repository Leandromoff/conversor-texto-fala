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
        
        // Selecionar a voz apropriada
        let voices = synth.getVoices();
        let selectedVoice = null;
        
        // Tentar encontrar uma voz masculina para o idioma selecionado
        for (let voice of voices) {
            if (voice.lang.includes(languageSelect.value.split('-')[0]) && 
                !voice.name.toLowerCase().includes('female') && 
                !voice.name.toLowerCase().includes('feminina')) {
                selectedVoice = voice;
                break;
            }
        }
        
        // Se não encontrar uma voz masculina, usar qualquer voz para o idioma
        if (!selectedVoice) {
            for (let voice of voices) {
                if (voice.lang.includes(languageSelect.value.split('-')[0])) {
                    selectedVoice = voice;
                    break;
                }
            }
        }
        
        // Se ainda não encontrar, usar a primeira voz disponível
        if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0];
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log("Voz selecionada:", selectedVoice.name);
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
