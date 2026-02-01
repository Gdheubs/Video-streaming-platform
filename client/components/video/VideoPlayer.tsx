"use client";

interface Props {
  videoId: string;
}

const VideoPlayer = ({ videoId }: Props) => {
  // Construct the streaming URL based on the API URL
  const getStreamUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // Remove /api suffix if present to get base server URL for /videos route
    const serverUrl = baseUrl.endsWith('/api') 
      ? baseUrl.slice(0, -4) 
      : baseUrl;
    return `${serverUrl}/videos/stream/${videoId}`;
  };
  
  return (
    <video
      controls
      preload="metadata"
      style={{ width: "100%", maxHeight: "80vh" }}
      src={getStreamUrl()}
    />
  );
};

export default VideoPlayer;
