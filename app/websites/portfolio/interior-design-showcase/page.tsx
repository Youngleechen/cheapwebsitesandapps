'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'interior-design';

// Interior design projects
const DESIGN_PROJECTS = [
  {
    id: 'mountain-retreat',
    title: 'Aspen Mountain Retreat',
    category: 'Residential',
    location: 'Aspen, Colorado',
    description: 'A contemporary luxury home blending rustic elements with modern minimalism',
    year: '2023',
    prompt: 'Interior of a luxury mountain retreat with floor-to-ceiling windows overlooking snow-capped peaks, featuring a stone fireplace, minimalist furniture in neutral tones, warm wood accents, and layered textiles. Professional architectural photography with natural lighting.'
  },
  {
    id: 'urban-loft',
    title: 'Tribeca Industrial Loft',
    category: 'Commercial',
    location: 'New York, NY',
    description: 'Converted warehouse space with industrial-chic aesthetic',
    year: '2023',
    prompt: 'Large open-plan industrial loft with exposed brick walls, steel beams, polished concrete floors, and oversized warehouse windows. Mix of vintage leather furniture and contemporary art pieces. Moody lighting with strategic spotlights.'
  },
  {
    id: 'coastal-villa',
    title: 'Mediterranean Coastal Villa',
    category: 'Residential',
    location: 'Santorini, Greece',
    description: 'White-washed villa with seamless indoor-outdoor living',
    year: '2022',
    prompt: 'Sun-drenched Mediterranean villa interior with curved white walls, arched doorways opening to ocean views, handcrafted terracotta tiles, and natural linen textiles. Blue accents throughout with minimalist decor. Golden hour lighting.'
  },
  {
    id: 'boutique-hotel',
    title: 'Boutique Hotel Lobby',
    category: 'Hospitality',
    location: 'Tokyo, Japan',
    description: 'Zen-inspired luxury hotel reception and lounge area',
    year: '2023',
    prompt: 'Serene boutique hotel lobby blending Japanese minimalism with Scandinavian design. Natural materials: stone, wood, paper screens. Low-profile furniture, living green wall, and subtle ambient lighting. Clean lines and peaceful atmosphere.'
  },
  {
    id: 'penthouse-suite',
    title: 'Manhattan Penthouse',
    category: 'Residential',
    location: 'Manhattan, NY',
    description: 'Sky-high luxury apartment with panoramic city views',
    year: '2024',
    prompt: 'Ultra-modern penthouse interior with 360-degree city skyline views. Glossy finishes, custom millwork, statement lighting fixtures, and curated art collection. Open floor plan with seamless transitions between living, dining, and entertainment spaces.'
  },
  {
    id: 'restaurant-design',
    title: 'Michelin-Star Restaurant',
    category: 'Hospitality',
    location: 'Paris, France',
    description: 'Fine dining establishment with theatrical lighting',
    year: '2023',
    prompt: 'Elegant Michelin-star restaurant interior with velvet banquettes, marble tables, dramatic pendant lighting, and a backlit onyx bar. Warm gold accents, curated art pieces, and intimate booth seating. Professional interior photography.'
  }
];

// Services
const SERVICES = [
  { title: 'Full-Service Interior Design', description: 'Complete project management from concept to installation' },
  { title: 'Space Planning & Layout', description: 'Optimizing flow and functionality for residential and commercial spaces' },
  { title: 'Custom Furniture Design', description: 'Bespoke pieces tailored to your space and style' },
  { title: 'Art & Accessories Curation', description: 'Sourcing unique artworks and decor elements' },
  { title: 'Lighting Design', description: 'Creating ambiance through strategic lighting solutions' },
  { title: 'Virtual Design Services', description: 'Remote design consultations for clients worldwide' }
];

// Client testimonials
const TESTIMONIALS = [
  { name: 'Sarah Chen', company: 'Tech Executive', text: 'Luminous Spaces transformed our home into a sanctuary. Their attention to detail and ability to blend functionality with beauty is unparalleled.' },
  { name: 'Michael Rodriguez', company: 'Hotelier', text: 'The boutique hotel redesign increased our bookings by 40%. Guests consistently compliment the serene, luxurious atmosphere.' },
  { title: 'Architectural Digest Feature', company: 'September 2023', text: 'Featured as one of the top 25 interior designers to watch for innovative use of natural light and sustainable materials.' },
  { name: 'Emily & James Wilson', company: 'Homeowners', text: 'Working with Luminous Spaces was a dream. They captured our vision perfectly while introducing elements we never would have considered.' }
];

type ProjectState = { [key: string]: { image_url: string | null, loaded: boolean } };

export default function LuminousSpacesPortfolio() {
  const [projects, setProjects] = useState<ProjectState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '', projectType: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Load images with preloading
  const preloadImage = (url: string) => {
    return new Promise((resolve) => {
      if (imageCache.current.has(url)) {
        resolve(true);
        return;
      }
      
      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        imageCache.current.set(url, img);
        resolve(true);
      };
      img.onerror = () => resolve(false);
    });
  };

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

  // Load project images
  useEffect(() => {
    const loadProjectImages = async () => {
      // Fetch interior design project images
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

      const initialState: ProjectState = {};
      DESIGN_PROJECTS.forEach(project => {
        initialState[project.id] = { image_url: null, loaded: false };
      });

      if (images) {
        const latestImagePerProject: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const projectId = pathParts[2];
            if (DESIGN_PROJECTS.some(p => p.id === projectId) && !latestImagePerProject[projectId]) {
              latestImagePerProject[projectId] = img.path;
            }
          }
        }

        // Preload images before updating state
        const preloadPromises = DESIGN_PROJECTS.map(async (project) => {
          if (latestImagePerProject[project.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerProject[project.id]).data.publicUrl;
            
            await preloadImage(url);
            initialState[project.id] = { image_url: url, loaded: true };
          }
        });

        await Promise.all(preloadPromises);
      }

      setProjects(initialState);
    };

    loadProjectImages();
  }, []);

  // Handle image upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(projectId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${projectId}/`;

      // Clean up old images for this project
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
      
      // Preload before showing
      await preloadImage(publicUrl);
      
      setProjects(prev => ({ 
        ...prev, 
        [projectId]: { image_url: publicUrl, loaded: true } 
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  // Copy prompt
  const copyPrompt = (prompt: string, projectId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(projectId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Filter projects
  const filteredProjects = DESIGN_PROJECTS.filter(project => 
    activeFilter === 'All' || project.category === activeFilter
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this to your backend
    console.log('Form submitted:', formData);
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
    setFormData({ name: '', email: '', message: '', projectType: '' });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full"></div>
              <span className="text-2xl font-light tracking-wider">Luminous Spaces</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#portfolio" className="text-sm font-medium hover:text-amber-600 transition">Portfolio</Link>
              <Link href="#services" className="text-sm font-medium hover:text-amber-600 transition">Services</Link>
              <Link href="#process" className="text-sm font-medium hover:text-amber-600 transition">Process</Link>
              <Link href="#contact" className="text-sm font-medium hover:text-amber-600 transition">Contact</Link>
              <button className="px-6 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-sm font-medium hover:shadow-lg transition">
                Book Consultation
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {menuOpen && (
            <div className="md:hidden mt-4 pb-4">
              <div className="flex flex-col space-y-4">
                <Link href="#portfolio" className="text-sm font-medium hover:text-amber-600 transition">Portfolio</Link>
                <Link href="#services" className="text-sm font-medium hover:text-amber-600 transition">Services</Link>
                <Link href="#process" className="text-sm font-medium hover:text-amber-600 transition">Process</Link>
                <Link href="#contact" className="text-sm font-medium hover:text-amber-600 transition">Contact</Link>
                <button className="px-6 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-sm font-medium w-fit">
                  Book Consultation
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-light leading-tight mb-6">
              Designing Spaces That
              <span className="block font-serif italic text-amber-500">Inspire & Transform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              Award-winning interior design studio specializing in creating harmonious, 
              light-filled spaces that elevate everyday living.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full font-medium hover:shadow-xl transition">
                View Our Portfolio
              </button>
              <button className="px-8 py-3 border-2 border-gray-300 rounded-full font-medium hover:border-amber-400 transition">
                Our Design Process
              </button>
            </div>
          </div>
        </div>
        
        {/* Hero Decorative Elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-tr from-blue-50 to-amber-50 rounded-full opacity-20 blur-3xl"></div>
      </section>

      {/* Featured Projects Section */}
      <section id="portfolio" className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4">Featured Projects</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each space tells a unique story of craftsmanship, attention to detail, 
              and thoughtful design.
            </p>
          </div>

          {/* Project Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {['All', 'Residential', 'Commercial', 'Hospitality'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-2 rounded-full transition ${
                  activeFilter === filter
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                    : 'bg-white border border-gray-300 hover:border-amber-400'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => {
              const projectData = projects[project.id] || { image_url: null, loaded: false };
              const imageUrl = projectData.image_url;

              return (
                <div key={project.id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                  {/* Image Container */}
                  <div className="relative h-64 md:h-80 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={project.title}
                          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                            projectData.loaded ? 'opacity-100' : 'opacity-0'
                          }`}
                          loading="lazy"
                          onLoad={() => {
                            setProjects(prev => ({
                              ...prev,
                              [project.id]: { ...prev[project.id], loaded: true }
                            }));
                          }}
                          onError={(e) => {
                            console.error('Failed to load image:', imageUrl);
                            (e.target as HTMLImageElement).src = '/placeholder-interior.jpg';
                          }}
                        />
                        {/* Loading skeleton */}
                        {!projectData.loaded && (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Project Image</span>
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium">
                      {project.category}
                    </div>
                    
                    {/* Admin Upload Overlay */}
                    {adminMode && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <label className="cursor-pointer bg-white text-gray-900 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition">
                          {uploading === project.id ? 'Uploading...' : 'Upload Project Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, project.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-light">{project.title}</h3>
                      <span className="text-sm text-gray-500">{project.year}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{project.location}</p>
                    <p className="text-gray-700">{project.description}</p>
                    
                    {/* Admin Prompt Section */}
                    {adminMode && !imageUrl && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-amber-800 mb-2">AI Prompt for Image Generation:</h4>
                          <button
                            onClick={() => copyPrompt(project.prompt, project.id)}
                            className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-full"
                            type="button"
                          >
                            {copiedId === project.id ? '✓ Copied' : 'Copy Prompt'}
                          </button>
                        </div>
                        <p className="text-xs text-amber-700">{project.prompt}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4">Our Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive design solutions tailored to your vision and lifestyle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service, index) => (
              <div key={index} className="p-8 rounded-2xl border border-gray-200 hover:border-amber-300 transition group">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-light mb-3">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-amber-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4">Client Stories & Recognition</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full"></div>
                  <div className="ml-4">
                    <h4 className="font-medium">{testimonial.name || testimonial.title}</h4>
                    <p className="text-sm text-gray-600">{testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4">Start Your Design Journey</h2>
            <p className="text-gray-600">
              Schedule a complimentary initial consultation to discuss your project vision.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-light mb-6">Get in Touch</h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">studio@luminous-spaces.com</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">(212) 555-7890</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Studio</p>
                    <p className="font-medium">123 Design Avenue, New York, NY 10001</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                <select
                  id="projectType"
                  value={formData.projectType}
                  onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select a project type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  id="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full font-medium hover:shadow-xl transition"
              >
                {formSubmitted ? 'Message Sent!' : 'Request Consultation'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full"></div>
                <span className="text-2xl font-light tracking-wider">Luminous Spaces</span>
              </div>
              <p className="text-gray-400">Transforming spaces, elevating lives since 2015</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Pinterest</a>
              <a href="#" className="text-gray-400 hover:text-white transition">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Houzz</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Luminous Spaces Interior Design. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 rounded-full shadow-lg z-50">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-medium">Admin Mode Active</span>
          </div>
        </div>
      )}
    </div>
  );
}