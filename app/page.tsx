'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Upload, Shield, Rocket, Target, Zap, TrendingUp, Sparkles, CheckCircle, MessageCircle, Mail } from 'lucide-react';

// Feature detection for older browsers
const supportsBackdropFilter = typeof window !== 'undefined' && CSS.supports('backdrop-filter', 'blur(10px)');
const supportsCSSGradients = typeof window !== 'undefined' && CSS.supports('background-image', 'linear-gradient(to right, #000, #fff)');
const supportsCSSClipPath = typeof window !== 'undefined' && CSS.supports('clip-path', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)');

// Fallback motion component for older browsers
import { ReactNode, Ref, HTMLAttributes, DetailedHTMLProps, HTMLMotionProps, motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// Props that are safe to pass to a plain div
type DivProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

interface SafeMotionProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

const SafeMotion = ({
  children,
  initial = {},
  animate = {},
  transition = {},
  whileHover = {},
  whileTap = {},
  style,
  className,
  ref,
  key,
  ...restProps
}: SafeMotionProps) => {
  const [isClient, setIsClient] = useState(false);
  const [hasReducedMotion, setHasReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
      setHasReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  // Check if we should skip animations
  const shouldSkipMotion =
    !isClient ||
    hasReducedMotion ||
    (typeof window !== 'undefined' && !window.IntersectionObserver);

  if (shouldSkipMotion) {
    // Only pass valid HTML div props to fallback div
    const fallbackProps: DivProps = {
      style: style as React.CSSProperties | undefined, // Cast animated style to static
      className,
      ref: ref as Ref<HTMLDivElement> | undefined,
      key,
      ...restProps,
    };

    // Remove any Framer-specific or invalid props
    delete (fallbackProps as any).animate;
    delete (fallbackProps as any).initial;
    delete (fallbackProps as any).transition;
    delete (fallbackProps as any).whileHover;
    delete (fallbackProps as any).whileTap;
    delete (fallbackProps as any)['data-framer-appear-id'];

    return <div {...fallbackProps}>{children}</div>;
  }

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition}
      whileHover={whileHover}
      whileTap={whileTap}
      style={style}
      className={className}
      ref={ref}
      key={key}
      {...restProps}
    >
      {children}
    </motion.div>
  );
};

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
  const { scrollY } = useScroll();
  const backgroundOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);
  const heroScale = useTransform(scrollY, [0, 200], [1, 0.98]);
  const isMounted = useRef(false);

  // Fetch websites from your existing API with proper error handling
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const res = await fetch('/api/websites');
        if (!res.ok) {
          console.error('Failed to fetch websites:', res.statusText);
          setWebsites([]);
          return;
        }
        const data: WebsiteItem[] = await res.json();
        setWebsites(data || []);
      } catch (err) {
        console.error('Failed to load websites:', err);
        setWebsites([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (!isMounted.current) {
      fetchWebsites();
      isMounted.current = true;
    }
  }, []);

  // Check admin status
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id || null;
        setUserId(uid);
        setAdminMode(uid === ADMIN_USER_ID);
      } catch (err) {
        console.error('Auth check failed:', err);
        setUserId(null);
        setAdminMode(false);
      }
    };
    checkUser();
  }, []);

  // Load preview images with robust error handling
  useEffect(() => {
    if (websites.length === 0) return;

    const loadPreviews = async () => {
      try {
        const initialState: Record<string, string | null> = {};
        websites.forEach((site) => {
          initialState[site.id] = null;
        });

        const paths = websites.map((site) => `${ADMIN_USER_ID}/${WEBSITES_PREVIEW_PREFIX}/${site.id}/`);
        const pathConditions = paths.map(p => `path.like."${p}%"`).join(',');

        const { data: images, error } = await supabase
          .from('images')
          .select('path, created_at')
          .eq('user_id', ADMIN_USER_ID)
          .or(pathConditions)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading preview images:', error);
          setPreviewImages(initialState);
          return;
        }

        const latestImagePerSite: Record<string, string> = {};
        for (const img of images || []) {
          const parts = img.path?.split('/') || [];
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
      } catch (err) {
        console.error('Preview loading failed:', err);
        const initialState: Record<string, string | null> = {};
        websites.forEach((site) => {
          initialState[site.id] = null;
        });
        setPreviewImages(initialState);
      }
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

      // Clean up old images with error handling
      try {
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
          ]).catch(err => console.warn('Cleanup warning:', err));
        }
      } catch (cleanupErr) {
        console.warn('Cleanup failed but continuing upload:', cleanupErr);
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
    const shuffled = [...websites].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 9);
  }, [websites]);

  // Professional loading skeleton with fallbacks
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm animate-pulse">
      <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200" />
      <div className="p-6">
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-2" />
        <div className="h-6 bg-gray-300 rounded w-2/3 mb-3" />
        <div className="h-4 bg-gray-300 rounded w-full mb-4" />
        <div className="h-4 bg-gray-300 rounded w-1/4" />
      </div>
    </div>
  );

  if (loading && websites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="h-12 w-48 bg-gray-300 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-gray-300 rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Ultra Modern with fallbacks */}
      <div 
        className="relative overflow-hidden bg-indigo-900"
        style={{ 
          background: supportsCSSGradients 
            ? 'linear-gradient(to bottom right, #4f46e5, #7c3aed, #db2777)' 
            : '#4f46e5'
        }}
      >
        {/* Animated Background Elements - fallback for older browsers */}
        <div className="absolute inset-0 opacity-20">
          {supportsCSSGradients && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[size:60px_60px]" />
            </>
          )}
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <SafeMotion
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-block"
            >
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full mb-8 ${
                  supportsBackdropFilter 
                    ? 'bg-white/10 backdrop-blur-sm border border-white/20' 
                    : 'bg-indigo-800/80 border border-white/30'
                }`}
              >
                <Sparkles className="h-4 w-4 text-yellow-300 mr-2 flex-shrink-0" />
                <span className="text-indigo-200 font-medium text-sm">
                  Premium Web Solutions for Visionary Businesses
                </span>
              </div>
            </SafeMotion>
            
            <SafeMotion
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="block mb-8"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
                Digital Excellence, <span className="text-yellow-300">Engineered</span>
              </h1>
            </SafeMotion>
            
            <SafeMotion
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="block mb-12"
            >
              <p className="text-lg md:text-xl text-indigo-100/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                We craft high-performance websites that transform digital presence into measurable business growth—combining strategic insight with technical mastery.
              </p>
            </SafeMotion>
            
            <SafeMotion
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mb-8"
            >
              <Link
                href="/websites"
                className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-white to-indigo-100 text-indigo-900 font-semibold rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden min-w-[200px] h-12 flex items-center justify-center"
                aria-label="Explore Portfolio"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Explore Portfolio
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                </span>
              </Link>
              <Link
                href="/get-started"
                className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden min-w-[200px] h-12 flex items-center justify-center"
                aria-label="Let Us Create Your Website"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Let Us Create Your Website
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                </span>
              </Link>
            </SafeMotion>
            
            <SafeMotion
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-6"
            >
              <Link
                href="/contact"
                className="inline-flex items-center text-white/80 hover:text-white font-medium text-sm transition-colors duration-300"
                aria-label="Contact us with questions"
              >
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
                <span>Just have a question? Contact us</span>
              </Link>
            </SafeMotion>
          </div>
          
          {/* Floating Preview Grid - simplified for mobile */}
          <SafeMotion
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-16 hidden md:block"
          >
            <div className="grid grid-cols-3 gap-6">
              {featuredSites.slice(0, 3).map((site, index) => {
                const imageUrl = previewImages[site.id];
                return (
                  <SafeMotion
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -4 }} // Reduced movement for older devices
                    className={`bg-white/10 rounded-2xl overflow-hidden border border-white/20 shadow-lg ${
                      supportsBackdropFilter ? 'backdrop-blur-lg' : ''
                    }`}
                  >
                    <div className="h-48 sm:h-56 relative">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`${site.title} preview`}
                          fill
                          className="object-cover"
                          priority={index === 0}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800/30 to-gray-900/40 flex items-center justify-center">
                          <span className="text-gray-300 text-sm font-medium">Preview loading...</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 sm:p-4">
                        <span className="text-white font-medium text-xs sm:text-sm">{site.title}</span>
                      </div>
                    </div>
                  </SafeMotion>
                );
              })}
            </div>
          </SafeMotion>
        </div>

        {/* Floating Particles - simplified fallback */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-indigo-900 to-transparent pointer-events-none" />
      </div>

      {/* Featured Portfolio Grid - Premium Design with fallbacks */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <span className="inline-flex items-center justify-center px-4 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full font-medium text-xs sm:text-sm mb-4">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
            Our Portfolio
          </span>
          
          <h2 className="text-3xl sm:text-4xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Transforming Digital Experiences
          </h2>
          
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
            Each website we create is a strategic asset engineered to achieve specific business objectives—backed by data-driven decisions and meticulous execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredSites.map((site) => {
            const imageUrl = previewImages[site.id];
            const loading = uploadingId === site.id;

            return (
              <SafeMotion
                key={site.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4 }}
                className={`group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 ${
                  adminMode ? 'pb-16' : ''
                }`}
                onHoverStart={() => setHoveredSite(site.id)}
                onHoverEnd={() => setHoveredSite(null)}
              >
                <div className="relative h-48 sm:h-64 w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`${site.title} website preview`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      priority={false}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZiIvPjwvc3ZnPg=="
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder-site.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center px-3 sm:px-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-2 sm:mb-4 animate-pulse">
                          <span className="text-indigo-600 font-bold text-base sm:text-lg">W</span>
                        </div>
                        <span className="text-gray-500 text-xs sm:text-sm font-medium">
                          {loading ? 'Uploading preview...' : 'Preview unavailable'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Category badge with gradient fallback */}
                  <div
                    className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-indigo-600 text-white text-xs font-bold px-2.5 py-0.5 sm:px-4 sm:py-1.5 rounded-full shadow z-10 border border-white/20"
                    style={{
                      background: supportsCSSGradients 
                        ? 'linear-gradient(to right, #4f46e5, #7c3aed)' 
                        : '#4f46e5'
                    }}
                  >
                    {site.categoryName}
                  </div>
                  
                  {/* Hover overlay - touch-friendly */}
                  <button
                    onClick={() => window.location.href = `/websites/${site.id}`}
                    className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 sm:p-6 touch-callout-none"
                    aria-label={`View case study for ${site.title}`}
                  >
                    <div className="text-white">
                      <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{site.title}</h3>
                      <p className="text-gray-200 text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-4">{site.prompt}</p>
                      <div className="flex items-center text-xs sm:text-sm font-medium text-indigo-300">
                        View Case Study
                        <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                      </div>
                    </div>
                  </button>
                </div>

                <div className="p-4 sm:p-6 flex flex-col flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2 group-hover:text-indigo-700 transition-colors duration-300">
                    {site.title}
                  </h3>
                  <p className="text-gray-600 mb-3 sm:mb-4 flex-1 line-clamp-2 text-sm sm:text-base leading-relaxed">
                    {site.prompt}
                  </p>
                  
                  <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-100">
                    <Link
                      href={`/websites/${site.id}`}
                      className="inline-flex items-center text-indigo-700 font-medium hover:text-indigo-900 transition-colors duration-300 group/link relative pb-0.5 sm:pb-1"
                      aria-label={`View case study for ${site.title}`}
                    >
                      <span className="relative z-10">View Case Study</span>
                      <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 transform group-hover/link:translate-x-0.5 sm:group-hover/link:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                {adminMode && (
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-indigo-50 p-3 sm:p-4 border-t border-indigo-100"
                    style={{
                      background: supportsCSSGradients 
                        ? 'linear-gradient(to top, #eef2ff, transparent)' 
                        : '#eef2ff'
                    }}
                  >
                    <label className="block text-center cursor-pointer">
                      <span className="text-indigo-600 font-medium text-xs sm:text-sm hover:text-indigo-800 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 group">
                        {loading ? (
                          <span>Uploading...</span>
                        ) : (
                          <>
                            <Upload className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
                            <span>Update Preview</span>
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
              </SafeMotion>
            );
          })}
        </div>

        <SafeMotion
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-12 sm:mt-16"
        >
          <Link
            href="/websites"
            className="inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] transform group min-w-[220px] justify-center"
            aria-label={`Explore all ${websites.length} projects`}
          >
            <span>Explore All {websites.length} Projects</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
          </Link>
        </SafeMotion>
      </div>

      {/* Value Proposition Section - Premium Design with fallbacks */}
      <div className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center justify-center px-4 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 rounded-full font-medium text-xs sm:text-sm mb-4">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
              Our Process
            </span>
            
            <h2 className="text-3xl sm:text-4xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              The WhyNoWebsite Methodology
            </h2>
            
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
              We blend strategic thinking with technical excellence to deliver websites that drive measurable business results and sustainable growth.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16">
            {[{
              icon: Target,
              title: "Strategic Discovery",
              desc: "Deep business analysis to understand your unique challenges and align digital strategy with core objectives.",
              color: "indigo-500"
            },
            {
              icon: Rocket,
              title: "Precision Execution",
              desc: "Meticulous design and development focusing on performance, user experience, and conversion optimization.",
              color: "purple-500"
            },
            {
              icon: TrendingUp,
              title: "Growth Partnership",
              desc: "Ongoing optimization and strategic guidance to ensure your digital presence evolves with your business.",
              color: "pink-500"
            }].map((item, i) => {
              const Icon = item.icon;
              return (
                <SafeMotion
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                  whileHover={{ y: -4 }} // Reduced movement
                  className="bg-white p-5 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
                >
                  <div className={`p-3 sm:p-4 rounded-xl bg-${item.color} inline-block mb-4 sm:mb-6`}>
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                </SafeMotion>
              );
            })}
          </div>
          
          {/* Client Benefits Grid - simplified for mobile */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-16 max-w-4xl mx-auto">
            {[{
              title: "95%+ Client Satisfaction",
              desc: "Our commitment to quality and communication ensures exceptional results."
            },
            {
              title: "48-Hour Response Guarantee",
              desc: "We prioritize your project and maintain clear communication throughout."
            },
            {
              title: "Performance-First Approach",
              desc: "Every site is optimized for speed, SEO, and conversion from day one."
            },
            {
              title: "Strategic Growth Focus",
              desc: "We build websites that scale with your business and drive real ROI."
            }].map((benefit, i) => (
              <SafeMotion
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                className={`flex items-start p-4 sm:p-6 rounded-lg ${
                  i % 2 === 0 
                    ? 'bg-indigo-50' 
                    : 'bg-purple-50'
                }`}
              >
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5">{benefit.title}</h4>
                  <p className="text-gray-600 text-sm">{benefit.desc}</p>
                </div>
              </SafeMotion>
            ))}
          </div>
          
          <SafeMotion
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center px-6 py-3 sm:px-10 sm:py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group min-w-[240px] h-12 sm:h-auto"
              aria-label="Let Us Create Your Website"
            >
              <span>Let Us Create Your Website</span>
              <ArrowRight className="ml-2 h-4 w-4 sm:ml-3 sm:h-5 sm:w-5 group-hover:translate-x-0.5 sm:group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
            </Link>
            <p className="mt-4 sm:mt-6 text-gray-600 text-sm sm:text-base">
              Ready to transform your digital presence? Get started today and we'll create a website that drives real business results.
            </p>
          </SafeMotion>
          
          <SafeMotion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="text-center mt-6 sm:mt-8"
          >
            <Link
              href="/contact"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors duration-300"
              aria-label="Contact us with questions"
            >
              <MessageCircle className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
              <span>Have questions first? Get in touch</span>
            </Link>
          </SafeMotion>
        </div>
      </div>

      {/* CTA Section - Focused on Website Creation with fallbacks */}
      <div className="py-16 sm:py-20 bg-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div>
            <span className="text-indigo-200 font-medium text-xs sm:text-sm tracking-wide uppercase mb-3 sm:mb-4 block">
              Ready to transform your digital presence?
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
              Your <span className="text-yellow-300">Website Awaits</span>
            </h2>
            <p className="text-base sm:text-lg text-indigo-100/90 mb-8 max-w-2xl mx-auto leading-relaxed px-2">
              Fill out our simple form and we'll create a custom website proposal tailored to your business goals. We respond within 24 hours to get your project started.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 items-center mb-8">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center px-6 py-3 sm:px-10 sm:py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-base sm:text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group min-w-[220px] h-12"
                aria-label="Get Started Now"
              >
                <span>Get Started Now</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:ml-3 sm:h-5 sm:w-5 group-hover:translate-x-0.5 sm:group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
              </Link>
              
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 bg-transparent border-2 border-white/80 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 min-w-[200px] h-12"
                aria-label="Contact Us"
              >
                <Mail className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
                <span>Contact Us</span>
              </Link>
            </div>
            
            <p className="text-indigo-200/80 text-sm">
              Not ready to start a project? We're happy to answer your questions and provide guidance.
            </p>
          </div>
        </div>
      </div>

      {/* Admin mode indicator - Elegant with fallbacks */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 bg-indigo-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-lg text-xs sm:text-sm font-medium z-50 flex items-center gap-1.5 sm:gap-2">
          <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
          <span>Admin Mode Active</span>
        </div>
      )}
    </div>
  );
}