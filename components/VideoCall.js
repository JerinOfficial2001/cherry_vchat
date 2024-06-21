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
import Video from "./VideoComponent";

const VideoCall = ({ roomID, user_id }) => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [usingRearCamera, setUsingRearCamera] = useState(false);
  const [stream, setStream] = useState();
  const userVideoRef = useRef();
  const [peers, setPeers] = useState([]);

  // useEffect(() => {
  //   getUserMedia();
  // }, [usingRearCamera]);

  // useEffect(() => {
  //   if (socketRef.current) {
  //     socketRef.current.emit("media updation", {
  //       audio: audioEnabled,
  //       video: videoEnabled,
  //       id: user_id,
  //     });
  //   }
  // }, [videoEnabled, audioEnabled]);

  const toggleVideo = () => {
    setVideoEnabled((prev) => !prev);
    stream
      .getVideoTracks()
      .forEach((track) => (track.enabled = !track.enabled));
  };

  const toggleAudio = () => {
    setAudioEnabled((prev) => !prev);
    stream
      .getAudioTracks()
      .forEach((track) => (track.enabled = !track.enabled));
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
  const socketRef = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    console.log("Connecting to socket...");
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      query: { userID: user_id, roomID },
      path: "/groupvchat",
    });
    const initializeMedia = async () => {
      try {
        const constraints = {
          video: {
            facingMode: usingRearCamera ? "environment" : "user",
          },
          audio: true,
        };
        const vdo = await navigator.mediaDevices.getUserMedia(constraints);
        if (vdo) {
          setStream(vdo);
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = vdo;
          }
          socketRef.current.emit("join room", { roomID, userID: user_id });
          socketRef.current.on("all-users", (users) => {
            console.log("Received all-users event:", users);
            let peers = [];
            users.forEach((userID) => {
              const idFound = peersRef.current.some((i) => i.peerID == userID);
              console.log({ idFound, userID });
              const peer = createPeer(userID, user_id, vdo);
              peersRef.current.push({
                peerID: userID,
                peer,
              });
              peers.push(peer);
            });
            setPeers(peers);
          });

          socketRef.current.on("user joined", (payload) => {
            console.log("User joined:", payload);

            const peer = addPeer(payload.signal, payload.callerID, vdo);
            const idFound = peersRef.current.some(
              (i) => i.peerID == payload.callerID
            );

            if (peersRef.current.length == 0 || !idFound) {
              peersRef.current.push({
                peerID: payload.callerID,
                peer,
              });
              setPeers((users) => [...users, peer]);
            }
          });

          socketRef.current.on("receiving returned signal", (payload) => {
            console.log("Receiving returned signal:", payload);
            const item = peersRef.current.find((p) => p.peerID === payload.id);
            if (item) item.peer.signal(payload.signal);
          });
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initializeMedia();

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      // if (stream) {
      //   stream.getTracks().forEach((track) => track.stop());
      // }
      // peersRef.current.forEach(({ peer }) => peer.destroy());
    };
  }, []);
  const createPeer = (userToSignal, callerID, myStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: myStream,
    });
    console.log("createPeer", peer);

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
      });
    });

    peer.on("stream", (remoteStream) => {
      console.log("Received remote stream");
      // Handle the remote stream
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, myStream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: myStream,
    });
    console.log("addPeer", peer);

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", {
        signal,
        callerID,
        userID: callerID,
      });
    });

    peer.on("stream", (remoteStream) => {
      console.log("Received remote stream");
      if (userVideoRef.current && remoteStream) {
        userVideoRef.current.srcObject = remoteStream;
      }
    });

    if (incomingSignal) {
      console.log(incomingSignal, "incoming");
      peer.signal(incomingSignal);
    }

    return peer;
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
              ref={userVideoRef}
              muted
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
          return (
            <Grid key={index} item lg={3} md={3} sm={6} xs={4}>
              <Video peer={peer} />
            </Grid>
          );
        })}
      </Grid>

      <Box
        sx={{
          bottom: 0,
          position: "fixed",
          background: "white",
          width: "100%",
          paddingY: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconButton
          sx={{ color: !videoEnabled ? "red" : "black" }}
          variant="contained"
          color="primary"
          onClick={toggleVideo}
        >
          {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
        <IconButton
          sx={{ color: !audioEnabled ? "red" : "black" }}
          variant="contained"
          color="primary"
          onClick={toggleAudio}
        >
          {audioEnabled ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
        <IconButton onClick={handleClick}>
          <Share />
        </IconButton>
        <IconButton onClick={switchCamera}>
          <SwitchCamera />
        </IconButton>
        <CopyToClipboard text={router?.query?.id}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Assignment fontSize="large" />}
          >
            Copy ID
          </Button>
        </CopyToClipboard>
      </Box>
    </Box>
  );
};

export default VideoCall;
