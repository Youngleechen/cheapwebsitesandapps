// app/restaurants/vegan-bakery-and-eatery/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Business-specific configuration
const BUSINESS_NAME = "Sprout & Crumb";
const BUSINESS_TAGLINE = "Artisan Vegan Baked Goods & Plant-Based Eats";
const BUSINESS_DESCRIPTION = "Handcrafted vegan pastries, breads, and cafe fare made with organic, locally-sourced ingredients. Family-owned since 2015.";
const BUSINESS_ADDRESS = "123 Maple Street, Austin, TX 78704";
const BUSINESS_PHONE = "(512) 555-7890";
const BUSINESS_EMAIL = "hello@sproutandcrumb.com";
const BUSINESS_HOURS = [
  { day: "Monday", hours: "7:00 AM - 6:00 PM" },
  { day: "Tuesday", hours: "7:00 AM - 6:00 PM" },
  { day: "Wednesday", hours: "7:00 AM - 6:00 PM" },
  { day: "Thursday", hours: "7:00 AM - 6:00 PM" },
  { day: "Friday", hours: "7:00 AM - 7:00 PM" },
  { day: "Saturday", hours: "8:00 AM - 7:00 PM" },
  { day: "Sunday", hours: "8:00 AM - 4:00 PM" },
];

// Menu categories with items
const MENU_CATEGORIES = [
  {
    id: 'pastries',
    name: 'Artisan Pastries',
    items: [
      {
        id: 'cinnamon-roll',
        name: 'Cinnamon Roll Bliss',
        description: 'Flaky, gooey cinnamon rolls topped with coconut cream glaze and toasted pecans',
        price: '$4.50',
        imagePrompt: 'A perfectly golden vegan cinnamon roll with spiral layers, drizzled with white coconut cream glaze and topped with toasted pecans, sitting on a rustic wooden table with morning light'
      },
      {
        id: 'croissant',
        name: 'Buttery Croissant',
        description: 'Flaky, buttery croissant made with plant-based butter and organic flour',
        price: '$3.75',
        imagePrompt: 'A golden-brown vegan croissant with flaky layers, steam rising gently, placed on a ceramic plate with a dusting of powdered sugar, soft natural lighting'
      },
      {
        id: 'danish',
        name: 'Berry Danish',
        description: 'Sweet danish pastry filled with house-made berry compote and almond cream',
        price: '$4.25',
        imagePrompt: 'A beautiful vegan berry danish with exposed filling showing vibrant red berries and creamy almond filling, dusted with powdered sugar, on a white plate with fresh mint garnish'
      }
    ]
  },
  {
    id: 'bread',
    name: 'Artisan Breads',
    items: [
      {
        id: 'sourdough',
        name: 'Classic Sourdough',
        description: 'Naturally leavened sourdough bread with a crispy crust and chewy interior',
        price: '$8.50',
        imagePrompt: 'A rustic loaf of vegan sourdough bread with a dark, crackly crust, sliced open to show the airy crumb structure, on a wooden cutting board with flour dusting'
      },
      {
        id: 'rye',
        name: 'Dark Rye',
        description: 'Hearty dark rye bread with caraway seeds and molasses',
        price: '$7.75',
        imagePrompt: 'A dense, dark rye bread loaf with visible caraway seeds, sliced thickly to show the moist crumb, on a slate board with a small bowl of plant-based butter'
      },
      {
        id: 'focaccia',
        name: 'Rosemary Focaccia',
        description: 'Olive oil-infused focaccia topped with fresh rosemary and sea salt',
        price: '$6.50',
        imagePrompt: 'A golden vegan focaccia bread with dimpled surface, glistening with olive oil, topped with fresh rosemary sprigs and sea salt crystals, on a wooden board'
      }
    ]
  },
  {
    id: 'savory',
    name: 'Savory Eats',
    items: [
      {
        id: 'quiche',
        name: 'Mushroom Quiche',
        description: 'Creamy cashew-based quiche with wild mushrooms and caramelized onions',
        price: '$9.50',
        imagePrompt: 'A slice of vegan mushroom quiche with visible creamy filling and sautéed mushrooms, on a white plate with a side salad, soft restaurant lighting'
      },
      {
        id: 'sandwich',
        name: 'Avocado Toast',
        description: 'House-made sourdough topped with smashed avocado, radish, and microgreens',
        price: '$8.25',
        imagePrompt: 'Artisanal avocado toast on thick sourdough bread, topped with vibrant red radish slices, fresh microgreens, and edible flowers, drizzled with olive oil'
      },
      {
        id: 'soup',
        name: 'Tomato Basil Soup',
        description: 'Creamy tomato soup with fresh basil and garlic croutons',
        price: '$6.75',
        imagePrompt: 'A steaming bowl of rich vegan tomato basil soup with a swirl of coconut cream, garnished with fresh basil leaves and served with a side of crusty bread'
      }
    ]
  }
];

// Testimonials
const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Maya Rodriguez',
    location: 'Austin, TX',
    text: "Sprout & Crumb changed my mind about vegan baking! Their cinnamon rolls are better than any I've had, and I've been eating pastries for 30 years. My whole family is hooked.",
    imagePrompt: 'A smiling woman in her 40s enjoying a cinnamon roll at a cafe table, warm natural lighting, cozy bakery atmosphere in background'
  },
  {
    id: 't2',
    name: 'David Chen',
    location: 'Round Rock, TX',
    text: "As someone with dairy and egg allergies, finding a bakery that doesn't compromise on taste has been life-changing. Their sourdough bread is incredible - crusty outside, perfectly chewy inside.",
    imagePrompt: 'A man in his 30s holding a slice of artisan bread, smiling warmly, sitting at a wooden table in a bright, airy cafe setting'
  },
  {
    id: 't3',
    name: 'Sarah Johnson',
    location: 'Cedar Park, TX',
    text: "I host weekly meetings at Sprout & Crumb because the coffee is exceptional and the vegan quiche impresses even my non-vegan colleagues. The staff is always welcoming and the space is so peaceful.",
    imagePrompt: 'A professional woman in her 30s having a coffee meeting at a small cafe table, laptop open, with a plate of pastries and two coffee cups, warm ambient lighting'
  }
];

// Gallery artworks configuration
const GALLERY_ARTWORKS = [
  { 
    id: 'bakery-interior', 
    title: 'Bakery Interior',
    prompt: 'A warm, inviting vegan bakery interior with wooden tables, hanging plants, and display cases full of artisan pastries. Soft morning light streams through large windows, creating a cozy, community-focused atmosphere. Style: bright, welcoming, professional food photography'
  },
  { 
    id: 'baking-process', 
    title: 'Baking Process',
    prompt: 'A skilled baker in a clean, modern kitchen hand-shaping artisan bread dough. Focus on the texture of the dough and the baker\'s hands, with natural light from kitchen windows. Style: authentic, behind-the-scenes, warm and professional'
  },
  { 
    id: 'pastry-display', 
    title: 'Pastry Display',
    prompt: 'A beautifully arranged display case filled with vegan pastries - golden croissants, berry danishes, and cinnamon rolls. The glass reflects soft cafe lighting, with customers visible in the background enjoying their treats. Style: mouth-watering, professional food photography, inviting'
  },
  { 
    id: 'cafe-atmosphere', 
    title: 'Cafe Atmosphere',
    prompt: 'A bustling yet peaceful cafe scene during morning rush hour. Customers enjoying coffee and pastries at wooden tables, baristas crafting drinks behind the counter, warm lighting, and greenery throughout the space. Style: candid, lifestyle photography, vibrant community atmosphere'
  }
];

// TypeScript interfaces
interface ImageData {
  image_url: string | null;
}

interface GalleryState {
  [key: string]: ImageData;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function VeganBakeryPage() {
  const [galleryImages, setGalleryImages] = useState<GalleryState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [scrolled, setScrolled] = useState(false);

  // Handle scrolling for header transparency
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check user authentication and admin status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === process.env.NEXT_PUBLIC_ADMIN_USER_ID);
      setLoading(false);
    };
    checkUser();
  }, []);

  // Load gallery images
  useEffect(() => {
    if (loading) return;

    const loadImages = async () => {
      const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
      if (!ADMIN_USER_ID) return;

      try {
        // Initialize state with null images
        const initialState: GalleryState = {};
        GALLERY_ARTWORKS.forEach(art => {
          initialState[art.id] = { image_url: null };
        });

        // Fetch gallery images
        const { data: images, error } = await supabase
          .from('images')
          .select('path, created_at')
          .eq('user_id', ADMIN_USER_ID)
          .like('path', `${ADMIN_USER_ID}/gallery/%`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (images) {
          const latestImagePerArtwork: Record<string, string> = {};

          for (const img of images) {
            const pathParts = img.path.split('/');
            if (pathParts.length >= 4 && pathParts[1] === 'gallery') {
              const artId = pathParts[2];
              if (GALLERY_ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
                latestImagePerArtwork[artId] = img.path;
              }
            }
          }

          // Build final state
          GALLERY_ARTWORKS.forEach(art => {
            if (latestImagePerArtwork[art.id]) {
              const url = supabase.storage
                .from('user_images')
                .getPublicUrl(latestImagePerArtwork[art.id]).data.publicUrl;
              initialState[art.id] = { image_url: url };
            }
          });
        }

        setGalleryImages(initialState);
      } catch (err) {
        console.error('Error loading gallery images:', err);
      }
    };

    loadImages();
  }, [loading]);

  // Form handling
 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    try {
      // In a real app, you'd send this to your backend/API
      // For demo purposes, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setFormStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (error) {
      console.error('Form submission error:', error);
      setFormStatus('error');
    }
  };

  // Get image URL with fallback
  const getImageUrl = (imageId: string): string | null => {
    const imageData = galleryImages[imageId];
    return imageData?.image_url || null;
  };

  // Smooth scrolling helper
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-800 font-medium">Loading {BUSINESS_NAME}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-100 p-1.5 rounded-full">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S&C</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">{BUSINESS_NAME}</h1>
                <p className="text-xs md:text-sm text-amber-700 hidden md:block">{BUSINESS_TAGLINE}</p>
              </div>
            </div>
            
            <nav className="hidden md:block">
              <ul className="flex space-x-8">
                <li><button onClick={() => scrollToSection('menu')} className="text-gray-700 hover:text-amber-600 font-medium transition-colors">Menu</button></li>
                <li><button onClick={() => scrollToSection('gallery')} className="text-gray-700 hover:text-amber-600 font-medium transition-colors">Gallery</button></li>
                <li><button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-amber-600 font-medium transition-colors">About</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-amber-600 font-medium transition-colors">Contact</button></li>
              </ul>
            </nav>
            
            <div className="flex items-center space-x-4">
              <a href={`tel:${BUSINESS_PHONE.replace(/\D/g, '')}`} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg font-medium transition-colors hidden sm:inline-block">
                Order Now
              </a>
              <button className="md:hidden text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                Austin's Favorite Vegan Bakery Since 2015
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Artisan Vegan Baking <span className="text-amber-600">Made with Love</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-xl">
                Handcrafted pastries, breads, and cafe fare made with organic, locally-sourced ingredients. No compromise on taste, ever.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <a href="#menu" onClick={(e) => { e.preventDefault(); scrollToSection('menu'); }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium text-lg transition-colors text-center">
                  View Our Menu
                </a>
                <a href={`tel:${BUSINESS_PHONE.replace(/\D/g, '')}`} className="bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-lg font-medium text-lg transition-colors text-center">
                  Call for Pickup: {BUSINESS_PHONE}
                </a>
              </div>
              <div className="flex items-center space-x-4 pt-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-600 font-medium">4.9/5 (350+ reviews)</span>
              </div>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {getImageUrl('bakery-interior') ? (
                <Image
                  src={getImageUrl('bakery-interior')!}
                  alt="Sprout & Crumb Bakery Interior"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/placeholder-bakery.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-[400px] bg-gradient-to-br from-amber-100 to-green-100 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="bg-amber-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-amber-800 font-bold text-xl">S&C</span>
                    </div>
                    <p className="text-gray-600">Bakery Interior Image</p>
                    {adminMode && (
                      <p className="text-xs text-amber-600 mt-2">Upload available in admin mode</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Story</h2>
            <div className="w-24 h-1 bg-amber-400 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-gray-600">
                Founded in 2015 by Chef Maya Rodriguez, Sprout & Crumb began as a small farmers market stall with a mission: to prove that vegan baking could be just as indulgent and satisfying as traditional methods.
              </p>
              <p className="text-lg text-gray-600">
                Today, we're a beloved Austin institution, sourcing organic ingredients from local farms and crafting everything from scratch in our zero-waste kitchen. We believe food should nourish both body and soul, which is why we donate unsold goods to local shelters daily.
              </p>
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Our Promise</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✓</span>
                    <span>100% plant-based, never processed</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✓</span>
                    <span>Organic, locally-sourced ingredients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✓</span>
                    <span>Zero-waste kitchen operations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✓</span>
                    <span>Community-focused business practices</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              {getImageUrl('baking-process') ? (
                <Image
                  src={getImageUrl('baking-process')!}
                  alt="Our Baking Process"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/placeholder-baking.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-[400px] bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-green-800 font-bold text-xl">✓</span>
                    </div>
                    <p className="text-gray-600">Baking Process Image</p>
                    {adminMode && (
                      <p className="text-xs text-amber-600 mt-2">Upload available in admin mode</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-16 bg-gradient-to-br from-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Artisan Menu</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every item is crafted from scratch using organic, locally-sourced ingredients. No preservatives, no compromise.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MENU_CATEGORIES.map((category) => (
              <div key={category.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-amber-100 hover:shadow-xl transition-shadow">
                <div className="p-6 bg-gradient-to-r from-amber-50 to-white border-b border-amber-100">
                  <h3 className="text-2xl font-bold text-gray-900">{category.name}</h3>
                </div>
                <div className="divide-y divide-amber-100">
                  {category.items.map((item) => (
                    <div key={item.id} className="p-5 hover:bg-amber-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-gray-800">{item.name}</h4>
                        <span className="text-amber-600 font-bold text-lg">{item.price}</span>
                      </div>
                      <p className="text-gray-600 mb-3">{item.description}</p>
                      {adminMode && (
                        <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-700">
                          Prompt: {item.imagePrompt}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }} className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg hover:shadow-xl">
              Order Online or Call for Pickup
            </a>
            <p className="text-gray-600 mt-3 text-lg">Full menu available for catering and special events</p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Behind the Scenes</h2>
            <div className="w-24 h-1 bg-amber-400 mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mt-4">
              See where the magic happens - from our zero-waste kitchen to our warm, welcoming cafe space.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GALLERY_ARTWORKS.map((artwork) => {
              const imageUrl = getImageUrl(artwork.id);
              
              return (
                <div key={artwork.id} className="bg-gray-50 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <div className="h-64 md:h-80 relative">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={artwork.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/placeholder-gallery.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-100 to-green-100 flex items-center justify-center">
                        <div className="text-center p-6">
                          <div className="bg-amber-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-amber-800 font-bold text-xl">{artwork.title.charAt(0)}</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-1">{artwork.title}</h3>
                          <p className="text-sm text-gray-600">{artwork.prompt.substring(0, 60)}...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{artwork.title}</h3>
                    {adminMode && (
                      <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-700">
                        Prompt: {artwork.prompt}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {adminMode && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 font-medium">
                👤 Admin Mode: Gallery images can be managed through the admin panel
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Community Says</h2>
            <div className="w-24 h-1 bg-amber-400 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-6 rounded-2xl shadow-md border border-amber-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mr-3">
                    <span className="text-amber-800 font-bold text-lg">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-amber-600 text-sm">{testimonial.location}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic mb-4">"{testimonial.text}"</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {adminMode && (
                  <div className="mt-3 p-2 bg-amber-50 rounded text-xs text-amber-700">
                    Prompt: {testimonial.imagePrompt}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Visit Us or Get in Touch</h2>
                <p className="text-xl text-gray-600 max-w-xl">
                  We'd love to serve you fresh pastries and coffee in our cozy cafe, or help with catering for your next event.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Our Location</h3>
                    <p className="text-gray-600">{BUSINESS_ADDRESS}</p>
                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 font-medium mt-1 inline-block">
                      Get Directions →
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Call Us</h3>
                    <p className="text-gray-600">{BUSINESS_PHONE}</p>
                    <p className="text-gray-500 text-sm">Mon-Fri: 8am-5pm</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Email Us</h3>
                    <p className="text-gray-600">{BUSINESS_EMAIL}</p>
                    <p className="text-gray-500 text-sm">Response within 24 hours</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                <h3 className="font-bold text-lg text-gray-800 mb-3">Business Hours</h3>
                <div className="space-y-2">
                  {BUSINESS_HOURS.map((hour) => (
                    <div key={hour.day} className="flex justify-between">
                      <span className="font-medium">{hour.day}</span>
                      <span className="text-gray-600">{hour.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-2xl shadow-sm border border-amber-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors"
                    placeholder="John Smith"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors"
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors resize-none"
                    placeholder="I'd like to inquire about catering for my wedding..."
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 ${
                    formStatus === 'submitting' ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {formStatus === 'submitting' ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Message...
                    </span>
                  ) : formStatus === 'success' ? (
                    'Message Sent Successfully!'
                  ) : (
                    'Send Message'
                  )}
                </button>
                
                {formStatus === 'error' && (
                  <p className="text-red-500 text-sm mt-2">
                    There was an error sending your message. Please try again or call us directly.
                  </p>
                )}
                
                {formStatus === 'success' && (
                  <p className="text-green-600 text-sm mt-2">
                    Thank you! We'll respond to your message within 24 hours.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-amber-100 p-1.5 rounded-full">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S&C</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold">{BUSINESS_NAME}</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                {BUSINESS_DESCRIPTION} Join our community of conscious eaters and experience baking that's good for you and the planet.
              </p>
              <div className="flex space-x-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-gray-400">(350+ reviews)</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('menu')} className="text-gray-400 hover:text-white transition-colors">Our Menu</button></li>
                <li><button onClick={() => scrollToSection('gallery')} className="text-gray-400 hover:text-white transition-colors">Gallery</button></li>
                <li><button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-white transition-colors">Our Story</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="text-gray-400 hover:text-white transition-colors">Contact Us</button></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Catering Services</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Contact Info</h4>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-400">{BUSINESS_ADDRESS}</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-400">{BUSINESS_PHONE}</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-400">{BUSINESS_EMAIL}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved. Crafted with love in Austin, TX.</p>
            <p className="mt-2">
              <span className="bg-amber-900/30 px-2 py-1 rounded">100% Vegan</span> • <span className="bg-green-900/30 px-2 py-1 rounded">Organic Ingredients</span> • <span className="bg-blue-900/30 px-2 py-1 rounded">Zero Waste Certified</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Mode Notification */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          👤 Admin Mode Active — Manage gallery images and content
        </div>
      )}

      {/* Mobile Navigation (simplified for mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around py-3">
          <button onClick={() => scrollToSection('menu')} className="flex flex-col items-center text-gray-600 hover:text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-xs mt-1">Menu</span>
          </button>
          <button onClick={() => scrollToSection('gallery')} className="flex flex-col items-center text-gray-600 hover:text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs mt-1">Gallery</span>
          </button>
          <button onClick={() => scrollToSection('contact')} className="flex flex-col items-center text-gray-600 hover:text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-xs mt-1">Contact</span>
          </button>
          <a href={`tel:${BUSINESS_PHONE.replace(/\D/g, '')}`} className="flex flex-col items-center bg-amber-600 text-white rounded-full w-14 h-14 -mt-7 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-xs mt-1">Call</span>
          </a>
        </div>
      </div>
    </div>
  );
}