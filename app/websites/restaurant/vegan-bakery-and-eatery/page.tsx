// app/blissful-bites-vegan-bakery/page.tsx
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

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Menu items data
const MENU_ITEMS = [
  {
    id: 'croissant',
    name: 'Almond Croissant',
    description: 'Flaky pastry filled with almond cream and topped with sliced almonds',
    price: '$5.50',
    dietary: ['Vegan', 'Dairy-Free'],
    imagePlaceholder: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'muffin',
    name: 'Blueberry Oat Muffin',
    description: 'Hearty oat muffin bursting with fresh blueberries and a hint of lemon',
    price: '$4.25',
    dietary: ['Vegan', 'Gluten-Free Option'],
    imagePlaceholder: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'donut',
    name: 'Maple Bacon Donut',
    description: 'Decadent maple glaze with coconut bacon crumbles on a fluffy yeast donut',
    price: '$4.75',
    dietary: ['Vegan', 'Soy-Free'],
    imagePlaceholder: 'https://images.unsplash.com/photo-1606312619070-2d9c96838a10?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'cake',
    name: 'Chocolate Fudge Cake',
    description: 'Rich chocolate cake with fudge frosting and fresh raspberry compote',
    price: '$7.50 per slice',
    dietary: ['Vegan', 'Dairy-Free', 'Egg-Free'],
    imagePlaceholder: 'https://images.unsplash.com/photo-1578752328261-9b56c9f7b8d6?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'bread',
    name: 'Sourdough Artisan Bread',
    description: 'Slow-fermented sourdough with a crisp crust and tender crumb',
    price: '$8.00 per loaf',
    dietary: ['Vegan', 'Naturally Leavened'],
    imagePlaceholder: 'https://images.unsplash.com/photo-1546035165-6f54a9f367a8?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'tart',
    name: 'Lemon Lavender Tart',
    description: 'Zesty lemon curd in a shortbread crust with a hint of lavender',
    price: '$6.25',
    dietary: ['Vegan', 'Gluten-Free'],
    imagePlaceholder: 'https://images.unsplash.com/photo-1565958011705-4c96c38d9a8d?auto=format&fit=crop&w=800&q=80'
  }
];

// Testimonials
const TESTIMONIALS = [
  {
    id: '1',
    text: "Blissful Bites completely changed my perspective on vegan baking. Their croissants are better than any traditional bakery I've tried!",
    author: "Maya Rodriguez",
    location: "Austin, TX"
  },
  {
    id: '2',
    text: "As someone with multiple food allergies, finding a bakery that caters to my needs without sacrificing flavor has been life-changing. Their staff is incredibly knowledgeable and caring.",
    author: "James Wilson",
    location: "Round Rock, TX"
  },
  {
    id: '3',
    text: "I host weekly team meetings at Blissful Bites. The coffee is exceptional, the pastries are always fresh, and the cozy atmosphere makes everyone feel welcome.",
    author: "Sarah Thompson",
    location: "Austin, TX"
  }
];

// Hours data
const HOURS = [
  { day: 'Monday', hours: '7:00 AM - 6:00 PM' },
  { day: 'Tuesday', hours: '7:00 AM - 6:00 PM' },
  { day: 'Wednesday', hours: '7:00 AM - 6:00 PM' },
  { day: 'Thursday', hours: '7:00 AM - 6:00 PM' },
  { day: 'Friday', hours: '7:00 AM - 8:00 PM' },
  { day: 'Saturday', hours: '8:00 AM - 8:00 PM' },
  { day: 'Sunday', hours: '8:00 AM - 4:00 PM' }
];

// Gallery artwork definitions (matching the format from GallerySkeleton)
const ARTWORKS = [
  { 
    id: 'bakery-interior', 
    title: 'Bakery Interior',
    prompt: 'A warm, inviting vegan bakery interior with rustic wooden tables, hanging plants, natural light streaming through large windows, and artisan breads displayed on wooden shelves. The atmosphere should feel cozy and welcoming with soft, earthy tones and customers enjoying coffee and pastries.'
  },
  { 
    id: 'pastry-display', 
    title: 'Pastry Display',
    prompt: 'A beautifully arranged glass pastry display case filled with an assortment of vegan pastries - croissants, muffins, donuts, and tarts. The lighting should highlight the textures and colors of the baked goods, with a focus on the golden crusts and vibrant fillings. The background should be slightly blurred to emphasize the pastries.'
  },
  { 
    id: 'baking-process', 
    title: 'Baking Process',
    prompt: 'A close-up shot of hands kneading artisan sourdough bread dough on a floured wooden surface. The scene should capture the tactile, handmade quality with flour dust in the air and warm, natural lighting. Include subtle details like a vintage rolling pin and ceramic mixing bowls in the background to convey craftsmanship.'
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };

// Gallery component integrated directly for better performance
function GallerySection() {
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
    <section id="gallery" className="py-16 bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Artisan Craft
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Every Blissful Bites creation starts with locally-sourced, organic ingredients and ends with a smile on your face.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ARTWORKS.map((art) => {
            const artworkData = artworks[art.id] || { image_url: null };
            const imageUrl = artworkData.image_url;

            return (
              <div key={art.id} className="bg-white rounded-xl shadow-lg overflow-hidden group relative">
                {imageUrl ? (
                  <div className="relative h-64 md:h-72">
                    <Image 
                      src={imageUrl} 
                      alt={art.title} 
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      priority={art.id === 'bakery-interior'}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = art.id === 'bakery-interior' ? 
                          'https://images.unsplash.com/photo-1517994883898-65c4a2c9f383?auto=format&fit=crop&w=800&q=80' : 
                          art.id === 'pastry-display' ? 
                          'https://images.unsplash.com/photo-1514432322651-6c30d8f3164d?auto=format&fit=crop&w=800&q=80' : 
                          'https://images.unsplash.com/photo-1578752328261-9b56c9f7b8d6?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-64 md:h-72 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                        <span className="text-amber-700 font-bold text-xl">+</span>
                      </div>
                      <p className="text-gray-500 font-medium">{art.title}</p>
                      <p className="text-xs text-gray-400 mt-1">Image will appear once uploaded</p>
                    </div>
                  </div>
                )}

                {adminMode && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white p-4 rounded-lg shadow-xl w-4/5 max-w-xs">
                      <p className="text-xs text-amber-700 font-medium mb-2">{art.prompt}</p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => copyPrompt(art.prompt, art.id)}
                          className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded transition-colors"
                          type="button"
                        >
                          {copiedId === art.id ? 'Copied!' : 'Copy Prompt'}
                        </button>
                        <label className="block text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded cursor-pointer text-center transition-colors">
                          {uploading === art.id ? 'Uploading…' : 'Upload Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, art.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{art.title}</h3>
                  <p className="text-gray-600">
                    {art.id === 'bakery-interior' && 'Step into our warm, welcoming space where community and craft meet.'}
                    {art.id === 'pastry-display' && 'Our daily selection of handcrafted vegan pastries, always fresh.'}
                    {art.id === 'baking-process' && 'Where traditional techniques meet modern compassion.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {adminMode && (
          <div className="mt-8 p-4 bg-amber-100 border border-amber-300 rounded-lg text-sm text-amber-800">
            👤 Admin mode active — you can upload images and copy detailed prompts by hovering over gallery items.
          </div>
        )}
      </div>
    </section>
  );
}

export default function BlissfulBitesPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Intersection Observer for scroll effects
  useEffect(() => {
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.2 }
    );

    sections.forEach(section => {
      if (section.id) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scroll handler
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  // Handle order button click
  const handleOrderClick = () => {
    setShowOrderModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed w-full bg-white/90 backdrop-blur-md z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-amber-100 p-2 rounded-lg">
                <span className="text-2xl font-bold text-amber-800">🍪</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Blissful Bites</h1>
                <p className="text-xs text-amber-600 font-medium">Vegan Bakery & Eatery</p>
              </div>
            </Link>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Desktop navigation */}
            <nav className="hidden md:block">
              <ul className="flex space-x-8">
                <li>
                  <button 
                    onClick={() => scrollToSection('home')}
                    className={`text-sm font-medium transition-colors ${activeSection === 'home' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('menu')}
                    className={`text-sm font-medium transition-colors ${activeSection === 'menu' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
                  >
                    Our Menu
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('story')}
                    className={`text-sm font-medium transition-colors ${activeSection === 'story' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
                  >
                    Our Story
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('gallery')}
                    className={`text-sm font-medium transition-colors ${activeSection === 'gallery' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
                  >
                    Gallery
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('contact')}
                    className={`text-sm font-medium transition-colors ${activeSection === 'contact' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
                  >
                    Visit Us
                  </button>
                </li>
              </ul>
            </nav>

            <button 
              onClick={handleOrderClick}
              className="hidden md:block bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-md hover:shadow-lg"
            >
              Order Online
            </button>
          </div>

          {/* Mobile navigation */}
          {isMenuOpen && (
            <div className="md:hidden pb-4">
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => scrollToSection('home')}
                    className="block w-full text-left py-2 text-gray-700 hover:text-amber-600 font-medium"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('menu')}
                    className="block w-full text-left py-2 text-gray-700 hover:text-amber-600 font-medium"
                  >
                    Our Menu
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('story')}
                    className="block w-full text-left py-2 text-gray-700 hover:text-amber-600 font-medium"
                  >
                    Our Story
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('gallery')}
                    className="block w-full text-left py-2 text-gray-700 hover:text-amber-600 font-medium"
                  >
                    Gallery
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('contact')}
                    className="block w-full text-left py-2 text-gray-700 hover:text-amber-600 font-medium"
                  >
                    Visit Us
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleOrderClick}
                    className="block w-full text-center bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-medium mt-2"
                  >
                    Order Online
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 md:pt-40 md:pb-32 bg-gradient-to-br from-amber-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDQ1KSI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-50"></div>
          <div className="absolute top-1/4 right-0 w-64 h-64 bg-amber-200 rounded-full -z-10 opacity-20 blur-3xl"></div>
          <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-amber-300 rounded-full -z-10 opacity-20 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-12 md:mb-0">
              <div className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                Artisan Vegan Bakery in Austin, TX
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Artisan Vegan Pastries <span className="text-amber-600">Made with Love</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-xl">
                Handcrafted vegan pastries using locally-sourced, organic ingredients. From flaky croissants to decadent cakes, we prove that compassionate baking never sacrifices flavor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleOrderClick}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Order Online →
                </button>
                <button 
                  onClick={() => scrollToSection('menu')}
                  className="bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-full font-medium transition-colors"
                >
                  View Our Menu
                </button>
              </div>
              <div className="mt-12 flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center">
                      <span className="font-medium text-amber-800">{['J', 'M', 'S', 'L'][i]}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-medium text-gray-900">4.9/5 from 150+ happy customers</p>
                  <p className="text-sm text-gray-500">★★★★★ Verified reviews</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative w-full max-w-lg mx-auto">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-200 to-amber-300 rounded-3xl blur-xl opacity-30 animate-blob"></div>
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100">
                  <div className="p-6 bg-gradient-to-br from-amber-50 to-white">
                    <div className="grid grid-cols-2 gap-4">
                      {[1,2,3,4].map((item, index) => (
                        <div key={index} className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl p-4 border border-amber-200">
                          <div className="w-12 h-12 bg-amber-200 rounded-lg mb-2 flex items-center justify-center mx-auto">
                            <span className="text-2xl">{['🥐', '🍰', '☕', '🍞'][index]}</span>
                          </div>
                          <p className="text-center font-medium text-gray-800 mt-1">
                            {['Fresh Daily', '100% Vegan', 'Organic', 'Local'][index]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 border-t border-amber-100 bg-white">
                    <div className="aspect-[4/3] relative rounded-lg overflow-hidden">
                      <Image
                        src="https://images.unsplash.com/photo-1606312619070-2d9c96838a10?auto=format&fit=crop&w=800&q=80"
                        alt="Fresh vegan croissants and pastries"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-xl shadow-lg border border-amber-100 max-w-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-bold text-lg">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Fresh daily</p>
                      <p className="text-sm text-gray-500">Baked at 4 AM daily</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-100">
                <div className="aspect-[3/4] relative">
                  <Image
                    src="https://images.unsplash.com/photo-1517994883898-65c4a2c9f383?auto=format&fit=crop&w=800&q=80"
                    alt="Blissful Bites bakery interior"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="bg-amber-600 px-3 py-1 rounded-full inline-block mb-2">
                    <span className="font-medium">Est. 2018</span>
                  </div>
                  <p className="text-lg font-bold">Where every bite tells a story</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg border border-amber-100 max-w-xs">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-amber-800 font-bold">1</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">100+ 5-star reviews</p>
                    <p className="text-sm text-gray-500">on Google & Yelp</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                Our Journey
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                From Home Kitchen to <span className="text-amber-600">Community Hub</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                In 2018, founder Emma Chen started baking vegan treats in her Austin apartment kitchen to share with friends who had dietary restrictions. What began as a passion project quickly grew into something more when neighbors began knocking on her door, asking to buy her famous almond croissants.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Today, Blissful Bites is a beloved community staple in East Austin, where we craft over 50 different vegan pastries daily using traditional French techniques and locally-sourced Texas ingredients. Our mission remains simple: prove that compassionate baking can be both delicious and accessible.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <div className="font-bold text-amber-800 mb-1">🌱 100% Plant-Based</div>
                  <p className="text-gray-600 text-sm">No dairy, eggs, or honey - ever</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <div className="font-bold text-amber-800 mb-1">📍 Local Ingredients</div>
                  <p className="text-gray-600 text-sm">Sourced within 50 miles of Austin</p>
                </div>
              </div>
              <button 
                onClick={() => scrollToSection('contact')}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-full font-medium transition-colors inline-flex items-center space-x-2"
              >
                <span>Visit Our Bakery</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-20 bg-gradient-to-b from-white to-amber-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              Our Artisan Menu
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Handcrafted <span className="text-amber-600">Vegan Delights</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every item is made from scratch daily using organic, locally-sourced ingredients. No preservatives, no artificial flavors—just honest baking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {MENU_ITEMS.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-amber-100 hover:shadow-xl transition-shadow duration-300 group cursor-pointer"
                onClick={() => setShowOrderModal(true)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.imagePlaceholder}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-amber-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                      {item.price}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                      {item.name}
                    </h3>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                      Popular
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.dietary.map((tag, index) => (
                      <span 
                        key={index} 
                        className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button 
              onClick={handleOrderClick}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center space-x-2"
            >
              <span>Order Your Favorites Online</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
            <p className="text-gray-500 mt-4 text-sm">
              Free delivery on orders over $35 within 5 miles | Pickup available
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section - Integrated directly for better performance */}
      <GallerySection />

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              Happy Customers
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our <span className="text-amber-600">Community Says</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it—here's what our customers have to say about their Blissful Bites experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <div 
                key={testimonial.id} 
                className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center mr-4">
                    <span className="text-amber-800 font-bold text-xl">
                      {testimonial.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex text-amber-400 mb-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                    <p className="font-medium text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic relative pl-4">
                  <span className="absolute left-0 top-1 text-amber-400 text-xl">"</span>
                  {testimonial.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button className="text-amber-600 hover:text-amber-700 font-medium flex items-center mx-auto space-x-2">
              <span>Read more reviews on Google</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-amber-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                Visit Us
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Find Our <span className="text-amber-600">Sweet Spot</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We're located in the heart of East Austin, just a short walk from Lady Bird Lake. Come experience our warm atmosphere and freshly-baked treats.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="mt-1 w-5 h-5 text-amber-600">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">123 Bakery Lane</p>
                    <p className="text-gray-600">Austin, TX 78702</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="mt-1 w-5 h-5 text-amber-600">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">(512) 555-0123</p>
                    <p className="text-gray-600">Call for catering inquiries</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="mt-1 w-5 h-5 text-amber-600">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Business Hours</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {HOURS.map((hour, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{hour.day}</span>
                          <span className="text-gray-600 ml-1">{hour.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleOrderClick}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-md hover:shadow-lg"
              >
                Order Online for Pickup
              </button>
            </div>
            <div className="md:w-1/2 relative">
              <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl p-6 border border-amber-200">
                <div className="aspect-[4/3] relative rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1517994883898-65c4a2c9f383?auto=format&fit=crop&w=800&q=80"
                    alt="Blissful Bites bakery exterior"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-bold text-xl">123 Bakery Lane, Austin</p>
                    <p className="text-amber-200 flex items-center space-x-2 mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Get Directions</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg border border-amber-100 max-w-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">i</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Parking available</p>
                    <p className="text-sm text-gray-500">Free street parking & bike racks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-amber-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Order Online</h3>
                  <p className="text-gray-500">Choose your favorite items</p>
                </div>
                <button 
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {MENU_ITEMS.slice(0,4).map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 hover:bg-amber-50 rounded-lg transition-colors">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.imagePlaceholder}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">{item.price}</p>
                      <button className="mt-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full hover:bg-amber-200 transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-center text-gray-600">
                  For full menu and catering options, visit our website or call us directly at (512) 555-0123
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-amber-100 bg-gray-50">
              <button 
                onClick={() => setShowOrderModal(false)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-full font-medium transition-colors"
              >
                View Full Menu & Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <span className="text-2xl font-bold text-amber-800">🍪</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Blissful Bites</h3>
                  <p className="text-amber-200">Vegan Bakery & Eatery</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Artisan vegan pastries crafted with love in Austin, Texas. We believe compassionate baking can change the world, one delicious bite at a time.
              </p>
              <div className="flex space-x-4">
                {[1,2,3,4].map((_, i) => (
                  <button key={i} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-amber-600 transition-colors flex items-center justify-center">
                    <span className="text-xl">{['📱', '📸', '🐦', '💼'][i]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-3">
                {['Home', 'Menu', 'Our Story', 'Gallery', 'Contact'].map((link, index) => (
                  <li key={index}>
                    <button 
                      onClick={() => scrollToSection(link.toLowerCase().replace(' ', '-'))}
                      className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>{link}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3 text-gray-400">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>123 Bakery Lane, Austin, TX 78702</span>
                </li>
                <li className="flex items-start space-x-3 text-gray-400">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>(512) 555-0123</span>
                </li>
                <li className="flex items-start space-x-3 text-gray-400">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>hello@blissfulbites.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Blissful Bites Vegan Bakery & Eatery. All rights reserved.</p>
            <p className="mt-2">A locally-owned business serving Austin since 2018</p>
          </div>
        </div>
      </footer>
    </div>
  );
}