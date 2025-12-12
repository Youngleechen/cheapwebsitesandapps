'use client';

import { useState, useEffect } from 'react';
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

// Skincare-specific artwork prompts for admin uploads
const ARTWORKS = [
  { 
    id: 'hero-banner', 
    title: 'Hero Banner',
    prompt: 'A serene, natural skincare hero banner featuring organic botanicals like lavender, chamomile, and rose petals arranged elegantly on a clean white marble surface with soft, diffused natural lighting. Include subtle water droplets on glass bottles and a minimalist aesthetic that conveys purity and luxury.'
  },
  { 
    id: 'product-showcase', 
    title: 'Product Showcase',
    prompt: 'A beautifully arranged flat lay of premium organic skincare products including glass serum bottles, ceramic jars with bamboo lids, and natural ingredient bundles. Shot with warm, golden hour lighting on a textured linen background with soft shadows. Include fresh herbs like rosemary and eucalyptus for visual interest.'
  },
  { 
    id: 'ingredients-closeup', 
    title: 'Ingredients Closeup',
    prompt: 'An extreme close-up macro shot of fresh organic ingredients used in skincare: raw honey dripping slowly, crushed rose petals releasing oils, and fresh aloe vera gel being extracted. Shot with dramatic lighting that highlights texture and natural sheen, conveying the potency and purity of the ingredients.'
  },
  { 
    id: 'lifestyle-shot', 
    title: 'Lifestyle Shot',
    prompt: 'A candid lifestyle photo of a woman in her 30s enjoying a self-care moment at home. She has glowing skin and is gently applying serum to her face while sitting by a sunlit window with plants. The scene should feel authentic, calming, and aspirational with soft natural light and warm tones.'
  },
  { 
    id: 'workshop-space', 
    title: 'Workshop Space',
    prompt: 'A behind-the-scenes look at a small-batch skincare workshop with copper distillation equipment, glass beakers filled with botanical extracts, and hand-written recipe notes on a rustic wooden table. Natural light streams through large windows, highlighting the craftsmanship and artisanal quality.'
  },
  { 
    id: 'packaging-detail', 
    title: 'Packaging Detail',
    prompt: 'An artistic close-up of sustainable luxury skincare packaging: glass bottles with minimal labeling, recycled paper boxes with gold foil stamping, and reusable containers. Shot on a dark moody background with dramatic lighting that highlights the premium, eco-conscious design details.'
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };

// Main Gallery component integrated into the skincare shop
function SkincareGallery() {
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
      try {
        // Fetch ONLY gallery images for admin
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

        const initialState: ArtworkState = {};
        ARTWORKS.forEach(art => initialState[art.id] = { image_url: null });

        if (images) {
          const latestImagePerArtwork: Record<string, string> = {};

          for (const img of images) {
            const pathParts = img.path.split('/');
            if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
              const artId = pathParts[2];
              if (ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
                latestImagePerArtwork[artId] = img.path;
              }
            }
          }

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
      } catch (err) {
        console.error('Error loading gallery images:', err);
      }
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(artworkId);
    try {
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
    }).catch(err => {
      console.error('Failed to copy prompt:', err);
    });
  };

  const getImageUrl = (artworkId: string): string | null => {
    return artworks[artworkId]?.image_url || null;
  };

  return {
    adminMode,
    getImageUrl,
    handleUpload,
    copyPrompt,
    copiedId,
    uploading
  };
}

// Product interface for TypeScript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
}

// Testimonial interface
interface Testimonial {
  id: string;
  author: string;
  location: string;
  text: string;
  rating: number;
}

// Ingredient interface
interface Ingredient {
  name: string;
  description: string;
  benefits: string[];
}

export default function BloomBotanicalsPage() {
  // Initialize gallery system
  const gallery = SkincareGallery();
  
  // Product data
  const products: Product[] = [
    {
      id: 'serum-001',
      name: 'Radiant Renewal Serum',
      description: 'Vitamin C and hyaluronic acid serum for brightening and hydration',
      price: 48.00,
      category: 'Serums',
      rating: 4.9,
      reviews: 128,
      inStock: true
    },
    {
      id: 'moisturizer-001',
      name: 'Nourishing Night Cream',
      description: 'Rich evening moisturizer with ceramides and bakuchiol',
      price: 52.00,
      category: 'Moisturizers',
      rating: 4.8,
      reviews: 94,
      inStock: true
    },
    {
      id: 'cleanser-001',
      name: 'Gentle Botanical Cleanser',
      description: 'pH-balanced daily cleanser with chamomile and green tea',
      price: 32.00,
      category: 'Cleansers',
      rating: 4.7,
      reviews: 156,
      inStock: true
    },
    {
      id: 'mask-001',
      name: 'Detox Clay Mask',
      description: 'Deep cleansing mask with kaolin clay and rose quartz',
      price: 38.00,
      category: 'Masks',
      rating: 4.9,
      reviews: 87,
      inStock: true
    }
  ];

  // Testimonials
  const testimonials: Testimonial[] = [
    {
      id: 'test-001',
      author: 'Sarah Johnson',
      location: 'Seattle, WA',
      text: 'After years of struggling with sensitive skin, Bloom Botanicals has been a game-changer. My skin has never looked healthier!',
      rating: 5
    },
    {
      id: 'test-002',
      author: 'Michael Chen',
      location: 'Austin, TX',
      text: 'The Radiant Renewal Serum visibly reduced my dark spots within weeks. Worth every penny for the results.',
      rating: 5
    },
    {
      id: 'test-003',
      author: 'Emma Rodriguez',
      location: 'Portland, OR',
      text: 'I love that their products are truly clean and effective. No more breakouts since switching to their gentle cleanser.',
      rating: 5
    }
  ];

  // Key ingredients
  const keyIngredients: Ingredient[] = [
    {
      name: 'Organic Rosehip Oil',
      description: 'Cold-pressed from wild rosehips',
      benefits: ['Rich in Vitamin A', 'Reduces fine lines', 'Brightens skin tone']
    },
    {
      name: 'Hyaluronic Acid',
      description: 'Naturally derived from plant fermentation',
      benefits: ['Deep hydration', 'Plumps skin', 'Improves elasticity']
    },
    {
      name: 'Bakuchiol',
      description: 'Plant-based alternative to retinol',
      benefits: ['Gentle anti-aging', 'Reduces wrinkles', 'No irritation']
    }
  ];

  // State for newsletter signup
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, this would call your API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSignupSuccess(true);
      setEmail('');
    } catch (error) {
      console.error('Signup failed:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 font-bold text-xl">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Bloom Botanicals</span>
            </Link>
            
            <nav className="hidden md:block">
              <ul className="flex space-x-8">
                <li><button onClick={() => scrollToSection('products')} className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Products</button></li>
                <li><button onClick={() => scrollToSection('ingredients')} className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Ingredients</button></li>
                <li><button onClick={() => scrollToSection('reviews')} className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Reviews</button></li>
                <li><button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Our Story</button></li>
              </ul>
            </nav>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-700 hover:text-emerald-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button className="p-2 text-gray-700 hover:text-emerald-600 transition-colors relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">2</span>
              </button>
              <button className="md:hidden p-2 text-gray-700 hover:text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-emerald-50 to-teal-50 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-100 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                Clean • Sustainable • Effective
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Nature's Wisdom, Science's Precision
              </h1>
              
              <p className="text-xl text-gray-600 max-w-lg">
                Handcrafted organic skincare that transforms your skin with the purest botanical ingredients, ethically sourced and scientifically formulated.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => scrollToSection('products')}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors transform hover:scale-105"
                >
                  Shop Our Collection
                </button>
                <button 
                  onClick={() => scrollToSection('about')}
                  className="border-2 border-emerald-600 text-emerald-600 px-6 py-3 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
                >
                  Our Story
                </button>
              </div>
              
              <div className="flex items-center space-x-4 pt-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold">
                      {i}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">4,287+</span> customers transformed
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-3xl opacity-20 blur-xl"></div>
              
              <div className="relative bg-white rounded-2xl shadow-xl p-6">
                {gallery.getImageUrl('hero-banner') ? (
                  <div className="relative aspect-square w-full">
                    <Image
                      src={gallery.getImageUrl('hero-banner')!}
                      alt="Premium organic skincare products"
                      fill
                      className="object-cover rounded-xl"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center border-2 border-dashed border-emerald-200">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <p className="text-gray-500">Product showcase image will appear here</p>
                    </div>
                  </div>
                )}
                
                {gallery.adminMode && (
                  <div className="mt-4 flex justify-center">
                    <label className="block bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full cursor-pointer">
                      {gallery.uploading === 'hero-banner' ? 'Uploading...' : 'Update Hero Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => gallery.handleUpload(e, 'hero-banner')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 max-w-xs hidden md:block">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-800 font-bold">★</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">98% Satisfaction</p>
                    <p className="text-xs text-gray-500">Based on 1,200+ reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-4">
              Our Promise
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Crafted with Care, Backed by Science
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every product is handcrafted in small batches using organic ingredients sourced from regenerative farms.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Our Journey</h3>
                <p className="text-gray-600 mb-4">
                  Founded in 2019 by herbalist Maya Chen, Bloom Botanicals began as a small apothecary in Boulder, Colorado. What started as a passion for healing plants has grown into a mission to bring truly clean, effective skincare to everyone.
                </p>
                <p className="text-gray-600">
                  We believe that what you put on your skin matters as much as what you put in your body. That's why we never compromise on ingredient quality or transparency.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="text-emerald-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">100% Organic</h4>
                  <p className="text-sm text-gray-600">Certified organic ingredients</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="text-emerald-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Plastic-Free</h4>
                  <p className="text-sm text-gray-600">Sustainable packaging</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="text-emerald-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Vegan & Cruelty-Free</h4>
                  <p className="text-sm text-gray-600">Never tested on animals</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="text-emerald-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Women-Owned</h4>
                  <p className="text-sm text-gray-600">Supporting female farmers</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              {gallery.getImageUrl('workshop-space') ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={gallery.getImageUrl('workshop-space')!}
                    alt="Our artisanal skincare workshop"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-emerald-200">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">Workshop image will appear here</p>
                  </div>
                </div>
              )}
              
              {gallery.adminMode && (
                <div className="mt-4 flex justify-center">
                  <label className="block bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full cursor-pointer">
                    {gallery.uploading === 'workshop-space' ? 'Uploading...' : 'Update Workshop Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => gallery.handleUpload(e, 'workshop-space')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
              
              <div className="absolute -top-6 -left-6 bg-white rounded-xl shadow-lg p-6 max-w-xs hidden lg:block transform -rotate-3">
                <div className="font-bold text-emerald-600 mb-1">🌿 Small-Batch Crafted</div>
                <p className="text-gray-600 text-sm">
                  Each product is made in batches of no more than 50 units to ensure maximum freshness and potency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-4">
              Our Best Sellers
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Skincare That Delivers Results
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Formulated with clinically-proven ingredients and backed by real customer results.
            </p>
          </div>
          
          {gallery.getImageUrl('product-showcase') ? (
            <div className="mb-12 hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src={gallery.getImageUrl('product-showcase')!}
                  alt="Our premium skincare collection"
                  width={1200}
                  height={600}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
              
              {gallery.adminMode && (
                <div className="mt-4 flex justify-center">
                  <label className="block bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full cursor-pointer">
                    {gallery.uploading === 'product-showcase' ? 'Uploading...' : 'Update Product Showcase'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => gallery.handleUpload(e, 'product-showcase')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-12 hidden lg:block">
              <div className="h-96 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-emerald-200">
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Product showcase image will appear here</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-100">
                <div className="p-6">
                  <div className="h-48 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                    {gallery.getImageUrl('packaging-detail') ? (
                      <Image
                        src={gallery.getImageUrl('packaging-detail')!}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="object-contain p-4"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <p className="text-sm">Product image</p>
                      </div>
                    )}
                    
                    {gallery.adminMode && product.id === 'serum-001' && (
                      <div className="absolute top-2 right-2">
                        <label className="block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full cursor-pointer">
                          {gallery.uploading === 'packaging-detail' ? 'Uploading...' : 'Update'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => gallery.handleUpload(e, 'packaging-detail')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h3>
                  
                  <div className="flex items-center mb-2">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">({product.reviews})</span>
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-emerald-600">${product.price.toFixed(2)}</span>
                    {product.inStock ? (
                      <span className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">In Stock</span>
                    ) : (
                      <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Out of Stock</span>
                    )}
                  </div>
                  
                  <button 
                    className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                    disabled={!product.inStock}
                  >
                    {product.inStock ? 'Add to Cart' : 'Notify When Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button 
              className="inline-flex items-center text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
              onClick={() => scrollToSection('ingredients')}
            >
              View all products
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Ingredients Section */}
      <section id="ingredients" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-4">
              Pure Ingredients
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Goes On Your Skin Matters
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We source only the highest quality organic ingredients, each chosen for its proven benefits.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              {gallery.getImageUrl('ingredients-closeup') ? (
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={gallery.getImageUrl('ingredients-closeup')!}
                    alt="Close-up of organic skincare ingredients"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-emerald-200">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">Ingredients image will appear here</p>
                  </div>
                </div>
              )}
              
              {gallery.adminMode && (
                <div className="mt-4 flex justify-center">
                  <label className="block bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full cursor-pointer">
                    {gallery.uploading === 'ingredients-closeup' ? 'Uploading...' : 'Update Ingredients Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => gallery.handleUpload(e, 'ingredients-closeup')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
              
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 max-w-xs hidden lg:block transform rotate-3">
                <div className="font-bold text-emerald-600 mb-1">🌱 Certified Organic</div>
                <p className="text-gray-600 text-sm">
                  Every ingredient is USDA certified organic and traceable to its source.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              {keyIngredients.map((ingredient, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-emerald-200 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-800 font-bold text-lg">{ingredient.name.charAt(0)}</span>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{ingredient.name}</h3>
                      <p className="text-gray-600 mb-2">{ingredient.description}</p>
                      
                      <ul className="space-y-1">
                        {ingredient.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500 mt-1 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-4">
                <button className="text-emerald-600 font-medium hover:text-emerald-700 flex items-center">
                  Learn about our sourcing practices
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="reviews" className="py-20 bg-gradient-to-b from-teal-50 to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-4">
              Real Results
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of customers who have transformed their skin with Bloom Botanicals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white rounded-xl p-8 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-emerald-800 font-bold text-lg">{testimonial.author.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.author}</h4>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
                
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                <p className="text-gray-600 italic mb-4">"{testimonial.text}"</p>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">Verified Purchase</span>
                  <span className="text-sm text-gray-500">• 3 weeks ago</span>
                </div>
              </div>
            ))}
          </div>
          
          {gallery.getImageUrl('lifestyle-shot') && (
            <div className="mt-12 text-center">
              <div className="relative max-w-3xl mx-auto">
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={gallery.getImageUrl('lifestyle-shot')!}
                    alt="Customer enjoying skincare routine"
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>
                
                {gallery.adminMode && (
                  <div className="mt-4 flex justify-center">
                    <label className="block bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full cursor-pointer">
                      {gallery.uploading === 'lifestyle-shot' ? 'Uploading...' : 'Update Lifestyle Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => gallery.handleUpload(e, 'lifestyle-shot')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                
                <div className="absolute bottom-6 right-6 bg-white bg-opacity-90 rounded-xl p-4 shadow-lg max-w-xs hidden md:block">
                  <p className="font-bold text-gray-900 mb-1">"My skin has never looked better"</p>
                  <p className="text-sm text-gray-600">
                    94% of customers see visible improvement within 4 weeks of consistent use.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center mt-12">
            <button className="inline-flex items-center bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
              Read more reviews
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-700">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-4">
              Join Our Community
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Get Exclusive Access & Special Offers
            </h2>
            
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Subscribe to receive skincare tips, early access to new products, and members-only discounts.
            </p>
            
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 px-6 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-4 rounded-lg font-medium text-white transition-colors ${
                  isSubmitting ? 'bg-emerald-700 cursor-not-allowed' : 'bg-white text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {isSubmitting ? 'Subscribing...' : 'Join Now'}
              </button>
            </form>
            
            {signupSuccess && (
              <div className="mt-4 p-4 bg-white/20 backdrop-blur-sm text-white rounded-lg max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Perfect! Check your email for a special welcome gift.</span>
                </div>
              </div>
            )}
            
            <p className="text-emerald-100 text-sm mt-4 max-w-md mx-auto">
              By subscribing, you agree to receive emails from Bloom Botanicals. We respect your privacy and you can unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <span className="text-xl font-bold text-white">Bloom Botanicals</span>
              </div>
              
              <p className="text-gray-400 mb-4">
                Handcrafted organic skincare made with love in Boulder, Colorado. Every product is formulated to nourish your skin and protect our planet.
              </p>
              
              <div className="flex space-x-4">
                {[1,2,3,4].map((i) => (
                  <button key={i} className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors">
                    <span className="text-gray-400 hover:text-white">f</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {['Shop All', 'Best Sellers', 'New Arrivals', 'Gift Sets', 'Skincare Guide'].map((item) => (
                  <li key={item}>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">Customer Care</h3>
              <ul className="space-y-2">
                {['Contact Us', 'Shipping Policy', 'Returns & Exchanges', 'FAQ', 'Track Order'].map((item) => (
                  <li key={item}>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="font-medium text-white">Phone</p>
                    <p className="text-gray-400">(720) 555-0123</p>
                    <p className="text-gray-400 text-sm">Mon-Fri 9am-5pm MT</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-white">Email</p>
                    <p className="text-gray-400">hello@bloombotanicals.com</p>
                    <p className="text-gray-400 text-sm">We respond within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-white">Studio</p>
                    <p className="text-gray-400">123 Mountain View Drive</p>
                    <p className="text-gray-400">Boulder, CO 80302</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Bloom Botanicals. All rights reserved.</p>
            <p className="mt-2">
              <button className="hover:text-white transition-colors mx-2">Privacy Policy</button> • 
              <button className="hover:text-white transition-colors mx-2">Terms of Service</button> • 
              <button className="hover:text-white transition-colors mx-2">Accessibility</button>
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Notice */}
      {gallery.adminMode && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Admin Mode Active - Upload your images</span>
          </div>
        </div>
      )}
    </div>
  );
}