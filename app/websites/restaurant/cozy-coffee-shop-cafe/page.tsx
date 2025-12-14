// File: app/restaurants/cozy-coffee-shop-cafe/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Phone, Mail, Instagram, Facebook, Twitter, ArrowRight, Coffee, Leaf, Heart, Star, ChevronRight, ChevronLeft } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Menu items with categories
const MENU_CATEGORIES = [
  { id: 'coffee', title: 'Signature Coffees', icon: Coffee },
  { id: 'tea', title: 'Artisan Teas', icon: Leaf },
  { id: 'pastries', title: 'Fresh Pastries', icon: Heart },
  { id: 'breakfast', title: 'Breakfast Favorites', icon: Star },
];

const MENU_ITEMS = {
  coffee: [
    { id: 'espresso', name: 'Double Espresso', description: 'Rich, bold, and perfectly extracted', price: '$3.50' },
    { id: 'latte', name: 'Hearth Latte', description: 'Our signature latte with house-made vanilla bean syrup', price: '$4.75' },
    { id: 'cappuccino', name: 'Classic Cappuccino', description: 'Equal parts espresso, steamed milk, and foam', price: '$4.25' },
    { id: 'cold-brew', name: 'Cold Brew Flight', description: 'Three 4oz pours of our single-origin cold brews', price: '$6.50' },
  ],
  tea: [
    { id: 'chai', name: 'Spiced Chai Latte', description: 'House-made chai blend with warm spices and steamed milk', price: '$4.50' },
    { id: 'matcha', name: 'Ceremonial Matcha', description: 'Premium Japanese matcha with optional oat milk', price: '$5.25' },
    { id: 'herbal', name: 'Herbal Infusion', description: 'Rotating seasonal herbal blends, caffeine-free', price: '$3.75' },
  ],
  pastries: [
    { id: 'croissant', name: 'Butter Croissant', description: 'Flaky, golden, and baked fresh daily', price: '$3.25' },
    { id: 'muffin', name: 'Blueberry Lemon Muffin', description: 'Local blueberries with zesty lemon glaze', price: '$3.75' },
    { id: 'scone', name: 'Maple Bacon Scone', description: 'Savory-sweet with local maple syrup and crispy bacon', price: '$4.25' },
  ],
  breakfast: [
    { id: 'avocado-toast', name: 'Avocado Toast', description: 'Sourdough with smashed avocado, microgreens, and chili flakes', price: '$8.50' },
    { id: 'breakfast-sandwich', name: 'Breakfast Sandwich', description: 'Local egg, cheddar, and house-made sausage on brioche', price: '$7.75' },
    { id: 'granola-bowl', name: 'House Granola Bowl', description: 'House-made granola with yogurt, seasonal fruit, and honey', price: '$6.95' },
  ],
};

// Testimonials
const TESTIMONIALS = [
  {
    id: '1',
    name: 'Sarah M.',
    location: 'Downtown',
    text: 'Hearth & Bean is my happy place. The baristas remember my order, and the atmosphere makes me feel like I\'m in a cozy cabin rather than the middle of the city.',
  },
  {
    id: '2',
    name: 'Michael T.',
    location: 'Westside',
    text: 'The Cold Brew Flight is a game-changer for coffee enthusiasts. I love comparing the different single-origin flavors. Plus, their pastries are always fresh and never too sweet.',
  },
  {
    id: '3',
    name: 'Jamie L.',
    location: 'University District',
    text: 'As a student, I appreciate that they have power outlets at every table and free Wi-Fi that actually works. But honestly, I keep coming back for the Hearth Latte and the warm, welcoming vibe.',
  },
];

// Hours of operation
const HOURS = [
  { day: 'Monday - Friday', hours: '6:30 AM - 7:00 PM' },
  { day: 'Saturday', hours: '7:00 AM - 8:00 PM' },
  { day: 'Sunday', hours: '8:00 AM - 6:00 PM' },
];

// Location information
const LOCATION = {
  address: '421 Maplewood Drive',
  city: 'Aspenwood',
  state: 'CO',
  zip: '80301',
  phone: '(303) 555-7890',
  email: 'hello@hearthandbean.com',
};

// Gallery artwork definitions
const ARTWORKS = [
  { 
    id: 'morning-light', 
    title: 'Morning Light',
    prompt: 'A warm, inviting coffee shop interior bathed in soft morning sunlight streaming through large windows. Steam rises from ceramic mugs on rustic wooden tables, with fresh pastries displayed in a glass case. Cozy armchairs with knit blankets, shelves of books, and hanging plants create a welcoming atmosphere. Soft focus background with customers enjoying quiet moments.'
  },
  { 
    id: 'barista-craft', 
    title: 'Barista Craft',
    prompt: 'A skilled barista in action, expertly pouring latte art in a beautifully decorated coffee cup. Steam rises from the espresso machine, and fresh coffee beans are visible in glass containers. Warm lighting highlights the craftsmanship and attention to detail, with copper accents and wooden surfaces creating an artisanal feel.'
  },
  { 
    id: 'patio-oasis', 
    title: 'Patio Oasis',
    prompt: 'A charming outdoor patio area with string lights hanging overhead, surrounded by lush greenery and potted plants. Customers enjoy coffee and pastries at wrought-iron tables with comfortable cushions. Soft evening light creates a magical atmosphere, with the warm glow of the coffee shop interior visible through French doors. A water feature adds gentle background sounds.'
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };

// Loading skeleton component
const LoadingSkeleton = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`bg-gray-200 animate-pulse rounded-lg ${height} w-full`} />
);

// Fixed TypeScript errors by adding proper type definitions
type OptimizedImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  height?: number;
  width?: number;
  priority?: boolean;
};

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  height = 300, 
  width = 400, 
  priority = false 
}: OptimizedImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`} style={{ height, width }}>
        <span className="text-gray-500 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      {!imageLoaded && <LoadingSkeleton height={`h-[${height}px]`} />}
      <Image
        src={src}
        alt={alt}
        fill
        className={`${className} object-cover rounded-lg transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setError(true)}
        priority={priority}
      />
    </div>
  );
};

// Gallery component with admin functionality
const CoffeeGallery = ({ 
  artworks, 
  adminMode, 
  handleUpload, 
  copyPrompt, 
  uploading, 
  copiedId 
}: { 
  artworks: ArtworkState;
  adminMode: boolean;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => void;
  copyPrompt: (prompt: string, artworkId: string) => void;
  uploading: string | null;
  copiedId: string | null;
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Our Coffee Shop Experience</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Step into Hearth & Bean and discover why our cozy atmosphere and exceptional coffee have made us a neighborhood favorite since 2018.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ARTWORKS.map((art) => {
          const artworkData = artworks[art.id] || { image_url: null };
          const imageUrl = artworkData.image_url;

          return (
            <div key={art.id} className="bg-white rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
              <div className="h-64 relative">
                {imageUrl ? (
                  <OptimizedImage 
                    src={imageUrl} 
                    alt={art.title} 
                    className="w-full h-full"
                    height={256}
                    width={384}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
                    <div className="text-center">
                      <Coffee className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">{art.title}</p>
                      <p className="text-sm text-gray-500 mt-1">Image placeholder</p>
                    </div>
                  </div>
                )}
              </div>

              {adminMode && (
                <div className="p-4 border-t border-gray-100 space-y-3">
                  {!imageUrl && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-amber-600 line-clamp-2">{art.prompt}</p>
                      <button
                        onClick={() => copyPrompt(art.prompt, art.id)}
                        className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded hover:bg-amber-100 transition-colors self-start"
                        type="button"
                      >
                        {copiedId === art.id ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>
                  )}
                  <label className="block text-sm bg-amber-600 text-white px-3 py-2 rounded cursor-pointer w-full text-center hover:bg-amber-700 transition-colors">
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

              <div className="p-4 mt-auto">
                <h3 className="font-bold text-lg text-gray-800">{art.title}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {art.id === 'morning-light' && 'Our cozy interior where community happens'}
                  {art.id === 'barista-craft' && 'Where every cup is crafted with care'}
                  {art.id === 'patio-oasis' && 'Your outdoor escape in the heart of the city'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {adminMode && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          👤 Admin mode active — upload images and copy prompts for AI generation
        </div>
      )}
    </div>
  );
};

// Navigation component
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Menu', href: '#menu' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Visit Us', href: '#location' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="#" className="flex items-center space-x-2">
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-2 rounded-lg">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <span className={`font-bold text-xl ${scrolled ? 'text-gray-800' : 'text-white'}`}>Hearth & Bean</span>
        </Link>

        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`font-medium transition-colors ${
                scrolled ? 'text-gray-700 hover:text-amber-600' : 'text-white hover:text-amber-200'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`md:hidden ${scrolled ? 'text-gray-700' : 'text-white'}`}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white shadow-lg"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block py-2 text-gray-700 font-medium hover:text-amber-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// Hero section
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-700/5" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center justify-center px-4 py-2 bg-amber-100 text-amber-800 rounded-full mb-6">
              <Leaf className="w-4 h-4 mr-2" />
              <span className="font-medium">Locally roasted • Community focused</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
              Where Every Cup{' '}
              <span className="bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                Warms the Soul
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Crafted with care since 2018. Join us for exceptional coffee, cozy corners, and moments that matter in the heart of Aspenwood.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="#menu"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-800 text-white font-bold rounded-lg hover:from-amber-700 hover:to-amber-900 transition-all transform hover:scale-105 shadow-lg"
              >
                View Our Menu <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="#location"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-amber-700 font-bold rounded-lg border-2 border-amber-200 hover:bg-amber-50 transition-all"
              >
                Visit Us <MapPin className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// About section - FIXED: Now uses the barista-craft artwork image
const AboutSection = ({ artworks }: { artworks: ArtworkState }) => {
  const baristaCraftImage = artworks['barista-craft']?.image_url || null;
  
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Our Story: More Than Just Coffee
              </h2>
              <p className="text-gray-600 mb-6">
                Founded in 2018 by local barista Emma Rodriguez and her husband Michael, Hearth & Bean began as a dream to create a space where community could flourish over exceptional coffee. What started as a small corner shop has grown into a beloved neighborhood hub, but our commitment to quality and connection remains unchanged.
              </p>
              <p className="text-gray-600 mb-8">
                We source our beans directly from sustainable farms across Central and South America, ensuring fair trade practices and exceptional flavor profiles. Every cup is crafted with the same care Emma put into her first espresso machine, and every customer is treated like family.
              </p>
              <div className="flex space-x-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-amber-400 fill-current" />
                ))}
                <span className="text-gray-600 font-medium">4.9/5 stars from 350+ reviews</span>
              </div>
            </motion.div>
          </div>
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                {baristaCraftImage ? (
                  <OptimizedImage
                    src={baristaCraftImage}
                    alt="Barista Craft in Action"
                    className="w-full h-full"
                    height={400}
                    width={600}
                  />
                ) : (
                  <div className="aspect-[4/3] bg-gradient-to-br from-amber-400 to-amber-600 flex flex-col items-center justify-center p-8 text-center">
                    <Coffee className="w-24 h-24 text-white opacity-80 mb-4" />
                    <span className="text-white text-xl font-medium block mb-2">Coffee Craft in Action</span>
                    <span className="text-amber-100 text-lg">Where every cup is crafted with care</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-lg max-w-xs">
                <p className="font-bold text-amber-700 mb-2">"The best latte in town"</p>
                <p className="text-gray-600 text-sm">— Local Food Critic, 2023</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Menu section
const MenuSection = () => {
  const [activeCategory, setActiveCategory] = useState('coffee');

  return (
    <section id="menu" className="py-20 bg-gradient-to-br from-amber-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Our Artisan Menu
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every item is crafted with locally-sourced ingredients and served with genuine warmth. We rotate seasonal specials monthly.
            </p>
          </motion.div>
        </div>

        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-3 border-b border-amber-200 pb-4">
            {MENU_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-all ${
                    activeCategory === category.id
                      ? 'text-amber-700 border-b-2 border-amber-700'
                      : 'text-gray-600 hover:text-amber-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{category.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {MENU_ITEMS[activeCategory as keyof typeof MENU_ITEMS].map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-amber-100"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                <span className="font-bold text-amber-700">{item.price}</span>
              </div>
              <p className="text-gray-600">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="#location"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-800 text-white font-bold rounded-lg hover:from-amber-700 hover:to-amber-900 transition-all"
          >
            Reserve Your Table <ChevronRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

// Testimonials section
const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              What Our Community Says
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it—hear from the neighbors, remote workers, and coffee lovers who make Hearth & Bean their daily ritual.
            </p>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative h-[300px]" ref={testimonialsRef}>
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: index === currentIndex ? 1 : 0,
                  x: index === currentIndex ? 0 : 20,
                  position: index === currentIndex ? 'relative' : 'absolute'
                }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className={`absolute inset-0 p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-lg flex flex-col justify-center`}
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-6 text-lg">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="font-bold text-gray-800">{testimonial.name}</p>
                  <p className="text-amber-600 text-sm">{testimonial.location}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-8 space-x-3">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex ? 'bg-amber-600 w-6' : 'bg-amber-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Location section
const LocationSection = () => {
  return (
    <section id="location" className="py-20 bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Visit Our Cozy Corner
              </h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">{LOCATION.address}</p>
                    <p className="text-gray-600">{LOCATION.city}, {LOCATION.state} {LOCATION.zip}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800 mb-2">Hours of Operation</p>
                    <div className="space-y-1">
                      {HOURS.map((hour, index) => (
                        <p key={index} className="text-gray-600">{hour.day}: {hour.hours}</p>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Call Us</p>
                    <p className="text-gray-600">{LOCATION.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Email Us</p>
                    <p className="text-gray-600">{LOCATION.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                {[Instagram, Facebook, Twitter].map((SocialIcon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center hover:bg-amber-200 transition-colors"
                  >
                    <SocialIcon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
          
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <MapPin className="w-16 h-16 mx-auto mb-4 opacity-90" />
                  <h3 className="text-2xl font-bold mb-2">Find Us Here</h3>
                  <p className="text-amber-100">421 Maplewood Drive, Aspenwood, CO</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

// CTA section
const CTASection = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-amber-600 to-amber-800 text-white">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Experience the Hearth & Bean Difference?
          </h2>
          <p className="text-amber-100 mb-8 text-lg">
            Whether you're looking for your new daily coffee spot or planning a special gathering, we'd love to welcome you soon.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="#location"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-amber-800 font-bold rounded-lg hover:bg-amber-50 transition-all transform hover:scale-105"
            >
              Find Us <MapPin className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="tel:3035557890"
              className="inline-flex items-center justify-center px-8 py-4 bg-amber-700 text-white font-bold rounded-lg hover:bg-amber-800 transition-all border-2 border-white"
            >
              Call to Reserve <Phone className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-2 rounded-lg">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Hearth & Bean</span>
            </div>
            <p className="text-gray-400 mb-4">
              Crafted with care since 2018. Your neighborhood coffee sanctuary in the heart of Aspenwood.
            </p>
            <div className="flex space-x-4">
              {[Instagram, Facebook, Twitter].map((SocialIcon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-8 h-8 rounded-full bg-gray-800 text-amber-400 flex items-center justify-center hover:bg-amber-900 transition-colors"
                >
                  <SocialIcon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {['Home', 'Menu', 'Gallery', 'Visit Us', 'Contact'].map((link, index) => (
                <li key={index}>
                  <a href={`#${link.toLowerCase().replace(' ', '-')}`} className="hover:text-amber-400 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-bold mb-4">Hours</h3>
            <ul className="space-y-2">
              {HOURS.map((hour, index) => (
                <li key={index} className="flex justify-between">
                  <span className="text-gray-400">{hour.day}</span>
                  <span className="text-white">{hour.hours}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-amber-400 mt-1" />
                <span>{LOCATION.address}, {LOCATION.city}, {LOCATION.state} {LOCATION.zip}</span>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-amber-400 mt-1" />
                <span>{LOCATION.phone}</span>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-amber-400 mt-1" />
                <span>{LOCATION.email}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Hearth & Bean Coffee Co. All rights reserved.</p>
          <p className="mt-1">Locally owned • Community focused • Sustainably sourced</p>
        </div>
      </div>
    </footer>
  );
};

// Main page component
export default function CozyCoffeeShopPage() {
  // State for gallery images
  const [artworks, setArtworks] = useState<ArtworkState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize artworks state
  useEffect(() => {
    const initialState: ArtworkState = {};
    ARTWORKS.forEach(art => initialState[art.id] = { image_url: null });
    setArtworks(initialState);
  }, []);

  // Check user authentication
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
    if (!adminMode) return;

    const loadImages = async () => {
      try {
        // Fetch gallery images
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

        if (!images || images.length === 0) {
          return;
        }

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

        // Update state with latest images
        setArtworks(prev => {
          const newState = { ...prev };
          ARTWORKS.forEach(art => {
            if (latestImagePerArtwork[art.id]) {
              const url = supabase.storage
                .from('user_images')
                .getPublicUrl(latestImagePerArtwork[art.id]).data.publicUrl;
              newState[art.id] = { image_url: url };
            }
          });
          return newState;
        });
      } catch (err) {
        console.error('Error loading gallery:', err);
      }
    };

    loadImages();
  }, [adminMode]);

  // Handle image upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(artworkId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${artworkId}/`;

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
      
      // Update state with new image
      setArtworks(prev => ({
        ...prev,
        [artworkId]: { image_url: publicUrl }
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  // Copy prompt to clipboard
  const copyPrompt = (prompt: string, artworkId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(artworkId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navigation />
      
      <main>
        <HeroSection />
        <AboutSection artworks={artworks} />
        <MenuSection />
        <section id="gallery" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <CoffeeGallery 
              artworks={artworks}
              adminMode={adminMode}
              handleUpload={handleUpload}
              copyPrompt={copyPrompt}
              uploading={uploading}
              copiedId={copiedId}
            />
          </div>
        </section>
        <TestimonialsSection />
        <LocationSection />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
}