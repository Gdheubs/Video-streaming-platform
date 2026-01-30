export interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'CREATOR' | 'ADMIN';
  avatar?: string;
  verified: boolean;
  createdAt: string;
}

export interface Creator {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  subscriberCount: number;
  verified: boolean;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  hlsUrl?: string;
  originalUrl?: string;
  durationSeconds?: number;
  viewCount: number;
  likeCount: number;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  createdAt: string;
  creator?: Creator & { username: string };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
