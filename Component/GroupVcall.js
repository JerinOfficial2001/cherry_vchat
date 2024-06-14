import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Grid, IconButton, TextField } from "@mui/material";
import Peer from "simple-peer";
import io from "socket.io-client";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {
  Assignment,
  CallEnd,
  ContentCopy,
  Phone,
  VideocamIcon,
  VideocamOffIcon,
  MicIcon,
  MicOffIcon,
} from "@mui/icons-material";

const socket = io.connect("https://socket-server-fhra.onrender.com");

function GroupVcall() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [peers, setPeers] = useState([]);
  const [name, setName] = useState("");
  const [idsToCall, setIdsToCall] = useState([]);
  const myVideo = useRef();
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      });
  }, []);

  useEffect(() => {
    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("callUser", (data) => {
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
      });

      peer.on("signal", (signal) => {
        socket.emit("answerCall", { signal, to: data.from });
      });

      peer.signal(data.signal);

      setPeers((prevPeers) => [...prevPeers, { peer, id: data.from }]);
    });

    socket.on("callAccepted", (data) => {
      const peerIdx = peers.findIndex((p) => p.id === data.from);
      if (peerIdx !== -1) {
        peers[peerIdx].peer.signal(data.signal);
      }
    });

    return () => {
      socket.off("callUser");
      socket.off("callAccepted");
    };
  }, [stream, peers]);

  const initiateGroupCall = () => {
    idsToCall.forEach((id) => {
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

      setPeers((prevPeers) => [...prevPeers, { peer, id }]);
    });
  };

  const leaveGroupCall = () => {
    peers.forEach(({ peer }) => {
      peer.destroy();
    });
    setPeers([]);
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
          <Box>
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              style={{
                width: "300px",
                transform: "scaleX(-1)",
                borderRadius: "10px",
              }}
            />
          </Box>
        )}
        <Grid container sx={{ width: "90%" }}>
          {peers.map(({ id }) => (
            <Grid key={id} item xl={3} lg={3} md={3} sm={3} xs={3}>
              <Box>
                <video
                  playsInline
                  ref={(ref) => {
                    const peer = peers.find((p) => p.id === id);
                    if (ref && peer && peer.peer) {
                      ref.srcObject = new MediaStream(peer.peer.streams[0]);
                    }
                  }}
                  autoPlay
                  style={{ width: "300px", borderRadius: "10px" }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

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
          label="IDs to call (comma-separated)"
          variant="filled"
          value={idsToCall}
          onChange={(e) => setIdsToCall(e.target.value.split(","))}
        />
        <div className="call-button">
          <Button
            variant="contained"
            color="primary"
            onClick={initiateGroupCall}
          >
            Call
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={leaveGroupCall}
          >
            End Call
          </Button>
        </div>
      </Box>
    </Box>
  );
}

export default GroupVcall;
