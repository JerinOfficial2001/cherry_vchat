import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { Box, Grid } from "@mui/material";

export default function Websocket({ props }) {
  const { user_id, roomID, stream } = props;
  console.log(stream, "testStream");

  const socketRef = useRef();
  const [peers, setPeers] = useState([]);
  const peersRef = useRef([]);

  useEffect(() => {
    console.log("Connecting to socket...");
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      query: { userID: user_id, roomID },
      path: "/groupvchat",
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socketRef.current.emit("join room", { roomID, userID: user_id });

    socketRef.current.on("all-users", (users) => {
      console.log("Received all-users event:", users);
      const peers = [];
      users.forEach((userID) => {
        const peer = createPeer(userID, user_id, stream);
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
      const peer = addPeer(payload.signal, payload.callerID, stream);
      peersRef.current.push({
        peerID: payload.callerID,
        peer,
      });
      setPeers((users) => [...users, peer]);
    });

    socketRef.current.on("receiving returned signal", (payload) => {
      console.log("Receiving returned signal:", payload);
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      if (item) item.peer.signal(payload.signal);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      peersRef.current.forEach(({ peer }) => peer.destroy());
    };
  }, []);

  const createPeer = (userToSignal, callerID, stream) => {
    console.log("createPeer", stream);
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

    peer.on("stream", (remoteStream) => {
      console.log("Received remote stream");
      // Handle the remote stream
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    console.log("addPeer", stream);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", {
        signal,
        callerID,
        userID: user_id,
      });
    });

    peer.on("stream", (remoteStream) => {
      console.log("Received remote stream");
      // Handle the remote stream
    });

    if (incomingSignal) {
      peer.signal(incomingSignal);
    }

    return peer;
  };
  return (
    <>
      {peers.map((peer, index) => {
        return (
          <Grid key={index} item lg={3} md={3} sm={6} xs={4}>
            <Video peer={peer} />
          </Grid>
        );
      })}
    </>
  );
}
const Video = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
  }, [peer]);
  return (
    <Box
      sx={{
        width: { lg: "300px", md: "300px", sm: "300px", xs: "100px" },
        height: {
          lg: "300px",
          md: "300px",
          sm: "300px",
          xs: "100px",
        },
        borderRadius: "10px",
        background: "black",
        paddingY: 1,
      }}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        style={{ width: "100%", height: "100%", borderRadius: "10px" }}
      />
    </Box>
  );
};
