'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, 
  Heart, 
  Search, 
  Menu, 
  X, 
  ChevronRight,
  Star,
  Truck,
  Shield,
  Leaf,
  Recycle,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ArrowRight,
  Check
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'sustainable-fashion';

// Lookbook/Collection Images
const LOOKBOOK_IMAGES = [
  { 
    id: 'spring-collection-1', 
    title: 'Eco-Linen Set',
    prompt: 'High fashion model wearing cream-colored linen two-piece set in a sunlit botanical garden. Sustainable fabric texture visible, natural lighting, editorial style, earth tone palette.'
  },
  { 
    id: 'spring-collection-2', 
    title: 'Recycled Denim',
    prompt: 'Stylish model in recycled denim jacket and matching pants standing in urban greenhouse. Visible stitch details, sustainable fashion, urban jungle background, professional photography.'
  },
  { 
    id: 'sustainable-activewear', 
    title: 'Bamboo Activewear',
    prompt: 'Athletic model in bamboo fiber activewear performing yoga pose in minimalist studio. Sustainable materials, neutral colors, clean aesthetic, wellness lifestyle.'
  },
  { 
    id: 'evening-wear', 
    title: 'Evening Elegance',
    prompt: 'Elegant model wearing upcycled silk evening gown in art deco venue. Sustainable luxury, gold hour lighting, sophisticated styling, circular fashion.'
  },
];

// Product Data
const PRODUCTS = [
  {
    id: 1,
    name: "Organic Cotton T-Shirt",
    price: 38.00,
    category: "Basics",
    colors: ["Natural", "Clay", "Forest"],
    sustainableFeatures: ["GOTS Certified", "Biodegradable", "Low Water Usage"],
    rating: 4.8,
    reviewCount: 124
  },
  {
    id: 2,
    name: "Recycled Denim Jacket",
    price: 89.00,
    category: "Outerwear",
    colors: ["Indigo", "Black", "Stonewash"],
    sustainableFeatures: ["100% Recycled Denim", "Ethical Production", "Zero Waste"],
    rating: 4.9,
    reviewCount: 87
  },
  {
    id: 3,
    name: "Bamboo Lounge Set",
    price: 65.00,
    category: "Loungewear",
    colors: ["Sage", "Oatmeal", "Slate"],
    sustainableFeatures: ["Bamboo Fiber", "Carbon Neutral", "Compostable"],
    rating: 4.7,
    reviewCount: 203
  },
  {
    id: 4,
    name: "Upcycled Silk Scarf",
    price: 42.00,
    category: "Accessories",
    colors: ["Multi", "Earth Tones", "Ocean"],
    sustainableFeatures: ["Deadstock Fabric", "Handmade", "Zero Waste"],
    rating: 5.0,
    reviewCount: 56
  },
];

type ImageState = { [key: string]: { image_url: string | null } };
type CartItem = { id: number; name: string; price: number; quantity: number };

export default function SustainableFashionBoutique() {
  const [images, setImages] = useState<ImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([
    { id: 1, name: "Organic Cotton T-Shirt", price: 38.00, quantity: 1 }
  ]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCollection, setActiveCollection] = useState('all');

  // Fetch admin status and images
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load lookbook images
  useEffect(() => {
    const loadImages = async () => {
      const { data: imageRecords, error } = await supabase
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
      LOOKBOOK_IMAGES.forEach(img => initialState[img.id] = { image_url: null });

      if (imageRecords) {
        const latestImagePerItem: Record<string, string> = {};

        for (const img of imageRecords) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const imageId = pathParts[2];
            if (LOOKBOOK_IMAGES.some(a => a.id === imageId) && !latestImagePerItem[imageId]) {
              latestImagePerItem[imageId] = img.path;
            }
          }
        }

        LOOKBOOK_IMAGES.forEach(img => {
          if (latestImagePerItem[img.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerItem[img.id]).data.publicUrl;
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

      // Clean up old images for this item
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

  const addToCart = (product: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-12">
              <div className="text-2xl font-bold tracking-tight">
                <span className="text-emerald-700">Eco</span>
                <span className="text-gray-900">Style</span>
              </div>
              
              <div className="hidden lg:flex items-center space-x-8">
                <a href="#" className="text-gray-700 hover:text-emerald-700 transition">New Arrivals</a>
                <a href="#" className="text-gray-700 hover:text-emerald-700 transition">Collections</a>
                <a href="#" className="text-gray-700 hover:text-emerald-700 transition">Sustainable Living</a>
                <a href="#" className="text-gray-700 hover:text-emerald-700 transition">About Us</a>
                <a href="#" className="text-gray-700 hover:text-emerald-700 transition">Journal</a>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <Search className="w-5 h-5 cursor-pointer hover:text-emerald-700" />
              <Heart className="w-5 h-5 cursor-pointer hover:text-emerald-700" />
              
              <div className="relative">
                <button 
                  onClick={() => setCartOpen(!cartOpen)}
                  className="flex items-center space-x-1 hover:text-emerald-700"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="hidden sm:inline">Cart</span>
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>

              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-6">
            <div className="flex flex-col space-y-4">
              <a href="#" className="text-gray-700 hover:text-emerald-700 transition py-2">New Arrivals</a>
              <a href="#" className="text-gray-700 hover:text-emerald-700 transition py-2">Collections</a>
              <a href="#" className="text-gray-700 hover:text-emerald-700 transition py-2">Sustainable Living</a>
              <a href="#" className="text-gray-700 hover:text-emerald-700 transition py-2">About Us</a>
              <a href="#" className="text-gray-700 hover:text-emerald-700 transition py-2">Journal</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 to-cyan-50 overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full mb-6">
              <Leaf className="w-4 h-4" />
              <span className="text-sm font-medium">Climate Neutral Certified</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-emerald-700">Style</span> That Cares
              <br />
              <span className="text-gray-900">For The Planet</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-xl">
              Discover ethically-made, sustainable fashion that doesn't compromise on style. 
              Every piece tells a story of conscious craftsmanship.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-emerald-700 text-white px-8 py-4 rounded-full font-semibold hover:bg-emerald-800 transition flex items-center justify-center space-x-2">
                <span>Shop Collections</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="border-2 border-emerald-700 text-emerald-700 px-8 py-4 rounded-full font-semibold hover:bg-emerald-50 transition">
                Learn Our Story
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Stats */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-emerald-700 mb-2">98%</div>
              <div className="text-gray-600">Organic Materials</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-700 mb-2">12M+</div>
              <div className="text-gray-600">Liters of Water Saved</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-700 mb-2">246K</div>
              <div className="text-gray-600">Kg of CO₂ Offset</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-700 mb-2">100%</div>
              <div className="text-gray-600">Living Wage Ensured</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Conscious Collections</h2>
              <p className="text-gray-600">Ethically made, sustainably sourced</p>
            </div>
            <div className="flex space-x-2">
              {['all', 'Basics', 'Outerwear', 'Loungewear', 'Accessories'].map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCollection(category.toLowerCase())}
                  className={`px-4 py-2 rounded-full transition ${
                    activeCollection === category.toLowerCase()
                      ? 'bg-emerald-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PRODUCTS.map((product) => (
              <div key={product.id} className="group">
                <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-[3/4] mb-4">
                  {/* Product image placeholder - in real app these would be from your product images */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-cyan-100" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">👚</div>
                      <div className="text-sm text-gray-500">Product Image</div>
                    </div>
                  </div>
                  
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-sm text-gray-500">({product.reviewCount})</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {product.colors.map((color) => (
                      <div
                        key={color}
                        className="w-6 h-6 rounded-full border border-gray-200"
                        style={{ 
                          backgroundColor: color === 'Natural' ? '#f5f5dc' :
                          color === 'Clay' ? '#b37a4c' :
                          color === 'Forest' ? '#228B22' :
                          color === 'Indigo' ? '#4B0082' :
                          color === 'Sage' ? '#9dc183' : '#ccc'
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">${product.price.toFixed(2)}</div>
                    <button
                      onClick={() => addToCart(product)}
                      className="px-6 py-2 bg-emerald-700 text-white rounded-full font-medium hover:bg-emerald-800 transition"
                    >
                      Add to Cart
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {product.sustainableFeatures.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lookbook Gallery */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Spring Collection Lookbook</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See our sustainable pieces in action. All photography is shot with environmental consciousness in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LOOKBOOK_IMAGES.map((item) => {
              const imageData = images[item.id] || { image_url: null };
              const imageUrl = imageData.image_url;

              return (
                <div key={item.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-lg">
                  <div className="aspect-[3/4] relative">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-fashion.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                        <div className="text-center p-8">
                          <div className="text-4xl mb-4">📸</div>
                          <span className="text-gray-500">Lookbook Image</span>
                          {adminMode && (
                            <div className="mt-4 space-y-2">
                              <p className="text-xs text-gray-600">{item.prompt}</p>
                              <button
                                onClick={() => copyPrompt(item.prompt, item.id)}
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                                type="button"
                              >
                                {copiedId === item.id ? 'Copied!' : 'Copy Prompt'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Admin Upload Overlay */}
                    {adminMode && !imageUrl && (
                      <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <div className="text-white text-center p-4">
                          <div className="text-lg font-medium mb-2">Upload Lookbook Image</div>
                          <div className="text-sm opacity-90">Click to add professional photography</div>
                          <div className="mt-4">
                            <div className="inline-block bg-white text-emerald-700 px-6 py-2 rounded-full font-medium">
                              {uploading === item.id ? 'Uploading…' : 'Select Image'}
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, item.id)}
                          className="hidden"
                        />
                      </label>
                    )}
                    
                    {adminMode && imageUrl && (
                      <label className="absolute bottom-4 right-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 cursor-pointer hover:bg-white transition">
                          <div className="text-xs text-emerald-700 font-medium px-2">
                            {uploading === item.id ? 'Updating…' : 'Update'}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, item.id)}
                            className="hidden"
                          />
                        </div>
                      </label>
                    )}
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm opacity-90">Spring Collection</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sustainability Promise */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full mb-6">
              <Recycle className="w-4 h-4" />
              <span className="font-medium">Our Circular Promise</span>
            </div>
            
            <h2 className="text-4xl font-bold mb-8">Fashion That Comes Full Circle</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 transition">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Leaf className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-bold text-lg mb-2">Sustainable Materials</h3>
                <p className="text-gray-600">Only organic, recycled, and regeneratively-sourced fabrics</p>
              </div>
              
              <div className="p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 transition">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-bold text-lg mb-2">Ethical Production</h3>
                <p className="text-gray-600">Fair wages, safe working conditions, and complete transparency</p>
              </div>
              
              <div className="p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 transition">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-bold text-lg mb-2">Carbon Neutral Shipping</h3>
                <p className="text-gray-600">All deliveries offset through verified environmental projects</p>
              </div>
            </div>
            
            <button className="border-2 border-emerald-700 text-emerald-700 px-8 py-4 rounded-full font-semibold hover:bg-emerald-50 transition">
              Read Our Sustainability Report
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-emerald-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Join The Conscious Fashion Movement</h2>
            <p className="text-emerald-100 mb-8">
              Get 15% off your first order and be the first to know about new collections, 
              sustainable living tips, and exclusive offers.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-6 py-4 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="bg-white text-emerald-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition"
              >
                Subscribe
              </button>
            </form>
            
            <p className="text-sm text-emerald-200 mt-4">
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-4">
                <span className="text-emerald-400">Eco</span>Style
              </div>
              <p className="text-gray-400 mb-4">
                Sustainable fashion for the conscious consumer. 
                Style that respects people and the planet.
              </p>
              <div className="flex space-x-4">
                <Instagram className="w-5 h-5 cursor-pointer hover:text-emerald-400" />
                <Facebook className="w-5 h-5 cursor-pointer hover:text-emerald-400" />
                <Twitter className="w-5 h-5 cursor-pointer hover:text-emerald-400" />
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Shop</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">New Arrivals</a></li>
                <li><a href="#" className="hover:text-white transition">Best Sellers</a></li>
                <li><a href="#" className="hover:text-white transition">Collections</a></li>
                <li><a href="#" className="hover:text-white transition">Gift Cards</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">About</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Our Story</a></li>
                <li><a href="#" className="hover:text-white transition">Sustainability</a></li>
                <li><a href="#" className="hover:text-white transition">Ethical Production</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Shipping & Returns</a></li>
                <li><a href="#" className="hover:text-white transition">Size Guide</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} EcoStyle Sustainable Fashion. All rights reserved.</p>
            <div className="mt-4 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4" />
                <span>Carbon Neutral Shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Ethically Certified</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Shopping Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Your Cart</h3>
                  <button onClick={() => setCartOpen(false)}>
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-lg" />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{item.name}</h4>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-gray-600">
                              ${item.price.toFixed(2)} × {item.quantity}
                            </div>
                            <div className="font-bold">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold">${cartTotal.toFixed(2)}</span>
                </div>
                
                <div className="space-y-4">
                  <button className="w-full bg-emerald-700 text-white py-4 rounded-full font-semibold hover:bg-emerald-800 transition">
                    Proceed to Checkout
                  </button>
                  <button 
                    onClick={() => setCartOpen(false)}
                    className="w-full border-2 border-emerald-700 text-emerald-700 py-4 rounded-full font-semibold hover:bg-emerald-50 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
                
                <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout • 30-day returns • Carbon neutral</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-emerald-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm">Admin Mode Active</span>
          </div>
        </div>
      )}
    </div>
  );
}