"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import VideoCard from '@/components/features/video/VideoCard';
import { Loader2 } from 'lucide-react';

// Fetcher Function
const fetchTrending = async () => {
  const { data } = await api.get('/videos/trending');
  return data;
};

export default function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['trending'],
    queryFn: fetchTrending,
  });

  if (isLoading) return <HomeSkeleton />;
  if (isError) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <p className="text-red-500 text-lg mb-4">Failed to load feed.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-red-600 px-6 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Trending Now</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

      {(!data?.videos || data.videos.length === 0) && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No videos available yet.</p>
          <p className="text-gray-500 text-sm mt-2">Be the first to upload content!</p>
        </div>
      )}
    </div>
  );
}

// Visual Placeholder (The "Skeleton")
function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-800 aspect-video rounded-xl mb-3" />
            <div className="flex gap-3">
              <div className="bg-gray-800 w-10 h-10 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="bg-gray-800 h-4 w-3/4 rounded" />
                <div className="bg-gray-800 h-3 w-1/2 rounded" />
                <div className="bg-gray-800 h-3 w-2/3 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
