// File: app/local-business/premium-dental-clinic/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Dental-specific gallery content
const GALLERY_ITEMS = [
  { 
    id: 'office-interior', 
    title: 'Modern Office',
    prompt: 'A modern, bright dental office interior with large windows, contemporary furniture, and warm lighting that conveys cleanliness and comfort. Include subtle natural elements like plants and wood accents to create a welcoming atmosphere.'
  },
  { 
    id: 'dental-technology', 
    title: 'Advanced Technology',
    prompt: 'State-of-the-art dental equipment including digital X-ray machines, 3D scanners, and ergonomic dental chairs arranged in a clean, professional setting. Show the equipment in use with soft focus on the details, emphasizing precision and innovation.'
  },
  { 
    id: 'smile-transformation', 
    title: 'Smile Transformations',
    prompt: 'A dramatic before-and-after dental transformation showing a patient\'s smile improvement through professional cosmetic dentistry. Focus on natural-looking results with perfect alignment and bright, healthy teeth against a neutral background.'
  },
];

type GalleryState = { [key: string]: { image_url: string | null } };

const GallerySection = () => {
  const [gallery, setGallery] = useState<GalleryState>({});
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
        console.error('Error loading gallery images:', error);
        return;
      }

      const initialState: GalleryState = {};
      GALLERY_ITEMS.forEach(item => initialState[item.id] = { image_url: null });

      if (images) {
        const latestImagePerItem: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const itemId = pathParts[2];
            if (GALLERY_ITEMS.some(a => a.id === itemId) && !latestImagePerItem[itemId]) {
              latestImagePerItem[itemId] = img.path;
            }
          }
        }

        GALLERY_ITEMS.forEach(item => {
          if (latestImagePerItem[item.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerItem[item.id]).data.publicUrl;
            initialState[item.id] = { image_url: url };
          }
        });
      }

      setGallery(initialState);
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
      setGallery(prev => ({ ...prev, [itemId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Gallery upload failed:', err);
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
    <section className="py-16 bg-gray-50" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Dental Excellence
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience the perfect blend of advanced technology, artistic skill, and compassionate care at Summit Dental Studio.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {GALLERY_ITEMS.map((item) => {
            const itemData = gallery[item.id] || { image_url: null };
            const imageUrl = itemData.image_url;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl overflow-hidden shadow-lg"
              >
                {imageUrl ? (
                  <div className="relative h-64 w-full">
                    <Image 
                      src={imageUrl} 
                      alt={item.title} 
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      priority
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/placeholder-dental.jpg';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-blue-600 font-bold text-2xl">{item.title.charAt(0)}</span>
                      </div>
                      <p className="text-gray-500 font-medium">{item.title}</p>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  {adminMode && !imageUrl && (
                    <div className="mt-2 mb-4">
                      <p className="text-sm text-blue-600 italic mb-2">{item.prompt}</p>
                      <button
                        onClick={() => copyPrompt(item.prompt, item.id)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        type="button"
                      >
                        {copiedId === item.id ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>
                  )}
                  <p className="text-gray-600 mb-4">
                    {item.id === 'office-interior' && 'Our serene, modern office designed for your comfort and relaxation.'}
                    {item.id === 'dental-technology' && 'Cutting-edge dental technology for precise, efficient, and comfortable treatments.'}
                    {item.id === 'smile-transformation' && 'Real patient transformations showcasing our cosmetic dentistry expertise.'}
                  </p>
                  {adminMode && (
                    <label className="block mt-2">
                      <span className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded cursor-pointer inline-flex items-center justify-center hover:bg-blue-700 transition-colors">
                        {uploading === item.id ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </span>
                        ) : (
                          'Upload Image'
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, item.id)}
                          className="hidden"
                        />
                      </span>
                    </label>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {adminMode && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            👤 Admin Mode: Upload images to showcase your dental practice. Use detailed prompts for AI-generated previews.
          </div>
        )}
      </div>
    </section>
  );
};

const DentalPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [appointmentModal, setAppointmentModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true });

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send data to your backend
    console.log('Form submitted:', formData);
    setFormSubmitted(true);
    setTimeout(() => {
      setAppointmentModal(false);
      setFormSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: ''
      });
    }, 3000);
  };

  const services = [
    {
      id: 'cosmetic',
      title: 'Cosmetic Dentistry',
      description: 'Transform your smile with veneers, teeth whitening, and smile makeovers that blend artistry with dental science.',
      icon: '✨'
    },
    {
      id: 'implants',
      title: 'Dental Implants',
      description: 'Permanent tooth replacement solutions that look, feel, and function like natural teeth with advanced implant technology.',
      icon: '🦷'
    },
    {
      id: 'orthodontics',
      title: 'Clear Aligners',
      description: 'Discreet teeth straightening with Invisalign® and other clear aligner systems for adults and teens.',
      icon: '💫'
    },
    {
      id: 'general',
      title: 'Preventive Care',
      description: 'Comprehensive dental checkups, cleanings, and treatments designed to maintain optimal oral health for life.',
      icon: '🛡️'
    }
  ];

  const team = [
    {
      id: 'dr-smith',
      name: 'Dr. Emma Rodriguez',
      title: 'Lead Dentist & Cosmetic Specialist',
      bio: 'Harvard-trained with 15+ years of experience in cosmetic and restorative dentistry. Known for her gentle approach and artistic eye for smile design.'
    },
    {
      id: 'dr-patel',
      name: 'Dr. Michael Chen',
      title: 'Implant & Restorative Specialist',
      bio: 'UCSF graduate specializing in dental implants and complex restorative cases. Combines technical precision with patient-centered care.'
    }
  ];

  const testimonials = [
    {
      id: 'test1',
      name: 'Sarah Johnson',
      location: 'Boulder, CO',
      text: 'Dr. Rodriguez transformed my smile with veneers, and I\'ve never felt more confident. The entire team made me feel like family from day one.'
    },
    {
      id: 'test2',
      name: 'David Thompson',
      location: 'Denver, CO',
      text: 'After years of avoiding the dentist due to anxiety, Summit Dental Studio changed everything. Their gentle approach and advanced pain management made my implant procedure completely stress-free.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isSticky ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                S
              </div>
              <span className="text-xl md:text-2xl font-bold text-gray-900">Summit Dental Studio</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#services" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Services</Link>
              <Link href="#team" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Our Team</Link>
              <Link href="#gallery" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Gallery</Link>
              <Link href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Contact</Link>
              <button 
                onClick={() => setAppointmentModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                Book Appointment
              </button>
            </div>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white shadow-lg mt-2 py-4">
            <div className="flex flex-col space-y-4 px-4">
              <Link href="#services" className="text-gray-700 hover:text-blue-600 font-medium py-2 border-b border-gray-100" onClick={() => setIsMenuOpen(false)}>Services</Link>
              <Link href="#team" className="text-gray-700 hover:text-blue-600 font-medium py-2 border-b border-gray-100" onClick={() => setIsMenuOpen(false)}>Our Team</Link>
              <Link href="#gallery" className="text-gray-700 hover:text-blue-600 font-medium py-2 border-b border-gray-100" onClick={() => setIsMenuOpen(false)}>Gallery</Link>
              <Link href="#contact" className="text-gray-700 hover:text-blue-600 font-medium py-2 border-b border-gray-100" onClick={() => setIsMenuOpen(false)}>Contact</Link>
              <button 
                onClick={() => {
                  setAppointmentModal(true);
                  setIsMenuOpen(false);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors mt-2"
              >
                Book Appointment
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-4 py-1 rounded-full">
                Boulder's Premier Dental Experience
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Exceptional Dental Care <br />in the Heart of Boulder
              </h1>
              <p className="text-xl text-gray-600 max-w-xl">
                Where advanced dentistry meets personalized care. Experience the difference that comes from a team dedicated to your comfort and beautiful, healthy smiles.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => setAppointmentModal(true)}
                  className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Schedule Your Visit
                </button>
                <button className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors">
                  Virtual Office Tour
                </button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-300 to-indigo-400 rounded-3xl blur-xl opacity-25"></div>
              <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden p-4">
                <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl">🦷</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Modern Dental Care</h3>
                    <p className="text-gray-600">Advanced technology meets compassionate care</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Premium Dental Services
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Comprehensive dental care designed around your unique needs and goals. Every treatment plan is customized for optimal results and comfort.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <Link 
                  href="#contact"
                  onClick={() => setFormData(prev => ({ ...prev, service: service.title }))}
                  className="text-blue-600 font-medium hover:text-blue-800 transition-colors inline-flex items-center"
                >
                  Learn More →
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section - Integrated GallerySkeleton */}
      <GallerySection />

      {/* Team Section */}
      <section className="py-20 bg-gray-50" id="team">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Expert Team
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our dentists combine exceptional technical skill with genuine compassion. Each team member is committed to providing the highest standard of care in a warm, welcoming environment.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {team.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  <div className="md:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-blue-800">
                        {member.name.charAt(0)}
                      </div>
                      <div className="text-blue-600 font-medium">{member.title}</div>
                    </div>
                  </div>
                  <div className="md:col-span-2 p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                    <p className="text-gray-600 mb-4">{member.bio}</p>
                    <div className="flex space-x-3">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Patients Say
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it—hear from patients who have experienced the Summit Dental Studio difference firsthand.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-8 border border-gray-200 relative"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  "
                </div>
                <p className="text-gray-700 italic mb-6 pt-4">{testimonial.text}</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center font-bold text-lg mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact/CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Transform Your Smile?
              </h2>
              <p className="text-blue-100 text-lg">
                Contact us today to schedule your consultation. Our friendly team is here to answer your questions and help you achieve the healthy, beautiful smile you deserve.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <span>(303) 555-0198</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span>info@summitdentalstudio.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>2255 Pearl Street, Boulder, CO 80302</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white text-gray-900 rounded-2xl p-8 shadow-xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-center">Request an Appointment</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(303) 555-0198"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">Service Interested In</label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.title}>{service.title}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about your dental needs or concerns..."
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={formSubmitted}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {formSubmitted ? 'Appointment Requested!' : 'Schedule Your Visit'}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">
                  S
                </div>
                <span className="text-xl font-bold">Summit Dental Studio</span>
              </div>
              <p className="text-gray-400 mb-4">
                Boulder's premier dental practice combining advanced technology with personalized, compassionate care.
              </p>
              <div className="flex space-x-4">
                {[...Array(4)].map((_, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                    <span className="text-lg">📱</span>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-1">
              <h4 className="text-lg font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {['Services', 'Our Team', 'Gallery', 'Contact', 'FAQs', 'Blog'].map((link, index) => (
                  <li key={index}>
                    <a href={`#${link.toLowerCase()}`} className="text-gray-400 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="md:col-span-1">
              <h4 className="text-lg font-bold mb-4">Services</h4>
              <ul className="space-y-2">
                {services.map((service, index) => (
                  <li key={index}>
                    <a href="#services" className="text-gray-400 hover:text-white transition-colors">
                      {service.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="md:col-span-1">
              <h4 className="text-lg font-bold mb-4">Contact Info</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 01-1.414 2.425L3 19.5V8z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12a7 7 0 1014 0 7 7 0 00-14 0z"></path>
                  </svg>
                  <span>2255 Pearl Street<br/>Boulder, CO 80302</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <span>(303) 555-0198</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 01-1.414 2.425L5 18.5V8z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12a7 7 0 1014 0 7 7 0 00-14 0z"></path>
                  </svg>
                  <span>Mon-Fri: 8am-5pm</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Summit Dental Studio. All rights reserved. | Boulder's Premier Dental Practice</p>
          </div>
        </div>
      </footer>

      {/* Appointment Modal */}
      {appointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Schedule Your Appointment</h3>
                <button 
                  onClick={() => setAppointmentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="modal-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      id="modal-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      id="modal-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(303) 555-0198"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="modal-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="modal-service" className="block text-sm font-medium text-gray-700 mb-1">Service Interested In</label>
                  <select
                    id="modal-service"
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.title}>{service.title}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="modal-message" className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                  <textarea
                    id="modal-message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about your dental needs or concerns..."
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={formSubmitted}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {formSubmitted ? 'Appointment Requested!' : 'Schedule Your Visit'}
                </button>
              </form>
              
              <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>Prefer to call? Dial (303) 555-0198 for immediate assistance</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {formSubmitted && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-up">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="font-medium">Perfect! Your appointment request has been received. We'll contact you within 24 hours to confirm your visit.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalPage;