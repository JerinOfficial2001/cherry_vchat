import {
  Assignment,
  CallEnd,
  ContentCopy,
  Phone,
  SwitchCamera,
} from "@mui/icons-material";
import { Box, Button, IconButton, TextField } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import VideocamIcon from "@mui/icons-material/Videocam";

function Vcall() {
  const [me, setMe] = useState("");
  const [usingRearCamera, setUsingRearCamera] = useState(false);
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [fullScreen, setfullScreen] = useState(false);
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  const socket = io("https://socket-server-fhra.onrender.com", {
    path: "/vchat",
  });
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: usingRearCamera ? "environment" : "user",
        },
        audio: true,
      })
      .then((stream) => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      });
    const handleSocketEvents = () => {
      // Emit "me" event when connected to get socket id
      socket.on("connect", () => {
        socket.emit("me", socket.id);
      });

      // Event listener for "me" event
      socket.on("me", (id) => {
        console.log("Received 'me' event with ID:", id);
        setMe(id);
      });

      // Event listener for "callUser" event
      socket.on("callUser", (data) => {
        console.log("Received 'callUser' event:", data);
        setReceivingCall(true);
        setCaller(data.from);
        setName(data.name);
        setCallerSignal(data.signal);
      });

      // Disconnect socket when component unmounts
      return () => {
        socket.disconnect();
      };
    };

    if (socket.connected) {
      handleSocketEvents();
    } else {
      socket.on("connect", () => {
        handleSocketEvents();
      });
    }
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setReceivingCall(false);
    setCallAccepted(false);
    setCallEnded(true);
    connectionRef.current.destroy();
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
  const handleFullScreen = () => {
    setfullScreen(!fullScreen);
  };
  const switchCamera = () => {
    setUsingRearCamera((prev) => !prev);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-around",
        width: "100%",
        height: "100vh",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#fff" }}>Cherry Vchat</h1>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {stream && (
          <Box
            onClick={handleFullScreen}
            sx={{
              width: {
                lg: "300px",
                xs: fullScreen ? "300px" : "100px",
              },
            }}
          >
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              style={{
                width: "100%",
                transform: "scaleX(-1)",
                borderRadius: "10px",
              }}
            />
          </Box>
        )}

        {callAccepted && !callEnded ? (
          <Box
            onClick={handleFullScreen}
            sx={{
              width: {
                lg: "300px",
                xs: !fullScreen ? "300px" : "100px",
              },
            }}
          >
            <video
              playsInline
              ref={userVideo}
              autoPlay
              style={{ width: "100%", borderRadius: "10px" }}
            />
          </Box>
        ) : null}
      </Box>
      {!callAccepted && !receivingCall && (
        <Box
          sx={{
            background: "white",
            flexDirection: "column",
            display: "flex",
            padding: 5,
            borderRadius: 10,
          }}
        >
          <TextField
            id="filled-basic"
            label="Name"
            variant="filled"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
          <Box
            sx={{
              color: me ? "slategray" : "red",
              padding: 1,
              borderRadius: "10px",
              background: "#00000029",
              marginBottom: "10px",
            }}
          >
            {me ? me : "Socket server not connected"}
          </Box>
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
            label="ID to call"
            variant="filled"
            value={idToCall}
            onChange={(e) => setIdToCall(e.target.value)}
          />
          <div className="call-button">
            {callAccepted && !callEnded ? (
              <Button variant="contained" color="secondary" onClick={leaveCall}>
                End Call
              </Button>
            ) : (
              <IconButton
                color="primary"
                aria-label="call"
                onClick={() => callUser(idToCall)}
              >
                <Phone fontSize="large" />
              </IconButton>
            )}
          </div>
        </Box>
      )}
      <div>
        {receivingCall && !callAccepted ? (
          <div className="caller">
            <h1>{name} is calling...</h1>
            <Button variant="contained" color="primary" onClick={answerCall}>
              Answer
            </Button>
          </div>
        ) : null}
      </div>
      {callAccepted && (
        <Box
          sx={{
            width: { lg: "80%", md: "80%", sm: "98%", xs: "98%" },
            background: "black",
            borderRadius: "20px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            position: "sticky",
            bottom: 0,
            gap: 3,
          }}
        >
          <IconButton variant="contained" color="primary" onClick={toggleVideo}>
            {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
          <IconButton variant="contained" color="primary" onClick={toggleAudio}>
            {audioEnabled ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
          <IconButton onClick={switchCamera}>
            <SwitchCamera sx={{ color: "white" }} />
          </IconButton>
          <IconButton>
            <CopyToClipboard text={me}>
              <ContentCopy fontSize="small" sx={{ color: "white" }} />
            </CopyToClipboard>
          </IconButton>
          <IconButton variant="contained" color="primary" onClick={leaveCall}>
            <CallEnd sx={{ color: "red" }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

export default Vcall;
