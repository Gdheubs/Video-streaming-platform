"use client";
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname, useRouter } from 'next/navigation';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [ageVerified, setAgeVerified] = useState(true);
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const router = useRouter && typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const verified = localStorage.getItem('ageVerified') === 'true';
      setAgeVerified(verified);
      if (!verified && pathname !== '/verify-age') {
        window.location.href = '/verify-age';
      }
    }
    checkAuth();
  }, []);

  if (typeof window !== 'undefined' && !ageVerified && pathname !== '/verify-age') {
    return null;
  }

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
