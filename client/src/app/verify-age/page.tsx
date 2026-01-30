"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function VerifyAgePage() {
  const router = useRouter();

  useEffect(() => {
    // If already verified, redirect
    if (typeof window !== 'undefined' && localStorage.getItem('ageVerified') === 'true') {
      router.replace('/(auth)/login');
    }
  }, [router]);

  const handleVerify = () => {
    localStorage.setItem('ageVerified', 'true');
    router.replace('/(auth)/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-lg text-center">
        <h1 className="text-2xl font-bold mb-6">Warning: 18+ Content</h1>
        <p className="mb-6">This website contains adult content. You must be 18 years or older to enter.</p>
        <button
          onClick={handleVerify}
          className="w-full bg-blue-600 p-3 rounded hover:bg-blue-500 mb-4"
        >
          Yes, I am 18+
        </button>
      </div>
    </div>
  );
}
