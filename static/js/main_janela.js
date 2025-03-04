console.log('In main.js!');

var mapPeers = {};

var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');

var username;

var webSocket;

function sendSignal(action, message) {
    console.log('Sending signal:', { 
        peer: username, 
        action: action, 
        message: message 
    });
    const jsonStr = JSON.stringify({ 
        peer: username, 
        action: action, 
        message: message 
    });
    webSocket.send(jsonStr);
}

// Função para lidar com mensagens WebSocket
function webSocketOnMessage(event) {
    console.log('Received WebSocket message:', event.data);
    var parseData = JSON.parse(event.data);
    
    // More detailed logging
    console.log('Parsed data:', {
        peerUsername: parseData['peer'],
        action: parseData['action'],
        message: parseData['message']
    });

    var peerUsername = parseData['peer'];
    var action = parseData['action'];

    if (username == peerUsername) {
        return;
    }

    var receiver_channel_name = parseData['message']['receiver_channel_name'];

    if (action == 'new-peer') {
        createOfferer(peerUsername, receiver_channel_name);
        return;
    }

    if (action == 'new-offer') {
        var offer = parseData['message']['sdp'];
        createAnswerer(offer, peerUsername, receiver_channel_name);
        return;
    }

    if (action == 'new-answer') {
        var answer = parseData['message']['sdp'];
        var peer = mapPeers[peerUsername][0];
        peer.setRemoteDescription(answer);
        return;
    }
}

// Botão de entrada no WebSocket
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

    webSocket.addEventListener('open', () => {
        console.log('Conexão aberta!');
        sendSignal('new-peer', {});
    });

    webSocket.addEventListener('message', webSocketOnMessage);
    webSocket.addEventListener('close', () => console.log('Conexão fechada!'));
    webSocket.addEventListener('error', () => console.log('Erro ocorrido!'));
});

// Configuração de compartilhamento de tela
var localStream = new MediaStream();

const localVideo = document.querySelector('#local-video');
const btnShareScreen = document.querySelector('#btn-share-screen');

// btnShareScreen.addEventListener('click', () => {
//     navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
//         .then(stream => {
//             localStream = stream;
//             localVideo.srcObject = localStream;
//             localVideo.muted = true;

//             // Substituir as trilhas nos peers já conectados
//             for (const [peerUsername, [peer, _]] of Object.entries(mapPeers)) {
//                 const sender = peer.getSenders().find(s => s.track.kind === 'video');
//                 if (sender) sender.replaceTrack(stream.getVideoTracks()[0]);
//             }

//             // Manter controle sobre a troca de tela
//             stream.getVideoTracks()[0].addEventListener('ended', () => {
//                 console.log('Compartilhamento de tela encerrado.');
//                 // Volte para a câmera ou deixe um placeholder aqui.
//             });
//         })
//         .catch(error => console.error('Erro ao compartilhar tela:', error));
// });
btnShareScreen.addEventListener('click', () => {
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = localStream;
            localVideo.muted = true;

            // Log the track being shared
            console.log('Sharing screen track:', stream.getVideoTracks()[0]);

            for (const [peerUsername, [peer, _]] of Object.entries(mapPeers)) {
                const sender = peer.getSenders().find(s => s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(stream.getVideoTracks()[0]);
                    console.log('Track replaced for peer:', peerUsername);
                }
            }
        })
});


// Chat e envio de mensagens
var btnSendMsg = document.querySelector('#btn-send-msg');
var messageList = document.querySelector('#message-list');
var messageInput = document.querySelector('#msg');

btnSendMsg.addEventListener('click', () => {
    var message = messageInput.value;
    var li = document.createElement('li');
    li.appendChild(document.createTextNode('Eu: ' + message));
    messageList.appendChild(li);

    var dataChannels = getDataChannels();
    message = username + ': ' + message;

    dataChannels.forEach(dc => {
        if (dc.readyState === 'open') {
            dc.send(message);
        } else {
            console.log('Data channel not open:', dc);
        }
    });
    messageInput.value = '';
});

function sendSignal(action, message) {
    const jsonStr = JSON.stringify({ peer: username, action: action, message: message });
    webSocket.send(jsonStr);
}

// Funções de WebRTC para oferta e resposta
function createOfferer(peerUsername, receiver_channel_name) {
    var peer = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    });

    var dc = peer.createDataChannel('channel', {
        negotiated: true,
        id: 0
    });
    
    dc.onopen = () => {
        console.log('Data channel opened for offerer');
        dc.send(`Hello from ${username}`);
    };
    dc.onmessage = dcOnMessage;

    addLocalTracks(peer);

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener('iceconnectionstatechange', () => {
        console.log(`ICE connection state for ${peerUsername}:`, peer.iceConnectionState);
        handleICEState(peer, peerUsername, remoteVideo);
    });

    peer.addEventListener('icecandidate', event => {
        console.log('ICE candidate for offerer:', event.candidate);
        handleICECandidate(peer, 'new-offer', receiver_channel_name, event);
    });

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => {
            console.log('Offerer local description set');
            sendSignal('new-offer', { 
                sdp: peer.localDescription, 
                receiver_channel_name: receiver_channel_name 
            });
        })
        .catch(error => console.error('Offer creation error:', error));
}

function createAnswerer(offer, peerUsername, receiver_channel_name) {
    var peer = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    });

    addLocalTracks(peer);

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    peer.addEventListener('datachannel', e => {
        var dc = e.channel;
        dc.onopen = () => {
            console.log('Data channel opened for answerer');
            dc.send(`Hello from ${username}`);
        };
        dc.onmessage = dcOnMessage;
        mapPeers[peerUsername] = [peer, dc];
    });

    peer.addEventListener('iceconnectionstatechange', () => {
        console.log(`ICE connection state for ${peerUsername}:`, peer.iceConnectionState);
        handleICEState(peer, peerUsername, remoteVideo);
    });

    peer.addEventListener('icecandidate', event => {
        console.log('ICE candidate for answerer:', event.candidate);
        handleICECandidate(peer, 'new-answer', receiver_channel_name, event);
    });

    peer.setRemoteDescription(offer)
        .then(() => peer.createAnswer())
        .then(a => peer.setLocalDescription(a))
        .then(() => {
            console.log('Answerer local description set');
            sendSignal('new-answer', { 
                sdp: peer.localDescription, 
                receiver_channel_name: receiver_channel_name 
            });
        })
        .catch(error => console.error('Answer creation error:', error));
}


function handleICECandidate(peer, action, receiver_channel_name, event) {
    if (!event.candidate) {
        sendSignal(action, { sdp: peer.localDescription, receiver_channel_name });
    }
}

function handleICEState(peer, peerUsername, remoteVideo) {
    var iceConnectionState = peer.iceConnectionState;

    if (['failed', 'disconnected', 'closed'].includes(iceConnectionState)) {
        delete mapPeers[peerUsername];
        if (iceConnectionState !== 'closed') peer.close();
        removeVideo(remoteVideo);
    }
}

// Funções auxiliares
function addLocalTracks(peer) {
    localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
}

function dcOnMessage(event) {
    var message = event.data;
    var li = document.createElement('li');
    li.appendChild(document.createTextNode(message));
    messageList.appendChild(li);
}

function createVideo(peerUsername) {
    var videoContainer = document.querySelector('#video-container');
    var videoWrapper = document.createElement('div');
    var remoteVideo = document.createElement('video');

    remoteVideo.id = peerUsername + '-video';
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;

    videoWrapper.appendChild(remoteVideo);
    videoContainer.appendChild(videoWrapper);

    return remoteVideo;
}

function setOnTrack(peer, remoteVideo) {
    var remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;

    peer.addEventListener('track', async (event) => {
        console.log('Received remote track:', event.track.kind);
        remoteStream.addTrack(event.track);
    });
}

function removeVideo(video) {
    var videoWrapper = video.parentNode;
    videoWrapper.parentNode.removeChild(videoWrapper);
}

function getDataChannels() {
    return Object.values(mapPeers).map(([_, dc]) => dc);
}

peer.addEventListener('connectionstatechange', () => {
    console.log('Connection state:', peer.connectionState);
});
