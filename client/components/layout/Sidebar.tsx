"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Home, Compass, Upload, User, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type UserRole = 'GUEST' | 'USER' | 'CREATOR' | 'ADMIN';

const getRoleFromToken = (): UserRole | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const payload = JSON.parse(atob(padded));

    return payload.role || payload?.user?.role || null;
  } catch {
    return null;
  }
};

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setRole(getRoleFromToken());
  }, []);

  const menuItems = useMemo(() => {
    const items = [
      { icon: Home, label: 'Home', href: '/' },
      { icon: Compass, label: 'Feed', href: '/feed' },
      { icon: Upload, label: 'Studio', href: '/upload' },
      { icon: User, label: 'Profile', href: '/profile/me' },
      { icon: Settings, label: 'Settings', href: '/settings' },
    ];

    if (role === 'ADMIN') {
      items.push({ icon: ShieldAlert, label: 'Admin', href: '/admin' });
    }

    return items;
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 h-screen bg-black border-r border-gray-800 fixed left-0 top-0 pt-20 hidden md:flex flex-col z-40">
      <div className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-red-600 text-white" 
                  : "text-gray-400 hover:bg-gray-900 hover:text-white"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-500/10 w-full rounded-lg transition"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
