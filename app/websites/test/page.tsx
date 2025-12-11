// app/pages/gryscol-tree-service/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin user ID
const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';

const PROJECT_PROMPTS = [
  { 
    id: 'emergency-removal', 
    title: 'Emergency Storm Removal',
    prompt: 'Dramatic before/after comparison of a massive pine tree removal after winter storms in Portland. Before: tree collapsed across a two-story home\'s roof. After: clean site with debris hauled away, roof temporarily tarped, safety barriers in place. Professional photography, golden hour lighting, shows crew equipment subtly in background.'
  },
  { 
    id: 'downtown-pruning', 
    title: 'Historic District Pruning',
    prompt: 'Split-image showing delicate crown reduction on 100-year-old heritage oak tree in Portland\'s Pearl District. Left: overgrown branches threatening historic building facade. Right: skillfully pruned canopy preserving tree health while protecting architecture. Show arborist with measuring tools in foreground, city skyline visible.'
  },
  { 
    id: 'stump-removal', 
    title: 'Complete Site Restoration',
    prompt: 'Triptych sequence showing stump grinding project in SW Portland backyard: 1) dangerous 3ft diameter stump hidden in grass 2) professional grinding operation with safety cones 3) finished lawn seamlessly restored with new sod. Include happy family and dog in final shot, morning light.'
  },
];

type ProjectState = { [key: string]: { image_url: string | null } };

function GallerySkeleton() {
  const [projects, setProjects] = useState<ProjectState>({});
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
      const { data: images } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID);

      const initialState: ProjectState = {};
      PROJECT_PROMPTS.forEach(project => initialState[project.id] = { image_url: null });

      if (images) {
        PROJECT_PROMPTS.forEach(project => {
          const match = images.find(img => img.path.includes(`/${project.id}/`));
          if (match) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(match.path).data.publicUrl;
            initialState[project.id] = { image_url: url };
          }
        });
      }

      setProjects(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(projectId);
    try {
      const filePath = `${ADMIN_USER_ID}/${projectId}/${Date.now()}_${file.name}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setProjects(prev => ({ ...prev, [projectId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, projectId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(projectId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Portland's Trusted Tree Experts
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Real results from real Portland properties. See why 1,200+ homeowners trust our certified arborists.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {PROJECT_PROMPTS.map((project) => {
          const imageUrl = projects[project.id]?.image_url;
          const hasImage = !!imageUrl;

          return (
            <div 
              key={project.id} 
              className={`bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl ${
                hasImage ? 'border-2 border-green-50' : 'border border-dashed border-gray-300'
              }`}
            >
              {/* Image Container with Aspect Ratio */}
              <div className="relative h-64 md:h-80">
                {hasImage ? (
                  <Image 
                    src={imageUrl} 
                    alt={project.title} 
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                      <span className="text-green-800 font-bold text-xl">📸</span>
                    </div>
                    <p className="text-center font-medium text-gray-700">
                      {adminMode ? 'Upload project photo' : 'Coming Soon'}
                    </p>
                  </div>
                )}
                
                {/* Project Badge */}
                <div className="absolute top-4 right-4 bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                  {hasImage ? 'Completed' : 'In Progress'}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                <p className="text-gray-600 mb-4 min-h-[60px]">
                  {hasImage 
                    ? 'Professional tree service completed for Portland homeowner. Full site restoration with debris removal.'
                    : 'Detailed project showcase coming soon. Check back next week!'}
                </p>
                
                {adminMode && !hasImage && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs text-green-800 mb-2 font-medium">Prompt for professional photographer:</p>
                    <p className="text-xs text-gray-700 mb-2 italic">{project.prompt}</p>
                    <button
                      onClick={() => copyPrompt(project.prompt, project.id)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors inline-flex items-center"
                      type="button"
                    >
                      {copiedId === project.id ? (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          Copied!
                        </>
                      ) : (
                        'Copy Prompt'
                      )}
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {hasImage ? (
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                      <span>View Case Study</span>
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                  ) : (
                    <div className="flex-1 bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-center text-sm">
                      Project details coming soon
                    </div>
                  )}
                  
                  {adminMode && (
                    <label className={`flex-1 ${
                      hasImage 
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    } cursor-pointer font-medium py-2 px-4 rounded-lg border transition-colors text-center flex items-center justify-center`}>
                      {uploading === project.id ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </span>
                      ) : (
                        hasImage ? 'Update Photo' : 'Upload Photo'
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, project.id)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {adminMode && (
        <div className="mt-8 bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
            <span className="font-medium">Admin Tip:</span> 
            Upload professional photos with consistent lighting. Use the prompts to get perfect shots from your photographer!
          </div>
        </div>
      )}
    </div>
  );
}

export default function GryscolTreeService() {
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Emergency banner scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setEmergencyVisible(true);
      } else {
        setEmergencyVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking links
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="font-sans bg-gray-50">
      {/* Emergency Banner - appears on scroll */}
      {emergencyVisible && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-fade-down">
          <div className="bg-red-600 text-white py-2 text-center font-medium text-sm">
            <span className="font-bold">EMERGENCY SERVICE:</span> Storm damage? Dangerous tree? 
            <a href="tel:+15035551234" className="underline hover:no-underline mx-1 flex items-center justify-center">
              Call Now: (503) 555-1234
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.04 11.04 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 transition-all duration-300">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3" onClick={closeMobileMenu}>
              <div className="bg-green-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                G
              </div>
              <div>
                <div className="font-bold text-xl text-gray-900">Gryscol Tree Service</div>
                <div className="text-xs text-green-700 font-medium">Portland's Trusted Arborists Since 1998</div>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#services" className="font-medium text-gray-700 hover:text-green-700 transition-colors">Services</Link>
              <Link href="#gallery" className="font-medium text-gray-700 hover:text-green-700 transition-colors">Our Work</Link>
              <Link href="#about" className="font-medium text-gray-700 hover:text-green-700 transition-colors">About</Link>
              <Link href="#reviews" className="font-medium text-gray-700 hover:text-green-700 transition-colors">Reviews</Link>
              <a 
                href="tel:+15035551234" 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transition-colors shadow-md hover:shadow-lg flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.04 11.04 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                (503) 555-1234
              </a>
            </nav>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-700 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t py-4">
            <div className="container mx-auto px-4">
              <div className="flex flex-col space-y-4">
                <Link href="#services" className="font-medium text-gray-700 py-2" onClick={closeMobileMenu}>Services</Link>
                <Link href="#gallery" className="font-medium text-gray-700 py-2" onClick={closeMobileMenu}>Our Work</Link>
                <Link href="#about" className="font-medium text-gray-700 py-2" onClick={closeMobileMenu}>About</Link>
                <Link href="#reviews" className="font-medium text-gray-700 py-2" onClick={closeMobileMenu}>Reviews</Link>
                <a 
                  href="tel:+15035551234" 
                  className="bg-green-600 text-white font-bold py-3 rounded-lg text-center block"
                  onClick={closeMobileMenu}
                >
                  Call Now: (503) 555-1234
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-700 to-emerald-900 text-white pt-24 pb-16 md:pb-24">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Portland's <span className="text-yellow-300">Emergency Tree Service</span> Experts
            </h1>
            <p className="text-xl mb-8 max-w-lg">
              Certified arborists available 24/7 for dangerous trees, storm damage, and emergency removals. 
              Licensed, bonded & insured since 1998.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="tel:+15035551234" 
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 flex items-center justify-center"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.04 11.04 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                Call Immediately: (503) 555-1234
              </a>
              <button 
                onClick={() => document.getElementById('estimate-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/10 hover:bg-white/20 text-white border-2 border-white font-medium text-lg py-4 px-8 rounded-xl backdrop-blur-sm transition-colors"
              >
                Free Estimate
              </button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="font-bold text-2xl">24/7</div>
                <div className="text-sm opacity-90">Emergency Service</div>
              </div>
              <div>
                <div className="font-bold text-2xl">1,200+</div>
                <div className="text-sm opacity-90">Trees Removed</div>
              </div>
              <div>
                <div className="font-bold text-2xl">5.0</div>
                <div className="text-sm opacity-90">Google Rating</div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-4 bg-yellow-400 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                <Image 
                  src="https://images.unsplash.com/photo-1595341888016-a392ef81b7de?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80" 
                  alt="Certified arborist working on large tree in Portland"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-medium">Emergency tree removal in Portland Hills</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="bg-white py-4 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <span className="font-medium text-gray-800">Fully Licensed & Insured</span>
            </div>
            <div className="flex items-center">
              <Image 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/BBB_Accredited_Business_logo.svg/200px-BBB_Accredited_Business_logo.svg.png" 
                alt="BBB Accredited Business" 
                width={40} 
                height={40} 
                className="mr-2"
              />
              <span className="font-medium text-gray-800">BBB Accredited A+ Rating</span>
            </div>
            <div className="flex items-center">
              <svg className="w-8 h-8 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <span className="font-medium text-gray-800">5.0 Star Google Reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section id="services" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional Tree Services for Portland Properties
            </h2>
            <p className="text-xl text-gray-600">
              From emergency removals to routine maintenance, our ISA-certified arborists handle every project with precision and care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Emergency Tree Removal",
                icon: "⚡",
                description: "24/7 emergency service for hazardous trees, storm damage, and fallen trees threatening structures. We respond within 60 minutes.",
                highlight: "Available 24/7 - Call Now"
              },
              {
                title: "Tree Trimming & Pruning",
                icon: "✂️",
                description: "Expert crown reduction, deadwood removal, and structural pruning to improve tree health, safety, and appearance. Certified arborists only.",
                highlight: "ISA Certified Techniques"
              },
              {
                title: "Stump Grinding",
                icon: "🪵",
                description: "Complete stump removal below grade with professional equipment. We handle stumps of any size and restore your landscape seamlessly.",
                highlight: "No Mess Guarantee"
              },
              {
                title: "Tree Health Care",
                icon: "💚",
                description: "Diagnosis and treatment for diseased or declining trees. Fertilization, pest control, and soil management to revitalize your valuable trees.",
                highlight: "Free Health Assessment"
              }
            ].map((service, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="bg-green-50 text-green-800 font-medium py-2 px-4 rounded-full inline-block text-sm">
                  {service.highlight}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={() => document.getElementById('estimate-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-transform transform hover:scale-105"
            >
              Get Your Free Estimate
            </button>
          </div>
        </div>
      </section>

      {/* Gallery Section with Admin Uploads */}
      <section id="gallery" className="py-16 bg-white">
        <GallerySkeleton />
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-800 text-white">
        <div className="container mx-auto px-4 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Portland Homeowners Trust Gryscol for Emergency Tree Service
          </h2>
          <p className="text-xl mb-8 opacity-90">
            When seconds count during a tree emergency, Portland residents call the professionals with the right equipment, training, and local experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+15035551234" 
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 flex items-center justify-center"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.04 11.04 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              Call Immediately: (503) 555-1234
            </a>
            <button 
              onClick={() => document.getElementById('estimate-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white/10 hover:bg-white/20 text-white border-2 border-white font-medium text-lg py-4 px-8 rounded-xl backdrop-blur-sm transition-colors"
            >
              Free Site Assessment
            </button>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { value: "24/7", label: "Emergency Response" },
              { value: "60 min", label: "Avg. Response Time" },
              { value: "$0", label: "Free Estimates" },
              { value: "26 yrs", label: "Portland Experience" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="opacity-85">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              ))}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Portland Homeowners Say
            </h2>
            <p className="text-xl text-gray-600">
              Join over 1,200 satisfied Portland residents who trust Gryscol for their tree service needs
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Michael R.",
                location: "Pearl District, Portland",
                text: "A massive oak tree fell on my garage during last winter's ice storm. Gryscol arrived within 45 minutes at 2AM. Their crew worked through the night to clear the tree, secure my property, and even covered the damaged area with a tarp. Professional, compassionate, and reasonably priced.",
                rating: 5
              },
              {
                name: "Sarah T.",
                location: "Lake Oswego",
                text: "I inherited a property with several overgrown heritage trees. Gryscol's arborist spent two hours assessing each tree, explaining options, and creating a 5-year maintenance plan. They pruned the most dangerous branches immediately and scheduled the rest for fall. Their knowledge of Portland's tree ordinances saved me thousands in potential fines.",
                rating: 5
              },
              {
                name: "David & Lisa M.",
                location: "West Hills, Portland",
                text: "After getting quotes from 4 companies, Gryscol was the only one who didn't try to oversell us. They recommended preserving two healthy trees we thought needed removal, and only removed the truly hazardous one. Their crew was meticulous about cleanup - you couldn't tell they'd been there except for the removed tree. Fair pricing and honest advice.",
                rating: 5
              }
            ].map((review, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 relative"
              >
                <div className="absolute -top-6 left-8 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-800 font-bold text-2xl">"{review.rating}"</span>
                </div>
                <div className="pt-6">
                  <p className="text-gray-600 mb-6 italic">"{review.text}"</p>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="font-bold text-gray-900">{review.name}</div>
                    <div className="text-green-700">{review.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a 
              href="https://g.co/kgs/gryscol-reviews" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-green-700 font-medium hover:text-green-900 transition-colors"
            >
              <span>Read 87 verified reviews on Google</span>
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Estimate Form */}
      <section id="estimate-form" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-green-50 rounded-2xl p-8 md:p-12 shadow-xl border border-green-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Free Tree Service Estimate</h2>
              <p className="text-xl text-gray-600">Get a detailed quote within 2 hours</p>
            </div>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-2 font-medium">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-gray-700 mb-2 font-medium">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="(503) 555-1234"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="address" className="block text-gray-700 mb-2 font-medium">Portland Property Address</label>
                <input 
                  type="text" 
                  id="address" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="123 Main St, Portland, OR 97201"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="service" className="block text-gray-700 mb-2 font-medium">Service Needed</label>
                <select 
                  id="service" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                  required
                >
                  <option value="">Select a service...</option>
                  <option value="emergency">Emergency Tree Removal</option>
                  <option value="trimming">Tree Trimming & Pruning</option>
                  <option value="stump">Stump Grinding</option>
                  <option value="health">Tree Health Assessment</option>
                  <option value="consultation">Free Consultation</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-gray-700 mb-2 font-medium">Additional Details</label>
                <textarea 
                  id="message" 
                  rows={4} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="Describe your tree situation, include any photos if possible..."
                ></textarea>
              </div>
              
              <div className="flex items-start">
                <input 
                  type="checkbox" 
                  id="emergency" 
                  className="mt-1 h-4 w-4 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="emergency" className="ml-2 text-gray-700">
                  This is an <span className="font-bold text-red-600">emergency situation</span> - I need immediate assistance
                </label>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-transform transform hover:scale-[1.02]"
              >
                Get Free Estimate →
              </button>
              
              <p className="text-center text-gray-600 text-sm">
                By submitting, you agree to receive SMS notifications. Message/data rates may apply. 
                We respond to all inquiries within 2 hours during business hours.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                  G
                </div>
                <div className="font-bold text-xl text-white">Gryscol Tree Service</div>
              </div>
              <p className="mb-4 max-w-xs">
                Portland's premier emergency tree service since 1998. Family-owned and operated with 
                certified arborists serving all of Portland and surrounding areas.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-600 transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-600 transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.023.047 1.351.058 3.807.058h.468c2.456 0 2.784-.011 3.807-.058.975-.045 1.504-.207 1.857-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.047-1.023.058-1.351.058-3.807v-.468c0-2.456-.011-2.784-.058-3.807-.045-.975-.207-1.504-.344-1.857-.182-.466-.398-.8-.748-1.15-.35-.35-.683-.566-1.15-.748-.353-.137-.882-.3-1.857-.344-1.054-.048-1.37-.058-4.043-.058z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M12 6.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM12 16a4 4 0 110-8 4 4 0 010 8z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-600 transition-colors">
                  <span className="sr-only">Google</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.545,10.239c0.436,0.113,0.359,0.694-0.073,0.844c-1.652,0.573-3.383,1.185-5.243,1.833c-0.475,0.166-0.718-0.358-0.461-0.766c0.718-1.141,1.723-2.184,2.941-3.104c0.609-0.461,1.111-0.316,0.461,0.161C8.94,9.875,10.171,10,11.419,10.079c1.868,0.12,3.263-0.106,3.263-0.106c0.076,0.383-0.032,0.889-0.348,1.107C12.894,10.602,12.545,10.239,12.545,10.239z M11.998,14.504c-0.478-0.208-1.134-0.221-1.75-0.221c-1.538,0-3.064,0.199-4.583,0.6c-0.755,0.199-0.995-0.358-0.629-0.896c1.519-2.236,3.714-3.924,6.244-5.082c0.374-0.171,0.759,0.03,0.629,0.446C11.039,11.125,10.493,13.037,11.998,14.504z" />
                    <path d="M19.533,9.252c-0.647-0.438-1.791-0.584-2.629-0.584c-0.017,0-0.032,0-0.049,0c-0.597,0-1.179,0.038-1.742,0.115c0.936,0.653,1.549,1.884,1.549,3.347c0,0.447-0.065,0.883-0.188,1.3c0.78,0.267,1.536,0.488,2.261,0.663C21.416,12.902,21.291,10.616,19.533,9.252z" />
                    <path d="M4.643,9.836c-0.085,0-0.172,0.007-0.256,0.007c-1.059,0-2.059,0.252-2.937,0.713c-0.743,0.39-1.385,0.984-1.883,1.728c-0.507,0.759-0.83,1.654-0.94,2.636c-0.118,1.056-0.065,2.112,0.174,3.116c0.236,0.995,0.659,1.929,1.231,2.758c0.685,0.992,1.606,1.82,2.692,2.415c1.194,0.655,2.549,1.024,3.963,1.078c0.967,0.037,1.936-0.048,2.879-0.258c0.473-0.106,0.94-0.234,1.399-0.382c0.269-0.087,0.561-0.289,0.676-0.564c0.103-0.246,0.053-0.532-0.13-0.721c-0.17-0.175-0.432-0.246-0.68-0.193c-0.838,0.18-1.704,0.271-2.585,0.258c-1.339-0.02-2.613-0.365-3.741-1.012c-0.95-0.545-1.739-1.328-2.302-2.27c-0.51-0.854-0.834-1.836-0.945-2.867c-0.123-1.143-0.052-2.28,0.221-3.362c0.271-1.071,0.735-2.055,1.354-2.896c0.309-0.421,0.656-0.799,1.034-1.13c0.175-0.153,0.26-0.381,0.224-0.601C5.438,10.01,5.227,9.853,4.982,9.836C4.868,9.829,4.755,9.836,4.643,9.836z" />
                    <path d="M19.74,14.001c-0.074,0.358-0.313,0.641-0.656,0.727c-1.102,0.276-2.248,0.438-3.418,0.479c-0.555,0.019-1.113-0.002-1.666-0.062c-0.249-0.027-0.506-0.149-0.655-0.349c-0.179-0.239-0.205-0.558-0.066-0.809c0.14-0.253,0.405-0.416,0.694-0.426c0.362-0.013,0.725,0.013,1.085,0.058c1.256,0.156,2.434-0.013,3.448-0.5c0.239-0.116,0.522-0.106,0.741,0.027C19.594,13.275,19.748,13.612,19.74,14.001z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Services</h3>
              <ul className="space-y-2">
                <li><a href="#services" className="hover:text-green-400 transition-colors">Emergency Tree Removal</a></li>
                <li><a href="#services" className="hover:text-green-400 transition-colors">Tree Trimming & Pruning</a></li>
                <li><a href="#services" className="hover:text-green-400 transition-colors">Stump Grinding</a></li>
                <li><a href="#services" className="hover:text-green-400 transition-colors">Tree Health Care</a></li>
                <li><a href="#services" className="hover:text-green-400 transition-colors">Lot Clearing</a></li>
                <li><a href="#services" className="hover:text-green-400 transition-colors">View All Services</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Service Areas</h3>
              <ul className="space-y-2">
                <li><span className="text-green-400 font-medium">Portland Metro:</span> All neighborhoods</li>
                <li>Beaverton</li>
                <li>Lake Oswego</li>
                <li>Tigard</li>
                <li>Tualatin</li>
                <li>West Linn</li>
                <li>Gresham</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.04 11.04 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <span>
                    <div className="font-medium text-white">(503) 555-1234</div>
                    <div>24/7 Emergency Line</div>
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>
                    <div className="font-medium text-white">123 Arbor Lane</div>
                    <div>Portland, OR 97205</div>
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span>
                    <div className="font-medium text-white">info@gryscoltrees.com</div>
                    <div>licensing@gryscoltrees.com</div>
                  </span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Gryscol Tree Service. All rights reserved. 
              <span className="block mt-1 text-xs text-gray-500">
                Oregon Landscape Contractors Board License #12345 | CCB# 123456 | Fully Insured
              </span>
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="hover:text-green-400 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-green-400 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-green-400 transition-colors">Sitemap</Link>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
            <p>
              This website was designed and built by{' '}
              <span className="text-green-400 font-medium hover:text-green-300 transition-colors cursor-pointer">
                CheapWebsites & Apps
              </span>
              {' '}– specialists in fast, affordable websites for small businesses.{' '}
              <button 
                onClick={() => alert('This is a demo! Contact CheapWebsites & Apps to build your site.')}
                className="underline hover:text-green-400 transition-colors"
              >
                Get your own website like this
              </button>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}