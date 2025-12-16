'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Upload, Shield, Rocket, Target, Zap, TrendingUp, Sparkles, CheckCircle, MessageCircle, Mail, Menu, X, ChevronDown } from 'lucide-react';

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

// Header Component with integrated categories
function Header({ adminMode }: { adminMode: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = (itemName: string) => {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    setActiveDropdown(itemName);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 150); // Small delay to allow mouse to move to dropdown
    setDropdownTimeout(timeout);
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { 
      name: 'Portfolio', 
      href: '/websites',
      dropdown: [
        { name: 'All Categories', href: '/websites' },
        { name: 'Restaurant & Hospitality', href: '/websites?category=restaurant' },
        { name: 'Creative Portfolio', href: '/websites?category=portfolio' },
        { name: 'Local Business', href: '/websites?category=local-business' },
        { name: 'Professional Services', href: '/websites?category=professional-services' },
        { name: 'Content & Community', href: '/websites?category=content' },
        { name: 'Startup / SaaS / Tech', href: '/websites?category=saas' },
        { name: 'E-Commerce', href: '/websites?category=ecommerce' },
      ]
    },
    { name: 'Process', href: '/process' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg py-4' 
          : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-30" />
              </div>
              <div className="flex flex-col">
                <span className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
                  isScrolled 
                    ? 'from-gray-900 to-indigo-800' 
                    : 'from-white to-indigo-200'
                }`}>
                  WhyNoWebsite
                </span>
                <span className={`text-xs font-medium ${
                  isScrolled ? 'text-gray-500' : 'text-indigo-200'
                }`}>
                  Premium Web Solutions
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <div 
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => item.dropdown && handleMouseEnter(item.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={item.href}
                    className={`font-medium transition-colors duration-200 ${
                      isScrolled
                        ? 'text-gray-700 hover:text-indigo-600'
                        : 'text-white/90 hover:text-white'
                    } flex items-center space-x-1`}
                  >
                    <span>{item.name}</span>
                    {item.dropdown && (
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                        activeDropdown === item.name ? 'rotate-180' : ''
                      }`} />
                    )}
                  </Link>
                  
                  {/* Dropdown */}
                  {item.dropdown && activeDropdown === item.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onMouseEnter={() => handleMouseEnter(item.name)}
                      onMouseLeave={handleMouseLeave}
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
                      style={{ 
                        pointerEvents: 'auto',
                        marginTop: '8px' // Added padding to prevent gap
                      }}
                    >
                      {/* Invisible bridge to prevent mouse gap */}
                      <div 
                        className="absolute -top-2 left-0 right-0 h-2"
                        onMouseEnter={() => handleMouseEnter(item.name)}
                      />
                      
                      {item.dropdown.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.name}
                          href={dropdownItem.href}
                          className="block px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            setActiveDropdown(null);
                            if (dropdownTimeout) {
                              clearTimeout(dropdownTimeout);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{dropdownItem.name}</span>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
              
              {/* CTA Button */}
              <Link
                href="/get-started"
                className="group relative px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isScrolled
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Admin Mode Indicator */}
        {adminMode && (
          <div className="absolute top-2 right-4 lg:right-8">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
              <Shield className="h-3 w-3" />
              <span>Admin Mode</span>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">W</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-gray-900">WhyNoWebsite</span>
                      <span className="text-xs font-medium text-gray-500">Premium Web Solutions</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <div key={item.name}>
                      <Link
                        href={item.href}
                        className="block py-3 px-4 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                      {item.dropdown && (
                        <div className="ml-4 space-y-1 border-l border-gray-200 pl-4">
                          {item.dropdown.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.name}
                              href={dropdownItem.href}
                              className="block py-2 text-gray-600 hover:text-indigo-600 transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {dropdownItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <Link
                      href="/get-started"
                      className="block w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-center rounded-xl hover:shadow-lg transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                </nav>

                {/* Contact Info */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">Ready to transform your digital presence?</p>
                  <div className="space-y-2">
                    <Link
                      href="/contact"
                      className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Contact Sales</span>
                    </Link>
                    <Link
                      href="mailto:hello@whyonowebsite.com"
                      className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="text-sm">hello@whyonowebsite.com</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

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
      const uid = session?.user?.id || null;
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
      for (const img of images || []) {
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

  // Professional loading skeleton
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
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
        <Header adminMode={adminMode} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-32">
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
    <div className="min-h-screen bg-gray-50">
      <Header adminMode={adminMode} />
      
      {/* Hero Section - Ultra Modern */}
      <motion.div 
        style={{ opacity: backgroundOpacity, scale: heroScale }}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[size:60px_60px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40 pt-40">
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
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/20"
            >
              <Sparkles className="h-4 w-4 text-yellow-300 mr-2" />
              <span className="text-indigo-200 font-medium text-sm">
                Premium Web Solutions for Visionary Businesses
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-tight"
            >
              Digital Excellence, <span className="text-yellow-300">Engineered</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl md:text-2xl text-indigo-100/90 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              We craft high-performance websites that transform digital presence into measurable business growth—combining strategic insight with technical mastery.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link
                href="/websites"
                className="group relative px-8 py-4 bg-gradient-to-r from-white to-indigo-100 text-indigo-900 font-semibold rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Explore Portfolio
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                href="/get-started"
                className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Let Us Create Your Website
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-6"
            >
              <Link
                href="/contact"
                className="inline-flex items-center text-white/80 hover:text-white font-medium text-sm transition-colors duration-300"
              >
                <Mail className="h-4 w-4 mr-2" />
                <span>Just have a question? Contact us</span>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Floating Preview Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-20 hidden md:block"
          >
            <div className="grid grid-cols-3 gap-6">
              {featuredSites.slice(0, 3).map((site, index) => {
                const imageUrl = previewImages[site.id];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="h-56 relative">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`${site.title} preview`}
                          fill
                          className="object-cover transition-transform duration-500 hover:scale-110"
                          priority={index === 0}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800/30 to-gray-900/40 flex items-center justify-center">
                          <span className="text-gray-300 text-sm font-medium">Preview loading...</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-white font-medium text-sm">{site.title}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Floating Particles */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-indigo-900 to-transparent pointer-events-none" />
      </motion.div>

      {/* Featured Portfolio Grid - Premium Design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full font-medium text-sm mb-4"
          >
            <Shield className="h-4 w-4 mr-2" />
            Our Portfolio
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-indigo-800 mb-6"
          >
            Transforming Digital Experiences
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Each website we create is a strategic asset engineered to achieve specific business objectives—backed by data-driven decisions and meticulous execution.
          </motion.p>
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
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                  onHoverStart={() => setHoveredSite(site.id)}
                  onHoverEnd={() => setHoveredSite(null)}
                  className={`group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 ${
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
                          isHovered ? 'scale-110' : 'scale-100'
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
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <span className="text-indigo-600 font-bold text-lg">W</span>
                          </div>
                          <span className="text-gray-500 text-sm font-medium">
                            {loading ? 'Uploading preview...' : 'Preview unavailable'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Category badge with gradient */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="absolute top-4 left-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg z-10 border border-white/20"
                    >
                      {site.categoryName}
                    </motion.div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-white"
                      >
                        <h3 className="text-2xl font-bold mb-2">{site.title}</h3>
                        <p className="text-gray-200 line-clamp-2 mb-4">{site.prompt}</p>
                        <div className="flex items-center text-sm font-medium text-indigo-300">
                          View Case Study
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <motion.h3 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors duration-300"
                    >
                      {site.title}
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-gray-600 mb-4 flex-1 line-clamp-2 text-base leading-relaxed"
                    >
                      {site.prompt}
                    </motion.p>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-auto pt-4 border-t border-gray-100"
                    >
                      <Link
                        href={`/websites/${site.id}`}
                        className="inline-flex items-center text-indigo-700 font-medium hover:text-indigo-900 transition-colors duration-300 group/link relative pb-1"
                      >
                        <span className="relative z-10">View Case Study</span>
                        <ArrowRight className="ml-2 h-4 w-4 transform group-hover/link:translate-x-1 transition-transform duration-300" />
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-500 transform scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left" />
                      </Link>
                    </motion.div>
                  </div>

                  {adminMode && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-50 to-transparent p-4 border-t border-indigo-100"
                    >
                      <label className="block text-center cursor-pointer">
                        <span className="text-indigo-600 font-medium text-sm hover:text-indigo-800 transition-colors flex items-center justify-center gap-2 group">
                          {loading ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="h-4 w-4 text-indigo-500"
                              >
                                <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                                  <path stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 4.418 3.582 8 8 8v-4a4 4 0 00-4-4z" />
                                </svg>
                              </motion.div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
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
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-16"
        >
          <Link
            href="/websites"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 transform group"
          >
            <span>Explore All {websites.length} Projects</span>
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>
      </div>

      {/* Value Proposition Section - Premium Design */}
      <div className="py-24 bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 rounded-full font-medium text-sm mb-4"
            >
              <Zap className="h-4 w-4 mr-2" />
              Our Process
            </motion.span>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-purple-800 mb-6"
            >
              The WhyNoWebsite Methodology
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            >
              We blend strategic thinking with technical excellence to deliver websites that drive measurable business results and sustainable growth.
            </motion.p>
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
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -10 }}
                  className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${item.color} inline-block mb-6`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </motion.div>
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
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                className={`flex items-start p-6 rounded-xl ${
                  i % 2 === 0 
                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50' 
                    : 'bg-gradient-to-br from-purple-50 to-pink-50'
                }`}
              >
                <div className="flex-shrink-0 mr-4 mt-1">
                  <CheckCircle className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">{benefit.title}</h4>
                  <p className="text-gray-600">{benefit.desc}</p>
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 group"
              >
                <span>Let Us Create Your Website</span>
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
            <p className="mt-6 text-gray-600 text-lg">
              Ready to transform your digital presence? Get started today and we'll create a website that drives real business results.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-center mt-8"
          >
            <Link
              href="/contact"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-base transition-colors duration-300"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              <span>Have questions first? Get in touch</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* CTA Section - Focused on Website Creation */}
      <div className="py-20 bg-gradient-to-br from-indigo-900 to-purple-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-indigo-200 font-medium text-sm tracking-wide uppercase mb-4 block">
              Ready to transform your digital presence?
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Your <span className="text-yellow-300">Website Awaits</span>
            </h2>
            <p className="text-xl text-indigo-100/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Fill out our simple form and we'll create a custom website proposal tailored to your business goals. We respond within 24 hours to get your project started.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col sm:flex-row justify-center gap-4 items-center"
            >
              <Link
                href="/get-started"
                className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 group"
              >
                <span>Get Started Now</span>
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white/80 text-white font-semibold rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
              >
                <Mail className="h-5 w-5 mr-2" />
                <span>Contact Us</span>
              </Link>
            </motion.div>
            
            <p className="mt-8 text-indigo-200/80 text-base">
              Not ready to start a project? We're happy to answer your questions and provide guidance.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}