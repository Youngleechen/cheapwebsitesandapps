'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShoppingCart, Package, Clock, Award, Star, ChevronRight, Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Coffee Products Data
const COFFEE_PRODUCTS = [
  { 
    id: 'ethiopian-single-origin',
    title: 'Ethiopian Yirgacheffe',
    description: 'Bright, floral notes with bergamot and jasmine',
    price: 18.95,
    weight: '12oz',
    roast: 'Light',
    flavorNotes: ['Bergamot', 'Jasmine', 'Lemon Zest'],
    category: 'single-origin'
  },
  { 
    id: 'colombian-dark-roast',
    title: 'Colombian Supremo',
    description: 'Rich chocolate with caramel and walnut undertones',
    price: 16.50,
    weight: '12oz',
    roast: 'Dark',
    flavorNotes: ['Dark Chocolate', 'Caramel', 'Walnut'],
    category: 'single-origin'
  },
  { 
    id: 'house-blend',
    title: 'Artisan House Blend',
    description: 'Our signature balanced blend for everyday brewing',
    price: 15.99,
    weight: '16oz',
    roast: 'Medium',
    flavorNotes: ['Hazelnut', 'Brown Sugar', 'Citrus'],
    category: 'blends'
  },
  { 
    id: 'decaf-colombian',
    title: 'Swiss Water Decaf',
    description: 'Chemical-free decaf with full flavor retention',
    price: 19.75,
    weight: '12oz',
    roast: 'Medium',
    flavorNotes: ['Cocoa', 'Cedar', 'Orange'],
    category: 'decaf'
  },
  { 
    id: 'seasonal-reserve',
    title: 'Panama Geisha Reserve',
    description: 'Limited edition award-winning coffee',
    price: 42.00,
    weight: '8oz',
    roast: 'Light',
    flavorNotes: ['Jasmine', 'Peach', 'Honey'],
    category: 'reserve'
  },
  { 
    id: 'espresso-blend',
    title: 'Black Bear Espresso',
    description: 'Powerful yet smooth blend for perfect crema',
    price: 17.95,
    weight: '12oz',
    roast: 'Dark',
    flavorNotes: ['Dark Cherry', 'Molasses', 'Spice'],
    category: 'espresso'
  },
];

// Subscription Plans
const SUBSCRIPTION_PLANS = [
  {
    id: 'explorer',
    name: 'Coffee Explorer',
    price: 24.99,
    interval: 'month',
    description: 'Perfect for trying new flavors',
    features: ['2 bags monthly', 'Free shipping', 'Tasting notes', 'Cancel anytime']
  },
  {
    id: 'enthusiast',
    name: 'Coffee Enthusiast',
    price: 44.99,
    interval: 'month',
    description: 'For the true coffee lover',
    features: ['4 bags monthly', 'Free shipping', 'Priority access', 'Exclusive blends', '20% off merch']
  },
  {
    id: 'connoisseur',
    name: 'Coffee Connoisseur',
    price: 79.99,
    interval: 'month',
    description: 'Ultimate coffee experience',
    features: ['6 bags monthly', 'Free shipping', 'First access to reserve', 'Brewing guide', 'Personalized recommendations', '30% off all products']
  },
];

// Gallery Images for Admin Upload
const GALLERY_IMAGES = [
  { 
    id: 'hero-roaster',
    title: 'Main Roaster Hero Image',
    prompt: 'A professional shot of a modern coffee roaster in action with steam and golden light, beans visible in hopper. Warm, inviting atmosphere with soft focus background showing coffee shop setting.',
    category: 'hero'
  },
  { 
    id: 'product-ethiopian',
    title: 'Ethiopian Coffee Product',
    prompt: 'Flat lay photography of Ethiopian coffee beans on rustic wooden surface, with coffee flowers, tasting notes card, and coffee brewing equipment. Soft natural lighting, warm tones.',
    category: 'product'
  },
  { 
    id: 'brewing-process',
    title: 'Brewing Process',
    prompt: 'Close-up of barista brewing pour-over coffee, steam rising from fresh brew, shallow depth of field highlighting the coffee dripper and stream of coffee. Professional food photography style.',
    category: 'process'
  },
  { 
    id: 'coffee-farm',
    title: 'Coffee Farm',
    prompt: 'Panoramic view of coffee farm in mountains with farmers harvesting ripe coffee cherries. Bright green foliage, blue sky, authentic working farm atmosphere.',
    category: 'story'
  },
  { 
    id: 'subscription-box',
    title: 'Subscription Box',
    prompt: 'Stylish subscription box open showing multiple coffee bags, tasting notes cards, and coffee accessory. Clean, modern composition with soft shadows and minimalist background.',
    category: 'subscription'
  },
];

type ImageState = { [key: string]: { image_url: string | null } };
type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  weight: string;
};

export default function ArtisanAromaCoffeePage() {
  const [images, setImages] = useState<ImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);

  // Load user and admin status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load gallery images
  useEffect(() => {
    const loadImages = async () => {
      const { data: imageData, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        return;
      }

      const initialState: ImageState = {};
      GALLERY_IMAGES.forEach(img => initialState[img.id] = { image_url: null });

      if (imageData) {
        const latestImagePerArtwork: Record<string, string> = {};

        for (const img of imageData) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            if (GALLERY_IMAGES.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        GALLERY_IMAGES.forEach(img => {
          if (latestImagePerArtwork[img.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerArtwork[img.id]).data.publicUrl;
            initialState[img.id] = { image_url: url };
          }
        });
      }

      setImages(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(imageId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${imageId}/`;
      
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
      setImages(prev => ({ ...prev, [imageId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, imageId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(imageId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const addToCart = (product: typeof COFFEE_PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
        weight: product.weight
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const filteredProducts = activeFilter === 'all' 
    ? COFFEE_PRODUCTS 
    : COFFEE_PRODUCTS.filter(product => product.category === activeFilter);

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-600 rounded-full"></div>
              <span className="text-2xl font-bold text-gray-900">ArtisanAroma</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#products" className="text-gray-700 hover:text-amber-600 transition">Shop Coffee</a>
              <a href="#subscription" className="text-gray-700 hover:text-amber-600 transition">Subscription</a>
              <a href="#story" className="text-gray-700 hover:text-amber-600 transition">Our Story</a>
              <a href="#process" className="text-gray-700 hover:text-amber-600 transition">Roasting Process</a>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCartOpen(true)}
                className="relative p-2 hover:bg-amber-50 rounded-full"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <a href="#products" className="block text-gray-700 hover:text-amber-600 transition">Shop Coffee</a>
              <a href="#subscription" className="block text-gray-700 hover:text-amber-600 transition">Subscription</a>
              <a href="#story" className="block text-gray-700 hover:text-amber-600 transition">Our Story</a>
              <a href="#process" className="block text-gray-700 hover:text-amber-600 transition">Roasting Process</a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-900 to-gray-900 text-white">
        {adminMode && images['hero-roaster']?.image_url ? (
          <img 
            src={images['hero-roaster'].image_url}
            alt="Coffee Roaster"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900 to-gray-900"></div>
        )}
        
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-2 bg-amber-600 rounded-full text-sm font-semibold mb-4">
              Since 2012
            </span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Craft Coffee,<br />
              <span className="text-amber-300">Perfected Daily</span>
            </h1>
            <p className="text-xl text-amber-100 mb-8 max-w-xl">
              Small-batch roasted coffee from sustainable farms worldwide. 
              Experience the difference of truly fresh, artisan coffee delivered to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="#products"
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition duration-300 text-center"
              >
                Shop Coffee Now
              </a>
              <a 
                href="#subscription"
                className="bg-transparent hover:bg-white/10 text-white border-2 border-white px-8 py-4 rounded-lg font-semibold text-lg transition duration-300 text-center"
              >
                Start Subscription
              </a>
            </div>
          </div>
        </div>

        {/* Admin Upload for Hero */}
        {adminMode && (
          <div className="absolute bottom-4 right-4 z-20">
            <label className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-purple-700 transition">
              {uploading === 'hero-roaster' ? 'Uploading...' : 'Change Hero Image'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e, 'hero-roaster')}
                className="hidden"
              />
            </label>
          </div>
        )}
      </section>

      {/* Stats Bar */}
      <div className="bg-white py-8 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-2">24h</div>
              <div className="text-gray-600">Freshly Roasted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-2">15+</div>
              <div className="text-gray-600">Origins Worldwide</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-2">10k+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-2">4.9★</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <section id="products" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Premium Selection</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Each coffee is roasted to order and shipped within 24 hours of roasting
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-6 py-2 rounded-full transition ${activeFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-gray-700 hover:bg-amber-200'}`}
            >
              All Coffees
            </button>
            <button
              onClick={() => setActiveFilter('single-origin')}
              className={`px-6 py-2 rounded-full transition ${activeFilter === 'single-origin' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-gray-700 hover:bg-amber-200'}`}
            >
              Single Origin
            </button>
            <button
              onClick={() => setActiveFilter('blends')}
              className={`px-6 py-2 rounded-full transition ${activeFilter === 'blends' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-gray-700 hover:bg-amber-200'}`}
            >
              Blends
            </button>
            <button
              onClick={() => setActiveFilter('espresso')}
              className={`px-6 py-2 rounded-full transition ${activeFilter === 'espresso' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-gray-700 hover:bg-amber-200'}`}
            >
              Espresso
            </button>
            <button
              onClick={() => setActiveFilter('decaf')}
              className={`px-6 py-2 rounded-full transition ${activeFilter === 'decaf' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-gray-700 hover:bg-amber-200'}`}
            >
              Decaf
            </button>
          </div>

          {/* Products Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {filteredProducts.map((product) => {
    const productImageKey = `product-${product.id}`;
    const imageUrl = images[productImageKey]?.image_url;
    
    return (
      <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300">
        <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-300 relative">
          {adminMode ? (
            <>
              {imageUrl ? (
                <img 
                  src={imageUrl || ''}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
              <div className="absolute bottom-2 right-2">
                <label className="bg-purple-600 text-white text-xs px-3 py-1 rounded cursor-pointer hover:bg-purple-700 transition">
                  {uploading === productImageKey ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, productImageKey)}
                    className="hidden"
                  />
                </label>
                {!imageUrl && (
                  <div className="absolute top-2 left-2 bg-purple-800/80 text-white text-xs px-2 py-1 rounded">
                    <button
                      onClick={() => copyPrompt(
                        `Professional product photography of ${product.title} coffee beans in a burlap sack on rustic wood, with coffee brewing equipment and tasting notes card. Warm natural lighting, shallow depth of field.`,
                        productImageKey
                      )}
                      className="hover:underline"
                      type="button"
                    >
                      {copiedId === productImageKey ? 'Copied!' : 'Get Prompt'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mx-auto mb-4"></div>
                <span className="text-gray-700 font-semibold">{product.roast} Roast</span>
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{product.title}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span className="text-sm text-gray-500 ml-2">4.9</span>
              </div>
            </div>
            <span className="text-lg font-bold text-amber-600">${product.price}</span>
          </div>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {product.flavorNotes.map((note, index) => (
              <span key={index} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                {note}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">{product.weight} bag</span>
            <button 
              onClick={() => addToCart(product)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-300 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  })}
</div>
        </div>
      </section>

      {/* Roasting Process */}
      <section id="process" className="py-16 bg-gradient-to-br from-gray-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Roasting Philosophy</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              We believe coffee roasting is both art and science. Each batch is monitored by master roasters
              to bring out the unique characteristics of every bean.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-2">
                {adminMode ? (
                  <>
                    {images['brewing-process']?.image_url ? (
                      <img 
                        src={images['brewing-process'].image_url}
                        alt="Roasting Process"
                        className="w-full h-96 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-96 bg-gradient-to-br from-amber-200 to-amber-400 rounded-xl flex items-center justify-center">
                        <span className="text-gray-600">Process image</span>
                      </div>
                    )}
                    <div className="absolute bottom-4 right-4">
                      <label className="bg-purple-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-purple-700 transition flex items-center gap-2">
                        {uploading === 'brewing-process' ? 'Uploading...' : 'Upload Process Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, 'brewing-process')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-amber-200 to-amber-400 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-12 h-12 text-amber-600" />
                      </div>
                      <span className="text-gray-700 font-semibold text-lg">Roasting Process</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Small Batch Roasting</h3>
                  <p className="text-gray-600">
                    We roast in small batches to ensure precise temperature control and consistent quality.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Direct Trade</h3>
                  <p className="text-gray-600">
                    We work directly with farmers to ensure fair prices and sustainable farming practices.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Freshness Guaranteed</h3>
                  <p className="text-gray-600">
                    Every order is roasted fresh and shipped within 24 hours to preserve peak flavor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section id="subscription" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Never Run Out of Great Coffee</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Choose a subscription plan and get your favorite coffee delivered automatically
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`rounded-2xl p-8 transition duration-300 ${subscriptionPlan === plan.id ? 'ring-4 ring-amber-500 ring-opacity-50 bg-gradient-to-b from-amber-50 to-white' : 'bg-white shadow-lg hover:shadow-xl'}`}
                onClick={() => setSubscriptionPlan(plan.id)}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-amber-600 mb-1">
                    ${plan.price}<span className="text-lg text-gray-500">/{plan.interval}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <ChevronRight className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition ${subscriptionPlan === plan.id ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                >
                  {subscriptionPlan === plan.id ? 'Selected Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

          {/* Subscription Box Image */}
          {adminMode && (
            <div className="mt-12 max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-amber-50 to-white rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Subscription Box Preview</h3>
                  <label className="bg-purple-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-purple-700 transition">
                    {uploading === 'subscription-box' ? 'Uploading...' : 'Upload Box Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, 'subscription-box')}
                      className="hidden"
                    />
                  </label>
                </div>
                {images['subscription-box']?.image_url ? (
                  <img 
                    src={images['subscription-box'].image_url}
                    alt="Subscription Box"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-amber-200 to-amber-400 rounded-xl flex items-center justify-center">
                    <span className="text-gray-600">Subscription box image preview</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Our Story */}
      <section id="story" className="py-16 bg-gradient-to-br from-amber-900 to-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-amber-600 rounded-full text-sm font-semibold mb-6">
                Our Story
              </span>
              <h2 className="text-4xl font-bold mb-6">From Farm to Cup</h2>
              <p className="text-lg text-amber-100 mb-6">
                ArtisanAroma began as a passion project between two friends who believed coffee could be better.
                What started in a garage with a single roaster has grown into a community of coffee lovers
                who appreciate quality, sustainability, and craftsmanship.
              </p>
              <p className="text-lg text-amber-100">
                Today, we work directly with sustainable farms across three continents, ensuring fair prices
                for farmers and exceptional coffee for you. Every bag tells a story of the land, the people,
                and the careful roasting that brings out its unique character.
              </p>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2">
                {adminMode ? (
                  <>
                    {images['coffee-farm']?.image_url ? (
                      <img 
                        src={images['coffee-farm'].image_url}
                        alt="Coffee Farm"
                        className="w-full h-96 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-96 bg-gradient-to-br from-amber-800 to-amber-600 rounded-xl flex items-center justify-center">
                        <span className="text-white">Farm story image</span>
                      </div>
                    )}
                    <div className="absolute bottom-4 right-4">
                      <label className="bg-purple-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-purple-700 transition flex items-center gap-2">
                        {uploading === 'coffee-farm' ? 'Uploading...' : 'Upload Farm Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, 'coffee-farm')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-amber-800 to-amber-600 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                        <MapPin className="w-12 h-12 text-white" />
                      </div>
                      <span className="text-white font-semibold text-lg">Sustainable Farms Worldwide</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shopping Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setCartOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-full md:w-96 bg-white shadow-xl">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Your Cart</h2>
                  <button 
                    onClick={() => setCartOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-amber-400 rounded-lg"></div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-500">{item.weight}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-sm text-red-600 hover:text-red-800 mt-1"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-semibold">
                        {cartTotal > 50 ? 'FREE' : '$5.99'}
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span>
                          ${(cartTotal + (cartTotal > 50 ? 0 : 5.99)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-lg font-semibold text-lg transition duration-300">
                      Proceed to Checkout
                    </button>
                    <p className="text-center text-sm text-gray-500">
                      Free shipping on orders over $50
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-amber-600 rounded-full"></div>
                <span className="text-2xl font-bold">ArtisanAroma</span>
              </div>
              <p className="text-gray-400">
                Small-batch roasted coffee from sustainable farms worldwide.
                Freshness guaranteed.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Shop</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#products" className="hover:text-amber-400 transition">All Coffee</a></li>
                <li><a href="#subscription" className="hover:text-amber-400 transition">Subscription</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Brewing Gear</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Gift Cards</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#story" className="hover:text-amber-400 transition">Our Story</a></li>
                <li><a href="#process" className="hover:text-amber-400 transition">Roasting Process</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Sustainability</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Wholesale</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>(555) 123-4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>hello@artisanaroma.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>123 Coffee Street, Portland, OR</span>
                </li>
              </ul>
              <div className="flex gap-4 mt-6">
                <a href="#" className="hover:text-amber-400 transition">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-amber-400 transition">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-amber-400 transition">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} ArtisanAroma Coffee Roasters. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-40 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Admin Mode Active
        </div>
      )}
    </div>
  );
}