"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { formatDuration, formatViews, formatTimeAgo } from '@/lib/utils';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail?: string;
  views: number;
  duration?: number;
  creator: string;
  avatar?: string;
  createdAt?: string;
}

export default function VideoCard({
  id,
  title,
  thumbnail,
  views,
  duration,
  creator,
  avatar,
  createdAt
}: VideoCardProps) {
  return (
    <Link href={`/watch/${id}`} className="group cursor-pointer">
      <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-3">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <Play size={48} className="text-gray-600" />
          </div>
        )}
        
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold">
            {formatDuration(duration)}
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100">
            <Play size={20} fill="white" className="text-white ml-1" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0 overflow-hidden">
          {avatar ? (
            <Image src={avatar} alt={creator} width={40} height={40} className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800 text-white font-bold">
              {creator.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white line-clamp-2 group-hover:text-red-500 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-400 mt-1">{creator}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatViews(views)} views {createdAt && `• ${formatTimeAgo(createdAt)}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
