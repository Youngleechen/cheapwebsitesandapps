// app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Flame, 
  Hammer, 
  Truck, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  ChevronDown, 
  Instagram, 
  Facebook, 
  Twitter,
  Loader2
} from 'lucide-react';

// Supabase setup - using production-ready configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Business-specific gallery content
const PROJECTS = [
  { 
    id: 'mountain-lodge', 
    title: 'Mountain Lodge Restoration',
    prompt: 'A grand stone fireplace restoration in a rustic Asheville mountain lodge, featuring reclaimed wood mantel, handcrafted ironwork, and warm glowing embers casting dancing shadows on timber walls. Morning light streams through large windows overlooking misty Blue Ridge Mountains. Professional architectural photography, rich textures, cozy atmosphere.'
  },
  { 
    id: 'modern-farmhouse', 
    title: 'Modern Farmhouse Conversion',
    prompt: 'A dramatic transformation of an outdated brick fireplace into a sleek modern farmhouse focal point with floor-to-ceiling white shiplap, black steel accents, and floating walnut mantel. Soft ambient lighting highlights the texture of materials. Cozy living room setting with neutral decor, plants, and natural light. Interior design magazine quality.'
  },
  { 
    id: 'historic-preservation', 
    title: 'Historic Downtown Preservation',
    prompt: 'Meticulous restoration of a 1920s cast-iron fireplace in a historic Asheville downtown brownstone. Close-up showing intricate Victorian-era detailing, polished brass fittings, and restored tilework. Warm amber lighting creates a nostalgic mood. Architectural conservation photography style with shallow depth of field.'
  },
];

type ProjectState = { [key: string]: { image_url: string | null } };

const PROJECT_CATEGORIES = [
  { 
    id: 'new-install', 
    title: 'Custom Installations', 
    description: 'Bespoke fireplaces designed around your space and lifestyle', 
    icon: Flame 
  },
  { 
    id: 'restoration', 
    title: 'Restorations', 
    description: 'Preserving history while enhancing function and safety', 
    icon: Hammer 
  },
  { 
    id: 'conversion', 
    title: 'Fuel Conversions', 
    description: 'Modernizing wood-burning to gas or electric with seamless integration', 
    icon: Truck 
  },
  { 
    id: 'repair', 
    title: 'Repairs & Maintenance', 
    description: 'Expert chimney inspections, flue repairs, and safety certifications', 
    icon: ShieldCheck 
  },
];

const TESTIMONIALS = [
  {
    id: 1,
    author: "Michael & Sarah Reynolds",
    location: "Biltmore Forest",
    text: "Hearth & Hammer transformed our drafty 1930s cottage fireplace into the heart of our home. Their attention to historical details while adding modern efficiency was masterful. We now host gatherings year-round around this beautiful focal point.",
    rating: 5
  },
  {
    id: 2,
    author: "Dr. Elena Rodriguez",
    location: "Downtown Asheville",
    text: "As a preservation architect, I'm extremely particular about restoration work. Their team exceeded my expectations on our historic downtown office fireplace - respecting original materials while implementing critical safety upgrades. A true craftsman's approach.",
    rating: 5
  },
  {
    id: 3,
    author: "James Thornton",
    location: "Black Mountain",
    text: "After three other companies couldn't solve our smoking fireplace issue, Hearth & Hammer diagnosed a complex chimney draft problem. Their solution involved both structural repair and a custom insert installation. Finally, we can enjoy our fireplace without setting off smoke alarms!",
    rating: 5
  }
];

const TEAM_MEMBERS = [
  {
    id: 1,
    name: "Thomas Blackwood",
    title: "Master Mason & Founder",
    bio: "25+ years preserving Asheville's architectural heritage. Certified by the National Chimney Sweep Guild and Masonry Institute of America. Thomas apprenticed under European craftsmen before founding Hearth & Hammer in 2008.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 2,
    name: "Maya Chen",
    title: "Design Director",
    bio: "Former architectural designer specializing in historic renovations. Maya ensures every fireplace complements your home's character while meeting modern comfort standards. Graduate of NC State's College of Design.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
  }
];

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

function ProjectGallery() {
  const [projects, setProjects] = useState<ProjectState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      try {
        // Preload state with placeholders
        const initialState: ProjectState = {};
        PROJECTS.forEach(project => {
          initialState[project.id] = { image_url: '/placeholder-fireplace.jpg' };
        });
        setProjects(initialState);

        const { data: images, error } = await supabase
          .from('images')
          .select('path, created_at')
          .eq('user_id', ADMIN_USER_ID)
          .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const latestImagePerProject: Record<string, string> = {};

        if (images) {
          for (const img of images) {
            const pathParts = img.path.split('/');
            if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
              const projectId = pathParts[2];
              if (PROJECTS.some(p => p.id === projectId) && !latestImagePerProject[projectId]) {
                latestImagePerProject[projectId] = img.path;
              }
            }
          }
        }

        // Update with actual images
        const updatedState = { ...initialState };
        PROJECTS.forEach(project => {
          if (latestImagePerProject[project.id]) {
            const publicUrl = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerProject[project.id]).data.publicUrl;
            updatedState[project.id] = { image_url: publicUrl };
          }
        });

        setProjects(updatedState);
      } catch (err) {
        console.error('Error loading gallery:', err);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(projectId);
    try {
      // Clean up old images
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${projectId}/`;
      const { data: existingImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (existingImages && existingImages.length > 0) {
        const pathsToDelete = existingImages.map(img => img.path);
        await Promise.all([
          supabase.storage.from('user_images').remove(pathsToDelete),
          supabase.from('images').delete().in('path', pathsToDelete)
        ]);
      }

      // Upload new image
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
      
      setProjects(prev => ({
        ...prev,
        [projectId]: { image_url: publicUrl }
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, projectId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(projectId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-amber-50 rounded-xl overflow-hidden border border-amber-200 animate-pulse">
            <div className="h-80 bg-gradient-to-br from-amber-100 to-amber-50" />
            <div className="p-6">
              <div className="h-6 bg-amber-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-amber-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section id="gallery" className="py-24 bg-gradient-to-b from-stone-50 to-amber-50 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Craftsmanship That <span className="text-amber-800">Endures</span>
          </h2>
          <p className="text-xl text-gray-600">
            Explore our portfolio of fireplace transformations across Western North Carolina
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROJECTS.map((project, index) => {
            const projectData = projects[project.id] || { image_url: '/placeholder-fireplace.jpg' };
            const imageUrl = projectData.image_url;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg border border-amber-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-80 overflow-hidden">
                  <AnimatePresence>
                    {imageUrl ? (
                      <motion.img
                        key="image"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        src={imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-fireplace.jpg';
                        }}
                      />
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center"
                      >
                        <Hammer className="w-16 h-16 text-amber-400 opacity-75" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Overlay gradient for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2">{project.title}</h3>
                      <p className="text-amber-200 font-medium">Asheville, NC</p>
                    </div>
                  </div>
                </div>

                {adminMode && (
                  <div className="absolute top-3 right-3 z-20 bg-black/70 backdrop-blur-sm rounded-lg p-2 flex space-x-1">
                    <button
                      onClick={() => copyPrompt(project.prompt, project.id)}
                      className="p-1.5 text-amber-300 hover:text-white transition-colors"
                      title={copiedId === project.id ? "Copied!" : "Copy prompt"}
                    >
                      {copiedId === project.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <label 
                      className={`p-1.5 text-amber-300 hover:text-white transition-colors cursor-pointer ${
                        uploading === project.id ? 'opacity-50 pointer-events-none' : ''
                      }`}
                      title={uploading === project.id ? "Uploading..." : "Upload image"}
                    >
                      {uploading === project.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, project.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <div className="p-6 bg-gradient-to-b from-white to-amber-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4">Asheville, NC</p>
                  <div className="flex items-center">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-500">Featured Project</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {adminMode && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 max-w-3xl mx-auto p-4 bg-amber-50 border border-amber-200 rounded-xl backdrop-blur-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-amber-800">
                  Admin Mode Active: Upload client project photos using the camera icons above. 
                  Use the copy icon to get detailed prompts for generating sample images.
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Images are automatically optimized and served via CDN for fast loading
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    projectType: '', 
    message: '' 
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [showStickyContact, setShowStickyContact] = useState(false);
  const { scrollY } = useScroll();
  const yRange = useTransform(scrollY, [0, 100], [0, 1]);
  const headerRef = useRef<HTMLElement>(null);

  // Sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyContact(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Header background effect
  useEffect(() => {
    const unsubscribe = yRange.onChange((value) => {
      if (headerRef.current) {
        headerRef.current.style.background = `rgba(255, 253, 246, ${Math.min(0.95, value * 1.2)})`;
        headerRef.current.style.boxShadow = value > 0.1 
          ? '0 4px 20px -2px rgba(0, 0, 0, 0.08)' 
          : 'none';
      }
    });
    return unsubscribe;
  }, [yRange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    
    try {
      // In production, connect to your backend API here
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      // Send notification to admin
      const { error } = await supabase.functions.invoke('contact-notification', {
        body: JSON.stringify(formData)
      });
      
      if (error) throw error;
      
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', projectType: '', message: '' });
      
      // Reset form after 4 seconds
      setTimeout(() => setSubmitStatus('idle'), 4000);
    } catch (error) {
      console.error('Submission failed:', error);
      setSubmitStatus('error');
    }
  };

  return (
    <div className="font-sans bg-white text-gray-800 overflow-x-hidden">
      {/* Navigation */}
      <motion.header 
        ref={headerRef}
        className="fixed w-full z-50 transition-all duration-300"
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="bg-amber-100 p-2 rounded-lg">
                <Flame className="w-7 h-7 text-amber-800" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-800 to-rose-600 bg-clip-text text-transparent">
                  Hearth & Hammer
                </h1>
                <p className="text-sm text-amber-700 font-medium">Asheville's Fireplace Artisans Since 2008</p>
              </div>
            </motion.div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-amber-100 rounded-lg transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:block">
              <ul className="flex space-x-10">
                {['Services', 'Gallery', 'Process', 'Contact'].map((item) => (
                  <li key={item}>
                    <a 
                      href={`#${item.toLowerCase()}`} 
                      className="font-medium text-amber-900 hover:text-amber-700 transition-colors py-2 relative group"
                    >
                      {item}
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500 to-rose-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <a 
              href="#contact" 
              className="hidden md:block bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold py-2.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Get Estimate
            </a>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-amber-50 border-t border-amber-200 overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4">
                <ul className="space-y-1">
                  {['Services', 'Gallery', 'Process', 'Contact'].map((item) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * ['Services', 'Gallery', 'Process', 'Contact'].indexOf(item) }}
                    >
                      <a 
                        href={`#${item.toLowerCase()}`} 
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-4 text-lg font-medium text-amber-800 border-b border-amber-200 hover:bg-amber-100 rounded-lg px-3 transition-colors"
                      >
                        {item}
                      </a>
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-amber-200">
                  <a 
                    href="#contact" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold py-3 px-6 rounded-full text-center shadow-md hover:shadow-lg transition-all"
                  >
                    Get Estimate
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Sticky Contact Button - Only visible after scrolling */}
      {showStickyContact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-40 md:hidden"
        >
          <a 
            href="#contact" 
            className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold py-4 px-6 rounded-full shadow-xl flex items-center space-x-2"
          >
            <Phone className="w-5 h-5" />
            <span>Call Now</span>
          </a>
        </motion.div>
      )}

      {/* Hero Section - Immersive full-screen experience */}
      <section className="pt-36 pb-20 md:pb-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50/80 to-white mix-blend-multiply" />
          <img 
            src="https://images.unsplash.com/photo-1594132803621-696c55c4d8c3?auto=format&fit=crop&w=1920&q=80" 
            alt="Grand stone fireplace in mountain lodge" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                Serving Asheville & Western North Carolina Since 2008
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Where Craftsmanship <span className="text-amber-300">Meets Comfort</span>
              </h1>
              <p className="text-xl text-amber-100 max-w-3xl mx-auto mb-10">
                Custom fireplace installations and restorations that honor Asheville's architectural heritage while delivering modern comfort and efficiency
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href="#contact" 
                  className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                >
                  Get Free Estimate
                </a>
                <a 
                  href="#gallery" 
                  className="bg-white/90 backdrop-blur-sm text-amber-900 font-medium text-lg py-4 px-8 rounded-xl hover:bg-amber-50 transition-colors border border-white/20"
                >
                  View Our Work
                </a>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-16"
            >
              <div className="inline-flex items-center bg-black/40 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/10">
                <div className="flex -space-x-2 mr-4">
                  {[1,2,3,4,5].map((i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-rose-500"
                      style={{ transform: `translateX(${i * 8}px)` }}
                    ></div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">217+ Homes Transformed</p>
                  <p className="text-amber-200 text-sm">Across Western North Carolina</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-10 z-10">
          <motion.a
            href="#services"
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full border border-white/30 hover:bg-white/30 transition-colors"
            aria-label="Scroll down"
          >
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </motion.a>
        </div>
      </section>

      {/* Services Section - Unique card layout with icons */}
      <section id="services" className="py-24 bg-white relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our <span className="text-amber-800">Artisan Services</span>
            </h2>
            <p className="text-xl text-gray-600">
              Every fireplace we create is a collaboration between historical craftsmanship and modern engineering
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {PROJECT_CATEGORIES.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 hover:border-amber-300 transition-all duration-300"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-200 to-rose-300 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center mb-6">
                        <Icon className="w-7 h-7 text-amber-800" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-amber-800 transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-stone-900 to-amber-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-300/50"
            >
              <div className="p-8 md:p-12 bg-black/30 backdrop-blur-sm">
                <h3 className="text-3xl font-bold text-white mb-4">The Hearth & Hammer Difference</h3>
                <ul className="space-y-4">
                  {[{
                    title: 'Master Craftsmen',
                    desc: 'All projects led by certified masons with 15+ years experience'
                  }, {
                    title: 'Zero-Risk Guarantee',
                    desc: '100% satisfaction promise or we redo the work at no cost'
                  }, {
                    title: 'Historic Specialists',
                    desc: 'Preservation techniques approved by Asheville Historic Resources Commission'
                  }, {
                    title: 'Eco-Conscious',
                    desc: 'Energy-efficient designs that reduce heating costs by up to 30%'
                  }].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-white">{item.title}</p>
                        <p className="text-amber-100">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1600596703413-5cc6f0aaf6ff?auto=format&fit=crop&w=600&q=80" 
                alt="Master mason working on stone fireplace" 
                className="w-full h-64 object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gallery Section with Admin Upload System */}
      <ProjectGallery />

      {/* Process Section - Unique timeline layout */}
      <section id="process" className="py-24 bg-gradient-to-b from-stone-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our <span className="text-amber-800">Craftsmanship Process</span>
            </h2>
            <p className="text-xl text-gray-600">
              A meticulous 5-step approach ensuring every fireplace becomes a legacy piece
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline connector */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-amber-200 to-amber-400 rounded-full" />
            
            {[
              {
                step: 1,
                title: "Heritage Assessment",
                desc: "We study your home's architectural history and heating needs through detailed site analysis and historical research"
              },
              {
                step: 2,
                title: "Artisan Design",
                desc: "Create custom blueprints integrating traditional craftsmanship with modern efficiency standards and safety codes"
              },
              {
                step: 3,
                title: "Material Sourcing",
                desc: "Source reclaimed materials from Asheville's historic properties and local quarries for authentic character"
              },
              {
                step: 4,
                title: "Master Construction",
                desc: "Our lead masons execute the build with precision, using time-honored techniques combined with modern engineering"
              },
              {
                step: 5,
                title: "Legacy Certification",
                desc: "Final inspection with detailed documentation and a 25-year craftsmanship warranty on all structural elements"
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`flex flex-col md:flex-row ${index % 2 === 0 ? 'md:flex-row-reverse' : ''} mb-16 md:mb-24 relative`}
              >
                {/* Timeline dot */}
                <div className="absolute left-1/2 top-8 transform -translate-x-1/2 md:static md:left-auto md:transform-none w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-xl z-10 md:mr-6 md:ml-6">
                  {item.step}
                </div>
                
                <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:ml-auto' : 'md:mr-auto'}`}>
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-amber-100 hover:shadow-xl transition-shadow">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                    <div className="mt-6 pt-6 border-t border-amber-100">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center mr-3">
                          <Hammer className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                          <p className="font-medium text-amber-800">Timeline</p>
                          <p className="text-gray-500">{index === 0 ? '1-2 weeks' : index === 4 ? 'Final Step' : '2-4 weeks'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="hidden md:block w-1/12" />
                
                <div className="w-full md:w-5/12 mt-6 md:mt-0 flex items-center justify-center">
                  <div className="relative w-full max-w-sm h-64 rounded-2xl overflow-hidden shadow-xl border-2 border-amber-200/50">
                    <img 
                      src={`https://images.unsplash.com/photo-1591181887421-4eb5e6c9a1c3?auto=format&fit=crop&w=600&q=80&dpr=1&${item.step}`} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <p className="font-bold">{item.title}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Magazine style layout */}
      <section className="py-24 bg-gradient-to-br from-amber-50 to-stone-100">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Stories from the <span className="text-amber-800">Hearth</span>
            </h2>
            <p className="text-xl text-gray-600">
              Hear from Asheville homeowners who've rediscovered the joy of gathering around the fire
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {TESTIMONIALS.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-md border border-amber-100 relative overflow-hidden"
                >
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-amber-100 to-rose-100 rounded-full opacity-20" />
                  <div className="relative z-10">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-amber-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 italic mb-6 border-l-4 border-amber-400 pl-4 py-2">
                      "{testimonial.text}"
                    </p>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.author}</p>
                      <div className="flex items-center text-amber-700">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{testimonial.location}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-stone-900 to-amber-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-300/50">
                <div className="p-8 md:p-12 bg-black/20 backdrop-blur-sm">
                  <div className="flex items-start mb-6">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400">
                        <img 
                          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80" 
                          alt="Thomas Blackwood" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Thomas Blackwood</h3>
                      <p className="text-amber-200">Master Mason & Founder</p>
                    </div>
                  </div>
                  <blockquote className="text-white text-lg italic mb-6 border-l-4 border-amber-400 pl-4 py-2">
                    "In Asheville's mountains, a fireplace isn't just a heating appliance—it's where families gather to share stories after a day on the trails, where couples reconnect on winter evenings, and where history lives in the stones we carefully set. We don't just build fireplaces; we craft the heart of your home."
                  </blockquote>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-amber-800/30 text-amber-200 rounded-full text-sm">25+ Years Experience</span>
                    <span className="px-3 py-1 bg-amber-800/30 text-amber-200 rounded-full text-sm">NC Certified Mason</span>
                    <span className="px-3 py-1 bg-amber-800/30 text-amber-200 rounded-full text-sm">Historic Preservation Specialist</span>
                  </div>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1569873616584-733d0680628b?auto=format&fit=crop&w=600&q=80" 
                  alt="Artisan working on historic fireplace" 
                  className="w-full h-64 object-cover"
                />
              </div>
              
              <div className="mt-8 bg-white rounded-2xl p-6 shadow-md border border-amber-100">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center mr-4">
                    <ShieldCheck className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Our Promise</h3>
                    <p className="text-amber-700 font-medium">Zero-Risk Craftsmanship Guarantee</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  If you're not completely satisfied with our workmanship within the first year, we'll redo the entire project at no cost. Plus, all structural elements carry a 25-year warranty.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section - Split layout with form */}
      <section id="contact" className="py-24 bg-gradient-to-br from-amber-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10 max-w-xl"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Begin Your <span className="text-amber-800">Hearth Project</span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Let's create a fireplace that becomes the soul of your Asheville home. Schedule a complimentary consultation with our master craftsman.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="mt-1 p-3 bg-gradient-to-br from-amber-100 to-rose-100 rounded-xl">
                    <MapPin className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Visit Our Workshop</p>
                    <p className="text-gray-600">127 Masonry Lane, Asheville, NC 28801</p>
                    <a href="#" className="text-amber-700 hover:underline mt-1 inline-block">Get Directions</a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="mt-1 p-3 bg-gradient-to-br from-amber-100 to-rose-100 rounded-xl">
                    <Phone className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Call Us Directly</p>
                    <p className="text-gray-600">(828) 555-0198</p>
                    <p className="text-sm text-gray-500 mt-1">Mon-Fri: 8am-5pm • Sat: By Appointment</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="mt-1 p-3 bg-gradient-to-br from-amber-100 to-rose-100 rounded-xl">
                    <Mail className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email Our Team</p>
                    <p className="text-gray-600">projects@hearthandhammer.com</p>
                    <a href="#" className="text-amber-700 hover:underline mt-1 inline-block">Send Message</a>
                  </div>
                </div>

                <div className="pt-6 border-t border-amber-200">
                  <p className="font-medium mb-4">Follow Our Craftsmanship Journey</p>
                  <div className="flex space-x-4">
                    {[Instagram, Facebook, Twitter].map((Icon, i) => (
                      <a 
                        key={i} 
                        href="#" 
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center text-amber-800 hover:from-amber-200 hover:to-rose-200 transition-colors"
                      >
                        <Icon className="w-6 h-6" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-amber-100"
            >
              <div className="text-center mb-8">
                <div className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                  Complimentary Consultation
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Project Inquiry</h3>
                <p className="text-gray-600 mt-2">Fill out this form and Thomas will contact you within 24 hours</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                      placeholder="John & Mary Smith"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                      placeholder="(828) 555-0123"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                      placeholder="smith.family@email.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                    <select
                      id="projectType"
                      value={formData.projectType}
                      onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition bg-white"
                    >
                      <option value="">Select a project type</option>
                      <option value="new-install">New Installation</option>
                      <option value="restoration">Historic Restoration</option>
                      <option value="conversion">Fuel Conversion</option>
                      <option value="repair">Repair/Maintenance</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Project Details</label>
                  <textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    placeholder="Tell us about your home, vision, and timeline..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitStatus === 'submitting'}
                  className={`w-full bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-md transition-all transform ${
                    submitStatus === 'submitting' ? 'opacity-75 cursor-not-allowed' : 'hover:scale-[1.02]'
                  }`}
                >
                  {submitStatus === 'submitting' ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Sending Request...
                    </span>
                  ) : submitStatus === 'success' ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Request Received! Thomas will contact you soon.
                    </span>
                  ) : (
                    "Schedule Consultation"
                  )}
                </button>

                {submitStatus === 'error' && (
                  <p className="text-red-500 text-center text-sm mt-2">
                    Something went wrong. Please try again or call us directly at (828) 555-0198.
                  </p>
                )}
                
                <p className="text-center text-sm text-gray-500 mt-2">
                  We respect your privacy. Your information will only be used to discuss your project.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-t from-stone-900 to-amber-900 text-white pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-amber-200 p-2 rounded-lg">
                  <Flame className="w-7 h-7 text-amber-800" />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-white">
                  Hearth & Hammer
                </span>
              </div>
              <p className="text-amber-100 mb-6 max-w-xs">
                Crafting the heart of Asheville homes since 2008. We blend historic craftsmanship with modern engineering to create fireplaces that last generations.
              </p>
              <div className="flex space-x-4">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <a 
                    key={i} 
                    href="#" 
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-white">Our Services</h3>
              <ul className="space-y-3">
                {PROJECT_CATEGORIES.map((service) => (
                  <li key={service.id}>
                    <a href="#" className="text-amber-100 hover:text-white transition-colors flex items-center group">
                      <span className="w-2 h-2 bg-amber-400 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                      {service.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-white">Service Areas</h3>
              <ul className="space-y-2">
                {[
                  "Asheville", 
                  "Black Mountain", 
                  "Biltmore Forest", 
                  "Weaverville", 
                  "Hendersonville",
                  "Waynesville"
                ].map((area, i) => (
                  <li key={i} className="flex items-start">
                    <MapPin className="w-4 h-4 text-amber-400 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-amber-100">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-white">Contact</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <MapPin className="w-5 h-5 text-amber-400 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-amber-100">127 Masonry Lane<br/>Asheville, NC 28801</span>
                </li>
                <li className="flex items-center">
                  <Phone className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0" />
                  <a href="tel:8285550198" className="text-amber-100 hover:text-white transition-colors">(828) 555-0198</a>
                </li>
                <li className="flex items-center">
                  <Mail className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0" />
                  <a href="mailto:projects@hearthandhammer.com" className="text-amber-100 hover:text-white transition-colors">projects@hearthandhammer.com</a>
                </li>
                <li className="pt-4 border-t border-amber-800/30">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-rose-400 flex items-center justify-center mr-3">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Licensed & Insured</p>
                      <p className="text-amber-200 text-sm">NC Masonry License #M-125489</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-amber-800/30 pt-10 text-center text-amber-300">
            <div className="max-w-4xl mx-auto space-y-4">
              <p className="text-sm">
                © {new Date().getFullYear()} Hearth & Hammer Masonry. All rights reserved. Proud members of the Asheville Area Chamber of Commerce, National Chimney Sweep Guild, and Historic Asheville Preservation Society.
              </p>
              <p className="text-xs max-w-2xl mx-auto">
                All project images are actual completed works in Western North Carolina homes. Before/after transformations shown with homeowner permission. 25-year structural warranty covers all mortar joints and foundational elements.
              </p>
              <div className="flex justify-center space-x-6 text-sm pt-2">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Careers</a>
                <a href="#" className="hover:text-white transition-colors">Press</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Floating action button for desktop */}
      <div className="hidden md:block fixed bottom-8 right-8 z-40">
        <motion.a
          href="#contact"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold py-4 px-6 rounded-full shadow-xl flex items-center space-x-3"
        >
          <Phone className="w-5 h-5" />
          <span>Schedule Consultation</span>
        </motion.a>
      </div>
    </div>
  );
}