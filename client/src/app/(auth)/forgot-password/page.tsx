"use client";
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    // Simulate API call
    try {
      // await api.post('/auth/forgot-password', { email });
      setMessage('If this email exists, a reset link has been sent.');
    } catch (err: any) {
      setError('Failed to send reset link.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-gray-900 rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>
        {message && <div className="bg-green-500/20 text-green-500 p-3 mb-4 rounded">{message}</div>}
        {error && <div className="bg-red-500/20 text-red-500 p-3 mb-4 rounded">{error}</div>}
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 mb-6 bg-gray-800 rounded border border-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="w-full bg-blue-600 p-3 rounded hover:bg-blue-500 mb-4">
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
