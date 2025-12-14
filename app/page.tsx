'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const WEBSITES_PREVIEW_PREFIX = 'websites_preview';

type WebsiteItem = {
  id: string;
  title: string;
  prompt: string;
  categoryKey: string;
  categoryName: string;
};

export default function HomePage() {
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [previewImages, setPreviewImages] = useState<Record<string, string | null>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);

  // Fetch websites from your existing API
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const res = await fetch('/api/websites');
        if (!res.ok) throw new Error('Failed to fetch websites');
        const data: WebsiteItem[] = await res.json();
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

  // Load preview images using your established path structure
  useEffect(() => {
    if (websites.length === 0) return;

    const loadPreviews = async () => {
      const initialState: Record<string, string | null> = {};
      websites.forEach((site) => {
        initialState[site.id] = null;
      });

      const paths = websites.map((site) => `${ADMIN_USER_ID}/${WEBSITES_PREVIEW_PREFIX}/${site.id}/`);
      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .or(paths.map(p => `path.like."${p}%"`).join(','))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading preview images:', error);
        setPreviewImages(initialState);
        return;
      }

      const latestImagePerSite: Record<string, string> = {};
      for (const img of images) {
        const parts = img.path.split('/');
        if (parts.length >= 5 && parts[1] === WEBSITES_PREVIEW_PREFIX) {
          // Reconstruct id: category/site-name
          const siteId = `${parts[2]}/${parts[3]}`;
          if (!latestImagePerSite[siteId]) {
            latestImagePerSite[siteId] = img.path;
          }
        }
      }

      const updatedState: Record<string, string | null> = { ...initialState };
      websites.forEach((site) => {
        if (latestImagePerSite[site.id]) {
          const url = supabase.storage
            .from('user_images')
            .getPublicUrl(latestImagePerSite[site.id]).data.publicUrl;
          updatedState[site.id] = url;
        }
      });
      setPreviewImages(updatedState);
    };

    loadPreviews();
  }, [websites]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, siteId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(siteId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${WEBSITES_PREVIEW_PREFIX}/${siteId}/`;

      // Clean up old images
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
      setPreviewImages(prev => ({ ...prev, [siteId]: publicUrl }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  };

  // Select 9 high-impact sites (shuffle + slice)
  const featuredSites = useMemo(() => {
    if (websites.length === 0) return [];
    // Optional: prioritize certain categories or IDs
    const shuffled = [...websites].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 9);
  }, [websites]);

  // Professional loading skeleton
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      <div className="h-64 bg-gray-100" />
      <div className="p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-full mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );

  if (loading && websites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="h-12 w-48 bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-gray-200 rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(9)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Banner - More sophisticated */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-purple-800/90 opacity-95" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-block px-4 py-1 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <span className="text-indigo-200 font-medium text-sm">
                Premium Web Solutions for Ambitious Businesses
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
              Digital Excellence, <span className="text-yellow-300">Delivered</span>
            </h1>
            
            <p className="text-xl text-indigo-100/90 mb-8">
              We craft high-performance websites that convert visitors into loyal customers—combining strategic design with technical precision.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/websites"
                className="px-8 py-4 bg-white text-indigo-900 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Explore Our Work
              </Link>
              <Link
                href="mailto:seivadyoung@gmail.com?subject=I want my CheapWebsites site"
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                Schedule Consultation
              </Link>
            </div>
          </motion.div>
          
          <div className="mt-16 hidden md:block">
            <div className="grid grid-cols-3 gap-4">
              {featuredSites.slice(0, 3).map((site, index) => {
                const imageUrl = previewImages[site.id];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 * index }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10"
                  >
                    <div className="h-48 relative">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`${site.title} preview`}
                          fill
                          className="object-cover"
                          priority={index === 0}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">Preview loading...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Grid - Professional layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-16"
        >
          <span className="text-indigo-600 font-semibold text-sm tracking-wide uppercase mb-4 block">
            Our Portfolio
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Transforming Digital Experiences
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Each website we create is a strategic asset designed to achieve specific business objectives—backed by data-driven decisions and meticulous execution. [[12]]
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {featuredSites.map((site) => {
              const imageUrl = previewImages[site.id];
              const loading = uploadingId === site.id;
              const isHovered = hoveredSite === site.id;

              return (
                <motion.div
                  key={site.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  onHoverStart={() => setHoveredSite(site.id)}
                  onHoverEnd={() => setHoveredSite(null)}
                  className={`group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 ${
                    adminMode ? 'pb-16' : ''
                  }`}
                >
                  <div className="relative h-64 w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`${site.title} website preview`}
                        fill
                        className={`object-cover transition-transform duration-500 ${
                          isHovered ? 'scale-105' : ''
                        }`}
                        priority={false}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZiIvPjwvc3ZnPg=="
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/placeholder-site.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center px-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto mb-4 animate-pulse" />
                          <span className="text-gray-500 text-sm font-medium">
                            {loading ? 'Uploading preview...' : 'Preview unavailable'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Category badge */}
                    <div className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {site.categoryName}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                      {site.title}
                    </h3>
                    <p className="text-gray-600 mb-4 flex-1 line-clamp-2 text-base">
                      {site.prompt}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <Link
                        href={`/websites/${site.id}`}
                        className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors duration-300 group/link"
                      >
                        <span>View Case Study</span>
                        <svg 
                          className="ml-2 h-4 w-4 transform group-hover/link:translate-x-1 transition-transform duration-300" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {adminMode && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-50 to-transparent p-4 border-t border-purple-100">
                      <label className="block text-center">
                        <span className="text-purple-700 font-medium text-sm cursor-pointer hover:text-purple-900 transition-colors flex items-center justify-center gap-2">
                          {loading ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 4.418 3.582 8 8 8v-4a4 4 0 00-4-4z"></path>
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Update Preview
                            </>
                          )}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, site.id)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/websites"
            className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-300"
          >
            <span>View all {websites.length} case studies</span>
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Value proposition section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-indigo-600 font-semibold text-sm tracking-wide uppercase mb-4 block">
              Our Process
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Precision-Crafted Digital Solutions
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              We blend strategic thinking with technical expertise to deliver websites that don't just look beautiful—they drive measurable business results.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  title: "Strategic Planning",
                  desc: "Deep business analysis to align your digital presence with core objectives",
                  icon: "🎯"
                },
                {
                  title: "Expert Execution",
                  desc: "Meticulous design and development with performance and conversion focus",
                  icon: "⚡"
                },
                {
                  title: "Ongoing Growth",
                  desc: "Data-driven optimization and strategic guidance for continuous improvement",
                  icon: "📈"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
            
            <Link
              href="mailto:seivadyoung@gmail.com?subject=I want my CheapWebsites site"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
            >
              <span>Begin Your Digital Transformation</span>
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Admin mode indicator - more subtle */}
      <AnimatePresence>
        {adminMode && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-medium z-50 flex items-center gap-2 backdrop-blur-sm border border-indigo-300/20"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Admin Mode Active
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}  