
console.log('In main.js!');

var mapPeers = {};

var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');
var btnShareScreen = document.querySelector('#btn-share-screen');  // Botão para compartilhar a tela
var btnSendMsg = document.querySelector('#btn-send-msg');
var messageList = document.querySelector('#message-list');
var messageInput = document.querySelector('#msg');

var username;
var webSocket;

btnSendMsg.addEventListener('click', sendMsgOnClick);

var isScreenSharing = false;
var originalStream = null;  // Guarda o stream original da câmera



function stopScreenSharing() {
    /* Restaura o fluxo original da câmera
    localStream.getTracks().forEach(track => track.stop());
    localStream = originalStream;
    localVideo.srcObject = localStream;

    // Atualiza as conexões para voltar para a câmera
    for (let peerUsername in mapPeers) {
        let peer = mapPeers[peerUsername][0];
        replaceStreamTracks(peer, localStream);
    }
    */
    // Interrompe o compartilhamento de tela, mas não restaura a câmera
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }


    isScreenSharing = false;
    btnShareScreen.textContent = "Compartilhar Tela";
}




function sendMsgOnClick() {
    var message = messageInput.value;
    if (message.trim() === '') return;

    var li = document.createElement('li');
    li.textContent = 'Eu: ' + message;
    messageList.appendChild(li);

    message = username + ': ' + message;
    var dataChannels = getDataChannels();

    dataChannels.forEach(dc => {
        if (dc.readyState === 'open') {
            dc.send(message);
        }
    });

    messageInput.value = '';
}

function dcOnMessage(event) {
    var message = event.data;
    var li = document.createElement('li');
    li.textContent = message;
    messageList.appendChild(li);
}


function webSocketOnMessage(event) {
    var parsedData = JSON.parse(event.data);
    var peerUsername = parsedData['peer'];
    var action = parsedData['action'];

    if (username == peerUsername) {
        return;
    }

    var receiver_channel_name = parsedData['message']['receiver_channel_name'];

    if (action == 'new-peer') {
        if (isScreenSharing) {
            sendSignal('share-screen', {
                'sdp': localStream,
                'receiver_channel_name': receiver_channel_name
            });
        }
        createOfferer(peerUsername, receiver_channel_name);
        return;
    }

    if (action == 'new-offer') {
        var offer = parsedData['message']['sdp'];
        createAnswer(offer, peerUsername, receiver_channel_name);
        return;
    }

    if (action == 'new-answer') {
        var answer = parsedData['message']['sdp'];
        var peer = mapPeers[peerUsername][0];
        peer.setRemoteDescription(answer);
        return;
    }

    if (action == 'share-screen') {
        var screenStream = parsedData['message']['sdp'];
        // Lógica para definir o fluxo para o novo par
        var peer = mapPeers[peerUsername][0];
        replaceStreamTracks(peer, screenStream);
    }
}

btnJoin.addEventListener('click', () => {
    username = usernameInput.value;
    if (username == '') {
        return;
    }

    usernameInput.value = '';
    usernameInput.disabled = true;
    usernameInput.style.visibility = 'hidden';

    btnJoin.disabled = true;
    btnJoin.style.visibility = 'hidden';

    var labelUsername = document.querySelector('#label-username');
    labelUsername.innerHTML = username;

    var loc = window.location;
    var wsStart = 'ws://';
    if (loc.protocol == 'https:') {
        wsStart = 'wss://';
    }

    var endPoint = wsStart + loc.host + loc.pathname;
    webSocket = new WebSocket(endPoint);

    webSocket.addEventListener('open', (e) => {
        console.log('Connection Opened!');
        sendSignal('new-peer', {});
    });

    webSocket.addEventListener('message', webSocketOnMessage);
    webSocket.addEventListener('close', (e) => {
        console.log('Connection Closed!');
    });

    webSocket.addEventListener('error', (e) => {
        console.log('Error Occurred!');
    });
});

var localStream = new MediaStream();
const localVideo = document.querySelector('#local-video');

/*
btnShareScreen.addEventListener('click', () => {
    navigator.mediaDevices.getDisplayMedia({ video: {width: { max: 1920 }, 
        height: { max: 1080 }}
         , 
         audio: true
         })
        .then(stream => {
            localStream = stream;  // Define o fluxo local para a tela compartilhada
            localVideo.srcObject = localStream;

            // Atualiza as conexões para compartilhar a tela em vez da câmera
            for (let peerUsername in mapPeers) {
                let peer = mapPeers[peerUsername][0];
                replaceStreamTracks(peer, localStream);
            }
        })
        .catch(error => {
            console.log('Error accessing screen share.', error);
        });
});

*/

btnShareScreen.addEventListener('click', () => {
    if (isScreenSharing) {
        stopScreenSharing(); // Para de compartilhar a tela
        return;
    }

    navigator.mediaDevices.getDisplayMedia({ 
        video: { width: { max: 1920 }, height: { max: 1080 } },
        audio: true
    })
    .then(stream => {
        isScreenSharing = true;
        localStream = stream; // Define o stream local como a tela compartilhada
        localVideo.srcObject = localStream;

        // Atualiza as conexões WebRTC
        for (let peerUsername in mapPeers) {
            let peer = mapPeers[peerUsername][0];
            replaceStreamTracks(peer, localStream);
        }

        btnShareScreen.textContent = "Parar Compartilhar Tela";

        // Detecta se o usuário para manualmente o compartilhamento
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            stopScreenSharing();
        });
    })
    .catch(error => {
        console.error('Erro ao acessar o compartilhamento de tela:', error);
        alert('Erro ao acessar o compartilhamento de tela.');
    });
});



/*
btnShareScreen.addEventListener('click', () => {
    // Abre uma nova janela para o compartilhamento de tela
    let screenShareWindow = window.open('about:blank', '_blank', 'width=800,height=600');
    
    // Se necessário, você pode personalizar o conteúdo da nova janela.
    // Exemplo: Define o conteúdo da nova janela para o compartilhamento de tela.
    screenShareWindow.document.write(`
        <h1>Compartilhamento de Tela</h1>
        <button id="start-share">Iniciar Compartilhamento</button>
        <button id="stop-share">Parar Compartilhamento</button>
        <video id="screen-video" autoplay playsinline></video>
        <script>
            let screenStream;
            document.querySelector('#start-share').addEventListener('click', async () => {
                try {
                    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                    document.querySelector('#screen-video').srcObject = screenStream;
                } catch (error) {
                    console.log('Erro ao iniciar o compartilhamento de tela:', error);
                }
            });
            document.querySelector('#stop-share').addEventListener('click', () => {
                if (screenStream) {
                    screenStream.getTracks().forEach(track => track.stop());
                }
                window.close(); // Fecha a janela de compartilhamento
            });
        </script>
    );
});
*/

function sendSignal(action, message) {
    var jsonStr = JSON.stringify({
        'peer': username,
        'action': action,
        'message': message,
    });

    webSocket.send(jsonStr);
}

function addLocalTracks(peer) {
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peer.addTrack(track, localStream);
        });
    }
}

/*
function addLocalTracks(peer) {
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });
    return;
}
*/
/*
function replaceStreamTracks(peer, newStream) {
    let senders = peer.getSenders();
    newStream.getTracks().forEach((track, index) => {
        if (senders[index]) {
            senders[index].replaceTrack(track);  // Substitui as faixas da câmera pelas faixas de compartilhamento de tela
        } else {
            peer.addTrack(track, newStream);  // Adiciona nova faixa se ainda não existir
        }
    });
}

*/
function replaceStreamTracks(peer, newStream) {
    let sender = peer.getSenders();
    newStream.getTracks().forEach((track, index) => {
        sender[index].replaceTrack(track);  // Substitui as faixas da câmera pelas faixas de compartilhamento de tela
    });
}

/*
function createOfferer(peerUsername, receiver_channel_name) {
    var peer = new RTCPeerConnection(null);
    addLocalTracks(peer);

    var dc = peer.createDataChannel('channel');
    dc.addEventListener('open', () => console.log('Data channel opened with', peerUsername));
    dc.addEventListener('message', dcOnMessage);

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState;
        if (['failed', 'disconnected', 'closed'].includes(iceConnectionState)) {
            delete mapPeers[peerUsername];
            if (iceConnectionState !== 'closed') {
                peer.close();
            }
            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if (!event.candidate) {
            sendSignal('new-offer', {
                'sdp': peer.localDescription,
                'receiver_channel_name': receiver_channel_name
            });
        }
    });

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => console.log('Local Description set successfully.'));
}
*/

function createOfferer(peerUsername, receiver_channel_name) {
    var peer = new RTCPeerConnection(null);
    addLocalTracks(peer);

    var dc = peer.createDataChannel('channel');
    dc.addEventListener('open', () => console.log('Connection Opened'));
    dc.addEventListener('message', dcOnMessage);

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState;
        if (['failed', 'disconnected', 'closed'].includes(iceConnectionState)) {
            delete mapPeers[peerUsername];
            if (iceConnectionState !== 'closed') {
                peer.close();
            }
            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if (!event.candidate) {
            sendSignal('new-offer', {
                'sdp': peer.localDescription,
                'receiver_channel_name': receiver_channel_name
            });
        }
    });

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => console.log('Local Description set successfully.'));
}
function createAnswer(offer, peerUsername, receiver_channel_name) {
    var peer = new RTCPeerConnection(null);
    addLocalTracks(peer);

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    peer.addEventListener('datachannel', e => {
        var dc = e.channel;
        dc.addEventListener('open', () => console.log('Connection Opened'));
        dc.addEventListener('message', dcOnMessage);
        mapPeers[peerUsername] = [peer, dc];
    });

    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState;
        if (['failed', 'disconnected', 'closed'].includes(iceConnectionState)) {
            delete mapPeers[peerUsername];
            if (iceConnectionState !== 'closed') {
                peer.close();
            }
            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if (!event.candidate) {
            sendSignal('new-answer', {
                'sdp': peer.localDescription,
                'receiver_channel_name': receiver_channel_name
            });
        }
    });

    peer.setRemoteDescription(offer)
        .then(() => peer.createAnswer())
        .then(answer => peer.setLocalDescription(answer))
        .catch(error => console.log('Error setting remote description or creating answer:', error));
}

function dcOnMessage(event) {
    var message = event.data;
    var li = document.createElement('li');
    li.appendChild(document.createTextNode(message));
    messageList.appendChild(li);
}

function createVideo(peerUsername) {
    var videoContainer = document.querySelector('#video-container');
    var remoteVideo = document.createElement('video');
    remoteVideo.id = peerUsername + '-video';
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;

    var videoWrapper = document.createElement('div');
    videoContainer.appendChild(videoWrapper);
    videoWrapper.appendChild(remoteVideo);

    return remoteVideo;
}

function setOnTrack(peer, remoteVideo) {
    var remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;
    peer.addEventListener('track', async (event) => {
        remoteStream.addTrack(event.track, remoteStream);
    });
}

function removeVideo(video) {
    var videoWrapper = video.parentNode;
    videoWrapper.parentNode.removeChild(videoWrapper);
}

function getDataChannels() {
    var dataChannels = [];
    for (let peerUsername in mapPeers) {
        let dataChannel = mapPeers[peerUsername][1];
        dataChannels.push(dataChannel);
    }
    return dataChannels;
}

