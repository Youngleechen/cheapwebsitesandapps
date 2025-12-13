'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Scissors, 
  Palette, 
  Shield, 
  Star, 
  ChevronRight,
  Instagram,
  Facebook,
  Calendar,
  User,
  CheckCircle,
  Sparkles,
  Award,
  Heart
} from 'lucide-react';
import Image from 'next/image';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'salon-gallery';

// Salon service data
const SERVICES = [
  { 
    id: 'precision-cut',
    title: 'Precision Cut',
    description: 'Expert cutting tailored to your face shape and hair texture',
    duration: '45 min',
    price: '$65+',
    color: 'from-blue-100 to-blue-50'
  },
  { 
    id: 'balayage-master',
    title: 'Balayage Master',
    description: 'Hand-painted highlights for a natural, sun-kissed look',
    duration: '3 hours',
    price: '$150+',
    color: 'from-amber-50 to-amber-100'
  },
  { 
    id: 'bridal-glory',
    title: 'Bridal Glory',
    description: 'Complete bridal hair package with trial and day-of styling',
    duration: 'Custom',
    price: '$250+',
    color: 'from-pink-50 to-pink-100'
  },
  { 
    id: 'scalp-revival',
    title: 'Scalp Revival',
    description: 'Therapeutic treatment for healthy scalp and hair growth',
    duration: '1 hour',
    price: '$85',
    color: 'from-green-50 to-green-100'
  },
  { 
    id: 'men-grooming',
    title: 'Men\'s Grooming',
    description: 'Classic cuts, beard trims, and modern styling',
    duration: '30 min',
    price: '$45+',
    color: 'from-gray-50 to-gray-100'
  },
  { 
    id: 'keratin-smooth',
    title: 'Keratin Smooth',
    description: 'Smoothing treatment for frizz-free, manageable hair',
    duration: '2.5 hours',
    price: '$300+',
    color: 'from-purple-50 to-purple-100'
  },
];

// Salon team members
const TEAM = [
  {
    id: 'sarah-j',
    name: 'Sarah Jensen',
    role: 'Master Stylist & Owner',
    experience: '12 years',
    specialty: 'Balayage & Color Correction'
  },
  {
    id: 'marcus-l',
    name: 'Marcus Lee',
    role: 'Cutting Specialist',
    experience: '8 years',
    specialty: 'Precision Cutting'
  },
  {
    id: 'chloe-r',
    name: 'Chloe Rodriguez',
    role: 'Color Director',
    experience: '10 years',
    specialty: 'Creative Color'
  },
  {
    id: 'david-k',
    name: 'David Kim',
    role: 'Stylist & Educator',
    experience: '6 years',
    specialty: 'Bridal & Formal'
  },
];

// Gallery sections with prompts for admin uploads
const GALLERY_SECTIONS = [
  { 
    id: 'salon-interior',
    title: 'Our Sanctuary',
    description: 'Modern, minimalist salon space',
    prompt: 'A beautifully lit modern hair salon interior with minimalist decor, clean lines, and comfortable styling chairs. Natural light streaming through large windows, showcasing the elegant reception area and styling stations.'
  },
  { 
    id: 'color-work',
    title: 'Color Mastery',
    description: 'Vibrant hair color transformations',
    prompt: 'A stunning hair color transformation showing before and after. Focus on vibrant, dimensional color with perfect blending and natural-looking roots. Hair should look healthy and shiny.'
  },
  { 
    id: 'bridal-styles',
    title: 'Bridal Elegance',
    description: 'Elegant wedding hairstyles',
    prompt: 'An elegant bridal updo with intricate braiding and soft curls. Hair accessories like delicate pins or a hair vine. The bride should look timeless and romantic with a flawless finish.'
  },
  { 
    id: 'mens-grooming',
    title: 'Modern Grooming',
    description: 'Sharp men\'s cuts and styling',
    prompt: 'A sharp, modern men\'s haircut with clean lines and texture. Well-groomed beard or stubble. The style should look contemporary and professionally executed.'
  },
  { 
    id: 'hair-health',
    title: 'Hair Wellness',
    description: 'Treatments and healthy results',
    prompt: 'A hair treatment session showing the care and attention to detail. Focus on healthy, shiny hair after treatment. Could show application of high-quality products.'
  },
  { 
    id: 'stylist-work',
    title: 'Artistry in Action',
    description: 'Our stylists at work',
    prompt: 'A skilled hair stylist carefully working on a client\'s hair. Show the precision and artistry involved in the process. The atmosphere should feel professional yet relaxing.'
  },
];

type GalleryState = { [key: string]: { image_url: string | null } };

export default function ModernHairSalon() {
  const [galleryImages, setGalleryImages] = useState<GalleryState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);

  // Check user session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
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

      const initialState: GalleryState = {};
      GALLERY_SECTIONS.forEach(section => initialState[section.id] = { image_url: null });

      if (images) {
        const latestImagePerSection: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX.replace('-', '_')) {
            const sectionId = pathParts[2];
            if (GALLERY_SECTIONS.some(s => s.id === sectionId) && !latestImagePerSection[sectionId]) {
              latestImagePerSection[sectionId] = img.path;
            }
          }
        }

        GALLERY_SECTIONS.forEach(section => {
          if (latestImagePerSection[section.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerSection[section.id]).data.publicUrl;
            initialState[section.id] = { image_url: url };
          }
        });
      }

      setGalleryImages(initialState);
    };

    loadGalleryImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(sectionId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${sectionId}/`;

      // Clean up old images for this section
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

      await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setGalleryImages(prev => ({ ...prev, [sectionId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, sectionId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(sectionId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setBookingSuccess(true);
    setIsSubmitting(false);
    
    // Reset form
    setBookingForm({
      name: '',
      email: '',
      phone: '',
      service: '',
      date: '',
      time: '',
      notes: ''
    });
    
    // Scroll to booking section
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ChromaCut</h1>
                <p className="text-xs text-gray-500">Modern Hair Studio</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-700 hover:text-purple-600 transition-colors">Services</a>
              <a href="#gallery" className="text-gray-700 hover:text-purple-600 transition-colors">Gallery</a>
              <a href="#team" className="text-gray-700 hover:text-purple-600 transition-colors">Team</a>
              <a href="#booking" className="text-gray-700 hover:text-purple-600 transition-colors">Book Now</a>
            </div>
            
            <button 
              onClick={scrollToBooking}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-shadow"
            >
              Book Appointment
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-purple-50" />
        <div className="container mx-auto px-4 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Award-Winning Salon</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                  Hair Story
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-xl">
                Where modern artistry meets personalized care. Experience hair transformation 
                that celebrates your unique beauty with our master stylists.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={scrollToBooking}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Your Transformation
                </button>
                <a 
                  href="#services"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:border-purple-400 transition-colors flex items-center justify-center"
                >
                  Explore Services
                  <ChevronRight className="w-5 h-5 ml-2" />
                </a>
              </div>
              
              <div className="mt-12 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">500+</div>
                  <div className="text-gray-600">Happy Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">4.9★</div>
                  <div className="text-gray-600">Google Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">15</div>
                  <div className="text-gray-600">Awards Won</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                {galleryImages['salon-interior']?.image_url ? (
                  <img 
                    src={galleryImages['salon-interior'].image_url}
                    alt="ChromaCut Salon Interior"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/salon-placeholder.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center">
                      <Scissors className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Salon interior image</p>
                    </div>
                  </div>
                )}
                {adminMode && (
                  <div className="absolute top-4 right-4">
                    <label className="block text-sm bg-white/90 backdrop-blur-sm text-purple-700 px-3 py-1 rounded-full cursor-pointer shadow-lg">
                      {uploading === 'salon-interior' ? 'Uploading…' : '📷 Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, 'salon-interior')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl max-w-xs">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Best Salon 2024</div>
                    <div className="text-sm text-gray-600">City Beauty Awards</div>
                  </div>
                </div>
                <div className="flex items-center">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                  <span className="ml-2 font-semibold text-gray-900">4.9/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-full mb-4">
              <Scissors className="w-4 h-4" />
              <span className="font-medium">Our Signature Services</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Expert Care for Every Strand
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From precision cuts to vibrant color transformations, discover services 
              tailored to enhance your natural beauty.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service) => (
              <div 
                key={service.id}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-pink-100"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6`}>
                  {service.id.includes('cut') && <Scissors className="w-8 h-8 text-gray-800" />}
                  {service.id.includes('color') && <Palette className="w-8 h-8 text-gray-800" />}
                  {service.id.includes('bridal') && <Heart className="w-8 h-8 text-gray-800" />}
                  {service.id.includes('scalp') && <Shield className="w-8 h-8 text-gray-800" />}
                  {service.id.includes('keratin') && <Sparkles className="w-8 h-8 text-gray-800" />}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                
                <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-semibold text-gray-900">{service.duration}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Starting From</div>
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                      {service.price}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={scrollToBooking}
                  className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
                >
                  Book This Service
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-full mb-4">
              <Palette className="w-4 h-4" />
              <span className="font-medium">Our Portfolio</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Transformations That Inspire
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Witness the artistry and skill that goes into every ChromaCut transformation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {GALLERY_SECTIONS.map((section) => {
              const imageData = galleryImages[section.id] || { image_url: null };
              const imageUrl = imageData.image_url;
              
              return (
                <div key={section.id} className="group relative overflow-hidden rounded-2xl bg-gray-100">
                  <div className="aspect-square relative overflow-hidden">
                    {imageUrl ? (
                      <img 
                        src={imageUrl}
                        alt={section.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/salon-placeholder.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                        <div className="text-center p-8">
                          <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">{section.description}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-xl font-bold mb-2">{section.title}</h3>
                        <p className="text-sm opacity-90">{section.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {adminMode && (
                    <div className="absolute top-4 right-4 space-y-2">
                      {!imageUrl && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => copyPrompt(section.prompt, section.id)}
                            className="text-xs bg-black/70 text-white px-3 py-1.5 rounded-full hover:bg-black/90 transition-colors"
                            type="button"
                          >
                            {copiedId === section.id ? '✓ Copied!' : 'Copy Prompt'}
                          </button>
                        </div>
                      )}
                      <label className="block text-sm bg-white/90 backdrop-blur-sm text-purple-700 px-3 py-1.5 rounded-full cursor-pointer shadow-lg hover:bg-white transition-colors">
                        {uploading === section.id ? 'Uploading…' : '📷 Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, section.id)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-full mb-4">
              <User className="w-4 h-4" />
              <span className="font-medium">Meet Our Artists</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Master Stylists Behind
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                The Magic
              </span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM.map((member) => (
              <div key={member.id} className="group text-center">
                <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-200 flex items-center justify-center">
                    <User className="w-20 h-20 text-gray-600" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <div className="text-purple-600 font-semibold mb-3">{member.role}</div>
                
                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center justify-center space-x-2">
                    <Award className="w-4 h-4" />
                    <span>{member.experience} experience</span>
                  </div>
                  <div className="text-sm">{member.specialty}</div>
                </div>
                
                <button className="mt-6 text-sm bg-gray-100 text-gray-700 px-6 py-2 rounded-full font-semibold hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white transition-all duration-300">
                  Book with {member.name.split(' ')[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" ref={bookingRef} className="py-20 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Ready for Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                  Transformation?
                </span>
              </h2>
              <p className="text-xl text-gray-600">
                Book your appointment and experience the ChromaCut difference.
              </p>
            </div>
            
            {bookingSuccess ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-xl border border-green-100">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Thank you for choosing ChromaCut! We've received your booking request 
                  and will confirm your appointment via email within 24 hours.
                </p>
                <button
                  onClick={() => setBookingSuccess(false)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-shadow"
                >
                  Book Another Appointment
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-2/5 bg-gradient-to-br from-pink-500 to-purple-600 p-8 text-white">
                    <h3 className="text-2xl font-bold mb-6">Why Choose ChromaCut?</h3>
                    <ul className="space-y-4">
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5" />
                        <span>Certified Master Stylists</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5" />
                        <span>Premium Hair Products</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5" />
                        <span>Personalized Consultations</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5" />
                        <span>Sustainable Practices</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5" />
                        <span>Complimentary Refreshments</span>
                      </li>
                    </ul>
                    
                    <div className="mt-12 pt-8 border-t border-white/20">
                      <h4 className="font-bold mb-4">Contact Info</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5" />
                          <span>(555) 123-4567</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5" />
                          <span>123 Style Avenue, Beauty District</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5" />
                          <span>Mon-Sat: 9AM-8PM, Sun: 10AM-4PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-3/5 p-8">
                    <form onSubmit={handleBookingSubmit}>
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={bookingForm.name}
                            onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={bookingForm.email}
                            onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                            placeholder="you@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            required
                            value={bookingForm.phone}
                            onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Preferred Service
                          </label>
                          <select
                            value={bookingForm.service}
                            onChange={(e) => setBookingForm({...bookingForm, service: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                          >
                            <option value="">Select a service</option>
                            {SERVICES.map(service => (
                              <option key={service.id} value={service.id}>{service.title}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Preferred Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={bookingForm.date}
                            onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Preferred Time *
                          </label>
                          <select
                            required
                            value={bookingForm.time}
                            onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                          >
                            <option value="">Select time</option>
                            <option value="9:00">9:00 AM</option>
                            <option value="10:30">10:30 AM</option>
                            <option value="12:00">12:00 PM</option>
                            <option value="2:00">2:00 PM</option>
                            <option value="3:30">3:30 PM</option>
                            <option value="5:00">5:00 PM</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Special Requests or Notes
                        </label>
                        <textarea
                          value={bookingForm.notes}
                          onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                          placeholder="Any specific requests, allergies, or concerns we should know about?"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl disabled:opacity-70 transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : 'Secure Your Appointment'}
                      </button>
                      
                      <p className="text-center text-gray-500 text-sm mt-4">
                        We'll confirm your appointment within 24 hours. No deposit required.
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">ChromaCut</h3>
                  <p className="text-sm text-gray-400">Modern Hair Studio</p>
                </div>
              </div>
              <p className="text-gray-400">
                Transforming hair with artistry, precision, and personalized care since 2015.
              </p>
              <div className="flex space-x-4 mt-6">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-purple-600 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-purple-600 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#services" className="text-gray-400 hover:text-white transition-colors">Services</a></li>
                <li><a href="#gallery" className="text-gray-400 hover:text-white transition-colors">Gallery</a></li>
                <li><a href="#team" className="text-gray-400 hover:text-white transition-colors">Our Team</a></li>
                <li><a href="#booking" className="text-gray-400 hover:text-white transition-colors">Book Now</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Services</h4>
              <ul className="space-y-3">
                {SERVICES.slice(0, 4).map(service => (
                  <li key={service.id}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {service.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Contact Us</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-purple-400 mt-1" />
                  <span className="text-gray-400">123 Style Avenue<br />Beauty District, 10001</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">(555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Mon-Sat: 9AM-8PM<br />Sun: 10AM-4PM</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} ChromaCut Modern Hair Studio. All rights reserved.</p>
            <p className="mt-2">Designed to showcase the art of modern hairdressing.</p>
          </div>
        </div>
      </footer>

      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-xl z-50 flex items-center space-x-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Admin Mode Active</span>
        </div>
      )}
    </div>
  );
}