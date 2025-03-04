console.log('In main.js!');

var mapPeers = {};
var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');
var username;
var webSocket;
var localStream = new MediaStream();
const localVideo = document.querySelector('#local-video');
const btnShareScreen = document.querySelector('#btn-share-screen');
const btnSendMsg = document.querySelector('#btn-send-msg');
const messageList = document.querySelector('#message-list');
const messageInput = document.querySelector('#msg');

// Função para lidar com mensagens WebSocket
function webSocketOnMessage(event) {
    var parseData = JSON.parse(event.data);
    var peerUsername = parseData['peer'];
    var action = parseData['action'];

    if (username == peerUsername) return;

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

btnJoin.addEventListener('click', () => {
    username = usernameInput.value;

    if (username == '') return;

    usernameInput.value = '';
    usernameInput.disabled = true;
    usernameInput.style.visibility = 'hidden';

    btnJoin.disabled = true;
    btnJoin.style.visibility = 'hidden';

    var labelUsername = document.querySelector('#label-username');
    labelUsername.innerHTML = username;

    var loc = window.location;
    var wsStart = loc.protocol == 'https:' ? 'wss://' : 'ws://';
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

btnShareScreen.addEventListener('click', () => {
    navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
    })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = localStream;
            localVideo.muted = true;

            // Substituir trilhas nos peers conectados
            for (const [peerUsername, [peer, _]] of Object.entries(mapPeers)) {
                const videoSender = peer.getSenders().find(s => s.track.kind === 'video');
                if (videoSender) videoSender.replaceTrack(stream.getVideoTracks()[0]);

                const audioSender = peer.getSenders().find(s => s.track.kind === 'audio');
                if (audioSender) audioSender.replaceTrack(stream.getAudioTracks()[0]);
            }

            stream.getVideoTracks()[0].addEventListener('ended', () => {
                console.log('Compartilhamento de tela encerrado.');
            });
        })
        .catch(error => console.error('Erro ao compartilhar tela:', error));
});

// Chat e envio de mensagens
btnSendMsg.addEventListener('click', () => {
    var message = messageInput.value;
    var li = document.createElement('li');
    li.appendChild(document.createTextNode('Eu: ' + message));
    messageList.appendChild(li);

    var dataChannels = getDataChannels();
    message = username + ': ' + message;

    dataChannels.forEach(dc => dc.send(message));
    messageInput.value = '';
});

function sendSignal(action, message) {
    const jsonStr = JSON.stringify({ peer: username, action: action, message: message });
    webSocket.send(jsonStr);
}

// Funções de WebRTC para oferta e resposta
function createOfferer(peerUsername, receiver_channel_name) {
    var peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    addLocalTracks(peer);

    var dc = peer.createDataChannel('channel');
    dc.addEventListener('message', dcOnMessage);

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener('iceconnectionstatechange', () => handleICEState(peer, peerUsername, remoteVideo));
    peer.addEventListener('icecandidate', event => handleICECandidate(peer, 'new-offer', receiver_channel_name, event));

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => console.log('Descrição local definida com sucesso.'));
}

function createAnswerer(offer, peerUsername, receiver_channel_name) {
    var peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    addLocalTracks(peer);

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    peer.addEventListener('datachannel', e => {
        var dc = e.channel;
        dc.addEventListener('message', dcOnMessage);
        mapPeers[peerUsername] = [peer, dc];
    });

    peer.addEventListener('iceconnectionstatechange', () => handleICEState(peer, peerUsername, remoteVideo));
    peer.addEventListener('icecandidate', event => handleICECandidate(peer, 'new-answer', receiver_channel_name, event));

    peer.setRemoteDescription(offer)
        .then(() => peer.createAnswer())
        .then(a => peer.setLocalDescription(a))
        .then(() => console.log('Resposta criada e descrição local definida.'));
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

    peer.addEventListener('track', event => remoteStream.addTrack(event.track));
}

function removeVideo(video) {
    var videoWrapper = video.parentNode;
    videoWrapper.parentNode.removeChild(videoWrapper);
}

function getDataChannels() {
    return Object.values(mapPeers).map(([_, dc]) => dc);
}
