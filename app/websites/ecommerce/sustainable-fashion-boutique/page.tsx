// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin configuration for GallerySkeleton
const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

const ARTWORKS = [
  { 
    id: 'eco-linen-collection', 
    title: 'Organic Linen Collection',
    prompt: 'A serene display of organic linen clothing in soft earth tones, arranged on reclaimed wood shelving with natural light filtering through large windows. Include potted plants and sustainable packaging materials visible in the background.'
  },
  { 
    id: 'recycled-denim-showcase', 
    title: 'Recycled Denim Showcase',
    prompt: 'A vibrant arrangement of recycled denim garments showcasing different washes and styles, displayed on minimalist racks with hanging plants overhead. Include close-up details of upcycled patches and sustainable manufacturing elements.'
  },
  { 
    id: 'sustainable-accessories', 
    title: 'Sustainable Accessories',
    prompt: 'An artistic composition of eco-friendly accessories including bamboo sunglasses, cork wallets, and hemp bags arranged on a textured stone surface with dried flowers and recycled paper tags showing product stories.'
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };

function GallerySkeleton() {
  const [artworks, setArtworks] = useState<ArtworkState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      // Fetch ONLY gallery images for admin
      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`) // Critical filter
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        return;
      }

      const initialState: ArtworkState = {};
      ARTWORKS.forEach(art => initialState[art.id] = { image_url: null });

      if (images) {
        const latestImagePerArtwork: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          // Path structure: [user_id, gallery_prefix, artwork_id, filename]
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            // Only consider defined artworks and take the latest
            if (ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        // Build final state with only relevant artworks
        ARTWORKS.forEach(art => {
          if (latestImagePerArtwork[art.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerArtwork[art.id]).data.publicUrl;
            initialState[art.id] = { image_url: url };
          }
        });
      }

      setArtworks(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(artworkId);
    try {
      // New path structure with gallery identifier
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${artworkId}/`;

      // Clean up OLD gallery images for this artwork
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

      // Upload new image with gallery prefix
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
      setArtworks(prev => ({ ...prev, [artworkId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, artworkId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(artworkId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Veridian Thread Collective — Gallery Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ARTWORKS.map((art) => {
          const artworkData = artworks[art.id] || { image_url: null };
          const imageUrl = artworkData.image_url;

          return (
            <div key={art.id} className="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={art.title} 
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400">No image uploaded yet</span>
                </div>
              )}

              {adminMode && (
                <div className="p-3 border-t border-gray-700 space-y-2">
                  {!imageUrl && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-emerald-300">{art.prompt}</p>
                      <button
                        onClick={() => copyPrompt(art.prompt, art.id)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded self-start"
                        type="button"
                      >
                        {copiedId === art.id ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>
                  )}
                  <label className="block text-sm bg-emerald-600 text-white px-3 py-1 rounded cursor-pointer inline-block">
                    {uploading === art.id ? 'Uploading…' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, art.id)}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              <div className="p-3 mt-auto">
                <h2 className="font-semibold text-emerald-400">{art.title}</h2>
                <p className="text-sm text-gray-400 mt-1">{art.prompt.substring(0, 60)}...</p>
              </div>
            </div>
          );
        })}
      </div>

      {adminMode && (
        <div className="mt-6 p-3 bg-emerald-900/30 border border-emerald-600 rounded text-sm">
          👤 Admin mode active — you can upload images and copy detailed prompts for the sustainable fashion showcase.
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simulate loading state for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && !isSubscribed) {
      // In a real app, this would call your API
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => {
        setIsSubscribed(false);
      }, 5000);
    }
  };

  // Demo product categories with placeholder images
  const categories = [
    {
      id: 'organic-cotton',
      title: 'Organic Cotton Essentials',
      description: 'GOTS-certified organic cotton basics for everyday wear',
      image: '/placeholder-organic-cotton.jpg',
      alt: 'Organic cotton t-shirts and basics'
    },
    {
      id: 'recycled-denim',
      title: 'Recycled Denim Collection',
      description: 'Denim made from 80% recycled materials with zero-waste production',
      image: '/placeholder-recycled-denim.jpg',
      alt: 'Sustainable denim jeans and jackets'
    },
    {
      id: 'eco-activewear',
      title: 'Eco Activewear',
      description: 'Performance wear made from recycled ocean plastic and natural fibers',
      image: '/placeholder-eco-activewear.jpg',
      alt: 'Sustainable workout clothing'
    }
  ];

  // Testimonials for social proof
  const testimonials = [
    {
      id: '1',
      name: 'Maya Rodriguez',
      location: 'Austin, TX',
      text: 'Veridian Thread has completely changed how I think about my wardrobe. Every piece is thoughtfully crafted and built to last. I\'ve never felt better about my clothing choices.',
      rating: 5
    },
    {
      id: '2',
      name: 'James Chen',
      location: 'Houston, TX',
      text: 'The quality is exceptional. I\'ve had my organic cotton shirt for over two years and it still looks brand new. Plus, knowing it\'s ethically made makes it even better.',
      rating: 5
    },
    {
      id: '3',
      name: 'Sophia Williams',
      location: 'Dallas, TX',
      text: 'I love how transparent they are about their supply chain. You can trace every garment back to the farm where the cotton was grown. That level of honesty is rare.',
      rating: 5
    }
  ];

  // Sustainability stats for credibility
  const stats = [
    {
      number: '12,843',
      label: 'Plastic bottles recycled',
      description: 'into our EcoFlex fabric line'
    },
    {
      number: '94%',
      label: 'Water reduction',
      description: 'compared to conventional manufacturing'
    },
    {
      number: '217',
      label: 'Fair wage jobs created',
      description: 'in our partner communities'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading Veridian Thread Collective...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="bg-emerald-600 text-white rounded-full p-2 transition-transform group-hover:scale-110">
                <LeafIcon className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl text-gray-900">Veridian Thread</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#collections" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Collections</Link>
              <Link href="#sustainability" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Our Mission</Link>
              <Link href="#testimonials" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Stories</Link>
              <Link href="/gallery" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Gallery</Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="hidden md:block text-gray-700 hover:text-emerald-600 transition-colors"
                aria-label="Admin panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors font-medium">
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Mobile First Design Essential for Modern Businesses */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-400/10 animate-pulse-slow"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-6"
            >
              <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-4 py-1 rounded-full">
                Sustainable Fashion Redefined
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                Beautiful Clothes
              </span>
              <br />
              That Love The Planet Back
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-600 mb-8"
            >
              Handcrafted sustainable fashion for conscious Texans. Ethically made with organic materials, zero-waste production, and transparent sourcing.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button className="bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Explore Collections
              </button>
              <button className="border-2 border-emerald-600 text-emerald-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-emerald-50 transition-colors">
                Our Sustainability Story
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-12"
            >
              <div className="flex justify-center space-x-8">
                {stats.map((stat, index) => (
                  <div key={stat.number} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-1">{stat.number}</div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                    <div className="text-sm text-gray-500">{stat.description}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section id="collections" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="bg-emerald-100 text-emerald-800 text-sm font-medium px-4 py-1 rounded-full mb-4 inline-block"
            >
              Our Collections
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Thoughtfully Crafted Essentials
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Every piece is designed with sustainability at its core, using eco-friendly materials and ethical manufacturing practices.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="h-80 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-400/10 animate-pulse-slow"></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <span className="text-gray-400 text-lg">Sustainable Fashion Collection</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                  <p className="text-gray-200 mb-4">{category.description}</p>
                  <button className="text-white font-medium flex items-center group-hover:translate-x-1 transition-transform">
                    Shop Collection
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Eco-Certified
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section - Sustainable or Green Design is a key trend for fashion websites in 2024 */}
      <section id="sustainability" className="py-20 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-4 py-1 rounded-full">
                Our Mission
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Fashion That <span className="text-emerald-600">Doesn't Cost</span> The Earth
              </h2>
              <p className="text-xl text-gray-600">
                At Veridian Thread Collective, we believe beautiful clothing shouldn't come at the expense of our planet or people. Since 2019, we've been pioneering sustainable fashion practices in Texas, creating garments that are as kind to the environment as they are stylish.
              </p>
              
              <div className="space-y-4">
                {[
                  {
                    title: 'Ethical Manufacturing',
                    description: 'Every garment is crafted in our Austin studio by fairly paid artisans, with transparent supply chains you can trust.'
                  },
                  {
                    title: 'Eco Materials',
                    description: 'We use only GOTS-certified organic cotton, recycled polyester, hemp, and Tencel™ - materials that minimize environmental impact.'
                  },
                  {
                    title: 'Zero Waste',
                    description: 'Our circular production system ensures 98% of fabric scraps are repurposed into new products or recycled.'
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-emerald-100 text-emerald-600 rounded-full p-2 mt-1 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="bg-emerald-600 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-700 transition-colors">
                Learn More About Our Impact
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-400/20 animate-pulse-slow"></div>
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <span className="text-gray-400 text-lg">Sustainable Fashion Studio</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-emerald-500 text-white rounded-full p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Located in Austin, TX</p>
                      <p className="text-emerald-200 text-sm">Serving conscious consumers across Texas since 2019</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-2xl font-bold text-white">4.9</div>
                      <div className="text-emerald-200 text-sm">Customer Rating</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-2xl font-bold text-white">100%</div>
                      <div className="text-emerald-200 text-sm">Satisfaction Guarantee</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="bg-emerald-100 text-emerald-800 text-sm font-medium px-4 py-1 rounded-full mb-4 inline-block"
            >
              Customer Stories
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Loved by Conscious Texans
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Hear from our community of customers who are making sustainable fashion choices.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-emerald-100"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                
                <div className="flex items-center">
                  <div className="bg-emerald-100 text-emerald-800 rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-emerald-600">{testimonial.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section - Using the provided GallerySkeleton */}
      <section id="gallery" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-4 py-1 rounded-full mb-4 inline-block">
              Our Craft
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Behind The Scenes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Witness the artistry and care that goes into every sustainable garment we create.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
            <GallerySkeleton />
          </div>
        </div>
      </section>

      {/* Newsletter Section - Conversion focused element */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1 rounded-full mb-4">
              Join Our Community
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Be the First to Know
            </h2>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto mb-8">
              Get exclusive access to new sustainable collections, eco-fashion tips, and special offers.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-md mx-auto"
          >
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
              <button
                type="submit"
                className="bg-white text-emerald-700 font-bold px-8 py-4 rounded-full hover:bg-emerald-50 transition-colors whitespace-nowrap"
              >
                Subscribe Now
              </button>
            </form>
            
            <AnimatePresence>
              {isSubscribed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-4 p-4 bg-white/10 rounded-xl text-white border border-white/20"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Thank you! You're now part of our sustainable fashion community.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <p className="mt-4 text-emerald-100 text-sm">
              We respect your privacy. Unsubscribe anytime. No spam, just sustainable fashion love.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-emerald-600 text-white rounded-full p-2">
                  <LeafIcon className="w-6 h-6" />
                </div>
                <span className="font-bold text-xl">Veridian Thread</span>
              </div>
              <p className="text-gray-400 mb-4">
                Crafting sustainable fashion since 2019. Every garment tells a story of ethical craftsmanship and environmental responsibility.
              </p>
              <div className="flex space-x-4">
                {[1,2,3,4].map((i) => (
                  <a key={i} href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072c-2.826.128-4.845 1.653-5.281 4.58-.138.928-.16 1.302-.16 4.358s.023 3.43.16 4.358c.436 2.927 2.456 4.451 5.281 4.58C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c2.825-.128 4.844-1.653 5.28-4.58.138-.928.16-1.302.16-4.358s-.022-3.43-.16-4.358c-.436-2.926-2.455-4.451-5.28-4.58C15.668.014 15.26 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold mb-4">Shop</h3>
              <ul className="space-y-2">
                {['New Arrivals', 'Best Sellers', 'Organic Cotton', 'Recycled Denim', 'Eco Activewear'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                {['Our Story', 'Sustainability', 'Ethical Manufacturing', 'Transparency Report', 'Careers'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                {['Contact Us', 'Shipping & Returns', 'Size Guide', 'Care Instructions', 'FAQ'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Veridian Thread Collective. All rights reserved.</p>
            <p className="mt-2">Made with ♥ in Austin, TX | B Corp Certified</p>
          </div>
        </div>
      </footer>

      {/* Admin Panel Toggle - Hidden in production but available for admin */}
      {showAdminPanel && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          Admin Panel Active
        </div>
      )}
    </div>
  );
}

// Helper component for leaf icon
function LeafIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}