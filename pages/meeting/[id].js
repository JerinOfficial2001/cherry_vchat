// pages/meeting/[id].js

import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const VideoCall = dynamic(() => import("../../Component/VideoCall"), {
  ssr: false,
});

const Meeting = () => {
  const router = useRouter();
  const { id } = router.query;

  if (!id) {
    return <div>Loading...</div>;
  }

  return <VideoCall roomID={id} />;
};

export default Meeting;
