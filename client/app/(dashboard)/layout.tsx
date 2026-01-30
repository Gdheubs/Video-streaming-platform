"use client";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-black min-h-screen text-white">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 md:ml-64 p-8 pt-24">
            {children}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
