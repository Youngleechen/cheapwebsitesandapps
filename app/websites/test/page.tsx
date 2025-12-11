// app/page.tsx
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { GallerySkeleton } from './gallery-skeleton'; // Your component

const inter = Inter({ subsets: ['latin'] });

// Real business data - no generic placeholders
const SERVICES = [
  {
    title: "Emergency Storm Response",
    description: "24/7 certified arborists on call for fallen trees & hazardous limbs. We bill insurance directly.",
    icon: "⚡"
  },
  {
    title: "Precision Tree Trimming",
    description: "Health-focused pruning by ISA-certified specialists. Save your mature trees with proper canopy management.",
    icon: "✂️"
  },
  {
    title: "Stump Elimination",
    description: "Grinding to 18\" depth with zero landscape damage. Same-day cleanup included.",
    icon: "🪵"
  }
];

const TESTIMONIALS = [
  {
    quote: "They saved our 80-year-old heritage oak after the hailstorm. Insurance covered 100% and they handled all paperwork.",
    author: "Mark T., Historic Boulder Homeowner",
    rating: 5
  },
  {
    quote: "Removed a dangerous Ponderosa pine leaning over my kids' play area in 3 hours flat. Their crew treated my yard like their own.",
    author: "Sarah L., Table Mesa Resident",
    rating: 5
  }
];

const LOCAL_BADGES = [
  "Boulder Chamber of Commerce",
  "Colorado Tree Coalition Partner",
  "Fully Insured ($2M Coverage)",
  "ISA Certified Arborists on Staff"
];

export default function Home() {
  return (
    <main className={`${inter.className} bg-gradient-to-b from-[#f8f9fa] to-[#e9ecef] text-gray-800`}>
      {/* Trust Header - visible on all screens */}
      <div className="bg-emerald-800 text-emerald-50 text-sm py-2 text-center">
        <div className="max-w-6xl mx-auto px-4">
          🌲 Boulder's #1 Rated Tree Service | Fully Licensed & Insured | Free On-Site Estimates
        </div>
      </div>

      {/* Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-700 text-white p-2 rounded-lg">
              <span className="text-2xl font-bold">🌲</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-emerald-900">Summit Tree Care</h1>
              <p className="text-xs text-gray-500">Boulder, CO Since 2008</p>
            </div>
          </div>
          <nav className="hidden md:flex space-x-8 font-medium">
            {['Services', 'Gallery', 'Insurance', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-emerald-800 hover:text-emerald-600 transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <button className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md">
            (720) 555-0198
          </button>
        </div>
      </header>

      {/* Hero Section - conversion optimized */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
              Boulder's Trusted Tree Experts
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Certified Tree Care That <span className="text-emerald-700">Protects Your Property</span>
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-xl">
              Family-owned arborists serving Boulder County with emergency response, precision pruning, and complete tree removal since 2008.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Free Estimate →
              </button>
              <button className="border-2 border-emerald-700 bg-white text-emerald-800 font-bold py-4 px-8 rounded-lg text-lg hover:bg-emerald-50 transition-colors">
                Emergency Service
              </button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4">
              {LOCAL_BADGES.map((badge, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-emerald-600">✓</span>
                  <span className="text-sm text-gray-700">{badge}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-2xl shadow-xl overflow-hidden border-4 border-white">
              <img 
                src="https://images.unsplash.com/photo-1541746972997-bc9ad4c67e07?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Certified arborists working on mature tree in Boulder landscape"
                className="w-full h-auto"
                width={600}
                height={400}
                priority
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 max-w-xs">
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-400">★</span>
                ))}
                <span className="ml-2 font-bold text-emerald-800">4.9 (287)</span>
              </div>
              <p className="text-gray-700 text-sm italic">"These guys saved our heritage oak after the microburst!" - Jen K., Mapleton Hill</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional Tree Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Certified arborists using eco-friendly practices to protect your landscape investment
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {SERVICES.map((service, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow border border-gray-100">
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-bold text-emerald-900 mb-3">{service.title}</h3>
                <p className="text-gray-700 mb-4">{service.description}</p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2 mt-1">✓</span>
                    {index === 0 ? "Immediate response guarantee" : index === 1 ? "Preservation-focused techniques" : "No hidden cleanup fees"}
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2 mt-1">✓</span>
                    {index === 0 ? "Dedicated storm team" : index === 1 ? "Disease prevention included" : "Grass restoration guarantee"}
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Gallery - using your system */}
      <section id="gallery" className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Boulder Property Transformations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real results from our certified arborist team. Admins: Upload project photos using the controls below.
            </p>
          </div>
          
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-200 border-2 border-dashed rounded-xl h-80 animate-pulse"></div>
              ))}
            </div>
          }>
            <GallerySkeletonCustom />
          </Suspense>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-emerald-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Boulder Homeowners Trust Us With Their Legacy Trees</h2>
          <p className="text-emerald-100 text-lg mb-12 max-w-2xl mx-auto">
            We've maintained relationships with 78% of our clients for over 5 years through transparent pricing and tree health commitment.
          </p>
          
          <div className="space-y-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 max-w-2xl mx-auto border border-emerald-800">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-amber-300 text-2xl">★</span>
                  ))}
                </div>
                <blockquote className="text-xl italic text-emerald-50 mb-6">
                  "{testimonial.quote}"
                </blockquote>
                <p className="font-bold text-white">— {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-emerald-700 to-emerald-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Your Trees Deserve Expert Care
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get a free on-site evaluation with our ISA-certified arborist. We'll provide transparent pricing and a preservation-focused plan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Your Boulder address"
              className="px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-md">
              Get Free Estimate
            </button>
          </div>
          <p className="mt-4 text-emerald-200 text-sm">
            We respond within 2 hours • Fully insured • Senior discounts available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-emerald-800 text-white p-2 rounded-lg">
                <span className="text-2xl font-bold">🌲</span>
              </div>
              <h3 className="font-bold text-xl text-white">Summit Tree Care</h3>
            </div>
            <p className="mb-4">
              Family-owned arborists serving Boulder County since 2008 with certified expertise and eco-conscious practices.
            </p>
            <div className="flex space-x-4">
              {[...Array(4)].map((_, i) => (
                <a key={i} href="#" className="text-emerald-400 hover:text-white transition-colors">
                  <span className="sr-only">Social media link</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Services</h4>
            <ul className="space-y-2">
              {SERVICES.map((service, index) => (
                <li key={index}>
                  <a href="#" className="hover:text-white transition-colors flex items-start">
                    <span className="text-emerald-400 mr-2 mt-1">→</span>
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Coverage Areas</h4>
            <ul className="space-y-2">
              {['Boulder', 'Louisville', 'Superior', 'Lafayette', 'Nederland', 'Eldorado Springs'].map((area) => (
                <li key={area}>
                  <a href="#" className="hover:text-white transition-colors flex items-start">
                    <span className="text-emerald-400 mr-2 mt-1">✓</span>
                    {area}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Contact</h4>
            <address className="not-italic space-y-3">
              <div className="flex items-start">
                <span className="text-emerald-400 mr-3 mt-1">📍</span>
                <span>1850 28th St, Boulder, CO 80301</span>
              </div>
              <div className="flex items-center">
                <span className="text-emerald-400 mr-3">📞</span>
                <a href="tel:7205550198" className="hover:text-white transition-colors">(720) 555-0198</a>
              </div>
              <div className="flex items-center">
                <span className="text-emerald-400 mr-3">✉️</span>
                <a href="mailto:care@summittreecare.co" className="hover:text-white transition-colors">care@summittreecare.co</a>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-sm">Colorado State License # TREE-2008-BDR</p>
                <p className="text-sm">Insurance Certificate Available Upon Request</p>
              </div>
            </address>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center text-sm">
          <p>© {new Date().getFullYear()} Summit Tree Care. All rights reserved. Proudly serving Boulder County's urban forest since 2008.</p>
          <p className="text-gray-500 mt-2">ISA Certified Arborists • Colorado Tree Coalition Partner • Boulder Green Business Certified</p>
        </div>
      </footer>
    </main>
  );
}

// Customized GallerySkeleton for tree service projects
function GallerySkeletonCustom() {
  // Repurposed for tree service projects
  const TREE_PROJECTS = [
    { 
      id: 'heritage-oak-rescue', 
      title: '80-Year-Old Heritage Oak Rescue',
      prompt: 'Before and after photos of a massive heritage oak tree restoration after hail damage in Boulder. Show certified arborists using cabling techniques, healthy regrowth after 1 year, and the preserved tree structure. Include subtle Colorado Front Range mountains in background.'
    },
    { 
      id: 'emergency-pine-removal', 
      title: 'Emergency Ponderosa Pine Removal',
      prompt: 'Dramatic photo sequence of a 60ft Ponderosa pine removal over a historic Boulder home during storm response. Show specialized crane operation, protective ground mats, and meticulous cleanup. Include worried homeowner transformed to relieved in final frame.'
    },
    { 
      id: 'downtown-landscaping', 
      title: 'Pearl Street Mall Tree Preservation',
      prompt: 'Urban tree care project showing root pruning and soil aeration for mature trees along Boulder\'s Pearl Street Mall. Highlight eco-friendly equipment, pedestrian safety barriers, and healthy canopy restoration. Capture local foot traffic and vibrant downtown atmosphere.'
    }
  ];

  return (
    <GallerySkeleton 
      artworks={TREE_PROJECTS}
      className="bg-white rounded-xl shadow-md overflow-hidden"
      adminMessage="Admins: Upload project photos using the controls below. Use the prompts for consistent, professional imagery."
    />
  );
}

// Modified GallerySkeleton to accept custom props
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';

export function GallerySkeleton({ 
  artworks = [], 
  className = "",
  adminMessage = "Admin mode active — you can upload images and copy detailed prompts."
}: { 
  artworks?: { id: string; title: string; prompt: string }[];
  className?: string;
  adminMessage?: string;
}) {
  const [artworksState, setArtworksState] = useState<{ [key: string]: { image_url: string | null } }>({});
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

      const initialState: { [key: string]: { image_url: string | null } } = {};
      artworks.forEach(art => initialState[art.id] = { image_url: null });

      if (images) {
        artworks.forEach(art => {
          const match = images.find(img => img.path.includes(`/${art.id}/`));
          if (match) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(match.path).data.publicUrl;
            initialState[art.id] = { image_url: url };
          }
        });
      }

      setArtworksState(initialState);
    };

    if (artworks.length > 0) loadImages();
  }, [artworks]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(artworkId);
    try {
      const filePath = `${ADMIN_USER_ID}/${artworkId}/${Date.now()}_${file.name}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setArtworksState(prev => ({ ...prev, [artworkId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
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
    <div className={`relative ${className}`}>
      {adminMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-100 text-xs px-3 py-1 rounded-full z-10 backdrop-blur-sm">
          ADMIN MODE
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artworks.map((art) => {
          const imageUrl = artworksState[art.id]?.image_url;

          return (
            <div key={art.id} className="bg-gray-50 rounded-xl overflow-hidden flex flex-col border border-gray-100 transition-all hover:shadow-lg">
              <div className="h-64 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={art.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-5xl mb-2">🌲</div>
                    <p className="text-gray-500 font-medium">{art.title}</p>
                    <p className="text-xs text-gray-400 mt-1">Project showcase</p>
                  </div>
                )}
              </div>

              {adminMode && (
                <div className="p-3 border-t border-gray-100 bg-gray-50 space-y-2">
                  {!imageUrl && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-emerald-800/80 bg-emerald-50 p-2 rounded">{art.prompt}</p>
                      <button
                        onClick={() => copyPrompt(art.prompt, art.id)}
                        className={`text-xs ${
                          copiedId === art.id 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        } px-2 py-1 rounded self-start transition-colors`}
                        type="button"
                      >
                        {copiedId === art.id ? 'Copied!' : 'Copy Project Prompt'}
                      </button>
                    </div>
                  )}
                  <label className={`block text-sm ${
                    uploading === art.id 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } text-white px-3 py-2 rounded cursor-pointer text-center transition-colors`}>
                    {uploading === art.id ? 'Uploading...' : 'Upload Project Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, art.id)}
                      className="hidden"
                      disabled={uploading === art.id}
                    />
                  </label>
                </div>
              )}

              <div className="p-4 pt-2 mt-auto">
                <h3 className="font-bold text-lg text-gray-800">{art.title}</h3>
                <p className="text-emerald-700 font-medium mt-1">Boulder, CO Project</p>
              </div>
            </div>
          );
        })}
      </div>

      {adminMode && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          {adminMessage}
        </div>
      )}
    </div>
  );
}