"use client";

interface Props {
  videoId: string;
}

const VideoPlayer = ({ videoId }: Props) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  
  return (
    <video
      controls
      preload="metadata"
      style={{ width: "100%", maxHeight: "80vh" }}
      src={`${apiUrl}/videos/stream/${videoId}`}
    />
  );
};

export default VideoPlayer;
