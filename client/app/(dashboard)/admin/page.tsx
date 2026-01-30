"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Check, ShieldAlert, X } from 'lucide-react';

interface ModerationVideo {
  id: string;
  title: string;
  creator?: {
    email?: string | null;
    username?: string | null;
  } | null;
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-moderation-queue'],
    queryFn: async () => (await api.get('/admin/moderation/queue')).data,
  });

  const mutation = useMutation({
    mutationFn: async ({
      id,
      decision,
      reason,
    }: {
      id: string;
      decision: 'APPROVE' | 'REJECT';
      reason?: string;
    }) => {
      if (decision === 'APPROVE') {
        return api.post(`/admin/moderation/videos/${id}/approve`);
      }
      return api.post(`/admin/moderation/videos/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] });
    },
  });

  const videos: ModerationVideo[] = data?.videos ?? [];

  if (isLoading) return <div>Loading Command Center...</div>;
  if (isError) return <div>Failed to load moderation queue.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <ShieldAlert className="text-red-500" /> Admin Command Center
      </h1>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">Moderation Queue</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="pb-3">Video Title</th>
              <th className="pb-3">Uploader</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="border-b border-gray-800/50 hover:bg-gray-800">
                <td className="py-4">{video.title}</td>
                <td className="py-4">
                  {video.creator?.email || video.creator?.username || 'Unknown'}
                </td>
                <td className="py-4 flex gap-3">
                  <button
                    onClick={() => mutation.mutate({ id: video.id, decision: 'APPROVE' })}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
                    disabled={mutation.isPending}
                  >
                    <Check size={16} /> Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Rejection reason (optional)') || undefined;
                      mutation.mutate({ id: video.id, decision: 'REJECT', reason });
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1"
                    disabled={mutation.isPending}
                  >
                    <X size={16} /> Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {videos.length === 0 && (
          <p className="text-gray-500 mt-4">No pending videos. Good job!</p>
        )}
      </div>
    </div>
  );
}
