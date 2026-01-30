"use client";
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, Film, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const videoFile = acceptedFiles[0];
    if (videoFile) {
      setFile(videoFile);
      setTitle(videoFile.name.replace(/\.[^/.]+$/, ""));
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.mkv', '.avi', '.webm'] },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB limit
    onDropRejected: (rejectedFiles) => {
      setError('File too large or invalid format. Max 500MB.');
    }
  });

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError('Please provide a title');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    if (description) formData.append('description', description);

    try {
      await api.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        },
      });
      router.push('/profile/me');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-600/20 rounded-lg">
          <Film size={28} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Creator Studio</h1>
          <p className="text-gray-400 text-sm">Upload and manage your content</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-8 space-y-8">
        {/* Upload Area */}
        {!file ? (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition cursor-pointer ${
              isDragActive 
                ? 'border-red-500 bg-red-500/5' 
                : 'border-gray-700 hover:border-red-500 hover:bg-gray-800/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isDragActive ? 'Drop your video here' : 'Drag and drop video files to upload'}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Your videos will be private until you publish them.
            </p>
            <p className="text-gray-500 text-xs mb-4">
              Supported formats: MP4, MOV, MKV, AVI, WebM • Max size: 500MB
            </p>
            <button className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition">
              Select Files
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Preview */}
            <div className="flex items-center justify-between bg-gray-800 p-5 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-600/20 text-red-500 rounded-lg">
                  <CheckCircle size={24} />
                </div>
                <div className="text-left">
                  <p className="font-semibold truncate max-w-md">{file.name}</p>
                  <p className="text-sm text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setFile(null);
                  setTitle('');
                  setDescription('');
                  setError('');
                }} 
                className="text-gray-400 hover:text-white transition"
                disabled={uploading}
              >
                <X size={20} />
              </button>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Uploading...</span>
                  <span className="text-white font-semibold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-red-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Video Details Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title..."
                  className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                  disabled={uploading}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video..."
                  rows={4}
                  className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition resize-none"
                  disabled={uploading}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button 
                onClick={handleUpload}
                disabled={uploading || !title.trim()}
                className="flex-1 bg-red-600 py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {uploading ? `Uploading ${progress}%...` : 'Upload & Process'}
              </button>
              <button 
                onClick={() => setFile(null)}
                disabled={uploading}
                className="px-6 py-3 border border-gray-700 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By uploading, you agree to our Terms of Service and Community Guidelines
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
