import { useEffect, useRef, useState } from "react";
import { Box, Button, IconButton, TextField } from "@mui/material";
import { Assignment, Phone } from "@mui/icons-material";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import VideocamIcon from "@mui/icons-material/Videocam";

const socket = io.connect("https://socket-server-fhra.onrender.com");

function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [name, setName] = useState("");
  const [roomID, setRoomID] = useState("");
  const [peers, setPeers] = useState([]);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const myVideo = useRef();
  const userVideo = useRef([]);
  const peersRef = useRef([]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      });

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("user joined", (payload) => {
      const peer = addPeer(payload.signal, payload.callerID, stream);
      peersRef.current.push({
        peerID: payload.callerID,
        peer,
      });
      setPeers((users) => [...users, peer]);
    });

    socket.on("receiving returned signal", (payload) => {
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      item.peer.signal(payload.signal);
    });
  }, []);

  const joinRoom = () => {
    socket.emit("join room", roomID);
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
      });
    });

    return peer;
  };

  const callUser = (id) => {
    const peer = createPeer(id, me, stream);
    peersRef.current.push({
      peerID: id,
      peer,
    });
    setPeers((users) => [...users, peer]);
  };

  const leaveCall = () => {
    peers.forEach((peer) => peer.destroy());
    setPeers([]);
  };
  const toggleVideo = () => {
    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setVideoEnabled(videoTrack.enabled);
  };

  const toggleAudio = () => {
    const audioTrack = stream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setAudioEnabled(audioTrack.enabled);
  };
  return (
    <>
      <h1 style={{ textAlign: "center", color: "#fff" }}>Zoomish</h1>
      <div className="container">
        <div className="video-container">
          <div className="video" style={{ position: "relative" }}>
            {stream && (
              <video
                playsInline
                muted
                ref={myVideo}
                autoPlay
                style={{ width: "300px", transform: "scaleX(-1)" }} // Mirror the video
              />
            )}
            <Box sx={{ position: "absolute", bottom: 0 }}>
              <IconButton
                variant="contained"
                color="primary"
                onClick={toggleVideo}
              >
                {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
              <IconButton
                variant="contained"
                color="primary"
                onClick={toggleAudio}
              >
                {audioEnabled ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
            </Box>
          </div>
          {peers.map((peer, index) => (
            <div key={index} className="video">
              <Video key={index} peer={peer} />
            </div>
          ))}
        </div>
        <div className="myId">
          <TextField
            id="filled-basic"
            label="Name"
            variant="filled"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
          <CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Assignment fontSize="large" />}
            >
              Copy ID
            </Button>
          </CopyToClipboard>

          <TextField
            id="filled-basic"
            label="Room ID"
            variant="filled"
            value={roomID}
            onChange={(e) => setRoomID(e.target.value)}
          />
          <div className="call-button">
            <Button variant="contained" color="primary" onClick={joinRoom}>
              Join Room
            </Button>
            <Button variant="contained" color="secondary" onClick={leaveCall}>
              Leave Call
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function Video({ peer }) {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);

  return <video playsInline autoPlay ref={ref} style={{ width: "300px" }} />;
}

export default App;
