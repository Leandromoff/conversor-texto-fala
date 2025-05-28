// Variáveis globais
let synth = window.speechSynthesis;
let vozAtual = null;
let reproduzindo = false;
let statusElement;
let btnReproduzir;
let btnBaixar;

// Inicialização do meSpeak
document.addEventListener('DOMContentLoaded', function() {
    statusElement = document.getElementById('status');
    btnReproduzir = document.getElementById('btnReproduzir');
    btnBaixar = document.getElementById('btnBaixar');
    
    // Inicializar meSpeak
    statusElement.textContent = "Carregando vozes...";
    
    // Carregar voz em inglês
    meSpeak.loadVoice('lib/voices/en/en-us.json', function(success, message) {
        if (success) {
            console.log("Voz inglês carregada: " + message);
            
            // Carregar voz em português
            meSpeak.loadVoice('lib/voices/pt/pt-pt.json', function(success, message) {
                if (success) {
                    console.log("Voz português carregada: " + message);
                    statusElement.textContent = "Vozes carregadas com sucesso!";
                    
                    // Definir voz padrão
                    meSpeak.setDefaultVoice('en-us');
                    
                    // Habilitar botões
                    btnReproduzir.disabled = false;
                    btnBaixar.disabled = false;
                } else {
                    statusElement.textContent = "Erro ao carregar voz em português.";
                    console.error("Erro ao carregar voz em português:", message);
                }
            });
        } else {
            statusElement.textContent = "Erro ao carregar voz em inglês.";
            console.error("Erro ao carregar voz em inglês:", message);
        }
    });
    
    // Configurar contadores
    const textoArea = document.getElementById('texto');
    textoArea.addEventListener('input', atualizarContadores);
    
    // Configurar controle de velocidade
    const velocidadeInput = document.getElementById('velocidade');
    const valorVelocidade = document.getElementById('valorVelocidade');
    velocidadeInput.addEventListener('input', function() {
        const valor = velocidadeInput.value;
        const normalizado = ((valor - 120) / 80).toFixed(1);
        valorVelocidade.textContent = normalizado + 'x';
    });
    
    // Configurar botões
    btnReproduzir.addEventListener('click', toggleReproducao);
    btnBaixar.addEventListener('click', baixarAudio);
    
    // Configurar seleção de idioma
    document.getElementById('idioma').addEventListener('change', function() {
        const idioma = this.value;
        if (idioma === 'en') {
            meSpeak.setDefaultVoice('en-us');
        } else if (idioma === 'pt') {
            meSpeak.setDefaultVoice('pt-pt');
        }
    });
    
    // Desabilitar botões até que as vozes sejam carregadas
    btnReproduzir.disabled = true;
    btnBaixar.disabled = true;
});

// Função para atualizar contadores de palavras e caracteres
function atualizarContadores() {
    const texto = document.getElementById('texto').value;
    const contadorPalavras = document.getElementById('contadorPalavras');
    const contadorCaracteres = document.getElementById('contadorCaracteres');
    
    // Contar caracteres
    contadorCaracteres.textContent = texto.length;
    
    // Contar palavras
    const palavras = texto.trim().split(/\s+/).filter(palavra => palavra.length > 0);
    contadorPalavras.textContent = palavras.length;
}

// Função para alternar entre reproduzir e parar
function toggleReproducao() {
    const texto = document.getElementById('texto').value.trim();
    
    if (!texto) {
        statusElement.textContent = "Por favor, digite algum texto para reproduzir.";
        return;
    }
    
    if (reproduzindo) {
        // Parar reprodução
        meSpeak.stop();
        btnReproduzir.textContent = "Reproduzir";
        reproduzindo = false;
        statusElement.textContent = "Reprodução interrompida.";
    } else {
        // Iniciar reprodução
        const velocidade = document.getElementById('velocidade').value;
        const idioma = document.getElementById('idioma').value;
        
        statusElement.textContent = "Reproduzindo...";
        btnReproduzir.textContent = "Parar";
        reproduzindo = true;
        
        // Configurar voz baseada no idioma
        const voz = idioma === 'en' ? 'en-us' : 'pt-pt';
        
        // Reproduzir com meSpeak
        meSpeak.speak(texto, { 
            voice: voz,
            speed: parseInt(velocidade),
            pitch: 50,
            amplitude: 100
        }, function(success, id) {
            if (success) {
                console.log("Reprodução concluída, ID:", id);
                btnReproduzir.textContent = "Reproduzir";
                reproduzindo = false;
                statusElement.textContent = "Reprodução concluída.";
            } else {
                console.error("Erro na reprodução, ID:", id);
                btnReproduzir.textContent = "Reproduzir";
                reproduzindo = false;
                statusElement.textContent = "Erro na reprodução.";
            }
        });
    }
}

// Função para baixar o áudio
function baixarAudio() {
    const texto = document.getElementById('texto').value.trim();
    
    if (!texto) {
        statusElement.textContent = "Por favor, digite algum texto para baixar.";
        return;
    }
    
    statusElement.textContent = "Gerando arquivo de áudio...";
    btnBaixar.disabled = true;
    
    const velocidade = document.getElementById('velocidade').value;
    const idioma = document.getElementById('idioma').value;
    const voz = idioma === 'en' ? 'en-us' : 'pt-pt';
    
    // Gerar áudio com meSpeak
    meSpeak.speak(texto, { 
        voice: voz,
        speed: parseInt(velocidade),
        pitch: 50,
        amplitude: 100,
        rawdata: 'data-url'  // Solicitar dados em formato data-url
    }, function(success, id, audioData) {
        if (success && audioData) {
            // Criar link de download
            const link = document.createElement('a');
            link.href = audioData;
            link.download = 'texto-para-fala.wav';
            
            // Adicionar ao documento e clicar
            document.body.appendChild(link);
            link.click();
            
            // Limpar
            document.body.removeChild(link);
            
            statusElement.textContent = "Download iniciado!";
            btnBaixar.disabled = false;
        } else {
            console.error("Erro ao gerar áudio:", id);
            statusElement.textContent = "Erro ao gerar arquivo de áudio.";
            btnBaixar.disabled = false;
        }
    });
}
