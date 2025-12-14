'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Calendar, Clock, Star, ChevronDown, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

const YOGA_ARTWORKS = [
  { 
    id: 'morning-flow', 
    title: 'Morning Flow',
    prompt: 'A serene yoga studio at sunrise with warm golden light streaming through large windows, showing a yogi in perfect downward dog pose on a natural mat. Soft morning mist outside, minimalist decor with plants and wooden floors, peaceful atmosphere.'
  },
  { 
    id: 'meditation-space', 
    title: 'Meditation Space',
    prompt: 'A tranquil meditation space with soft cushioned seating arranged in a circle, gentle candlelight and incense smoke creating a mystical ambiance. Large windows showing a zen garden with bamboo and water feature, soft bokeh effect, calming blue and cream color palette.'
  },
  { 
    id: 'sunset-yoga', 
    title: 'Sunset Yoga',
    prompt: 'An outdoor yoga session on a wooden deck overlooking mountains at sunset, silhouettes of yogis in tree pose against vibrant orange and purple sky. Gentle breeze moving through their clothing, distant birds flying, peaceful mountain landscape, professional photography style.'
  },
  {
    id: 'yoga-community',
    title: 'Yoga Community',
    prompt: 'A diverse group of people practicing yoga together in a bright, airy studio with high ceilings and hanging plants. Warm smiles, supportive atmosphere, natural light filtering through skylights, various body types and ages represented, authentic community feeling.'
  },
  {
    id: 'restorative-yoga',
    title: 'Restorative Yoga',
    prompt: 'A cozy restorative yoga setup with bolsters, blankets, and eye pillows on soft rugs. Dim ambient lighting with fairy lights, gentle steam rising from herbal tea cups nearby, peaceful nighttime scene with moonlight through windows, ultimate relaxation vibe.'
  }
];

type ArtworkState = { [key: string]: { image_url: string | null } };
type Testimonial = {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  image?: string;
};

export default function HomePage() {
  const [artworks, setArtworks] = useState<ArtworkState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);
  const headerBackdrop = useTransform(scrollY, [0, 50], ['transparent', 'rgba(255,255,255,0.9)']);

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Marketing Executive',
      content: 'Serenity Flow completely transformed my relationship with yoga. The on-demand classes fit perfectly into my busy schedule, and the live sessions create such a genuine sense of community. I\'ve never felt more connected to my practice.',
      rating: 5,
      image: artworks['yoga-community']?.image_url || '/placeholder.jpg'
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Software Developer',
      content: 'As someone who struggles with anxiety, the meditation courses have been life-changing. The instructors are incredibly knowledgeable and create a safe space for beginners. I look forward to my practice every single day.',
      rating: 5,
      image: artworks['meditation-space']?.image_url || '/placeholder.jpg'
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      role: 'Teacher',
      content: 'I\'ve tried many online yoga platforms, but Serenity Flow stands out for its thoughtful sequencing and attention to alignment. The restorative classes have helped me recover from chronic back pain, and the community support is unmatched.',
      rating: 5,
      image: artworks['restorative-yoga']?.image_url || '/placeholder.jpg'
    }
  ];

  const courses = [
    {
      id: 'beginner-flow',
      title: 'Foundations Flow',
      description: 'Perfect for beginners or those returning to yoga. Learn fundamental poses, breathing techniques, and build a sustainable practice.',
      duration: '4 Weeks',
      level: 'Beginner',
      image: artworks['morning-flow']?.image_url || '/placeholder.jpg',
      price: '$89',
      originalPrice: '$129'
    },
    {
      id: 'mindful-movement',
      title: 'Mindful Movement',
      description: 'Explore the connection between movement and meditation. This course blends gentle yoga with mindfulness practices for stress relief.',
      duration: '6 Weeks',
      level: 'All Levels',
      image: artworks['meditation-space']?.image_url || '/placeholder.jpg',
      price: '$119',
      originalPrice: '$159'
    },
    {
      id: 'power-yoga',
      title: 'Power Vinyasa',
      description: 'Build strength, flexibility, and endurance with dynamic sequences designed to challenge and transform your body and mind.',
      duration: '8 Weeks',
      level: 'Intermediate',
      image: artworks['sunset-yoga']?.image_url || '/placeholder.jpg',
      price: '$149',
      originalPrice: '$189'
    }
  ];

  const instructors = [
    {
      id: '1',
      name: 'Maya Sharma',
      title: 'Lead Instructor & Founder',
      bio: 'With over 15 years of teaching experience and training in multiple yoga traditions, Maya brings deep wisdom and infectious joy to every class.',
      specialties: ['Hatha', 'Vinyasa', 'Meditation'],
      image: artworks['morning-flow']?.image_url || '/placeholder.jpg'
    },
    {
      id: '2',
      name: 'David Chen',
      title: 'Mindfulness & Meditation Specialist',
      bio: 'David combines his background in psychology with yoga to create transformative experiences that heal both body and mind.',
      specialties: ['Yin Yoga', 'Breathwork', 'Trauma-Informed Practice'],
      image: artworks['meditation-space']?.image_url || '/placeholder.jpg'
    },
    {
      id: '3',
      name: 'Sophia Rodriguez',
      title: 'Restorative & Therapeutic Yoga',
      bio: 'A physical therapist turned yoga teacher, Sophia specializes in helping students recover from injury and find sustainable movement patterns.',
      specialties: ['Restorative', 'Therapeutic', 'Prenatal'],
      image: artworks['restorative-yoga']?.image_url || '/placeholder.jpg'
    }
  ];

  const faqs = [
    {
      question: 'Do I need prior yoga experience?',
      answer: 'Not at all! Our platform is designed for all levels, from complete beginners to experienced practitioners. Each course clearly indicates the recommended level, and our instructors provide modifications for every pose.'
    },
    {
      question: 'What equipment do I need?',
      answer: 'All you need is a yoga mat and comfortable clothing. We provide guidance on optional props like blocks, straps, and bolsters, but everything can be adapted using household items like books, towels, or pillows.'
    },
    {
      question: 'How long do I have access to the courses?',
      answer: 'Once you enroll in a course, you have lifetime access to all materials, including video lessons, downloadable guides, and community forums. You can revisit the content anytime at your own pace.'
    },
    {
      question: 'Can I cancel my membership anytime?',
      answer: 'Yes! We offer flexible monthly and annual memberships with no long-term contracts. You can cancel anytime through your account settings, and you\'ll retain access until the end of your current billing period.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Monthly Membership',
      price: '$24',
      billed: 'billed monthly',
      description: 'Perfect for trying out our platform',
      features: [
        'Unlimited access to all on-demand classes',
        '2 live classes per week',
        'Community forum access',
        'Basic pose library'
      ],
      cta: 'Start Monthly'
    },
    {
      name: 'Annual Membership',
      price: '$199',
      billed: 'billed annually',
      description: 'Best value - save 30%',
      features: [
        'Unlimited access to all on-demand classes',
        'Unlimited live classes',
        'Full community access',
        'Complete pose library & tutorials',
        'Monthly wellness workshops',
        'Priority support'
      ],
      cta: 'Get Annual',
      popular: true
    },
    {
      name: 'Lifetime Access',
      price: '$499',
      billed: 'one-time payment',
      description: 'Unlimited access forever',
      features: [
        'Everything in Annual plan',
        'All future course updates',
        'Exclusive masterclasses',
        'Personal practice consultations',
        'Downloadable content library'
      ],
      cta: 'Get Lifetime'
    }
  ];

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
      try {
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
        YOGA_ARTWORKS.forEach(art => initialState[art.id] = { image_url: null });

        if (images) {
          const latestImagePerArtwork: Record<string, string> = {};

          for (const img of images) {
            const pathParts = img.path.split('/');
            if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
              const artId = pathParts[2];
              if (YOGA_ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
                latestImagePerArtwork[artId] = img.path;
              }
            }
          }

          YOGA_ARTWORKS.forEach(art => {
            if (latestImagePerArtwork[art.id]) {
              const url = supabase.storage
                .from('user_images')
                .getPublicUrl(latestImagePerArtwork[art.id]).data.publicUrl;
              initialState[art.id] = { image_url: url };
            }
          });
        }

        setArtworks(initialState);
      } catch (err) {
        console.error('Error in loadImages:', err);
      }
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

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
      
      const sections = ['hero', 'courses', 'instructors', 'testimonials', 'pricing', 'faq', 'contact'];
      const sectionPositions = sections.map(sectionId => {
        const element = document.getElementById(sectionId);
        return {
          id: sectionId,
          position: element?.offsetTop || 0
        };
      });
      
      const currentSection = sectionPositions.find(section => 
        scrollPosition >= section.position - 100
      )?.id || 'hero';
      
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      {/* Header */}
      <motion.header 
        style={{ 
          backgroundColor: headerBackdrop,
          opacity: headerOpacity 
        }}
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? 'shadow-md py-2' : 'py-4'
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-amber-400 p-2 rounded-full">
              <span className="text-slate-900 font-bold text-xl">🧘</span>
            </div>
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-rose-500 bg-clip-text text-transparent">
              Serenity Flow
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {['courses', 'instructors', 'testimonials', 'pricing', 'contact'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`relative font-medium transition-colors ${
                  activeSection === section
                    ? 'text-amber-600'
                    : 'text-slate-700 hover:text-amber-600'
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
                {activeSection === section && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-600 rounded-full"
                    initial={false}
                  />
                )}
              </button>
            ))}
            <button className="bg-gradient-to-r from-amber-500 to-rose-500 text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity shadow-lg">
              Start Free Trial
            </button>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 hover:bg-slate-200 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {isMobileMenuOpen ? (
              <div className="w-6 h-0.5 bg-slate-700 rounded-full relative">
                <div className="absolute top-0 w-full h-full bg-slate-700 rotate-45"></div>
                <div className="absolute top-0 w-full h-full bg-slate-700 -rotate-45"></div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="w-6 h-0.5 bg-slate-700 rounded-full"></div>
                <div className="w-6 h-0.5 bg-slate-700 rounded-full"></div>
                <div className="w-6 h-0.5 bg-slate-700 rounded-full"></div>
              </div>
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg py-4 border-t border-slate-200"
          >
            <div className="container mx-auto px-4 space-y-4">
              {['courses', 'instructors', 'testimonials', 'pricing', 'contact'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`block w-full text-left py-2 px-4 rounded-lg font-medium ${
                    activeSection === section
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
              <button className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white py-3 rounded-lg font-medium mt-2">
                Start Free Trial
              </button>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Hero Section */}
      <section id="hero" className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block bg-gradient-to-r from-amber-100 to-rose-100 text-amber-800 px-4 py-1.5 rounded-full mb-6 font-medium"
            >
              🌟 New students get 3 months free - Limited time offer
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight"
            >
              Transform Your Life Through Mindful Movement
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto"
            >
              Join thousands of students who have discovered lasting peace, strength, and flexibility through our carefully crafted online yoga courses.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button className="bg-gradient-to-r from-amber-500 to-rose-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-opacity shadow-xl transform hover:scale-105">
                Start Your Free Trial
              </button>
              <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg border-2 border-slate-200 hover:bg-slate-50 transition-colors">
                View Course Catalog
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-12 flex items-center justify-center space-x-8 text-sm text-slate-600"
            >
              <div className="flex items-center">
                <Star className="text-amber-400 w-4 h-4 fill-current" />
                <span className="ml-1 font-medium">4.9/5</span>
                <span className="ml-1">(1,248 reviews)</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">15,000+</span>
                <span className="ml-1">Active Students</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">200+</span>
                <span className="ml-1">On-Demand Classes</span>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-gradient-to-br from-amber-200 to-rose-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-gradient-to-br from-sky-200 to-amber-200 rounded-full opacity-20 blur-3xl"></div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block bg-gradient-to-r from-amber-50 to-rose-50 text-amber-700 px-4 py-1 rounded-full mb-4 font-medium"
            >
              Our Signature Courses
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
            >
              Find Your Perfect Practice
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 text-lg"
            >
              Whether you're just starting your yoga journey or looking to deepen your practice, we have courses designed for every level and need.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-slate-100"
              >
                <div className="relative h-64">
                  {course.image ? (
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/placeholder.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-rose-50 flex items-center justify-center">
                      <span className="text-slate-400 text-lg">Course Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-amber-500 text-white px-4 py-2 rounded-full font-medium flex items-center space-x-2"
                    >
                      <span>View Course</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-gradient-to-r from-amber-100 to-rose-100 text-amber-800 text-sm px-3 py-1 rounded-full font-medium">
                      {course.level}
                    </span>
                    <span className="text-slate-500 text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.duration}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2 text-slate-900">{course.title}</h3>
                  <p className="text-slate-600 mb-4">{course.description}</p>
                  
                  <div className="flex items-baseline space-x-2 mb-4">
                    <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-rose-500 bg-clip-text text-transparent">
                      {course.price}
                    </span>
                    <span className="text-slate-400 line-through">{course.originalPrice}</span>
                    <span className="text-green-500 font-medium">Save 25%</span>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
                  >
                    Enroll Now
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button className="text-amber-600 hover:text-amber-700 font-medium flex items-center justify-center mx-auto">
              View All Courses
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Instructors Section */}
      <section id="instructors" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block bg-gradient-to-r from-amber-50 to-sky-50 text-amber-700 px-4 py-1 rounded-full mb-4 font-medium"
            >
              Meet Our Experts
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
            >
              World-Class Instructors
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 text-lg"
            >
              Learn from experienced teachers who are passionate about sharing the transformative power of yoga with students of all levels.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map((instructor, index) => (
              <motion.div
                key={instructor.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-100"
              >
                <div className="relative h-80">
                  {instructor.image ? (
                    <Image
                      src={instructor.image}
                      alt={instructor.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/placeholder.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
                      <span className="text-slate-400 text-5xl">🧘</span>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-1 text-slate-900">{instructor.name}</h3>
                  <p className="text-amber-600 font-medium mb-3">{instructor.title}</p>
                  <p className="text-slate-600 mb-4">{instructor.bio}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {instructor.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="bg-gradient-to-r from-amber-50 to-rose-50 text-amber-700 text-sm px-3 py-1 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-white border-2 border-amber-200 text-amber-700 py-2 rounded-lg font-medium hover:bg-amber-50 transition-colors"
                  >
                    View Profile
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block bg-gradient-to-r from-sky-50 to-amber-50 text-sky-700 px-4 py-1 rounded-full mb-4 font-medium"
            >
              What Our Students Say
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
            >
              Real Transformation Stories
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 text-lg"
            >
              Hear from students who have experienced profound changes in their physical health, mental clarity, and overall well-being.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-100 relative"
              >
                <div className="absolute -top-4 left-8 bg-gradient-to-r from-amber-400 to-rose-400 p-3 rounded-full">
                  <QuoteIcon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex items-center mb-6 mt-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-amber-200">
                    {testimonial.image ? (
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/placeholder.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center">
                        <span className="text-amber-700 font-bold text-lg">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{testimonial.name}</h4>
                    <p className="text-slate-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                
                <p className="text-slate-600 mb-4 italic relative z-10">
                  "{testimonial.content}"
                </p>
                
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating
                          ? 'text-amber-400 fill-current'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block bg-gradient-to-r from-amber-50 to-sky-50 text-amber-700 px-4 py-1 rounded-full mb-4 font-medium"
            >
              Simple, Transparent Pricing
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
            >
              Choose Your Perfect Plan
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 text-lg"
            >
              No hidden fees, no contracts. Cancel anytime. All plans include access to our entire library and community.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-2xl overflow-hidden ${
                  plan.popular
                    ? 'bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-200 relative'
                    : 'bg-white border border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2 text-slate-900">{plan.name}</h3>
                  <p className="text-slate-500 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-rose-500 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-slate-500 ml-2">{plan.billed}</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <svg className="w-5 h-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <motion.button
                    whileHover={{ scale: plan.popular ? 1.05 : 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-3 rounded-lg font-bold ${
                      plan.popular
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:opacity-90'
                        : 'bg-white border-2 border-slate-300 text-slate-900 hover:bg-slate-50'
                    } transition-colors`}
                  >
                    {plan.cta}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12 max-w-2xl mx-auto bg-gradient-to-r from-amber-50 to-rose-50 rounded-xl p-6 border border-amber-100"
          >
            <p className="text-slate-700 font-medium">
              🎁 <strong>Special Offer:</strong> Use code <span className="bg-white px-2 py-1 rounded font-mono">SERENITY25</span> for an additional 25% off your first year when you sign up before December 31st.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block bg-gradient-to-r from-sky-50 to-amber-50 text-sky-700 px-4 py-1 rounded-full mb-4 font-medium"
            >
              Frequently Asked Questions
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
            >
              Everything You Need to Know
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 text-lg"
            >
              We've answered the most common questions about our platform, courses, and membership options.
            </motion.p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl overflow-hidden border border-slate-200"
              >
                <button
                  className="w-full text-left p-6 flex justify-between items-center focus:outline-none hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    const element = document.getElementById(`faq-${index}`);
                    if (element) {
                      element.classList.toggle('hidden');
                      element.classList.toggle('block');
                    }
                  }}
                >
                  <span className="font-bold text-lg text-slate-900">{faq.question}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 transform transition-transform group-hover:rotate-180" />
                </button>
                <div id={`faq-${index}`} className="hidden p-6 pt-0 text-slate-600 border-t border-slate-100">
                  {faq.answer}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact/CTA Section */}
      <section id="contact" className="py-20 bg-gradient-to-r from-amber-500 to-rose-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full mb-4 font-medium"
            >
              Ready to Begin Your Journey?
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Start Your Transformation Today
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-lg mb-8 opacity-90"
            >
              Join our community of mindful movers and experience the profound benefits of a consistent yoga practice. Your first 7 days are completely free.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button className="bg-white text-amber-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition-colors shadow-lg">
                Start Free Trial
              </button>
              <button className="bg-black/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-black/30 transition-colors">
                Schedule a Consultation
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6 text-center"
            >
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>7-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>24/7 support</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-amber-400 p-2 rounded-full">
                  <span className="text-slate-900 font-bold text-xl">🧘</span>
                </div>
                <span className="text-2xl font-bold text-white">Serenity Flow</span>
              </div>
              <p className="text-slate-400">
                Transforming lives through mindful movement and breath. Join our global community of yogis dedicated to living with intention and peace.
              </p>
              <div className="flex space-x-4">
                {[Instagram, Facebook, Twitter].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center hover:bg-amber-500/20 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </a>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {['Home', 'Courses', 'Instructors', 'Pricing', 'Blog', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-amber-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">Courses</h3>
              <ul className="space-y-2">
                {['Beginner Yoga', 'Morning Flow', 'Meditation', 'Restorative Yoga', 'Power Vinyasa', 'Yoga for Athletes'].map((course) => (
                  <li key={course}>
                    <a href="#" className="hover:text-amber-400 transition-colors">
                      {course}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <MapPin className="w-5 h-5 text-amber-400 mr-3 mt-1 flex-shrink-0" />
                  <span>123 Serenity Lane, Boulder, CO 80301</span>
                </li>
                <li className="flex items-start">
                  <Phone className="w-5 h-5 text-amber-400 mr-3 mt-1 flex-shrink-0" />
                  <span>(303) 555-7890</span>
                </li>
                <li className="flex items-start">
                  <Mail className="w-5 h-5 text-amber-400 mr-3 mt-1 flex-shrink-0" />
                  <span>hello@serenityflow.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} Serenity Flow Yoga. All rights reserved.</p>
            <p className="mt-2">
              <a href="#" className="hover:text-amber-400 mx-2">Privacy Policy</a>
              <a href="#" className="hover:text-amber-400 mx-2">Terms of Service</a>
              <a href="#" className="hover:text-amber-400 mx-2">Refund Policy</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Gallery Section - Hidden from regular users */}
      {adminMode && (
        <section className="py-16 bg-slate-900 text-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Admin Gallery Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {YOGA_ARTWORKS.map((art) => {
                const artworkData = artworks[art.id] || { image_url: null };
                const imageUrl = artworkData.image_url;

                return (
                  <div key={art.id} className="bg-slate-800 rounded-lg overflow-hidden flex flex-col">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={art.title} 
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-64 bg-slate-700 flex items-center justify-center">
                        <span className="text-slate-400">No image uploaded</span>
                      </div>
                    )}

                    {adminMode && (
                      <div className="p-4 border-t border-slate-700 space-y-3">
                        {!imageUrl && (
                          <div className="flex flex-col gap-2">
                            <p className="text-xs text-amber-300">{art.prompt}</p>
                            <button
                              onClick={() => copyPrompt(art.prompt, art.id)}
                              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded self-start"
                              type="button"
                            >
                              {copiedId === art.id ? 'Copied!' : 'Copy Prompt'}
                            </button>
                          </div>
                        )}
                        <label className="block text-sm bg-amber-600 text-white px-3 py-2 rounded cursor-pointer inline-block w-full text-center">
                          {uploading === art.id ? 'Uploading…' : 'Upload Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, art.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    <div className="p-4 mt-auto">
                      <h3 className="font-semibold text-lg">{art.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">ID: {art.id}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-amber-900/30 border border-amber-600 rounded text-sm text-center">
              👤 Admin mode active — you can upload images and copy detailed prompts for the yoga platform.
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function QuoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2l4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9.998c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}