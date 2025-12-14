'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

const PROJECTS = [
  { 
    id: 'horizon-residence', 
    title: 'Horizon Residence',
    location: 'Coastal California',
    prompt: 'A modern cliffside residence with floor-to-ceiling glass walls, minimalist concrete and wood facade, dramatic cantilever over ocean views, sustainable materials, indoor-outdoor living spaces with infinity pool merging with horizon. Timeless architectural photography with warm golden hour lighting.'
  },
  { 
    id: 'urban-retreat', 
    title: 'Urban Micro-Retreat', 
    location: 'Downtown Seattle',
    prompt: 'A compact 800 sq ft urban dwelling transformed into a serene sanctuary with multi-functional spaces, vertical garden walls, skylight illumination, folded plate roof design, reclaimed wood accents, hidden storage solutions. Architectural visualization showing cozy yet sophisticated small-space living.'
  },
  { 
    id: 'forest-pavilion', 
    title: 'Forest Pavilion', 
    location: 'Pacific Northwest',
    prompt: 'A minimalist glass and steel pavilion nestled among ancient trees, elevated on stilts to preserve natural terrain, butterfly roof design, expansive sliding glass walls, natural material palette of wood and stone, dappled forest light creating organic patterns. Environmental architecture harmonizing with nature.'
  },
  {
    id: 'commercial-hub', 
    title: 'Creative Co-Working Hub',
    location: 'Austin, Texas',
    prompt: 'A repurposed industrial warehouse transformed into a vibrant co-working space with exposed brick walls, industrial steel beams, suspended garden atrium, modular workstations, collaborative lounge areas with organic shapes, natural light filtering through skylights. Modern commercial architecture fostering creativity and community.'
  },
  {
    id: 'waterfront-cafe', 
    title: 'Waterfront Cafe',
    location: 'Maine Coast',
    prompt: 'A sustainable waterfront cafe with curved glass facade following shoreline contour, green roof with native plants, reclaimed driftwood interior accents, outdoor deck extending over water, large pivot doors creating seamless indoor-outdoor experience, nautical architectural elements with modern twist. Coastal commercial design with environmental sensitivity.'
  },
  {
    id: 'mountain-lodge', 
    title: 'Alpine Mountain Lodge',
    location: 'Colorado Rockies',
    prompt: 'A contemporary mountain lodge using traditional materials in innovative ways, steeply pitched roof with deep overhangs for snow protection, floor-to-ceiling windows framing dramatic mountain vistas, stone and timber exterior, cantilevered observation deck, sustainable heating systems. Luxury residential architecture blending with rugged natural landscape.'
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
      PROJECTS.forEach(project => initialState[project.id] = { image_url: null });

      if (images) {
        const latestImagePerProject: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const projectId = pathParts[2];
            if (PROJECTS.some(p => p.id === projectId) && !latestImagePerProject[projectId]) {
              latestImagePerProject[projectId] = img.path;
            }
          }
        }

        PROJECTS.forEach(project => {
          if (latestImagePerProject[project.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerProject[project.id]).data.publicUrl;
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
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${projectId}/`;

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
      setProjects(prev => ({ ...prev, [projectId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {PROJECTS.map((project) => {
        const projectData = projects[project.id] || { image_url: null };
        const imageUrl = projectData.image_url;

        return (
          <motion.div 
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group relative overflow-hidden rounded-xl shadow-xl bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <div className="aspect-[4/3] relative bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
              {imageUrl ? (
                <motion.img 
                  src={imageUrl} 
                  alt={`${project.title} - ${project.location}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-architecture.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 mx-auto flex items-center justify-center">
                      <span className="text-white font-bold text-lg">AA</span>
                    </div>
                    <p className="text-sm text-gray-400 font-medium">{project.title}</p>
                    <p className="text-xs text-gray-500">{project.location}</p>
                  </div>
                </div>
              )}
              
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
                  <p className="text-sm text-gray-200">{project.location}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
              <p className="text-sm text-gray-300 mb-4">{project.location}</p>
              <p className="text-sm text-gray-400 line-clamp-2">
                Award-winning sustainable design featuring innovative materials and seamless indoor-outdoor living.
              </p>
            </div>

            {adminMode && (
              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-lg p-2 z-10">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => copyPrompt(project.prompt, project.id)}
                    className={`text-xs px-2 py-1 rounded text-white ${
                      copiedId === project.id ? 'bg-green-500' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {copiedId === project.id ? 'Copied!' : 'Copy Prompt'}
                  </button>
                  <label className="block">
                    <span className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded cursor-pointer inline-block">
                      {uploading === project.id ? 'Uploading...' : 'Update'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, project.id)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/90 backdrop-blur-sm py-2' : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">AA</span>
            </div>
            <span className="text-xl font-bold text-white hidden md:block">Aperture Architecture</span>
          </motion.div>
          
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              {['Portfolio', 'Services', 'Process', 'Studio', 'Contact'].map((item) => (
                <motion.li 
                  key={item}
                  whileHover={{ y: -2 }}
                  className="relative group"
                >
                  <a 
                    href={`#${item.toLowerCase()}`}
                    className={`text-white font-medium text-sm transition-colors ${
                      scrolled ? 'hover:text-purple-400' : 'hover:text-white/90'
                    }`}
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </nav>
          
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className="w-6 h-0.5 bg-white mb-1.5 transition-transform duration-300"></div>
            <div className="w-6 h-0.5 bg-white mb-1.5 transition-opacity duration-300"></div>
            <div className="w-6 h-0.5 bg-white transition-transform duration-300"></div>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-sm overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <ul className="space-y-4">
                {['Portfolio', 'Services', 'Process', 'Studio', 'Contact'].map((item) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <a 
                      href={`#${item.toLowerCase()}`}
                      className="block text-white font-medium py-2 hover:text-purple-400 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section 
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Dynamic background gradient that follows mouse */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-950"
        animate={{
          background: inView ? 
            `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.1) 40%, transparent 70%)` 
            : 'linear-gradient(to bottom right, #0f172a, #1e293b)'
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f20_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f20_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Hero content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-500 text-white text-sm font-medium px-4 py-1 rounded-full"
          >
            Sustainable Architecture & Design
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Architecture that <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-300">breathes</span> with nature
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            We craft spaces that harmonize human needs with environmental consciousness, creating timeless architecture that elevates everyday life.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold px-8 py-4 rounded-lg text-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              Begin Your Project
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/10 backdrop-blur-sm text-white font-medium px-8 py-4 rounded-lg text-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              View Portfolio
            </motion.button>
          </div>
        </motion.div>
      </div>
      
      {/* Floating geometric shapes */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
}

function ServicesSection() {
  const services = [
    {
      title: "Residential Design",
      description: "Tailored homes that respond to your lifestyle, site conditions, and environmental context. From compact urban dwellings to expansive estates.",
      icon: "🏠"
    },
    {
      title: "Commercial Spaces",
      description: "Workplaces that inspire productivity and well-being. Offices, retail spaces, restaurants, and community buildings designed for human connection.",
      icon: "🏢"
    },
    {
      title: "Sustainable Architecture",
      description: "Buildings that minimize environmental impact through passive design, renewable materials, and energy-efficient systems that pay dividends.",
      icon: "🌱"
    },
    {
      title: "Interior Architecture",
      description: "Seamless integration of interior spaces with architectural vision. Custom millwork, lighting design, and material palettes that tell your story.",
      icon: "✨"
    }
  ];

  return (
    <section id="services" className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block bg-gradient-to-r from-purple-600/20 to-blue-500/20 text-purple-300 text-sm font-medium px-4 py-1 rounded-full mb-4"
          >
            Our Expertise
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Design Services
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Comprehensive architectural solutions crafted with precision and care for discerning clients.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/30 transition-all duration-300 overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                <p className="text-gray-300 mb-4">{service.description}</p>
                <motion.button
                  whileHover={{ x: 5 }}
                  className="text-purple-400 font-medium flex items-center gap-2 group/btn"
                >
                  Learn more
                  <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Discovery & Vision",
      description: "We begin with deep listening to understand your needs, site constraints, budget, and aspirations. This collaborative phase sets the foundation for success.",
      duration: "2-3 weeks"
    },
    {
      number: "02",
      title: "Concept Development",
      description: "Through sketches, 3D models, and material studies, we explore multiple design directions. You'll see your vision take shape with clear spatial relationships.",
      duration: "3-4 weeks"
    },
    {
      number: "03",
      title: "Design Development",
      description: "Refining the chosen concept with technical precision. We coordinate with engineers, establish material palettes, and develop detailed construction documents.",
      duration: "6-8 weeks"
    },
    {
      number: "04",
      title: "Construction & Craft",
      description: "Our hands-on approach continues through construction. We partner with skilled builders, conduct site visits, and ensure every detail meets our exacting standards.",
      duration: "Varies by project"
    }
  ];

  return (
    <section id="process" className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block bg-gradient-to-r from-blue-600/20 to-cyan-500/20 text-blue-300 text-sm font-medium px-4 py-1 rounded-full mb-4"
          >
            Our Approach
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            The Design Journey
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            A transparent, collaborative process that transforms complex challenges into elegant architectural solutions.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative pl-16 ${index < steps.length - 1 ? 'pb-12' : 'pb-0'}`}
            >
              {/* Timeline connector */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-12 bottom-0 w-px bg-gradient-to-b from-purple-500/30 to-transparent" />
              )}
              
              {/* Step number badge */}
              <div className="absolute left-0 top-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {step.number}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
                <div className="mt-4">
                  <span className="text-sm text-purple-400 font-medium">{step.duration}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StudioSection() {
  const teamMembers = [
    {
      name: "Elena Marquez",
      role: "Principal Architect",
      bio: "15+ years crafting sustainable spaces. Former lead designer at Foster + Partners. Passionate about biophilic design and community impact.",
      image: "/team-elena.jpg"
    },
    {
      name: "Marcus Chen",
      role: "Design Director",
      bio: "Award-winning interior architect with expertise in adaptive reuse. Featured in Architectural Digest for innovative material applications.",
      image: "/team-marcus.jpg"
    },
    {
      name: "Sophia Rivera",
      role: "Technical Lead",
      bio: "Structural engineering background with focus on earthquake-resistant design. Certified in Passive House standards and green building technologies.",
      image: "/team-sophia.jpg"
    }
  ];

  return (
    <section id="studio" className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block bg-gradient-to-r from-amber-600/20 to-orange-500/20 text-amber-300 text-sm font-medium px-4 py-1 rounded-full mb-4"
          >
            Meet Our Team
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            The Minds Behind the Vision
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            A collaborative studio of architects, designers, and technical specialists united by a passion for meaningful architecture.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/30 transition-all duration-300"
            >
              {/* Member image placeholder with gradient */}
              <div className="h-64 bg-gradient-to-br from-amber-900/30 to-orange-900/30 flex items-center justify-center">
                <div className="text-6xl">{member.name.split(' ')[0][0]}{member.name.split(' ')[1][0]}</div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <p className="text-amber-400 font-medium mb-3">{member.role}</p>
                <p className="text-gray-300">{member.bio}</p>
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div className="space-y-2">
                  <p className="text-white font-medium">Connect with {member.name.split(' ')[0]}</p>
                  <div className="flex space-x-3">
                    {[1, 2, 3].map((i) => (
                      <button key={i} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                        <span className="text-white">•</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Aperture transformed our outdated office into a space that truly reflects our brand values. The attention to detail and sustainable materials exceeded our expectations.",
      author: "Sarah Johnson",
      role: "CEO, GreenTech Innovations",
      image: "/testimonial-sarah.jpg"
    },
    {
      quote: "Working with Elena and her team was a revelation. They listened deeply to our needs and created a home that feels both grand and intimate. Every corner tells a story.",
      author: "Michael Rodriguez",
      role: "Homeowner, Coastal Residence",
      image: "/testimonial-michael.jpg"
    },
    {
      quote: "Their innovative approach to our restaurant space created an atmosphere that our customers constantly comment on. The flow between kitchen and dining areas improved our operations significantly.",
      author: "David Chen",
      role: "Owner, Harbor Bistro",
      image: "/testimonial-david.jpg"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block bg-gradient-to-r from-pink-600/20 to-rose-500/20 text-pink-300 text-sm font-medium px-4 py-1 rounded-full mb-4"
          >
            Client Stories
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Voices from Our Clients
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Real experiences from clients who trusted us to bring their architectural dreams to life.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-pink-500/30 transition-all duration-300"
            >
              <div className="flex items-start space-x-4">
                {/* Avatar placeholder */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-600 to-rose-500 flex items-center justify-center text-white font-bold text-xl">
                  {testimonial.author.split(' ')[0][0]}
                </div>
                <div className="flex-1">
                  <p className="text-gray-300 italic mb-4">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-bold text-white">{testimonial.author}</p>
                    <p className="text-pink-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
              
              {/* Quote decoration */}
              <div className="absolute top-4 right-4 text-6xl text-pink-600/20 font-serif">"</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block bg-gradient-to-r from-emerald-600/20 to-teal-500/20 text-emerald-300 text-sm font-medium px-4 py-1 rounded-full mb-4"
          >
            Let's Create Together
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Begin Your Architectural Journey
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Ready to transform your space? Let's discuss your project and explore how we can bring your vision to life.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Schedule a Consultation</h3>
              <p className="text-gray-300 mb-6">
                We offer complimentary 45-minute consultations to discuss your project goals, site conditions, and budget considerations.
              </p>
              <ul className="space-y-4">
                {[{
                  icon: "📍",
                  text: "123 Design Avenue, San Francisco, CA 94107"
                }, {
                  icon: "📞",
                  text: "(415) 555-0199"
                }, {
                  icon: "✉️",
                  text: "hello@aperture-architecture.com"
                }, {
                  icon: "📅",
                  text: "Monday-Friday: 9am-6pm PST"
                }].map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="text-2xl mt-1">{item.icon}</span>
                    <span className="text-gray-300">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-3">Project Inquiry</h3>
              <p className="text-gray-200 mb-4">
                Tell us about your vision and we'll respond within 24 hours with next steps.
              </p>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Project Type</label>
                  <select className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                    <option value="" className="bg-gray-900 text-gray-400">Select project type</option>
                    <option value="residential" className="bg-gray-900 text-white">Residential</option>
                    <option value="commercial" className="bg-gray-900 text-white">Commercial</option>
                    <option value="renovation" className="bg-gray-900 text-white">Renovation</option>
                    <option value="interior" className="bg-gray-900 text-white">Interior Architecture</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold py-4 rounded-lg hover:opacity-90 transition-opacity duration-300"
                >
                  Send Inquiry
                </button>
              </form>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="h-[600px] bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 overflow-hidden relative"
          >
            {/* Map placeholder with gradient overlay */}
            <div className="w-full h-full bg-gradient-to-br from-emerald-900/10 to-teal-900/20 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 mx-auto flex items-center justify-center mb-6">
                  <span className="text-white font-bold text-2xl">📍</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">San Francisco Studio</h3>
                <p className="text-gray-300 mb-4">
                  Our design studio is located in the heart of San Francisco's design district, where creativity and innovation thrive.
                </p>
                <button className="text-emerald-400 font-medium flex items-center gap-2 mx-auto">
                  View Location
                  <span>→</span>
                </button>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xNSAzMGgzMHYzMEgxeiIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30 animate-[pulse_8s_infinite]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-black/95 backdrop-blur-sm border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AA</span>
              </div>
              <span className="text-xl font-bold text-white">Aperture Architecture</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Crafting sustainable, meaningful architecture that enhances human experience and honors our environment. Based in San Francisco, serving clients worldwide.
            </p>
            <div className="flex space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <button key={i} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white">
                  <span className="text-lg">•</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-bold mb-4">Services</h3>
            <ul className="space-y-2">
              {['Residential Design', 'Commercial Spaces', 'Sustainable Architecture', 'Interior Architecture', 'Consulting'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-bold mb-4">Connect</h3>
            <ul className="space-y-2">
              {['hello@aperture-architecture.com', '(415) 555-0199', '123 Design Avenue', 'San Francisco, CA 94107'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-gray-500">
            © {new Date().getFullYear()} Aperture Architecture. All rights reserved. Sustainable design since 2015.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main>
        <HeroSection />
        
        <section id="portfolio" className="py-20 bg-gradient-to-b from-black to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="inline-block bg-gradient-to-r from-purple-600/20 to-blue-500/20 text-purple-300 text-sm font-medium px-4 py-1 rounded-full mb-4"
              >
                Our Work
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl font-bold text-white mb-4"
              >
                Featured Projects
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl text-gray-300 max-w-2xl mx-auto"
              >
                A selection of our award-winning architectural projects that demonstrate our commitment to sustainable, human-centered design.
              </motion.p>
            </div>
            
            <GallerySkeleton />
          </div>
        </section>
        
        <ServicesSection />
        <ProcessSection />
        <StudioSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      
      <Footer />
      
      {/* Preload critical fonts */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/fonts/archivo-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      
      {/* Structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "name": "Aperture Architecture",
          "image": "https://aperture-architecture.com/logo.jpg",
          "@id": "https://aperture-architecture.com",
          "url": "https://aperture-architecture.com",
          "telephone": "(415) 555-0199",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "123 Design Avenue",
            "addressLocality": "San Francisco",
            "addressRegion": "CA",
            "postalCode": "94107",
            "addressCountry": "US"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 37.7749,
            "longitude": -122.4194
          },
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "09:00",
            "closes": "18:00"
          },
          "priceRange": "$$$",
          "description": "Award-winning architectural design studio specializing in sustainable residential and commercial spaces. We create timeless architecture that harmonizes human needs with environmental consciousness."
        })
      }} />
    </div>
  );
}