'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

const BAKERY_IMAGES = [
  { 
    id: 'hero-bakery-front', 
    title: 'Bakery Exterior',
    prompt: 'A charming storefront of a vegan bakery called "PureRoot" with large glass windows showing warm interior lighting, wooden signage with green leaf accents, and a few customers entering. Early morning golden hour lighting with soft shadows, cobblestone street outside, potted plants flanking the entrance. Photorealistic, inviting atmosphere.'
  },
  { 
    id: 'fresh-bread-display', 
    title: 'Fresh Bread Display',
    prompt: 'An artisanal display of freshly baked vegan breads in a rustic wooden bakery case - sourdough loaves with perfect crust, seeded rye, whole grain boules, and baguettes. Soft natural lighting from above, shallow depth of field to show texture details, warm golden tones, visible steam rising slightly. Professional food photography style.'
  },
  { 
    id: 'vegan-pastries', 
    title: 'Vegan Pastries',
    prompt: 'A beautifully arranged assortment of vegan pastries on a marble counter - croissants with flaky layers, chocolate chip cookies with gooey centers, cinnamon rolls with thick icing, and fruit tarts with vibrant berries. Soft morning light streaming through a window, shallow depth of field, warm cozy atmosphere, crumbs visible for authenticity. Food magazine quality photography.'
  },
  { 
    id: 'coffee-bar', 
    title: 'Coffee Bar',
    prompt: 'A minimalist yet warm coffee bar area in a vegan bakery with baristas preparing oat milk lattes. Exposed brick wall behind, copper espresso machine gleaming, hanging pendant lights, customers chatting at nearby tables. Natural daylight, candid moment captured, authentic cafe atmosphere with steam rising from cups. Documentary-style photography.'
  },
  { 
    id: 'dining-area', 
    title: 'Cozy Dining Area',
    prompt: 'A cozy dining area inside a vegan bakery with wooden tables, mismatched chairs, hanging plants, and customers enjoying brunch. Large windows showing outdoor greenery, soft natural light, steam rising from coffee cups, people laughing and eating. Warm, inviting atmosphere with shallow depth of field to focus on human connection. Lifestyle photography style.'
  },
  { 
    id: 'bakery-case', 
    title: 'Full Bakery Case',
    prompt: 'A full glass bakery case displaying an abundant variety of vegan baked goods - cakes with fresh flowers, pies with lattice crusts, muffins with streusel topping, danishes with fruit filling. Professional lighting highlighting textures and colors, reflection in glass showing customers browsing, warm inviting glow. Commercial food photography with perfect composition.'
  },
];

type BakeryImageState = { [key: string]: { image_url: string | null } };

function GallerySkeleton() {
  const [images, setImages] = useState<BakeryImageState>({});
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
      const initialState: BakeryImageState = {};
      BAKERY_IMAGES.forEach(img => initialState[img.id] = { image_url: null });

      // Only admin can see the prompts and upload controls
      if (!adminMode) {
        setImages(initialState);
        return;
      }

      const { data: existingImages, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        setImages(initialState);
        return;
      }

      const latestImagePerArtwork: Record<string, string> = {};

      if (existingImages) {
        for (const img of existingImages) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            if (BAKERY_IMAGES.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        BAKERY_IMAGES.forEach(img => {
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
  }, [adminMode]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(imageId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${imageId}/`;

      // Clean up old images for this artwork
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

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Bakery Gallery</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Step inside PureRoot Bakery and see why our community loves our warm, welcoming space and delicious vegan creations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BAKERY_IMAGES.map((img) => {
          const imageData = images[img.id] || { image_url: null };
          const imageUrl = imageData.image_url;

          return (
            <div key={img.id} className="bg-white rounded-lg overflow-hidden shadow-md">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={img.title} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMzIwIDI0MCI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNmM2YzZjMiLz48dGV4dCB4PSIxNjAiIHk9IjEyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZGRkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QbGFjZWhvbGRlcjwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center p-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-gray-500 text-2xl">🍞</span>
                      </div>
                      <p className="text-gray-500 text-sm font-medium">{img.title}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{img.title}</h3>
                
                {adminMode && (
                  <div className="mt-2 space-y-2">
                    {!imageUrl && (
                      <div className="space-y-1">
                        <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                          {img.prompt}
                        </p>
                        <button
                          onClick={() => copyPrompt(img.prompt, img.id)}
                          className={`text-xs px-2 py-1 rounded ${
                            copiedId === img.id 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          type="button"
                        >
                          {copiedId === img.id ? 'Copied!' : 'Copy Prompt'}
                        </button>
                      </div>
                    )}
                    <label className="block">
                      <span className={`text-xs font-medium px-3 py-1 rounded cursor-pointer inline-block w-full text-center ${
                        uploading === img.id
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}>
                        {uploading === img.id ? 'Uploading…' : imageUrl ? 'Replace Image' : 'Upload Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, img.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {adminMode && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center text-sm text-green-700">
          👤 Admin Mode: Upload images for each gallery section using the prompts provided. Images will appear instantly after upload.
        </div>
      )}
    </div>
  );
}

export default function PureRootBakeryPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Track active section for navigation
      const sections = ['hero', 'about', 'menu', 'gallery', 'testimonials', 'contact'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.6 && rect.bottom >= window.innerHeight * 0.4) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 80; // Height of the fixed navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      closeMenu();
    }
  };

  const handleOrderOnline = () => {
    // In a real app, this would redirect to an ordering system
    alert('This would redirect to our online ordering system. For demo purposes, this is just an alert.');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div 
                className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl cursor-pointer"
                onClick={() => scrollToSection('hero')}
                role="button"
                aria-label="Home"
              >
                P<span className="text-xs">R</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-800 hidden md:inline">PureRoot</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('about')}
                className={`font-medium transition-colors ${
                  activeSection === 'about' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('menu')}
                className={`font-medium transition-colors ${
                  activeSection === 'menu' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Menu
              </button>
              <button 
                onClick={() => scrollToSection('gallery')}
                className={`font-medium transition-colors ${
                  activeSection === 'gallery' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Gallery
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className={`font-medium transition-colors ${
                  activeSection === 'testimonials' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Reviews
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className={`font-medium transition-colors ${
                  activeSection === 'contact' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Visit Us
              </button>
              <button 
                onClick={handleOrderOnline}
                className="bg-green-600 text-white px-4 py-2 rounded-full font-medium hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
              >
                Order Online
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMenu}
                className="p-2 text-gray-700 hover:text-green-600 focus:outline-none"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-40 pt-24 pb-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="space-y-6">
                <button 
                  onClick={() => scrollToSection('about')}
                  className={`block w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${
                    activeSection === 'about' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  About PureRoot
                </button>
                <button 
                  onClick={() => scrollToSection('menu')}
                  className={`block w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${
                    activeSection === 'menu' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Our Menu
                </button>
                <button 
                  onClick={() => scrollToSection('gallery')}
                  className={`block w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${
                    activeSection === 'gallery' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Bakery Gallery
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className={`block w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${
                    activeSection === 'testimonials' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Customer Reviews
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className={`block w-full text-left py-3 px-4 rounded-lg font-medium transition-colors ${
                    activeSection === 'contact' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Visit Us
                </button>
                <button 
                  onClick={handleOrderOnline}
                  className="block w-full text-center bg-green-600 text-white py-3 px-4 rounded-lg font-medium mt-4 hover:bg-green-700 transition-colors"
                >
                  Order Online Now
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-32 pb-20 md:pb-28 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0icmdiYSgyMjAsIDI0MCwgMjI1LCAwLjUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')] opacity-30"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium mb-6">
              🌱 100% Plant-Based • Locally Sourced • Community Focused
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Artisan Vegan Bakes Made with Love
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Handcrafted vegan pastries, breads, and cakes made fresh daily in Boulder, Colorado. Where sustainability meets exceptional flavor.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={handleOrderOnline}
                className="bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Order Online →
              </button>
              <button 
                onClick={() => scrollToSection('gallery')}
                className="bg-white text-green-600 px-8 py-4 rounded-full font-bold text-lg border-2 border-green-600 hover:bg-green-50 transition-colors shadow-md"
              >
                View Our Bakery
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-50 to-transparent"></div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                Our Story
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                From Home Kitchen to Community Hub
              </h2>
              <p className="text-gray-600 mb-6">
                Founded in 2021 by Chef Maya Rodriguez, PureRoot Bakery began as a passion project in her home kitchen. What started as weekend farmers' market stalls quickly grew into a beloved community gathering place.
              </p>
              <p className="text-gray-600 mb-8">
                Today, our 2,000 sq ft bakery in downtown Boulder serves hundreds of customers daily, all while maintaining our commitment to sustainable practices, fair trade ingredients, and giving back to local food banks.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">3K+</div>
                  <div className="text-gray-600 text-sm">Daily Customers</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">98%</div>
                  <div className="text-gray-600 text-sm">Customer Satisfaction</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">4.9★</div>
                  <div className="text-gray-600 text-sm">Google Rating</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">12+</div>
                  <div className="text-gray-600 text-sm">Awards Won</div>
                </div>
              </div>
              <button 
                onClick={() => scrollToSection('contact')}
                className="bg-green-600 text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors inline-flex items-center"
              >
                Visit Our Bakery <span className="ml-2">→</span>
              </button>
            </div>
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-xl overflow-hidden shadow-2xl">
                {/* Placeholder for hero image - will be replaced by gallery system */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">🍞</span>
                    </div>
                    <p className="text-gray-600 font-medium">PureRoot Bakery Interior</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-lg max-w-xs hidden md:block">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-xl">M</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Maya Rodriguez</p>
                    <p className="text-sm text-green-600">Head Baker & Founder</p>
                    <p className="mt-2 text-gray-600 text-sm italic">
                      "Every loaf tells a story of sustainability and community."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium mb-4">
              Our Signature Items
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Handcrafted Vegan Delights
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything we make is 100% plant-based, using locally sourced organic ingredients whenever possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Menu Item 1 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🥐</span>
                    </div>
                    <p className="text-gray-600">Artisan Croissants</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Buttery Croissants</h3>
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">$4.50</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Flaky, buttery croissants made with coconut oil and organic flour. Available plain, chocolate, or almond.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Vegan</span>
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">Organic</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Local Grain</span>
                </div>
              </div>
            </div>

            {/* Menu Item 2 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-rose-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🎂</span>
                    </div>
                    <p className="text-gray-600">Celebration Cakes</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Custom Celebration Cakes</h3>
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">$45+</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Made-to-order cakes for birthdays, weddings, and special occasions. Gluten-free and nut-free options available.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Custom Orders</span>
                  <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">Gluten-Free</span>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">Nut-Free Option</span>
                </div>
              </div>
            </div>

            {/* Menu Item 3 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-teal-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">☕</span>
                    </div>
                    <p className="text-gray-600">Specialty Coffee</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Organic Coffee & Teas</h3>
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">$3.75</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Fair trade coffee roasted locally in Boulder, served with oat, almond, or soy milk. Organic loose-leaf teas available.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">Fair Trade</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Local Roaster</span>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Plant Milk</span>
                </div>
              </div>
            </div>

            {/* Menu Item 4 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-cyan-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🍞</span>
                    </div>
                    <p className="text-gray-600">Artisan Breads</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Sourdough Bread</h3>
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">$8.00</span>
                </div>
                <p className="text-gray-600 mb-4">
                  48-hour fermented sourdough made with organic Colorado wheat. Available in whole loaf or half loaf, with or without seeds.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">Slow Fermented</span>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Organic</span>
                  <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded">Colorado Grain</span>
                </div>
              </div>
            </div>

            {/* Menu Item 5 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🍪</span>
                    </div>
                    <p className="text-gray-600">Fresh Cookies</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Gourmet Cookies</h3>
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">$3.25</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Freshly baked daily with premium chocolate chips, nuts, and seasonal fruits. Try our famous double chocolate chunk!
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-brown-50 text-brown-700 px-2 py-1 rounded">Handcrafted</span>
                  <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">Seasonal</span>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Vegan Chocolate</span>
                </div>
              </div>
            </div>

            {/* Menu Item 6 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-pink-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🥗</span>
                    </div>
                    <p className="text-gray-600">Brunch Bowls</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Savory Brunch Bowls</h3>
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">$12.50</span>
                </div>
                <p className="text-gray-600 mb-4">
                  Hearty grain bowls with organic tofu scramble, seasonal vegetables, and house-made sauces. Served until 2 PM daily.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">High Protein</span>
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">Seasonal Veg</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Organic Tofu</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <button 
              onClick={handleOrderOnline}
              className="bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl inline-flex items-center"
            >
              View Full Menu & Order Online <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Gallery Section - Using the GallerySkeleton component */}
      <section id="gallery" className="py-20 bg-white">
        <GallerySkeleton />
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium mb-4">
              What Our Community Says
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Boulder Locals
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it - hear from the community members who make PureRoot their daily ritual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-8 rounded-xl shadow-md border border-green-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-700 font-bold text-xl">SR</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Sarah Mitchell</p>
                  <p className="text-green-600 text-sm">Boulder Resident • 3 years</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 italic">
                "I've tried vegan bakeries all over the country, and PureRoot is hands down the best. Their sourdough changed my life - I didn't know vegan bread could have this much flavor and texture!"
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-8 rounded-xl shadow-md border border-green-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-700 font-bold text-xl">JM</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">James Wilson</p>
                  <p className="text-green-600 text-sm">Small Business Owner • 2 years</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 italic">
                "As a business owner myself, I appreciate PureRoot's commitment to the community. They catered our company event and everyone was blown away - even our non-vegan colleagues couldn't believe everything was plant-based!"
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-8 rounded-xl shadow-md border border-green-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-700 font-bold text-xl">LT</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Lisa Thompson</p>
                  <p className="text-green-600 text-sm">Yoga Instructor • 4 years</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 italic">
                "I start every morning with their oat milk latte and a fresh croissant. The space is so welcoming - perfect for my students to meet after class. Maya and her team remember everyone's names and orders. That's the PureRoot magic!"
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="text-5xl font-bold text-green-600 mb-2">4.9</div>
            <div className="flex justify-center text-yellow-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-600 max-w-md mx-auto">
              Based on 1,250+ reviews across Google, Yelp, and social media
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                Visit Us
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Come Experience PureRoot
              </h2>
              <p className="text-gray-600 mb-8">
                We'd love to welcome you to our bakery in the heart of Boulder. Whether you're grabbing a quick coffee or staying for a leisurely brunch, our space is designed for comfort and connection.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">123 Pearl Street</p>
                    <p className="text-gray-600">Boulder, CO 80302</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">(303) 555-7890</p>
                    <p className="text-gray-600">Call or text for orders</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Hours</p>
                    <p className="text-gray-600">Mon-Fri: 7am-6pm • Sat-Sun: 8am-5pm</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => window.open('https://maps.google.com/?q=123+Pearl+Street+Boulder+CO+80302', '_blank')}
                  className="bg-green-600 text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Get Directions
                </button>
                <button 
                  onClick={handleOrderOnline}
                  className="bg-white text-green-600 px-6 py-3 rounded-full font-medium border-2 border-green-600 hover:bg-green-50 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Order Pickup
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-xl overflow-hidden shadow-2xl">
                {/* Placeholder for map - in real app would use Google Maps or similar */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">📍</span>
                    </div>
                    <p className="text-gray-600 font-medium">Boulder, Colorado</p>
                    <p className="text-sm text-gray-500 mt-2">Interactive map would appear here</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-lg shadow-lg max-w-xs hidden md:block">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-700 font-bold text-lg">P</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">PureRoot Bakery</p>
                    <p className="text-sm text-green-600">123 Pearl Street</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  P<span className="text-xs">R</span>
                </div>
                <span className="ml-2 text-xl font-bold">PureRoot Bakery</span>
              </div>
              <p className="text-gray-400 mb-4">
                Artisan vegan bakery serving Boulder, Colorado since 2021. We believe in sustainable practices, community connection, and exceptional flavor in every bite.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 rounded-full bg-green-700 hover:bg-green-600 transition-colors flex items-center justify-center">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full bg-green-700 hover:bg-green-600 transition-colors flex items-center justify-center">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.023.047 1.351.058 3.807.058h.468c2.456 0 2.784-.011 3.807-.058.975-.045 1.504-.207 1.857-.344.467-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.047-1.023.058-1.351.058-3.807v-.468c0-2.456-.011-2.784-.058-3.807-.045-.975-.207-1.504-.344-1.857-.182-.466-.399-.8-.748-1.15-.35-.35-.683-.566-1.15-.748-.353-.137-.882-.3-1.857-.344-1.054-.048-1.37-.058-4.043-.058zM12 18a6 6 0 100-12 6 6 0 000 12zm0-2a4 4 0 110-8 4 4 0 010 8z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full bg-green-700 hover:bg-green-600 transition-colors flex items-center justify-center">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => scrollToSection('menu')} className="text-gray-400 hover:text-white transition-colors">Our Menu</button></li>
                <li><button onClick={() => scrollToSection('gallery')} className="text-gray-400 hover:text-white transition-colors">Gallery</button></li>
                <li><button onClick={() => scrollToSection('testimonials')} className="text-gray-400 hover:text-white transition-colors">Reviews</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="text-gray-400 hover:text-white transition-colors">Visit Us</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Hours</h3>
              <ul className="space-y-1 text-gray-400">
                <li>Monday-Friday: 7am-6pm</li>
                <li>Saturday: 8am-5pm</li>
                <li>Sunday: 8am-5pm</li>
                <li className="mt-4">Closed on major holidays</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} PureRoot Bakery. All rights reserved. Made with ❤️ in Boulder, Colorado.</p>
            <p className="mt-2">100% Plant-Based • Locally Sourced • Community Focused</p>
          </div>
        </div>
      </footer>
    </div>
  );
}