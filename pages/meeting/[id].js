// pages/meeting/[id].js

import VideoCall from "@/components/VideoCall";
import { useRouter } from "next/router";

const Meeting = () => {
  const router = useRouter();
  const { id, user_id } = router.query;

  if (!id || !user_id) {
    return <div>Loading...</div>;
  }

  return <VideoCall roomID={id} user_id={user_id} />;
};

export default Meeting;
