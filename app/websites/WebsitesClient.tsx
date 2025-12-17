// app/websites/WebsitesClient.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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

function normalizeCategoryKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, '-');
}

function seededShuffle<T>(array: T[], seedMinutes = 5): T[] {
  const now = new Date();
  const block = Math.floor(now.getTime() / (1000 * 60 * seedMinutes));
  let seed = block;

  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor((Math.sin(seed++) * 10000 + 10000) % (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function WebsitesClient({
  initialCategory,
}: {
  initialCategory: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ Safe inside Client Component

  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [websiteImages, setWebsiteImages] = useState<{ [key: string]: string | null }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  // Sync selected category with URL
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);

  const updateCategoryInURL = (categoryKey: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryKey) {
      params.set('category', categoryKey);
    } else {
      params.delete('category');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Fetch websites (keep using your API route for now)
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

  const handleCategorySelect = (categoryKey: string | null) => {
    setSelectedCategory(categoryKey);
    updateCategoryInURL(categoryKey);
    setShowMore(false);
  };

  const filteredWebsites = useMemo(() => {
    if (!selectedCategory) return websites;
    return websites.filter(
      site => normalizeCategoryKey(site.categoryKey) === normalizeCategoryKey(selectedCategory)
    );
  }, [websites, selectedCategory]);

  const groupedWebsites = useMemo(() => {
    const groups: Record<string, WebsiteItem[]> = {};
    const sitesToGroup = selectedCategory ? filteredWebsites : websites;

    sitesToGroup.forEach(site => {
      if (!groups[site.categoryKey]) {
        groups[site.categoryKey] = [];
      }
      groups[site.categoryKey].push(site);
    });

    Object.keys(groups).forEach(key => {
      groups[key] = seededShuffle(groups[key], 5);
    });

    return groups;
  }, [websites, filteredWebsites, selectedCategory]);

  const allCategories = useMemo(() => {
    const uniqueCategories = [...new Set(websites.map(site => site.categoryKey))];
    return uniqueCategories.map(key => {
      const firstSite = websites.find(site => site.categoryKey === key);
      return {
        key,
        name: firstSite?.categoryName || key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [websites]);

  const VISIBLE_CATEGORY_COUNT = 5;
  const visibleCategories = allCategories.slice(0, VISIBLE_CATEGORY_COUNT);
  const hiddenCategories = allCategories.slice(VISIBLE_CATEGORY_COUNT);

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
            A curated showcase of live sites built for independent makers, artisans, and service professionals across the world.
          </p>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>

            {visibleCategories.map(({ key, name }) => (
              <button
                key={key}
                onClick={() => handleCategorySelect(key)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  normalizeCategoryKey(selectedCategory || '') === normalizeCategoryKey(key)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {name}
              </button>
            ))}

            {hiddenCategories.length > 0 && (
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                >
                  More ▼
                </button>

                {showMore && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-20">
                    <div className="py-1">
                      {hiddenCategories.map(({ key, name }) => (
                        <button
                          key={key}
                          onClick={() => handleCategorySelect(key)}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            normalizeCategoryKey(selectedCategory || '') === normalizeCategoryKey(key)
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Showcase Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {Object.keys(groupedWebsites).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {selectedCategory ? (
              <div>
                <p className="mb-4">
                  No websites found in category "<span className="font-medium">{selectedCategory}</span>".
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Available categories: {allCategories.map(c => c.name).join(', ')}
                </p>
                <button
                  onClick={() => handleCategorySelect(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View All Categories
                </button>
              </div>
            ) : (
              <div>
                No websites found. Create folders under <code className="bg-gray-100 px-1 rounded">app/websites/</code>.
              </div>
            )}
          </div>
        ) : (
          Object.entries(groupedWebsites).map(([categoryKey, sites]) => (
            <div key={categoryKey} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {sites[0]?.categoryName || categoryKey}
                {selectedCategory && (
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className="ml-4 text-sm font-normal text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    ← Back to all categories
                  </button>
                )}
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