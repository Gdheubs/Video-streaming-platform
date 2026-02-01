"use client";
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ThumbsUp, Share2, MessageSquare } from 'lucide-react';
import VideoPlayer from '@/components/video/VideoPlayer';

export default function WatchPage() {
  const params = useParams();
  const videoId = params.id as string;

  const { data: video, isLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: async () => {
      const { data } = await api.get(`/videos/${videoId}`);
      return data;
    },
    enabled: !!videoId,
  });

  if (isLoading) {
    return <WatchPageSkeleton />;
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Video not found</p>
          <p className="text-gray-400">This video may have been removed or is private.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Video Player - Use S3 streaming */}
      <div className="bg-black aspect-video rounded-xl overflow-hidden">
        <VideoPlayer videoId={videoId} />
      </div>

      {/* Video Info */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{video.title}</h1>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
              {video.creator?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{video.creator?.username || 'Unknown'}</p>
              <p className="text-sm text-gray-400">{video.viewCount || 0} views</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition">
              <ThumbsUp size={18} />
              <span>{video.likeCount || 0}</span>
            </button>
            <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {video.description && (
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-300">{video.description}</p>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MessageSquare size={20} />
          <h2 className="text-xl font-bold">Comments</h2>
        </div>
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <p className="text-gray-400">Comments are coming soon!</p>
        </div>
      </div>
    </div>
  );
}

function WatchPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="bg-gray-800 aspect-video rounded-xl" />
      <div className="space-y-4">
        <div className="h-8 bg-gray-800 rounded w-3/4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-800 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded w-32" />
              <div className="h-3 bg-gray-800 rounded w-24" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-gray-800 rounded-lg" />
            <div className="h-10 w-24 bg-gray-800 rounded-lg" />
          </div>
        </div>
        <div className="h-32 bg-gray-800 rounded-xl" />
      </div>
    </div>
  );
}
