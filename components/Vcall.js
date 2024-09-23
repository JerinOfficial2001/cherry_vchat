import {
  Assignment,
  CallEnd,
  ContentCopy,
  Phone,
  SwitchCamera,
} from "@mui/icons-material";
import { Box, Button, IconButton, Stack, TextField } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import { useRouter } from "next/router";
import PersonSharpIcon from "@mui/icons-material/PersonSharp";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";

function Vcall() {
  const router = useRouter();

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
  const [fullScreen, setFullScreen] = useState(false);
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      path: "/vchat",
    });

    socketRef.current.on("me", (id) => {
      setMe(id);
    });

    socketRef.current.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });

    socketRef.current.on("callAccepted", (signal) => {
      setCallAccepted(true);
      connectionRef.current.signal(signal);
    });

    socketRef.current.on("callEnded", (data) => {
      setReceivingCall(false);
      setCallAccepted(false);
      setCallEnded(true);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    getUserMedia();
  }, [usingRearCamera]);

  useEffect(() => {
    if (router.query.userid) {
      socketRef.current.emit("me", router.query.userid);
    }
  }, [router.query.userid]);

  const getUserMedia = () => {
    const constraints = {
      video: {
        facingMode: usingRearCamera ? "environment" : "user",
      },
      audio: true,
    };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(constraints).then((vdo) => {
        setStream(vdo);
        if (myVideo.current) {
          myVideo.current.srcObject = vdo;
        }
        if (connectionRef.current) {
          const videoTrack = vdo.getVideoTracks()[0];
          const sender = connectionRef.current.peer
            .getSenders()
            .find((s) => s.track.kind === "video");
          sender.replaceTrack(videoTrack);
        }
      });
    } else {
      alert("getUserMedia is not supported on this browser.");
    }
  };

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socketRef.current.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });

    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
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
      socketRef.current.emit("answerCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setReceivingCall(false);
    setCallAccepted(false);
    setCallEnded(true);
    connectionRef.current.destroy();
    if (!callEnded) {
      socketRef.current.emit("callEnded", true);
    }
    // window.location.reload(); // reload the page to reset the state
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
    setFullScreen(!fullScreen);
  };

  const switchCamera = () => {
    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.stop();
    setUsingRearCamera((prev) => !prev);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: {
          xl: "row",
          lg: "row",
          md: "row",
          sm: "column",
          xs: "column",
        },
        alignItems: "center",
        justifyContent: {
          xl: "center",
          lg: "center",
          md: "center",
          sm: "space-around",
          xs: "space-around",
        },
        width: "100%",
        height: "100vh",
        gap: 3,
      }}
    >
      {!callAccepted && (
        <Stack
          sx={{
            position: "fixed",
            right: 30,
            background: "#0000009c",
            gap: 5,
            borderRadius: 20,
            boxShadow: "0 0 1px 1px black",
            zIndex: 1,
          }}
        >
          <IconButton variant="contained" color="primary" onClick={toggleVideo}>
            {videoEnabled ? (
              <VideocamIcon sx={{ color: "white" }} />
            ) : (
              <VideocamOffIcon sx={{ color: "white" }} />
            )}
          </IconButton>
          <IconButton variant="contained" color="primary" onClick={toggleAudio}>
            {audioEnabled ? (
              <MicIcon sx={{ color: "white" }} />
            ) : (
              <MicOffIcon sx={{ color: "white" }} />
            )}
          </IconButton>
          <IconButton onClick={switchCamera}>
            <FlipCameraIosIcon
              sx={{ color: usingRearCamera ? "green" : "white" }}
            />
          </IconButton>
        </Stack>
      )}
      <h1
        style={{
          textAlign: "center",
          color: "#fff",
          position: { lg: "fixed", sm: "relative" },
          top: 10,
          fontSize: "large",
          fontWeight: "bold",
        }}
      >
        Cherry Vchat
      </h1>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {myVideo && (
          <Box
            onClick={handleFullScreen}
            sx={{
              width: {
                lg: "300px",
                xs: fullScreen ? "300px" : "100px",
              },
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!videoEnabled && (
              <PersonSharpIcon
                sx={{
                  height: fullScreen ? 200 : 80,
                  width: fullScreen ? 200 : 80,
                  position: "absolute",
                  zIndex: 1,
                  color: "gray",
                }}
              />
            )}
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
            <FlipCameraIosIcon
              sx={{ color: usingRearCamera ? "green" : "white" }}
            />
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
