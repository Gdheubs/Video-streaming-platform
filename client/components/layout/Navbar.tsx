"use client";
import Link from 'next/link';
import { Search, Bell, User } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-black border-b border-gray-800 flex items-center px-6 z-50">
      <div className="flex items-center gap-8 flex-1">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <span className="text-white font-bold text-xl hidden sm:inline">VideoStream</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, creators..."
              className="w-full bg-gray-900 border border-gray-700 rounded-full px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-900 rounded-lg transition">
          <Bell size={20} className="text-gray-400" />
        </button>
        <Link href="/profile/me" className="p-2 hover:bg-gray-900 rounded-lg transition">
          <User size={20} className="text-gray-400" />
        </Link>
      </div>
    </nav>
  );
}
