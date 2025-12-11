// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin user ID (matches your system)
const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';

// Portfolio items for tree service websites
const PORTFOLIO_ITEMS = [
  { 
    id: 'portland-tree-pros', 
    title: 'Portland Tree Pros',
    prompt: 'Professional website for a Portland tree service: Clean green/earth tone color scheme, hero section with arborist climbing a heritage oak tree at sunrise, prominent emergency storm service callout, service area map showing Multnomah County coverage, before/after slider of hazardous tree removal, client testimonials with verified Google review badges, and a sticky "Call Now" button with phone number at bottom.'
  },
  { 
    id: 'evergreen-removal', 
    title: 'Evergreen Tree Removal',
    prompt: 'Modern mobile-first site for Vancouver WA tree company: Hero video background of crane-assisted tree removal operation, emergency storm damage banner with countdown timer for same-day service, interactive service calculator ("Get Instant Estimate"), ISA-certified arborist bios with credentials, and embedded Google Maps showing 5-star reviews. Color palette: forest green, charcoal, and safety orange accents.'
  },
  { 
    id: 'cascadia-stump', 
    title: 'Cascadia Stump Grinding',
    prompt: 'Specialized stump grinding service website: Split-screen hero showing before/after stump removal on residential lawn, animated equipment diagrams explaining the grinding process, service area tabs for Portland metro neighborhoods, seasonal discount pop-up for spring cleanup, and emergency contact form with photo upload field for damage assessment. Style: earthy browns with vibrant green CTAs.'
  },
];

type PortfolioItem = { [key: string]: { image_url: string | null } };

export default function Home() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Check admin session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || null;
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

  // Handle portfolio image upload
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

      // Upsert to avoid duplicate entries
      const { error: dbErr } = await supabase
        .from('images')
        .upsert({ user_id: ADMIN_USER_ID, path: filePath }, { onConflict: 'path' });
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

  // Copy AI prompt to clipboard
  const copyPrompt = (prompt: string, itemId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="font-sans bg-gradient-to-b from-slate-50 to-white text-slate-900 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-green-700 text-white p-2 rounded-lg">
              <TreeIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-green-800">CheapWebsites & Apps</h1>
              <p className="text-xs text-slate-500">Professional sites for local businesses</p>
            </div>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#portfolio" className="font-medium hover:text-green-700 transition">Portfolio</a>
            <a href="#services" className="font-medium hover:text-green-700 transition">Services</a>
            <a href="#process" className="font-medium hover:text-green-700 transition">Process</a>
            <a href="#contact" className="font-medium hover:text-green-700 transition">Contact</a>
          </div>
          <button 
            onClick={() => setShowChat(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Get Quote
          </button>
        </div>
      </header>

      {/* Hero Section - Focused on Tree Service Example */}
      <section className="pt-24 pb-16 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 mb-12 lg:mb-0">
            <div className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              FAST • AFFORDABLE • LOCAL
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
              Websites That <span className="text-green-700">Grow Your Tree Service Business</span>
            </h1>
            <p className="text-xl text-slate-700 mb-8 max-w-2xl">
              Get a professional, mobile-friendly website built in 72 hours that captures leads and showcases your ISA-certified expertise. Starting at $499.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setShowChat(true)}
                className="bg-green-600 hover:bg-green-700 text-white text-lg font-bold px-8 py-4 rounded-xl transition transform hover:scale-105 shadow-lg"
              >
                Get Free Quote →
              </button>
              <button className="bg-white border-2 border-green-200 text-green-700 px-8 py-4 rounded-xl font-medium hover:bg-green-50 transition">
                See Portfolio
              </button>
            </div>
            <div className="mt-12 flex items-center">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="bg-green-600 border-2 border-white rounded-full w-10 h-10"></div>
                ))}
              </div>
              <p className="ml-4 font-medium text-slate-700">
                Trusted by 127+ Pacific NW tree services
              </p>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-green-100">
              {/* Placeholder for portfolio image - shows first portfolio item */}
              {portfolioItems['portland-tree-pros']?.image_url ? (
                <Image 
                  src={portfolioItems['portland-tree-pros'].image_url} 
                  alt="Portland Tree Pros website example"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                />
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 h-[400px] flex flex-col justify-center items-center text-center">
                  <TreeIcon className="w-16 h-16 text-green-400 mb-4" />
                  <p className="text-slate-500 font-medium">Professional website preview will appear here</p>
                  {adminMode && (
                    <p className="text-xs text-green-600 mt-2">Upload portfolio images in admin mode below</p>
                  )}
                </div>
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-xl shadow-lg border border-green-100 max-w-xs">
              <div className="flex items-start">
                <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded mr-3 mt-1">NEW</div>
                <div>
                  <p className="font-bold text-green-900">Emergency Storm Service Page</p>
                  <p className="text-sm text-slate-600 mt-1">Built for Dave's Tree Surgeons after the 2023 Portland ice storm - generated 37 emergency calls in first week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Tree Services Choose Us</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We specialize in websites that convert visitors into emergency service calls and scheduled consultations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="w-8 h-8 text-green-600" />,
                title: "72-Hour Launch",
                desc: "Go live before your competitor even gets a quote. We use pre-built industry-specific templates customized for your service area and specialties."
              },
              {
                icon: <Smartphone className="w-8 h-8 text-green-600" />,
                title: "Mobile-First Design",
                desc: "87% of emergency tree service searches happen on phones. Your site loads in <1s with click-to-call buttons on every screen."
              },
              {
                icon: <DollarSign className="w-8 h-8 text-green-600" />,
                title: "Transparent Pricing",
                desc: "No retainers or hidden fees. Complete website with hosting, SEO basics, and 30 days support for $499. Emergency landing pages from $199."
              }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition">
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section with Admin Integration */}
      <section id="portfolio" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Real Results for Local Businesses</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Websites we've built for Pacific Northwest tree services and land care companies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PORTFOLIO_ITEMS.map((item) => {
              const imageUrl = portfolioItems[item.id]?.image_url;
              const isAdminItem = adminMode;

              return (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition ${
                    isAdminItem ? 'border-2 border-green-200' : 'border border-slate-200'
                  }`}
                >
                  <div className="h-64 bg-slate-100 relative">
                    {imageUrl ? (
                      <Image 
                        src={imageUrl} 
                        alt={item.title} 
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-green-50 p-3 rounded-full mb-4">
                          <TreeIcon className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="font-medium text-slate-700 mb-2">Website Preview</p>
                        <p className="text-sm text-slate-500">{item.title}</p>
                      </div>
                    )}
                    
                    {isAdminItem && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow">
                        Admin Mode
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-xl text-slate-900">{item.title}</h3>
                      {isAdminItem && (
                        <div className="relative group">
                          <button 
                            onClick={() => copyPrompt(item.prompt, item.id)}
                            className="text-green-600 hover:text-green-800 transition p-1"
                            title="Copy AI prompt"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                          {copiedId === item.id && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap">
                              Copied!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-slate-600 mb-4 flex-1">
                      {isAdminItem 
                        ? "AI prompt for generating this website concept:"
                        : "Complete website delivered in 68 hours with emergency service landing pages and Google Business integration"
                      }
                    </p>
                    
                    {isAdminItem && (
                      <div className="mt-auto pt-3 border-t border-slate-100">
                        <p className="text-xs bg-green-50 text-green-800 p-2 rounded mb-3 break-words">
                          {item.prompt}
                        </p>
                        <label className="block w-full bg-green-600 hover:bg-green-700 text-white text-center px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition">
                          {uploading === item.id ? 'Uploading...' : 'Replace Preview'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, item.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                    
                    {!isAdminItem && (
                      <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-green-700">$499</p>
                          <p className="text-xs text-slate-500">Full website package</p>
                        </div>
                        <button 
                          onClick={() => setShowChat(true)}
                          className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-green-200 transition"
                        >
                          See Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {adminMode && (
            <div className="mt-12 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-800 font-medium flex items-center justify-center">
                <Shield className="w-5 h-5 mr-2" />
                Admin Mode Active: Upload portfolio images and copy AI prompts
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our 3-Step Process</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              How we deliver professional websites faster than traditional agencies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-1/4 right-3/4 h-1 bg-green-200 transform -translate-y-1/2"></div>
            
            {[
              {
                step: 1,
                title: "Strategy Call (15 min)",
                desc: "We discuss your service area, specialties, and emergency service needs. No sales pitch - just actionable recommendations.",
                icon: <Phone className="w-12 h-12 text-white" />
              },
              {
                step: 2,
                title: "Content Collection",
                desc: "Send us your logo, photos, and service details via our simple form. We handle the rest - no technical skills needed.",
                icon: <Upload className="w-12 h-12 text-white" />
              },
              {
                step: 3,
                title: "Launch & Train",
                desc: "We launch your site and teach you how to update pricing or emergency notices through an easy dashboard.",
                icon: <Rocket className="w-12 h-12 text-white" />
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-green-700 rounded-full w-8 h-8 absolute -top-4 left-1/2 transform -translate-x-1/2 md:-translate-x-0 md:left-0 flex items-center justify-center text-white font-bold z-10">
                  {item.step}
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg h-full border border-slate-200 hover:border-green-300 transition">
                  <div className="bg-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 relative">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 font-bold text-sm px-4 py-1 rounded-full">
              Real Client Result
            </div>
            <QuoteIcon className="w-12 h-12 text-green-200 mx-auto mb-6" />
            <blockquote className="text-2xl font-bold text-slate-900 mb-6">
              "Our new website generated $18,000 in new business during the first ice storm after launch. The emergency service page alone brought in 22 calls in 48 hours."
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-slate-200 border-2 border-dashed rounded-xl w-16 h-16"></div>
              <div className="text-left">
                <p className="font-bold text-lg">Dave Wilson</p>
                <p className="text-slate-600">Owner, Dave's Tree Surgeons</p>
                <div className="flex mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star className="w-5 h-5 text-amber-400" key={i} />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => setShowChat(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition"
              >
                Get Your Free Quote
              </button>
              <button className="bg-white border-2 border-green-200 text-green-700 font-medium py-3 px-6 rounded-xl hover:bg-green-50 transition">
                View Case Study
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
            Ready for More Tree Service Calls?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Get a professional website that works 24/7 to capture emergency leads and showcase your expertise
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => setShowChat(true)}
              className="bg-white text-green-800 font-bold text-lg px-8 py-4 rounded-xl hover:bg-green-50 transition transform hover:scale-105 shadow-lg"
            >
              Start Your Project →
            </button>
            <button className="bg-green-800 hover:bg-green-900 text-white font-medium px-8 py-4 rounded-xl transition">
              Call: (503) 555-0199
            </button>
          </div>
          <p className="mt-6 text-green-200 max-w-2xl mx-auto">
            100% money-back guarantee if your site doesn't generate at least 5 new leads in the first 30 days
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-700 text-white p-2.5 rounded-lg">
                  <TreeIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xl text-white">CheapWebsites & Apps</h3>
              </div>
              <p className="mb-4">
                Fast, affordable websites for local service businesses that need leads yesterday.
              </p>
              <div className="flex space-x-4">
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center">
                    <span className="text-slate-400 font-bold">{i}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Services</h4>
              <ul className="space-y-2">
                {['Tree Service Websites', 'Emergency Landing Pages', 'Google Business Setup', 'SEO for Local Services'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Industries</h4>
              <ul className="space-y-2">
                {['Tree Services', 'Landscapers', 'Roofers', 'HVAC Companies', 'Electricians', 'Pet Services'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <MapPin className="w-5 h-5 text-green-400 mt-1 mr-3 flex-shrink-0" />
                  <span>123 Startup Ave, Portland, OR 97201</span>
                </li>
                <li className="flex items-start">
                  <Phone className="w-5 h-5 text-green-400 mt-1 mr-3 flex-shrink-0" />
                  <span>(503) 555-0199</span>
                </li>
                <li className="flex items-start">
                  <Mail className="w-5 h-5 text-green-400 mt-1 mr-3 flex-shrink-0" />
                  <span>hello@cheapwebsites.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500">
            <p>© {new Date().getFullYear()} CheapWebsites & Apps. Built for real businesses in the Pacific Northwest.</p>
            <p className="mt-2 text-xs">
              Sites built with Next.js • Supabase • Tailwind CSS • Vercel
            </p>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      {showChat && (
        <div 
          className="fixed bottom-6 right-6 z-50 animate-fade-in-up"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-96 border border-green-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <TreeIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Website Quote Bot</h3>
                  <p className="text-green-100 text-sm">Typically responds in 2 minutes</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChat(false)}
                className="text-white hover:text-green-100 transition"
                aria-label="Close chat"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 h-80 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 max-w-[85%]">
                    <p className="font-medium">Hi there! I'm TreeBot. Ready to get more tree service calls?</p>
                    <p className="text-xs text-slate-500 mt-1">Today</p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 max-w-[85%]">
                    <p>Hi! We need a new website for our Portland tree service business.</p>
                    <p className="text-xs text-slate-500 mt-1">You • 2 min ago</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 max-w-[85%]">
                    <p className="font-medium">Great! I can help with that. To get started:</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-slate-700">
                      <li>What's your business name?</li>
                      <li>Primary service area (city/county)?</li>
                      <li>Do you offer emergency storm services?</li>
                    </ol>
                    <p className="text-xs text-slate-500 mt-2">Today</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-3 border-t border-slate-200">
              <div className="flex items-center bg-slate-100 rounded-xl px-4 py-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none"
                />
                <button className="text-green-600 hover:text-green-700 transition">
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                We'll email your custom quote within 1 business day
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Mode Notification */}
      {adminMode && !showChat && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-3">
            <Shield className="w-5 h-5" />
            <span>Admin Mode Active - Upload portfolio images below</span>
          </div>
        </div>
      )} 
    </div>
  );
}

// SVG Icons
const TreeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const MessageCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Smartphone = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const DollarSign = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Check = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const Copy = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

const Shield = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const Phone = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const Upload = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const Rocket = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const QuoteIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

const Star = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.47 3.84a.5.5 0 011.06 0l1.59 1.589c.397.397.875.7 1.392.916l.326.133a.5.5 0 01-.281.945l-1.757.352c-.603.12-1.174.306-1.715.548l-.515.231a.5.5 0 01-.696-.466l-.217-1.65c-.124-.945-.39-1.844-.776-2.672l-.248-.532a.5.5 0 01.369-.706l1.707-.475c.857-.238 1.673-.562 2.435-.966l.337-.18a.5.5 0 01.671.358l.38 2.29a.5.5 0 01-.257.548l-1.848.926c-.772.386-1.48.82-2.11 1.284l-.437.32a.5.5 0 01-.693-.112l-1.354-1.353a.5.5 0 01.707-.707l.948.948c.415.415.87.787 1.351 1.112l.414.28a.5.5 0 01-.109.887l-1.992.663a.5.5 0 01-.564-.148l-1.63-1.582c-.409-.396-.8-.808-1.172-1.232l-.34-.386a.5.5 0 01.367-.825z" />
  </svg>
);

const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Send = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const MapPin = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Mail = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);