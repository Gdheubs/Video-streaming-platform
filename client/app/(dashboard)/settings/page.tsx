"use client";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { User, Shield, CreditCard, Bell, Save } from 'lucide-react';

const tabs = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Privacy & Security', icon: Shield },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="flex gap-8">
        {/* Settings Sidebar */}
        <div className="w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition font-medium",
                activeTab === tab.id 
                  ? "bg-gray-800 text-white" 
                  : "text-gray-400 hover:bg-gray-900 hover:text-white"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 bg-gray-900 rounded-xl p-8 min-h-[600px]">
          {activeTab === 'account' && <AccountSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </div>
  );
}

function AccountSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-1">Account Information</h2>
        <p className="text-sm text-gray-400">Update your account details and profile</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Display Name</label>
            <input 
              type="text" 
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none transition" 
              placeholder="Your Name" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Username</label>
            <input 
              type="text" 
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none transition" 
              placeholder="@username" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Email Address</label>
          <input 
            type="email" 
            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none transition" 
            placeholder="you@example.com" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Bio</label>
          <textarea 
            rows={4}
            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none transition resize-none" 
            placeholder="Tell us about yourself..." 
          />
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-800">
        <button className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2">
          <Save size={18} />
          Save Changes
        </button>
        <button className="border border-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-1">Privacy & Security</h2>
        <p className="text-sm text-gray-400">Manage your security preferences</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Current Password</label>
          <input 
            type="password" 
            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none transition" 
            placeholder="••••••••" 
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">New Password</label>
            <input 
              type="password" 
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none transition" 
              placeholder="••••••••" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Confirm Password</label>
            <input 
              type="password" 
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none transition" 
              placeholder="••••••••" 
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">Privacy Options</h3>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-300">Show profile to public</span>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-300">Allow comments on videos</span>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-800">
        <button className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition">
          Update Password
        </button>
      </div>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <CreditCard size={32} className="text-gray-600" />
      </div>
      <h3 className="text-2xl font-bold mb-2">Manage Subscription</h3>
      <p className="text-gray-400 mb-8">You are currently on the Free Plan.</p>
      
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-gray-800 rounded-lg p-6 text-left">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-bold text-lg">Premium Plan</h4>
              <p className="text-sm text-gray-400">Unlock exclusive features</p>
            </div>
            <span className="text-2xl font-bold">$9.99<span className="text-sm text-gray-400">/mo</span></span>
          </div>
          <ul className="space-y-2 text-sm text-gray-300 mb-6">
            <li>✓ Ad-free experience</li>
            <li>✓ 4K video quality</li>
            <li>✓ Download videos</li>
            <li>✓ Early access to content</li>
          </ul>
          <button className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-1">Notification Preferences</h2>
        <p className="text-sm text-gray-400">Choose what you want to be notified about</p>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold mb-4">Email Notifications</h3>
          {['New video uploads', 'New comments', 'New followers', 'Weekly digest'].map((item) => (
            <label key={item} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-300">{item}</span>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </label>
          ))}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold mb-4">Push Notifications</h3>
          {['Video processing complete', 'Content moderation updates', 'Subscription renewals'].map((item) => (
            <label key={item} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-300">{item}</span>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-800">
        <button className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
