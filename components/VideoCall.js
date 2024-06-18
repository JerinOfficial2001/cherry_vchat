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
import Websocket from "@/utils/Websocket";

const VideoCall = ({ roomID, user_id }) => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [usingRearCamera, setUsingRearCamera] = useState(false);
  const [stream, setStream] = useState();
  const userVideoRef = useRef();
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    getUserMedia();
  }, [usingRearCamera]);

  // useEffect(() => {
  //   if (socketRef.current) {
  //     socketRef.current.emit("media updation", {
  //       audio: audioEnabled,
  //       video: videoEnabled,
  //       id: user_id,
  //     });
  //   }
  // }, [videoEnabled, audioEnabled]);

  const getUserMedia = () => {
    const constraints = {
      video: true,
      // video: {
      //   facingMode: usingRearCamera ? "environment" : "user",
      // },
      audio: true,
    };
    navigator.mediaDevices.getUserMedia(constraints).then((vdo) => {
      setStream(vdo);
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = vdo;
      }
      // if (connectionRef.current) {
      //   const videoTrack = vdo.getVideoTracks()[0];
      //   const sender = connectionRef.current.peer
      //     .getSenders()
      //     .find((s) => s.track.kind === "video");
      //   sender.replaceTrack(videoTrack);
      // }
    });
  };

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
        {usingRearCamera && <Websocket props={{ user_id, roomID, stream }} />}
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
