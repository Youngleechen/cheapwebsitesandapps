// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Check, Mail, MapPin, Phone, Star, Upload, X } from 'lucide-react';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'tattoo-gallery';

// Tattoo Style Data - Replaces ARTWORKS from your skeleton
const TATTOO_STYLES = [
  { 
    id: 'watercolor-botanicals', 
    title: 'Watercolor Botanicals',
    description: 'Fluid, painterly floral designs that blend colors seamlessly without harsh outlines.',
    prompt: 'A delicate watercolor tattoo of peonies and cherry blossoms with soft pink, lavender, and teal washes blending into skin. Artistic, elegant, no black outlines.'
  },
  { 
    id: 'neo-traditional-portraits', 
    title: 'Neo-Traditional Portraits',
    description: 'Bold linework with realistic shading and modern color palettes for portrait tattoos.',
    prompt: 'A neo-traditional tattoo portrait of a mystical figure with intricate jewelry, bold black lines, and vibrant emerald and gold color palette. Dramatic lighting.'
  },
  { 
    id: 'geometric-mandala', 
    title: 'Geometric Mandala',
    description: 'Precise sacred geometry and mandala patterns with dotwork and fine line details.',
    prompt: 'An intricate geometric mandala tattoo with perfect symmetry, dotwork shading, and subtle gold accent lines. Centered placement, meditative quality.'
  },
  { 
    id: 'japanese-irezumi', 
    title: 'Japanese Irezumi',
    description: 'Traditional Japanese motifs like koi fish, dragons, and waves with vibrant colors.',
    prompt: 'A traditional Japanese tattoo sleeve featuring a coiling dragon and crashing waves with vibrant red, blue, and green scales. Dynamic movement.'
  },
  { 
    id: 'fine-line-minimalist', 
    title: 'Fine Line Minimalist',
    description: 'Delicate single-needle work for subtle, elegant tattoos with minimal shading.',
    prompt: 'A minimalist fine line tattoo of celestial constellations and subtle moon phases using single needle technique. Delicate, precise, barely-there aesthetic.'
  },
  { 
    id: 'blackwork-abstract', 
    title: 'Blackwork Abstract',
    description: 'Bold abstract patterns and dotwork using only black ink for dramatic contrast.',
    prompt: 'An abstract blackwork tattoo with organic, flowing patterns of solid black and intricate dotwork. High contrast, modern, no color.'
  }
];

// Types
interface TattooStyleState {
  [key: string]: { 
    image_url: string | null;
    placeholder_color: string;
  };
}

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  style: string;
  placement: string;
  date: string;
  description: string;
}

// Artist Data
const ARTISTS = [
  { name: 'Maya Chen', specialty: 'Watercolor & Illustrative', experience: '8 years' },
  { name: 'Leo Rivera', specialty: 'Japanese & Traditional', experience: '12 years' },
  { name: 'Zara Jones', specialty: 'Fine Line & Minimalist', experience: '6 years' },
];

export default function ChromaInkStudio() {
  // Gallery State
  const [tattooStyles, setTattooStyles] = useState<TattooStyleState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // UI State
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    name: '',
    email: '',
    phone: '',
    style: '',
    placement: '',
    date: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Check Admin
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load Tattoo Images
  useEffect(() => {
    const loadImages = async () => {
      // Initial state with placeholder colors
      const initialState: TattooStyleState = {};
      TATTOO_STYLES.forEach(style => {
        initialState[style.id] = { 
          image_url: null,
          placeholder_color: getPlaceholderColor(style.id)
        };
      });

      // Fetch gallery images
      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        setTattooStyles(initialState);
        return;
      }

      if (images) {
        const latestImagePerStyle: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX.replace('-', '_')) {
            const styleId = pathParts[2];
            if (TATTOO_STYLES.some(s => s.id === styleId) && !latestImagePerStyle[styleId]) {
              latestImagePerStyle[styleId] = img.path;
            }
          }
        }

        // Build final state with images
        TATTOO_STYLES.forEach(style => {
          if (latestImagePerStyle[style.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerStyle[style.id]).data.publicUrl;
            initialState[style.id] = { 
              image_url: url,
              placeholder_color: getPlaceholderColor(style.id)
            };
          }
        });
      }

      setTattooStyles(initialState);
    };

    loadImages();
  }, []);

  // Helper for placeholder colors
  const getPlaceholderColor = (id: string): string => {
    const colors: Record<string, string> = {
      'watercolor-botanicals': 'from-pink-400 to-purple-500',
      'neo-traditional-portraits': 'from-red-500 to-amber-600',
      'geometric-mandala': 'from-emerald-400 to-cyan-500',
      'japanese-irezumi': 'from-blue-500 to-violet-600',
      'fine-line-minimalist': 'from-gray-300 to-slate-400',
      'blackwork-abstract': 'from-gray-800 to-black'
    };
    return colors[id] || 'from-gray-700 to-gray-900';
  };

  // Gallery Upload Handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, styleId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploading(styleId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${styleId}/`;
      
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
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folderPath}${timestamp}_${safeFileName}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type
        });
      
      if (uploadErr) throw uploadErr;

      // Add to database
      const { error: dbErr } = await supabase
        .from('images')
        .insert({ 
          user_id: ADMIN_USER_ID, 
          path: filePath 
        });
      
      if (dbErr) throw dbErr;

      // Update state
      const publicUrl = supabase.storage
        .from('user_images')
        .getPublicUrl(filePath).data.publicUrl;
      
      setTattooStyles(prev => ({ 
        ...prev, 
        [styleId]: { 
          image_url: publicUrl,
          placeholder_color: getPlaceholderColor(styleId)
        } 
      }));

    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, styleId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(styleId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Booking Handlers
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitting(false);
    setBookingSuccess(true);
    setBookingForm({
      name: '',
      email: '',
      phone: '',
      style: '',
      placement: '',
      date: '',
      description: ''
    });
    
    setTimeout(() => {
      setBookingModal(false);
      setBookingSuccess(false);
    }, 3000);
  };

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                CHROMA INK
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#gallery" className="text-gray-300 hover:text-white transition">Gallery</a>
              <a href="#artists" className="text-gray-300 hover:text-white transition">Artists</a>
              <a href="#process" className="text-gray-300 hover:text-white transition">Process</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition">Contact</a>
              <button 
                onClick={() => setBookingModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:opacity-90 transition"
              >
                Book Consultation
              </button>
            </div>
            
            <button className="md:hidden text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0px, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2) 0px, transparent 50%)`
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Where Art Becomes Skin
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              A modern tattoo studio specializing in custom color work, fine line artistry, 
              and transforming your vision into permanent beauty. Award-winning artists, 
              sterile environment, unforgettable experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setBookingModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                Start Your Journey
              </button>
              <a 
                href="#gallery"
                className="border border-gray-700 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/5 transition"
              >
                View Our Work
              </a>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-500 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2" />
          </div>
        </div>
      </section>

      {/* Gallery Section with Admin Uploads */}
      <section id="gallery" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Signature Styles
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Explore our specialized tattoo styles. Each piece is custom-designed 
              for our clients using the highest quality pigments and equipment.
            </p>
          </div>

          {adminMode && (
            <div className="mb-8 p-4 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-600 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600 rounded">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Admin Mode Active</h3>
                  <p className="text-sm text-gray-300">
                    You can upload portfolio images and copy AI prompts for each style.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TATTOO_STYLES.map((style) => {
              const styleData = tattooStyles[style.id] || { image_url: null, placeholder_color: '' };
              const imageUrl = styleData.image_url;

              return (
                <div key={style.id} className="group relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 hover:border-cyan-500/50 transition-all duration-300">
                  {/* Image or Gradient Placeholder */}
                  <div className="aspect-square relative overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={style.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${styleData.placeholder_color} flex items-center justify-center`}>
                        <span className="text-white/80 font-medium">{style.title}</span>
                      </div>
                    )}
                    
                    {/* Admin Overlay */}
                    {adminMode && (
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6">
                        {!imageUrl && (
                          <div className="mb-4 text-center">
                            <p className="text-sm text-purple-300 mb-2">AI Prompt for this style:</p>
                            <p className="text-xs text-gray-300 mb-3 line-clamp-3">{style.prompt}</p>
                            <button
                              onClick={() => copyPrompt(style.prompt, style.id)}
                              className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-full"
                              type="button"
                            >
                              {copiedId === style.id ? 'Copied!' : 'Copy Prompt'}
                            </button>
                          </div>
                        )}
                        <label className="cursor-pointer bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition">
                          {uploading === style.id ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              Uploading...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Upload size={16} />
                              {imageUrl ? 'Replace Image' : 'Upload Image'}
                            </span>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, style.id)}
                            className="hidden"
                            disabled={uploading === style.id}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{style.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{style.description}</p>
                    <button 
                      onClick={() => {
                        setBookingForm(prev => ({ ...prev, style: style.title }));
                        setBookingModal(true);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                    >
                      Request This Style →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Artists Section */}
      <section id="artists" className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Master Artists
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Our artists combine technical precision with artistic vision to create 
              tattoos that stand the test of time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {ARTISTS.map((artist, index) => (
              <div key={index} className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800 hover:border-cyan-500/30 transition">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">
                  {artist.name.charAt(0)}
                </div>
                <h3 className="text-2xl font-bold text-center mb-2">{artist.name}</h3>
                <p className="text-cyan-400 text-center mb-3">{artist.specialty}</p>
                <p className="text-gray-400 text-center text-sm">Experience: {artist.experience}</p>
                <div className="flex justify-center mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  Our Process
                </span>
              </h2>
              <p className="text-gray-400 text-lg">
                From concept to aftercare, we ensure every step is exceptional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Consultation', desc: 'Discuss your vision, placement, and design ideas' },
                { step: '2', title: 'Design', desc: 'Custom artwork created specifically for you' },
                { step: '3', title: 'Application', desc: 'Sterile environment with premium inks and equipment' },
                { step: '4', title: 'Aftercare', desc: 'Comprehensive guidance for perfect healing' },
                { step: '5', title: 'Touch-ups', desc: 'Free touch-up session within 6 months' },
                { step: '6', title: 'Community', desc: 'Lifetime access to client events and updates' }
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 h-full">
                    <div className="text-cyan-400 text-2xl font-bold mb-4">{item.step}</div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Vision into Art?
            </h2>
            <p className="text-gray-300 text-xl mb-8 max-w-2xl mx-auto">
              Book a consultation with our award-winning artists. Limited spots available.
            </p>
            <button 
              onClick={() => setBookingModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-10 py-5 rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-cyan-500/25 transition-all transform hover:-translate-y-1"
            >
              Book Your Session Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-black border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  CHROMA INK
                </span>
              </h3>
              <p className="text-gray-400 mb-6">
                Modern tattoo artistry in a sterile, creative environment. 
                Where every piece tells a story.
              </p>
              <div className="flex space-x-4">
                {['Instagram', 'Twitter', 'TikTok'].map((social) => (
                  <a 
                    key={social} 
                    href="#" 
                    className="text-gray-400 hover:text-cyan-400 transition"
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Contact</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin size={18} />
                  <span>123 Art District, Brooklyn, NY 11201</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone size={18} />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail size={18} />
                  <span>hello@chromaink.com</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Hours</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex justify-between">
                  <span>Mon - Thu</span>
                  <span>11AM - 8PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Fri - Sat</span>
                  <span>11AM - 10PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>By Appointment</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Chroma Ink Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {bookingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl w-full max-w-md relative">
            <button 
              onClick={() => setBookingModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <div className="p-8">
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Booking Confirmed!</h3>
                  <p className="text-gray-300 mb-6">
                    We&apos;ve received your consultation request. Our studio manager will 
                    contact you within 24 hours to schedule your appointment.
                  </p>
                  <button
                    onClick={() => setBookingModal(false)}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mb-2">Book Consultation</h3>
                  <p className="text-gray-400 mb-6">
                    Complete this form and we&apos;ll contact you to schedule.
                  </p>
                  
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.name}
                        onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <input
                          type="email"
                          required
                          value={bookingForm.email}
                          onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                          placeholder="you@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone *</label>
                        <input
                          type="tel"
                          required
                          value={bookingForm.phone}
                          onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Style Interest</label>
                      <select
                        value={bookingForm.style}
                        onChange={(e) => setBookingForm({...bookingForm, style: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="">Select a style</option>
                        {TATTOO_STYLES.map((style) => (
                          <option key={style.id} value={style.title}>{style.title}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Placement</label>
                      <input
                        type="text"
                        value={bookingForm.placement}
                        onChange={(e) => setBookingForm({...bookingForm, placement: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                        placeholder="Arm, back, leg, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={bookingForm.description}
                        onChange={(e) => setBookingForm({...bookingForm, description: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none h-32"
                        placeholder="Tell us about your tattoo idea..."
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold py-4 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Request Consultation'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}