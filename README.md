# Conversor de Texto para Fala

Este é um conversor de texto para fala simples e minimalista, que permite:

- Converter texto em fala com reprodução imediata
- Baixar o texto para conversão posterior em serviços externos
- Suporte para português e inglês
- Controle de velocidade da fala

## Funcionalidades

### Reprodução de Áudio
O botão "Reproduzir" utiliza a Web Speech API nativa do navegador para converter o texto em fala e reproduzi-lo imediatamente.

### Download de Texto
O botão "Baixar" salva o texto em um arquivo .txt que pode ser usado em serviços externos de conversão de texto para fala como:
- https://ttsmp3.com/
- https://freetts.com/
- https://www.naturalreaders.com/

## Limitações Técnicas

Por limitações da Web Speech API em navegadores, não é possível fazer o download direto do áudio gerado sem um servidor backend. A solução atual permite baixar o texto para uso em serviços externos que oferecem download de áudio.

## Uso

1. Digite o texto na área de entrada
2. Selecione o idioma (inglês ou português)
3. Ajuste a velocidade de reprodução se desejar
4. Clique em "Reproduzir" para ouvir o texto
5. Clique em "Baixar" para salvar o texto como arquivo .txt

## Compatibilidade

Esta aplicação funciona melhor em navegadores modernos como Chrome, Firefox, Edge e Safari.
