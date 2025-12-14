'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Wellness-focused content instead of generic artwork
const WELLNESS_CONTENT = [
  { 
    id: 'morning-meditation', 
    title: 'Morning Mountain Meditation',
    prompt: 'A serene sunrise meditation scene in the Blue Ridge Mountains near Asheville, North Carolina. Soft golden light filters through misty pine trees, illuminating a person sitting peacefully on a smooth boulder overlooking a valley. Include gentle steam rising from a ceramic mug of herbal tea nearby, with dew-covered wildflowers in the foreground. The atmosphere should feel grounding, peaceful, and deeply connected to nature.'
  },
  { 
    id: 'community-circle', 
    title: 'Community Wellness Circle',
    prompt: 'A warm, intimate wellness circle gathering inside a rustic-chic Asheville studio space. Diverse community members of different ages and backgrounds sit in a circle on floor cushions and woven blankets, sharing stories and laughter. Soft string lights crisscross overhead, large windows show lush green mountains in the background, and small ceramic bowls of crystals and dried lavender sit on a wooden coffee table. The scene should radiate connection, belonging, and authentic human warmth.'
  },
  { 
    id: 'forest-bathing', 
    title: 'Forest Bathing Journey',
    prompt: 'A mindful forest bathing experience along a quiet trail in Pisgah National Forest near Asheville. A guide leads a small group through a lush, moss-covered pathway with ancient rhododendron tunnels and towering hemlock trees. Sunlight dapples through the canopy, creating magical light patterns on the forest floor. A participant pauses to touch the bark of a massive tree, their face showing deep presence and connection. Include subtle details like a butterfly landing on a fern and the gentle sound of a nearby creek implied through visual cues.'
  },
  {
    id: 'herbal-workshop', 
    title: 'Herbal Wisdom Workshop',
    prompt: 'A hands-on herbal medicine workshop in a sunlit Asheville apothecary. A knowledgeable herbalist demonstrates how to make tinctures while participants gather around a large wooden table filled with glass jars of dried herbs, amber bottles, mortar and pestles, and fresh mountain botanicals. Soft afternoon light streams through large windows, highlighting the rich textures and colors of the herbs. Include details like handwritten recipe cards, clay pots of growing herbs on the windowsill, and the warm, earthy atmosphere of traditional healing wisdom being shared.'
  },
  {
    id: 'sound-healing', 
    title: 'Sound Bath Sanctuary',
    prompt: 'A transformative sound healing session in a converted Asheville barn studio. Participants lie on plush floor mats under soft blankets while a sound healer plays crystal singing bowls, tuning forks, and a handpan. The space is illuminated by dozens of flickering candles and Himalayan salt lamps, with large barn doors open to reveal a starry night sky and distant mountain silhouettes. Soft mist from essential oil diffusers mingles with the candlelight, creating an ethereal, deeply peaceful atmosphere perfect for spiritual renewal.'
  }
];

type WellnessContentState = { [key: string]: { image_url: string | null } };

// Loading skeleton component for smooth transitions
const ContentSkeleton = ({ height = 'h-64', width = 'w-full' }: { height?: string; width?: string }) => (
  <div className={`${width} ${height} bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse rounded-xl overflow-hidden`}>
    <div className="h-full w-full bg-gray-700/50" />
  </div>
);

// Newsletter signup component with validation
const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      // Simulate API call - in production, replace with actual newsletter service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Please enter a valid email address');
      }
      
      // In production: await fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) });
      
      setStatus('success');
      setMessage('Welcome to the Serenity Circle! Check your email for your first wellness guide.');
      setEmail('');
      
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-white mb-2">Join Our Wellness Journey</h3>
        <p className="text-gray-300">Get weekly insights, exclusive event invites, and local wellness resources</p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          disabled={status === 'submitting'}
          className={`flex-1 px-4 py-3 bg-gray-800/50 border ${status === 'error' ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className={`px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:transform-none disabled:hover:scale-100 shadow-lg shadow-emerald-500/20`}
        >
          {status === 'submitting' ? 'Subscribing...' : 'Join Circle'}
        </button>
      </form>
      
      {message && (
        <p className={`mt-2 text-sm text-center ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
      
      <p className="mt-2 text-xs text-gray-400 text-center">
        We respect your privacy. Unsubscribe anytime. No spam, ever.
      </p>
    </div>
  );
};

// Testimonial component
const Testimonial = ({ name, role, content, image }: { 
  name: string; 
  role: string; 
  content: string; 
  image?: string 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
  >
    <div className="flex items-start gap-4">
      {image ? (
        <Image 
          src={image} 
          alt={name} 
          width={60} 
          height={60} 
          className="rounded-full object-cover border-2 border-emerald-500/30"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
          {name.charAt(0)}
        </div>
      )}
      <div>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-gray-300 italic mb-3">"{content}"</p>
        <div>
          <p className="font-bold text-white">{name}</p>
          <p className="text-sm text-emerald-400">{role}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

// Event card component
const EventCard = ({ title, date, time, location, description, image }: { 
  title: string; 
  date: string; 
  time: string; 
  location: string; 
  description: string; 
  image?: string 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300"
  >
    {image ? (
      <div className="h-48 relative">
        <Image 
          src={image} 
          alt={title} 
          fill 
          className="object-cover"
        />
      </div>
    ) : (
      <div className="h-48 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
        <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )}
    
    <div className="p-5">
      <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{date} • {time}</span>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-3">{description}</p>
      
      <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{location}</span>
      </div>
      
      <button className="w-full py-2 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-all duration-300 flex items-center justify-center gap-2">
        <span>Reserve Your Spot</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  </motion.div>
);

// Gallery section with admin capabilities
const WellnessGallery = () => {
  const [content, setContent] = useState<WellnessContentState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const hasLoaded = useRef(false);

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
      if (!adminMode) return;

      try {
        const { data: images, error } = await supabase
          .from('images')
          .select('path, created_at')
          .eq('user_id', ADMIN_USER_ID)
          .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading images:', error);
          return;
        }

        const initialState: WellnessContentState = {};
        WELLNESS_CONTENT.forEach(item => initialState[item.id] = { image_url: null });

        if (images) {
          const latestImagePerContent: Record<string, string> = {};

          for (const img of images) {
            const pathParts = img.path.split('/');
            if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
              const contentId = pathParts[2];
              if (WELLNESS_CONTENT.some(a => a.id === contentId) && !latestImagePerContent[contentId]) {
                latestImagePerContent[contentId] = img.path;
              }
            }
          }

          WELLNESS_CONTENT.forEach(item => {
            if (latestImagePerContent[item.id]) {
              const url = supabase.storage
                .from('user_images')
                .getPublicUrl(latestImagePerContent[item.id]).data.publicUrl;
              initialState[item.id] = { image_url: url };
            }
          });
        }

        setContent(initialState);
        hasLoaded.current = true;
      } catch (err) {
        console.error('Error loading gallery:', err);
      }
    };

    loadImages();
  }, [adminMode]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, contentId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(contentId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${contentId}/`;

      // Clean up old images
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
      setContent(prev => ({ ...prev, [contentId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, contentId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(contentId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <section id="gallery" className="py-24 bg-gradient-to-b from-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Moments of <span className="text-emerald-400">Serenity</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Experience the transformative power of community connection and mindful living through our shared moments
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {WELLNESS_CONTENT.map((item) => {
            const itemData = content[item.id] || { image_url: null };
            const imageUrl = itemData.image_url;
            const showSkeleton = !hasLoaded.current && !imageUrl;

            return (
              <div key={item.id} className="bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700/50">
                <div className="relative h-64">
                  {showSkeleton ? (
                    <ContentSkeleton height="h-64" />
                  ) : imageUrl ? (
                    <Image 
                      src={imageUrl} 
                      alt={item.title} 
                      fill 
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      priority
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-wellness.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500/10 to-teal-600/10 flex items-center justify-center p-4">
                      <div className="text-center text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="font-medium">{item.title}</p>
                      </div>
                    </div>
                  )}
                </div>

                {adminMode && (
                  <div className="p-3 border-t border-gray-700 space-y-2">
                    {!imageUrl && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-emerald-300 line-clamp-2">{item.prompt}</p>
                        <button
                          onClick={() => copyPrompt(item.prompt, item.id)}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded self-start transition-colors duration-200"
                          type="button"
                        >
                          {copiedId === item.id ? 'Copied!' : 'Copy Prompt'}
                        </button>
                      </div>
                    )}
                    <label className="block text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded cursor-pointer inline-block transition-colors duration-200">
                      {uploading === item.id ? 'Uploading…' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, item.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <div className={`p-4 ${adminMode ? 'pt-2' : ''}`}>
                  <h3 className="font-bold text-lg text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {item.prompt.split('.')[0]}...
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {adminMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 p-4 bg-emerald-900/30 border border-emerald-500/30 rounded-xl text-center"
          >
            <div className="flex items-center justify-center gap-2 text-emerald-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">
                Admin Mode Active: Upload wellness-themed images or copy detailed prompts for AI generation
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

// Hero section with parallax effect
const HeroSection = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background with parallax effect */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/10" />
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-24">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-block px-4 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium"
              >
                Asheville's Holistic Wellness Community
              </motion.span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Find Your <span className="text-emerald-400">Serenity</span> Circle
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl">
                Join Asheville's most authentic wellness community. We blend ancient wisdom with modern science to help you live with greater presence, connection, and vitality.
              </p>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-lg transition-all transform hover:scale-[1.03] shadow-lg shadow-emerald-500/30">
                Join Our Circle
              </button>
              <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium rounded-xl text-lg transition-all">
                Explore Events
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-4 text-gray-300"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className={`w-10 h-10 rounded-full border-2 border-gray-900 bg-gradient-to-br ${i === 1 ? 'from-emerald-500 to-teal-600' : i === 2 ? 'from-amber-500 to-orange-600' : i === 3 ? 'from-purple-500 to-pink-600' : 'from-blue-500 to-cyan-600'}`}
                  />
                ))}
              </div>
              <span className="text-sm">
                <span className="font-bold text-white">1,234+ members</span> finding peace together
              </span>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            <div className="relative h-[600px] rounded-3xl overflow-hidden border-2 border-emerald-500/20 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-600/5 backdrop-blur-sm" />
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="grid grid-cols-2 gap-4 w-full h-full">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`relative rounded-2xl overflow-hidden border border-gray-800/50 ${i === 1 ? 'col-span-2 h-1/2' : 'h-full'}`}
                    >
                      <div className={`w-full h-full bg-gradient-to-br ${i === 1 ? 'from-emerald-500/20 to-teal-600/20' : i === 2 ? 'from-amber-500/20 to-orange-600/20' : i === 3 ? 'from-purple-500/20 to-pink-600/20' : 'from-blue-500/20 to-cyan-600/20'}`} />
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="text-center text-white/90">
                          <svg className={`w-8 h-8 mx-auto mb-2 ${i === 1 ? 'text-emerald-400' : i === 2 ? 'text-amber-400' : i === 3 ? 'text-purple-400' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />}
                            {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />}
                            {i === 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0-12a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V7zm10 8a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6zm0-12a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V7z" />}
                            {i === 4 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0-5.046a3 3 0 015.356-1.857M7 7.604v-5.046a3 3 0 015.356-1.857M7 7.604A6.965 6.965 0 004 10.5m13 0a6.965 6.965 0 00-3-2.896m0 0a6.965 6.965 0 013-2.896M7 7.604c0 1.857.707 3.5 1.856 4.733M17 10.5a6.965 6.965 0 00-3-2.896m3 2.896a6.965 6.965 0 01-3 2.896" />}
                          </svg>
                          <p className="text-sm font-medium mt-1">
                            {i === 1 && 'Morning Meditation'}
                            {i === 2 && 'Forest Bathing'}
                            {i === 3 && 'Sound Healing'}
                            {i === 4 && 'Herbal Wisdom'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Features section
const FeaturesSection = () => {
  const features = [
    {
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      title: 'Community Connection',
      description: 'Build meaningful relationships with like-minded souls who value authentic human connection and mutual growth.',
      color: 'text-emerald-400'
    },
    {
      icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
      title: 'Holistic Practices',
      description: 'Access diverse wellness modalities from mindfulness to herbal medicine, all grounded in evidence and tradition.',
      color: 'text-amber-400'
    },
    {
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0-12a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V7zm10 8a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6zm0-12a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V7z',
      title: 'Nature Integration',
      description: 'Reconnect with the healing power of the Blue Ridge Mountains through guided forest experiences and outdoor ceremonies.',
      color: 'text-purple-400'
    },
    {
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0-5.046a3 3 0 015.356-1.857M7 7.604v-5.046a3 3 0 015.356-1.857M7 7.604A6.965 6.965 0 004 10.5m13 0a6.965 6.965 0 00-3-2.896m0 0a6.965 6.965 0 013-2.896M7 7.604c0 1.857.707 3.5 1.856 4.733M17 10.5a6.965 6.965 0 00-3-2.896m3 2.896a6.965 6.965 0 01-3 2.896',
      title: 'Personal Growth',
      description: 'Develop emotional intelligence, resilience, and self-awareness through structured programs and peer support.',
      color: 'text-blue-400'
    }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your Path to <span className="text-emerald-400">Wholeness</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            We offer more than wellness programs—we create transformative experiences that nurture mind, body, and spirit
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 flex items-center justify-center mb-4 ${feature.color}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-lg transition-all transform hover:scale-[1.03] shadow-lg shadow-emerald-500/30">
            Discover All Programs
          </button>
        </motion.div>
      </div>
    </section>
  );
};

// Testimonials section
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Maya Rodriguez',
      role: 'Elementary Teacher',
      content: 'Serenity Circle transformed my approach to stress. The morning meditation circles helped me find calm amidst chaos, and the forest bathing weekends reconnected me with nature in ways I never thought possible. I\'m a better teacher and person because of this community.',
      image: '/testimonial-maya.jpg'
    },
    {
      name: 'David Chen',
      role: 'Startup Founder',
      content: 'As an entrepreneur constantly grinding, I was burning out badly. The holistic practices here taught me sustainable productivity. The sound healing sessions are now my secret weapon for creative breakthroughs, and the community accountability keeps me grounded.',
      image: '/testimonial-david.jpg'
    },
    {
      name: 'Sarah Johnson',
      role: 'Healthcare Worker',
      content: 'After years of compassion fatigue in healthcare, I found my healing tribe here. The herbal wisdom workshops empowered me to take control of my own wellness, and the community support during difficult times was exactly what my soul needed.',
      image: '/testimonial-sarah.jpg'
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-gray-900 to-emerald-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Voices from Our <span className="text-emerald-400">Circle</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Real stories from community members who've discovered deeper peace and purpose
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial key={index} {...testimonial} />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-gray-800/50 border border-emerald-500/30 rounded-2xl px-6 py-4">
            <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-xl font-bold text-white">
              "Serenity Circle is the most authentic wellness community I've ever experienced"
            </p>
            <p className="text-gray-400 mt-1">
              - Community Member Survey, 2025
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Events section
const EventsSection = () => {
  const events = [
    {
      title: 'Mountain Sunrise Meditation',
      date: 'May 15, 2025',
      time: '6:30 AM - 7:45 AM',
      location: 'Tunnel Road Overlook',
      description: 'Begin your day with mindful movement and meditation as the sun rises over the Blue Ridge Mountains.',
      image: '/event-sunrise.jpg'
    },
    {
      title: 'Herbal Medicine Making Workshop',
      date: 'May 18, 2025',
      time: '2:00 PM - 4:30 PM',
      location: 'Serenity Studio Downtown',
      description: 'Learn to create your own tinctures, salves, and teas using locally foraged and cultivated botanicals.',
      image: '/event-herbal.jpg'
    },
    {
      title: 'Community Sound Bath & Sharing Circle',
      date: 'May 22, 2025',
      time: '7:00 PM - 9:00 PM',
      location: 'The Sanctuary Barn',
      description: 'Immerse yourself in healing frequencies followed by authentic community connection and storytelling.',
      image: '/event-soundbath.jpg'
    }
  ];

  return (
    <section id="events" className="py-24 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Upcoming <span className="text-emerald-400">Gatherings</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Join us for transformative experiences designed to nourish your soul and connect you with like-hearted community
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <EventCard key={index} {...event} />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-lg transition-all transform hover:scale-[1.03] shadow-lg shadow-emerald-500/30">
            View All Events
          </button>
        </motion.div>
      </div>
    </section>
  );
};

// CTA section
const CTASection = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-emerald-500 to-teal-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your Journey to Peace <span className="text-gray-900">Starts Here</span>
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join 1,234+ community members who wake up each day feeling more connected, grounded, and alive
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-xl text-lg hover:bg-emerald-50 transition-all transform hover:scale-[1.03] shadow-lg shadow-emerald-500/30">
              Start Your Free Trial
            </button>
            <button className="px-8 py-4 bg-emerald-600/20 text-white border border-white/30 font-medium rounded-xl text-lg hover:bg-emerald-600/30 transition-all">
              Schedule a Consultation
            </button>
          </div>
          
          <p className="mt-6 text-emerald-100/80 text-sm max-w-md mx-auto">
            No commitment required • Cancel anytime • 30-day money-back guarantee
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// Footer section
const Footer = () => {
  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">SC</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Serenity Circle
              </span>
            </div>
            <p className="text-gray-400 mb-6">
              Asheville's most authentic wellness community, creating spaces for connection, growth, and transformation since 2018.
            </p>
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 1 ? 'bg-emerald-500/20 text-emerald-400' : i === 2 ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    {i === 1 && <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />}
                    {i === 2 && <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.335c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />}
                    {i === 3 && <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />}
                  </svg>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {['About Us', 'Our Programs', 'Events Calendar', 'Blog & Resources', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-gray-400 hover:text-emerald-400 transition-colors duration-300">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Wellness Resources</h3>
            <ul className="space-y-3">
              {['Meditation Guides', 'Herbal Recipes', 'Forest Bathing Locations', 'Community Guidelines', 'Member Portal'].map((item) => (
                <li key={item}>
                  <Link href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-gray-400 hover:text-emerald-400 transition-colors duration-300">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>123 Mountain View Drive, Asheville, NC 28801</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>(828) 555-0199</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>hello@serenitycircle.asheville</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} Serenity Circle Wellness Collective. All rights reserved. Asheville, North Carolina.
          </p>
          <p className="mt-2 text-gray-400">
            We honor the ancestral lands of the Cherokee people on which we gather and practice.
          </p>
        </div>
      </div>
    </footer>
  );
};

// Main page component
export default function HomePage() {
  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <WellnessGallery />
      <TestimonialsSection />
      <EventsSection />
      <section className="py-24 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <NewsletterSignup />
        </div>
      </section>
      <CTASection />
      <Footer />
    </div>
  );
}