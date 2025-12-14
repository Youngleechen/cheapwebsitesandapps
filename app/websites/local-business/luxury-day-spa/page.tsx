'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  ChevronRight,
  CheckCircle,
  Users,
  Award,
  Shield,
  Sparkles,
  Heart,
  Menu,
  X
} from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'spa-gallery';

// Spa gallery items - admin can upload images for each
const SPA_GALLERY_ITEMS = [
  { 
    id: 'luxury-treatment-room', 
    title: 'Luxury Treatment Room',
    description: 'Our premium treatment suites with heated massage tables and ambient lighting'
  },
  { 
    id: 'relaxation-lounge', 
    title: 'Relaxation Lounge',
    description: 'Post-treatment relaxation area with herbal tea service'
  },
  { 
    id: 'hydrotherapy-pool', 
    title: 'Hydrotherapy Pool',
    description: 'Temperature-controlled pool with massage jets'
  },
  { 
    id: 'spa-entrance', 
    title: 'Spa Entrance',
    description: 'Welcome area featuring our signature waterfall wall'
  },
  { 
    id: 'couples-suite', 
    title: 'Couples Suite',
    description: 'Private suite for couples treatments with dual massage tables'
  },
  { 
    id: 'outdoor-garden', 
    title: 'Zen Garden',
    description: 'Peaceful outdoor meditation and relaxation space'
  },
];

type GalleryState = { [key: string]: { image_url: string | null } };
type Service = {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: string;
  category: 'massage' | 'facial' | 'body' | 'wellness';
  popular?: boolean;
};

export default function LuxuryDaySpaPage() {
  const [gallery, setGallery] = useState<GalleryState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>('signature-massage');
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'signature-massage',
    date: '',
    time: '10:00',
    guests: '1'
  });
  const [bookingStep, setBookingStep] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Services data
  const services: Service[] = [
    { id: 'signature-massage', title: 'Signature Hot Stone Massage', description: 'Deep relaxation with heated basalt stones and aromatherapy oils', duration: '90 min', price: '$165', category: 'massage', popular: true },
    { id: 'detox-body-wrap', title: 'Detox Seaweed Body Wrap', description: 'Purifying treatment with mineral-rich seaweed and marine extracts', duration: '75 min', price: '$145', category: 'body', popular: true },
    { id: 'diamond-facial', title: 'Diamond Microdermabrasion Facial', description: 'Luxurious facial with diamond-tipped exfoliation and collagen infusion', duration: '60 min', price: '$135', category: 'facial' },
    { id: 'couples-retreat', title: 'Couples Retreat Package', description: 'Side-by-side massages followed by private hydrotherapy session', duration: '120 min', price: '$320', category: 'wellness' },
    { id: 'aromatherapy', title: 'Custom Aromatherapy Massage', description: 'Personalized massage with essential oils tailored to your needs', duration: '60 min', price: '$125', category: 'massage' },
    { id: 'anti-aging-facial', title: 'Platinum Anti-Aging Facial', description: 'Advanced treatment with peptide serums and LED light therapy', duration: '75 min', price: '$155', category: 'facial' },
  ];

  // Testimonials
  const testimonials = [
    { name: 'Sarah M.', text: 'Absolute bliss! The hot stone massage melted away a year of stress. The attention to detail was incredible.', rating: 5 },
    { name: 'James & Lisa R.', text: 'Our couples retreat was magical. Perfect anniversary gift - we left feeling reconnected and rejuvenated.', rating: 5 },
    { name: 'Dr. Emily Chen', text: 'As a physician, I appreciate the therapeutic approach. The staff are true professionals who understand wellness.', rating: 5 },
  ];

  // Initialize gallery state and check admin
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([checkUser(), loadGalleryImages()]);
      setLoading(false);
    };
    initialize();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user.id || null;
    setUserId(uid);
    setAdminMode(uid === ADMIN_USER_ID);
  };

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
    SPA_GALLERY_ITEMS.forEach(item => initialState[item.id] = { image_url: null });

    if (images) {
      const latestImagePerItem: Record<string, string> = {};

      for (const img of images) {
        const pathParts = img.path.split('/');
        if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
          const itemId = pathParts[2];
          if (SPA_GALLERY_ITEMS.some(a => a.id === itemId) && !latestImagePerItem[itemId]) {
            latestImagePerItem[itemId] = img.path;
          }
        }
      }

      SPA_GALLERY_ITEMS.forEach(item => {
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

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(itemId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${itemId}/`;

      // Clean up old images for this item
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
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBookingData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingStep < 3) {
      setBookingStep(prev => prev + 1);
    } else {
      // In a real app, this would send to your backend
      alert('Booking request submitted! We will contact you shortly to confirm.');
      setBookingStep(1);
      setBookingData({
        name: '',
        email: '',
        phone: '',
        service: 'signature-massage',
        date: '',
        time: '10:00',
        guests: '1'
      });
    }
  };

  // Smooth scroll function
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-rose-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-gray-800">Serenity Springs</h1>
                <p className="text-sm text-rose-600">Luxury Day Spa</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-rose-600 transition">Home</button>
              <button onClick={() => scrollToSection('services')} className="text-gray-700 hover:text-rose-600 transition">Services</button>
              <button onClick={() => scrollToSection('gallery')} className="text-gray-700 hover:text-rose-600 transition">Gallery</button>
              <button onClick={() => scrollToSection('booking')} className="text-gray-700 hover:text-rose-600 transition">Book Now</button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-rose-600 transition">Contact</button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* CTA Button */}
            <button 
              onClick={() => scrollToSection('booking')}
              className="hidden md:block bg-gradient-to-r from-rose-500 to-purple-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Book Treatment
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4">
              <nav className="flex flex-col space-y-4">
                <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-rose-600 transition py-2">Home</button>
                <button onClick={() => scrollToSection('services')} className="text-gray-700 hover:text-rose-600 transition py-2">Services</button>
                <button onClick={() => scrollToSection('gallery')} className="text-gray-700 hover:text-rose-600 transition py-2">Gallery</button>
                <button onClick={() => scrollToSection('booking')} className="text-gray-700 hover:text-rose-600 transition py-2">Book Now</button>
                <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-rose-600 transition py-2">Contact</button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-rose-100 text-rose-700 rounded-full text-sm font-semibold">
                <Award className="w-4 h-4 mr-2" />
                Voted Best Luxury Spa 2024
              </div>
              
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
                Discover Your <span className="bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">Oasis</span> of Calm
              </h1>
              
              <p className="text-xl text-gray-600">
                Experience transformative wellness in our sanctuary of serenity, where ancient healing meets modern luxury.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => scrollToSection('booking')}
                  className="bg-gradient-to-r from-rose-500 to-purple-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                >
                  Book Your Escape
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollToSection('services')}
                  className="border-2 border-rose-200 text-rose-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-rose-50 transition-all duration-200"
                >
                  View Treatments
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-rose-600">15+</div>
                  <div className="text-sm text-gray-600">Expert Therapists</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-rose-600">4.9★</div>
                  <div className="text-sm text-gray-600">Client Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-rose-600">50+</div>
                  <div className="text-sm text-gray-600">Treatments</div>
                </div>
              </div>
            </div>

            {/* Hero Image/Admin Upload */}
            <div className="relative">
              <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                {gallery['luxury-treatment-room']?.image_url ? (
                  <img 
                    src={gallery['luxury-treatment-room'].image_url} 
                    alt="Luxury Spa Treatment Room"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Sparkles className="w-16 h-16 text-rose-300 mx-auto mb-4" />
                      <p className="text-gray-500">Luxury treatment room preview</p>
                    </div>
                  </div>
                )}
                
                {/* Admin Upload Overlay */}
                {adminMode && (
                  <div className="absolute top-4 right-4">
                    <label className="bg-white/90 backdrop-blur-sm text-rose-600 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer hover:bg-white transition shadow-lg flex items-center space-x-2">
                      {uploading === 'luxury-treatment-room' ? 'Uploading...' : 'Change Hero Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleGalleryUpload(e, 'luxury-treatment-room')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
              
              {/* Floating Testimonial Card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-xl max-w-sm">
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-3">"Pure magic! I've never felt so pampered and renewed."</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                    AM
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold">Amanda M.</div>
                    <div className="text-sm text-gray-500">Regular Guest</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-sm font-semibold mb-4">
              <Heart className="w-4 h-4 mr-2" />
              Signature Treatments
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
              Journey to <span className="text-rose-500">Renewal</span>
            </h2>
            <p className="text-xl text-gray-600">
              Each treatment is thoughtfully crafted to restore balance and awaken your senses
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {services.map((service) => (
              <div 
                key={service.id}
                className={`bg-gradient-to-br from-white to-rose-50 rounded-2xl p-8 border-2 transition-all duration-300 hover:border-rose-200 hover:shadow-2xl cursor-pointer ${
                  selectedService === service.id ? 'border-rose-300 shadow-xl' : 'border-rose-100'
                }`}
                onClick={() => {
                  setSelectedService(service.id);
                  setBookingData(prev => ({ ...prev, service: service.id }));
                  scrollToSection('booking');
                }}
              >
                {service.popular && (
                  <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold rounded-full mb-4">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-serif font-bold text-gray-900">{service.title}</h3>
                  <div className="text-3xl font-bold text-rose-600">{service.price}</div>
                </div>
                
                <p className="text-gray-600 mb-6">{service.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {service.duration}
                  </div>
                  <button className="text-rose-600 font-semibold hover:text-rose-700 flex items-center">
                    Book Now <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Why Choose Us */}
          <div className="bg-gradient-to-r from-rose-50 to-purple-50 rounded-3xl p-12">
            <h3 className="text-3xl font-serif font-bold text-center mb-12">Why Serenity Springs</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="w-8 h-8 text-rose-500" />
                </div>
                <h4 className="text-xl font-bold mb-3">Certified Experts</h4>
                <p className="text-gray-600">Our therapists undergo 500+ hours of specialized training</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Shield className="w-8 h-8 text-rose-500" />
                </div>
                <h4 className="text-xl font-bold mb-3">Premium Ingredients</h4>
                <p className="text-gray-600">Only organic, cruelty-free products from sustainable sources</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Award className="w-8 h-8 text-rose-500" />
                </div>
                <h4 className="text-xl font-bold mb-3">Award-Winning</h4>
                <p className="text-gray-600">Recognized as the region&apos;s top wellness destination</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section with Admin Uploads */}
      <section id="gallery" className="py-20 bg-gradient-to-b from-white to-rose-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
              Our <span className="text-rose-500">Sanctuary</span>
            </h2>
            <p className="text-xl text-gray-600">
              Step into our world of tranquility and luxury
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SPA_GALLERY_ITEMS.map((item) => {
              const itemData = gallery[item.id] || { image_url: null };
              const imageUrl = itemData.image_url;

              return (
                <div key={item.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-lg">
                  {/* Image Container */}
                  <div className="relative h-64 bg-gradient-to-br from-rose-100 to-purple-100">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Sparkles className="w-12 h-12 text-rose-300 mx-auto mb-3" />
                          <p className="text-gray-400">{item.description}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Admin Upload Button */}
                    {adminMode && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <label className="bg-white/90 backdrop-blur-sm text-rose-600 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-white transition shadow-md flex items-center space-x-1">
                          {uploading === item.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <span>Upload Image</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleGalleryUpload(e, item.id)}
                            className="hidden"
                            disabled={uploading === item.id}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay Content */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-sm opacity-90">{item.description}</p>
                    </div>
                  </div>
                  
                  {/* Title (visible always) */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Admin Notice */}
          {adminMode && (
            <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-rose-50 border border-purple-200 rounded-xl text-center">
              <p className="text-purple-700 font-medium">
                👑 Admin Mode Active - Upload images to customize your spa gallery
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Booking Form */}
              <div className="bg-gradient-to-br from-rose-50 to-white rounded-3xl p-8 lg:p-12 shadow-xl">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                    Reserve Your <span className="text-rose-500">Sanctuary</span>
                  </h2>
                  <p className="text-gray-600">Experience begins with your booking</p>
                </div>

                {/* Booking Steps */}
                <div className="flex justify-between mb-8">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        bookingStep >= step 
                          ? 'bg-gradient-to-r from-rose-500 to-purple-500 text-white' 
                          : 'bg-rose-100 text-rose-400'
                      }`}>
                        {bookingStep > step ? <CheckCircle className="w-6 h-6" /> : step}
                      </div>
                      <span className={`text-sm ${
                        bookingStep >= step ? 'text-rose-600 font-semibold' : 'text-gray-400'
                      }`}>
                        {step === 1 ? 'Details' : step === 2 ? 'Service' : 'Confirm'}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  {/* Step 1: Contact Details */}
                  {bookingStep === 1 && (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={bookingData.name}
                            onChange={handleBookingChange}
                            required
                            className="w-full px-4 py-3 border-2 border-rose-100 rounded-xl focus:border-rose-300 focus:outline-none transition"
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={bookingData.email}
                            onChange={handleBookingChange}
                            required
                            className="w-full px-4 py-3 border-2 border-rose-100 rounded-xl focus:border-rose-300 focus:outline-none transition"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={bookingData.phone}
                          onChange={handleBookingChange}
                          required
                          className="w-full px-4 py-3 border-2 border-rose-100 rounded-xl focus:border-rose-300 focus:outline-none transition"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </>
                  )}

                  {/* Step 2: Service Selection */}
                  {bookingStep === 2 && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select Treatment
                        </label>
                        <select
                          name="service"
                          value={bookingData.service}
                          onChange={handleBookingChange}
                          className="w-full px-4 py-3 border-2 border-rose-100 rounded-xl focus:border-rose-300 focus:outline-none transition bg-white"
                        >
                          {services.map(service => (
                            <option key={service.id} value={service.id}>
                              {service.title} - {service.duration} ({service.price})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Preferred Date *
                          </label>
                          <input
                            type="date"
                            name="date"
                            value={bookingData.date}
                            onChange={handleBookingChange}
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border-2 border-rose-100 rounded-xl focus:border-rose-300 focus:outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Preferred Time
                          </label>
                          <select
                            name="time"
                            value={bookingData.time}
                            onChange={handleBookingChange}
                            className="w-full px-4 py-3 border-2 border-rose-100 rounded-xl focus:border-rose-300 focus:outline-none transition bg-white"
                          >
                            {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 3: Confirmation */}
                  {bookingStep === 3 && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mr-3" />
                        <h3 className="text-xl font-bold text-gray-900">Confirm Your Booking</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between py-3 border-b border-emerald-100">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-semibold">{bookingData.name}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-emerald-100">
                          <span className="text-gray-600">Service:</span>
                          <span className="font-semibold">
                            {services.find(s => s.id === bookingData.service)?.title}
                          </span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-emerald-100">
                          <span className="text-gray-600">Date & Time:</span>
                          <span className="font-semibold">
                            {bookingData.date} at {bookingData.time}
                          </span>
                        </div>
                        <div className="flex justify-between py-3">
                          <span className="text-gray-600">Total:</span>
                          <span className="text-2xl font-bold text-rose-600">
                            {services.find(s => s.id === bookingData.service)?.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    {bookingStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setBookingStep(prev => prev - 1)}
                        className="px-8 py-3 border-2 border-rose-200 text-rose-600 rounded-full font-semibold hover:bg-rose-50 transition"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`px-8 py-3 bg-gradient-to-r from-rose-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition ml-auto ${
                        bookingStep === 1 ? 'w-full' : ''
                      }`}
                    >
                      {bookingStep === 3 ? 'Confirm Booking' : 'Continue'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Testimonials Side */}
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-3xl p-8 shadow-xl">
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">
                    Voices of <span className="text-purple-500">Bliss</span>
                  </h3>
                  <div className="space-y-6">
                    {testimonials.map((testimonial, index) => (
                      <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 text-amber-400 fill-current mr-1" />
                          ))}
                        </div>
                        <p className="text-gray-700 italic mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                            {testimonial.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="font-semibold">{testimonial.name}</div>
                            <div className="text-sm text-gray-500">Verified Guest</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Info Card */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 shadow-xl">
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">
                    Visit Our <span className="text-amber-500">Sanctuary</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="w-6 h-6 text-amber-500 mt-1 mr-4" />
                      <div>
                        <div className="font-semibold">Location</div>
                        <div className="text-gray-600">123 Tranquility Lane<br />Aspen, CO 81611</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Clock className="w-6 h-6 text-amber-500 mt-1 mr-4" />
                      <div>
                        <div className="font-semibold">Hours</div>
                        <div className="text-gray-600">Mon-Fri: 9AM - 8PM<br />Sat-Sun: 10AM - 6PM</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="w-6 h-6 text-amber-500 mt-1 mr-4" />
                      <div>
                        <div className="font-semibold">Contact</div>
                        <div className="text-gray-600">(970) 456-7890<br />hello@serenitysprings.com</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/Footer Section */}
      <footer id="contact" className="bg-gradient-to-b from-gray-900 to-gray-950 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Serenity Springs</h3>
                  <p className="text-sm text-rose-200">Luxury Day Spa</p>
                </div>
              </div>
              <p className="text-gray-400">
                Where every moment is crafted for your peace, wellness, and transformation.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><button onClick={() => scrollToSection('home')} className="text-gray-400 hover:text-white transition">Home</button></li>
                <li><button onClick={() => scrollToSection('services')} className="text-gray-400 hover:text-white transition">Treatments</button></li>
                <li><button onClick={() => scrollToSection('gallery')} className="text-gray-400 hover:text-white transition">Gallery</button></li>
                <li><button onClick={() => scrollToSection('booking')} className="text-gray-400 hover:text-white transition">Book Now</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Treatments</h4>
              <ul className="space-y-3">
                <li><span className="text-gray-400">Massage Therapy</span></li>
                <li><span className="text-gray-400">Facials & Skincare</span></li>
                <li><span className="text-gray-400">Body Treatments</span></li>
                <li><span className="text-gray-400">Wellness Packages</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Stay Connected</h4>
              <div className="space-y-4">
                <div className="flex items-center text-gray-400">
                  <Phone className="w-5 h-5 mr-3" />
                  <span>(970) 456-7890</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Mail className="w-5 h-5 mr-3" />
                  <span>hello@serenitysprings.com</span>
                </div>
              </div>
              <button 
                onClick={() => scrollToSection('booking')}
                className="mt-6 bg-gradient-to-r from-rose-500 to-purple-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg w-full transition"
              >
                Book Your Visit
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Serenity Springs Luxury Day Spa. All rights reserved.</p>
            <p className="mt-2">By appointment only. 24-hour cancellation policy applies.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}