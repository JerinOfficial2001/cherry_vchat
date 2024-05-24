import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const roomId = { roomID: "my-room", id: 10 };

  useEffect(() => {
    const socket = io("http://localhost:4000");
    setSocket(socket);

    socket.on("signal", async (data) => {
      if (data.signal.type === "offer") {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.signal)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("signal", {
          signal: peerConnection.localDescription,
          target: data.from,
        });
      } else if (data.signal.type === "answer") {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.signal)
        );
      } else if (data.signal.type === "candidate") {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(data.signal.candidate)
        );
      }
    });

    socket.on("user-connected", (userId) => {
      createPeerConnection(userId);
    });

    socket.on("user-disconnected", (userId) => {
      if (peerConnection) {
        peerConnection.close();
      }
    });

    startLocalStream();
    socket.emit("join-room", roomId);

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const startLocalStream = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = localStream;
    localStreamRef.current = localStream;
  };

  const createPeerConnection = (userId) => {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const peerConnection = new RTCPeerConnection(configuration);
    setPeerConnection(peerConnection);

    localStreamRef.current
      .getTracks()
      .forEach((track) =>
        peerConnection.addTrack(track, localStreamRef.current)
      );

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          signal: { type: "candidate", candidate: event.candidate },
          target: userId,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.createOffer().then((offer) => {
      peerConnection.setLocalDescription(offer).then(() => {
        socket.emit("signal", {
          signal: peerConnection.localDescription,
          target: userId,
        });
      });
    });
  };

  return (
    <div>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        style={{ width: "45%", height: "auto" }}
      ></video>
      <video
        ref={remoteVideoRef}
        autoPlay
        style={{ width: "45%", height: "auto" }}
      ></video>
    </div>
  );
}
