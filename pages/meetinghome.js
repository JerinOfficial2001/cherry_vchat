// pages/index.js

import { useState } from "react";
import { useRouter } from "next/router";
import { Box, Button, TextField } from "@mui/material";
import { Call } from "@mui/icons-material";

export default function Meetinghome() {
  const [meetingID, setMeetingID] = useState("");
  const router = useRouter();

  const handleCreateMeeting = async () => {
    const response = await fetch(
      process.env.NEXT_PUBLIC_SOCKET_URL + "/create-room"
    );
    const data = await response.json();
    router.push(`/meeting/${data.roomID}?user_id=${router.query.userID}`);
  };

  const handleJoinMeeting = () => {
    if (meetingID) {
      router.push(`/meeting/${meetingID}?user_id=${router.query.userID}`);
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
      <Button
        variant="contained"
        startIcon={<Call sx={{ color: "white" }} />}
        sx={{
          color: "white",
          border: "1px solid white",
          "&:hover": {
            border: "1px solid green",
          },
          background: "green",
        }}
        onClick={() => {
          router.push("/solovchat?userid=" + router.query.userID);
        }}
      >
        Call
      </Button>
    </Box>
  );
}
