// screenShare.js

async function startScreenShare() {
    try {
        // Solicita ao usuário para compartilhar a tela
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always" // Mostra o cursor no compartilhamento
            },
            audio: false // Adicione true se quiser capturar o áudio do sistema
        });

        // Exibe a transmissão da tela em um elemento de vídeo
        const videoElement = document.querySelector('#screen-share-video');
        if (videoElement) {
            videoElement.srcObject = stream;
            videoElement.play();
        }

        // Escuta quando o usuário encerra o compartilhamento
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            console.log("Compartilhamento de tela encerrado.");
        });

    } catch (error) {
        console.error("Erro ao compartilhar a tela:", error);
    }
}

// Adiciona evento ao botão de compartilhamento
document.querySelector('#start-screen-share').addEventListener('click', startScreenShare);
