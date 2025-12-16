'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useScroll, useTransform, MotionConfig, useReducedMotion } from 'framer-motion';
import { ArrowRight, Upload, Shield, Rocket, Target, Zap, TrendingUp, Sparkles, CheckCircle, MessageCircle, Mail } from 'lucide-react';

// Initialize Supabase client with safe fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const WEBSITES_PREVIEW_PREFIX = 'websites_preview';

type WebsiteItem = {
  id: string;
  title: string;
  prompt: string;
  categoryKey: string;
  categoryName: string;
};

// Safe fallback image URL
const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==';

export default function HomePage() {
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [previewImages, setPreviewImages] = useState<Record<string, string | null>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);
  const [touchDevice, setTouchDevice] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion();
  
  // Safe scroll transforms with fallbacks
  const { scrollY } = useScroll();
  const backgroundOpacity = useTransform(scrollY, [0, 100], [1, prefersReducedMotion ? 1 : 0.95]);
  const heroScale = useTransform(scrollY, [0, 200], [1, prefersReducedMotion ? 1 : 0.98]);
  
  // Fallback values for unsupported browsers
  const [heroOpacityFallback, setHeroOpacityFallback] = useState(1);
  const [heroScaleFallback, setHeroScaleFallback] = useState(1);

  // Detect touch device
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      (navigator as any).msMaxTouchPoints > 0;
    setTouchDevice(isTouchDevice);
  }, []);

  // Update fallback values on scroll
  useEffect(() => {
    const updateFallbacks = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setHeroOpacityFallback(Math.max(0.95, 1 - (scrollTop / 100) * 0.05));
      setHeroScaleFallback(Math.max(0.98, 1 - (scrollTop / 200) * 0.02));
    };

    window.addEventListener('scroll', updateFallbacks);
    return () => window.removeEventListener('scroll', updateFallbacks);
  }, []);

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
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user.id || null;
        setUserId(uid);
        setAdminMode(uid === ADMIN_USER_ID);
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };
    checkUser();
  }, []);

  // Load preview images using your established path structure
  useEffect(() => {
    if (!supabase || websites.length === 0) return;

    const loadPreviews = async () => {
      const initialState: Record<string, string | null> = {};
      websites.forEach((site) => {
        initialState[site.id] = null;
      });

      try {
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
        if (images) {
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
      } catch (error) {
        console.error('Failed to load previews:', error);
        setPreviewImages(initialState);
      }
    };

    loadPreviews();
  }, [websites]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, siteId: string) => {
    if (!adminMode || !supabase) return;
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
      setImageErrors(prev => ({ ...prev, [siteId]: false }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  };

  // Handle image errors
  const handleImageError = (siteId: string) => {
    setImageErrors(prev => ({ ...prev, [siteId]: true }));
  };

  // Select 9 high-impact sites (shuffle + slice)
  const featuredSites = useMemo(() => {
    if (websites.length === 0) return [];
    const shuffled = [...websites].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 9);
  }, [websites]);

  // Safe motion component that works even if framer-motion fails
  const SafeMotionDiv = motion.div || ((props: any) => <div {...props} />);

  // Professional loading skeleton
  const SkeletonCard = () => (
    <div 
      className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm animate-pulse" 
      style={{ minHeight: '380px' }}
    >
      <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100" />
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="h-12 w-48 bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-gray-200 rounded mx-auto animate-pulse" />
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
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - Ultra Modern with Compatibility */}
        <div 
          className="relative overflow-hidden bg-indigo-900" 
          style={{
            background: `
              linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #831843 100%),
              radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1), transparent 70%)
            `,
            backgroundColor: '#4c1d95', // Fallback solid color
          }}
        >
          {/* Compatibility wrapper for motion effects */}
          <SafeMotionDiv 
            style={{ 
              opacity: backgroundOpacity,
              scale: heroScale,
            }}
            className="relative w-full h-full"
          >
            {/* Static fallback styles for unsupported browsers */}
            <div 
              className="absolute inset-0"
              style={{
                opacity: heroOpacityFallback,
                transform: `scale(${heroScaleFallback})`,
              }}
            />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
              <div className="text-center max-w-4xl mx-auto">
                {/* Reduced motion alternative for animations */}
                <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full mb-8 border border-white/20 backdrop-blur">
                  <Sparkles className="h-4 w-4 text-yellow-300 mr-2" />
                  <span className="text-indigo-200 font-medium text-sm">
                    Premium Web Solutions for Visionary Businesses
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-tight">
                  Digital Excellence, <span className="text-yellow-300">Engineered</span>
                </h1>
                
                <p className="text-lg md:text-2xl text-indigo-100 mb-12 max-w-3xl mx-auto leading-relaxed">
                  We craft high-performance websites that transform digital presence into measurable business growth—combining strategic insight with technical mastery.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    href="/websites"
                    className="group relative px-8 py-4 bg-white text-indigo-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-h-[56px] flex items-center justify-center"
                    style={{ minWidth: '48px' }}
                  >
                    <span className="flex items-center justify-center">
                      Explore Portfolio
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Link>
                  <Link
                    href="/get-started"
                    className="group relative px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-h-[56px] flex items-center justify-center"
                    style={{ minWidth: '48px' }}
                  >
                    <span className="flex items-center justify-center">
                      Let Us Create Your Website
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Link>
                </div>
                
                <div className="mt-6">
                  <Link
                    href="/contact"
                    className="inline-flex items-center text-white hover:text-white font-medium text-sm transition-colors duration-300 py-2"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    <span>Just have a question? Contact us</span>
                  </Link>
                </div>
              </div>
              
              {/* Floating Preview Grid - Hidden on very small screens */}
              <div className="mt-20 hidden md:block">
                <div className="grid grid-cols-3 gap-4">
                  {featuredSites.slice(0, 3).map((site, index) => {
                    const imageUrl = previewImages[site.id];
                    const hasError = imageErrors[site.id];
                    return (
                      <div
                        key={index}
                        className="bg-white/20 backdrop-blur rounded-xl overflow-hidden border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <div className="h-56 relative">
                          {imageUrl && !hasError ? (
                            <Image
                              src={imageUrl}
                              alt={`${site.title} preview`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              onError={() => handleImageError(site.id)}
                              priority={index === 0}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800/30 to-gray-900/40 flex items-center justify-center">
                              <span className="text-gray-300 text-sm font-medium">Preview loading...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </SafeMotionDiv>
        </div>

        {/* Featured Portfolio Grid - Premium Design */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full font-medium text-sm mb-4">
              <Shield className="h-4 w-4 mr-2" />
              Our Portfolio
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Transforming Digital Experiences
            </h2>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Each website we create is a strategic asset engineered to achieve specific business objectives—backed by data-driven decisions and meticulous execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredSites.map((site) => {
              const imageUrl = previewImages[site.id];
              const loading = uploadingId === site.id;
              const hasError = imageErrors[site.id];

              return (
                <div
                  key={site.id}
                  className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                  onTouchStart={() => touchDevice && setHoveredSite(site.id)}
                  onClick={() => touchDevice && setHoveredSite(site.id === hoveredSite ? null : site.id)}
                  style={{ minHeight: '500px' }}
                >
                  <div className="relative h-64 w-full bg-gray-100 overflow-hidden">
                    {imageUrl && !hasError ? (
                      <Image
                        src={imageUrl}
                        alt={`${site.title} website preview`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => handleImageError(site.id)}
                        placeholder="blur"
                        blurDataURL={FALLBACK_IMAGE}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center px-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                            <span className="text-indigo-600 font-bold text-lg">W</span>
                          </div>
                          <span className="text-gray-500 text-sm font-medium">
                            {loading ? 'Uploading preview...' : 'Preview unavailable'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Category badge */}
                    <div className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg z-10 border border-white/20">
                      {site.categoryName}
                    </div>
                    
                    {/* Touch-friendly overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6 transition-opacity duration-300 ${
                      touchDevice 
                        ? (hoveredSite === site.id ? 'opacity-100' : 'opacity-0') 
                        : 'group-hover:opacity-100 opacity-0'
                    }`}>
                      <div className="text-white">
                        <h3 className="text-2xl font-bold mb-2">{site.title}</h3>
                        <p className="text-gray-200 line-clamp-2 mb-4">{site.prompt}</p>
                        <div className="flex items-center text-sm font-medium text-indigo-300">
                          View Case Study
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {site.title}
                    </h3>
                    <p className="text-gray-600 mb-4 flex-1 line-clamp-2 text-base leading-relaxed">
                      {site.prompt}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <Link
                        href={`/websites/${site.id}`}
                        className="inline-flex items-center text-indigo-700 font-medium hover:text-indigo-900 transition-colors duration-300 group/link relative pb-1 min-h-[48px]"
                      >
                        <span>View Case Study</span>
                        <ArrowRight className="ml-2 h-4 w-4 transform group-hover/link:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>

                  {adminMode && (
                    <div className="bottom-0 left-0 right-0 bg-indigo-50 p-4 border-t border-indigo-100">
                      <label className="block text-center cursor-pointer">
                        <span className="text-indigo-600 font-medium text-sm hover:text-indigo-800 transition-colors flex items-center justify-center gap-2 min-h-[44px]">
                          {loading ? (
                            <>
                              <div className="h-4 w-4 animate-spin text-indigo-500">
                                <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                                  <path stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 4.418 3.582 8 8 8v-4a4 4 0 00-4-4z" />
                                </svg>
                              </div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
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
                </div>
              );
            })}
          </div>

          <div className="text-center mt-16">
            <Link
              href="/websites"
              className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-h-[56px]"
            >
              <span>Explore All {websites.length} Projects</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>

        {/* Value Proposition Section */}
        <div className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center justify-center px-4 py-2 bg-purple-50 text-purple-700 rounded-full font-medium text-sm mb-4">
                <Zap className="h-4 w-4 mr-2" />
                Our Process
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                The WhyNoWebsite Methodology
              </h2>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                We blend strategic thinking with technical excellence to deliver websites that drive measurable business results and sustainable growth.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              {[{
                icon: Target,
                title: "Strategic Discovery",
                desc: "Deep business analysis to understand your unique challenges and align digital strategy with core objectives.",
                color: "from-indigo-500 to-purple-600"
              },
              {
                icon: Rocket,
                title: "Precision Execution",
                desc: "Meticulous design and development focusing on performance, user experience, and conversion optimization.",
                color: "from-purple-500 to-pink-600"
              },
              {
                icon: TrendingUp,
                title: "Growth Partnership",
                desc: "Ongoing optimization and strategic guidance to ensure your digital presence evolves with your business.",
                color: "from-pink-500 to-rose-600"
              }].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 min-h-[300px]"
                  >
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 inline-block mb-6">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
            
            {/* Client Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 max-w-4xl mx-auto">
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
                <div
                  key={i}
                  className="flex items-start p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50"
                >
                  <div className="flex-shrink-0 mr-4 mt-1">
                    <CheckCircle className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">{benefit.title}</h4>
                    <p className="text-gray-600">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center max-w-3xl mx-auto">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center px-10 py-5 bg-yellow-400 text-gray-900 font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 min-h-[64px] w-full sm:w-auto"
              >
                <span>Let Us Create Your Website</span>
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
              <p className="mt-6 text-gray-600 text-lg">
                Ready to transform your digital presence? Get started today and we'll create a website that drives real business results.
              </p>
            </div>
            
            <div className="text-center mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-base transition-colors duration-300 py-2"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                <span>Have questions first? Get in touch</span>
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 bg-indigo-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div>
              <span className="text-indigo-200 font-medium text-sm tracking-wide uppercase mb-4 block">
                Ready to transform your digital presence?
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Your <span className="text-yellow-300">Website Awaits</span>
              </h2>
              <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                Fill out our simple form and we'll create a custom website proposal tailored to your business goals. We respond within 24 hours to get your project started.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
                <Link
                  href="/get-started"
                  className="inline-flex items-center px-10 py-5 bg-yellow-400 text-gray-900 font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 min-h-[64px] w-full sm:w-auto justify-center"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
                
                <Link
                  href="/contact"
                  className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 min-h-[56px] w-full sm:w-auto justify-center"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  <span>Contact Us</span>
                </Link>
              </div>
              
              <p className="mt-8 text-indigo-200 text-base">
                Not ready to start a project? We're happy to answer your questions and provide guidance.
              </p>
            </div>
          </div>
        </div>

        {/* Admin mode indicator */}
        {adminMode && (
          <div className="fixed bottom-8 right-8 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium z-50 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Admin Mode Active</span>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}