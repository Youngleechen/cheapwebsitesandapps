'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { 
  motion, 
  AnimatePresence, 
  useScroll, 
  useTransform,
  useReducedMotion,
  Transition
} from 'framer-motion';
import { 
  ArrowRight, 
  Upload, 
  Shield, 
  Rocket, 
  Target, 
  Zap, 
  TrendingUp, 
  Sparkles, 
  CheckCircle, 
  MessageCircle, 
  Mail 
} from 'lucide-react';

// Initialize Supabase client safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const prefersReducedMotion = useReducedMotion(); // Respect user motion preferences

  // Comprehensive browser feature detection
  const supportsBackdropFilter = useMemo(() => {
    return typeof window !== 'undefined' && 
           CSS.supports('backdrop-filter', 'blur(10px)');
  }, []);

  const supportsCSSGradients = useMemo(() => {
    return typeof window !== 'undefined' && 
           CSS.supports('background-image', 'linear-gradient(to right, #000, #fff)');
  }, []);

  const supportsCSSClipPath = useMemo(() => {
    return typeof window !== 'undefined' && 
           CSS.supports('clip-path', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)');
  }, []);

  // Motion configuration type
  const baseTransition: Transition = {
    duration: prefersReducedMotion ? 0 : 0.5
  };

  // Fetch websites with robust error handling
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        // Fallback to static data if API fails
        const res = await fetch('/api/websites', { cache: 'no-store' });
        
        if (!res.ok) {
          // Fallback static data for critical content
          setWebsites([
            { id: '1', title: 'Enterprise SaaS Platform', prompt: 'Modern dashboard for analytics and workflow management', categoryKey: 'saas', categoryName: 'SaaS Applications' },
            { id: '2', title: 'E-commerce Fashion Brand', prompt: 'High-conversion store with immersive product experiences', categoryKey: 'ecommerce', categoryName: 'E-commerce' },
            { id: '3', title: 'Healthcare Portal', prompt: 'Secure patient management system with telehealth integration', categoryKey: 'healthcare', categoryName: 'Healthcare' },
          ]);
          return;
        }
        
        const data: WebsiteItem[] = await res.json();
        setWebsites(data);
      } catch (err) {
        console.error('Failed to load websites:', err);
        // Fallback to static data
        setWebsites([
          { id: '1', title: 'Enterprise SaaS Platform', prompt: 'Modern dashboard for analytics and workflow management', categoryKey: 'saas', categoryName: 'SaaS Applications' },
          { id: '2', title: 'E-commerce Fashion Brand', prompt: 'High-conversion store with immersive product experiences', categoryKey: 'ecommerce', categoryName: 'E-commerce' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWebsites();
  }, []);

  // Check admin status with session validation
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
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
      const initialState: Record<string, string | null> = {};
      websites.forEach((site) => {
        initialState[site.id] = null;
      });

      try {
        const paths = websites.map((site) => 
          `${ADMIN_USER_ID}/${WEBSITES_PREVIEW_PREFIX}/${site.id}/`
        );
        
        const { data: images, error } = await supabase
          .from('images')
          .select('path, created_at')
          .eq('user_id', ADMIN_USER_ID)
          .or(paths.map(p => `path.like."${p}%"`).join(','))
          .order('created_at', { ascending: false });

        if (error) throw error;

        const latestImagePerSite: Record<string, string> = {};
        for (const img of images) {
          const parts = img.path.split('/');
          if (parts.length >= 5 && parts[1] === WEBSITES_PREVIEW_PREFIX) {
            // Correctly reconstruct site ID format
            const siteId = `${parts[2]}/${parts[3]}`;
            if (!latestImagePerSite[siteId]) {
              latestImagePerSite[siteId] = img.path;
            }
          }
        }

        const updatedState: Record<string, string | null> = { ...initialState };
        for (const site of websites) {
          if (latestImagePerSite[site.id]) {
            try {
              const publicUrl = supabase.storage
                .from('user_images')
                .getPublicUrl(latestImagePerSite[site.id])
                .data.publicUrl;
              updatedState[site.id] = publicUrl;
            } catch (err) {
              console.error('URL generation failed for', site.id, err);
            }
          }
        }
        
        setPreviewImages(updatedState);
      } catch (err) {
        console.error('Error loading preview images:', err);
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

      // Clean up old images
      const { data: oldImages, error: fetchError } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (fetchError) throw fetchError;

      if (oldImages && oldImages.length > 0) {
        const oldPaths = oldImages.map(img => img.path);
        const [storageRes, dbRes] = await Promise.all([
          supabase.storage.from('user_images').remove(oldPaths),
          supabase.from('images').delete().in('path', oldPaths)
        ]);
        
        if (storageRes.error || dbRes.error) {
          throw new Error('Cleanup failed');
        }
      }

      const filePath = `${folderPath}${Date.now()}_${encodeURIComponent(file.name)}`;
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
        
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
        
      if (dbErr) throw dbErr;

      const publicUrl = supabase.storage
        .from('user_images')
        .getPublicUrl(filePath)
        .data.publicUrl;

      setPreviewImages(prev => ({ ...prev, [siteId]: publicUrl }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  };

  // Select 9 high-impact sites with deterministic shuffle
  const featuredSites = useMemo(() => {
    if (websites.length === 0) return [];
    
    // Deterministic shuffle using timestamp
    const shuffled = [...websites].sort(() => 
      0.5 - Math.random() + (Date.now() % 1000) / 10000
    );
    
    return shuffled.slice(0, 9);
  }, [websites]);

  // Professional loading skeleton with reduced motion support
  const SkeletonCard = () => (
    <div className={`bg-white rounded-xl overflow-hidden border border-gray-200 ${
      supportsCSSGradients ? 'shadow-sm' : 'shadow'
    } ${prefersReducedMotion ? '' : 'animate-pulse'}`}>
      <div className={`h-64 ${
        supportsCSSGradients 
          ? 'bg-gradient-to-br from-gray-50 to-gray-100' 
          : 'bg-gray-100'
      }`} />
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
      <div className={`min-h-screen ${
        supportsCSSGradients 
          ? 'bg-gradient-to-b from-gray-50 to-gray-100' 
          : 'bg-gray-50'
      }`}>
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
    <div className={`min-h-screen ${
      supportsCSSGradients ? 'bg-gradient-to-b from-gray-50 to-gray-100' : 'bg-gray-50'
    }`}>
      {/* Hero Section - Ultra Modern with graceful degradation */}
      <motion.div 
        style={{ 
          opacity: backgroundOpacity, 
          scale: !prefersReducedMotion ? heroScale : 1 
        }}
        className={`relative overflow-hidden ${
          supportsCSSGradients
            ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800'
            : 'bg-indigo-900'
        }`}
      >
        {/* Animated Background Elements with fallbacks */}
        <div className="absolute inset-0 opacity-20">
          <div className={`absolute inset-0 ${
            supportsCSSGradients
              ? 'bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]'
              : 'bg-transparent'
          }`} />
          <div className={`absolute inset-0 ${
            supportsCSSGradients
              ? 'bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[size:60px_60px]'
              : 'bg-transparent'
          }`} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={baseTransition}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...baseTransition, delay: 0.2 }}
              className={`inline-flex items-center px-4 py-2 rounded-full mb-6 border ${
                supportsBackdropFilter
                  ? 'bg-white/10 backdrop-blur-sm border-white/20'
                  : 'bg-indigo-800 border-indigo-700'
              }`}
            >
              <Sparkles className="h-4 w-4 text-yellow-300 mr-2 flex-shrink-0" />
              <span className="text-indigo-100 font-medium text-sm">
                Premium Web Solutions for Visionary Businesses
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...baseTransition, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-tight"
            >
              Digital Excellence, <span className="text-yellow-300">Engineered</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...baseTransition, delay: 0.4 }}
              className="text-base md:text-lg text-indigo-100/90 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              We craft high-performance websites that transform digital presence into measurable business growth—combining strategic insight with technical mastery.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...baseTransition, delay: 0.5 }}
              className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4"
            >
              <Link
                href="/websites"
                className={`group relative px-6 py-3 sm:px-8 sm:py-4 font-semibold rounded-xl transition-all duration-300 ${
                  supportsCSSGradients
                    ? 'bg-gradient-to-r from-white to-indigo-100 text-indigo-900 hover:shadow-xl'
                    : 'bg-white text-indigo-900 hover:bg-gray-100'
                }`}
                style={{ minHeight: '48px' }}
              >
                <span className="flex items-center justify-center">
                  Explore Portfolio
                  <ArrowRight className={`ml-2 h-4 w-4 transition-transform duration-300 ${
                    !prefersReducedMotion && 'group-hover:translate-x-1'
                  }`} />
                </span>
              </Link>
              <Link
                href="/get-started"
                className={`group relative px-6 py-3 sm:px-8 sm:py-4 font-bold rounded-xl transition-all duration-300 ${
                  supportsCSSGradients
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:shadow-xl'
                    : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                }`}
                style={{ minHeight: '48px' }}
              >
                <span className="flex items-center justify-center">
                  Let Us Create Your Website
                  <ArrowRight className={`ml-2 h-4 w-4 transition-transform duration-300 ${
                    !prefersReducedMotion && 'group-hover:translate-x-1'
                  }`} />
                </span>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...baseTransition, delay: 0.7 }}
              className="mt-8"
            >
              <Link
                href="/contact"
                className="inline-flex items-center text-indigo-100 hover:text-white font-medium text-sm transition-colors duration-300 py-2"
              >
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Just have a question? Contact us</span>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Floating Preview Grid - Hidden on mobile with fallback */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...baseTransition, delay: 0.7 }}
            className="mt-16 hidden md:block"
          >
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              {featuredSites.slice(0, 3).map((site, index) => {
                const imageUrl = previewImages[site.id];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...baseTransition, delay: 0.8 + index * 0.1 }}
                    whileHover={{ 
                      y: !prefersReducedMotion ? -8 : 0, 
                      scale: !prefersReducedMotion ? 1.02 : 1 
                    }}
                    className={`rounded-xl overflow-hidden border ${
                      supportsBackdropFilter
                        ? 'bg-white/10 backdrop-blur-lg border-white/20 shadow-xl'
                        : 'bg-indigo-800/70 border-indigo-700 shadow-md'
                    } transition-all duration-300`}
                  >
                    <div className="h-40 sm:h-48 md:h-56 relative">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`${site.title} preview`}
                          fill
                          className={`object-cover transition-transform duration-500 ${
                            !prefersReducedMotion && 'group-hover:scale-110'
                          }`}
                          priority={index === 0}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZiIvPjwvc3ZnPg=="
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/placeholder-site.jpg';
                          }}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          supportsCSSGradients
                            ? 'bg-gradient-to-br from-gray-800/30 to-gray-900/40'
                            : 'bg-gray-800'
                        }`}>
                          <span className="text-gray-300 text-sm font-medium px-4 text-center">
                            {uploadingId === site.id ? 'Uploading...' : 'Preview loading...'}
                          </span>
                        </div>
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 sm:p-4 ${
                        !supportsBackdropFilter && 'bg-black/70'
                      }`}>
                        <span className="text-white font-medium text-xs sm:text-sm">{site.title}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Floating Particles with fallback */}
        <div className={`absolute bottom-0 left-0 right-0 h-24 ${
          supportsCSSGradients
            ? 'bg-gradient-to-t from-indigo-900 to-transparent'
            : 'bg-indigo-900'
        } pointer-events-none`} />
      </motion.div>

      {/* Featured Portfolio Grid - Premium Design with touch targets */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
          className="text-center mb-12 sm:mb-20"
        >
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
            className={`inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-medium text-sm mb-3 sm:mb-4 ${
              supportsCSSGradients
                ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700'
                : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            <span>Our Portfolio</span>
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.1, duration: prefersReducedMotion ? 0 : 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6"
          >
            <span className={
              supportsCSSGradients
                ? 'bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-indigo-800'
                : 'text-gray-900'
            }>
              Transforming Digital Experiences
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: prefersReducedMotion ? 0 : 0.5 }}
            className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Each website we create is a strategic asset engineered to achieve specific business objectives—backed by data-driven decisions and meticulous execution.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence>
            {featuredSites.map((site) => {
              const imageUrl = previewImages[site.id];
              const loading = uploadingId === site.id;
              const isHovered = hoveredSite === site.id;

              return (
                <motion.div
                  key={site.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
                  onHoverStart={() => !prefersReducedMotion && setHoveredSite(site.id)}
                  onHoverEnd={() => !prefersReducedMotion && setHoveredSite(null)}
                  className={`group relative rounded-xl overflow-hidden transition-all duration-300 ${
                    supportsCSSGradients
                      ? 'bg-white shadow-lg hover:shadow-2xl border border-gray-100'
                      : 'bg-white shadow border border-gray-200'
                  } ${adminMode ? 'pb-16' : ''}`}
                >
                  <div className="relative h-48 sm:h-64 w-full overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`${site.title} website preview`}
                        fill
                        className={`object-cover transition-transform duration-500 ${
                          !prefersReducedMotion && isHovered ? 'scale-110' : 'scale-100'
                        }`}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZiIvPjwvc3ZnPg=="
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/placeholder-site.jpg';
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        supportsCSSGradients
                          ? 'bg-gradient-to-br from-gray-100 to-gray-200'
                          : 'bg-gray-100'
                      }`}>
                        <div className="text-center px-4">
                          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-pulse ${
                            supportsCSSGradients
                              ? 'bg-gradient-to-br from-indigo-100 to-purple-100'
                              : 'bg-indigo-100'
                          }`}>
                            <span className={`font-bold text-base sm:text-lg ${
                              supportsCSSGradients ? 'text-indigo-600' : 'text-indigo-700'
                            }`}>W</span>
                          </div>
                          <span className="text-gray-500 text-xs sm:text-sm font-medium">
                            {loading ? 'Uploading preview...' : 'Preview unavailable'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Category badge with fallbacks */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
                      className={`absolute top-3 left-3 sm:top-4 sm:left-4 text-xs sm:text-sm font-bold px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full z-10 ${
                        supportsCSSGradients
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-white/20'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {site.categoryName}
                    </motion.div>
                    
                    {/* Hover overlay with touch-friendly sizing */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 sm:p-6 ${
                      !supportsBackdropFilter && 'bg-black/70'
                    }`}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                        className="text-white"
                      >
                        <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{site.title}</h3>
                        <p className="text-gray-200 text-xs sm:text-sm line-clamp-2 mb-3 sm:mb-4">{site.prompt}</p>
                        <div className="flex items-center text-sm font-medium text-indigo-300">
                          View Case Study
                          <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 flex flex-col flex-1">
                    <motion.h3 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: prefersReducedMotion ? 0 : 0.1 }}
                      className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-indigo-700 transition-colors duration-300"
                    >
                      {site.title}
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
                      className="text-gray-600 mb-3 sm:mb-4 flex-1 line-clamp-2 text-sm sm:text-base leading-relaxed"
                    >
                      {site.prompt}
                    </motion.p>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
                      className="mt-auto pt-3 sm:pt-4 border-t border-gray-100"
                    >
                      <Link
                        href={`/websites/${site.id}`}
                        className={`inline-flex items-center font-medium transition-colors duration-300 relative pb-1 min-h-[44px] ${
                          adminMode ? 'mt-4' : ''
                        }`}
                        style={{ minHeight: '48px', padding: '0.75rem 0' }}
                      >
                        <span className="text-indigo-700 hover:text-indigo-900 group-hover/link:text-indigo-900">View Case Study</span>
                        <ArrowRight className={`ml-2 h-4 w-4 transition-transform duration-300 ${
                          !prefersReducedMotion && 'group-hover/link:translate-x-1'
                        }`} />
                        <span className={`absolute bottom-0 left-0 right-0 h-0.5 transition-transform duration-300 origin-left ${
                          supportsCSSGradients
                            ? 'bg-gradient-to-r from-indigo-400 to-purple-500'
                            : 'bg-indigo-500'
                        } transform scale-x-0 group-hover/link:scale-x-100`} />
                      </Link>
                    </motion.div>
                  </div>

                  {adminMode && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: prefersReducedMotion ? 0 : 0.4 }}
                      className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t ${
                        supportsCSSGradients
                          ? 'bg-gradient-to-t from-indigo-50 to-transparent border-indigo-100'
                          : 'bg-indigo-50 border-indigo-200'
                      }`}
                    >
                      <label className="block text-center cursor-pointer">
                        <span className="text-indigo-600 font-medium text-xs sm:text-sm hover:text-indigo-800 transition-colors flex items-center justify-center gap-1.5 sm:gap-2">
                          {loading ? (
                            <>
                              <span className="flex items-center">
                                <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-indigo-500 mr-1.5 sm:mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 4.418 3.582 8 8 8v-4a4 4 0 00-4-4z"></path>
                                </svg>
                                <span>Uploading...</span>
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-200 group-hover:scale-110" />
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
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.6, duration: prefersReducedMotion ? 0 : 0.5 }}
          className="text-center mt-12 sm:mt-16"
        >
          <Link
            href="/websites"
            className={`inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 font-bold rounded-xl transition-all duration-300 ${
              supportsCSSGradients
                ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg hover:shadow-2xl'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow'
            } ${!prefersReducedMotion && 'hover:scale-105'}`}
            style={{ minHeight: '48px' }}
          >
            <span>Explore All {websites.length} Projects</span>
            <ArrowRight className={`ml-2 h-4 w-4 ${
              !prefersReducedMotion && 'group-hover:translate-x-1 transition-transform duration-300'
            }`} />
          </Link>
        </motion.div>
      </div>

      {/* Value Proposition Section - Premium Design with fallbacks */}
      <div className={`py-16 sm:py-24 overflow-hidden relative ${
        supportsCSSGradients
          ? 'bg-gradient-to-b from-gray-50 to-gray-100'
          : 'bg-gray-50'
      }`}>
        <div className="absolute inset-0 opacity-5" style={{ 
          backgroundImage: supportsCSSGradients ? "url('/grid-pattern.svg')" : "none",
          backgroundColor: !supportsCSSGradients ? "#f3f4f6" : "transparent"
        }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 sm:mb-20">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
              className={`inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-medium text-sm mb-3 sm:mb-4 ${
                supportsCSSGradients
                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700'
                  : 'bg-purple-50 text-purple-700'
              }`}
            >
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span>Our Process</span>
            </motion.span>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.1, duration: prefersReducedMotion ? 0 : 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6"
            >
              <span className={
                supportsCSSGradients
                  ? 'bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-purple-800'
                  : 'text-gray-900'
              }>
                The WhyNoWebsite Methodology
              </span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: prefersReducedMotion ? 0 : 0.5 }}
              className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
            >
              We blend strategic thinking with technical excellence to deliver websites that drive measurable business results and sustainable growth.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20">
            {[{
              icon: Target,
              title: "Strategic Discovery",
              desc: "Deep business analysis to understand your unique challenges and align digital strategy with core objectives.",
              color: supportsCSSGradients ? "from-indigo-500 to-purple-600" : "bg-indigo-600"
            },
            {
              icon: Rocket,
              title: "Precision Execution",
              desc: "Meticulous design and development focusing on performance, user experience, and conversion optimization.",
              color: supportsCSSGradients ? "from-purple-500 to-pink-600" : "bg-purple-600"
            },
            {
              icon: TrendingUp,
              title: "Growth Partnership",
              desc: "Ongoing optimization and strategic guidance to ensure your digital presence evolves with your business.",
              color: supportsCSSGradients ? "from-pink-500 to-rose-600" : "bg-pink-600"
            }].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.3 + i * 0.1, duration: prefersReducedMotion ? 0 : 0.5 }}
                  whileHover={{ y: !prefersReducedMotion ? -10 : 0 }}
                  className={`bg-white p-5 sm:p-8 rounded-xl ${
                    supportsCSSGradients ? 'shadow-md hover:shadow-xl' : 'shadow border border-gray-100'
                  } transition-all duration-300`}
                >
                  <div className={`p-3 sm:p-4 rounded-xl inline-block mb-4 sm:mb-6 ${
                    supportsCSSGradients
                      ? `bg-gradient-to-br ${item.color}`
                      : item.color
                  }`}>
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
          
          {/* Client Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-20 max-w-4xl mx-auto">
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
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.6 + i * 0.1, duration: prefersReducedMotion ? 0 : 0.4 }}
                className={`flex items-start p-4 sm:p-6 rounded-xl ${
                  i % 2 === 0 
                    ? supportsCSSGradients 
                      ? 'bg-gradient-to-br from-indigo-50 to-purple-50' 
                      : 'bg-indigo-50'
                    : supportsCSSGradients 
                      ? 'bg-gradient-to-br from-purple-50 to-pink-50' 
                      : 'bg-purple-50'
                }`}
              >
                <div className="flex-shrink-0 mr-3 sm:mr-4 mt-0.5 sm:mt-1">
                  <CheckCircle className={`h-4 w-4 sm:h-6 sm:w-6 ${
                    supportsCSSGradients ? 'text-indigo-600' : 'text-indigo-700'
                  }`} />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">{benefit.title}</h4>
                  <p className="text-gray-600 text-sm sm:text-base">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.8, duration: prefersReducedMotion ? 0 : 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              whileHover={{ scale: !prefersReducedMotion ? 1.02 : 1 }}
              whileTap={{ scale: !prefersReducedMotion ? 0.98 : 1 }}
            >
              <Link
                href="/get-started"
                className={`inline-flex items-center justify-center px-6 py-3 sm:px-10 sm:py-5 font-bold text-base sm:text-lg rounded-xl transition-all duration-300 ${
                  supportsCSSGradients
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-2xl hover:shadow-3xl'
                    : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow-lg'
                }`}
                style={{ minHeight: '48px' }}
              >
                <span>Let Us Create Your Website</span>
                <ArrowRight className={`ml-2 h-4 w-4 sm:ml-3 sm:h-6 sm:w-6 ${
                  !prefersReducedMotion && 'group-hover:translate-x-1 transition-transform duration-300'
                }`} />
              </Link>
            </motion.div>
            <p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg">
              Ready to transform your digital presence? Get started today and we'll create a website that drives real business results.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.9, duration: prefersReducedMotion ? 0 : 0.5 }}
            className="text-center mt-6 sm:mt-8"
          >
            <Link
              href="/contact"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-base sm:text-lg transition-colors duration-300 py-2"
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span>Have questions first? Get in touch</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* CTA Section - Focused on Website Creation */}
      <div className={`py-16 sm:py-20 ${
        supportsCSSGradients
          ? 'bg-gradient-to-br from-indigo-900 to-purple-900'
          : 'bg-indigo-900'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
          >
            <span className="text-indigo-200 font-medium text-xs sm:text-sm tracking-wide uppercase mb-3 sm:mb-4 block">
              Ready to transform your digital presence?
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Your <span className="text-yellow-300">Website Awaits</span>
            </h2>
            <p className="text-base sm:text-lg text-indigo-100/90 mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Fill out our simple form and we'll create a custom website proposal tailored to your business goals. We respond within 24 hours to get your project started.
            </p>
            
            <motion.div
              whileHover={{ scale: !prefersReducedMotion ? 1.05 : 1 }}
              whileTap={{ scale: !prefersReducedMotion ? 0.95 : 1 }}
              className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 items-center"
            >
              <Link
                href="/get-started"
                className={`inline-flex items-center px-6 py-3 sm:px-10 sm:py-5 font-bold text-base sm:text-lg rounded-xl transition-all duration-300 ${
                  supportsCSSGradients
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-2xl hover:shadow-3xl'
                    : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow-lg'
                }`}
                style={{ minHeight: '48px' }}
              >
                <span>Get Started Now</span>
                <ArrowRight className={`ml-2 h-4 w-4 sm:ml-3 sm:h-6 sm:w-6 ${
                  !prefersReducedMotion && 'group-hover:translate-x-1 transition-transform duration-300'
                }`} />
              </Link>
              
              <Link
                href="/contact"
                className={`inline-flex items-center px-5 py-2.5 sm:px-8 sm:py-4 font-semibold rounded-xl transition-all duration-300 ${
                  supportsBackdropFilter
                    ? 'bg-transparent border-2 border-white/80 backdrop-blur-sm hover:bg-white/10'
                    : 'bg-white/10 border-2 border-white hover:bg-white/20'
                } text-white`}
                style={{ minHeight: '48px' }}
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span>Contact Us</span>
              </Link>
            </motion.div>
            
            <p className="mt-6 text-indigo-200/80 text-sm sm:text-base">
              Not ready to start a project? We're happy to answer your questions and provide guidance.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Admin mode indicator - Elegant with fallbacks */}
      <AnimatePresence>
        {adminMode && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 sm:bottom-8 right-4 sm:right-8 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm font-medium z-50 flex items-center gap-1.5 sm:gap-2 ${
              supportsCSSGradients
                ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-2xl'
                : 'bg-indigo-700 text-white shadow-lg'
            } ${supportsBackdropFilter && 'backdrop-blur-sm'}`}
          >
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>Admin Mode Active</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}