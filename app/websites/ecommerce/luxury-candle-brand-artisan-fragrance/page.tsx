'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, 
  Star, 
  Truck, 
  Shield, 
  ChevronRight, 
  Sparkles,
  Menu,
  X,
  Instagram,
  Facebook,
  Mail,
  Phone,
  MapPin,
  Heart,
  Award,
  Leaf,
  Clock,
  CheckCircle
} from 'lucide-react';

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'mystic-aroma-gallery';

// Define all image sections for the business
const IMAGE_SECTIONS = [
  { 
    id: 'hero-bg', 
    title: 'Hero Background',
    description: 'Main hero background image (2000x1200px recommended)',
    aspect: 'landscape'
  },
  { 
    id: 'featured-candle-1', 
    title: 'Featured Candle 1 - Midnight Jasmine',
    description: 'Premium black glass candle with gold lid',
    aspect: 'square'
  },
  { 
    id: 'featured-candle-2', 
    title: 'Featured Candle 2 - Sandalwood Serenity',
    description: 'Wooden wick candle in amber glass',
    aspect: 'square'
  },
  { 
    id: 'featured-candle-3', 
    title: 'Featured Candle 3 - Ocean Breeze',
    description: 'Ceramic vessel with ocean-inspired design',
    aspect: 'square'
  },
  { 
    id: 'process-1', 
    title: 'Production Process 1',
    description: 'Artisan pouring wax into molds',
    aspect: 'landscape'
  },
  { 
    id: 'process-2', 
    title: 'Production Process 2',
    description: 'Hand-scenting essential oil blends',
    aspect: 'landscape'
  },
  { 
    id: 'process-3', 
    title: 'Production Process 3',
    description: 'Quality checking and packaging',
    aspect: 'landscape'
  },
  { 
    id: 'testimonial-1', 
    title: 'Customer Review 1',
    description: 'Lifestyle shot of candle in modern home',
    aspect: 'portrait'
  },
  { 
    id: 'testimonial-2', 
    title: 'Customer Review 2',
    description: 'Candle on a cozy bedroom nightstand',
    aspect: 'portrait'
  },
  { 
    id: 'about-founder', 
    title: 'Founder Portrait',
    description: 'Professional portrait of our founder',
    aspect: 'portrait'
  },
  { 
    id: 'gift-set', 
    title: 'Premium Gift Set',
    description: 'Luxury candle gift box with accessories',
    aspect: 'landscape'
  },
  { 
    id: 'ingredients-showcase', 
    title: 'Natural Ingredients',
    description: 'Display of natural waxes and essential oils',
    aspect: 'landscape'
  }
];

type ImageState = { 
  [key: string]: { 
    image_url: string | null;
    loading: boolean;
  } 
};

type CandleProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  burnTime: string;
  scentProfile: string[];
  size: string;
  imageSectionId: string;
};

const PRODUCTS: CandleProduct[] = [
  {
    id: 'midnight-jasmine',
    name: 'Midnight Jasmine',
    description: 'An intoxicating blend of night-blooming jasmine, white musk, and a hint of vanilla orchid.',
    price: 68.00,
    burnTime: '60-70 hours',
    scentProfile: ['Floral', 'Musky', 'Sweet'],
    size: '12 oz',
    imageSectionId: 'featured-candle-1'
  },
  {
    id: 'sandalwood-serenity',
    name: 'Sandalwood Serenity',
    description: 'Warm, woody notes of aged sandalwood blended with precious frankincense and amber.',
    price: 72.00,
    burnTime: '65-75 hours',
    scentProfile: ['Woody', 'Spicy', 'Resinous'],
    size: '14 oz',
    imageSectionId: 'featured-candle-2'
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Crisp sea salt air with undertones of driftwood, sea moss, and coastal sage.',
    price: 65.00,
    burnTime: '55-65 hours',
    scentProfile: ['Fresh', 'Aquatic', 'Herbal'],
    size: '10 oz',
    imageSectionId: 'featured-candle-3'
  }
];

const BENEFITS = [
  { icon: Leaf, text: '100% Natural Soy Wax', color: 'text-green-600' },
  { icon: Sparkles, text: 'Hand-poured in Small Batches', color: 'text-purple-600' },
  { icon: Award, text: 'Premium Essential Oils', color: 'text-amber-600' },
  { icon: Shield, text: 'Eco-friendly Packaging', color: 'text-blue-600' },
  { icon: Clock, text: '60+ Hour Burn Time', color: 'text-rose-600' },
  { icon: Heart, text: 'Phthalate & Toxin Free', color: 'text-pink-600' }
];

export default function MysticAromaCandleCo() {
  const [images, setImages] = useState<ImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState<{id: string, quantity: number}[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Load user session and check for admin
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load all images from Supabase
  useEffect(() => {
    const loadImages = async () => {
      // Initialize loading state for all sections
      const initialState: ImageState = {};
      IMAGE_SECTIONS.forEach(section => {
        initialState[section.id] = { image_url: null, loading: true };
      });
      setImages(initialState);

      // Fetch gallery images for admin
      const { data: imagesData, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        IMAGE_SECTIONS.forEach(section => {
          initialState[section.id] = { image_url: null, loading: false };
        });
        setImages(initialState);
        return;
      }

      const latestImages: Record<string, string> = {};

      if (imagesData) {
        for (const img of imagesData) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX.split('/')[0]) {
            const sectionId = pathParts[2];
            if (IMAGE_SECTIONS.some(s => s.id === sectionId) && !latestImages[sectionId]) {
              latestImages[sectionId] = img.path;
            }
          }
        }
      }

      // Update state with loaded images
      const updatedState: ImageState = {};
      IMAGE_SECTIONS.forEach(section => {
        if (latestImages[section.id]) {
          const url = supabase.storage
            .from('user_images')
            .getPublicUrl(latestImages[section.id]).data.publicUrl;
          updatedState[section.id] = { image_url: url, loading: false };
        } else {
          updatedState[section.id] = { image_url: null, loading: false };
        }
      });

      setImages(updatedState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    if (!adminMode || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    setUploading(sectionId);

    // Update loading state immediately
    setImages(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], loading: true }
    }));

    try {
      // Clean up old images for this section
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${sectionId}/`;
      const { data: existingImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (existingImages?.length) {
        const pathsToDelete = existingImages.map(img => img.path);
        await Promise.all([
          supabase.storage.from('user_images').remove(pathsToDelete),
          supabase.from('images').delete().in('path', pathsToDelete)
        ]);
      }

      // Upload new image
      const filePath = `${folderPath}${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type
        });
      
      if (uploadErr) throw uploadErr;

      // Save to database
      const { error: dbErr } = await supabase
        .from('images')
        .insert({ 
          user_id: ADMIN_USER_ID, 
          path: filePath,
          section_id: sectionId 
        });
      
      if (dbErr) throw dbErr;

      // Get public URL and update state
      const publicUrl = supabase.storage
        .from('user_images')
        .getPublicUrl(filePath).data.publicUrl;
      
      setImages(prev => ({
        ...prev,
        [sectionId]: { image_url: publicUrl, loading: false }
      }));

      setNotification(`✅ ${IMAGE_SECTIONS.find(s => s.id === sectionId)?.title} updated successfully!`);
      setTimeout(() => setNotification(null), 3000);

    } catch (err) {
      console.error('Upload failed:', err);
      setImages(prev => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], loading: false }
      }));
      setNotification('❌ Upload failed. Please try again.');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        return prev.map(item => 
          item.id === productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: productId, quantity: 1 }];
    });
    
    setSelectedProduct(productId);
    setNotification('🛒 Added to cart!');
    setTimeout(() => {
      setSelectedProduct(null);
      setNotification(null);
    }, 2000);
  };

  const CartItemCount = () => (
    cart.reduce((sum, item) => sum + item.quantity, 0) > 0 ? (
      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {cart.reduce((sum, item) => sum + item.quantity, 0)}
      </span>
    ) : null
  );

  const getImageForProduct = (productId: string) => {
    const product = PRODUCTS.find(p => p.id === productId);
    return product ? images[product.imageSectionId]?.image_url : null;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2">
            {notification}
          </div>
        </div>
      )}

      {/* Admin Control Panel */}
      {adminMode && (
        <div className="fixed top-4 left-4 z-50">
          <div className="bg-purple-900 text-white p-4 rounded-lg shadow-2xl max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">Admin Mode</span>
            </div>
            <p className="text-sm text-purple-200 mb-3">
              Click on any image placeholder to upload custom images for your website.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {IMAGE_SECTIONS.map(section => (
                <div key={section.id} className="flex items-center justify-between">
                  <span className="text-xs truncate">{section.title}</span>
                 <input
  type="file"
  accept="image/*"
  ref={(el) => {
    fileInputRefs.current[section.id] = el;
  }}
  onChange={(e) => handleUpload(e, section.id)} // ✅ now uses section.id
  className="hidden"
/>
                  <button
                    onClick={() => fileInputRefs.current[section.id]?.click()}
                    className={`text-xs px-2 py-1 rounded ${uploading === section.id ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-500'}`}
                    disabled={uploading === section.id}
                  >
                    {uploading === section.id ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-serif font-bold tracking-tight">Mystic Aroma</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-8">
                <a href="#shop" className="font-medium hover:text-purple-600 transition">Shop</a>
                <a href="#collections" className="font-medium hover:text-purple-600 transition">Collections</a>
                <a href="#about" className="font-medium hover:text-purple-600 transition">Our Story</a>
                <a href="#process" className="font-medium hover:text-purple-600 transition">The Process</a>
                <a href="#testimonials" className="font-medium hover:text-purple-600 transition">Reviews</a>
              </nav>
            </div>

            <div className="flex items-center gap-6">
              <button className="relative p-2" onClick={() => {/* Cart modal would go here */}}>
                <ShoppingBag className="w-6 h-6" />
                <CartItemCount />
              </button>
              
              <button className="hidden md:block bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition font-medium">
                Shop Now
              </button>
              
              <button 
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <a href="#shop" className="py-2 font-medium">Shop</a>
              <a href="#collections" className="py-2 font-medium">Collections</a>
              <a href="#about" className="py-2 font-medium">Our Story</a>
              <a href="#process" className="py-2 font-medium">The Process</a>
              <a href="#testimonials" className="py-2 font-medium">Reviews</a>
              <button className="bg-purple-600 text-white px-6 py-3 rounded-full mt-2">
                Shop Now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image with Loading State */}
        {images['hero-bg']?.loading ? (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-amber-50 animate-pulse" />
        ) : images['hero-bg']?.image_url ? (
          <div className="absolute inset-0">
            <Image
              src={images['hero-bg'].image_url}
              alt="Luxury candle collection"
              fill
              className="object-cover"
              priority
              quality={90}
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-amber-900">
            {/* Default gradient background */}
          </div>
        )}

        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Artisan Hand-poured Candles</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
              Illuminate Your Space with
              <span className="block text-amber-200">Pure Elegance</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-xl">
              Luxury soy wax candles infused with premium essential oils. 
              Each candle is a masterpiece, handcrafted to transform your ambiance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="bg-white text-purple-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-50 transition flex items-center justify-center gap-2"
                onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Shop Collection <ChevronRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition">
                Discover Our Story
              </button>
            </div>
          </div>
        </div>

        {/* Admin Upload Overlay for Hero */}
        {adminMode && !images['hero-bg']?.image_url && !images['hero-bg']?.loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => fileInputRefs.current['hero-bg']?.click()}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Upload Hero Background Image
            </button>
          </div>
        )}
      </section>

      {/* Benefits Bar */}
      <div className="bg-gray-50 border-y">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {BENEFITS.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`${benefit.color} bg-${benefit.color.split('-')[1]}-100 p-2 rounded-lg`}>
                  <benefit.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <section id="shop" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold mb-4">Signature Collection</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each candle is crafted with intention, using only the finest natural ingredients 
              for a clean, long-lasting burn.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRODUCTS.map((product) => {
              const imageData = images[product.imageSectionId];
              const isSelected = selectedProduct === product.id;
              
              return (
                <div 
                  key={product.id}
                  className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
                >
                  {/* Product Image */}
                  <div className="relative h-80 overflow-hidden bg-gray-100">
                    {imageData?.loading ? (
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300" />
                    ) : imageData?.image_url ? (
                      <Image
                        src={imageData.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-amber-100">
                        <div className="text-center">
                          <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-2" />
                          <span className="text-gray-500">Product Image</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Admin Upload Overlay */}
                    {adminMode && !imageData?.image_url && !imageData?.loading && (
                      <button
                        onClick={() => fileInputRefs.current[product.imageSectionId]?.click()}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition"
                      >
                        <div className="bg-white text-purple-600 px-4 py-2 rounded-lg">
                          Upload Image
                        </div>
                      </button>
                    )}
                    
                    {/* Badge */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      Best Seller
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-serif font-bold">{product.name}</h3>
                      <span className="text-2xl font-bold text-purple-600">${product.price.toFixed(2)}</span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.scentProfile.map((scent) => (
                        <span key={scent} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                          {scent}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                      <span>{product.size}</span>
                      <span>Burn time: {product.burnTime}</span>
                    </div>
                    
                    <button
                      onClick={() => addToCart(product.id)}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section id="process" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold mb-4">The Art of Craftsmanship</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every Mystic Aroma candle undergoes a meticulous 8-step process to ensure perfection.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {IMAGE_SECTIONS.filter(s => s.id.includes('process')).map((section, index) => (
              <div key={section.id} className="relative group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-lg">
                  {images[section.id]?.loading ? (
                    <div className="w-full h-full animate-pulse bg-gradient-to-br from-gray-200 to-gray-300" />
                  ) : images[section.id]?.image_url ? (
                    <Image
                      src={images[section.id].image_url!}
                      alt={section.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-amber-100">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-purple-300 mb-2">
                          Step {index + 1}
                        </div>
                        <span className="text-gray-500">{section.title}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Admin Upload Overlay */}
                  {adminMode && !images[section.id]?.image_url && !images[section.id]?.loading && (
                    <button
                      onClick={() => fileInputRefs.current[section.id]?.click()}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition"
                    >
                      <div className="bg-white text-purple-600 px-4 py-2 rounded-lg">
                        Upload Process Image
                      </div>
                    </button>
                  )}
                </div>
                
                <div className="mt-4">
                  <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
                  <p className="text-gray-600 text-sm">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold mb-4">What Our Customers Say</h2>
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 font-medium">4.9/5 from 1,247 reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {IMAGE_SECTIONS.filter(s => s.id.includes('testimonial')).map((section, index) => (
              <div key={section.id} className="bg-white rounded-2xl p-6 shadow-lg border">
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-full overflow-hidden">
                    {images[section.id]?.loading ? (
                      <div className="w-full h-full animate-pulse bg-gray-300" />
                    ) : images[section.id]?.image_url ? (
                      <Image
                        src={images[section.id].image_url!}
                        alt="Customer"
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Customer</span>
                      </div>
                    )}
                    
                    {/* Admin Upload Overlay */}
                    {adminMode && !images[section.id]?.image_url && !images[section.id]?.loading && (
                      <button
                        onClick={() => fileInputRefs.current[section.id]?.click()}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition text-xs text-white"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 italic mb-4">
                      "The Midnight Jasmine candle transformed my entire home. The scent is sophisticated and lasts for days even when not lit."
                    </p>
                    <div>
                      <div className="font-semibold">Sarah M.</div>
                      <div className="text-sm text-gray-500">Interior Designer</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900 to-amber-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif font-bold mb-6">
            Ready to Transform Your Space?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands who have elevated their ambiance with Mystic Aroma.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-50 transition">
              Shop All Candles
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition">
              Book a Scent Consultation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-8 h-8 text-amber-300" />
                <span className="text-2xl font-serif font-bold">Mystic Aroma</span>
              </div>
              <p className="text-gray-400">
                Luxury artisan candles handcrafted with passion and precision.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Shop</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">All Candles</a></li>
                <li><a href="#" className="hover:text-white">Best Sellers</a></li>
                <li><a href="#" className="hover:text-white">Gift Sets</a></li>
                <li><a href="#" className="hover:text-white">Seasonal Collection</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Our Story</a></li>
                <li><a href="#" className="hover:text-white">The Process</a></li>
                <li><a href="#" className="hover:text-white">Sustainability</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Contact</h3>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>hello@mysticaroma.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Portland, Oregon</span>
                </div>
                <div className="flex gap-4 mt-4">
                  <Instagram className="w-5 h-5 hover:text-amber-300 cursor-pointer" />
                  <Facebook className="w-5 h-5 hover:text-amber-300 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Mystic Aroma Candle Co. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}