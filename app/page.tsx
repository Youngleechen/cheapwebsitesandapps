'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const HOMEPAGE_PREVIEW_PREFIX = 'homepage_preview';

// Define your microsites structure as a config object (mirroring your PowerShell map)
// This is the source of truth for the homepage grid
const MICRO_SITES = [
  // E-commerce
  {
    id: 'luxury-candle-brand-artisan-fragrance',
    category: 'E-commerce',
    name: 'Meadow & Moss Candles',
    tagline: 'Artisanal soy candles with botanical fragrance notes',
    badge: '🛒 E-commerce + Storytelling',
  },
  {
    id: 'sustainable-fashion-boutique',
    category: 'E-commerce',
    name: 'Verdant Threads',
    tagline: 'Ethically made linen wear for conscious women',
    badge: '🌱 Sustainable + Shopify',
  },
  {
    id: 'gourmet-coffee-roastery',
    category: 'E-commerce',
    name: 'Haven Roasters',
    tagline: 'Single-origin beans roasted in small batches',
    badge: '☕ Subscription Ready',
  },

  // Local Business
  {
    id: 'modern-hair-salon-booking',
    category: 'Local Business',
    name: 'Luma Salon Co.',
    tagline: 'Luxury cuts, color & online booking in Austin',
    badge: '✂️ Booking + Gallery',
  },
  {
    id: 'boutique-fitness-studio',
    category: 'Local Business',
    name: 'Apex Movement',
    tagline: 'Strength & mobility coaching for active adults',
    badge: '💪 Class Scheduler',
  },
  {
    id: 'artistic-tattoo-parlor',
    category: 'Local Business',
    name: 'Kairos Tattoo Studio',
    name: 'Kairos Tattoo Studio',
    tagline: 'Fine-line & neo-traditional art by appointment',
    badge: '🖤 Portfolio + Consult Form',
  },

  // Professional Services
  {
    id: 'executive-coach',
    category: 'Professional Services',
    name: 'Clara Voss Coaching',
    tagline: 'Leadership clarity for tech founders & CEOs',
    badge: '🧠 High-Ticket Offers',
  },
  {
    id: 'architectural-design-studio',
    category: 'Professional Services',
    name: 'Terra Forma Studio',
    tagline: 'Residential architecture with sustainable vision',
    badge: '📐 Project Showcase',
  },

  // Creative Portfolio
  {
    id: 'editorial-photographer-portfolio',
    category: 'Creative Portfolio',
    name: 'Elias Reed Photography',
    tagline: 'Documentary-style wedding & editorial work',
    badge: '📸 Fullscreen Gallery',
  },
];

type PreviewState = {
  [key: string]: string | null; // image URL or null
};

export default function HomePage() {
  const [previewImages, setPreviewImages] = useState<PreviewState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Check admin status on mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load preview images from Supabase
  useEffect(() => {
    const loadPreviews = async () => {
      const initialState: PreviewState = {};
      MICRO_SITES.forEach((site) => {
        initialState[site.id] = null;
      });

      if (!adminMode) {
        // For public users: fetch latest image for each microsite
        const paths = MICRO_SITES.map((site) => `${ADMIN_USER_ID}/${HOMEPAGE_PREVIEW_PREFIX}/${site.id}/`);
        const { data: images, error } = await supabase
          .from('images')
          .select('path, created_at')
          .eq('user_id', ADMIN_USER_ID)
          .or(paths.map(p => `path.like."${p}%"`).join(','))
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading homepage previews:', error);
          setPreviewImages(initialState);
          return;
        }

        const latestImagePerSite: Record<string, string> = {};
        for (const img of images) {
          const parts = img.path.split('/');
          if (parts.length >= 4 && parts[1] === HOMEPAGE_PREVIEW_PREFIX) {
            const siteId = parts[2];
            if (!latestImagePerSite[siteId]) {
              latestImagePerSite[siteId] = img.path;
            }
          }
        }

        const updatedState: PreviewState = { ...initialState };
        MICRO_SITES.forEach((site) => {
          if (latestImagePerSite[site.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerSite[site.id]).data.publicUrl;
            updatedState[site.id] = url;
          }
        });
        setPreviewImages(updatedState);
      } else {
        // Admin: load same way but allow uploads
        setPreviewImages(initialState);
        // Trigger actual load
        const paths = MICRO_SITES.map((site) => `${ADMIN_USER_ID}/${HOMEPAGE_PREVIEW_PREFIX}/${site.id}/`);
        const { data: images } = await supabase
          .from('images')
          .select('path, created_at')
          .eq('user_id', ADMIN_USER_ID)
          .or(paths.map(p => `path.like."${p}%"`).join(','))
          .order('created_at', { ascending: false });

        const latestImagePerSite: Record<string, string> = {};
        for (const img of images || []) {
          const parts = img.path.split('/');
          if (parts.length >= 4 && parts[1] === HOMEPAGE_PREVIEW_PREFIX) {
            const siteId = parts[2];
            if (!latestImagePerSite[siteId]) {
              latestImagePerSite[siteId] = img.path;
            }
          }
        }

        const updatedState: PreviewState = { ...initialState };
        MICRO_SITES.forEach((site) => {
          if (latestImagePerSite[site.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerSite[site.id]).data.publicUrl;
            updatedState[site.id] = url;
          }
        });
        setPreviewImages(updatedState);
      }
    };

    loadPreviews();
  }, [adminMode]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, siteId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(siteId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${HOMEPAGE_PREVIEW_PREFIX}/${siteId}/`;
      const filePath = `${folderPath}${Date.now()}_${file.name}`;

      // Clean up old images for this site
      const { data: oldImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (oldImages && oldImages.length > 0) {
        const oldPaths = oldImages.map(img => img.path);
        await Promise.all([
          supabase.storage.from('user_images').remove(oldPaths),
          supabase.from('images').delete().in('path', oldPaths)
        ]);
      }

      // Upload new image
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setPreviewImages(prev => ({ ...prev, [siteId]: publicUrl }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  }, [adminMode]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Banner — Minimal but punchy */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-800 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Your Business, <span className="text-yellow-300">Perfectly Framed</span>
          </h1>
          <p className="mt-6 text-xl max-w-2xl mx-auto opacity-90">
            High-impact websites for discerning small businesses—built fast, launched flawlessly.
          </p>
        </div>
      </div>

      {/* Microsite Preview Grid */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Real Businesses. Real Results.</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              These aren’t templates—they’re live sites we built for real founders who demanded more than “just a website.”
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {MICRO_SITES.map((site) => {
              const imageUrl = previewImages[site.id];
              const loading = uploadingId === site.id;

              // Use a subtle gradient placeholder while loading or if no image
              const placeholder = (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm text-center px-2">
                    {loading ? 'Uploading…' : 'Loading preview…'}
                  </span>
                </div>
              );

              return (
                <div
                  key={site.id}
                  className="group flex flex-col rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                >
                  {/* Image Preview — Always present, never flickers */}
                  <div className="relative h-64 w-full bg-gray-50">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`${site.name} website preview`}
                        fill
                        className="object-cover"
                        priority={false}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZiIvPjwvc3ZnPg=="
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/placeholder-site.jpg';
                        }}
                      />
                    ) : (
                      placeholder
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1 bg-white">
                    <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                      {site.category}
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-gray-900">{site.name}</h3>
                    <p className="mt-2 text-gray-600 text-sm flex-1">{site.tagline}</p>
                    <div className="mt-3">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {site.badge}
                      </span>
                    </div>
                    <Link
                      href={`/websites/${site.category.toLowerCase().replace(/\s+/g, '-')}/${site.id}`}
                      className="mt-4 w-full py-2 bg-gray-900 text-white text-center rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      View Site
                    </Link>
                  </div>

                  {/* Admin Upload (only visible in admin mode) */}
                  {adminMode && (
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
                      <label className="block text-xs text-center text-purple-700 font-medium cursor-pointer hover:underline">
                        {loading ? 'Uploading…' : 'Edit Preview'}
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
      </div>

      {/* Bottom CTA */}
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">This Could Be You — Live in 5 Days</h2>
          <p className="mt-4 text-lg text-gray-600">
            We handle design, copy, SEO, and speed. You get a site that attracts clients—not just looks pretty.
          </p>
          <div className="mt-8">
            <Link
              href="mailto:seivadyoung@gmail.com?subject=I want my CheapWebsites site"
              className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity"
            >
              Get Your Site Built
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Notice */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          👤 Admin Mode: Upload homepage previews
        </div>
      )}
    </div>
  );
}