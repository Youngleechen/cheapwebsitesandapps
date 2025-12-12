'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { CalendarDays, MapPin, Clock, Sparkles, Wine, ChevronDown, ChevronUp, Instagram, Facebook, Youtube } from 'lucide-react';

// Supabase Client Setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'vineverse_gallery';

// Wine Flight Gallery Configuration
const WINE_FLIGHTS = [
  { 
    id: 'mountain-terroir', 
    title: 'Blue Ridge Terroir',
    prompt: 'Three elegant wine glasses on a reclaimed oak table against an Asheville mountain vista backdrop at golden hour. Glasses contain deep ruby red, amber white, and rose-colored wines with artisanal cheese cubes, local honeycomb, and wildflower sprigs. Soft bokeh lights in background, sophisticated restaurant ambiance.'
  },
  { 
    id: 'old-world-journey', 
    title: 'Old World Journey',
    prompt: 'Curated wine flight on a marble surface with vintage map texture background. Three glasses showing Bordeaux red, Burgundy white, and Tuscany rosé. Paired with charcuterie: prosciutto ribbons, aged cheddar, crusty bread, and fig jam. Candlelight glow with copper accents, shallow depth of field.'
  },
  { 
    id: 'sparkling-sunset', 
    title: 'Asheville Sunset',
    prompt: 'Three champagne flutes filled with sparkling rosé against a dramatic Blue Ridge Mountains sunset. Glasses catching golden hour light with visible bubbles. Accompanied by dark chocolate truffles and edible gold-dusted berries on slate coaster. Dreamy bokeh city lights in distance.'
  }
];

type FlightState = { [key: string]: { image_url: string | null } };

// Custom Header with Scroll Effect
const Header = ({ activeSection, scrollToSection }: { 
  activeSection: string; 
  scrollToSection: (sectionId: string) => void;
}) => {
  const { scrollY } = useScroll();
  const scaledScroll = useSpring(scrollY, { stiffness: 100, damping: 30 });
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    return scaledScroll.onChange(() => {
      setIsScrolled(scaledScroll.get() > 50);
    });
  }, [scaledScroll]);

  return (
    <motion.header 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-gradient-to-r from-burgundy-900/95 to-amber-900/90 backdrop-blur-md shadow-lg py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3">
          <div className="bg-amber-400 p-2 rounded-full">
            <Wine className="h-6 w-6 text-burgundy-900" />
          </div>
          <span className="text-2xl font-playfair font-bold text-cream-50">
            <span className="text-amber-300">Vine</span> & Verse
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-10">
          {['tastings', 'events', 'space', 'visit'].map((section) => (
            <button
              key={section}
              onClick={() => scrollToSection(section)}
              className={`font-medium text-sm tracking-wider transition-all ${
                activeSection === section
                  ? 'text-amber-300 border-b-2 border-amber-300 pb-1'
                  : 'text-cream-100 hover:text-amber-200'
              }`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
          <Link 
            href="https://resy.com/cities/avl/vine-and-verse" 
            target="_blank"
            className="bg-amber-400 hover:bg-amber-300 text-burgundy-900 font-bold py-2 px-5 rounded-full transition-all shadow-lg hover:shadow-amber-500/30"
          >
            Reserve
          </Link>
        </nav>
        
        <button className="md:hidden text-cream-100">
          <span className="sr-only">Menu</span>
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>
    </motion.header>
  );
};

// Smooth Scrolling Hook
const useSmoothScroll = () => {
  const sections = useRef<Record<string, HTMLElement | null>>({});
  
  const scrollToSection = (sectionId: string) => {
    const section = sections.current[sectionId];
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  return { sections, scrollToSection };
};

export default function HomePage() {
  const [flightImages, setFlightImages] = useState<FlightState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { sections, scrollToSection } = useSmoothScroll();
  
  // Section refs for scroll tracking
  const heroRef = useRef<HTMLElement>(null);
  const tastingsRef = useRef<HTMLElement>(null);
  const eventsRef = useRef<HTMLElement>(null);
  const spaceRef = useRef<HTMLElement>(null);
  const visitRef = useRef<HTMLElement>(null);

  // Initialize section refs
  useEffect(() => {
    sections.current = {
      hero: heroRef.current,
      tastings: tastingsRef.current,
      events: eventsRef.current,
      space: spaceRef.current,
      visit: visitRef.current
    };
  }, [sections]);

  // Admin authentication check
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
    const loadImages = async () => {
      const initialState: FlightState = {};
      WINE_FLIGHTS.forEach(flight => initialState[flight.id] = { image_url: null });

      try {
        const { data: images, error } = await supabase
          .from('images')
          .select('path, created_at')
          .eq('user_id', ADMIN_USER_ID)
          .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const latestImagePerFlight: Record<string, string> = {};
        
        if (images) {
          for (const img of images) {
            const pathParts = img.path.split('/');
            if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
              const flightId = pathParts[2];
              if (WINE_FLIGHTS.some(f => f.id === flightId) && !latestImagePerFlight[flightId]) {
                latestImagePerFlight[flightId] = img.path;
              }
            }
          }

          WINE_FLIGHTS.forEach(flight => {
            if (latestImagePerFlight[flight.id]) {
              const url = supabase.storage
                .from('user_images')
                .getPublicUrl(latestImagePerFlight[flight.id]).data.publicUrl;
              initialState[flight.id] = { image_url: url };
            }
          });
        }

        setFlightImages(initialState);
      } catch (err) {
        console.error('Error loading images:', err);
      }
    };

    loadImages();
  }, []);

  // Handle image uploads
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, flightId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(flightId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${flightId}/`;
      
      // Clean up old images
      const { data: existingImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (existingImages?.length) {
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
      setFlightImages(prev => ({ ...prev, [flightId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  // Copy prompt to clipboard
  const copyPrompt = (prompt: string, flightId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(flightId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Scroll tracking for active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // Offset for header
      
      const sectionsOrder = ['hero', 'tastings', 'events', 'space', 'visit'];
      let currentSection = 'hero';
      
      sectionsOrder.forEach(section => {
        const element = sections.current[section];
        if (element && scrollPosition >= element.offsetTop) {
          currentSection = section;
        }
      });
      
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return (
    <div className="font-lora bg-burgundy-950 text-cream-50 min-h-screen overflow-x-hidden">
      {/* Header */}
      <Header activeSection={activeSection} scrollToSection={scrollToSection} />

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden pt-24"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1920&q=80"
            alt="Vine & Verse interior with warm lighting and wine barrels"
            fill
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-burgundy-950/90 via-burgundy-900/70 to-amber-900/30" />
        </div>
        
        <div className="container mx-auto px-4 z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-block bg-amber-400/20 backdrop-blur-sm px-4 py-1 rounded-full border border-amber-300/30">
              <span className="text-amber-200 font-medium tracking-wider uppercase text-sm">
                Asheville's Premier Tasting Room
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-playfair font-bold leading-tight">
              Where <span className="text-amber-300">Wine</span> Meets <span className="text-rose-400">Story</span>
            </h1>
            <p className="text-xl text-cream-200 max-w-2xl mx-auto">
              Curated tastings, intimate live music, and artisanal pairings in the heart of downtown Asheville
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <button
                onClick={() => scrollToSection('tastings')}
                className="bg-amber-400 hover:bg-amber-300 text-burgundy-900 font-bold py-4 px-8 rounded-full text-lg transition-all shadow-lg hover:shadow-amber-500/50 flex items-center justify-center"
              >
                Explore Tastings <ChevronDown className="ml-2 h-5 w-5" />
              </button>
              <Link 
                href="https://resy.com/cities/avl/vine-and-verse" 
                target="_blank"
                className="bg-transparent border-2 border-cream-300 hover:bg-cream-100/10 text-cream-100 font-bold py-4 px-8 rounded-full text-lg transition-all"
              >
                Reserve Your Experience
              </Link>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-cream-300" />
        </div>
      </section>

      {/* Tasting Experience Section */}
      <section 
        ref={tastingsRef}
        className="py-24 bg-gradient-to-b from-burgundy-950 to-amber-900/5"
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block bg-burgundy-900 px-4 py-1 rounded-full mb-4">
              <Sparkles className="h-5 w-5 text-amber-300 inline mr-2" />
              <span className="text-amber-200 font-medium">Curated Experiences</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
              The Art of the <span className="text-amber-300">Perfect Flight</span>
            </h2>
            <p className="text-cream-200 text-lg">
              Our sommeliers craft seasonal flights that tell a story—from Asheville's mountain terroir to old-world traditions reimagined.
            </p>
          </div>

          {/* Wine Flights Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {WINE_FLIGHTS.map((flight) => {
              const flightData = flightImages[flight.id] || { image_url: null };
              const imageUrl = flightData.image_url;

              return (
                <motion.div
                  key={flight.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="bg-burgundy-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-amber-400/20 hover:border-amber-300/40 transition-all relative group"
                >
                  {imageUrl ? (
                    <div className="relative h-72 overflow-hidden">
                      <Image 
                        src={imageUrl} 
                        alt={flight.title} 
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-burgundy-900/80 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-72 bg-gradient-to-br from-rose-900/30 to-purple-900/30 flex items-center justify-center border-b border-amber-400/20">
                      <div className="text-center p-6">
                        <Wine className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                        <p className="text-amber-200 font-medium">{flight.title}</p>
                        <p className="text-cream-400 text-sm mt-2">Image awaiting upload</p>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-2xl font-playfair font-bold text-amber-200 mb-2">
                      {flight.title}
                    </h3>
                    <p className="text-cream-300 mb-4 min-h-[80px]">
                      {flight.id === 'mountain-terroir' && "Our signature Asheville experience featuring wines from Appalachian vineyards paired with local artisanal cheeses and honey."}
                      {flight.id === 'old-world-journey' && "A journey through Europe's most revered wine regions, featuring rare vintages paired with imported charcuterie and house-made preserves."}
                      {flight.id === 'sparkling-sunset' && "Celebrate Asheville's legendary sunsets with premium sparkling wines from around the world, paired with chocolate truffles and fresh berries."}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-2xl font-bold text-amber-300">$48</span>
                      <button className="text-amber-300 hover:text-amber-200 font-medium flex items-center">
                        Details <ChevronDown className="ml-1 h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Admin Controls */}
                  {adminMode && (
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-900/80 p-3 border-t border-amber-400">
                      {!imageUrl && (
                        <div className="mb-2">
                          <p className="text-xs text-cream-200 truncate">{flight.prompt}</p>
                          <button
                            onClick={() => copyPrompt(flight.prompt, flight.id)}
                            className="mt-1 text-xs bg-burgundy-900 text-amber-200 px-2 py-1 rounded hover:bg-burgundy-800 transition-colors"
                          >
                            {copiedId === flight.id ? 'Copied!' : 'Copy Prompt'}
                          </button>
                        </div>
                      )}
                      <label className="block w-full bg-amber-400 text-burgundy-900 text-center font-medium px-3 py-1.5 rounded cursor-pointer text-sm hover:bg-amber-300 transition-colors">
                        {uploading === flight.id ? 'Uploading…' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, flight.id)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {adminMode && (
            <div className="mt-8 p-4 bg-purple-900/30 border border-purple-600 rounded-lg max-w-3xl mx-auto text-sm text-purple-200 text-center">
              👤 Admin Mode: Upload high-quality images for each tasting flight. Use the prompts provided for consistent, professional results.
            </div>
          )}

          <div className="text-center mt-16 max-w-2xl mx-auto">
            <p className="text-cream-300 italic mb-6">
              "Vine & Verse transformed our anniversary into pure magic. The Blue Ridge Terroir flight paired with live jazz was unforgettable." 
              <br />
              <span className="text-amber-200 font-medium mt-2 block">— Sarah & Michael R., Greenville</span>
            </p>
            <button 
              onClick={() => scrollToSection('events')}
              className="text-amber-300 hover:text-amber-200 font-medium flex items-center mx-auto"
            >
              Discover Our Events Calendar <ChevronDown className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section 
        ref={eventsRef}
        className="py-24 bg-gradient-to-b from-amber-900/5 to-burgundy-950"
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block bg-burgundy-900 px-4 py-1 rounded-full mb-4">
              <CalendarDays className="h-5 w-5 text-amber-300 inline mr-2" />
              <span className="text-amber-200 font-medium">Weekly Gatherings</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
              Where Music <span className="text-amber-300">Meets</span> Merlot
            </h2>
            <p className="text-cream-200 text-lg">
              Intimate performances from Asheville's finest musicians in our candlelit barrel room
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Event Calendar */}
            <div className="bg-burgundy-900/70 backdrop-blur-sm rounded-2xl p-8 border border-amber-400/20">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-amber-400/30">
                <h3 className="text-2xl font-playfair font-bold text-amber-200">Upcoming Events</h3>
                <span className="text-amber-300 font-medium">October 2025</span>
              </div>
              
              <div className="space-y-5">
                {[
                  { date: "Oct 18", day: "Fri", event: "Jazz Trio: Blue Note Sessions", time: "7-10PM" },
                  { date: "Oct 21", day: "Mon", event: "Wine Education: Old World vs New World", time: "6-8PM" },
                  { date: "Oct 25", day: "Fri", event: "Acoustic Asheville: Singer-Songwriter Night", time: "7-10PM" },
                  { date: "Oct 29", day: "Tue", event: "Halloween Masquerade Ball", time: "8PM-Midnight" }
                ].map((event, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start pb-4 border-b border-amber-400/10 last:border-0 last:pb-0"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="mr-4 flex-shrink-0">
                      <div className="w-16 h-16 bg-amber-400/10 rounded-xl flex flex-col items-center justify-center border border-amber-400/30">
                        <span className="text-amber-300 font-bold text-lg">{event.date.split(' ')[1]}</span>
                        <span className="text-xs text-cream-400">{event.day}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-playfair font-bold text-amber-200">{event.event}</h4>
                      <div className="flex items-center text-cream-300 mt-1">
                        <Clock className="h-4 w-4 mr-2 text-amber-400" />
                        <span>{event.time}</span>
                      </div>
                      <button className="mt-2 text-sm text-amber-300 hover:text-amber-200 font-medium flex items-center">
                        Reserve Seating <ChevronDown className="ml-1 h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Venue Description */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <h3 className="text-2xl font-playfair font-bold text-amber-200 mb-4">The Barrel Room</h3>
                <p className="text-cream-200 mb-4 leading-relaxed">
                  Step into our intimate 40-seat performance space carved from original 1920s brick walls. 
                  {showFullDescription ? (
                    <>
                      By day, it's our private tasting salon; by night, Asheville's most sought-after listening room. 
                      The acoustics are perfected for acoustic performances, with every seat offering an unobstructed view of the stage. 
                      We limit capacity to ensure an authentic connection between artist and audience—a philosophy that's made us a favorite 
                      of Grammy-winning musicians and rising stars alike.
                    </>
                  ) : (
                    "By day, it's our private tasting salon; by night, Asheville's most sought-after listening room..."
                  )}
                </p>
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-amber-300 hover:text-amber-200 font-medium flex items-center"
                >
                  {showFullDescription ? 'Show Less' : 'Read More'}
                  {showFullDescription ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </button>
              </motion.div>

              <div className="aspect-video rounded-2xl overflow-hidden border-2 border-amber-400/20">
                <Image
                  src="https://images.unsplash.com/photo-1555377838-09f35e5e1a95?auto=format&fit=crop&w=1200&q=80"
                  alt="Intimate live jazz performance at Vine & Verse"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="bg-gradient-to-r from-amber-900/30 to-transparent p-6 rounded-xl border border-amber-400/20">
                <h3 className="text-xl font-playfair font-bold text-amber-200 mb-3">Private Events</h3>
                <p className="text-cream-200 mb-4">
                  Host your wedding reception, corporate gathering, or milestone celebration in our exclusive space. 
                  Our events team crafts custom wine pairings and experiences that reflect your unique vision.
                </p>
                <button className="text-amber-300 hover:text-amber-200 font-medium flex items-center">
                  View Event Packages <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Section */}
      <section 
        ref={visitRef}
        className="py-24 bg-gradient-to-b from-burgundy-950 to-burgundy-900"
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block bg-amber-900/30 px-4 py-1 rounded-full mb-4">
              <MapPin className="h-5 w-5 text-amber-300 inline mr-2" />
              <span className="text-amber-200 font-medium">Find Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
              In the Heart of <span className="text-amber-300">Downtown Asheville</span>
            </h2>
            <p className="text-cream-200 text-lg">
              Nestled between the historic Flatiron Building and Pack Square Park
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="space-y-8">
              <div className="bg-burgundy-900/70 backdrop-blur-sm rounded-2xl p-8 border border-amber-400/20">
                <div className="flex items-start">
                  <div className="bg-amber-400 p-3 rounded-lg mr-4 flex-shrink-0">
                    <MapPin className="h-6 w-6 text-burgundy-900" />
                  </div>
                  <div>
                    <h3 className="text-xl font-playfair font-bold text-amber-200 mb-2">Our Location</h3>
                    <p className="text-cream-200">
                      45 Biltmore Avenue<br />
                      Asheville, NC 28801<br />
                      <span className="block mt-2 text-amber-300 font-medium">(828) 555-0192</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-burgundy-900/70 backdrop-blur-sm rounded-2xl p-8 border border-amber-400/20">
                <div className="flex items-start">
                  <div className="bg-amber-400 p-3 rounded-lg mr-4 flex-shrink-0">
                    <Clock className="h-6 w-6 text-burgundy-900" />
                  </div>
                  <div>
                    <h3 className="text-xl font-playfair font-bold text-amber-200 mb-2">Hours</h3>
                    <div className="text-cream-200 space-y-1">
                      <p>Monday-Thursday: 4PM-11PM</p>
                      <p>Friday-Saturday: 3PM-Midnight</p>
                      <p>Sunday: 3PM-10PM</p>
                      <p className="mt-2 text-sm text-amber-300">
                        Last tasting flight served 30 minutes before closing
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-rose-900/20 to-purple-900/20 rounded-2xl p-6">
                <h3 className="text-xl font-playfair font-bold text-amber-200 mb-3">Parking</h3>
                <p className="text-cream-200 mb-4">
                  Convenient parking is available at the Pack Square Parking Deck (entrance on Lexington Ave). 
                  We validate for 3 hours with any tasting purchase.
                </p>
                <Link 
                  href="https://maps.app.goo.gl/PackSquareDeck" 
                  target="_blank"
                  className="text-amber-300 hover:text-amber-200 font-medium flex items-center"
                >
                  View Parking Deck Map <ChevronDown className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-amber-400/20 shadow-2xl">
              <div className="aspect-video relative">
                <Image
                  src="https://images.unsplash.com/photo-1516483638261-f4dbaf034e99?auto=format&fit=crop&w=1200&q=80"
                  alt="Exterior of Vine & Verse wine bar in downtown Asheville"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="bg-burgundy-900 p-6">
                <h3 className="text-xl font-playfair font-bold text-amber-200 mb-3">A Space Steeped in History</h3>
                <p className="text-cream-200 mb-4">
                  Our space was originally Asheville's first French bakery in 1907. Original brick walls and 
                  exposed beams frame our modern tasting room, where century-old craftsmanship meets contemporary 
                  wine culture.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['wheelchair accessible', 'private events', 'complimentary wifi', 'valet service'].map((amenity) => (
                    <span 
                      key={amenity} 
                      className="bg-amber-900/30 text-amber-200 text-xs px-3 py-1 rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-burgundy-900 border-t border-amber-400/20 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-amber-400 p-2 rounded-full">
                  <Wine className="h-6 w-6 text-burgundy-900" />
                </div>
                <span className="text-2xl font-playfair font-bold text-cream-50">
                  <span className="text-amber-300">Vine</span> & Verse
                </span>
              </div>
              <p className="text-cream-300 max-w-md mb-6">
                Asheville's premier wine tasting room featuring curated flights, artisanal pairings, 
                and intimate live music in a historic downtown space.
              </p>
              <div className="flex space-x-4">
                {[Instagram, Facebook, Youtube].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 hover:bg-amber-400/20 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-amber-200 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {['Tasting Menu', 'Events Calendar', 'Private Events', 'Our Story', 'Contact'].map((item) => (
                  <li key={item}>
                    <a 
                      href="#" 
                      className="text-cream-300 hover:text-amber-200 transition-colors block py-1"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-amber-200 mb-4">Visit Us</h3>
              <address className="text-cream-300 not-italic space-y-2">
                <p>45 Biltmore Avenue</p>
                <p>Asheville, NC 28801</p>
                <p className="mt-3">(828) 555-0192</p>
                <p>hello@vineandverse.com</p>
              </address>
            </div>
          </div>
          
          <div className="border-t border-amber-400/20 mt-12 pt-8 text-center text-cream-400 text-sm">
            <p>
              © {new Date().getFullYear()} Vine & Verse Wine Bar. All rights reserved. 
              <span className="block mt-1">Crafted with passion in the Blue Ridge Mountains</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Reservation Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link 
          href="https://resy.com/cities/avl/vine-and-verse" 
          target="_blank"
          className="group relative bg-amber-400 hover:bg-amber-300 text-burgundy-900 font-bold py-4 px-6 rounded-full shadow-xl transition-all hover:shadow-amber-500/50 flex items-center"
        >
          <span className="hidden md:inline mr-2">Reserve Your Experience</span>
          <div className="bg-burgundy-900 w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-burgundy-800 transition-colors">
            <ChevronDown className="h-5 w-5 text-amber-300 transform group-hover:translate-y-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}