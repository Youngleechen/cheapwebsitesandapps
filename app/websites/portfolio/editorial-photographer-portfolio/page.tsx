// File: app/portfolio/editorial-photographer-portfolio/page.tsx
// Category: Creative Portfolio / Editorial Photographer

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowDown, FiArrowRight, FiInstagram, FiLinkedin, FiMail, FiPhone, FiMapPin, FiCalendar, FiCamera } from 'react-icons/fi';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Portfolio items with specific photography-focused prompts
const PORTFOLIO_ITEMS = [
  { 
    id: 'midnight-garden', 
    title: 'Midnight Garden',
    category: 'Editorial Feature',
    client: 'The New Yorker',
    year: '2023',
    prompt: 'Editorial photography of a secluded botanical garden at midnight, illuminated by soft moonlight and strategically placed artificial lighting. Capture the ethereal quality of rare night-blooming flowers, dew drops on petals, and the interplay of natural and artificial light. Professional DSLR quality with shallow depth of field, rich color grading in cool blues and silvers, and cinematic composition that tells a story of nature\'s hidden beauty.'
  },
  { 
    id: 'neon-dreams', 
    title: 'Neon Dreams',
    category: 'Urban Documentary',
    client: 'TIME Magazine',
    year: '2024',
    prompt: 'Professional editorial photograph capturing the vibrant energy of a Tokyo street market at night during monsoon season. Neon signs reflecting on wet pavement, steam rising from food stalls, blurred motion of pedestrians with umbrellas, and the warm glow of street vendors. Shot with a high-end mirrorless camera, wide aperture for bokeh effects, rich contrast between neon colors and deep shadows, composition that guides the viewer through the bustling scene with journalistic authenticity.'
  },
  { 
    id: 'ocean-memory', 
    title: 'Ocean Memory',
    category: 'Environmental Storytelling',
    client: 'National Geographic',
    year: '2023',
    prompt: 'Atmospheric editorial photograph of an abandoned fishing village on the Oregon coast at dawn. Weather-beaten wooden structures silhouetted against a moody sky, crashing waves in the foreground with long exposure effect, lone fisherman walking along the shore. Professional medium format camera quality, dramatic lighting with golden hour hues, composition that evokes themes of climate change and human resilience, rich textures in the weathered wood and turbulent sea, cinematic color grading with deep blues and warm amber accents.'
  },
  {
    id: 'desert-whispers',
    title: 'Desert Whispers',
    category: 'Cultural Documentary',
    client: 'Vogue',
    year: '2024',
    prompt: 'Editorial portrait series of indigenous artisans in the Sonoran Desert, captured during golden hour. Subjects engaged in traditional pottery-making, dust particles visible in sunbeams, authentic cultural details in clothing and tools. Shot with professional portrait lens, shallow depth of field to isolate subjects, warm color palette with rich earth tones, composition that balances human connection with environmental context, natural lighting that enhances skin tones and textures, storytelling approach that honors cultural heritage.'
  },
  {
    id: 'urban-rhythm',
    title: 'Urban Rhythm',
    category: 'Street Photography',
    client: 'GQ Magazine',
    year: '2023',
    prompt: 'Dynamic editorial photograph capturing the rhythm of New York City subway dancers at rush hour. Motion blur of commuters in background, sharp focus on breakdancers mid-performance, dramatic underground lighting with fluorescent and tungsten mixed sources. Professional action photography with fast shutter speed to freeze motion, composition that uses leading lines of the subway car, authentic urban energy, color grading that enhances the contrast between performers and their environment, storytelling that captures the pulse of city life.'
  },
  {
    id: 'arctic-silence',
    title: 'Arctic Silence',
    category: 'Adventure Photography',
    client: 'Outside Magazine',
    year: '2024',
    prompt: 'Epic landscape editorial photograph of a solo researcher in the Arctic tundra during polar twilight. Vast frozen landscape stretching to horizon, tiny figure emphasizing scale, northern lights beginning to appear in the indigo sky, breath visible in the cold air. Shot with wide-angle professional landscape lens, long exposure to capture star movement, composition that balances human presence with overwhelming natural environment, color grading with cool blues and subtle greens, technical excellence in low-light conditions, storytelling that conveys scientific exploration and climate awareness.'
  }
];

type PortfolioImage = {
  image_url: string | null;
  loading: boolean;
};

type PortfolioState = {
  [key: string]: PortfolioImage;
};

export default function EditorialPhotographerPortfolio() {
  const [portfolioImages, setPortfolioImages] = useState<PortfolioState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: '',
    message: '',
    budget: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contactFormRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.9]);
  const headerBackground = useTransform(scrollY, [0, 50], ['transparent', 'rgba(0,0,0,0.9)']);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user.id || null;
        setUserId(uid);
        setAdminMode(uid === ADMIN_USER_ID);
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      try {
        // Initialize all portfolio items with loading state
        const initialState: PortfolioState = {};
        PORTFOLIO_ITEMS.forEach(item => {
          initialState[item.id] = { image_url: null, loading: true };
        });
        setPortfolioImages(initialState);

        // Fetch gallery images for admin
        const { data: images, error } = await supabase
          .from('images')
          .select('path, created_at')
          .eq('user_id', ADMIN_USER_ID)
          .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading images:', error);
          setError('Failed to load portfolio images');
          return;
        }

        const latestImagePerItem: Record<string, string> = {};

        if (images) {
          for (const img of images) {
            const pathParts = img.path.split('/');
            if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
              const itemId = pathParts[2];
              if (PORTFOLIO_ITEMS.some(item => item.id === itemId) && !latestImagePerItem[itemId]) {
                latestImagePerItem[itemId] = img.path;
              }
            }
          }
        }

        // Update state with images
        const updatedState = { ...initialState };
        PORTFOLIO_ITEMS.forEach(item => {
          if (latestImagePerItem[item.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerItem[item.id]).data.publicUrl;
            updatedState[item.id] = { image_url: url, loading: false };
          } else {
            updatedState[item.id] = { image_url: null, loading: false };
          }
        });

        setPortfolioImages(updatedState);
      } catch (err) {
        console.error('Image loading failed:', err);
        setError('Failed to load portfolio images');
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Show loading state
      setPortfolioImages(prev => ({
        ...prev,
        [itemId]: { image_url: prev[itemId]?.image_url || null, loading: true }
      }));

      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${itemId}/`;
      
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
      
      setPortfolioImages(prev => ({
        ...prev,
        [itemId]: { image_url: publicUrl, loading: false }
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Image upload failed. Please try again.');
      setPortfolioImages(prev => ({
        ...prev,
        [itemId]: { image_url: prev[itemId]?.image_url || null, loading: false }
      }));
      alert('Upload failed. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, itemId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      alert('Prompt copied to clipboard!');
    }).catch(err => {
      console.error('Copy failed:', err);
      alert('Failed to copy prompt');
    });
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    window.scrollTo({ top: document.getElementById('portfolio')?.offsetTop || 0, behavior: 'smooth' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the form data to a backend
    console.log('Form submitted:', formData);
    setFormSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', projectType: '', message: '', budget: '' });
      setFormSubmitted(false);
      setShowContactForm(false);
    }, 3000);
  };

  const categories = ['All', 'Editorial Feature', 'Urban Documentary', 'Environmental Storytelling', 'Cultural Documentary', 'Street Photography', 'Adventure Photography'];

  // Filter portfolio items based on active category
  const filteredItems = PORTFOLIO_ITEMS.filter(item => 
    activeCategory === 'All' || item.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header with smooth scrolling effect */}
      <motion.header 
        style={{ 
          backgroundColor: headerBackground,
          opacity: headerOpacity 
        }}
        className="fixed w-full z-50 transition-all duration-300 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold"
          >
            <Link href="/" className="text-white hover:text-gray-300 transition-colors">
              ELENA VOSS
            </Link>
          </motion.div>
          
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              {['Portfolio', 'About', 'Services', 'Contact'].map((item) => (
                <li key={item}>
                  <motion.a
                    href={`#${item.toLowerCase()}`}
                    className="text-white hover:text-gray-300 transition-colors font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item}
                  </motion.a>
                </li>
              ))}
            </ul>
          </nav>
          
          <motion.button
            onClick={() => setShowContactForm(true)}
            className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Book Session
          </motion.button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-10" />
        
        {/* Hero content */}
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="block">Capturing Stories</span>
              <span className="block text-white/90 text-3xl md:text-4xl mt-2 font-light">Editorial Photography with Purpose</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Award-winning photographer documenting human stories, cultural moments, and environmental narratives for National Geographic, TIME, and The New Yorker.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a 
                href="#portfolio" 
                className="inline-flex items-center bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors"
              >
                View Portfolio
                <FiArrowDown className="ml-2" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Work</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Each image tells a story. Explore my editorial photography portfolio spanning cultural documentaries, environmental narratives, and human-interest features.
            </p>
          </motion.div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeCategory === category 
                    ? 'bg-white text-black' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            ))}
          </div>

          {/* Portfolio Grid */}
          {error && (
            <div className="text-center text-red-500 mb-8 p-4 bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-gray-900 rounded-xl overflow-hidden aspect-square">
                  <div className="w-full h-full bg-gray-800 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => {
                const imageData = portfolioImages[item.id] || { image_url: null, loading: false };
                const isLoadingItem = imageData.loading;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="group relative overflow-hidden rounded-xl"
                  >
                    <div className="aspect-square relative bg-gray-900">
                      {isLoadingItem ? (
                        <div className="w-full h-full bg-gray-800 animate-pulse" />
                      ) : imageData.image_url ? (
                        <Image
                          src={imageData.image_url}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          priority={filteredItems.indexOf(item) < 3}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-portfolio.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <span className="text-gray-500">No image available</span>
                        </div>
                      )}
                      
                      {/* Admin upload overlay */}
                      {adminMode && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <label className="bg-white text-black px-4 py-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors">
                            {isLoadingItem ? 'Uploading...' : 'Upload Image'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUpload(e, item.id)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 bg-black/90 backdrop-blur-sm">
                      <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                      <div className="flex justify-between text-gray-400 text-sm mb-2">
                        <span>{item.category}</span>
                        <span>{item.year}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">{item.client}</p>
                      
                      {adminMode && !imageData.image_url && (
                        <div className="mt-4 p-3 bg-purple-900/30 border border-purple-600 rounded text-xs">
                          <p className="text-purple-300 mb-2">Prompt:</p>
                          <p className="text-gray-300 mb-2">{item.prompt}</p>
                          <button
                            onClick={() => copyPrompt(item.prompt, item.id)}
                            className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors"
                          >
                            Copy Prompt
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <button className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center mx-auto">
              View Full Portfolio
              <FiArrowRight className="ml-2" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">About Elena</h2>
                <p className="text-gray-300 text-lg mb-6">
                  Based in Austin, Texas, I've spent the last decade capturing stories that matter. My work has appeared in National Geographic, TIME Magazine, The New Yorker, and Vogue, earning recognition from World Press Photo and International Photography Awards.
                </p>
                <p className="text-gray-400 mb-6">
                  I believe photography is more than just taking pictures—it's about connecting with people, understanding their stories, and creating images that evoke emotion and drive change. My editorial approach combines technical excellence with authentic storytelling.
                </p>
                <div className="flex space-x-4">
                  {[FiInstagram, FiLinkedin].map((Icon, index) => (
                    <motion.a
                      key={index}
                      href="#"
                      className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Icon size={24} />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[500px] rounded-2xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-indigo-900 opacity-90" />
              
              <div className="relative z-10 p-8 flex flex-col justify-end h-full">
                <div className="bg-black/70 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                  <h3 className="text-2xl font-bold mb-4">Behind the Lens</h3>
                  <p className="text-gray-300 mb-6">
                    "I'm drawn to moments of genuine human connection and the stories that unfold in everyday life. My goal is to create images that not only document reality but also inspire empathy and understanding."
                  </p>
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mr-4">
                      <FiCamera size={28} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold">Elena Voss</p>
                      <p className="text-gray-400">Editorial Photographer</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Photography Services</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Professional editorial photography services tailored to magazines, publications, and brands that value authentic storytelling.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Editorial Features',
                description: 'In-depth photo essays and feature photography for magazines and editorial publications, capturing human stories with depth and authenticity.',
                icon: FiCamera
              },
              {
                title: 'Documentary Projects',
                description: 'Long-term documentary photography projects focusing on cultural, social, and environmental issues, perfect for NGO partnerships and impact campaigns.',
                icon: FiCamera
              },
              {
                title: 'Corporate Storytelling',
                description: 'Editorial-style photography for corporate communications, annual reports, and brand storytelling that humanizes your organization.',
                icon: FiCamera
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900 rounded-xl p-8 text-center hover:bg-gray-800 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                  <service.icon size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-gray-300 mb-6">{service.description}</p>
                <motion.button
                  onClick={() => setShowContactForm(true)}
                  className="text-white border border-white px-4 py-2 rounded-full hover:bg-white hover:text-black transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Learn More
                </motion.button>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl">
              <p className="font-bold text-lg">2024 Booking Calendar</p>
              <p className="text-sm opacity-90">Limited availability for editorial assignments</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Client Stories</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              What editors and creative directors say about working with Elena on editorial assignments and documentary projects.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Mitchell',
                title: 'Photo Editor, National Geographic',
                quote: 'Elena has an extraordinary ability to capture the essence of a story in a single frame. Her work on our climate change series was both technically brilliant and emotionally resonant.',
                image: '/placeholder-testimonial-1.jpg'
              },
              {
                name: 'Marcus Reynolds',
                title: 'Creative Director, TIME Magazine',
                quote: 'Working with Elena is always a pleasure. She brings not just exceptional photography skills, but a deep understanding of storytelling and the ability to connect with her subjects.',
                image: '/placeholder-testimonial-2.jpg'
              },
              {
                name: 'Jessica Chen',
                title: 'Art Director, The New Yorker',
                quote: 'Elena\'s editorial eye is unmatched. She consistently delivers images that elevate our stories and resonate with readers on a profound level.',
                image: '/placeholder-testimonial-3.jpg'
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-black/80 backdrop-blur-sm rounded-xl p-8 border border-white/5"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mr-4">
                    <span className="font-bold text-white">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.title}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic mb-4">"{testimonial.quote}"</p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Let's Create Together</h2>
                <p className="text-gray-300 text-lg mb-6">
                  I'm currently accepting editorial assignments and documentary projects. Whether you're a magazine editor, NGO director, or brand storyteller, I'd love to hear about your project.
                </p>
                <p className="text-gray-400 mb-8">
                  Based in Austin, Texas, but available for assignments worldwide. I respond to all inquiries within 48 hours.
                </p>
              </div>
              
              <div className="space-y-4">
                {[FiMail, FiPhone, FiMapPin, FiCalendar].map((Icon, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-4"
                    whileHover={{ x: 10 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className="text-white" />
                    </div>
                    <div>
                      {index === 0 && (
                        <>
                          <p className="font-medium">Email</p>
                          <p className="text-gray-400">elena@elenavossphotography.com</p>
                        </>
                      )}
                      {index === 1 && (
                        <>
                          <p className="font-medium">Phone</p>
                          <p className="text-gray-400">+1 (512) 555-7890</p>
                        </>
                      )}
                      {index === 2 && (
                        <>
                          <p className="font-medium">Studio</p>
                          <p className="text-gray-400">Austin, Texas</p>
                        </>
                      )}
                      {index === 3 && (
                        <>
                          <p className="font-medium">Availability</p>
                          <p className="text-gray-400">Booking for Q1-Q2 2025</p>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gray-900 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold mb-6">Send a Message</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-gray-300 mb-1">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-gray-300 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="projectType" className="block text-gray-300 mb-1">Project Type</label>
                  <select
                    id="projectType"
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select a project type</option>
                    <option value="editorial">Editorial Feature</option>
                    <option value="documentary">Documentary Project</option>
                    <option value="corporate">Corporate Storytelling</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="budget" className="block text-gray-300 mb-1">Budget Range</label>
                  <select
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select budget range</option>
                    <option value="under-5k">Under $5,000</option>
                    <option value="5k-10k">$5,000 - $10,000</option>
                    <option value="10k-25k">$10,000 - $25,000</option>
                    <option value="25k-plus">$25,000+</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-gray-300 mb-1">Message</label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Send Message
                </motion.button>
              </form>
              
              {formSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-green-900/30 border border-green-500 rounded-lg text-green-300"
                >
                  Thank you! Your message has been sent. I'll respond within 48 hours.
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Form Modal */}
      <AnimatePresence>
        {showContactForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowContactForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Book a Session</h3>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label htmlFor="modal-name" className="block text-gray-300 mb-1">Name</label>
                  <input
                    id="modal-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="modal-email" className="block text-gray-300 mb-1">Email</label>
                  <input
                    id="modal-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="modal-project" className="block text-gray-300 mb-1">Project Type</label>
                  <select
                    id="modal-project"
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select project type</option>
                    <option value="editorial">Editorial Feature</option>
                    <option value="documentary">Documentary Project</option>
                    <option value="corporate">Corporate Storytelling</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="modal-message" className="block text-gray-300 mb-1">Message</label>
                  <textarea
                    id="modal-message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Send Inquiry
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 bg-black/90 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">ELENA VOSS</h3>
              <p className="text-gray-400 mb-6">
                Award-winning editorial photographer documenting human stories and environmental narratives for National Geographic, TIME, and The New Yorker.
              </p>
              <div className="flex space-x-4">
                {[FiInstagram, FiLinkedin, FiMail].map((Icon, index) => (
                  <motion.a
                    key={index}
                    href="#"
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon size={20} />
                  </motion.a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Navigation</h4>
              <ul className="space-y-2">
                {['Portfolio', 'About', 'Services', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <FiMail className="mr-2 flex-shrink-0 mt-1" size={16} />
                  <span>elena@elenavossphotography.com</span>
                </li>
                <li className="flex items-start">
                  <FiPhone className="mr-2 flex-shrink-0 mt-1" size={16} />
                  <span>+1 (512) 555-7890</span>
                </li>
                <li className="flex items-start">
                  <FiMapPin className="mr-2 flex-shrink-0 mt-1" size={16} />
                  <span>Austin, Texas</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Elena Voss Photography. All rights reserved.</p>
            <p className="mt-2">Award-winning editorial photographer based in Austin, Texas.</p>
          </div>
          
          {adminMode && (
            <div className="mt-8 p-4 bg-purple-900/30 border border-purple-600 rounded-lg text-center">
              <p className="text-purple-300 text-sm">
                👤 Admin mode active — Upload portfolio images and manage content
              </p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}