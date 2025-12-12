'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin user ID
const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';

// Tree-care specific artwork prompts
const PORTFOLIO_ITEMS = [
  { 
    id: 'emergency-removal', 
    title: 'Emergency Storm Removal',
    prompt: 'Dramatic but safe tree removal after a Pacific Northwest storm in Portland—arborists in rain gear working at dawn, wet streets, healthy green trees in background, focus on professionalism and speed.'
  },
  { 
    id: 'precision-pruning', 
    title: 'Precision Crown Reduction',
    prompt: 'Arborist meticulously pruning a mature Douglas fir in a Portland backyard, golden hour lighting, visible care for property (tarps, clean cuts), happy homeowner watching from deck.'
  },
  { 
    id: 'stump-grinding', 
    title: 'Clean Stump Grinding',
    prompt: 'High-detail close-up of stump grinding in a manicured Portland garden—fresh wood chips, clean lawn edges, no mess. Emphasize tidiness and respect for client’s space.'
  },
  { 
    id: 'disease-treatment', 
    title: 'Disease Diagnosis & Care',
    prompt: 'Arborist examining a sick maple tree in SE Portland, using diagnostic tools, autumn leaves on ground. Warm, trustworthy mood—focus on expertise and care, not destruction.'
  },
  { 
    id: 'view-enhancement', 
    title: 'View Restoration Pruning',
    prompt: 'Before/after style: dense overgrown trees blocking Mt. Hood view vs. artfully thinned canopy revealing mountain vista from a West Hills home. Pacific Northwest aesthetic.'
  },
  { 
    id: 'young-tree-care', 
    title: 'Young Tree Structural Pruning',
    prompt: 'Arborist gently training a young redwood sapling in a Portland schoolyard, spring sunlight, kids playing in distance. Emphasize sustainability and future growth.'
  },
];

type PortfolioItem = { [key: string]: { image_url: string | null } };

export default function Home() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Load portfolio images
  useEffect(() => {
    const loadImages = async () => {
      const { data: images } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID);

      const initialState: PortfolioItem = {};
      PORTFOLIO_ITEMS.forEach(item => initialState[item.id] = { image_url: null });

      if (images) {
        PORTFOLIO_ITEMS.forEach(item => {
          const match = images.find(img => img.path.includes(`/${item.id}/`));
          if (match) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(match.path).data.publicUrl;
            initialState[item.id] = { image_url: url };
          }
        });
      }

      setPortfolioItems(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(itemId);
    try {
      const filePath = `${ADMIN_USER_ID}/${itemId}/${Date.now()}_${file.name}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setPortfolioItems(prev => ({ ...prev, [itemId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, itemId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-emerald-900 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Gryscol Tree Care</h1>
            <p className="text-emerald-200 text-sm">Portland’s Trusted Arborists Since 2012</p>
          </div>
          <div className="hidden md:block">
            <a href="tel:+15035551234" className="bg-white text-emerald-900 px-4 py-2 rounded-lg font-bold hover:bg-emerald-50 transition">
              (503) 555-1234
            </a>
          </div>
          <button 
            className="md:hidden text-white" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-emerald-800 px-4 py-3">
            <a href="tel:+15035551234" className="block bg-white text-emerald-900 px-4 py-2 rounded-lg font-bold text-center mb-2">
              Call Now: (503) 555-1234
            </a>
            <nav className="flex flex-col space-y-2">
              <a href="#services" className="text-emerald-200 hover:text-white">Services</a>
              <a href="#portfolio" className="text-emerald-200 hover:text-white">Our Work</a>
              <a href="#contact" className="text-emerald-200 hover:text-white">Contact</a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Problem/Solution + Trust */}
        <section className="bg-gradient-to-br from-emerald-50 to-white py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-4">
                Portland, Your Trees Deserve Expert Care—<span className="text-emerald-700">Without the Premium Price</span>
              </h1>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Licensed, insured, and local. We handle emergencies, pruning, removals, and health diagnostics—fast, clean, and fairly priced.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <div className="bg-white p-3 rounded-lg shadow-sm flex items-center">
                <span className="text-emerald-600 font-bold mr-2">✓</span>
                <span>ISA Certified Arborists</span>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm flex items-center">
                <span className="text-emerald-600 font-bold mr-2">✓</span>
                <span>$2M Liability Insured</span>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm flex items-center">
                <span className="text-emerald-600 font-bold mr-2">✓</span>
                <span>Serving All Portland Neighborhoods</span>
              </div>
            </div>

            {/* Primary CTA */}
            <div className="text-center">
              <a 
                href="tel:+15035551234" 
                className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white text-xl font-bold px-8 py-4 rounded-lg shadow-lg transition transform hover:scale-105"
              >
                Call for Same-Day Service: (503) 555-1234
              </a>
              <p className="mt-2 text-gray-600">Free Estimates • 24/7 Storm Response</p>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-2xl font-bold text-center mb-8 text-emerald-900">Trusted by Portland Homeowners & Businesses</h2>
            <div className="flex flex-wrap justify-center gap-8 mb-10">
              {['Forest Park Homeowners', 'Hawthorne District', 'Pearl Condos', 'Sellwood Gardens', 'St. Johns Plaza'].map((client) => (
                <div key={client} className="bg-white p-4 rounded shadow-sm min-w-[120px] flex items-center justify-center">
                  <span className="text-gray-700 font-medium text-center">{client}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-700 italic">"Gryscol saved our heritage oak after the ice storm. Fast, clean, and fair pricing. They even hauled away every chip!"</p>
                <p className="font-bold mt-4">— Sarah K., SE Portland</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-700 italic">"As a property manager, I need reliable vendors. Gryscol’s team is professional, on-time, and leaves sites spotless."</p>
                <p className="font-bold mt-4">— Marcus T., Pearl District</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-4 text-emerald-900">Our Tree Care Services</h2>
            <p className="text-gray-700 text-center max-w-2xl mx-auto mb-10">
              From emergency storm response to routine health care—we keep Portland’s urban forest thriving.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Emergency Tree Removal', desc: '24/7 response for storm damage, leaning trees, or hazardous limbs. We prioritize safety and speed.' },
                { title: 'Precision Pruning', desc: 'Crown reduction, thinning, and view enhancement—done right to extend tree life and beauty.' },
                { title: 'Tree Health Diagnostics', desc: 'Identify disease, pests, or soil issues early. We prescribe organic, effective treatments.' },
                { title: 'Stump Grinding', desc: 'Full removal down to 12" below grade. Clean, efficient, and ready for your next project.' },
                { title: 'Planting & Young Tree Care', desc: 'Select the right species for your space. We install and train for decades of healthy growth.' },
                { title: 'Lot Clearing', desc: 'Residential or commercial overgrowth? We clear responsibly, preserving healthy trees.' },
              ].map((service, i) => (
                <div key={i} className="border border-emerald-100 p-6 rounded-lg hover:shadow-md transition">
                  <h3 className="font-bold text-xl text-emerald-800 mb-2">{service.title}</h3>
                  <p className="text-gray-700">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio - Integrated GallerySkeleton */}
        <section id="portfolio" className="py-12 bg-emerald-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-4 text-emerald-900">Real Work in Portland Neighborhoods</h2>
            <p className="text-gray-700 text-center max-w-2xl mx-auto mb-8">
              See how we transformed these properties. <span className="font-medium">All photos taken by our team.</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PORTFOLIO_ITEMS.map((item) => {
                const imageUrl = portfolioItems[item.id]?.image_url;

                return (
                  <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-sm flex flex-col h-full">
                    {/* Image */}
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={item.title} 
                        className="w-full h-56 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Work in progress</span>
                      </div>
                    )}

                    {/* Admin Controls */}
                    {adminMode && (
                      <div className="p-3 border-t border-gray-200 space-y-2">
                        {!imageUrl && (
                          <div className="flex flex-col gap-2">
                            <p className="text-xs text-emerald-700">{item.prompt}</p>
                            <button
                              onClick={() => copyPrompt(item.prompt, item.id)}
                              className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-1 rounded self-start"
                              type="button"
                            >
                              {copiedId === item.id ? 'Copied!' : 'Copy Prompt'}
                            </button>
                          </div>
                        )}
                        <label className="block text-sm bg-emerald-700 text-white px-3 py-1.5 rounded cursor-pointer inline-block w-fit">
                          {uploading === item.id ? 'Uploading…' : 'Upload Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, item.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {/* Title */}
                    <div className="p-4 mt-auto">
                      <h3 className="font-semibold text-emerald-900">{item.title}</h3>
                    </div>
                  </div>
                );
              })}
            </div>

            {adminMode && (
              <div className="mt-6 p-3 bg-emerald-100 border border-emerald-300 rounded text-sm text-emerald-800">
                👤 Admin mode: Upload real job photos. Prompts are tailored for tree care visuals.
              </div>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section id="contact" className="py-16 bg-emerald-900 text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Care for Your Trees?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Get a free, no-pressure estimate. We respond within 2 hours during business hours.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="tel:+15035551234" 
                className="bg-white text-emerald-900 font-bold px-8 py-4 rounded-lg text-lg hover:bg-emerald-50 transition"
              >
                Call Now: (503) 555-1234
              </a>
              <a 
                href="mailto:hello@gryscoltrees.com" 
                className="bg-emerald-800 hover:bg-emerald-700 font-bold px-8 py-4 rounded-lg text-lg transition"
              >
                Email Us
              </a>
            </div>
            <p className="mt-6 text-emerald-200">
              Serving: Portland, Beaverton, Gresham, Lake Oswego & Vancouver, WA
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Gryscol Tree Care</h3>
              <p>Professional, affordable tree services for Portland since 2012.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <p>(503) 555-1234</p>
              <p>hello@gryscoltrees.com</p>
              <p>Licensed & Insured | CCB# 123456</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Service Areas</h4>
              <p>Portland • Beaverton • Gresham • Lake Oswego • Vancouver, WA</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-sm">
            <p>© {new Date().getFullYear()} Gryscol Tree Care.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}