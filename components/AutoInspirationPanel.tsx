// components/AutoInspirationPanel.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Wand2 } from 'lucide-react';

const WEBSITE_EXAMPLE_PATH_PREFIX = '/websites/'; // or whatever your pattern is

// Optional: map slugs to human-readable names (or use slug as name)
const WEBSITE_NAME_MAP: Record<string, string> = {
  'coffee-roastery': 'Gourmet Coffee Roastery',
  'law-firm': 'Modern Law Firm',
  'fitness-studio': 'Urban Fitness Studio',
  // ... you can auto-generate this or skip it and just use slug
};

export default function AutoInspirationPanel() {
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState(false);
  const [websiteId, setWebsiteId] = useState('');
  const [websiteName, setWebsiteName] = useState('');

  useEffect(() => {
    if (pathname?.startsWith(WEBSITE_EXAMPLE_PATH_PREFIX)) {
      const slug = pathname.replace(WEBSITE_EXAMPLE_PATH_PREFIX, '').split('/')[0];
      if (slug && slug !== '') {
        setWebsiteId(slug);
        setWebsiteName(WEBSITE_NAME_MAP[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        setShouldShow(true);
        return;
      }
    }
    setShouldShow(false);
  }, [pathname]);

  if (!shouldShow) return null;

  const handleCreate = () => {
    localStorage.setItem('selectedWebsiteTemplate', websiteId);
    localStorage.setItem('selectedWebsiteName', websiteName);
    window.location.href = '/get-started';
  };

  return (
    <div className="fixed left-0 top-1/2 z-50 transform -translate-y-1/2 w-56">
      <div className="bg-white shadow-xl rounded-r-lg border border-gray-200 p-4 space-y-3">
        <a
          href="/websites"
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-amber-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          View More Websites
        </a>

        <button
          onClick={handleCreate}
          className="w-full bg-amber-700 text-white text-sm font-bold py-2.5 px-3 rounded hover:bg-amber-800 transition flex items-center justify-center gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Create Me This Website
        </button>
      </div>
    </div>
  );
}