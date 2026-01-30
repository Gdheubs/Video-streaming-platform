# 🎨 Component & Page Gallery

## Visual Reference Guide for Your Enterprise Frontend

---

## 🏠 **Homepage** (`/`)

**Location:** [app/(dashboard)/page.tsx](client/app/(dashboard)/page.tsx)

**What it does:**
- Fetches trending videos from `/api/videos/trending`
- Shows skeleton loaders while fetching
- Displays videos in responsive grid (4 columns on XL screens)
- Empty state if no videos exist

**Key Features:**
```tsx
// TanStack Query hook
const { data, isLoading, isError } = useQuery({
  queryKey: ['trending'],
  queryFn: fetchTrending,
});

// Skeleton shown during isLoading
// Error state with retry button on isError
// Video grid with VideoCard components on success
```

**Visual Layout:**
```
┌─────────────────────────────────────────────────┐
│ Trending Now                                    │
├─────────────┬─────────────┬─────────────┬───────┤
│ VideoCard 1 │ VideoCard 2 │ VideoCard 3 │ [...] │
│ [Thumbnail] │ [Thumbnail] │ [Thumbnail] │       │
│ Title       │ Title       │ Title       │       │
│ Creator     │ Creator     │ Creator     │       │
│ 1.2M views  │ 543K views  │ 89K views   │       │
└─────────────┴─────────────┴─────────────┴───────┘
```

---

## 📺 **Feed Page** (`/feed`)

**Location:** [app/(dashboard)/feed/page.tsx](client/app/(dashboard)/feed/page.tsx)

**What it does:**
- Tabbed interface: Trending / Recent / Following
- Same video grid as homepage
- Active tab has red underline
- Separate query key for cache isolation

**Visual Layout:**
```
┌─────────────────────────────────────────────────┐
│ [🔥 Trending] [🕒 Recent] [📈 Following]       │
│ ────────────                                    │
├─────────────┬─────────────┬─────────────────────┤
│ VideoCard 1 │ VideoCard 2 │ VideoCard 3         │
│ [Thumbnail] │ [Thumbnail] │ [Thumbnail]         │
└─────────────┴─────────────┴─────────────────────┘
```

---

## 🎬 **Upload Studio** (`/upload`)

**Location:** [app/(dashboard)/upload/page.tsx](client/app/(dashboard)/upload/page.tsx)

**What it does:**
- Drag & drop video files (react-dropzone)
- File validation: MP4, MOV, MKV, AVI, WebM (max 500MB)
- Title + description form
- Real-time upload progress bar
- Character counters (title: 100, description: 500)

**Visual States:**

**1. Empty State (No file selected):**
```
┌─────────────────────────────────────────────────┐
│ Creator Studio                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│        ┌─────────────────────────┐             │
│        │         [📤]            │             │
│        │ Drag and drop video     │             │
│        │ files to upload         │             │
│        │                         │             │
│        │   [Select Files]        │             │
│        └─────────────────────────┘             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**2. File Selected:**
```
┌─────────────────────────────────────────────────┐
│ [✓] my-video.mp4 (45.2 MB)              [✕]    │
├─────────────────────────────────────────────────┤
│ Title *                                         │
│ [my-video                             ] 11/100  │
│                                                 │
│ Description                                     │
│ [Tell viewers about your video...    ] 0/500   │
│                                                 │
│ [Upload & Process]  [Cancel]                    │
└─────────────────────────────────────────────────┘
```

**3. Uploading:**
```
┌─────────────────────────────────────────────────┐
│ Uploading...                              67%   │
│ ████████████████████░░░░░░░░                   │
└─────────────────────────────────────────────────┘
```

---

## ⚙️ **Settings Page** (`/settings`)

**Location:** [app/(dashboard)/settings/page.tsx](client/app/(dashboard)/settings/page.tsx)

**What it does:**
- 4 tabs: Account, Security, Billing, Notifications
- Each tab has its own form/interface
- Active tab highlighted with gray background

**Visual Layout:**
```
┌──────────────┬──────────────────────────────────┐
│ [👤 Account] │ Account Information              │
│  🔒 Security │                                  │
│  💳 Billing  │ Display Name                     │
│  🔔 Notifs   │ [John Doe            ]           │
│              │                                  │
│              │ Username                         │
│              │ [@johndoe           ]            │
│              │                                  │
│              │ Email                            │
│              │ [john@example.com   ]            │
│              │                                  │
│              │ Bio                              │
│              │ [Tell us about...   ]            │
│              │                                  │
│              │ [💾 Save] [Cancel]               │
└──────────────┴──────────────────────────────────┘
```

**Tabs:**
1. **Account:** Display name, username, email, bio
2. **Security:** Current password, new password, privacy toggles
3. **Billing:** Premium plan card with pricing ($9.99/mo)
4. **Notifications:** Email/push notification checkboxes

---

## 👤 **Profile Page** (`/profile/me`)

**Location:** [app/(dashboard)/profile/me/page.tsx](client/app/(dashboard)/profile/me/page.tsx)

**What it does:**
- Shows user profile info (username, email)
- Displays user stats (video count, subscriber count)
- Grid of user's uploaded videos
- Empty state with "Upload Video" CTA

**Visual Layout:**
```
┌─────────────────────────────────────────────────┐
│ ┌───┐                                           │
│ │ J │  JohnDoe                  [⚙️ Edit]       │
│ └───┘  john@example.com                         │
│        🎬 5 Videos  👤 1.2K Subscribers          │
├─────────────────────────────────────────────────┤
│ [Videos]                                        │
├─────────────┬─────────────┬─────────────────────┤
│ VideoCard 1 │ VideoCard 2 │ VideoCard 3         │
│ [Thumbnail] │ [Thumbnail] │ [Thumbnail]         │
└─────────────┴─────────────┴─────────────────────┘
```

**Empty State:**
```
┌─────────────────────────────────────────────────┐
│               [🎬]                              │
│         No videos yet                           │
│   Upload your first video to get started!       │
│                                                 │
│           [📤 Upload Video]                     │
└─────────────────────────────────────────────────┘
```

---

## 📹 **Watch Page** (`/watch/[id]`)

**Location:** [app/(dashboard)/watch/[id]/page.tsx](client/app/(dashboard)/watch/[id]/page.tsx)

**What it does:**
- Plays video with HTML5 controls
- Shows video title, creator, view count
- Like/share buttons
- Description section
- Comments placeholder

**Visual Layout:**
```
┌─────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────┐   │
│ │                                           │   │
│ │          [▶️ VIDEO PLAYER]                │   │
│ │                                           │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ My Awesome Video                                │
│                                                 │
│ ┌─┐ JohnDoe              [👍 142] [🔗 Share]   │
│ │J│ 1.2K views                                  │
│ └─┘                                             │
│                                                 │
│ ┌─────────────────────────────────────────┐     │
│ │ This is the video description...        │     │
│ └─────────────────────────────────────────┘     │
│                                                 │
│ 💬 Comments                                     │
│ ┌─────────────────────────────────────────┐     │
│ │  Comments are coming soon!              │     │
│ └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

---

## 🧩 **Reusable Components**

### **VideoCard**
**Location:** [components/features/video/VideoCard.tsx](client/components/features/video/VideoCard.tsx)

**Props:**
```tsx
interface VideoCardProps {
  id: string;              // Video ID for linking
  title: string;           // Video title
  thumbnail?: string;      // Thumbnail URL (optional)
  views: number;           // View count
  duration?: number;       // Duration in seconds (optional)
  creator: string;         // Creator username
  avatar?: string;         // Creator avatar URL (optional)
  createdAt?: string;      // Upload date (optional)
}
```

**Visual Structure:**
```
┌─────────────────────┐
│                     │
│   [Thumbnail]       │  ← Aspect ratio: 16:9
│   Duration: 5:43    │  ← Bottom-right badge
│                     │
└─────────────────────┘
┌─┐ Video Title (2 lines max)
│A│ Creator Name
└─┘ 1.2M views • 5d ago
```

**Hover Effect:**
- Scale thumbnail: 105%
- Show play button overlay (red circle, white icon)
- Title color changes to red

---

### **Sidebar**
**Location:** [components/layout/Sidebar.tsx](client/components/layout/Sidebar.tsx)

**Menu Items:**
```tsx
const menuItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Compass, label: 'Feed', href: '/feed' },
  { icon: Upload, label: 'Studio', href: '/upload' },
  { icon: User, label: 'Profile', href: '/profile/me' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];
```

**Visual:**
```
┌──────────────────┐
│                  │
│ [🏠] Home        │  ← Active (red bg)
│ [🧭] Feed        │
│ [📤] Studio      │
│ [👤] Profile     │
│ [⚙️] Settings    │
│                  │
│ ────────────     │
│ [🚪] Logout      │
└──────────────────┘
```

**States:**
- Active: `bg-red-600 text-white`
- Inactive: `text-gray-400 hover:bg-gray-900`

---

### **Navbar**
**Location:** [components/layout/Navbar.tsx](client/components/layout/Navbar.tsx)

**Visual:**
```
┌─────────────────────────────────────────────────┐
│ [V] VideoStream   [🔍 Search...]     [🔔] [👤]  │
└─────────────────────────────────────────────────┘
    Logo          Search Bar        Notif Profile
```

**Features:**
- Fixed position (sticky top)
- Search bar expands to 2xl max-width
- Icons have hover effect (bg-gray-900)

---

## 🎨 **Skeleton Loaders**

All pages have skeleton states that match their loaded layouts:

**Homepage Skeleton:**
```tsx
{[...Array(8)].map((_, i) => (
  <div key={i} className="animate-pulse">
    <div className="bg-gray-800 aspect-video rounded-xl mb-3" />
    <div className="flex gap-3">
      <div className="bg-gray-800 w-10 h-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <div className="bg-gray-800 h-4 w-3/4 rounded" />
        <div className="bg-gray-800 h-3 w-1/2 rounded" />
      </div>
    </div>
  </div>
))}
```

**Why Skeletons Matter:**
- **Perceived performance** - App feels faster even if data takes time
- **Reduced layout shift** - No "jumpy" content when data loads
- **Professional UX** - Matches Big Tech standards (YouTube, Netflix)

---

## 🔧 **Utility Functions**

**Location:** [lib/utils.ts](client/lib/utils.ts)

### `formatDuration(seconds: number)`
```tsx
formatDuration(45)      // "0:45"
formatDuration(185)     // "3:05"
formatDuration(3665)    // "1:01:05"
```

### `formatViews(views: number)`
```tsx
formatViews(543)        // "543"
formatViews(1234)       // "1.2K"
formatViews(1234567)    // "1.2M"
```

### `formatTimeAgo(date: Date | string)`
```tsx
formatTimeAgo("2024-01-20 10:30:00")
// Less than 1 min: "Just now"
// Less than 1 hour: "35m ago"
// Less than 1 day: "5h ago"
// Less than 30 days: "12d ago"
// Less than 1 year: "3mo ago"
// More than 1 year: "2y ago"
```

### `cn(...inputs: ClassValue[])`
```tsx
// Tailwind class merging (prevents conflicts)
cn("px-4 py-2", "px-6")  // "px-6 py-2" (px-6 wins)
cn("text-red-500", condition && "text-blue-500")
```

---

## 📦 **Package Overview**

### Core Dependencies
```json
{
  "@tanstack/react-query": "^5.62.18",  // Data fetching/caching
  "axios": "^1.7.9",                     // HTTP client
  "zustand": "^5.0.3",                   // State management
  "lucide-react": "^0.468.0",            // Icon library
  "react-hook-form": "^7.54.2",          // Form handling
  "zod": "^3.24.1",                      // Schema validation
  "framer-motion": "^12.0.2",            // Animations
  "react-dropzone": "^14.3.5",           // Drag-drop uploads
  "clsx": "^2.1.1",                      // Class name utility
  "tailwind-merge": "^2.6.0"             // Tailwind class merger
}
```

---

## 🎯 **Quick Reference**

### Data Fetching Pattern
```tsx
const { data, isLoading, isError } = useQuery({
  queryKey: ['unique-key'],
  queryFn: async () => {
    const { data } = await api.get('/endpoint');
    return data;
  },
});

if (isLoading) return <Skeleton />;
if (isError) return <Error />;
return <Content data={data} />;
```

### Upload Pattern
```tsx
const formData = new FormData();
formData.append('video', file);
formData.append('title', title);

await api.post('/videos/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (e) => {
    setProgress((e.loaded * 100) / e.total);
  },
});
```

### Navigation Pattern
```tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const pathname = usePathname();
const isActive = pathname === '/feed';

<Link 
  href="/feed"
  className={isActive ? 'active-styles' : 'inactive-styles'}
>
  Feed
</Link>
```

---

## 🚀 **Testing Checklist**

- [x] Homepage loads trending videos
- [x] Skeleton shows during loading
- [x] VideoCards display with hover effects
- [x] Sidebar highlights active page
- [x] Feed page has working tabs
- [x] Upload drag-drop accepts video files
- [x] Upload shows progress bar
- [x] Settings tabs switch correctly
- [x] Profile page shows user info
- [x] Watch page plays video
- [x] All pages are responsive
- [x] Data caching works (no double-fetch)
- [x] API errors show retry buttons

---

**Your app is live at:** http://localhost:3001

Enjoy your enterprise-grade frontend! 🎉
