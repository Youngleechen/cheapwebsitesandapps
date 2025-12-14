'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { 
  Menu, 
  X, 
  Instagram, 
  Facebook, 
  Mail, 
  ChevronRight,
  Sparkles,
  Palette,
  Award,
  Clock,
  CheckCircle,
  Download,
  ExternalLink,
  Heart,
  Share2,
  ArrowRight
} from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Digital Illustrator Portfolio Artworks
const PORTFOLIO_ARTWORKS = [
  { 
    id: 'celestial-dreams', 
    title: 'Celestial Dreams',
    category: 'Fantasy',
    year: '2024',
    description: 'A cosmic fantasy piece exploring the intersection of dreams and reality',
    dimensions: '4000 × 3000 px',
    prompt: 'A breathtaking celestial fantasy scene where ethereal beings made of stardust float through a nebula of swirling purples and blues. Include intricate details in their flowing garments that shimmer with tiny constellations. Background should feature distant galaxies and a large, luminous moon. Style: digital painting with soft edges and glowing effects.',
    featured: true,
    colorPalette: ['#4A00E0', '#8E2DE2', '#FF7CBC', '#F8F8FF', '#00D4FF']
  },
  { 
    id: 'urban-echoes', 
    title: 'Urban Echoes',
    category: 'Cyberpunk',
    year: '2023',
    description: 'Neon-drenched cityscape with retro-futuristic vibes',
    dimensions: '5000 × 2500 px',
    prompt: 'A rain-slicked cyberpunk alley at midnight, glowing with vibrant neon signs in Japanese and Chinese characters reflecting on wet asphalt. Include a mysterious figure in a trench coat with glowing cybernetic implants, standing under a flickering holographic advertisement. Color palette: deep purples, electric pinks, neon cyans, and shadowy blacks.',
    featured: true,
    colorPalette: ['#0F0F23', '#FF00FF', '#00FFFF', '#FFFF00', '#8B00FF']
  },
  { 
    id: 'whispering-woods', 
    title: 'Whispering Woods',
    category: 'Nature',
    year: '2024',
    description: 'Enchanted forest with bioluminescent flora and fauna',
    dimensions: '4500 × 3000 px',
    prompt: 'An enchanted forest at twilight where all plants and creatures emit a soft bioluminescent glow. Giant glowing mushrooms, trees with pulsing energy veins, and mystical floating creatures with translucent wings. Include a hidden crystal-clear pond reflecting the magical lights. Style: highly detailed digital painting with focus on light and atmosphere.',
    featured: true,
    colorPalette: ['#003300', '#00CC66', '#66FF99', '#CCFF00', '#9900FF']
  },
  { 
    id: 'mechanical-heart', 
    title: 'Mechanical Heart',
    category: 'Steampunk',
    year: '2023',
    description: 'Intricate steampunk mechanical design with warm brass tones',
    dimensions: '3500 × 3500 px',
    prompt: 'A beautifully intricate steampunk heart mechanism with visible gears, pistons, and brass pipes pumping golden liquid. Warm lighting from internal furnace, lots of copper and brass reflections, delicate clockwork details. Victorian aesthetic with visible wear and tear for authenticity. Include delicate steam wisps escaping from valves.',
    featured: false,
    colorPalette: ['#B8860B', '#CD7F32', '#DAA520', '#8B4513', '#FFD700']
  },
  { 
    id: 'ocean-memories', 
    title: 'Ocean Memories',
    category: 'Abstract',
    year: '2024',
    description: 'Emotive abstract interpretation of ocean waves and memories',
    dimensions: '6000 × 4000 px',
    prompt: 'Abstract digital painting of ocean waves rendered as flowing layers of translucent memories. Blues, teals, and seafoam greens blending into each other with hints of gold and silver representing fleeting thoughts. Texture should feel both liquid and ethereal, with semi-visible faces and shapes emerging from the waves.',
    featured: false,
    colorPalette: ['#00008B', '#00BFFF', '#40E0D0', '#F0E68C', '#4682B4']
  },
  { 
    id: 'digital-dynasty', 
    title: 'Digital Dynasty',
    category: 'Character Design',
    year: '2024',
    description: 'Futuristic royal character in a digital realm',
    dimensions: '4000 × 5000 px',
    prompt: 'A futuristic empress standing on a digital throne room made of floating data streams and holographic interfaces. She wears flowing robes that transition from solid fabric to pixelated data particles. Crown is made of interconnected geometric shapes with glowing nodes. Background shows a vast digital landscape of code waterfalls and data mountains.',
    featured: true,
    colorPalette: ['#4B0082', '#9370DB', '#00CED1', '#FF1493', '#F0F8FF']
  },
];

type ArtworkState = { 
  [key: string]: { 
    image_url: string | null;
    placeholder_color: string;
  } 
};

export default function DigitalIllustratorPortfolio() {
  const [artworks, setArtworks] = useState<ArtworkState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(PORTFOLIO_ARTWORKS.map(art => art.category)))];

  // Filter artworks based on selected category
  const filteredArtworks = selectedCategory === 'All' 
    ? PORTFOLIO_ARTWORKS 
    : PORTFOLIO_ARTWORKS.filter(art => art.category === selectedCategory);

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

  // Load images from Supabase
  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
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
      PORTFOLIO_ARTWORKS.forEach(art => {
        initialState[art.id] = { 
          image_url: null,
          placeholder_color: art.colorPalette[0]
        };
      });

      if (images) {
        const latestImagePerArtwork: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            if (PORTFOLIO_ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        PORTFOLIO_ARTWORKS.forEach(art => {
          if (latestImagePerArtwork[art.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerArtwork[art.id]).data.publicUrl;
            initialState[art.id] = { 
              image_url: url,
              placeholder_color: art.colorPalette[0]
            };
          }
        });
      }

      setArtworks(initialState);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(artworkId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${artworkId}/`;

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
      
      // Update artwork with new image
      const artwork = PORTFOLIO_ARTWORKS.find(a => a.id === artworkId);
      setArtworks(prev => ({ 
        ...prev, 
        [artworkId]: { 
          image_url: publicUrl,
          placeholder_color: artwork?.colorPalette[0] || '#4A00E0'
        } 
      }));

      // Reload images to ensure consistency
      setTimeout(() => loadImages(), 500);

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Statistics for the illustrator
  const stats = [
    { label: 'Projects Completed', value: '150+' },
    { label: 'Client Satisfaction', value: '98%' },
    { label: 'Years Experience', value: '8' },
    { label: 'Art Pieces', value: '500+' },
  ];

  const services = [
    {
      title: 'Character Design',
      description: 'Unique, personality-driven characters for games, books, and animation',
      icon: Palette
    },
    {
      title: 'Concept Art',
      description: 'World-building and visual development for films and video games',
      icon: Sparkles
    },
    {
      title: 'Book Illustration',
      description: 'Full book illustration packages from cover to interior artwork',
      icon: Award
    },
    {
      title: 'Commercial Illustration',
      description: 'Custom illustrations for brands, marketing, and advertising',
      icon: Clock
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  PixelDream Studio
                </h1>
                <p className="text-xs text-gray-400">Digital Art & Illustration</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#gallery" className="hover:text-purple-300 transition-colors">Gallery</a>
              <a href="#services" className="hover:text-purple-300 transition-colors">Services</a>
              <a href="#about" className="hover:text-purple-300 transition-colors">About</a>
              <a href="#contact" className="hover:text-purple-300 transition-colors">Contact</a>
              <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity font-semibold">
                Book Consultation
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-700 pt-4">
              <div className="flex flex-col space-y-4">
                <a href="#gallery" className="hover:text-purple-300 transition-colors py-2">Gallery</a>
                <a href="#services" className="hover:text-purple-300 transition-colors py-2">Services</a>
                <a href="#about" className="hover:text-purple-300 transition-colors py-2">About</a>
                <a href="#contact" className="hover:text-purple-300 transition-colors py-2">Contact</a>
                <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity font-semibold w-full">
                  Book Consultation
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-purple-900/50 rounded-full text-sm mb-4 border border-purple-700">
                ✨ Award-Winning Digital Illustrator
              </span>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Where{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Imagination
                </span>
                {' '}Meets{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                  Digital Art
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                I create stunning digital illustrations that tell stories, evoke emotions, 
                and bring ideas to life for clients worldwide.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-full hover:opacity-90 transition-opacity font-semibold flex items-center">
                  View Portfolio <ChevronRight className="ml-2 w-5 h-5" />
                </button>
                <button className="border border-gray-600 text-gray-300 px-8 py-3 rounded-full hover:bg-white/5 transition-colors font-semibold">
                  Commission Artwork
                </button>
              </div>
            </div>
            <div className="relative">
              {/* Featured Artwork Display */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                <div 
                  className="aspect-square w-full bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900 animate-pulse"
                  style={{ 
                    background: loading 
                      ? `linear-gradient(45deg, #1a1a2e, #16213e, #0f3460)` 
                      : undefined 
                  }}
                >
                  {artworks['celestial-dreams']?.image_url && !loading ? (
                    <Image
                      src={artworks['celestial-dreams'].image_url}
                      alt="Featured Artwork"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  ) : !loading && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Palette className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                        <p className="text-gray-400">Featured Artwork Preview</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-2xl font-bold">Celestial Dreams</h3>
                      <p className="text-gray-300">Fantasy • 2024 • Featured</p>
                    </div>
                    <button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors p-3 rounded-full">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full blur-xl opacity-20 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Artwork</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Explore my collection of digital illustrations across various styles and themes
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArtworks.map((art) => {
              const artworkData = artworks[art.id] || { image_url: null, placeholder_color: art.colorPalette[0] };
              const imageUrl = artworkData.image_url;
              const placeholderColor = artworkData.placeholder_color;

              return (
                <div 
                  key={art.id} 
                  className="group relative overflow-hidden rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Artwork Image */}
                  <div className="relative aspect-square overflow-hidden">
                    {imageUrl ? (
                      <>
                        <Image
                          src={imageUrl}
                          alt={art.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(`
                              <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
                                <rect width="400" height="400" fill="${placeholderColor}"/>
                                <text x="200" y="200" text-anchor="middle" fill="white" font-family="Arial" font-size="20">${art.title}</text>
                              </svg>
                            `)}`;
                          }}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center animate-pulse"
                        style={{ background: `linear-gradient(45deg, ${art.colorPalette[0]}30, ${art.colorPalette[1]}30)` }}
                      >
                        <div className="text-center p-8">
                          <Palette className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-400">Artwork Preview</p>
                          {adminMode && (
                            <p className="text-sm text-purple-300 mt-2">Ready for upload</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Artwork Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{art.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="px-3 py-1 bg-gray-900 rounded-full">{art.category}</span>
                          <span>{art.year}</span>
                        </div>
                      </div>
                      {art.featured && (
                        <span className="px-3 py-1 bg-gradient-to-r from-yellow-600 to-orange-500 rounded-full text-xs font-semibold">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 mb-4">{art.description}</p>
                    
                    {/* Color Palette Preview */}
                    <div className="flex space-x-1 mb-4">
                      {art.colorPalette.map((color, index) => (
                        <div 
                          key={index}
                          className="flex-1 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>

                    {/* Admin Controls */}
                    {adminMode && (
                      <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Admin Controls</span>
                          <span className="text-xs px-2 py-1 bg-purple-900/50 rounded">
                            {art.dimensions}
                          </span>
                        </div>
                        
                        {/* Prompt Display & Copy */}
                        <div className="space-y-2">
                          <p className="text-xs text-gray-300 line-clamp-3">{art.prompt}</p>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => copyPrompt(art.prompt, art.id)}
                              className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
                              type="button"
                            >
                              {copiedId === art.id ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy Prompt
                                </>
                              )}
                            </button>
                            
                            {/* Upload Button */}
                            <label className="text-xs bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1.5 rounded cursor-pointer inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
                              {uploading === art.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3 h-3" />
                                  Upload Image
                                </>
                              )}
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

                    {/* Public Actions */}
                    {!adminMode && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                            <Heart className="w-5 h-5" />
                            <span className="text-sm">Like</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm">Share</span>
                          </button>
                        </div>
                        <button className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors">
                          <span className="text-sm">View Details</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* View More Button */}
          <div className="text-center mt-12">
            <button className="border border-gray-600 text-gray-300 px-8 py-3 rounded-full hover:bg-white/5 transition-colors font-semibold inline-flex items-center gap-2">
              Load More Artwork
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Professional Services</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Comprehensive digital illustration services tailored to your creative needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-purple-500 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <service.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-400 mb-6">{service.description}</p>
                <button className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 text-sm font-semibold">
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About & Contact Section */}
      <section id="about" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">About the Artist</h2>
              <p className="text-gray-300 mb-6 text-lg">
                Hello! I'm Alex Morgan, a professional digital illustrator with over 8 years of experience 
                creating captivating artwork for clients ranging from indie game studios to major publishers.
              </p>
              <p className="text-gray-400 mb-8">
                My passion lies in bringing imaginative concepts to life through digital painting. 
                I specialize in fantasy, sci-fi, and character-driven illustrations, with a focus on 
                creating emotionally resonant pieces that tell compelling stories.
              </p>
              <div className="flex space-x-4">
                <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-full hover:opacity-90 transition-opacity font-semibold">
                  Download Portfolio PDF
                </button>
                <button className="border border-gray-600 text-gray-300 px-8 py-3 rounded-full hover:bg-white/5 transition-colors font-semibold">
                  View Client Testimonials
                </button>
              </div>
            </div>
            
            {/* Contact Form */}
            <div id="contact" className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-6">Start Your Project</h3>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">First Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Project Type</label>
                  <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors">
                    <option>Character Design</option>
                    <option>Book Illustration</option>
                    <option>Concept Art</option>
                    <option>Commercial Illustration</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Project Details</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    placeholder="Tell me about your project..."
                  />
                </div>
                <button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-full hover:opacity-90 transition-opacity font-semibold">
                  Send Inquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">PixelDream Studio</h3>
                  <p className="text-sm text-gray-400">Digital Art & Illustration</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Creating stunning digital illustrations that inspire and captivate audiences worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#gallery" className="text-gray-400 hover:text-white transition-colors">Gallery</a></li>
                <li><a href="#services" className="text-gray-400 hover:text-white transition-colors">Services</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Services</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Character Design</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Book Illustration</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Concept Art</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Commercial Art</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <div className="flex space-x-4 mb-6">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
              <p className="text-gray-400 text-sm">
                For inquiries: alex@pixeldreamstudio.com<br />
                Response within 24 hours
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} PixelDream Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Admin Mode Active</span>
        </div>
      )}
    </div>
  );
}

// Helper component for upload icon (since we don't have Upload from lucid)
function Upload({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
      />
    </svg>
  );
}

// Helper component for copy icon
function Copy({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
      />
    </svg>
  );
}