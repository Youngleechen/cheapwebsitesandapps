// app/websites/[category]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

export default function CategoryWebsitesPage() {
  const params = useParams();
  const categoryKey = typeof params?.category === 'string' ? params.category : '';
  
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [websiteImages, setWebsiteImages] = useState<{ [key: string]: string | null }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string>('');

  // Fetch all websites and filter by category
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const res = await fetch('/api/websites');
        if (!res.ok) throw new Error('Failed to fetch websites');
        const allWebsites: WebsiteItem[] = await res.json();
        const filtered = allWebsites.filter(site => site.categoryKey === categoryKey);
        setWebsites(filtered);
        if (filtered.length > 0) {
          setCategoryName(filtered[0].categoryName);
        }
      } catch (err) {
        console.error('Failed to load websites:', err);
        setWebsites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWebsites();
  }, [categoryKey]);

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

  // Load preview images for this category’s sites
  useEffect(() => {
    if (websites.length === 0) return;

    const loadImages = async () => {
      const initialState: { [key: string]: string | null } = {};
      websites.forEach(site => initialState[site.id] = null);

      // Fetch only images relevant to these site IDs
      const pathsToMatch = websites.map(site => `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${site.id}/`);
      const orConditions = pathsToMatch.map(p => `path.like."${p}%"`).join(',');
      
      // Unfortunately, Supabase doesn't support dynamic `or` with many likes easily,
      // so we'll fetch all gallery images and filter client-side (acceptable if total images are modest)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading {categoryName || 'category'}...</div>
      </div>
    );
  }

  // Optional: redirect or show 404 if category has no sites
  if (websites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h2>
            <p className="text-gray-600 mb-6">
              There are no websites in the &ldquo;{categoryKey}&rdquo; category.
            </p>
            <Link
              href="/websites"
              className="text-blue-600 hover:underline font-medium"
            >
              ← Browse all websites
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero / Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
              <p className="mt-1 text-gray-600">
                {websites.length} website{websites.length !== 1 ? 's' : ''} in this category
              </p>
            </div>
            <Link
              href="/websites"
              className="mt-3 sm:mt-0 text-sm text-blue-600 hover:underline"
            >
              ← View all categories
            </Link>
          </div>
        </div>
      </div>

      {/* Website Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {websites.map((site) => {
            const imageUrl = websiteImages[site.id] || null;
            return (
              <div key={site.id} className="group relative">
                <Link href={`/websites/${site.id}`} className="block">
                  <div className="aspect-[16/9] overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md">
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
                        <div className="text-gray-400 text-lg font-medium">
                          Preview image pending
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {site.title}
                    </h3>
                    <p className="mt-1 text-gray-600 text-sm line-clamp-2">
                      {site.prompt}
                    </p>
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

      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white text-xs px-3 py-2 rounded shadow-lg">
          👤 Admin Mode
        </div>
      )}
    </div>
  );
}