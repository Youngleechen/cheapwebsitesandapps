'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Instagram, Facebook, Mail, Phone, MapPin, Star, ChevronRight, ChevronLeft, ShoppingBag, Heart, Truck, ShieldCheck, RefreshCw } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery'; // Dedicated identifier for gallery images

// Custom jewelry-specific artwork prompts for admin uploads
const JEWELRY_COLLECTIONS = [
  { 
    id: 'heirloom-necklaces', 
    title: 'Heirloom Necklaces Collection',
    prompt: 'A stunning collection of handcrafted heirloom necklaces featuring genuine freshwater pearls, delicate gold chains, and intricate filigree pendant designs. Soft, warm lighting highlighting the craftsmanship and texture of each piece against a neutral backdrop.'
  },
  { 
    id: 'artisan-bracelets', 
    title: 'Artisan Bracelets Collection',
    prompt: 'An elegant display of handcrafted artisan bracelets showcasing hammered sterling silver cuffs, woven leather bands with turquoise inlays, and delicate chain bracelets with hand-stamped charms. Natural daylight photography emphasizing texture and artisanal details.'
  },
  { 
    id: 'statement-earrings', 
    title: 'Statement Earrings Collection',
    prompt: 'A dramatic arrangement of bold statement earrings featuring hand-cut gemstones, intricate metalwork, and dramatic silhouettes. Studio photography with dramatic shadows and highlights to showcase the three-dimensional artistry and craftsmanship of each unique piece.'
  },
  {
    id: 'wedding-collection', 
    title: 'Bridal & Wedding Collection',
    prompt: 'A romantic bridal jewelry collection featuring delicate diamond-accented hairpins, vintage-inspired pearl drop earrings, and heirloom-quality engagement rings. Soft, dreamy lighting with ivory and champagne tones, capturing the emotional significance of wedding day jewelry.'
  },
  {
    id: 'mens-collection', 
    title: 'Men\'s Jewelry Collection',
    prompt: 'A sophisticated collection of men\'s jewelry including hand-forged titanium rings, leather-wrapped cuff bracelets, minimalist pendant necklaces, and pocket watch chains. Moody, masculine photography with rich textures and deep shadows highlighting craftsmanship and materials.'
  },
  {
    id: 'custom-pendants', 
    title: 'Custom Pendants & Charms',
    prompt: 'A personalized jewelry display featuring custom name pendants, birthstone charms, memorial keepsakes, and hand-engraved lockets. Warm, intimate photography showing the sentimental value and personalization options available for meaningful gift-giving.'
  }
];

type CollectionState = { [key: string]: { image_url: string | null } };

export default function Page() {
  const [collections, setCollections] = useState<CollectionState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Initialize user session and admin mode
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load collection images
  useEffect(() => {
    const loadCollections = async () => {
      try {
        // Initialize state with null images
        const initialState: CollectionState = {};
        JEWELRY_COLLECTIONS.forEach(collection => {
          initialState[collection.id] = { image_url: null };
        });

        // Only fetch images if admin mode is active or we need to show them
        if (adminMode) {
          const { data: images, error } = await supabase
            .from('images')
            .select('path, created_at')
            .eq('user_id', ADMIN_USER_ID)
            .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error loading images:', error);
          } else if (images) {
            const latestImagePerCollection: Record<string, string> = {};

            for (const img of images) {
              const pathParts = img.path.split('/');
              if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
                const collectionId = pathParts[2];
                if (JEWELRY_COLLECTIONS.some(c => c.id === collectionId) && !latestImagePerCollection[collectionId]) {
                  latestImagePerCollection[collectionId] = img.path;
                }
              }
            }

            // Update state with available images
            JEWELRY_COLLECTIONS.forEach(collection => {
              if (latestImagePerCollection[collection.id]) {
                const url = supabase.storage
                  .from('user_images')
                  .getPublicUrl(latestImagePerCollection[collection.id]).data.publicUrl;
                initialState[collection.id] = { image_url: url };
              }
            });
          }
        }

        setCollections(initialState);
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCollections();
  }, [adminMode]);

  // Handle admin image uploads
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, collectionId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // New path structure with gallery identifier
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${collectionId}/`;

      // Clean up OLD gallery images for this collection
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
      setCollections(prev => ({ ...prev, [collectionId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  // Copy prompt for admin
  const copyPrompt = (prompt: string, collectionId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      alert('Prompt copied to clipboard! Use this for AI image generation.');
    });
  };

  // Carousel navigation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Add to cart handler
  const handleAddToCart = () => {
    setCartItems(prev => prev + 1);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Featured items for carousel
  const featuredItems = [
    {
      id: 1,
      title: 'Celestial Moonstone Necklace',
      price: '$189',
      description: 'Handcrafted sterling silver necklace featuring a genuine moonstone pendant with celestial engraving',
      image: collections['heirloom-necklaces']?.image_url || '/placeholder-jewelry-1.jpg'
    },
    {
      id: 2,
      title: 'Artisan Leather Cuff Bracelet',
      price: '$125',
      description: 'Hand-tooled leather cuff bracelet with sterling silver accents and turquoise inlay',
      image: collections['artisan-bracelets']?.image_url || '/placeholder-jewelry-2.jpg'
    },
    {
      id: 3,
      title: 'Geometric Diamond Studs',
      price: '$325',
      description: 'Modern geometric diamond earrings set in 14k gold with hand-finished details',
      image: collections['statement-earrings']?.image_url || '/placeholder-jewelry-3.jpg'
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: 'Sarah M.',
      location: 'Seattle, WA',
      text: 'My Lumina necklace has become my most cherished possession. The craftsmanship is exceptional, and the personal attention to detail made me feel valued as a customer.',
      rating: 5
    },
    {
      id: 2,
      name: 'Michael T.',
      location: 'Austin, TX',
      text: 'I commissioned a custom wedding band for my wife, and the result exceeded all expectations. The artisan worked closely with us to create something truly unique and meaningful.',
      rating: 5
    },
    {
      id: 3,
      name: 'Elena R.',
      location: 'Chicago, IL',
      text: 'The quality of Lumina\'s jewelry is unmatched. Every piece tells a story and feels like it was made with love and intention. I\'ve recommended them to all my friends.',
      rating: 5
    }
  ];

  // Process to commission section
  const processSteps = [
    {
      step: 1,
      title: 'Consultation',
      description: 'Schedule a complimentary 30-minute consultation to discuss your vision, materials, and timeline.',
      icon: <Phone className="w-8 h-8 text-gold-400" />
    },
    {
      step: 2,
      title: 'Design',
      description: 'Our master artisans create detailed sketches and 3D renderings for your approval before crafting begins.',
      icon: <RefreshCw className="w-8 h-8 text-gold-400" />
    },
    {
      step: 3,
      title: 'Crafting',
      description: 'Your piece is meticulously handcrafted using traditional techniques and ethically sourced materials.',
      icon: <ShieldCheck className="w-8 h-8 text-gold-400" />
    },
    {
      step: 4,
      title: 'Delivery',
      description: 'Your heirloom piece arrives in custom packaging, ready to be treasured for generations.',
      icon: <Truck className="w-8 h-8 text-gold-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-2xl font-serif font-bold text-gray-800">Lumina</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#collections" className="text-gray-700 hover:text-gold-500 font-medium transition-colors">Collections</Link>
              <Link href="#process" className="text-gray-700 hover:text-gold-500 font-medium transition-colors">Our Process</Link>
              <Link href="#testimonials" className="text-gray-700 hover:text-gold-500 font-medium transition-colors">Stories</Link>
              <Link href="#contact" className="text-gray-700 hover:text-gold-500 font-medium transition-colors">Commission</Link>
            </nav>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-700 hover:text-gold-500 transition-colors">
                <Heart className="w-6 h-6" />
                {cartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems}
                  </span>
                )}
              </button>
              <button className="relative p-2 text-gray-700 hover:text-gold-500 transition-colors">
                <ShoppingBag className="w-6 h-6" />
                {cartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-gold-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4">
            <div className="container mx-auto px-4 space-y-4">
              <Link href="#collections" className="block py-2 text-gray-700 hover:text-gold-500 font-medium">Collections</Link>
              <Link href="#process" className="block py-2 text-gray-700 hover:text-gold-500 font-medium">Our Process</Link>
              <Link href="#testimonials" className="block py-2 text-gray-700 hover:text-gold-500 font-medium">Stories</Link>
              <Link href="#contact" className="block py-2 text-gray-700 hover:text-gold-500 font-medium">Commission</Link>
              <div className="pt-4 border-t border-gray-200 flex space-x-4">
                <button className="flex-1 bg-gold-500 text-white py-2 rounded-lg font-medium hover:bg-gold-600 transition-colors">
                  Book Consultation
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {!heroImageLoaded && (
            <div className="w-full h-full bg-gradient-to-br from-amber-50 to-gold-50 animate-pulse" />
          )}
          <AnimatePresence>
            {!heroImageLoaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-amber-50 to-gold-50"
              />
            )}
          </AnimatePresence>
          <Image
            src={collections['wedding-collection']?.image_url || '/hero-placeholder.jpg'}
            alt="Handcrafted jewelry artisan at work"
            fill
            className="object-cover opacity-90"
            priority
            onLoad={() => setHeroImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-block px-4 py-1 bg-gold-500/20 backdrop-blur-sm rounded-full mb-6">
              <span className="text-gold-700 font-medium">Since 2012 • Handcrafted in Seattle</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
              Jewelry That Tells Your Story
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Every piece is meticulously handcrafted by master artisans using ethically sourced materials and time-honored techniques.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gold-500 text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-gold-600 transition-colors shadow-lg hover:shadow-gold-500/25"
              >
                Explore Collections
                <ChevronRight className="ml-2 w-5 h-5 inline" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-white/10 transition-colors"
              >
                Commission Custom Piece
              </motion.button>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white/80" />
        </div>
      </section>

      {/* Featured Collections Section */}
      <section id="collections" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl font-serif font-bold text-gray-800 mb-4">
                Our Signature Collections
              </h2>
              <p className="text-gray-600 text-lg">
                Each collection is born from a deep respect for craftsmanship and a commitment to creating pieces that become cherished heirlooms.
              </p>
            </motion.div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="h-64 bg-gray-200" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {JEWELRY_COLLECTIONS.map((collection) => {
                const collectionData = collections[collection.id] || { image_url: null };
                const hasImage = !!collectionData.image_url;
                const imageUrl = collectionData.image_url || '/placeholder-collection.jpg';

                return (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className={`bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${adminMode ? 'border-2 border-dashed border-purple-300/50' : ''}`}
                  >
                    <div className="relative h-64 overflow-hidden group">
                      {hasImage ? (
                        <Image
                          src={imageUrl}
                          alt={collection.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          unoptimized // Important for admin-uploaded images
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-50 to-gold-50 flex items-center justify-center">
                          <div className="text-center p-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="text-white font-bold text-xl">{collection.id[0].toUpperCase()}</span>
                            </div>
                            <p className="text-gray-500 font-medium">Image will appear here</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="text-xl font-serif font-bold mb-2">{collection.title}</h3>
                          <p className="text-sm opacity-90 mb-4">{collection.prompt.substring(0, 100)}...</p>
                          <button className="text-sm font-medium flex items-center hover:underline">
                            View Collection <ChevronRight className="ml-1 w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {adminMode && (
                      <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
                        {!hasImage && (
                          <div className="space-y-2">
                            <p className="text-xs text-purple-600 line-clamp-2">{collection.prompt}</p>
                            <button
                              onClick={() => copyPrompt(collection.prompt, collection.id)}
                              className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 transition-colors"
                            >
                              Copy Prompt
                            </button>
                          </div>
                        )}
                        <label className="block w-full bg-gold-500 text-white text-sm font-medium px-3 py-2 rounded-lg cursor-pointer text-center hover:bg-gold-600 transition-colors">
                          {hasImage ? 'Update Image' : 'Upload Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, collection.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {adminMode && (
            <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-2 text-purple-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Admin Mode:</span>
                <span className="text-sm">Upload images for each collection using the prompts provided. Images will appear immediately after upload.</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Items Carousel */}
      <section className="py-20 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-serif font-bold text-gray-800 mb-4">
              Featured Handcrafted Pieces
            </h2>
            <p className="text-gray-600 text-lg">
              Discover our most beloved creations, each piece telling its own unique story through masterful craftsmanship.
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <div className="relative h-[500px]">
                {featuredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: index === currentSlide ? 1 : 0,
                      x: index === currentSlide ? 0 : (index > currentSlide ? 100 : -100)
                    }}
                    transition={{ duration: 0.5 }}
                    className={`absolute inset-0 ${index === currentSlide ? 'z-10' : 'z-0'}`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                      <div className="relative h-96 lg:h-full">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gold-500 font-bold text-lg">{item.price}</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 text-gold-400 fill-current" />
                                ))}
                              </div>
                            </div>
                            <h3 className="text-xl font-serif font-bold text-gray-800">{item.title}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-8 flex flex-col justify-center">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">{item.title}</h3>
                            <p className="text-gray-600 text-lg mb-4">{item.description}</p>
                            <div className="flex space-x-4 mb-6">
                              <span className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full">Handcrafted</span>
                              <span className="text-sm bg-gold-100 text-gold-800 px-3 py-1 rounded-full">Ethically Sourced</span>
                              <span className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">Lifetime Warranty</span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <button 
                              onClick={handleAddToCart}
                              className="w-full bg-gold-500 text-white py-4 rounded-xl font-medium text-lg hover:bg-gold-600 transition-colors flex items-center justify-center space-x-2"
                            >
                              <ShoppingBag className="w-5 h-5" />
                              <span>Add to Cart</span>
                            </button>
                            <button className="w-full bg-white border-2 border-gray-200 text-gray-800 py-4 rounded-xl font-medium text-lg hover:border-gold-500 transition-colors">
                              Schedule Consultation
                            </button>
                          </div>
                          <div className="pt-6 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                              Each piece is made to order and typically ships within 2-3 weeks. Rush production available.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Carousel Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {featuredItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentSlide === index ? 'bg-gold-500 w-6' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => setCurrentSlide(prev => prev === 0 ? featuredItems.length - 1 : prev - 1)}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <button
              onClick={() => setCurrentSlide(prev => prev === featuredItems.length - 1 ? 0 : prev + 1)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
          </div>

          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="max-w-md mx-auto mt-8 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-center"
            >
              <p className="font-medium">Item added to cart! You can continue shopping or proceed to checkout.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Our Process Section */}
      <section id="process" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl font-serif font-bold text-gray-800 mb-4">
                The Lumina Craftsmanship Journey
              </h2>
              <p className="text-gray-600 text-lg">
                From initial concept to final delivery, every piece undergoes a meticulous process that honors traditional craftsmanship while embracing modern precision.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-cream-50 rounded-xl p-8 text-center border border-cream-200 hover:border-gold-200 transition-colors"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-amber-600 rounded-full flex items-center justify-center text-white">
                    {step.icon}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="w-8 h-8 bg-gold-100 text-gold-700 rounded-full flex items-center justify-center font-bold mx-auto">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-gray-800">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
                Our commitment to excellence extends beyond craftsmanship. We use only ethically sourced materials, provide lifetime repairs, and plant a tree for every piece sold.
              </p>
              <button className="bg-gradient-to-r from-gold-500 to-amber-600 text-white px-8 py-4 rounded-xl font-medium text-lg hover:from-gold-600 hover:to-amber-700 transition-colors shadow-lg">
                Learn About Our Materials
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-gold-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl font-serif font-bold text-gray-800 mb-4">
                Stories Behind the Jewelry
              </h2>
              <p className="text-gray-600 text-lg">
                Hear from our clients about the meaningful moments our jewelry has been a part of.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-cream-100"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-gold-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div className="border-t border-cream-200 pt-4">
                  <div className="font-serif font-bold text-gray-800">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.location}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <button className="bg-white text-gray-800 border-2 border-gray-200 px-6 py-3 rounded-full font-medium hover:border-gold-500 hover:text-gold-500 transition-colors">
                Read More Stories
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Commission Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-4xl font-serif font-bold text-gray-800 mb-6">
                  Commission Your Heirloom Piece
                </h2>
                <p className="text-gray-600 text-lg mb-8">
                  Whether you're marking a milestone, honoring a loved one, or simply treating yourself to something extraordinary, our master artisans will work with you to create a piece that carries your story.
                </p>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">
                      <Phone className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Personal Consultation</h3>
                      <p className="text-gray-600">Schedule a complimentary 30-minute consultation to discuss your vision and timeline.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">
                      <MapPin className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Studio Visit</h3>
                      <p className="text-gray-600">Visit our Seattle studio to see materials, techniques, and works in progress.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-cream-50 rounded-xl p-6 border border-cream-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-amber-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">2</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-gray-800">Week Average Timeline</h3>
                      <p className="text-sm text-gray-600">From consultation to completion</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 rounded-2xl p-8 shadow-sm"
              >
                <h3 className="text-2xl font-serif font-bold text-gray-800 mb-6">Request Consultation</h3>
                <form className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-colors"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">Project Details</label>
                    <textarea
                      id="project"
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-colors"
                      placeholder="Tell us about your vision, occasion, materials you prefer, and any inspiration photos..."
                    />
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                      />
                      <span className="text-sm text-gray-600">I'd like to receive updates about my commission and occasional inspiration from Lumina</span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-gold-500 to-amber-600 text-white py-4 rounded-xl font-medium text-lg hover:from-gold-600 hover:to-amber-700 transition-colors shadow-lg hover:shadow-gold-500/25"
                  >
                    Schedule My Consultation
                  </button>
                </form>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  We respect your privacy. Your information will only be used to contact you about your commission inquiry.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-2xl font-serif font-bold">Lumina</span>
              </div>
              <p className="text-gray-400 mb-6">
                Handcrafted jewelry designed to tell your story and become cherished heirlooms for generations to come.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-gold-400 transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gold-400 transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gold-400">Collections</h3>
              <ul className="space-y-2">
                {JEWELRY_COLLECTIONS.map(collection => (
                  <li key={collection.id}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{collection.title}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gold-400">Customer Care</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Shipping & Returns</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Sizing Guide</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Care Instructions</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gold-400">Visit Our Studio</h3>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gold-400 mt-1" />
                  <span>123 Artisan Way, Seattle, WA 98101</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gold-400 mt-1" />
                  <span>(206) 555-1234</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gold-400 mt-1" />
                  <span>hello@luminajewelry.com</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-sm">
                    Open Tuesday-Saturday, 10am-6pm<br />
                    By appointment only on Sundays
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>
              © {new Date().getFullYear()} Lumina Handcrafted Jewelry. All rights reserved. Each piece is meticulously crafted with love and intention.
            </p>
            <p className="mt-2">
              Ethically sourced materials • Lifetime repairs • Tree planted with every purchase
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-gold-500 to-amber-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Phone className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}

// Helper component for Chevrons
const ChevronDown = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);