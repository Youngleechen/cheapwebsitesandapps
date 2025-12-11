'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CalendarIcon, 
  CameraIcon, 
  CheckCircleIcon, 
  ChevronRightIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  PhoneIcon, 
  PlayIcon, 
  StarIcon,
  TrophyIcon,
  VideoCameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'elysian_gallery';

// Gallery configuration for the business
const GALLERY_ITEMS = [
  { 
    id: 'hero-drone-shot', 
    title: 'Aspen Mountain Estate',
    category: 'Real Estate',
    prompt: 'A breathtaking aerial shot of a luxury mountain estate in Aspen during golden hour. Show the entire property with swimming pool, tennis court, and panoramic mountain views. The lighting should be warm with long shadows, highlighting architectural details and landscaping.'
  },
  { 
    id: 'commercial-complex', 
    title: 'Commercial Development',
    category: 'Commercial',
    prompt: 'Professional aerial footage of a new commercial complex under construction. Show the scale of development with multiple buildings, construction equipment, and surrounding infrastructure. Use cinematic lighting with dynamic shadows and vibrant colors to highlight progress.'
  },
  { 
    id: 'luxury-amenities', 
    title: 'Resort Amenities',
    category: 'Hospitality',
    prompt: 'Stunning aerial view of luxury resort amenities including infinity pool overlooking mountains, golf course, and spa facilities. Show guests enjoying the facilities with natural, candid compositions. Use early morning light with mist rising from the pool.'
  },
  { 
    id: 'event-coverage', 
    title: 'Wedding Venue',
    category: 'Events',
    prompt: 'Aerial cinematic shot of a luxury wedding venue with sweeping views of mountains. Show the ceremony setup, reception area, and surrounding natural beauty. Capture the golden hour lighting with romantic, soft focus on key moments.'
  },
  { 
    id: 'property-tour', 
    title: '360° Virtual Tour',
    category: 'Interactive',
    prompt: 'Aerial 360-degree virtual tour of a multi-million dollar property. Show seamless transitions between different angles highlighting indoor-outdoor living spaces, expansive windows, and panoramic views. Use smooth, cinematic camera movements.'
  },
  { 
    id: 'seasonal-transition', 
    title: 'Seasonal Beauty',
    category: 'Nature',
    prompt: 'Time-lapse aerial footage showing seasonal transition from summer to winter in Aspen. Capture vibrant fall foliage transforming into pristine snow-covered landscapes. Use smooth transitions and show the same location across seasons.'
  },
];

type GalleryState = { [key: string]: { image_url: string | null; loaded: boolean } };

// Testimonial data
const TESTIMONIALS = [
  {
    id: 1,
    name: 'Michael Sterling',
    role: 'CEO, Sterling Properties',
    content: 'Elysian transformed our luxury listings. Their aerial footage increased our property views by 300% and helped us close a $12M estate in record time.',
    rating: 5,
    location: 'Aspen, CO'
  },
  {
    id: 2,
    name: 'Sarah Chen',
    role: 'Development Director, Alpine Resorts',
    content: 'The commercial drone footage for our resort expansion was absolutely stunning. It became our primary marketing asset and secured additional investor funding.',
    rating: 5,
    location: 'Vail, CO'
  },
  {
    id: 3,
    name: 'James & Elena Rodriguez',
    role: 'Property Owners',
    content: 'Our wedding venue aerial video went viral on social media. Bookings filled for the next two seasons within a week of the video release.',
    rating: 5,
    location: 'Telluride, CO'
  },
];

// Services data
const SERVICES = [
  {
    id: 1,
    title: 'Luxury Real Estate Cinematics',
    description: 'Cinematic aerial tours that showcase properties in their best light',
    features: ['4K/8K Resolution', 'Golden Hour Shoots', 'Virtual Staging', 'Property Mapping'],
    startingPrice: '$2,500',
    icon: CameraIcon
  },
  {
    id: 2,
    title: 'Commercial Development Documentation',
    description: 'Progress tracking and promotional footage for developments',
    features: ['Monthly Updates', '3D Modeling', 'Progress Timelines', 'Investor Presentations'],
    startingPrice: '$4,500',
    icon: TrophyIcon
  },
  {
    id: 3,
    title: 'Event & Venue Coverage',
    description: 'Capture your special events from breathtaking perspectives',
    features: ['Live Streaming', 'Multi-Angle Shots', 'Same-Day Edits', 'Social Media Packages'],
    startingPrice: '$3,200',
    icon: VideoCameraIcon
  },
];

// Process steps
const PROCESS_STEPS = [
  { step: 1, title: 'Consultation', description: 'We understand your vision and requirements' },
  { step: 2, title: 'Flight Planning', description: 'Detailed planning for optimal shots and angles' },
  { step: 3, title: 'Shoot Day', description: 'Professional drone operation with backup equipment' },
  { step: 4, title: 'Post-Production', description: 'Expert editing, color grading, and delivery' },
];

export default function HomePage() {
  const [galleryImages, setGalleryImages] = useState<GalleryState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Check admin status
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
      // Initial state - all images not loaded
      const initialState: GalleryState = {};
      GALLERY_ITEMS.forEach(item => {
        initialState[item.id] = { image_url: null, loaded: false };
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
        setGalleryImages(initialState);
        return;
      }

      if (images) {
        const latestImagePerArtwork: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX.replace('_', '')) {
            const artId = pathParts[2];
            if (GALLERY_ITEMS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        // Update state with loaded images
        GALLERY_ITEMS.forEach(item => {
          if (latestImagePerArtwork[item.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerArtwork[item.id]).data.publicUrl;
            initialState[item.id] = { image_url: url, loaded: false };
          }
        });
      }

      setGalleryImages(initialState);
    };

    loadImages();
  }, []);

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
      setGalleryImages(prev => ({ 
        ...prev, 
        [artworkId]: { image_url: publicUrl, loaded: false } 
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: ''
      });
    }, 3000);
  };

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle image load
  const handleImageLoad = (id: string) => {
    setGalleryImages(prev => ({
      ...prev,
      [id]: { ...prev[id], loaded: true }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Elysian Aerial Imaging
                </h1>
                <p className="text-xs text-gray-400">Aspen · Vail · Telluride</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="hover:text-cyan-400 transition-colors">Services</a>
              <a href="#gallery" className="hover:text-cyan-400 transition-colors">Gallery</a>
              <a href="#process" className="hover:text-cyan-400 transition-colors">Process</a>
              <a href="#contact" className="hover:text-cyan-400 transition-colors">Contact</a>
              <button className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg hover:opacity-90 transition-opacity">
                Book Consultation
              </button>
            </div>

            <div className="md:hidden">
              <button className="p-2">
                <div className="w-6 h-0.5 bg-white mb-1.5"></div>
                <div className="w-6 h-0.5 bg-white mb-1.5"></div>
                <div className="w-6 h-0.5 bg-white"></div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          {galleryImages['hero-drone-shot']?.image_url ? (
            <div className="relative w-full h-full">
              <img
                src={galleryImages['hero-drone-shot'].image_url}
                alt="Luxury Aerial View"
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  galleryImages['hero-drone-shot'].loaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => handleImageLoad('hero-drone-shot')}
              />
              <div className={`absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/60 to-gray-950 ${
                galleryImages['hero-drone-shot'].loaded ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-500`} />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-950" />
          )}
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
              <span className="text-cyan-400 text-sm">FAA Certified · Insured · Local</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Elevate Your Property with{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Cinematic Aerial Excellence
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 max-w-2xl">
              Professional drone cinematography for luxury real estate, commercial developments, 
              and exclusive events in Colorado's most prestigious locations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Schedule Flight Demo
              </button>
              <button className="px-8 py-4 border border-gray-700 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                <PlayIcon className="w-5 h-5" />
                View Showreel
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container mx-auto px-4 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: '4K/8K', label: 'Ultra HD Resolution' },
                { value: '48h', label: 'Turnaround Time' },
                { value: '250+', label: 'Projects Completed' },
                { value: '100%', label: 'Client Satisfaction' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800">
                  <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Premium Aerial Services</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Tailored solutions for discerning clients who demand nothing but the best
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.id} className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-cyan-500/30 transition-all group hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                  <p className="text-gray-400 mb-6">{service.description}</p>
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-cyan-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-cyan-400">{service.startingPrice}</span>
                    <button className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Seamless Process</h2>
            <p className="text-gray-400 text-lg">From consultation to delivery - perfection at every step</p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 top-12 w-3/4 hidden md:block" />
            
            <div className="grid md:grid-cols-4 gap-8 relative">
              {PROCESS_STEPS.map((step) => (
                <div key={step.step} className="text-center">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full flex items-center justify-center mb-6 border-4 border-gray-800">
                    <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-3xl font-bold text-cyan-400">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" ref={galleryRef} className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <h2 className="text-4xl font-bold mb-4">Portfolio Showcase</h2>
              <p className="text-gray-400 text-lg">
                Experience the breathtaking perspectives we capture for our clients
              </p>
            </div>
            
            {adminMode && (
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-600/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-purple-300">Admin Mode Active</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">You can upload and manage gallery images</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GALLERY_ITEMS.map((item) => {
              const imageData = galleryImages[item.id] || { image_url: null, loaded: false };
              const imageUrl = imageData.image_url;

              return (
                <div 
                  key={item.id} 
                  className="group relative bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => imageUrl && setSelectedImage(imageUrl)}
                >
                  {/* Image Container */}
                  <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                    {imageUrl ? (
                      <>
                        <img 
                          src={imageUrl}
                          alt={item.title}
                          className={`w-full h-full object-cover transition-opacity duration-500 ${
                            imageData.loaded ? 'opacity-100' : 'opacity-0'
                          }`}
                          onLoad={() => handleImageLoad(item.id)}
                        />
                        {!imageData.loaded && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center p-8">
                          <CameraIcon className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                          <span className="text-gray-600 block">No image uploaded</span>
                          <span className="text-gray-700 text-sm block mt-2">{item.category}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-gray-900/90 backdrop-blur-sm rounded-full text-sm">
                        {item.category}
                      </span>
                    </div>
                    
                    {/* Admin Controls Overlay */}
                    {adminMode && (
                      <div className="absolute top-4 right-4 flex gap-2">
                        {!imageUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyPrompt(item.prompt, item.id);
                            }}
                            className="px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm rounded-lg text-sm hover:bg-gray-800 transition-colors"
                          >
                            {copiedId === item.id ? 'Copied!' : 'Copy Prompt'}
                          </button>
                        )}
                        
                        <label className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-sm cursor-pointer hover:opacity-90 transition-opacity">
                          {uploading === item.id ? 'Uploading...' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, item.id)}
                            className="hidden"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    
                    
                    {adminMode && !imageUrl && (
                      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-purple-300 mb-2">📝 AI Prompt:</p>
                        <p className="text-xs text-gray-400 line-clamp-2">{item.prompt}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Client Success Stories</h2>
            <p className="text-gray-400 text-lg">Trusted by Colorado's most prestigious brands</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-800">
                {TESTIMONIALS.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className={`p-8 transition-opacity duration-500 ${
                      index === activeTestimonial ? 'opacity-100' : 'opacity-0 absolute inset-0'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <StarIconSolid
                          key={i}
                          className="w-5 h-5 text-yellow-500"
                        />
                      ))}
                    </div>
                    <blockquote className="text-2xl font-light mb-8 leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg">{testimonial.name}</div>
                        <div className="text-gray-400">{testimonial.role}</div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPinIcon className="w-4 h-4" />
                          {testimonial.location}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {TESTIMONIALS.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveTestimonial(idx)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              idx === activeTestimonial ? 'bg-cyan-500' : 'bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-4xl font-bold mb-6">Ready to Elevate Your Vision?</h2>
                <p className="text-gray-400 mb-8">
                  Contact us for a complimentary consultation and discover how our aerial cinematography 
                  can transform your property marketing.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                      <PhoneIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Call Us</div>
                      <div className="text-lg font-semibold">(970) 555-ELYSIAN</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                      <EnvelopeIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Email</div>
                      <div className="text-lg font-semibold">contact@elysianaerial.co</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                      <MapPinIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Based In</div>
                      <div className="text-lg font-semibold">Aspen, Colorado</div>
                      <div className="text-sm text-gray-400">Serving all of Colorado</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h3 className="text-2xl font-bold mb-6">Book Your Consultation</h3>
                
                {formSubmitted ? (
                  <div className="text-center py-12">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-6" />
                    <h4 className="text-2xl font-bold mb-3">Thank You!</h4>
                    <p className="text-gray-400">
                      We've received your inquiry and will contact you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
                        placeholder="John Smith"
                      />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
                          placeholder="john@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
                          placeholder="(970) 555-0123"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Service Interest</label>
                      <select
                        required
                        value={formData.service}
                        onChange={(e) => setFormData({...formData, service: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
                      >
                        <option value="">Select a service</option>
                        <option value="real-estate">Real Estate Cinematics</option>
                        <option value="commercial">Commercial Development</option>
                        <option value="events">Event Coverage</option>
                        <option value="other">Other Project</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Project Details</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
                        placeholder="Tell us about your project..."
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                      Request Free Consultation
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg" />
                <div>
                  <div className="font-bold text-lg">Elysian Aerial Imaging</div>
                  <div className="text-sm text-gray-500">FAA Part 107 Certified</div>
                </div>
              </div>
              <p className="text-gray-500 text-sm max-w-md">
                Professional drone cinematography services for luxury properties and commercial developments in Colorado.
              </p>
            </div>
            
            <div className="text-center md:text-right">
              <div className="text-sm text-gray-500 mb-4">Business Hours</div>
              <div className="font-semibold">Mon - Fri: 8AM - 6PM</div>
              <div className="font-semibold">Sat - Sun: 9AM - 4PM</div>
              <div className="text-sm text-gray-500 mt-2">Emergency flights available</div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Elysian Aerial Imaging. All rights reserved.</p>
            <p className="mt-2">Drone Services in Aspen, Vail, Telluride, Denver, and throughout Colorado</p>
          </div>
        </div>
      </footer>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-gray-900/80 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Full size preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}

      {/* Floating CTA */}
      <div className="fixed bottom-6 right-6 z-40">
        <button className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
          <PhoneIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Book Now</span>
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}