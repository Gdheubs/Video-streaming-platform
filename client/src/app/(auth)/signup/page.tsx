"use client";
import { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const register = useAuthStore((state: any) => state.register);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-gray-900 rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
        {error && <div className="bg-red-500/20 text-red-500 p-3 mb-4 rounded">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 bg-gray-800 rounded border border-gray-700"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-6 bg-gray-800 rounded border border-gray-700"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <button type="submit" className="w-full bg-blue-600 p-3 rounded hover:bg-blue-500 mb-4">
          Sign Up
        </button>
        <div className="flex justify-between text-sm mt-2">
          <Link href="/(auth)/login" className="text-blue-400 hover:underline">Already a user? Sign in</Link>
        </div>
      </form>
    </div>
  );
}
