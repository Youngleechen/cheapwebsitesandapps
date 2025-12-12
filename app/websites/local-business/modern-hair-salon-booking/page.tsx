'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Scissors, 
  Sparkles, 
  Users, 
  Star, 
  ChevronRight,
  Calendar,
  Instagram,
  Facebook,
  Mail,
  Menu,
  X,
  CheckCircle
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Gallery items for the salon
const SALON_GALLERY = [
  { 
    id: 'balayage-masterpiece', 
    title: 'Balayage Transformation',
    prompt: 'A stunning hair transformation showing seamless balayage from dark roots to caramel ends. Model has shoulder-length wavy hair with perfect blend, natural lighting, salon environment, luxury aesthetic.'
  },
  { 
    id: 'precision-cut', 
    title: 'Precision Bob',
    prompt: 'Sharp, clean bob haircut with razor-sharp lines, model looking confident, hair shining under salon lights, professional hair styling, minimalist background, fashion photography style.'
  },
  { 
    id: 'vivid-color', 
    title: 'Vivid Color Art',
    prompt: 'Vibrant pastel hair color in rose gold and lavender shades, perfectly blended, styled in soft waves, close-up shot showing color dimension, artistic lighting, high-fashion hair color.'
  },
  { 
    id: 'bridal-style', 
    title: 'Bridal Elegance',
    prompt: 'Elegant wedding updo with intricate braiding and fresh flowers, soft romantic lighting, model in white, detailed hair accessories, ethereal atmosphere, professional hairstyling.'
  },
  { 
    id: 'mens-grooming', 
    title: 'Modern Mens Cut',
    prompt: 'Sharp fade haircut with textured top, beard trim and line-up, professional barbering tools visible, clean modern style, black and white photography, masculine aesthetic.'
  },
  { 
    id: 'curly-transformation', 
    title: 'Curl Specialist',
    prompt: 'Beautiful curly hair transformation showing defined curls and hydration, before-and-after styling, curly hair products, natural sunlight, authentic joyful expression.'
  },
];

const TEAM_MEMBERS = [
  { 
    id: 'stylist-sarah', 
    name: 'Sarah Chen',
    role: 'Creative Director & Color Specialist',
    prompt: 'Professional female hairstylist with artistic fashion style, holding color brush, confident smile, modern salon environment, 35-40 years old, elegant but approachable.'
  },
  { 
    id: 'stylist-marcus', 
    name: 'Marcus Rivera',
    role: 'Master Barber & Stylist',
    prompt: 'Male barber with stylish tattoos, holding clippers, focused expression, modern barber shop setting, 30-35 years old, professional but cool aesthetic.'
  },
  { 
    id: 'stylist-chloe', 
    name: 'Chloe Williams',
    role: 'Extensions & Bridal Expert',
    prompt: 'Female hairstylist working on hair extensions, gentle hands, detailed close-up, luxury salon setting, 28-33 years old, elegant and precise.'
  },
];

const SERVICES = [
  {
    title: 'Balayage & Color',
    description: 'Hand-painted highlights for a natural, sun-kissed look',
    price: '$180+',
    duration: '2-3 hours',
    icon: <Sparkles className="w-8 h-8" />
  },
  {
    title: 'Precision Cut',
    description: 'Custom haircut tailored to your face shape and lifestyle',
    price: '$85+',
    duration: '1 hour',
    icon: <Scissors className="w-8 h-8" />
  },
  {
    title: 'Hair Treatments',
    description: 'Repair damaged hair with our luxury keratin treatments',
    price: '$120+',
    duration: '1.5 hours',
    icon: <Star className="w-8 h-8" />
  },
  {
    title: 'Bridal & Event',
    description: 'Complete wedding and special occasion hair services',
    price: '$150+',
    duration: '2 hours',
    icon: <Users className="w-8 h-8" />
  },
];

type ImageState = { [key: string]: { image_url: string | null } };

export default function ModernHairSalon() {
  const [galleryImages, setGalleryImages] = useState<ImageState>({});
  const [teamImages, setTeamImages] = useState<ImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: ''
  });
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);

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
      // Load gallery images
      const { data: galleryData } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      // Load team images (different prefix)
      const { data: teamData } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/team/%`)
        .order('created_at', { ascending: false });

      const galleryState: ImageState = {};
      const teamState: ImageState = {};

      SALON_GALLERY.forEach(art => galleryState[art.id] = { image_url: null });
      TEAM_MEMBERS.forEach(member => teamState[member.id] = { image_url: null });

      if (galleryData) {
        const latestGalleryImages: Record<string, string> = {};
        galleryData.forEach(img => {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            if (SALON_GALLERY.some(a => a.id === artId) && !latestGalleryImages[artId]) {
              latestGalleryImages[artId] = img.path;
            }
          }
        });

        SALON_GALLERY.forEach(art => {
          if (latestGalleryImages[art.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestGalleryImages[art.id]).data.publicUrl;
            galleryState[art.id] = { image_url: url };
          }
        });
      }

      if (teamData) {
        const latestTeamImages: Record<string, string> = {};
        teamData.forEach(img => {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === 'team') {
            const memberId = pathParts[2];
            if (TEAM_MEMBERS.some(m => m.id === memberId) && !latestTeamImages[memberId]) {
              latestTeamImages[memberId] = img.path;
            }
          }
        });

        TEAM_MEMBERS.forEach(member => {
          if (latestTeamImages[member.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestTeamImages[member.id]).data.publicUrl;
            teamState[member.id] = { image_url: url };
          }
        });
      }

      setGalleryImages(galleryState);
      setTeamImages(teamState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string, type: 'gallery' | 'team') => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(itemId);
    try {
      const prefix = type === 'gallery' ? GALLERY_PREFIX : 'team';
      const folderPath = `${ADMIN_USER_ID}/${prefix}/${itemId}/`;

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
      
      if (type === 'gallery') {
        setGalleryImages(prev => ({ ...prev, [itemId]: { image_url: publicUrl } }));
      } else {
        setTeamImages(prev => ({ ...prev, [itemId]: { image_url: publicUrl } }));
      }
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

  const handleBookNow = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsBooking(false);
    setBookingSuccess(true);
    
    // Reset form
    setBookingForm({
      name: '',
      email: '',
      phone: '',
      service: '',
      date: '',
      time: ''
    });

    setTimeout(() => setBookingSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <span className="text-2xl font-serif font-bold text-rose-800">Lumière</span>
              <span className="text-2xl font-serif text-gray-400 ml-1">Salon</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-700 hover:text-rose-800 transition">Services</a>
              <a href="#gallery" className="text-gray-700 hover:text-rose-800 transition">Gallery</a>
              <a href="#team" className="text-gray-700 hover:text-rose-800 transition">Our Team</a>
              <a href="#booking" className="text-gray-700 hover:text-rose-800 transition">Book Now</a>
              <button 
                onClick={handleBookNow}
                className="bg-rose-800 text-white px-6 py-2.5 rounded-full hover:bg-rose-900 transition"
              >
                Book Appointment
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-6 space-y-4">
              <a href="#services" className="block text-gray-700 hover:text-rose-800 py-2">Services</a>
              <a href="#gallery" className="block text-gray-700 hover:text-rose-800 py-2">Gallery</a>
              <a href="#team" className="block text-gray-700 hover:text-rose-800 py-2">Our Team</a>
              <a href="#booking" className="block text-gray-700 hover:text-rose-800 py-2">Book Now</a>
              <button 
                onClick={handleBookNow}
                className="w-full bg-rose-800 text-white px-6 py-3 rounded-full hover:bg-rose-900 transition"
              >
                Book Appointment
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div ref={heroRef} className="pt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-50/80 to-white/80 z-10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
                Elevate Your Style with 
                <span className="text-rose-800 block mt-2">Artistic Precision</span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 mb-8">
                Where modern techniques meet timeless beauty. Experience hair transformation 
                by award-winning stylists in a luxurious, welcoming environment.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleBookNow}
                  className="bg-rose-800 text-white px-8 py-4 rounded-full hover:bg-rose-900 transition flex items-center group"
                >
                  Book Your Transformation
                  <ChevronRight className="ml-2 group-hover:translate-x-1 transition" />
                </button>
                <a 
                  href="#gallery" 
                  className="border-2 border-rose-800 text-rose-800 px-8 py-4 rounded-full hover:bg-rose-50 transition"
                >
                  View Our Work
                </a>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-rose-200 to-pink-200 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white p-2 rounded-3xl shadow-2xl">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Sparkles className="w-16 h-16 text-rose-300 mx-auto mb-4" />
                    <p className="text-gray-700 text-lg">Your transformation begins here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-rose-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8">
            <div className="text-center">
              <div className="text-3xl font-bold">5000+</div>
              <div className="text-rose-200">Happy Clients</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">15+</div>
              <div className="text-rose-200">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-rose-200">Client Retention</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">4.9★</div>
              <div className="text-rose-200">Google Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-gray-900">Signature Services</h2>
            <p className="text-gray-600 mt-4 text-lg">Premium hair services tailored to your unique style</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((service, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition group border border-gray-100"
              >
                <div className="text-rose-800 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                  <span className="text-2xl font-bold text-rose-800">{service.price}</span>
                  <span className="text-gray-500">{service.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-gray-900">Our Transformation Gallery</h2>
            <p className="text-gray-600 mt-4 text-lg">Real results from real clients</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SALON_GALLERY.map((artwork) => {
              const imageData = galleryImages[artwork.id] || { image_url: null };
              const imageUrl = imageData.image_url;

              return (
                <div key={artwork.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-lg">
                  {/* Image Container */}
                  <div className="aspect-[4/3] overflow-hidden">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                        <div className="text-center p-8">
                          <Sparkles className="w-12 h-12 text-rose-300 mx-auto mb-4" />
                          <span className="text-rose-800 font-medium">{artwork.title}</span>
                          {adminMode && (
                            <p className="text-sm text-rose-600 mt-2">Click upload to add image</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay Content */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">{artwork.title}</h3>
                      <p className="text-sm text-rose-200">View Transformation</p>
                    </div>
                  </div>

                  {/* Admin Controls */}
                  {adminMode && (
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 space-y-2">
                      {!imageUrl && (
                        <div className="space-y-1">
                          <p className="text-xs text-rose-200 whitespace-nowrap">{artwork.prompt}</p>
                          <button
                            onClick={() => copyPrompt(artwork.prompt, artwork.id)}
                            className="text-xs bg-rose-800 hover:bg-rose-700 text-white px-2 py-1 rounded w-full"
                            type="button"
                          >
                            {copiedId === artwork.id ? 'Copied!' : 'Copy Prompt'}
                          </button>
                        </div>
                      )}
                      <label className="block text-xs bg-white text-rose-800 px-3 py-2 rounded cursor-pointer hover:bg-rose-50 transition">
                        {uploading === artwork.id ? 'Uploading…' : imageUrl ? 'Replace' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, artwork.id, 'gallery')}
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
      <section id="team" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-gray-900">Meet Our Artists</h2>
            <p className="text-gray-600 mt-4 text-lg">Award-winning stylists dedicated to your beauty</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {TEAM_MEMBERS.map((member) => {
              const imageData = teamImages[member.id] || { image_url: null };
              const imageUrl = imageData.image_url;

              return (
                <div key={member.id} className="text-center group">
                  <div className="relative mb-6">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center p-6">
                            <Users className="w-16 h-16 text-rose-300 mx-auto mb-4" />
                            <span className="text-rose-800 font-medium">{member.name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {adminMode && (
                      <div className="absolute top-4 right-4 space-y-2">
                        {!imageUrl && (
                          <button
                            onClick={() => copyPrompt(member.prompt, member.id)}
                            className="text-xs bg-black/70 text-white px-2 py-1 rounded backdrop-blur-sm"
                            type="button"
                          >
                            {copiedId === member.id ? 'Copied!' : 'Copy Prompt'}
                          </button>
                        )}
                        <label className="block text-xs bg-rose-800 text-white px-3 py-2 rounded cursor-pointer hover:bg-rose-700 transition">
                          {uploading === member.id ? 'Uploading…' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, member.id, 'team')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                  <p className="text-rose-700 font-medium mt-1">{member.role}</p>
                  <p className="text-gray-600 mt-3">Specializes in color correction, balayage, and custom cuts</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" ref={bookingRef} className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-6">Book Your Transformation</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Experience luxury hair care with our expert stylists. 
                Book your appointment and let us create your perfect look.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-rose-800 p-3 rounded-lg">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Call Us</h3>
                    <p className="text-gray-300">(555) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-rose-800 p-3 rounded-lg">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Visit Our Salon</h3>
                    <p className="text-gray-300">123 Style Avenue, Fashion District</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-rose-800 p-3 rounded-lg">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Hours</h3>
                    <p className="text-gray-300">Tue-Sat: 9AM-7PM, Sun-Mon: 10AM-5PM</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6">Schedule Appointment</h3>
              
              {bookingSuccess ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold mb-2">Booking Confirmed!</h4>
                  <p className="text-gray-300">We'll contact you shortly to confirm your appointment.</p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                    required
                  />
                  
                  <select
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    value={bookingForm.service}
                    onChange={(e) => setBookingForm({...bookingForm, service: e.target.value})}
                    required
                  >
                    <option value="">Select Service</option>
                    <option value="balayage">Balayage & Color</option>
                    <option value="cut">Precision Cut</option>
                    <option value="treatment">Hair Treatment</option>
                    <option value="bridal">Bridal & Event</option>
                  </select>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="date"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                      required
                    />
                    <select
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                      required
                    >
                      <option value="">Select Time</option>
                      <option value="9:00">9:00 AM</option>
                      <option value="10:30">10:30 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:30">3:30 PM</option>
                      <option value="17:00">5:00 PM</option>
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isBooking}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center"
                  >
                    {isBooking ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        Booking...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2" />
                        Book Appointment
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-gray-900">Client Love</h2>
            <p className="text-gray-600 mt-4 text-lg">What our clients say about their experience</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                text: "Sarah transformed my damaged hair into the healthiest, most beautiful balayage I've ever had. I've never received so many compliments!",
                author: "Jessica M.",
                role: "Client for 3 years"
              },
              {
                text: "The attention to detail is incredible. Marcus understands exactly what I want and executes it perfectly every single time.",
                author: "Michael T.",
                role: "Monthly Client"
              },
              {
                text: "As a bride, I was nervous about my wedding hair. Chloe created the most stunning updo that lasted all day and photographed beautifully.",
                author: "Amanda R.",
                role: "Bridal Client"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8">
                <div className="flex text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.author}</p>
                  <p className="text-rose-700 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-2xl font-serif font-bold text-rose-800">Lumière</span>
                <span className="text-2xl font-serif text-gray-400 ml-1">Salon</span>
              </div>
              <p className="text-gray-400">
                Where modern techniques meet timeless beauty. Experience excellence in hair care.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#services" className="text-gray-400 hover:text-white transition">Services</a></li>
                <li><a href="#gallery" className="text-gray-400 hover:text-white transition">Gallery</a></li>
                <li><a href="#team" className="text-gray-400 hover:text-white transition">Our Team</a></li>
                <li><a href="#booking" className="text-gray-400 hover:text-white transition">Book Now</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  123 Style Avenue, Fashion District
                </li>
                <li className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  (555) 123-4567
                </li>
                <li className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  hello@lumieresalon.com
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-rose-800 transition">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-rose-800 transition">
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
              <p className="text-gray-400 mt-6 text-sm">
                © {new Date().getFullYear()} Lumière Salon. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-purple-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Admin Mode Active</span>
          </div>
          <p className="text-xs text-purple-300 mt-1">You can upload gallery & team images</p>
        </div>
      )}
    </div>
  );
}