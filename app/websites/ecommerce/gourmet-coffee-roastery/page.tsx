'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingCart, 
  Package, 
  Coffee, 
  Leaf, 
  Clock, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  ChevronRight,
  CheckCircle,
  Truck,
  RefreshCw,
  Heart,
  Instagram,
  Facebook,
  Twitter,
  Menu,
  X,
  ArrowRight
} from 'lucide-react';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'coffee-gallery';

// Coffee products with placeholder prompts for admin image generation
const COFFEE_PRODUCTS = [
  { 
    id: 'ethiopian-yirgacheffe', 
    title: 'Ethiopian Yirgacheffe',
    subtitle: 'Single Origin • Light Roast',
    description: 'Floral and tea-like with notes of bergamot, jasmine, and lemon zest. Grown at 2,100m elevation.',
    price: 18.50,
    weight: '12oz',
    roast: 'Light',
    tastingNotes: ['Bergamot', 'Jasmine', 'Lemon Zest', 'Honey'],
    origin: 'Yirgacheffe, Ethiopia',
    process: 'Washed',
    altitude: '2,100m',
    prompt: 'A high-quality product photo of Ethiopian Yirgacheffe coffee beans, light roast, spilled artistically on a rustic wooden table next to a ceramic pour-over setup with blooming coffee. Soft morning light, shallow depth of field. Include fresh coffee cherries and a sprig of jasmine in the background.',
    featured: true
  },
  { 
    id: 'colombian-huila', 
    title: 'Colombian Huila',
    subtitle: 'Single Origin • Medium Roast',
    description: 'Balanced and sweet with notes of caramel, red apple, and milk chocolate. Perfect for espresso or filter.',
    price: 16.75,
    weight: '12oz',
    roast: 'Medium',
    tastingNotes: ['Caramel', 'Red Apple', 'Milk Chocolate', 'Brown Sugar'],
    origin: 'Huila, Colombia',
    process: 'Honey',
    altitude: '1,650m',
    prompt: 'Professional product photography of medium roast Colombian coffee beans in a burlap sack, spilled onto a dark slate surface. Include a crafted espresso shot being pulled, crema visible, and a latte art heart. Warm, inviting lighting with coffee plant leaves in background.',
    featured: true
  },
  { 
    id: 'sumatra-mandheling', 
    title: 'Sumatra Mandheling',
    subtitle: 'Single Origin • Dark Roast',
    description: 'Full-bodied and earthy with notes of cedar, dark chocolate, and spice. Low acidity, heavy mouthfeel.',
    price: 17.25,
    weight: '12oz',
    roast: 'Dark',
    tastingNotes: ['Cedar', 'Dark Chocolate', 'Tobacco', 'Spice'],
    origin: 'North Sumatra, Indonesia',
    process: 'Wet-Hulled',
    altitude: '1,400m',
    prompt: 'Dark roast Sumatran coffee beans, oily and shiny, in a brass scoop over aged leather surface. Include a French press with rich dark coffee and cinnamon sticks nearby. Moody, dramatic lighting with smoke wisps from a smoldering cedar chip.',
    featured: true
  },
  { 
    id: 'seasonal-blend', 
    title: 'Seasonal Reserve',
    subtitle: 'Limited Blend • Medium-Dark',
    description: 'Our rotating seasonal blend. Currently features beans from Guatemala, Kenya, and Brazil.',
    price: 19.99,
    weight: '12oz',
    roast: 'Medium-Dark',
    tastingNotes: ['Orange Marmalade', 'Cacao Nib', 'Walnut', 'Brown Butter'],
    origin: 'Multiple Origins',
    process: 'Mixed',
    altitude: 'Varies',
    prompt: 'Artisanal coffee blend with beans from multiple origins, presented in custom-printed craft paper bag with gold foil stamp. Beans arranged in pattern on marble surface with seasonal elements (autumn leaves or spring flowers). Specialty coffee tools in background.',
    featured: true
  },
  { 
    id: 'decaf-colombian', 
    title: 'Swiss Water Decaf',
    subtitle: 'Single Origin • Medium Roast',
    description: 'Chemical-free decaffeination process retains flavor integrity. Notes of toasted nuts and dried fruit.',
    price: 18.25,
    weight: '12oz',
    roast: 'Medium',
    tastingNotes: ['Toasted Almond', 'Dried Fig', 'Molasses', 'Cedar'],
    origin: 'Cauca, Colombia',
    process: 'Swiss Water Decaf',
    altitude: '1,800m',
    prompt: 'Swiss Water processed decaf coffee beans, medium roast, shown in clear glass jar next to water processing diagram. Clean, minimalist aesthetic with blue accents representing water. Coffee brewing into clear glass carafe.',
    featured: false
  },
  { 
    id: 'espresso-blend', 
    title: 'Founder\'s Espresso',
    subtitle: 'Signature Blend • Dark Roast',
    description: 'Our house blend crafted for perfect espresso. Rich crema, balanced bitterness, and lingering sweetness.',
    price: 17.75,
    weight: '12oz',
    roast: 'Dark',
    tastingNotes: ['Dark Cherry', 'Cacao', 'Hazelnut', 'Brown Sugar'],
    origin: 'Brazil & Ethiopia',
    process: 'Natural & Washed',
    altitude: 'Mixed',
    prompt: 'Professional espresso setup with dark roast espresso blend. Bottomless portafilter extracting perfect tiger-striped espresso shot into warm cup. Coffee roaster in background with steam. Industrial coffee shop aesthetic.',
    featured: true
  },
];

// Roasting process steps
const ROASTING_STEPS = [
  {
    step: 1,
    title: "Green Bean Selection",
    description: "We cupping-score every lot above 85+ before purchase",
    icon: <Leaf className="h-6 w-6" />
  },
  {
    step: 2,
    title: "Small Batch Roasting",
    description: "12kg batches for perfect consistency and development",
    icon: <RefreshCw className="h-6 w-6" />
  },
  {
    step: 3,
    title: "Real-time Monitoring",
    description: "Tracking temperature curves for ideal flavor profiles",
    icon: <Clock className="h-6 w-6" />
  },
  {
    step: 4,
    title: "24hr Resting Period",
    description: "Allowing gases to escape for optimal brewing",
    icon: <Package className="h-6 w-6" />
  }
];

// Subscription plans
const SUBSCRIPTION_PLANS = [
  {
    name: "Explorer",
    price: "$16.50/month",
    description: "Perfect for the occasional drinker",
    features: [
      "One 12oz bag monthly",
      "Free shipping",
      "Choose your roast",
      "Skip or cancel anytime"
    ],
    highlighted: false
  },
  {
    name: "Enthusiast",
    price: "$31/month",
    description: "Our most popular plan",
    features: [
      "Two 12oz bags monthly",
      "Free shipping",
      "Early access to new releases",
      "15% discount on extra bags",
      "Skip or cancel anytime"
    ],
    highlighted: true
  },
  {
    name: "Connoisseur",
    price: "$60/month",
    description: "For the true coffee aficionado",
    features: [
      "Four 12oz bags monthly",
      "Free shipping & priority processing",
      "Exclusive limited editions",
      "20% discount on all purchases",
      "Brewing guide included",
      "Skip or cancel anytime"
    ],
    highlighted: false
  }
];

type CoffeeProductState = { [key: string]: { image_url: string | null; loading?: boolean } };

export default function GourmetCoffeeRoastery() {
  // State management
  const [coffeeImages, setCoffeeImages] = useState<CoffeeProductState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState<{id: string; title: string; price: number; quantity: number}[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});

  // Refs for scroll
  const productsRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<HTMLDivElement>(null);

  // Initialize user and admin mode
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load coffee product images from Supabase
  useEffect(() => {
    const loadCoffeeImages = async () => {
      // Set loading states for all products
      const initialLoadingStates: {[key: string]: boolean} = {};
      COFFEE_PRODUCTS.forEach(product => {
        initialLoadingStates[product.id] = true;
      });
      setLoadingStates(initialLoadingStates);

      // Fetch ONLY coffee gallery images for admin
      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        COFFEE_PRODUCTS.forEach(product => {
          initialLoadingStates[product.id] = false;
        });
        setLoadingStates(initialLoadingStates);
        return;
      }

      const initialState: CoffeeProductState = {};
      COFFEE_PRODUCTS.forEach(product => {
        initialState[product.id] = { image_url: null, loading: true };
      });

      if (images) {
        const latestImagePerProduct: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          // Path structure: [user_id, gallery_prefix, product_id, filename]
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX.replace('-', '_')) {
            const productId = pathParts[2];
            // Only consider defined products and take the latest
            if (COFFEE_PRODUCTS.some(p => p.id === productId) && !latestImagePerProduct[productId]) {
              latestImagePerProduct[productId] = img.path;
            }
          }
        }

        // Build final state with only relevant products
        COFFEE_PRODUCTS.forEach(product => {
          if (latestImagePerProduct[product.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerProduct[product.id]).data.publicUrl;
            initialState[product.id] = { image_url: url, loading: false };
            initialLoadingStates[product.id] = false;
          } else {
            initialState[product.id] = { image_url: null, loading: false };
            initialLoadingStates[product.id] = false;
          }
        });
      } else {
        COFFEE_PRODUCTS.forEach(product => {
          initialState[product.id] = { image_url: null, loading: false };
          initialLoadingStates[product.id] = false;
        });
      }

      setCoffeeImages(initialState);
      setLoadingStates(initialLoadingStates);
      
      // Set a timeout to clear loading states if images don't load
      const timeout = setTimeout(() => {
        COFFEE_PRODUCTS.forEach(product => {
          initialLoadingStates[product.id] = false;
        });
        setLoadingStates(prev => ({...prev, ...initialLoadingStates}));
      }, 3000);

      return () => clearTimeout(timeout);
    };

    loadCoffeeImages();
  }, []);

  // Handle image upload for admin
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(productId);
    setLoadingStates(prev => ({...prev, [productId]: true}));
    
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX.replace('-', '_')}/${productId}/`;

      // Clean up OLD gallery images for this product
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
      setCoffeeImages(prev => ({ 
        ...prev, 
        [productId]: { image_url: publicUrl, loading: false } 
      }));
      setLoadingStates(prev => ({...prev, [productId]: false}));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
      setLoadingStates(prev => ({...prev, [productId]: false}));
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  // Copy prompt to clipboard
  const copyPrompt = (prompt: string, productId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(productId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Add item to cart
  const addToCart = (productId: string, title: string, price: number) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === productId);
      if (existingItem) {
        return prev.map(item => 
          item.id === productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { id: productId, title, price, quantity: 1 }];
      }
    });
    
    // Show cart briefly
    setCartOpen(true);
    setTimeout(() => setCartOpen(false), 3000);
  };

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Scroll to section - Fixed TypeScript error
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      window.scrollTo({
        top: ref.current.offsetTop - 80,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };

  // Handle subscription selection
  const handleSubscribe = (planName: string) => {
    setSelectedSubscription(planName);
    // In a real app, this would redirect to checkout
    alert(`Starting subscription to ${planName} plan! This would redirect to checkout in a real implementation.`);
  };

  // Featured products only
  const featuredProducts = COFFEE_PRODUCTS.filter(product => product.featured);

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900">
      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="bg-purple-900 text-white p-2 text-center text-sm sticky top-0 z-50">
          👤 Admin Mode Active — You can upload product images and copy prompts
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-amber-800 flex items-center justify-center">
                <Coffee className="h-6 w-6 text-amber-100" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-900">Ethos Roasters</h1>
                <p className="text-xs text-amber-700">Specialty Coffee Since 2012</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection(productsRef)} className="text-amber-900 hover:text-amber-700 transition">Shop Coffee</button>
              <button onClick={() => scrollToSection(storyRef)} className="text-amber-900 hover:text-amber-700 transition">Our Story</button>
              <button onClick={() => scrollToSection(subscriptionRef)} className="text-amber-900 hover:text-amber-700 transition">Subscription</button>
              <a href="#visit" className="text-amber-900 hover:text-amber-700 transition">Visit Us</a>
              
              {/* Cart */}
              <div className="relative">
                <button 
                  onClick={() => setCartOpen(!cartOpen)}
                  className="relative p-2 rounded-full hover:bg-amber-50 transition"
                >
                  <ShoppingCart className="h-6 w-6 text-amber-900" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
                
                {/* Cart Dropdown */}
                {cartOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-amber-100 p-4 z-50">
                    <h3 className="font-bold text-lg mb-3">Your Cart</h3>
                    {cart.length === 0 ? (
                      <p className="text-gray-500">Your cart is empty</p>
                    ) : (
                      <>
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between items-center py-2 border-b">
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                        <div className="flex justify-between items-center py-3 mt-2 border-t">
                          <p className="font-bold">Total</p>
                          <p className="font-bold text-lg">${cartTotal.toFixed(2)}</p>
                        </div>
                        <button className="w-full bg-amber-800 text-white py-3 rounded-lg font-bold hover:bg-amber-900 transition mt-2">
                          Checkout Now
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <button className="bg-amber-800 text-white px-6 py-2 rounded-full font-bold hover:bg-amber-900 transition">
                Order Online
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <button onClick={() => scrollToSection(productsRef)} className="block w-full text-left py-2 text-amber-900">Shop Coffee</button>
              <button onClick={() => scrollToSection(storyRef)} className="block w-full text-left py-2 text-amber-900">Our Story</button>
              <button onClick={() => scrollToSection(subscriptionRef)} className="block w-full text-left py-2 text-amber-900">Subscription</button>
              <a href="#visit" className="block w-full text-left py-2 text-amber-900">Visit Us</a>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="relative">
                    <button 
                      onClick={() => setCartOpen(!cartOpen)}
                      className="relative p-2"
                    >
                      <ShoppingCart className="h-6 w-6 text-amber-900" />
                      {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      )}
                    </button>
                  </div>
                  <button className="bg-amber-800 text-white px-6 py-2 rounded-full font-bold">
                    Order Online
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">Rated 4.9/5 by 1,200+ customers</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Small-Batch Roasted
              <span className="block text-amber-200">Specialty Coffee</span>
            </h1>
            
            <p className="text-xl mb-8 text-amber-100 max-w-xl">
              Directly sourced from sustainable farms. Roasted fresh daily in Asheville, NC. 
              Experience coffee that tells a story in every cup.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => scrollToSection(productsRef)}
                className="bg-white text-amber-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-amber-100 transition flex items-center justify-center gap-2"
              >
                Shop Fresh Roasts <ArrowRight className="h-5 w-5" />
              </button>
              <button 
                onClick={() => scrollToSection(subscriptionRef)}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition"
              >
                Subscribe & Save 15%
              </button>
            </div>
            
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <Truck className="h-8 w-8 text-amber-300" />
                <div>
                  <p className="font-bold">Free Shipping</p>
                  <p className="text-sm text-amber-200">On orders $35+</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-amber-300" />
                <div>
                  <p className="font-bold">Freshly Roasted</p>
                  <p className="text-sm text-amber-200">Within 24 hours</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Leaf className="h-8 w-8 text-amber-300" />
                <div>
                  <p className="font-bold">Direct Trade</p>
                  <p className="text-sm text-amber-200">Ethically sourced</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RefreshCw className="h-8 w-8 text-amber-300" />
                <div>
                  <p className="font-bold">Subscribe</p>
                  <p className="text-sm text-amber-200">Skip or cancel anytime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative coffee beans */}
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50,20 C70,20 85,35 85,55 C85,75 70,90 50,90 C30,90 15,75 15,55 C15,35 30,20 50,20 Z' fill='none' stroke='white' stroke-width='2'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section ref={productsRef} className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-amber-900 mb-4">Our Signature Roasts</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each batch is hand-roasted with precision, ensuring optimal flavor development 
              and consistency. We roast to order and ship within 24 hours.
            </p>
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {featuredProducts.map((product) => {
              const productData = coffeeImages[product.id] || { image_url: null, loading: true };
              const imageUrl = productData.image_url;
              const isLoading = loadingStates[product.id] || false;
              
              return (
                <div 
                  key={product.id} 
                  className="group bg-white rounded-2xl overflow-hidden border border-amber-100 hover:border-amber-300 transition-all duration-300 hover:shadow-xl"
                >
                  {/* Product Image with Admin Upload */}
                  <div className="relative h-64 overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100">
                    {isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin"></div>
                      </div>
                    ) : imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onLoad={() => setLoadingStates(prev => ({...prev, [product.id]: false}))}
                        onError={() => {
                          // Fallback to a colored div if image fails to load
                          setLoadingStates(prev => ({...prev, [product.id]: false}));
                        }}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <Coffee className="h-16 w-16 text-amber-300 mb-4" />
                        <p className="text-amber-800 font-bold">{product.title}</p>
                        <p className="text-amber-600 text-sm mt-2">{product.subtitle}</p>
                        
                        {/* Admin Upload Button (only shown in admin mode when no image) */}
                        {adminMode && !imageUrl && (
                          <div className="mt-4">
                            <label className="inline-block bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-bold cursor-pointer hover:bg-amber-700 transition">
                              {uploading === product.id ? 'Uploading…' : 'Upload Product Image'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUpload(e, product.id)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Roast Level Indicator */}
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${
                      product.roast === 'Light' ? 'bg-yellow-100 text-yellow-800' :
                      product.roast === 'Medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-amber-800 text-white'
                    }`}>
                      {product.roast} Roast
                    </div>
                    
                    {/* Admin Controls Overlay */}
                    {adminMode && (
                      <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 space-y-2">
                        {!imageUrl && (
                          <div className="space-y-1">
                            <p className="text-white text-xs">AI Prompt:</p>
                            <button
                              onClick={() => copyPrompt(product.prompt, product.id)}
                              className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded w-full"
                              type="button"
                            >
                              {copiedId === product.id ? '✓ Copied!' : 'Copy Prompt'}
                            </button>
                          </div>
                        )}
                        <label className="block text-xs bg-purple-600 text-white px-2 py-1 rounded cursor-pointer text-center">
                          {uploading === product.id ? 'Uploading…' : 'Upload Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, product.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{product.title}</h3>
                        <p className="text-amber-700 text-sm">{product.subtitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-900">${product.price}</p>
                        <p className="text-gray-500 text-sm">{product.weight} bag</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    
                    {/* Tasting Notes */}
                    <div className="mb-6">
                      <p className="text-sm font-bold text-gray-700 mb-2">Tasting Notes:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.tastingNotes.map((note, index) => (
                          <span 
                            key={index} 
                            className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Origin Details */}
                    <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                      <div>
                        <p className="font-bold text-gray-700">Origin</p>
                        <p className="text-gray-600">{product.origin}</p>
                      </div>
                      <div>
                        <p className="font-bold text-gray-700">Process</p>
                        <p className="text-gray-600">{product.process}</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button 
                        onClick={() => addToCart(product.id, product.title, product.price)}
                        className="flex-1 bg-amber-800 text-white py-3 rounded-lg font-bold hover:bg-amber-900 transition flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        Add to Cart
                      </button>
                      <button className="w-12 h-12 border border-amber-300 rounded-lg flex items-center justify-center hover:bg-amber-50 transition">
                        <Heart className="h-5 w-5 text-amber-700" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* View All Products CTA */}
          <div className="text-center">
            <button className="text-amber-800 font-bold flex items-center justify-center gap-2 mx-auto hover:text-amber-900 transition">
              View All Coffee Varieties <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section ref={storyRef} className="py-16 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-amber-900 mb-6">Our Roasting Philosophy</h2>
              <p className="text-gray-700 mb-6 text-lg">
                Founded in 2012 by two friends with a passion for exceptional coffee, 
                Ethos Roasters began as a small garage operation in Asheville, North Carolina.
              </p>
              <p className="text-gray-700 mb-8">
                We believe coffee should be transparent from farm to cup. That's why we 
                build direct relationships with farmers, pay above fair trade prices, and 
                roast in small batches to highlight each bean's unique character.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                {ROASTING_STEPS.map((step) => (
                  <div key={step.step} className="bg-white p-4 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                        {step.icon}
                      </div>
                      <span className="font-bold text-amber-900">Step {step.step}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
              
              <button className="bg-amber-800 text-white px-8 py-3 rounded-full font-bold hover:bg-amber-900 transition">
                Meet Our Team
              </button>
            </div>
            
            {/* Stats */}
            <div className="bg-amber-900 text-white rounded-2xl p-8 md:p-12">
              <h3 className="text-2xl font-bold mb-8 text-center">By The Numbers</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">12</div>
                  <p className="text-amber-200">Years Roasting</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">45+</div>
                  <p className="text-amber-200">Farm Partnerships</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">24</div>
                  <p className="text-amber-200">Hour Roast-to-Ship</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">4.9★</div>
                  <p className="text-amber-200">Average Rating</p>
                </div>
              </div>
              
              <div className="mt-12 p-6 bg-amber-800/50 rounded-xl">
                <h4 className="font-bold text-xl mb-3">Visit Our Tasting Room</h4>
                <p className="text-amber-100 mb-4">
                  Experience our coffees firsthand at our Asheville roastery. 
                  Free tastings every Saturday at 11am.
                </p>
                <div className="flex items-center gap-2 text-amber-200">
                  <MapPin className="h-5 w-5" />
                  <span>123 Coffee Lane, Asheville, NC 28801</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section ref={subscriptionRef} className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full mb-4">
              <RefreshCw className="h-4 w-4" />
              <span className="font-bold">Most Popular</span>
            </div>
            <h2 className="text-4xl font-bold text-amber-900 mb-4">Never Run Out of Fresh Coffee</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join our subscription community and enjoy freshly roasted coffee delivered to your door. 
              Pause, skip, or cancel anytime.
            </p>
          </div>
          
          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div 
                key={plan.name} 
                className={`rounded-2xl border-2 p-8 relative transition-all duration-300 hover:-translate-y-2 ${
                  plan.highlighted 
                    ? 'border-amber-500 bg-gradient-to-b from-amber-50 to-white shadow-xl' 
                    : 'border-amber-100 bg-white'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-amber-600 text-white px-4 py-1 rounded-full font-bold text-sm">
                      MOST POPULAR
                    </div>
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-amber-900 mb-2">{plan.price}</div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => handleSubscribe(plan.name)}
                  className={`w-full py-4 rounded-full font-bold text-lg transition ${
                    plan.highlighted
                      ? 'bg-amber-800 text-white hover:bg-amber-900'
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  }`}
                >
                  {selectedSubscription === plan.name ? '✓ Selected' : 'Subscribe Now'}
                </button>
              </div>
            ))}
          </div>
          
          {/* Subscription Benefits */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-amber-900 to-amber-800 text-white rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Why Subscribe?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="h-12 w-12 rounded-full bg-amber-700 flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Free Shipping</h4>
                  <p className="text-amber-200 text-sm">Always free, no minimums</p>
                </div>
                <div>
                  <div className="h-12 w-12 rounded-full bg-amber-700 flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Exclusive Access</h4>
                  <p className="text-amber-200 text-sm">First to try limited releases</p>
                </div>
                <div>
                  <div className="h-12 w-12 rounded-full bg-amber-700 flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Full Control</h4>
                  <p className="text-amber-200 text-sm">Pause, skip, or cancel anytime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Us / Contact Section */}
      <section id="visit" className="py-16 bg-amber-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-amber-900 mb-4">Visit Our Roastery</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Come see where the magic happens. Tour our roasting facility, 
              enjoy a complimentary tasting, or just grab a bag to go.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Visit Us</h4>
                    <p className="text-gray-600">123 Coffee Lane<br />Asheville, NC 28801</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Call Us</h4>
                    <p className="text-gray-600">(828) 555-0123</p>
                    <p className="text-sm text-gray-500">Mon-Fri 7am-5pm, Sat 8am-4pm</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Email Us</h4>
                    <p className="text-gray-600">hello@ethosroasters.com</p>
                    <p className="text-sm text-gray-500">We respond within 24 hours</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t">
                <h4 className="font-bold text-gray-900 mb-4">Follow Our Journey</h4>
                <div className="flex gap-4">
                  <a href="#" className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition">
                    <Instagram className="h-5 w-5 text-amber-700" />
                  </a>
                  <a href="#" className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition">
                    <Facebook className="h-5 w-5 text-amber-700" />
                  </a>
                  <a href="#" className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition">
                    <Twitter className="h-5 w-5 text-amber-700" />
                  </a>
                </div>
              </div>
            </div>
            
            {/* Hours */}
            <div className="bg-amber-900 text-white rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Tasting Room Hours</h3>
              
              <div className="space-y-4 mb-8">
                {[
                  { day: 'Monday - Friday', hours: '7:00 AM - 5:00 PM' },
                  { day: 'Saturday', hours: '8:00 AM - 4:00 PM' },
                  { day: 'Sunday', hours: '9:00 AM - 3:00 PM' },
                ].map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-amber-800">
                    <span className="font-medium">{schedule.day}</span>
                    <span className="font-bold">{schedule.hours}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-amber-800/50 rounded-xl p-6">
                <h4 className="font-bold text-lg mb-2">Free Saturday Tastings</h4>
                <p className="text-amber-200 mb-4">
                  Join us every Saturday at 11am for a guided tasting of our latest roasts. 
                  No reservation required.
                </p>
                <button className="bg-white text-amber-900 px-6 py-3 rounded-full font-bold hover:bg-amber-100 transition">
                  View Tasting Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Coffee className="h-8 w-8 text-amber-400" />
                <span className="text-2xl font-bold">Ethos Roasters</span>
              </div>
              <p className="text-gray-400">
                Small-batch specialty coffee roasted daily in Asheville, NC since 2012.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Shop</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-amber-400 transition">Single Origin</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Espresso Blends</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Decaf Options</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Gift Cards</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Learn</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-amber-400 transition">Brewing Guides</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Coffee Education</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Our Farm Partners</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Sustainability</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-amber-400 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">Returns & Exchanges</a></li>
                <li><a href="#" className="hover:text-amber-400 transition">FAQ</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Ethos Roasters. All rights reserved.</p>
            <p className="text-sm mt-2">Direct trade. Sustainably sourced. Passionately roasted.</p>
          </div>
        </div>
      </footer>

      {/* Floating Cart Indicator */}
      {cart.length > 0 && !cartOpen && (
        <button 
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 bg-amber-800 text-white p-4 rounded-full shadow-xl hover:bg-amber-900 transition z-50 flex items-center gap-2"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="font-bold">${cartTotal.toFixed(2)}</span>
          <span className="h-6 w-6 bg-white text-amber-800 rounded-full text-sm flex items-center justify-center">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </button>
      )}
    </div>
  );
}