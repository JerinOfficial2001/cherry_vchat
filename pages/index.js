// pages/index.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Box, Button, TextField } from "@mui/material";
import Cookies from "js-cookie";

export default function Home() {
  const [meetingID, setMeetingID] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Set a unique userID in cookies if it doesn't already exist
    if (!Cookies.get("userID")) {
      Cookies.set("userID", `user-${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  const handleCreateMeeting = async () => {
    // https://socket-server-fhra.onrender.com
    const response = await fetch(
      "https://socket-server-fhra.onrender.com/create-room"
    );
    const data = await response.json();
    router.push(`/meeting/${data.roomID}`);
  };

  const handleJoinMeeting = () => {
    if (meetingID) {
      router.push(`/meeting/${meetingID}`);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 2,
        flexDirection: {
          lg: "row",
          md: "row",
          sm: "row",
          xs: "column",
        },
      }}
    >
      <Button
        variant="outlined"
        sx={{
          color: "white",
          border: "1px solid white",
          "&:hover": {
            border: "1px solid green",
          },
        }}
        onClick={handleCreateMeeting}
      >
        Start a New Meeting
      </Button>
      <TextField
        type="text"
        value={meetingID}
        onChange={(e) => setMeetingID(e.target.value)}
        placeholder="Enter Meeting ID"
      />
      <Button
        variant="outlined"
        sx={{
          color: "white",
          border: "1px solid white",
          "&:hover": {
            border: "1px solid green",
          },
        }}
        onClick={handleJoinMeeting}
      >
        Join Meeting
      </Button>
    </Box>
  );
}
