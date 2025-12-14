// app/professional-services/executive-coach/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Executive coaching specific artwork prompts
const ARTWORKS = [
  { 
    id: 'leadership-vision', 
    title: 'Strategic Leadership',
    prompt: 'A sophisticated, modern executive office with floor-to-ceiling windows overlooking a city skyline at golden hour. A confident leader stands at the window, back to camera, contemplating strategy. Warm, professional lighting with rich wood tones and minimalist decor. Conveys vision, clarity, and executive presence.'
  },
  { 
    id: 'team-transformation', 
    title: 'Team Transformation',
    prompt: 'A diverse executive team gathered around a sleek conference table in a high-end meeting room. They are engaged in passionate discussion, with visible energy and collaboration. Professional atmosphere with modern architecture, natural light streaming through large windows. Shows trust, innovation, and collective growth.'
  },
  { 
    id: 'executive-clarity', 
    title: 'Executive Clarity',
    prompt: 'An abstract representation of executive decision-making and clarity. Clean geometric shapes in deep blues, golds, and charcoal grays forming a path through fog. Symbolic of cutting through complexity to find strategic direction. Professional, sophisticated, and thought-provoking visual metaphor.'
  },
  {
    id: 'leadership-journey',
    title: 'Leadership Journey',
    prompt: 'A metaphorical mountain path at sunrise, representing the executive leadership journey. The path winds upward through misty peaks, with clear milestones marked along the way. Warm golden light breaks through clouds, symbolizing breakthrough moments and growth. Professional, aspirational, and motivational.'
  },
  {
    id: 'strategic-breakthrough',
    title: 'Strategic Breakthrough',
    prompt: 'A modern workspace with a large whiteboard covered in strategic diagrams, flowcharts, and key insights. An executive sits contemplatively in a designer chair, hand on chin, having a breakthrough moment. Clean, professional environment with warm lighting and architectural elements.'
  },
  {
    id: 'executive-resilience',
    title: 'Executive Resilience',
    prompt: 'A powerful, symbolic image of resilience - a single oak tree standing strong on a cliff edge during a storm, with dramatic clouds parting to reveal golden light. Represents executive strength, adaptability, and weathering challenges. Professional, inspiring, and emotionally resonant.'
  }
];

type ArtworkState = { [key: string]: { image_url: string | null } };

function GallerySkeleton() {
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
      ARTWORKS.forEach(art => initialState[art.id] = { image_url: null });

      if (images) {
        const latestImagePerArtwork: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            if (ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

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
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${artworkId}/`;

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

  // Preload images to avoid flickering
  useEffect(() => {
    Object.values(artworks).forEach(art => {
      if (art.image_url) {
        const img = new window.Image();
        img.src = art.image_url;
      }
    });
  }, [artworks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ARTWORKS.map((art) => {
        const artworkData = artworks[art.id] || { image_url: null };
        const imageUrl = artworkData.image_url;

        return (
          <div key={art.id} className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 flex flex-col h-full group">
            <div className="relative h-64 overflow-hidden">
              <AnimatePresence mode="wait">
                {imageUrl ? (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <Image
                      src={imageUrl}
                      alt={art.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-leadership.jpg';
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4"
                  >
                    <div className="text-center text-gray-600">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700">{art.title}</p>
                      <p className="text-xs text-gray-500 mt-1">Image pending upload</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-5 flex flex-col flex-grow">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{art.title}</h3>
              <p className="text-gray-600 mb-4 flex-grow">{art.prompt.substring(0, 100)}...</p>
              
              <div className="space-y-3">
                {adminMode && (
                  <div className="space-y-2">
                    <button
                      onClick={() => copyPrompt(art.prompt, art.id)}
                      className={`w-full text-xs font-medium px-3 py-2 rounded-lg border ${
                        copiedId === art.id 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      } transition-colors`}
                      type="button"
                    >
                      {copiedId === art.id ? '✓ Copied to clipboard' : '📋 Copy AI Prompt'}
                    </button>
                    
                    <label className={`w-full block text-sm font-medium text-center px-3 py-2 rounded-lg cursor-pointer ${
                      uploading === art.id 
                        ? 'bg-gray-300 text-gray-500' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } transition-colors`}>
                      {uploading === art.id ? '↻ Uploading...' : '⬆️ Upload Custom Image'}
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
                
                {!adminMode && (
                  <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity">
                    View Case Study
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Executive Coaching Page Component
export default function ExecutiveCoachPage() {
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0.95, 1]);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const servicesRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  // Handle scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Section tracking
      const sections = [
        { id: 'hero', ref: null, start: 0, end: 800 },
        { id: 'services', ref: servicesRef, start: 800, end: 1600 },
        { id: 'gallery', ref: null, start: 1600, end: 2400 },
        { id: 'testimonials', ref: testimonialsRef, start: 2400, end: 3200 },
        { id: 'about', ref: aboutRef, start: 3200, end: 4000 },
        { id: 'contact', ref: contactRef, start: 4000, end: 99999 }
      ];

      const currentScroll = window.scrollY + window.innerHeight / 2;
      
      for (const section of sections) {
        if (currentScroll >= section.start && currentScroll < section.end) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced stats with realistic executive coaching data
  const stats = [
    {
      value: '94%',
      label: 'Client Retention Rate',
      description: 'Leaders who continue coaching beyond initial engagement'
    },
    {
      value: '3.2x',
      label: 'ROI Average',
      description: 'Return on investment for executive coaching programs'
    },
    {
      value: '15+',
      label: 'Years Experience',
      description: 'Combined leadership development expertise'
    },
    {
      value: '78',
      label: 'Fortune 500 Leaders',
      description: 'Executives coached to C-suite positions'
    }
  ];

  // Services with specific, credible offerings
  const services = [
    {
      title: 'C-Suite Transition Coaching',
      description: 'Strategic guidance for executives stepping into CEO, CFO, or COO roles, focusing on stakeholder alignment, board relationships, and executive presence.',
      icon: '👑',
      duration: '6-12 months',
      investment: '$25,000-$45,000'
    },
    {
      title: 'High-Potential Leader Development',
      description: 'Accelerated development programs for VP and Director-level talent preparing for enterprise leadership, with 360° assessments and personalized growth plans.',
      icon: '🚀',
      duration: '4-8 months',
      investment: '$18,000-$32,000'
    },
    {
      title: 'Founder-to-CEO Transformation',
      description: 'Specialized coaching for startup founders scaling from hands-on operator to strategic CEO, addressing delegation, organizational design, and investor relations.',
      icon: '💡',
      duration: '8-14 months',
      investment: '$30,000-$55,000'
    },
    {
      title: 'Executive Team Alignment',
      description: 'Team coaching for C-suites and leadership teams to enhance collaboration, resolve strategic conflicts, and build high-performance cultures.',
      icon: '🤝',
      duration: '3-6 months',
      investment: '$40,000-$75,000'
    }
  ];

  // Testimonials with specific, credible details
  const testimonials = [
    {
      name: 'Sarah Reynolds',
      title: 'Former COO, TechScale Inc.',
      company: 'Now Chief Operating Officer at Global Innovations Group',
      quote: 'Working with Summit Path transformed my leadership approach during our Series C funding round. Their strategic frameworks helped me navigate complex stakeholder dynamics, resulting in a $47M close and my promotion to COO within 18 months.',
      image: '/placeholder-testimonial-1.jpg'
    },
    {
      name: 'Michael Chen',
      title: 'Founder & CEO, Horizon Analytics',
      company: 'Series B SaaS Company (250+ employees)',
      quote: 'As a first-time CEO scaling from 50 to 250 team members, I struggled with delegation and strategic focus. Summit Path\'s founder-to-CEO program provided the structure and accountability I needed to build an executive team that now runs 85% of daily operations, freeing me to focus on growth strategy.',
      image: '/placeholder-testimonial-2.jpg'
    },
    {
      name: 'Dr. Alicia Washington',
      title: 'Chief Medical Officer, Pinnacle Health Systems',
      company: 'Regional Healthcare Network ($1.2B revenue)',
      quote: 'Transitioning from clinical leadership to enterprise CMO required a complete mindset shift. Summit Path\'s coaching helped me develop the business acumen, political intelligence, and executive presence needed to lead a $1.2B healthcare organization through digital transformation and regulatory changes.',
      image: '/placeholder-testimonial-3.jpg'
    }
  ];

  // Gallery section with executive coaching context
  const galleryItems = [
    {
      title: 'Strategic Leadership',
      description: 'Visualizing executive vision and strategic clarity for Fortune 500 leaders',
      id: 'leadership-vision'
    },
    {
      title: 'Team Transformation',
      description: 'Capturing the energy of high-performance executive team dynamics',
      id: 'team-transformation'
    },
    {
      title: 'Executive Clarity',
      description: 'Symbolic representation of cutting through complexity to find direction',
      id: 'executive-clarity'
    },
    {
      title: 'Leadership Journey',
      description: 'The path of executive growth and transformation over time',
      id: 'leadership-journey'
    },
    {
      title: 'Strategic Breakthrough',
      description: 'Moments of insight and strategic clarity in executive development',
      id: 'strategic-breakthrough'
    },
    {
      title: 'Executive Resilience',
      description: 'Building adaptive leadership capabilities for complex challenges',
      id: 'executive-resilience'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation */}
      <motion.header 
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
        }`}
        style={{ opacity: headerOpacity }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl p-2 w-12 h-12 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Summit Path
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              {['Services', 'Gallery', 'Testimonials', 'About', 'Contact'].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === item.toLowerCase()
                      ? 'text-indigo-600 font-semibold'
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  {item}
                </Link>
              ))}
            </nav>
            
            <button className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity hidden md:block">
              Schedule Consultation
            </button>
            
            <button className="md:hidden text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - No traditional hero, starts with strong value prop */}
      <section id="hero" className="pt-32 pb-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
                  Executive Leadership Development
                </span>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Transform Your Leadership <span className="text-indigo-600">Beyond the C-Suite</span>
                </h1>
                <p className="text-xl text-gray-600 mt-4">
                  We partner with high-achieving executives and founders who have mastered operational excellence but need strategic clarity, executive presence, and leadership resilience to scale their impact.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl">
                  Begin Your Leadership Assessment
                </button>
                <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium text-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  View Client Success Stories
                </button>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="bg-yellow-100 text-yellow-800 rounded-full p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium">
                    <span className="font-bold text-gray-900">92% of our clients</span> report significant career advancement within 18 months of starting our coaching program.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-200 to-purple-300 rounded-3xl blur-lg opacity-30"></div>
              
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white">
                  <h3 className="text-xl font-bold">Leadership Impact Assessment</h3>
                  <p className="text-indigo-100 mt-1">Complimentary 30-minute strategic consultation</p>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Your Name</label>
                    <input
                      type="text"
                      placeholder="Sarah Reynolds"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Current Role</label>
                    <input
                      type="text"
                      placeholder="VP of Operations, TechScale Inc."
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Leadership Challenge</label>
                    <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                      <option>Select your primary challenge</option>
                      <option>Preparing for C-suite promotion</option>
                      <option>Scaling from founder to CEO</option>
                      <option>Executive team alignment</option>
                      <option>Board relationship management</option>
                      <option>Strategic decision-making under pressure</option>
                    </select>
                  </div>
                  
                  <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity mt-2">
                    Schedule Your Assessment
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Confidential consultation • No sales pitch • Strategic insights only
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {stat.label}
                </div>
                <p className="text-gray-600 text-sm">
                  {stat.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" ref={servicesRef} className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-4">
              Executive Development Programs
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Bespoke Coaching for <span className="text-indigo-600">Enterprise Leadership</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We design custom coaching engagements that address your unique leadership challenges and organizational context, not one-size-fits-all frameworks.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{service.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {service.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-medium text-gray-900">{service.duration}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Investment</p>
                          <p className="font-medium text-indigo-600">{service.investment}</p>
                        </div>
                      </div>
                      
                      <button className="mt-6 w-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                        Explore Program Details
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:opacity-90 transition-opacity">
              View All Executive Programs
              <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Gallery Section with Admin Upload System */}
      <section id="gallery" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-4">
              Leadership Visualized
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The <span className="text-indigo-600">Visual Language</span> of Executive Growth
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each image represents a core leadership concept we explore with our clients. Admins can upload custom visuals or use our AI prompts to generate contextually relevant imagery.
            </p>
          </div>
          
          <GallerySkeleton />
          
          <div className="mt-12 text-center">
            <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
              👤 Admin mode enabled - Upload custom images or copy AI prompts for generation
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" ref={testimonialsRef} className="py-20 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-4">
              Client Transformations
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              From <span className="text-indigo-600">High Performer</span> to Strategic Leader
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real outcomes from executives who invested in their leadership development with Summit Path.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold text-gray-800">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-indigo-600 font-medium">{testimonial.title}</p>
                    <p className="text-gray-600 text-sm">{testimonial.company}</p>
                  </div>
                </div>
                
                <p className="text-gray-700 italic mb-6 border-l-4 border-indigo-200 pl-4 py-2">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-600">Executive Coaching Experience</span>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:opacity-90 transition-opacity">
              Read More Success Stories
              <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-4">
                  Our Approach
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Why Executives <span className="text-indigo-600">Choose Summit Path</span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Unlike traditional coaching firms that focus solely on behavioral change, we integrate strategic business acumen, organizational dynamics, and personal leadership identity to create sustainable transformation.
                </p>
              </div>
              
              <div className="space-y-6">
                {[
                  {
                    title: 'Strategic Business Context',
                    description: 'We understand your industry, competitive landscape, and organizational challenges, ensuring coaching is grounded in real business impact.'
                  },
                  {
                    title: 'Evidence-Based Methodologies',
                    description: 'Our approach combines proven leadership frameworks with cutting-edge research in neuroscience, behavioral psychology, and organizational development.'
                  },
                  {
                    title: 'Confidential Peer Network',
                    description: 'Access to our exclusive network of 150+ current and former C-suite executives for peer learning and strategic benchmarking.'
                  }
                ].map((item, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-indigo-700">{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:opacity-90 transition-opacity">
                Meet Our Leadership Team
                <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-200 to-purple-300 rounded-2xl blur-xl opacity-20"></div>
              
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('/placeholder-leadership-team.jpg')] bg-cover bg-center opacity-10"></div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-6">
                    Our <span className="text-indigo-300">Leadership Principles</span>
                  </h3>
                  
                  <div className="space-y-6">
                    {[
                      {
                        title: 'Context Before Content',
                        description: 'Understanding your unique business ecosystem before applying any framework.'
                      },
                      {
                        title: 'Sustainable Transformation',
                        description: 'Building leadership capabilities that endure beyond the coaching engagement.'
                      },
                      {
                        title: 'Strategic Courage',
                        description: 'Developing the conviction to make difficult decisions that drive organizational impact.'
                      },
                      {
                        title: 'Relational Intelligence',
                        description: 'Mastering the art of influence, stakeholder management, and executive presence.'
                      }
                    ].map((principle, index) => (
                      <div key={index} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                        <h4 className="font-bold text-lg text-indigo-300 mb-2">
                          {principle.title}
                        </h4>
                        <p className="text-gray-300">
                          {principle.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" ref={contactRef} className="py-20 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-white"
            >
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white mb-4">
                Strategic Partnership Inquiry
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Begin Your <span className="text-white">Leadership Transformation</span>
              </h2>
              <p className="text-xl text-indigo-100 mb-8">
                Schedule a confidential 30-minute consultation to discuss your leadership challenges and how our executive coaching programs can accelerate your strategic impact.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Schedule Consultation</p>
                    <p className="text-indigo-100">(415) 888-9999</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Executive Inquiries</p>
                    <p className="text-indigo-100">leadership@summitpath.com</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Leadership Assessment Request
              </h3>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Sarah"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Reynolds"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Email
                  </label>
                  <input
                    type="email"
                    placeholder="sarah.reynolds@techscale.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Role & Organization
                  </label>
                  <input
                    type="text"
                    placeholder="VP of Operations, TechScale Inc."
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Leadership Challenge
                  </label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option>Select your primary challenge</option>
                    <option>Preparing for C-suite promotion</option>
                    <option>Scaling from founder to CEO</option>
                    <option>Executive team alignment</option>
                    <option>Board relationship management</option>
                    <option>Strategic decision-making under pressure</option>
                    <option>Organizational transformation leadership</option>
                    <option>Succession planning and talent development</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Consultation Time
                  </label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option>Select preferred time</option>
                    <option>Weekday mornings (8-11 AM PT)</option>
                    <option>Weekday afternoons (1-4 PM PT)</option>
                    <option>Weekday evenings (4-6 PM PT)</option>
                    <option>Flexible schedule</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-3 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity shadow-lg"
                >
                  Schedule Your Assessment
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  Confidential consultation • No sales pitch • Strategic insights only • 30-minute commitment
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl p-2 w-10 h-10 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">Summit Path</span>
              </div>
              <p className="text-gray-400">
                Bespoke executive coaching for leaders who want to transform their impact beyond operational excellence.
              </p>
              <div className="flex space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 transition-colors">
                    <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-lg">Executive Programs</h4>
              <ul className="space-y-2">
                {['C-Suite Transition', 'High-Potential Leader Development', 'Founder-to-CEO Transformation', 'Executive Team Alignment'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-lg">Resources</h4>
              <ul className="space-y-2">
                {['Leadership Assessment Guide', 'Executive Presence Framework', 'Strategic Decision-Making Toolkit', 'Team Alignment Methodology'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-lg">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-400">San Francisco Bay Area<br />Remote coaching worldwide</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-400">(415) 888-9999<br />leadership@summitpath.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>
              © {new Date().getFullYear()} Summit Path Executive Coaching. All rights reserved. 
              <span className="mx-2">•</span>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <span className="mx-2">•</span>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </p>
            <p className="mt-2">
              Bespoke executive development for leaders who have mastered operations but seek strategic impact.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}