'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  ChevronRight, 
  Check, 
  Wine, 
  Users,
  Star,
  Sparkles,
  Shield,
  Heart,
  Menu as MenuIcon,
  X,
  Instagram,
  Facebook,
  Twitter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'wine-bar-gallery';

// Tasting flight definitions with image prompts
const TASTING_FLIGHTS = [
  { 
    id: 'old-world-classics', 
    title: 'Old World Classics',
    subtitle: 'European Heritage Wines',
    description: 'Journey through the storied vineyards of France, Italy, and Spain with this curated flight of timeless classics.',
    duration: '90 min',
    price: '$85',
    includes: ['5 premium pours', 'Artisanal cheese board', 'Sommeliér guided tasting', 'Pairing notes booklet'],
    prompt: 'An elegant wine flight presentation with five glasses of red and white wines arranged on dark slate, soft candlelight, artisan cheese board with grapes and nuts in background, romantic intimate wine bar atmosphere, shallow depth of field, warm golden hour lighting'
  },
  { 
    id: 'new-world-adventure', 
    title: 'New World Adventure',
    subtitle: 'Bold & Innovative',
    description: 'Discover exciting wines from emerging regions like Chile, Australia, and California\'s innovative producers.',
    duration: '75 min',
    price: '$75',
    includes: ['4 distinctive pours', 'Small bites pairing', 'Regional storytelling', 'Digital tasting notes'],
    prompt: 'Modern wine tasting setup with innovative glassware, four wines ranging from deep red to crisp white, minimalist marble surface, small gourmet tapas plates, contemporary wine bar interior with exposed brick and modern art, natural daylight'
  },
  { 
    id: 'sparkling-celebration', 
    title: 'Sparkling Celebration',
    subtitle: 'Bubbles & Joy',
    description: 'A festive exploration of méthode traditionnelle sparkling wines from Champagne to exceptional crémants.',
    duration: '60 min',
    price: '$95',
    includes: ['3 premium sparklings', 'Gourmet canapés', 'Sabering demonstration*', 'Take-home flute'],
    prompt: 'Sparkling wine flight with three champagne flutes bubbling, elegant gold accents, delicate canapés on silver tray, romantic bokeh lights in background, celebratory atmosphere, high-end restaurant setting, shallow depth of field, golden hour lighting through window'
  },
  { 
    id: 'organic-biodynamic', 
    title: 'Organic & Biodynamic',
    subtitle: 'Natural Wine Experience',
    description: 'Explore the world of natural, organic, and biodynamic wines made with minimal intervention and maximum care.',
    duration: '105 min',
    price: '$110',
    includes: ['6 natural wine pours', 'Farm-to-table small plates', 'Winemaker stories', 'Organic vineyard map'],
    prompt: 'Natural wine tasting with six unique bottles, organic vineyard backdrop, rustic wooden table, handwritten tasting notes, cheese and charcuterie with fresh bread, soft natural light, intimate knowledgeable atmosphere'
  },
];

// Events for calendar
const UPCOMING_EVENTS = [
  {
    id: 1,
    date: '2024-06-15',
    title: 'Bordeaux Vertical Tasting',
    description: 'A rare opportunity to taste 5 vintages from Château Margaux',
    seats: 12,
    price: '$250'
  },
  {
    id: 2,
    date: '2024-06-22',
    title: 'Women in Wine Dinner',
    description: 'Celebrating female winemakers with 5-course pairing menu',
    seats: 20,
    price: '$180'
  },
  {
    id: 3,
    date: '2024-06-29',
    title: 'Italian Wine Journey',
    description: 'From Barolo to Brunello: A tour of Italy\'s finest regions',
    seats: 16,
    price: '$125'
  },
  {
    id: 4,
    date: '2024-07-06',
    title: 'Blind Tasting Championship',
    description: 'Test your palate in our annual blind tasting competition',
    seats: 24,
    price: '$95'
  },
];

type FlightImageState = { [key: string]: { image_url: string | null } };

export default function WineBarPage() {
  // State for flight images
  const [flightImages, setFlightImages] = useState<FlightImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // UI States
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [bookingStep, setBookingStep] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  
  // Available time slots
  const timeSlots = ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'];

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

  // Load flight images from Supabase
  useEffect(() => {
    const loadFlightImages = async () => {
      // Fetch wine bar gallery images for admin
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

      // Initialize state
      const initialState: FlightImageState = {};
      TASTING_FLIGHTS.forEach(flight => initialState[flight.id] = { image_url: null });

      if (images) {
        const latestImagePerFlight: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          // Path structure: [user_id, gallery_prefix, flight_id, filename]
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX.replace('-', '_')) {
            const flightId = pathParts[2];
            if (TASTING_FLIGHTS.some(f => f.id === flightId) && !latestImagePerFlight[flightId]) {
              latestImagePerFlight[flightId] = img.path;
            }
          }
        }

        // Build final state with only relevant flights
        TASTING_FLIGHTS.forEach(flight => {
          if (latestImagePerFlight[flight.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerFlight[flight.id]).data.publicUrl;
            initialState[flight.id] = { image_url: url };
          }
        });
      }

      setFlightImages(initialState);
    };

    loadFlightImages();
  }, []);

  // Handle image upload for flights
  const handleFlightImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, flightId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(flightId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${flightId}/`;

      // Clean up old images for this flight
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

      // Insert record
      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      // Update state
      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setFlightImages(prev => ({ ...prev, [flightId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, flightId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(flightId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Booking handlers
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    if (bookingStep === 1) setBookingStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (bookingStep === 2) setBookingStep(3);
  };

  const handleFlightSelect = (flightId: string) => {
    setSelectedFlight(flightId);
  };

  const handleBookingSubmit = () => {
    // In production, this would send to your booking API
    setBookingComplete(true);
    setTimeout(() => {
      setBookingComplete(false);
      setBookingStep(1);
      setSelectedDate('');
      setSelectedTime('');
      setSelectedFlight(null);
      setGuests(2);
    }, 5000);
  };

  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setShowMobileMenu(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-amber-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wine className="h-8 w-8 text-amber-700" />
              <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900">Cellar Door</h1>
                <p className="text-xs text-amber-600 tracking-widest">VINOTECA</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('tasting-flights')} className="text-gray-700 hover:text-amber-700 transition-colors">
                Tasting Flights
              </button>
              <button onClick={() => scrollToSection('events')} className="text-gray-700 hover:text-amber-700 transition-colors">
                Events
              </button>
              <button onClick={() => scrollToSection('reservations')} className="text-gray-700 hover:text-amber-700 transition-colors">
                Reservations
              </button>
              <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-amber-700 transition-colors">
                Our Story
              </button>
              <button 
                onClick={() => scrollToSection('reservations')}
                className="bg-amber-700 text-white px-6 py-2 rounded-full hover:bg-amber-800 transition-colors flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book Now
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-700"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 border-t border-amber-100 pt-4"
              >
                <div className="flex flex-col space-y-4">
                  <button onClick={() => scrollToSection('tasting-flights')} className="text-gray-700 py-2">
                    Tasting Flights
                  </button>
                  <button onClick={() => scrollToSection('events')} className="text-gray-700 py-2">
                    Events
                  </button>
                  <button onClick={() => scrollToSection('reservations')} className="text-gray-700 py-2">
                    Reservations
                  </button>
                  <button onClick={() => scrollToSection('about')} className="text-gray-700 py-2">
                    Our Story
                  </button>
                  <button 
                    onClick={() => scrollToSection('reservations')}
                    className="bg-amber-700 text-white px-6 py-3 rounded-full hover:bg-amber-800 transition-colors flex items-center justify-center"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-purple-900/60 z-0"></div>
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=2070")'
          }}
        ></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-amber-100 mb-6">
                <Sparkles className="h-4 w-4 mr-2" />
                Award-winning wine experience
              </span>
              
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
                Curated Wine<br />
                <span className="text-amber-200">Tasting Flights</span>
              </h1>
              
              <p className="text-xl text-amber-100 mb-8 max-w-2xl">
                Discover exceptional wines in an intimate setting. Our sommelier-led tastings 
                transform wine appreciation into an unforgettable experience.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => scrollToSection('reservations')}
                  className="bg-white text-amber-900 px-8 py-4 rounded-full hover:bg-amber-50 transition-all duration-300 text-lg font-semibold flex items-center justify-center group"
                >
                  Reserve Your Flight
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => scrollToSection('tasting-flights')}
                  className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white/10 transition-colors text-lg font-semibold"
                >
                  View Flights
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-white border-y border-amber-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-700 mb-2">250+</div>
              <div className="text-gray-600">Wine Labels</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-700 mb-2">4.9★</div>
              <div className="text-gray-600">Google Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-700 mb-2">15</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-700 mb-2">96</div>
              <div className="text-gray-600">Wine Awards</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasting Flights Section */}
      <section id="tasting-flights" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
              Curated Tasting Flights
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Each flight is carefully designed to tell a story through wine, 
              guided by our expert sommeliers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {TASTING_FLIGHTS.map((flight) => {
              const flightData = flightImages[flight.id] || { image_url: null };
              const imageUrl = flightData.image_url;

              return (
                <motion.div
                  key={flight.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-amber-50 to-white rounded-3xl overflow-hidden border border-amber-100 shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Image Container */}
                      <div className="lg:w-2/5">
                        <div className="relative rounded-2xl overflow-hidden h-64 lg:h-full">
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={flight.title}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-wine.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-purple-100 flex items-center justify-center">
                              <div className="text-center">
                                <Wine className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                                <span className="text-amber-600">Tasting Flight Image</span>
                                
                                {/* Admin Upload Section */}
                                {adminMode && (
                                  <div className="mt-4 space-y-2">
                                    <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded">
                                      {flight.prompt}
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => copyPrompt(flight.prompt, flight.id)}
                                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                                        type="button"
                                      >
                                        {copiedId === flight.id ? 'Copied!' : 'Copy Prompt'}
                                      </button>
                                      <label className="text-xs bg-amber-600 text-white px-3 py-1 rounded cursor-pointer">
                                        {uploading === flight.id ? 'Uploading…' : 'Upload'}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleFlightImageUpload(e, flight.id)}
                                          className="hidden"
                                        />
                                      </label>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="absolute top-4 left-4">
                            <span className="bg-amber-700 text-white px-3 py-1 rounded-full text-sm">
                              {flight.duration}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="lg:w-3/5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{flight.title}</h3>
                            <p className="text-amber-600 font-medium">{flight.subtitle}</p>
                          </div>
                          <div className="text-3xl font-bold text-amber-700">{flight.price}</div>
                        </div>
                        
                        <p className="text-gray-600 mb-6">{flight.description}</p>
                        
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">Includes:</h4>
                          <ul className="space-y-2">
                            {flight.includes.map((item, index) => (
                              <li key={index} className="flex items-center text-gray-700">
                                <Check className="h-5 w-5 text-green-500 mr-3" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-gray-500">
                            <Users className="h-5 w-5 mr-2" />
                            <span>2-6 guests</span>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedFlight(flight.id);
                              scrollToSection('reservations');
                            }}
                            className="bg-amber-600 text-white px-6 py-3 rounded-full hover:bg-amber-700 transition-colors flex items-center"
                          >
                            Select Flight
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20 bg-gradient-to-b from-white to-amber-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
              Upcoming Events
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Exclusive wine dinners, masterclasses, and special tastings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {UPCOMING_EVENTS.map((event) => (
              <div 
                key={event.id} 
                className="bg-white rounded-2xl overflow-hidden border border-amber-100 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="mb-4">
                    <div className="text-sm text-amber-600 font-semibold">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mt-2">{event.title}</h3>
                    <p className="text-gray-600 mt-2">{event.description}</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-amber-50">
                    <div className="text-amber-700 font-bold">{event.price}</div>
                    <div className="flex items-center text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{event.seats} seats left</span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-6 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors py-3 rounded-lg font-semibold">
                    Join Waitlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Booking Section */}
      <section id="reservations" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
                Reserve Your Experience
              </h2>
              <p className="text-xl text-gray-600">
                Secure your spot for an unforgettable wine journey
              </p>
            </div>

            {/* Booking Steps */}
            <div className="mb-8">
              <div className="flex justify-center mb-8">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${bookingStep >= 1 ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-600'}`}>
                    1
                  </div>
                  <div className={`w-24 h-1 ${bookingStep >= 2 ? 'bg-amber-600' : 'bg-amber-100'}`}></div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${bookingStep >= 2 ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-600'}`}>
                    2
                  </div>
                  <div className={`w-24 h-1 ${bookingStep >= 3 ? 'bg-amber-600' : 'bg-amber-100'}`}></div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${bookingStep >= 3 ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-600'}`}>
                    3
                  </div>
                </div>
              </div>
              
              <div className="text-center mb-8">
                <span className="text-amber-600 font-semibold">
                  {bookingStep === 1 && 'Select Date'}
                  {bookingStep === 2 && 'Select Time'}
                  {bookingStep === 3 && 'Choose Flight'}
                </span>
              </div>
            </div>

            {/* Booking Form */}
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-3xl p-8 border border-amber-100 shadow-lg">
              {!bookingComplete ? (
                <>
                  {/* Step 1: Date Selection */}
                  {bookingStep === 1 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Your Date</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
                        {Array.from({ length: 14 }).map((_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() + i + 1);
                          const dateStr = date.toISOString().split('T')[0];
                          const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                          const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          
                          return (
                            <button
                              key={i}
                              onClick={() => handleDateSelect(dateStr)}
                              className={`p-4 rounded-xl border transition-all ${
                                selectedDate === dateStr 
                                  ? 'bg-amber-600 text-white border-amber-600' 
                                  : 'bg-white border-amber-100 hover:border-amber-300'
                              }`}
                            >
                              <div className="font-bold">{day}</div>
                              <div className="text-lg font-bold">{monthDay}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Time Selection */}
                  {bookingStep === 2 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Your Time</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            className={`p-4 rounded-xl border transition-all ${
                              selectedTime === time 
                                ? 'bg-amber-600 text-white border-amber-600' 
                                : 'bg-white border-amber-100 hover:border-amber-300'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Flight Selection */}
                  {bookingStep === 3 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Tasting Flight</h3>
                      <div className="space-y-4 mb-8">
                        {TASTING_FLIGHTS.map((flight) => (
                          <div
                            key={flight.id}
                            onClick={() => handleFlightSelect(flight.id)}
                            className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                              selectedFlight === flight.id 
                                ? 'border-amber-600 bg-amber-50' 
                                : 'border-amber-100 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-bold text-lg text-gray-900">{flight.title}</h4>
                                <p className="text-gray-600">{flight.subtitle}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-amber-700">{flight.price}</div>
                                <div className="text-sm text-gray-500">{flight.duration}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guest Selection */}
                  {(bookingStep === 2 || bookingStep === 3) && (
                    <div className="mb-8">
                      <h4 className="font-semibold text-gray-900 mb-4">Number of Guests</h4>
                      <div className="flex items-center">
                        <button 
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          className="w-12 h-12 rounded-l-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                          -
                        </button>
                        <div className="w-12 h-12 border-y border-amber-200 flex items-center justify-center font-bold">
                          {guests}
                        </div>
                        <button 
                          onClick={() => setGuests(Math.min(8, guests + 1))}
                          className="w-12 h-12 rounded-r-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                          +
                        </button>
                        <span className="ml-4 text-gray-600">{guests} guest{guests !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-8 border-t border-amber-100">
                    {bookingStep > 1 && (
                      <button 
                        onClick={() => setBookingStep(bookingStep - 1)}
                        className="px-8 py-3 border-2 border-amber-200 text-amber-700 rounded-full hover:bg-amber-50 transition-colors"
                      >
                        Back
                      </button>
                    )}
                    
                    {bookingStep < 3 ? (
                      <button 
                        onClick={() => setBookingStep(bookingStep + 1)}
                        className={`px-8 py-3 rounded-full ml-auto ${
                          (bookingStep === 1 && selectedDate) || (bookingStep === 2 && selectedTime)
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={
                          (bookingStep === 1 && !selectedDate) || 
                          (bookingStep === 2 && !selectedTime)
                        }
                      >
                        Continue
                      </button>
                    ) : (
                      <button 
                        onClick={handleBookingSubmit}
                        className={`px-8 py-3 rounded-full ml-auto ${
                          selectedFlight
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!selectedFlight}
                      >
                        Complete Reservation
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* Success State */
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Reservation Confirmed!</h3>
                  <p className="text-xl text-gray-600 mb-6">
                    We've sent your confirmation to your email. We look forward to hosting you!
                  </p>
                  <div className="bg-amber-50 rounded-2xl p-6 max-w-md mx-auto">
                    <div className="text-lg font-semibold text-gray-900 mb-2">Your Reservation Details</div>
                    <div className="space-y-2 text-gray-600">
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-semibold">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-semibold">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Guests:</span>
                        <span className="font-semibold">{guests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Flight:</span>
                        <span className="font-semibold">{TASTING_FLIGHTS.find(f => f.id === selectedFlight)?.title}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-b from-white to-amber-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Founded in 2009 by Master Sommelier Elena Rossi, Cellar Door Vinoteca began 
                as a passion project to make exceptional wine accessible to everyone. What started 
                as a small tasting room has grown into Portland's premier wine destination.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Our philosophy is simple: wine should be an experience, not just a drink. 
                Each flight tells a story, each glass sparks a conversation, and every visit 
                creates a memory.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-amber-600 mr-3" />
                  <div>
                    <div className="font-bold text-gray-900">Expertly Curated</div>
                    <div className="text-sm text-gray-600">Every wine hand-selected</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Heart className="h-6 w-6 text-amber-600 mr-3" />
                  <div>
                    <div className="font-bold text-gray-900">Sustainable</div>
                    <div className="text-sm text-gray-600">Eco-conscious practices</div>
                  </div>
                </div>
              </div>
              
              <button className="border-2 border-amber-600 text-amber-600 hover:bg-amber-50 px-8 py-3 rounded-full transition-colors font-semibold">
                Meet Our Team
              </button>
            </div>
            
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800"
                  alt="Wine bar interior"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 shadow-xl border border-amber-100">
                <div className="flex items-center">
                  <div className="mr-4">
                    <Star className="h-10 w-10 text-amber-500 fill-current" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">4.9★</div>
                    <div className="text-gray-600">500+ Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Wine className="h-8 w-8 text-amber-300" />
                <div>
                  <h3 className="text-2xl font-serif font-bold">Cellar Door</h3>
                  <p className="text-amber-300 text-sm tracking-widest">VINOTECA</p>
                </div>
              </div>
              <p className="text-gray-400">
                Where every bottle tells a story, and every tasting creates a memory.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Hours</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex justify-between">
                  <span>Wed - Thu</span>
                  <span>4 PM - 11 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Fri - Sat</span>
                  <span>3 PM - 1 AM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sun</span>
                  <span>3 PM - 10 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Mon - Tue</span>
                  <span className="text-amber-300">Private Events</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Contact</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-amber-300" />
                  <span>123 Vine Street<br />Portland, OR 97204</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-amber-300" />
                  <span>(503) 555-0123</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-amber-300" />
                  <span>hello@cellardoor.com</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Stay Connected</h4>
              <p className="text-gray-400 mb-6">
                Join our wine club for exclusive tastings and early access to events.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Cellar Door Vinoteca. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-purple-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          👤 Admin Mode Active - Can upload flight images
        </div>
      )}
    </div>
  );
}