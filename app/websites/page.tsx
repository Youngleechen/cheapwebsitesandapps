// app/websites/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'websites_preview';

type WebsiteItem = {
  id: string;
  title: string;
  prompt: string;
  categoryKey: string;
  categoryName: string;
};

export default function WebsitesShowcase() {
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [websiteImages, setWebsiteImages] = useState<{ [key: string]: string | null }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // New state for filter

  // Fetch website list from API
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const res = await fetch('/api/websites');
        if (!res.ok) throw new Error('Failed to fetch websites');
        const data = await res.json();
        setWebsites(data);
      } catch (err) {
        console.error('Failed to load websites:', err);
        setWebsites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWebsites();
  }, []);

  // Check admin status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load preview images
  useEffect(() => {
    if (websites.length === 0) return;

    const loadImages = async () => {
      const initialState: { [key: string]: string | null } = {};
      websites.forEach(site => initialState[site.id] = null);

      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        setWebsiteImages(initialState);
        return;
      }

      const latestImagePerSite: Record<string, string> = {};
      for (const img of images) {
        const parts = img.path.split('/');
        if (parts.length >= 4 && parts[1] === GALLERY_PREFIX) {
          const siteId = `${parts[2]}/${parts[3]}`;
          if (websites.some(s => s.id === siteId) && !latestImagePerSite[siteId]) {
            latestImagePerSite[siteId] = img.path;
          }
        }
      }

      websites.forEach(site => {
        if (latestImagePerSite[site.id]) {
          const url = supabase.storage
            .from('user_images')
            .getPublicUrl(latestImagePerSite[site.id]).data.publicUrl;
          initialState[site.id] = url;
        }
      });

      setWebsiteImages(initialState);
    };

    loadImages();
  }, [websites]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, siteId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(siteId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${siteId}/`;

      const { data: existing } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (existing?.length) {
        const paths = existing.map(img => img.path);
        await Promise.all([
          supabase.storage.from('user_images').remove(paths),
          supabase.from('images').delete().in('path', paths)
        ]);
      }

      const filePath = `${folderPath}${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setWebsiteImages(prev => ({ ...prev, [siteId]: publicUrl }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, siteId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(siteId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Group websites by category and shuffle within each group
  const groupedWebsites: Record<string, WebsiteItem[]> = {};
  websites.forEach(site => {
    if (!groupedWebsites[site.categoryKey]) {
      groupedWebsites[site.categoryKey] = [];
    }
    groupedWebsites[site.categoryKey].push(site);
  });

  // Shuffle sites within each category
  Object.keys(groupedWebsites).forEach(categoryKey => {
    const shuffled = [...groupedWebsites[categoryKey]].sort(() => Math.random() - 0.5);
    groupedWebsites[categoryKey] = shuffled;
  });

  // Get unique categories for the nav bar
  const categories = Object.keys(groupedWebsites).map(key => ({
    key: key,
    name: groupedWebsites[key][0]?.categoryName || key
  }));

  // Filter websites based on selected category
  const displayedWebsites = selectedCategory
    ? groupedWebsites[selectedCategory] || []
    : websites; // Show all if no category selected

  // Create a single array for display, maintaining category grouping
  const displayGroups = selectedCategory
    ? { [selectedCategory]: groupedWebsites[selectedCategory] || [] }
    : groupedWebsites;

  if (loading && websites.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading showcase...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Real Websites. Real Businesses.
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            A curated showcase of live sites built for independent makers, artisans, and service professionals across America.
          </p>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 overflow-x-auto">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>
            {categories.map(({ key, name }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Showcase Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {Object.entries(displayGroups).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No websites found. Create folders under <code className="bg-gray-100 px-1 rounded">app/websites/</code> (e.g., <code>ecommerce/my-store</code>).
          </div>
        ) : (
          Object.entries(displayGroups).map(([categoryKey, sites]) => (
            <div key={categoryKey} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {sites[0]?.categoryName || categoryKey}
              </h2>
              <div className="grid grid-cols-1 gap-8">
                {sites.map((site) => {
                  const imageUrl = websiteImages[site.id] || null;
                  return (
                    <div key={site.id} className="group relative">
                      <Link href={`/websites/${site.id}`} className="block">
                        <div className="aspect-[16/9] sm:aspect-[21/9] overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={site.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              width={1200}
                              height={675}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-gray-400 text-lg font-medium">Preview image pending</div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {site.title}
                          </h3>
                          <p className="mt-1 text-gray-600 text-sm">{site.prompt}</p>
                        </div>
                      </Link>

                      {adminMode && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {!imageUrl && (
                            <button
                              onClick={() => copyPrompt(site.prompt, site.id)}
                              className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700"
                              type="button"
                            >
                              {copiedId === site.id ? 'Copied!' : 'Copy Description'}
                            </button>
                          )}
                          <label className="text-xs bg-blue-600 text-white px-2 py-1 rounded cursor-pointer">
                            {uploading === site.id ? 'Uploading…' : 'Upload Preview'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUpload(e, site.id)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white text-xs px-3 py-2 rounded shadow-lg">
          👤 Admin Mode: Upload preview images for each site
        </div>
      )}
    </div>
  );
}

