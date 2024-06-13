// components/VideoCall.js

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import { Box, Button, Grid, IconButton } from "@mui/material";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useRouter } from "next/router";
import { Assignment, Share, SwitchCamera } from "@mui/icons-material";
import Cookies from "js-cookie";

const VideoCall = ({ roomID }) => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [usingRearCamera, setUsingRearCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideoRef = useRef();
  const peersRef = useRef([]);
  const userID = Cookies.get("userID");

  const getVideoConstraints = () => ({
    video: {
      facingMode: usingRearCamera ? "environment" : "user",
    },
    audio: true,
  });

  useEffect(() => {
    socketRef.current = io.connect("https://socket-server-fhra.onrender.com");
    socketRef.current.emit("set_user_id", userID);
    startMediaStream();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      peersRef.current.forEach(({ peer }) => peer.destroy());
    };
  }, [roomID, usingRearCamera]);

  useEffect(() => {
    socketRef.current.emit("media updation", {
      audio: audioEnabled,
      video: videoEnabled,
      id: userID,
    });
  }, [videoEnabled, audioEnabled]);

  const startMediaStream = async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    const newStream = await navigator.mediaDevices.getUserMedia(
      getVideoConstraints()
    );
    setStream(newStream);
    if (userVideoRef.current) {
      userVideoRef.current.srcObject = newStream;
    }

    socketRef.current.emit("join room", { roomID, userID });
    socketRef.current.on("all users", (users) => {
      const peers = [];
      users.forEach((userID) => {
        const peer = createPeer(userID, socketRef.current.id, newStream);
        peersRef.current.push({
          peerID: userID,
          peer,
        });
        peers.push(peer);
      });
      setPeers(peers);
    });

    socketRef.current.on("user joined", (payload) => {
      const peer = addPeer(payload.signal, payload.callerID, newStream);
      peersRef.current.push({
        peerID: payload.callerID,
        peer,
      });
      setPeers((users) => [...users, peer]);
    });

    socketRef.current.on("receiving returned signal", (payload) => {
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      item.peer.signal(payload.signal);
    });
  };

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
      });
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const switchCamera = () => {
    setUsingRearCamera((prev) => !prev);
  };

  const router = useRouter();
  const message = `Cherry Vchat Meeting Link: ${window.location.href}`;

  const handleClick = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        height: "100%",
        position: "relative",
      }}
    >
      <Grid
        sx={{ width: "100%", padding: 1, paddingBottom: 3, overflowY: "auto" }}
        container
        rowSpacing={1}
        columnSpacing={1}
      >
        <Grid item lg={3} md={3} sm={6} xs={4}>
          <Box
            sx={{
              width: { lg: "300px", md: "300px", sm: "300px", xs: "100px" },
              height: {
                lg: "300px",
                md: "300px",
                sm: "300px",
                xs: peers.length > 0 ? "100px" : "100%",
              },
              borderRadius: "10px",
              background: "black",
              paddingY: 1,
            }}
          >
            <video
              muted
              ref={userVideoRef}
              autoPlay
              playsInline
              style={{
                transform: "scaleX(-1)",
                width: "100%",
                borderRadius: "10px",
                height: "100%",
              }}
            />
          </Box>
        </Grid>

        {peers.map((peer, index) => {
          return <Video key={index} peer={peer} />;
        })}
      </Grid>

      <Box
        sx={{
          width: "100%",
          position: "absolute",
          bottom: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconButton
          onClick={toggleAudio}
          sx={{
            color: "white",
            border: "1px solid white",
            marginRight: 1,
            "&:hover": {
              border: "1px solid green",
            },
          }}
        >
          {audioEnabled ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
        <IconButton
          onClick={toggleVideo}
          sx={{
            color: "white",
            border: "1px solid white",
            marginRight: 1,
            "&:hover": {
              border: "1px solid green",
            },
          }}
        >
          {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
        <IconButton
          onClick={switchCamera}
          sx={{
            color: "white",
            border: "1px solid white",
            marginRight: 1,
            "&:hover": {
              border: "1px solid green",
            },
          }}
        >
          <SwitchCamera />
        </IconButton>
        <CopyToClipboard text={window.location.href}>
          <Button
            sx={{
              color: "white",
              border: "1px solid white",
              "&:hover": {
                border: "1px solid green",
              },
            }}
            startIcon={<Assignment />}
          >
            Copy Invite Link
          </Button>
        </CopyToClipboard>
        <Button
          sx={{
            color: "white",
            border: "1px solid white",
            marginLeft: 1,
            "&:hover": {
              border: "1px solid green",
            },
          }}
          startIcon={<Share />}
          onClick={handleClick}
        >
          Share
        </Button>
      </Box>
    </Box>
  );
};

const Video = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <Grid item lg={3} md={3} sm={6} xs={4}>
      <Box
        sx={{
          width: { lg: "300px", md: "300px", sm: "300px", xs: "100px" },
          height: { lg: "300px", md: "300px", sm: "300px", xs: "100px" },
          borderRadius: "10px",
          background: "black",
        }}
      >
        <video
          playsInline
          autoPlay
          ref={ref}
          style={{
            transform: "scaleX(-1)",
            width: "100%",
            borderRadius: "10px",
            height: "100%",
          }}
        />
      </Box>
    </Grid>
  );
};

export default VideoCall;
