"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import VideoCard from '@/components/features/video/VideoCard';
import { TrendingUp, Clock, Flame } from 'lucide-react';

const fetchFeed = async () => {
  const { data } = await api.get('/videos/trending');
  return data;
};

export default function FeedPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: fetchFeed,
  });

  if (isLoading) {
    return <FeedSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Feed Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-800 pb-4">
        <button className="flex items-center gap-2 text-white font-semibold border-b-2 border-red-600 pb-4 -mb-4">
          <Flame size={18} />
          Trending
        </button>
        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition pb-4 -mb-4">
          <Clock size={18} />
          Recent
        </button>
        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition pb-4 -mb-4">
          <TrendingUp size={18} />
          Following
        </button>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.videos?.map((video: any) => (
          <VideoCard 
            key={video.id}
            id={video.id}
            title={video.title}
            thumbnail={video.thumbnailUrl}
            views={video.viewCount || 0}
            duration={video.durationSeconds}
            creator={video.creator?.username || 'Unknown'}
            avatar={video.creator?.avatar}
            createdAt={video.createdAt}
          />
        ))}
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex gap-6 border-b border-gray-800 pb-4">
        <div className="h-8 w-24 bg-gray-800 rounded" />
        <div className="h-8 w-24 bg-gray-800 rounded" />
        <div className="h-8 w-24 bg-gray-800 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div className="bg-gray-800 aspect-video rounded-xl mb-3" />
            <div className="flex gap-3">
              <div className="bg-gray-800 w-10 h-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="bg-gray-800 h-4 w-3/4 rounded" />
                <div className="bg-gray-800 h-3 w-1/2 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
