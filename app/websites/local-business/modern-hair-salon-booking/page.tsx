'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Calendar, Clock, Star, MapPin, Phone, MessageSquare, Instagram, Facebook, ArrowRight, ChevronDown, ChevronUp, X } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery'; // Dedicated identifier for gallery images

const PORTFOLIO_ITEMS = [
  { 
    id: 'balayage-transformation', 
    title: 'Balayage Transformation',
    prompt: 'Professional before-and-after hair transformation showcasing a natural balayage technique with golden blonde highlights on dark brown hair. Capture the dimension and movement in a well-lit salon setting with soft background blur to emphasize the hair color gradient. The model should have a confident, radiant expression showing off the finished look.'
  },
  { 
    id: 'bridal-updo', 
    title: 'Bridal Updo',
    prompt: 'Elegant bridal updo hairstyle with intricate braiding and soft curls, adorned with delicate pearl hair accessories. Capture the romantic, timeless beauty in soft natural lighting with a blurred background of a luxurious bridal suite setting. The focus should be on the craftsmanship of the styling and the bride\'s joyful expression.'
  },
  { 
    id: 'men-grooming', 
    title: 'Men\'s Precision Cut',
    prompt: 'Modern men\'s haircut with precise fade technique and textured top, showcasing clean lines and professional barbering skills. Photograph in a contemporary barbershop setting with warm lighting, capturing the client\'s satisfied expression and the sharp definition of the cut. Include subtle details like a straight razor and quality grooming products in the background.'
  },
  { 
    id: 'curly-hair-care', 
    title: 'Curly Hair Revival',
    prompt: 'Dramatic curly hair transformation showing defined, healthy curls with incredible volume and shine. Capture the bounce and movement in bright, natural lighting against a clean white backdrop to highlight the texture and definition. Show both the stylist working on the client and the stunning final result with the client smiling confidently.'
  },
  { 
    id: 'vivid-color', 
    title: 'Vivid Color Artistry',
    prompt: 'Creative hair color artistry featuring bold, vibrant colors like electric blue fading into purple with precise placement and blending. Photograph in a trendy, artistic salon environment with dramatic lighting that makes the colors pop. Capture the stylist\'s passion for color work and the client\'s excitement about their unique new look.'
  },
  { 
    id: 'keratin-treatment', 
    title: 'Keratin Smooth Finish',
    prompt: 'Professional keratin treatment results showing perfectly smooth, frizz-free hair with incredible shine and movement. Capture the transformation from before (frizzy, unmanageable hair) to after (sleek, glossy finish) in a bright, clean salon setting. Focus on the hair texture and the client\'s delighted reaction to their transformed hair.'
  },
];

type PortfolioState = { [key: string]: { image_url: string | null } };

function GallerySkeleton() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioState>({});
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

      const initialState: PortfolioState = {};
      PORTFOLIO_ITEMS.forEach(item => initialState[item.id] = { image_url: null });

      if (images) {
        const latestImagePerItem: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const itemId = pathParts[2];
            if (PORTFOLIO_ITEMS.some(a => a.id === itemId) && !latestImagePerItem[itemId]) {
              latestImagePerItem[itemId] = img.path;
            }
          }
        }

        PORTFOLIO_ITEMS.forEach(item => {
          if (latestImagePerItem[item.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerItem[item.id]).data.publicUrl;
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
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${itemId}/`;

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
      setPortfolioItems(prev => ({ ...prev, [itemId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {PORTFOLIO_ITEMS.map((item) => {
        const itemData = portfolioItems[item.id] || { image_url: null };
        const imageUrl = itemData.image_url;

        return (
          <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 overflow-hidden">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-50 to-rose-50 flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-amber-700 font-bold text-xl">+</span>
                    </div>
                    <p className="text-gray-600 font-medium">{item.title}</p>
                  </div>
                </div>
              )}
              {adminMode && !imageUrl && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-center px-4 text-sm">{item.prompt}</p>
                </div>
              )}
            </div>
            
            {adminMode && (
              <div className="p-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
                  <label className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer transition-colors duration-200">
                    {uploading === item.id ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, item.id)}
                      className="hidden"
                    />
                  </label>
                </div>
                {!imageUrl && (
                  <button
                    onClick={() => copyPrompt(item.prompt, item.id)}
                    className="mt-1 text-xs bg-gray-100 hover:bg-gray-200 text-amber-700 px-2 py-1 rounded transition-colors duration-200"
                    type="button"
                  >
                    {copiedId === item.id ? 'Copied!' : 'Copy Prompt'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0.95]);
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id;
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkAdminStatus();

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [
    {
      title: "Signature Cuts",
      description: "Precision haircuts tailored to your face shape, lifestyle, and hair type. Our expert stylists combine technical skill with artistic vision.",
      price: "$65-$120",
      icon: "✂️",
      duration: "60-90 mins"
    },
    {
      title: "Balayage & Color",
      description: "Custom color techniques from subtle highlights to dramatic transformations. We use premium, ammonia-free products for healthy, vibrant results.",
      price: "$120-$280",
      icon: "🎨",
      duration: "2-3 hours"
    },
    {
      title: "Bridal & Special Occasion",
      description: "Complete styling packages including hair, makeup, and trials. We create timeless, camera-ready looks that last all day.",
      price: "$150-$400",
      icon: "👰",
      duration: "2-4 hours"
    },
    {
      title: "Men's Grooming",
      description: "Classic and contemporary cuts with attention to detail. Includes hot towel treatment and precision styling for the modern gentleman.",
      price: "$45-$85",
      icon: "🧔",
      duration: "45-60 mins"
    },
    {
      title: "Curly Hair Specialist",
      description: "Specialized care for natural curls using the DevaCut technique. We enhance your curl pattern while reducing frizz and improving definition.",
      price: "$85-$150",
      icon: "💫",
      duration: "90-120 mins"
    },
    {
      title: "Keratin Treatments",
      description: "Professional smoothing treatments that eliminate frizz and reduce styling time by up to 80%. Results last 3-6 months with proper care.",
      price: "$200-$450",
      icon: "✨",
      duration: "2-3 hours"
    }
  ];

  const stylists = [
    {
      name: "Sophie Laurent",
      title: "Master Colorist & Salon Director",
      bio: "With 12 years of experience and training in Paris, Sophie specializes in dimensional color and precision cutting. Her work has been featured in Vogue and Allure.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5ab?auto=format&fit=crop&w=400&q=80"
    },
    {
      name: "Marcus Chen",
      title: "Men's Specialist & Barber",
      bio: "Marcus brings 8 years of expertise in men's grooming and classic barbering techniques. He's known for his meticulous attention to detail and personalized consultations.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
    },
    {
      name: "Elena Rodriguez",
      title: "Bridal & Special Occasion Expert",
      bio: "Elena's artistic eye and calming presence make her the go-to stylist for brides and special events. She creates looks that are both stunning and practical for all-day wear.",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80"
    },
    {
      name: "Jamal Washington",
      title: "Curly Hair Specialist",
      bio: "Certified in the DevaCut method, Jamal transforms curly hair with techniques that enhance natural texture and reduce frizz. His clients praise his patient, educational approach.",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
    }
  ];

  const testimonials = [
    {
      name: "Rachel Thompson",
      text: "I came in with damaged, over-processed hair and Sophie completely transformed it. The balayage is so natural-looking, and my hair feels healthier than ever. Worth every penny!",
      rating: 5
    },
    {
      name: "David Miller",
      text: "Marcus is the best barber I've ever had. He actually listens to what I want and remembers my preferences. The hot towel treatment is an amazing touch that makes me feel like royalty.",
      rating: 5
    },
    {
      name: "Maya Johnson",
      text: "Elena did my wedding hair and it was absolutely perfect. It stayed in place all day despite the humidity, and looked even better in photos than in person. My bridesmaids were all jealous!",
      rating: 5
    }
  ];

  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would send to your backend API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setBookingSuccess(true);
      setTimeout(() => {
        setIsBookingModalOpen(false);
        setBookingSuccess(false);
        resetBookingForm();
      }, 3000);
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBookingForm = () => {
    setSelectedService(null);
    setBookingDate('');
    setBookingTime('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setBookingNotes('');
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="bg-amber-400 w-10 h-10 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl md:text-2xl text-gray-900">Lumière Salon</h1>
              <p className="text-xs text-amber-600 font-medium">Where beauty meets artistry</p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#services" className="font-medium hover:text-amber-600 transition-colors">Services</a>
            <a href="#stylists" className="font-medium hover:text-amber-600 transition-colors">Our Team</a>
            <a href="#portfolio" className="font-medium hover:text-amber-600 transition-colors">Portfolio</a>
            <a href="#reviews" className="font-medium hover:text-amber-600 transition-colors">Reviews</a>
            <button 
              onClick={() => setIsBookingModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2 rounded-full transition-colors shadow-md hover:shadow-lg"
            >
              Book Now
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white py-4 mt-2"
          >
            <div className="container mx-auto px-4 space-y-4">
              <a href="#services" className="block font-medium py-2 hover:text-amber-600 transition-colors">Services</a>
              <a href="#stylists" className="block font-medium py-2 hover:text-amber-600 transition-colors">Our Team</a>
              <a href="#portfolio" className="block font-medium py-2 hover:text-amber-600 transition-colors">Portfolio</a>
              <a href="#reviews" className="block font-medium py-2 hover:text-amber-600 transition-colors">Reviews</a>
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsBookingModalOpen(true);
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-full transition-colors mt-2"
              >
                Book Now
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-24 overflow-hidden">
        <motion.div 
          style={{ opacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-rose-50/80" />
          <img 
            src="https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=2000&q=80" 
            alt="Modern salon interior with elegant styling stations" 
            className="w-full h-full object-cover opacity-80"
            loading="eager"
          />
        </motion.div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-4 py-1 rounded-full mb-4">
              Book your transformation today
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Where <span className="text-amber-600">Artistry</span> Meets <span className="text-rose-500">Beauty</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Experience personalized hair artistry in our award-winning salon. We don't just style hair—we create confidence that lasts.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded-full text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                Book Your Appointment <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <a href="#portfolio" className="bg-white/90 backdrop-blur-sm text-gray-800 font-medium px-8 py-4 rounded-full text-lg border-2 border-gray-200 hover:border-amber-300 transition-all">
                View Our Work
              </a>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="container mx-auto px-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-100 p-3 rounded-xl">
                    <Star className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">4.9/5 Stars</p>
                    <p className="text-sm text-gray-600">250+ Reviews</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-rose-100 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Serving Since 2015</p>
                    <p className="text-sm text-gray-600">Expert stylists</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">123 Beauty Lane</p>
                    <p className="text-sm text-gray-600">Downtown Seattle</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-4 py-1 rounded-full mb-4">
              Our Signature Services
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Crafted for Your Unique Beauty
            </h2>
            <p className="text-gray-600 text-lg">
              Every service begins with a personalized consultation to understand your vision, lifestyle, and hair goals. We use only premium, eco-friendly products.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100"
              >
                <div className="p-6">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-amber-600 text-lg">{service.price}</span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedService(service);
                      setIsBookingModalOpen(true);
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Book This Service
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button 
              onClick={() => setIsBookingModalOpen(true)}
              className="bg-white text-amber-600 font-bold px-8 py-4 rounded-full border-2 border-amber-300 hover:bg-amber-50 transition-colors shadow-md"
            >
              View All Services & Pricing
            </button>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section id="stylists" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-block bg-rose-100 text-rose-800 text-sm font-medium px-4 py-1 rounded-full mb-4">
              Meet Our Artists
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Masters of Their Craft
            </h2>
            <p className="text-gray-600 text-lg">
              Our stylists are not just technicians—they're artists who stay at the forefront of trends while honoring the fundamentals of great hair design.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stylists.map((stylist, index) => (
              <motion.div
                key={stylist.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={stylist.image} 
                    alt={stylist.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="font-bold text-lg">{stylist.name}</p>
                      <p className="text-sm opacity-90">{stylist.title}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-1">{stylist.name}</h3>
                  <p className="text-amber-600 font-medium mb-2">{stylist.title}</p>
                  <p className="text-gray-600 text-sm mb-4">{stylist.bio}</p>
                  <button className="text-amber-600 font-medium text-sm hover:text-amber-700 transition-colors flex items-center">
                    View Profile <ArrowRight className="ml-1 w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20 bg-gradient-to-br from-amber-50 to-rose-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-4 py-1 rounded-full mb-4">
              Our Work Gallery
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transformations That Speak Volumes
            </h2>
            <p className="text-gray-600 text-lg">
              Every strand tells a story. See the artistry and skill that defines the Lumière Salon experience.
            </p>
          </motion.div>

          <GallerySkeleton />

          {adminMode && (
            <div className="mt-8 text-center p-4 bg-amber-50/50 rounded-xl border border-amber-200">
              <p className="text-amber-700 font-medium flex items-center justify-center">
                <Star className="w-5 h-5 mr-2" />
                Admin Mode: Upload portfolio images to showcase your best work
              </p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button 
              onClick={() => setIsBookingModalOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold px-8 py-4 rounded-full hover:opacity-90 transition-opacity shadow-lg"
            >
              Get Your Transformation
            </button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="reviews" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-block bg-rose-100 text-rose-800 text-sm font-medium px-4 py-1 rounded-full mb-4">
              Client Love
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Raving Fans, Stunning Results
            </h2>
            <p className="text-gray-600 text-lg">
              Don't just take our word for it—hear what our clients have to say about their Lumière Salon experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 p-8 rounded-2xl border border-gray-200 hover:border-amber-300 transition-colors"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full flex items-center justify-center mr-4">
                    <span className="font-bold text-white text-lg">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-amber-600">Loyal Client</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <div className="inline-block bg-white rounded-full px-6 py-3 shadow-md border border-gray-200">
              <div className="flex items-center space-x-2">
                <Star className="w-6 h-6 text-amber-400 fill-current" />
                <span className="font-bold text-2xl">4.9</span>
                <span className="text-gray-600">/5 from 250+ reviews</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-500 to-rose-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
              Ready for Your Hair Transformation?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join hundreds of satisfied clients who trust Lumière Salon for their most important hair moments. Limited appointments available each week.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="bg-white text-amber-600 font-bold px-8 py-4 rounded-full text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Book Your Appointment
              </button>
              <button className="bg-black/20 backdrop-blur-sm text-white font-medium px-8 py-4 rounded-full text-lg border-2 border-white/30 hover:border-white transition-colors">
                Call Us: (206) 555-7890
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-amber-400 w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">L</span>
                </div>
                <h3 className="font-serif font-bold text-xl text-white">Lumière Salon</h3>
              </div>
              <p className="mb-4">
                Award-winning hair salon in the heart of Seattle, specializing in personalized transformations that enhance your natural beauty.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <h4 className="font-bold text-white mb-4">Services</h4>
              <ul className="space-y-2">
                {services.slice(0, 4).map(service => (
                  <li key={service.title}>
                    <a href="#" className="hover:text-amber-400 transition-colors">{service.title}</a>
                  </li>
                ))}
                <li>
                  <a href="#" className="text-amber-400 font-medium hover:text-amber-300 transition-colors">View All Services</a>
                </li>
              </ul>
            </div>
            
            <div className="md:col-span-1">
              <h4 className="font-bold text-white mb-4">Studio Hours</h4>
              <ul className="space-y-1">
                <li>Monday: Closed</li>
                <li>Tuesday-Thursday: 9am-7pm</li>
                <li>Friday-Saturday: 9am-8pm</li>
                <li>Sunday: 10am-5pm</li>
              </ul>
              <div className="mt-4 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <span>(206) 555-7890</span>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <h4 className="font-bold text-white mb-4">Location</h4>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
                <div>
                  <p>123 Beauty Lane</p>
                  <p>Downtown Seattle, WA 98101</p>
                  <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors mt-2 block">
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} Lumière Salon. All rights reserved.</p>
            <p className="mt-2 text-gray-500">
              Premium hair artistry in Seattle's most trusted salon since 2015
            </p>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsBookingModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {bookingSuccess ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="font-bold text-2xl text-gray-900 mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for choosing Lumière Salon. We've sent your appointment details to your email.
                  </p>
                  <div className="bg-amber-50 p-4 rounded-lg text-left mb-6">
                    <p className="font-medium">{selectedService?.title}</p>
                    <p className="text-gray-600">{bookingDate} at {bookingTime}</p>
                    <p className="text-gray-600 mt-2">Client: {clientName}</p>
                  </div>
                  <button
                    onClick={() => setIsBookingModalOpen(false)}
                    className="w-full bg-amber-500 text-white font-bold py-3 rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-serif font-bold text-xl text-gray-900">
                      {selectedService ? selectedService.title : 'Book Your Appointment'}
                    </h3>
                    <button onClick={() => setIsBookingModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
                    {selectedService && (
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold text-gray-900">{selectedService.title}</p>
                          <p className="font-bold text-amber-600">{selectedService.price}</p>
                        </div>
                        <p className="text-gray-600 text-sm">{selectedService.duration}</p>
                        <p className="text-gray-700 text-sm mt-1">{selectedService.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                        <select
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select a time</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:30 AM">10:30 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:30 PM">1:30 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:30 PM">4:30 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Notes</label>
                        <textarea
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          rows={3}
                          placeholder="Any specific requests or preferences for your appointment?"
                        />
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg text-sm text-gray-700">
                      <p className="flex items-start">
                        <MessageSquare className="w-4 h-4 text-amber-600 mr-2 mt-1 flex-shrink-0" />
                        <span>
                          We'll send a confirmation email with all details. For same-day bookings, please call us directly at (206) 555-7890.
                        </span>
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Booking Your Appointment...' : 'Confirm Booking'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Booking Button - Mobile Only */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsBookingModalOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-rose-500 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
        >
          <Calendar className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// Simple Menu Icon Component
function Menu({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
    </svg>
  );
}