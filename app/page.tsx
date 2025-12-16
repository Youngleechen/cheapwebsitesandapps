'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Upload, Shield, Rocket, Target, Zap, TrendingUp, Sparkles, CheckCircle, MessageCircle, Mail } from 'lucide-react';

// Add this at the top to detect older devices
const isOldDevice = () => {
  // Simple detection for older mobile devices
  const ua = navigator.userAgent.toLowerCase();
  const isOldAndroid = ua.includes('android') && !ua.includes('chrome');
  const isOldIos = ua.includes('iphone') || ua.includes('ipad');
  const isOldBrowser = !('CSS' in window) || !CSS.supports('backdrop-filter', 'blur(10px)');
  
  return isOldAndroid || isOldIos || isOldBrowser || window.innerWidth < 320;
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
  
  // Add state for device detection
  const [isOldPhone, setIsOldPhone] = useState(false);

  // Detect old devices on mount
  useEffect(() => {
    setIsOldPhone(isOldDevice());
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
    const shuffled = [...websites].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 9);
  }, [websites]);

  // Enhanced loading skeleton with better mobile support
  const SkeletonCard = () => (
    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-sm animate-pulse">
      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 md:h-64" />
      <div className="p-4 md:p-6">
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-full mb-3" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );

  if (loading && websites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <div className="h-8 w-32 bg-gray-200 rounded mx-auto mb-3 md:mb-4 animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
      {/* Hero Section - Ultra Modern with Old Phone Fallback */}
      <motion.div 
        style={{ 
          opacity: backgroundOpacity, 
          scale: isOldPhone ? 1 : heroScale 
        }}
        className={`relative overflow-hidden ${
          isOldPhone 
            ? 'bg-indigo-900' 
            : 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800'
        }`}
      >
        {/* Animated Background Elements - Only for modern devices */}
        {!isOldPhone && (
          <>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[size:60px_60px]" />
            </div>
          </>
        )}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`inline-flex items-center px-3 py-1.5 rounded-full mb-6 ${
                isOldPhone 
                  ? 'bg-white/20 text-indigo-100' 
                  : 'bg-white/10 backdrop-blur-sm border border-white/20'
              }`}
            >
              <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-yellow-300 mr-1.5 md:mr-2" />
              <span className={`font-medium text-xs md:text-sm ${
                isOldPhone ? 'text-white/90' : 'text-indigo-200'
              }`}>
                Premium Web Solutions for Visionary Businesses
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className={`font-bold text-white mb-6 ${
                isOldPhone 
                  ? 'text-3xl md:text-4xl' 
                  : 'text-4xl md:text-6xl lg:text-7xl tracking-tight leading-tight'
              }`}
            >
              Digital Excellence, <span className="text-yellow-300">Engineered</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className={`mb-8 ${
                isOldPhone 
                  ? 'text-base text-white/80' 
                  : 'text-lg md:text-xl text-indigo-100/90 leading-relaxed'
              }`}
            >
              We craft high-performance websites that transform digital presence into measurable business growth—combining strategic insight with technical mastery.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 mb-6"
            >
              <Link
                href="/websites"
                className={`group relative px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                  isOldPhone
                    ? 'bg-white text-indigo-900'
                    : 'bg-gradient-to-r from-white to-indigo-100 text-indigo-900 hover:shadow-xl'
                }`}
              >
                <span className="flex items-center justify-center">
                  Explore Portfolio
                  <ArrowRight className={`ml-1 h-3 w-3 md:h-4 md:w-4 ${
                    !isOldPhone && 'group-hover:translate-x-1 transition-transform duration-300'
                  }`} />
                </span>
              </Link>
              <Link
                href="/get-started"
                className={`group relative px-6 py-3 font-bold rounded-lg transition-all duration-300 ${
                  isOldPhone
                    ? 'bg-yellow-400 text-gray-900'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:shadow-xl'
                }`}
              >
                <span className="flex items-center justify-center">
                  Let Us Create Your Website
                  <ArrowRight className={`ml-1 h-3 w-3 md:h-4 md:w-4 ${
                    !isOldPhone && 'group-hover:translate-x-1 transition-transform duration-300'
                  }`} />
                </span>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-4"
            >
              <Link
                href="/contact"
                className={`inline-flex items-center ${
                  isOldPhone
                    ? 'text-white/70 hover:text-white'
                    : 'text-white/80 hover:text-white'
                } font-medium text-xs md:text-sm transition-colors duration-300`}
              >
                <Mail className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                <span>Just have a question? Contact us</span>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Floating Preview Grid - Only for desktop and modern devices */}
          {!isOldPhone && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mt-12 hidden md:block"
            >
              <div className="grid grid-cols-3 gap-4">
                {featuredSites.slice(0, 3).map((site, index) => {
                  const imageUrl = previewImages[site.id];
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                      whileHover={!isOldPhone ? { y: -8, scale: 1.02 } : {}}
                      className={`rounded-xl overflow-hidden shadow-md ${
                        isOldPhone
                          ? 'border border-white/20'
                          : 'bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300'
                      }`}
                    >
                      <div className="h-40 md:h-56 relative">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={`${site.title} preview`}
                            fill
                            className={`object-cover ${
                              !isOldPhone && 'transition-transform duration-500 hover:scale-110'
                            }`}
                            priority={index === 0}
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            isOldPhone 
                              ? 'bg-gray-800/40' 
                              : 'bg-gradient-to-br from-gray-800/30 to-gray-900/40'
                          }`}>
                            <span className={`text-xs md:text-sm font-medium ${
                              isOldPhone ? 'text-gray-200' : 'text-gray-300'
                            }`}>Preview loading...</span>
                          </div>
                        )}
                        <div className={`absolute inset-0 ${
                          isOldPhone 
                            ? 'bg-gradient-to-t from-black/50 to-transparent' 
                            : 'bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300'
                        } flex items-end p-3`}>
                          <span className={`font-medium text-xs md:text-sm ${
                            isOldPhone ? 'text-white' : 'text-white'
                          }`}>{site.title}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Floating Particles - Only for modern devices */}
        {!isOldPhone && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-indigo-900 to-transparent pointer-events-none" />
        )}
      </motion.div>

      {/* Featured Portfolio Grid - Premium Design with Old Phone Fallback */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-20"
        >
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full font-medium text-xs md:text-sm mb-3 md:mb-4 ${
              isOldPhone
                ? 'bg-gray-100 text-indigo-700'
                : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700'
            }`}
          >
            <Shield className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Our Portfolio
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={`font-bold mb-4 ${
              isOldPhone
                ? 'text-2xl md:text-3xl text-gray-900'
                : 'text-3xl md:text-4xl lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-indigo-800'
            }`}
          >
            Transforming Digital Experiences
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={`text-gray-600 ${
              isOldPhone
                ? 'text-sm leading-relaxed'
                : 'text-lg md:text-xl max-w-3xl mx-auto leading-relaxed'
            }`}
          >
            Each website we create is a strategic asset engineered to achieve specific business objectives—backed by data-driven decisions and meticulous execution.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                  transition={{ duration: 0.5 }}
                  onHoverStart={() => !isOldPhone && setHoveredSite(site.id)}
                  onHoverEnd={() => setHoveredSite(null)}
                  className={`group relative rounded-xl overflow-hidden transition-all duration-300 ${
                    isOldPhone
                      ? 'bg-white border border-gray-200 shadow-sm'
                      : 'bg-white shadow-lg hover:shadow-2xl border border-gray-100'
                  } ${adminMode ? 'pb-14 md:pb-16' : ''}`}
                >
                  <div className={`relative h-48 w-full overflow-hidden ${
                    isOldPhone ? 'bg-gray-100' : 'bg-gradient-to-br from-gray-50 to-gray-100'
                  }`}>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`${site.title} website preview`}
                        fill
                        className={`object-cover ${
                          !isOldPhone && `transition-transform duration-500 ${
                            isHovered ? 'scale-110' : 'scale-100'
                          }`
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
                      <div className={`w-full h-full flex items-center justify-center ${
                        isOldPhone ? 'bg-gray-100' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                      }`}>
                        <div className="text-center px-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                            isOldPhone
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600'
                          } animate-pulse`}>
                            <span className="font-bold text-base md:text-lg">W</span>
                          </div>
                          <span className={`text-xs md:text-sm font-medium ${
                            isOldPhone ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            {loading ? 'Uploading preview...' : 'Preview unavailable'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Category badge with gradient - simplified for old phones */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-full font-bold text-xs z-10 ${
                        isOldPhone
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg border border-white/20'
                      }`}
                    >
                      {site.categoryName}
                    </motion.div>
                    
                    {/* Hover overlay - disabled on old phones */}
                    {!isOldPhone && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileHover={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-white"
                        >
                          <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">{site.title}</h3>
                          <p className="text-gray-200 text-xs md:text-sm line-clamp-2 mb-3 md:mb-4">{site.prompt}</p>
                          <div className="flex items-center text-xs md:text-sm font-medium text-indigo-300">
                            View Case Study
                            <ArrowRight className="ml-1.5 h-3 w-3 md:h-4 md:w-4" />
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 md:p-6 flex flex-col flex-1">
                    <motion.h3 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className={`font-bold mb-1.5 ${
                        isOldPhone
                          ? 'text-xl text-gray-900'
                          : 'text-xl md:text-2xl text-gray-900 group-hover:text-indigo-700 transition-colors duration-300'
                      }`}
                    >
                      {site.title}
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className={`text-gray-600 mb-3 md:mb-4 flex-1 text-sm md:text-base ${
                        isOldPhone ? 'line-clamp-3' : 'line-clamp-2'
                      }`}
                    >
                      {site.prompt}
                    </motion.p>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-auto pt-3 md:pt-4 border-t border-gray-100"
                    >
                      <Link
                        href={`/websites/${site.id}`}
                        className={`inline-flex items-center font-medium ${
                          isOldPhone
                            ? 'text-indigo-700'
                            : 'text-indigo-700 hover:text-indigo-900 transition-colors duration-300 group/link relative pb-1'
                        }`}
                      >
                        <span className="text-sm md:text-base">View Case Study</span>
                        <ArrowRight className={`ml-1.5 h-3 w-3 md:h-4 md:w-4 ${
                          !isOldPhone && 'group-hover/link:translate-x-1 transition-transform duration-300'
                        }`} />
                        {!isOldPhone && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-500 transform scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left" />
                        )}
                      </Link>
                    </motion.div>
                  </div>

                  {adminMode && !isOldPhone && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-50 to-transparent p-3 border-t border-indigo-100"
                    >
                      <label className="block text-center cursor-pointer">
                        <span className="text-indigo-600 font-medium text-xs hover:text-indigo-800 transition-colors flex items-center justify-center gap-1.5 group">
                          {loading ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="h-3 w-3 md:h-4 md:w-4 text-indigo-500"
                              >
                                <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                                  <path stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 4.418 3.582 8 8 8v-4a4 4 0 00-4-4z" />
                                </svg>
                              </motion.div>
                              <span className="text-xs">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-3 w-3 md:h-4 md:w-4 group-hover:scale-110 transition-transform duration-200" />
                              <span className="text-xs md:text-sm">Update Preview</span>
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
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-12 md:mt-16"
        >
          <Link
            href="/websites"
            className={`inline-flex items-center px-6 py-3 font-bold rounded-lg transition-all duration-300 ${
              isOldPhone
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg hover:shadow-2xl hover:scale-105 transform'
            }`}
          >
            <span className="text-sm md:text-base">Explore All {websites.length} Projects</span>
            <ArrowRight className="ml-1.5 h-3 w-3 md:ml-2 md:h-5 md:w-5" />
          </Link>
        </motion.div>
      </div>

      {/* Value Proposition Section - Premium Design with Old Phone Fallback */}
      <div className={`py-12 md:py-24 ${
        isOldPhone
          ? 'bg-gray-50'
          : 'bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden relative'
      }`}>
        {!isOldPhone && (
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-20">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full font-medium text-xs md:text-sm mb-3 md:mb-4 ${
                isOldPhone
                  ? 'bg-purple-50 text-purple-700'
                  : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700'
              }`}
            >
              <Zap className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              Our Process
            </motion.span>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className={`font-bold mb-4 ${
                isOldPhone
                  ? 'text-2xl md:text-3xl text-gray-900'
                  : 'text-3xl md:text-4xl lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-purple-800'
              }`}
            >
              The WhyNoWebsite Methodology
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`text-gray-600 ${
                isOldPhone
                  ? 'text-sm leading-relaxed'
                  : 'text-lg md:text-xl max-w-3xl mx-auto leading-relaxed'
              }`}
            >
              We blend strategic thinking with technical excellence to deliver websites that drive measurable business results and sustainable growth.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
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
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  whileHover={!isOldPhone ? { y: -10 } : {}}
                  className={`rounded-xl transition-all duration-300 ${
                    isOldPhone
                      ? 'bg-white p-4 border border-gray-200'
                      : 'bg-white p-6 md:p-8 shadow-md hover:shadow-xl border border-gray-100'
                  }`}
                >
                  <div className={`p-3 rounded-lg inline-block mb-4 ${
                    isOldPhone
                      ? 'bg-indigo-100'
                      : `bg-gradient-to-br ${item.color} mb-6`
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      isOldPhone ? 'text-indigo-600' : 'text-white'
                    }`} />
                  </div>
                  <h3 className={`font-bold mb-2 ${
                    isOldPhone ? 'text-lg' : 'text-xl md:text-2xl text-gray-900'
                  }`}>{item.title}</h3>
                  <p className={`text-gray-600 ${
                    isOldPhone ? 'text-sm' : 'leading-relaxed'
                  }`}>{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
          
          {/* Client Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12 md:mb-20 max-w-4xl mx-auto">
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
                transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                className={`flex items-start p-4 rounded-lg ${
                  i % 2 === 0 
                    ? (isOldPhone ? 'bg-indigo-50' : 'bg-gradient-to-br from-indigo-50 to-purple-50') 
                    : (isOldPhone ? 'bg-purple-50' : 'bg-gradient-to-br from-purple-50 to-pink-50')
                }`}
              >
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  <CheckCircle className={`h-5 w-5 ${
                    isOldPhone ? 'text-indigo-600' : 'text-indigo-600'
                  }`} />
                </div>
                <div>
                  <h4 className={`font-bold mb-1 ${
                    isOldPhone ? 'text-base' : 'text-lg md:text-xl text-gray-900'
                  }`}>{benefit.title}</h4>
                  <p className={`text-gray-600 ${
                    isOldPhone ? 'text-xs' : ''
                  }`}>{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              whileHover={!isOldPhone ? { scale: 1.02 } : {}}
              whileTap={!isOldPhone ? { scale: 0.98 } : {}}
            >
              <Link
                href="/get-started"
                className={`inline-flex items-center justify-center px-6 py-3 font-bold rounded-lg transition-all duration-300 ${
                  isOldPhone
                    ? 'bg-yellow-400 text-gray-900 shadow-md'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-2xl hover:shadow-3xl group'
                }`}
              >
                <span className="text-sm md:text-base">Let Us Create Your Website</span>
                <ArrowRight className={`ml-2 h-4 w-4 md:ml-3 md:h-6 md:w-6 ${
                  !isOldPhone && 'group-hover:translate-x-1 transition-transform duration-300'
                }`} />
              </Link>
            </motion.div>
            <p className={`mt-4 text-gray-600 ${
              isOldPhone ? 'text-xs' : 'text-lg'
            }`}>
              Ready to transform your digital presence? Get started today and we'll create a website that drives real business results.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-center mt-6 md:mt-8"
          >
            <Link
              href="/contact"
              className={`inline-flex items-center font-medium transition-colors duration-300 ${
                isOldPhone
                  ? 'text-indigo-600 hover:text-indigo-800'
                  : 'text-indigo-600 hover:text-indigo-800'
              }`}
            >
              <MessageCircle className={`h-4 w-4 mr-1.5 ${
                isOldPhone ? 'h-4 w-4' : 'h-5 w-5 mr-2'
              }`} />
              <span className={`text-xs md:text-base ${
                isOldPhone ? 'text-sm' : ''
              }`}>Have questions first? Get in touch</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* CTA Section - Focused on Website Creation */}
      <div className={`py-12 md:py-20 ${
        isOldPhone
          ? 'bg-indigo-900'
          : 'bg-gradient-to-br from-indigo-900 to-purple-900'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className={`font-medium text-xs md:text-sm tracking-wide uppercase mb-3 block ${
              isOldPhone ? 'text-indigo-200/80' : 'text-indigo-200'
            }`}>
              Ready to transform your digital presence?
            </span>
            <h2 className={`font-bold mb-4 ${
              isOldPhone
                ? 'text-2xl md:text-3xl text-white'
                : 'text-3xl md:text-4xl lg:text-5xl text-white'
            }`}>
              Your <span className="text-yellow-300">Website Awaits</span>
            </h2>
            <p className={`mb-8 md:mb-10 ${
              isOldPhone
                ? 'text-sm text-indigo-100/80'
                : 'text-lg md:text-xl text-indigo-100/90 leading-relaxed max-w-2xl mx-auto'
            }`}>
              Fill out our simple form and we'll create a custom website proposal tailored to your business goals. We respond within 24 hours to get your project started.
            </p>
            
            <motion.div
              whileHover={!isOldPhone ? { scale: 1.05 } : {}}
              whileTap={!isOldPhone ? { scale: 0.95 } : {}}
              className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 items-center"
            >
              <Link
                href="/get-started"
                className={`inline-flex items-center px-6 py-3 font-bold rounded-lg transition-all duration-300 ${
                  isOldPhone
                    ? 'bg-yellow-400 text-gray-900 shadow-md'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-2xl hover:shadow-3xl group'
                }`}
              >
                <span className="text-sm md:text-base">Get Started Now</span>
                <ArrowRight className={`ml-2 h-4 w-4 md:ml-3 md:h-6 md:w-6 ${
                  !isOldPhone && 'group-hover:translate-x-1 transition-transform duration-300'
                }`} />
              </Link>
              
              <Link
                href="/contact"
                className={`inline-flex items-center px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                  isOldPhone
                    ? 'bg-white/10 text-white border border-white/50'
                    : 'bg-transparent border-2 border-white/80 text-white hover:bg-white/10 backdrop-blur-sm'
                }`}
              >
                <Mail className={`h-4 w-4 mr-1.5 ${
                  isOldPhone ? 'h-4 w-4 mr-2' : 'h-5 w-5 mr-2'
                }`} />
                <span className="text-sm md:text-base">Contact Us</span>
              </Link>
            </motion.div>
            
            <p className={`mt-6 text-indigo-200/80 ${
              isOldPhone ? 'text-xs' : 'text-base'
            }`}>
              Not ready to start a project? We're happy to answer your questions and provide guidance.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Admin mode indicator - Elegant */}
      <AnimatePresence>
        {adminMode && !isOldPhone && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-4 py-2 rounded-xl shadow-lg text-xs md:text-sm font-medium z-50 flex items-center gap-1.5 backdrop-blur-sm md:bottom-8 md:right-8 md:px-6 md:py-3"
          >
            <Shield className="h-3 w-3 md:h-4 md:w-4" />
            <span>Admin Mode Active</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}