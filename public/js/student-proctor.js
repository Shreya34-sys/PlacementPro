// const proctorToken=localStorage.getItem('token'),proctorAttempt=new URLSearchParams(location.search).get('attempt'),proctorVideo=document.querySelector('#camera'),proctorSocket=io({auth:{token:proctorToken}});let proctorStream,proctorPeer,lastProctorFlag=0;
// async function proctorFlag(eventType,message,severity){if(Date.now()-lastProctorFlag<8000)return;lastProctorFlag=Date.now();await fetch(`/api/exams/attempts/${proctorAttempt}/flags`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${proctorToken}`},body:JSON.stringify({eventType,message,severity})});}
// ['copy','cut','paste','contextmenu','dragstart','selectstart'].forEach(type=>document.addEventListener(type,event=>{event.preventDefault();proctorFlag('clipboard',`${type} attempted.`,'medium');}));document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&['c','x','v','u','s','p'].includes(event.key.toLowerCase())){event.preventDefault();proctorFlag('clipboard','Restricted shortcut attempted.','medium');}});document.addEventListener('visibilitychange',()=>{if(document.hidden)proctorFlag('tab_switch','Exam tab was hidden.','medium');});
// proctorSocket.on('proctor:request-stream',async()=>{if(!proctorStream)return;proctorPeer?.close();proctorPeer=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});proctorStream.getTracks().forEach(track=>proctorPeer.addTrack(track,proctorStream));proctorPeer.onicecandidate=e=>e.candidate&&proctorSocket.emit('webrtc:ice',{attemptId:proctorAttempt,candidate:e.candidate,target:'admin'});await proctorPeer.setLocalDescription(await proctorPeer.createOffer());proctorSocket.emit('webrtc:offer',{attemptId:proctorAttempt,offer:proctorPeer.localDescription});});proctorSocket.on('webrtc:answer',({answer})=>proctorPeer?.setRemoteDescription(answer));proctorSocket.on('webrtc:ice',({candidate})=>proctorPeer?.addIceCandidate(candidate));
// (async()=>{try{proctorStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});proctorVideo.srcObject=proctorStream;await proctorVideo.play();proctorSocket.emit('join-attempt',proctorAttempt);}catch{alert('Camera and microphone are required.');proctorFlag('camera_off','Camera or microphone permission denied.','high');}})();


// import {FaceDetector,FilesetResolver} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest';
// const token=localStorage.getItem('token'),attemptId=new URLSearchParams(location.search).get('attempt'),video=document.querySelector('#camera'),socket=io({auth:{token}});let stream,peer,last=0;
// async function flag(eventType,message,severity){if(Date.now()-last<8000)return;last=Date.now();const r=await fetch(`/api/exams/attempts/${attemptId}/flags`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({eventType,message,severity})});const data=await r.json();if(data.autoSubmitted)location.assign(`/pages/exam-result.html?attempt=${attemptId}`);}
// async function submitForCameraFailure(){await fetch(`/api/exams/attempts/${attemptId}/submit`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({forced:true})});location.assign(`/pages/exam-result.html?attempt=${attemptId}`);}
// ['copy','cut','paste','contextmenu','selectstart','dragstart'].forEach(t=>document.addEventListener(t,e=>{e.preventDefault();flag('clipboard',`${t} attempted`,'medium');}));document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['c','x','v','u','s','p'].includes(e.key.toLowerCase())){e.preventDefault();flag('clipboard','Restricted shortcut attempted','medium');}});document.addEventListener('visibilitychange',()=>document.hidden&&flag('tab_switch','Exam tab was hidden','medium'));
// async function faceChecks(){const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');const detector=await FaceDetector.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'},runningMode:'VIDEO',minDetectionConfidence:.6});setInterval(()=>{if(video.readyState<2)return;const n=detector.detectForVideo(video,performance.now()).detections.length;if(n===0)flag('no_face','Face is not visible','medium');if(n>1)flag('multiple_faces','Multiple faces detected','high');},1500);}
// socket.on('proctor:request-stream',async()=>{if(!stream)return;peer?.close();peer=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});stream.getTracks().forEach(t=>peer.addTrack(t,stream));peer.onicecandidate=e=>e.candidate&&socket.emit('webrtc:ice',{attemptId,candidate:e.candidate,target:'admin'});await peer.setLocalDescription(await peer.createOffer());socket.emit('webrtc:offer',{attemptId,offer:peer.localDescription});});socket.on('webrtc:answer',({answer})=>peer?.setRemoteDescription(answer));socket.on('webrtc:ice',({candidate})=>peer?.addIceCandidate(candidate));
// try{stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});video.srcObject=stream;await video.play();socket.emit('join-attempt',attemptId);faceChecks();}catch{await flag('camera_off','Camera permission denied','high');await submitForCameraFailure();}



const token = localStorage.getItem('token');
const params = new URLSearchParams(window.location.search);
const attemptId = params.get('attempt');

const cameraVideo = document.getElementById('camera');
const socket = io({ auth: { token } });

let cameraStream = null;
let peerConnection = null;
let lastFlagAt = 0;

async function sendFlag(eventType, message, severity) {
    if (!attemptId || Date.now() - lastFlagAt < 8000) return;

    lastFlagAt = Date.now();

    try {
        await fetch(`/api/exams/attempts/${attemptId}/flags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                eventType,
                message,
                severity
            })
        });
    } catch (error) {
        console.error('Proctoring flag error:', error);
    }
}

async function startStudentCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: true
        });

        cameraVideo.srcObject = cameraStream;
        cameraVideo.muted = true;
        cameraVideo.playsInline = true;

        await cameraVideo.play();

        socket.emit('join-attempt', attemptId);

        console.log('Student camera started.');
    } catch (error) {
        console.error('Camera access failed:', error);

        alert('Camera and microphone access are mandatory for this exam.');

        await sendFlag(
            'camera_off',
            'Camera or microphone permission was denied.',
            'high'
        );
    }
}

/* Optional browser-level copy prevention */
['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart']
    .forEach((eventName) => {
        document.addEventListener(eventName, (event) => {
            event.preventDefault();
            sendFlag('clipboard', `${eventName} action attempted.`, 'medium');
        });
    });

document.addEventListener('keydown', (event) => {
    const restrictedKeys = ['c', 'x', 'v', 'u', 's', 'p'];

    if (
        (event.ctrlKey || event.metaKey) &&
        restrictedKeys.includes(event.key.toLowerCase())
    ) {
        event.preventDefault();
        sendFlag('clipboard', 'Restricted keyboard shortcut attempted.', 'medium');
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        sendFlag('tab_switch', 'Student left or hid the exam tab.', 'medium');
    }
});

/* Admin requests this student's live WebRTC camera stream */
socket.on('proctor:request-stream', async () => {
    if (!cameraStream) return;

    peerConnection?.close();

    peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    });

    cameraStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, cameraStream);
    });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('webrtc:ice', {
                attemptId,
                candidate: event.candidate,
                target: 'admin'
            });
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('webrtc:offer', {
        attemptId,
        offer: peerConnection.localDescription
    });
});

socket.on('webrtc:answer', async ({ answer }) => {
    if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
    }
});

socket.on('webrtc:ice', async ({ candidate }) => {
    if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(candidate);
    }
});

startStudentCamera();