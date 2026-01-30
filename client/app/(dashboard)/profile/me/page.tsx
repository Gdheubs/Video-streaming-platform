"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import VideoCard from '@/components/features/video/VideoCard';
import { User, Video as VideoIcon, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    },
  });

  const { data: myVideos } = useQuery({
    queryKey: ['my-videos'],
    queryFn: async () => {
      const { data } = await api.get('/videos/me');
      return data;
    },
  });

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-2xl p-8 border border-red-600/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {profile?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{profile?.username || 'User'}</h1>
              <p className="text-gray-400 mb-4">{profile?.email || 'user@example.com'}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <VideoIcon size={16} className="text-red-500" />
                  <strong>{myVideos?.videos?.length || 0}</strong> Videos
                </span>
                <span className="flex items-center gap-1">
                  <User size={16} className="text-red-500" />
                  <strong>{profile?.subscriberCount || 0}</strong> Subscribers
                </span>
              </div>
            </div>
          </div>
          <Link 
            href="/settings" 
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
          >
            <Settings size={18} />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <button className="text-white font-semibold border-b-2 border-red-600 pb-4 px-4">
          Videos
        </button>
      </div>

      {/* My Videos */}
      {myVideos?.videos?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myVideos.videos.map((video: any) => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnailUrl}
              views={video.viewCount || 0}
              duration={video.durationSeconds}
              creator={profile?.username || 'You'}
              createdAt={video.createdAt}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-900 rounded-2xl">
          <VideoIcon size={64} className="mx-auto text-gray-700 mb-4" />
          <h3 className="text-2xl font-bold mb-2">No videos yet</h3>
          <p className="text-gray-400 mb-6">Upload your first video to get started!</p>
          <Link 
            href="/upload" 
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            <VideoIcon size={18} />
            Upload Video
          </Link>
        </div>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="bg-gray-900 rounded-2xl p-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-800 rounded-full" />
          <div className="space-y-3">
            <div className="h-8 w-48 bg-gray-800 rounded" />
            <div className="h-4 w-64 bg-gray-800 rounded" />
            <div className="h-4 w-32 bg-gray-800 rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="bg-gray-800 aspect-video rounded-xl mb-3" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded" />
              <div className="h-3 bg-gray-800 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
