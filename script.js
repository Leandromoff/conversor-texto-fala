// Variáveis globais
let synth = window.speechSynthesis;
let utterance = null;
let isProcessing = false;
let isSpeaking = false;
let audioContext = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let audioStream = null;

// Elementos do DOM
document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const languageSelect = document.getElementById('language-select');
    const speedControl = document.getElementById('speed-control');
    const speedValue = document.getElementById('speed-value');
    const playBtn = document.getElementById('play-btn');
    const downloadBtn = document.getElementById('download-btn');
    const statusMessage = document.getElementById('status-message');
    const wordCount = document.getElementById('word-count');
    const charCount = document.getElementById('char-count');

    // Inicialização
    checkBrowserSupport();
    
    // Garantir que as vozes sejam carregadas corretamente
    // Isso é crucial para navegadores como Chrome e Edge
    setTimeout(() => {
        loadVoices();
    }, 1000);
    
    // Event listeners
    textInput.addEventListener('input', updateTextStats);
    speedControl.addEventListener('input', updateSpeedValue);
    playBtn.addEventListener('click', handlePlayStop);
    downloadBtn.addEventListener('click', handleDownload);

    // Funções
    function checkBrowserSupport() {
        if (!('speechSynthesis' in window)) {
            statusMessage.textContent = 'Seu navegador não suporta a API de síntese de fala.';
            playBtn.disabled = true;
            downloadBtn.disabled = true;
        }
    }

    function loadVoices() {
        // Garantir que as vozes estejam carregadas
        let voices = [];
        
        function setVoices() {
            voices = synth.getVoices();
            console.log("Vozes disponíveis:", voices.length);
            
            // Verificar se há vozes disponíveis e atualizar a interface
            if (voices.length === 0) {
                statusMessage.textContent = 'Nenhuma voz disponível no seu navegador. A reprodução pode não funcionar.';
            } else {
                // Listar as vozes disponíveis no console para debug
                voices.forEach((voice, index) => {
                    console.log(`Voz ${index}: ${voice.name} (${voice.lang})`);
                });
            }
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
        
        // Parar gravação se estiver em andamento
        if (isRecording) {
            stopRecording();
        }
    }

    // Função para iniciar a reprodução
    function startSpeaking() {
        if (isProcessing) return;
        
        const text = textInput.value.trim();
        if (text === '') {
            statusMessage.textContent = 'Por favor, digite algum texto para converter em fala.';
            return;
        }

        // Verificar se há vozes disponíveis
        const voices = synth.getVoices();
        if (voices.length === 0) {
            statusMessage.textContent = 'Nenhuma voz disponível no seu navegador. Tente em outro navegador como Chrome ou Edge.';
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
        let selectedVoice = null;
        
        // Tentar encontrar uma voz para o idioma selecionado
        for (let voice of voices) {
            if (voice.lang.includes(languageSelect.value.split('-')[0])) {
                selectedVoice = voice;
                break;
            }
        }
        
        // Se não encontrar, usar a primeira voz disponível
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
            
            // Parar gravação se estiver em andamento
            if (isRecording) {
                stopRecording();
            }
        };

        utterance.onerror = (event) => {
            playBtn.textContent = 'Reproduzir';
            statusMessage.textContent = `Erro: ${event.error}`;
            console.error("Erro na síntese de voz:", event);
            isProcessing = false;
            isSpeaking = false;
            
            // Parar gravação se estiver em andamento
            if (isRecording) {
                stopRecording();
            }
        };

        // Reproduzir
        try {
            synth.speak(utterance);
            
            // Verificar se a síntese começou
            setTimeout(() => {
                if (!synth.speaking && isSpeaking) {
                    statusMessage.textContent = 'Falha na síntese de voz. Tente em outro navegador como Chrome ou Edge.';
                    playBtn.textContent = 'Reproduzir';
                    isProcessing = false;
                    isSpeaking = false;
                }
            }, 1000);
        } catch (error) {
            console.error("Exceção ao iniciar síntese:", error);
            statusMessage.textContent = `Erro ao iniciar síntese: ${error.message}`;
            playBtn.textContent = 'Reproduzir';
            isProcessing = false;
            isSpeaking = false;
        }
    }
    
    // Função para lidar com o download
    function handleDownload() {
        const text = textInput.value.trim();
        if (text === '') {
            statusMessage.textContent = 'Por favor, digite algum texto para converter em fala.';
            return;
        }
        
        // Verificar se o MediaRecorder é suportado
        if (window.MediaRecorder) {
            try {
                // Tentar iniciar a gravação
                startRecording().then(() => {
                    // Após iniciar a gravação, iniciar a reprodução
                    if (!isSpeaking) {
                        startSpeaking();
                    }
                    statusMessage.textContent = 'Gravando áudio para download...';
                }).catch(error => {
                    console.error('Erro ao iniciar gravação:', error);
                    statusMessage.textContent = 'Não foi possível acessar o microfone. Usando método alternativo.';
                    
                    // Fallback para serviços externos
                    useExternalService(text);
                });
            } catch (error) {
                console.error('Erro ao configurar gravação:', error);
                statusMessage.textContent = 'Erro ao configurar gravação. Usando método alternativo.';
                
                // Fallback para serviços externos
                useExternalService(text);
            }
        } else {
            // Fallback para serviços externos se MediaRecorder não for suportado
            statusMessage.textContent = 'Seu navegador não suporta gravação de áudio. Usando método alternativo.';
            useExternalService(text);
        }
    }
    
    // Função para usar serviços externos (fallback)
    function useExternalService(text) {
        // Determinar qual serviço usar com base no idioma
        const lang = languageSelect.value;
        let serviceUrl = '';
        
        if (lang === 'pt-BR') {
            serviceUrl = 'https://ttsmp3.com/text-to-speech/Portuguese/';
        } else {
            serviceUrl = 'https://ttsmp3.com/text-to-speech/American%20English/';
        }
        
        // Copiar o texto para a área de transferência
        navigator.clipboard.writeText(text).then(() => {
            // Abrir o serviço em uma nova aba
            window.open(serviceUrl, '_blank');
            
            statusMessage.textContent = 'Texto copiado para a área de transferência. Aberto serviço externo para conversão.';
        }).catch(err => {
            console.error('Erro ao copiar texto:', err);
            
            // Se não conseguir copiar, apenas abrir o serviço
            window.open(serviceUrl, '_blank');
            
            statusMessage.textContent = 'Aberto serviço externo para conversão. Cole seu texto lá para gerar o áudio.';
        });
    }
    
    // Função para iniciar a gravação de áudio
    async function startRecording() {
        try {
            // Limpar chunks anteriores
            audioChunks = [];
            
            // Criar contexto de áudio se não existir
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Configurar stream de áudio do sistema
            audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Criar MediaRecorder
            mediaRecorder = new MediaRecorder(audioStream);
            
            // Configurar eventos
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                // Criar blob com os chunks de áudio
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                
                // Criar URL para download
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Criar link de download
                const downloadLink = document.createElement('a');
                downloadLink.href = audioUrl;
                
                // Gerar nome de arquivo baseado no idioma
                const lang = languageSelect.value;
                const langPrefix = lang === 'pt-BR' ? 'pt' : 'en';
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                downloadLink.download = `audio-${langPrefix}-${timestamp}.wav`;
                
                // Adicionar à página e clicar automaticamente
                document.body.appendChild(downloadLink);
                downloadLink.click();
                
                // Limpar
                document.body.removeChild(downloadLink);
                window.URL.revokeObjectURL(audioUrl);
                
                // Parar todas as faixas do stream
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                    audioStream = null;
                }
                
                statusMessage.textContent = 'Download de áudio concluído!';
                isRecording = false;
            };
            
            // Iniciar gravação
            mediaRecorder.start();
            isRecording = true;
            
        } catch (error) {
            console.error('Erro ao configurar gravação:', error);
            
            // Limpar recursos
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
            }
            
            isRecording = false;
            throw error;
        }
    }
    
    // Função para parar a gravação
    function stopRecording() {
        if (mediaRecorder && isRecording && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            statusMessage.textContent = 'Processando download de áudio...';
        }
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
