import { Box } from "@mui/material";
import React, { useEffect, useRef } from "react";

export default function Video({ peer }) {
  const ref = useRef();
  console.log(peer, "peer");
  useEffect(() => {
    peer.on("stream", (stream) => {
      console.log(stream, "stream");
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
}
