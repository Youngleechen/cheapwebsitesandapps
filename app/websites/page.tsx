'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'websites_preview'; // Dedicated prefix for website previews

// Define your sample websites as "artworks"
// Each `id` should match the folder name under `/websites/`
const WEBSITES = [
  {
    id: 'lumen-forge',
    title: 'Lumen Forge Glass',
    prompt: 'Hand-blown stained glass studio crafting luminous windows and lighting • Asheville, NC',
  },
  {
    id: 'alpine-canine',
    title: 'Alpine Canine',
    prompt: 'Elite mountain search-and-rescue dog training and wilderness recovery services • Boulder, CO',
  },
  {
    id: 'salt-river-sailing',
    title: 'Salt River Sailing',
    prompt: 'Private sunset sails, coastal charters, and beginner lessons on historic wooden schooners • Newport, RI',
  },
  {
    id: 'ember-bakery',
    title: 'Ember Bakery',
    // You can get very niche — this adds credibility
    prompt: 'Wood-fired sourdough and heritage grain pastries, baked hourly in a 1920s brick kiln • Traverse City, MI',
  },
  {
    id: 'verdant-threads',
    title: 'Verdant Threads',
    prompt: 'Botanical textile studio using rainwater-dyed silks and natural indigo for slow fashion • Portland, OR',
  },
  {
    id: 'oak-and-iron',
    title: 'Oak & Iron',
    prompt: 'Custom forged fireplace tools, door hardware, and sculptural home accents • Santa Fe, NM',
  },
];

type WebsiteState = { [key: string]: { image_url: string | null } };

export default function WebsitesShowcase() {
  const [websites, setWebsites] = useState<WebsiteState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check if user is admin
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
    const loadImages = async () => {
      const initialState: WebsiteState = {};
      WEBSITES.forEach(site => initialState[site.id] = { image_url: null });

      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load website previews:', error);
        setWebsites(initialState);
        return;
      }

      const latestImagePerSite: Record<string, string> = {};
      if (images) {
        for (const img of images) {
          const parts = img.path.split('/');
          if (parts.length >= 4 && parts[1] === GALLERY_PREFIX) {
            const siteId = parts[2];
            if (WEBSITES.some(s => s.id === siteId) && !latestImagePerSite[siteId]) {
              latestImagePerSite[siteId] = img.path;
            }
          }
        }

        WEBSITES.forEach(site => {
          if (latestImagePerSite[site.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerSite[site.id]).data.publicUrl;
            initialState[site.id] = { image_url: url };
          }
        });
      }

      setWebsites(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, siteId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(siteId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${siteId}/`;

      // Clean up old images for this site
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
      setWebsites(prev => ({ ...prev, [siteId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload preview image.');
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

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 gap-8">
          {WEBSITES.map((site) => {
            const data = websites[site.id] || { image_url: null };
            const imageUrl = data.image_url;

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
                        // Critical: prevent layout shift
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
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {site.title}
                    </h2>
                    <p className="mt-1 text-gray-600 text-sm">{site.prompt}</p>
                  </div>
                </Link>

                {/* Admin Controls */}
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
          👤 Admin Mode: Upload preview images for each site
        </div>
      )}
    </div>
  );
}