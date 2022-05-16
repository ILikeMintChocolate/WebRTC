const socket = io();

const returnSomething = document.querySelector("#returnSomething");
const myID = document.querySelector("#myID");

returnSomething.addEventListener("click", () => {
    console.log(myPeerConnection);
    console.log("----------------------");
});

const myFace = document.querySelector("#myFace");
const muteBtn = document.querySelector("#mute");

const headTitle = document.getElementById("headTitle");

const call = document.querySelector("#call");
const welcome = document.querySelector("#welcome");

const initialUI = document.querySelector("#initialUI");
const createUI = document.querySelector("#createUI");
const joinUI = document.querySelector("#joinUI");

const createRoom = document.getElementById("create");

const createDiv = document.querySelector("#createUI");

createUI.hidden = true;
joinUI.hidden = true;
const HIDDEN_CN = "hidden";

let myStream;
let muted = true;


let cameraOff = false;

let screenOff = true;


let roomName = "";
let nickname = "";
let peopleInRoom = 1;
let peerC;
let myPeerConnection;

var pcObj = {};

let creator = false;
let creatorStream;


async function getMedia(deviceId) {

    try {
        myStream = await navigator.mediaDevices.getDisplayMedia();
   
        if (creator) {
            myFace.srcObject = myStream;
            myFace.muted = true;
            myID.innerText = myStream.id;
        }

        if (!creator) {
            myStream.getTracks().forEach((track) => track.stop());
        }

    } catch (error) {
        console.log(error);
    }
}


// Screen Sharing

let captureStream = null;

async function startCapture() {
    let localStream;
    try {
        captureStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" },
            audio: true,
        });

        //const screenVideo = document.querySelector("#screen");
        //screenVideo.srcObject = captureStream;
        localStream = captureStream;
        //makeConnection();
        //addLocalStreamToPeerConnection(localStream);
        myFace.srcObject = captureStream;
        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(localStream.getVideoTracks()[0]);

        //pcObj[remoteSocketId].addTrack(myStream);
    } catch (error) {
        console.error(error);
    }
}

function stopCapture(evt) {
    let tracks = myFace.srcObject.getTracks();

    tracks.forEach((track) => track.stop());
    myFace.srcObject = null;
}
////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
const welcomeForm = welcome.querySelector("form");
const createForm = createDiv.querySelector("createForm");

const joinBtn = document.getElementById("join");
const joinRoomBtn = document.getElementById("joinRoomBtn");

async function initCall() {
    welcome.hidden = true;
    call.classList.remove(HIDDEN_CN);
    await getMedia();
}
call.classList.add(HIDDEN_CN);

const createdRoomCode = document.getElementById("roomCode");
const createRoomBtn = document.getElementById("createRoomBtn");

createRoom.addEventListener("click", handleCreateRoomClick);
if (joinBtn) {
    joinBtn.addEventListener("click", handleJoinRoomClick);
}
if (joinRoomBtn) {
    joinRoomBtn.addEventListener("click", handleJoinRoomBtnSubmit);
}
function handleCreateRoomClick() {
    let code = Math.random().toString(36).substr(2, 11);
    createdRoomCode.value = code;
    initialUI.hidden = true;
    createUI.hidden = false;
}

function handleJoinRoomClick() {
    initialUI.hidden = true;
    joinUI.hidden = false;
}

function handleJoinRoomBtnSubmit(event) {
    event.preventDefault();

    if (socket.disconnected) {
        socket.connect();
    }

    const createRoomName = document.getElementById("roomName");

    const createNickname = document.getElementById("nickname");
    const createnicknameContainer = document.querySelector("#userNickname");
    roomName = createRoomName.value;
    createRoomName.value = "";
    nickname = createNickname.value;
    createNickname.value = "";
    headTitle.innerText = "Room ID: " + roomName;
    //createnicknameContainer.innerText = creatorStream.id;
    //console.log(event);
    socket.emit("join_room", roomName, nickname);
}

async function handleCreateRoomSubmit(event) {
    creator = true;

    event.preventDefault();

    if (socket.disconnected) {
        socket.connect();
    }

    const createNickname = document.getElementById("nicknameC");
    const createnicknameContainer = document.querySelector("#userNickname");
    roomName = createdRoomCode.value;
    createdRoomCode.value = "";
    nickname = createNickname.value;
    createNickname.value = "";
    headTitle.innerText = "Room ID: " + roomName;
    createnicknameContainer.innerText = nickname;
    socket.emit("create_room", roomName, nickname);
}

if (createRoomBtn) {
    createRoomBtn.addEventListener("click", handleCreateRoomSubmit);
}

const createBack = document.getElementById("createBack");
const joinBack = document.getElementById("joinBack");

if (createBack) {
    createBack.addEventListener("click", handleCreateBack);
}
if (joinBack) {
    joinBack.addEventListener("click", handleJoinBack);
}

function handleCreateBack() {
    createUI.hidden = true;
    initialUI.hidden = false;
    const createNickname = document.getElementById("nicknameC");
    const createnicknameContainer = document.querySelector("#userNickname");
    createdRoomCode.value = "";
    createNickname.value = "";
    createnicknameContainer.innerText = "";
}

function handleJoinBack() {
    joinUI.hidden = true;
    initialUI.hidden = false;
    const createRoomName = document.getElementById("roomName");
    const createNickname = document.getElementById("nickname");
    createRoomName.value = "";
    createNickname.value = "";
}

// Chat Form

const chatForm = document.querySelector("#chatForm");
const chatBox = document.querySelector("#chatBox");

const MYCHAT_CN = "myChat";
const NOTICE_CN = "noticeChat";

chatForm.addEventListener("submit", handleChatSubmit);

function handleChatSubmit(event) {
    event.preventDefault();
    const chatInput = chatForm.querySelector("input");
    const message = chatInput.value;
    chatInput.value = "";
    socket.emit("chat", `${nickname}: ${message}`, roomName);
    writeChat(`You: ${message}`, MYCHAT_CN);
}

function writeChat(message, className = null) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.innerText = message;
    li.appendChild(span);
    li.classList.add(className);
    chatBox.prepend(li);
}

// Leave Room

const leaveBtn = document.querySelector("#leave");

function leaveRoom() {
    socket.disconnect();

    call.classList.add(HIDDEN_CN);
    welcome.hidden = false;

    peerConnectionObjArr = [];
    peopleInRoom = 1;
    nickname = "";

    myStream.getTracks().forEach((track) => track.stop());
    const nicknameContainer = document.querySelector("#userNickname");
    nicknameContainer.innerText = "";

    myFace.srcObject = null;
    clearAllVideos();
    clearAllChat();
}

function removeVideo(leavedSocketId) {
    const streams = document.querySelector("#streams");
    const streamArr = streams.querySelectorAll("div");
    streamArr.forEach((streamElement) => {
        if (streamElement.id === leavedSocketId) {
            streams.removeChild(streamElement);
        }
    });
}

function clearAllVideos() {
    const streams = document.querySelector("#streams");
    const streamArr = streams.querySelectorAll("div");
    streamArr.forEach((streamElement) => {
        if (streamElement.id != "myStream") {
            streams.removeChild(streamElement);
        }
    });
}

function clearAllChat() {
    const chatArr = chatBox.querySelectorAll("li");
    chatArr.forEach((chat) => chatBox.removeChild(chat));
}

leaveBtn.addEventListener("click", leaveRoom);

// Modal code

const modal = document.querySelector(".modal");
const modalText = modal.querySelector(".modal__text");
const modalBtn = modal.querySelector(".modal__btn");

function paintModal(text) {
    modalText.innerText = text;
    modal.classList.remove(HIDDEN_CN);

    modal.addEventListener("click", removeModal);
    modalBtn.addEventListener("click", removeModal);
    document.addEventListener("keydown", handleKeydown);
}

function removeModal() {
    modal.classList.add(HIDDEN_CN);
    modalText.innerText = "";
}

function handleKeydown(event) {
    if (event.code === "Escape" || event.code === "Enter") {
        removeModal();
    }
}

// Socket code

socket.on("reject_join", () => {
    // Paint modal
    paintModal("The number of people has been exceeded.");

    // Erase names
    const nicknameContainer = document.querySelector("#userNickname");
    nicknameContainer.innerText = "";
    roomName = "";
    nickname = "";
});

socket.on("room_notExists", () => {
    // Paint modal
    paintModal("The room does not exist.");

    // Erase names
    const nicknameContainer = document.querySelector("#userNickname");
    nicknameContainer.innerText = "";
    roomName = "";
    nickname = "";
    headTitle.innerText = "Conference";
});

socket.on("same_RoomName", () => {
    // Paint modal
    paintModal("The room already exists.");

    // Erase names
    const nicknameContainer = document.querySelector("#userNickname");
    nicknameContainer.innerText = "";
    roomName = "";
    nickname = "";
    headTitle.innerText = "Conference";
});

socket.on("no_nickName", () => {
    paintModal("Enter your Nickname!");
    const nicknameContainer = document.querySelector("#userNickname");
    const rCode = document.getElementById("roomCode");
    nicknameContainer.innerText = "";
    rCode.value = roomName;
    nickname = "";
    headTitle.innerText = "Conference";
});

socket.on("accept_join", async (userObjArr) => {
    await initCall();
    console.log(userObjArr);
    const length = userObjArr.length;
    if (length === 1) {
        return;
    }

    writeChat("--------[ ! ]--------", NOTICE_CN);
    for (let i = 0; i < length - 1; ++i) {
        try {
            console.log('1')
            const newPC = createConnection(
                userObjArr[i].socketId,
                userObjArr[i].nickname
            );
            console.log(myPeerConnection);
            console.log("2");
            const offer = await newPC.createOffer();
            console.log("3");
            await newPC.setLocalDescription(offer);
            console.log("4");
            socket.emit("offer", offer, userObjArr[i].socketId, nickname);
            console.log("5");
            writeChat(`' ${userObjArr[i].nickname} '`, NOTICE_CN);
            console.log("6");
        } catch (err) {
            console.error(err);
        }
    }
    writeChat("are participating", NOTICE_CN);
});

socket.on("offer", async (offer, remoteSocketId, remoteNickname) => {
    console.log("offer");
    try {
        const newPC = createConnection(remoteSocketId, remoteNickname);
        await newPC.setRemoteDescription(offer);
        const answer = await newPC.createAnswer();
        await newPC.setLocalDescription(answer);
        socket.emit("answer", answer, remoteSocketId);
        writeChat(` ' ${remoteNickname} ' joined the room`, NOTICE_CN);
    } catch (err) {
        console.error(err);
    }
});

socket.on("answer", async (answer, remoteSocketId) => {
    await pcObj[remoteSocketId].setRemoteDescription(answer);
});

socket.on("ice", async (ice, remoteSocketId) => {
    await pcObj[remoteSocketId].addIceCandidate(ice);
});

socket.on("chat", (message) => {
    writeChat(message);
});

socket.on("leave_room", (leavedSocketId, nickname) => {
    removeVideo(leavedSocketId);
    writeChat(`[!] user [ ${nickname} ] has left.`, NOTICE_CN);
    --peopleInRoom;
    sortStreams();
});

// RTC code

function createConnection(remoteSocketId, remoteNickname) {

    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ],
            },
        ],
    });
        
    myPeerConnection.addEventListener("icecandidate", (event) => {
        handleIce(event, remoteSocketId);
    });

    myPeerConnection.addEventListener("addstream", (event) => {
        handleAddStream(event, remoteSocketId, remoteNickname);
    });

    console.log("myStream--------------");
    console.log(myStream);
    console.log('---------------------');

    console.log("getTracks--------------");
    //console.log(myStream.getTracks());
    console.log("---------------------");

    //if (creator)
        myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
    //else
    //    myPeerConnection.addTrack(null, myStream);


    pcObj[remoteSocketId] = myPeerConnection;

    //console.log(myPeerConnection.getSenders());
    //console.log(myPeerConnection.getReceivers());

    ++peopleInRoom;
    sortStreams();
    return myPeerConnection;
}

function handleIce(event, remoteSocketId) {
    if (event.candidate) {
        socket.emit("ice", event.candidate, remoteSocketId);
    }
}

let onlyOnce = false;

function handleAddStream(event, remoteSocketId, remoteNickname) {
    if (onlyOnce == false) {
        creatorStream = event.stream;
        onlyOnce = true;
    }
        
    if (!creator) 
        myFace.srcObject = creatorStream;
    myFace.muted = true;
}


function sortStreams() {
    const streams = document.querySelector("#streams");
    const streamArr = streams.querySelectorAll("div");
    streamArr.forEach((stream) => (stream.className = `people${peopleInRoom}`));
}

async function addLocalStreamToPeerConnection(localStream) {
    localStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, localStream));
}
