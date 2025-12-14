'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook,
  Star,
  ChevronRight,
  Calendar,
  Users,
  Menu,
  X,
  Check,
  ChefHat,
  Wine,
  UtensilsCrossed
} from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'restaurant-gallery';

// Restaurant gallery sections with detailed prompts for image generation
const RESTAURANT_GALLERY = [
  { 
    id: 'hero-main', 
    title: 'Hero Section Background',
    description: 'Main restaurant ambiance shot for hero section',
    prompt: 'A sophisticated fine dining Italian restaurant interior at golden hour, with warm lighting casting soft shadows across white linen tablecloths, polished silverware, crystal wine glasses, and a centerpiece of fresh flowers. In the background, a floor-to-ceiling wine cellar is visible. The atmosphere is elegant, intimate, and luxurious with soft focus on the foreground table setting. Cinematic lighting, shot on professional DSLR, shallow depth of field.',
    aspect: 'landscape'
  },
  { 
    id: 'signature-dish-1', 
    title: 'Truffle Risotto',
    description: 'Our signature truffle risotto presentation',
    prompt: 'Artistically plated black truffle risotto in a shallow white ceramic bowl, with delicate shavings of fresh black truffle arranged elegantly on top, a drizzle of truffle oil creating artistic patterns, garnished with microgreens. The risotto has perfect creamy consistency. Food photography with dramatic side lighting highlighting texture and steam rising from the dish. Shot on professional food photography setup, 85mm lens, f/2.8.',
    aspect: 'square'
  },
  { 
    id: 'signature-dish-2', 
    title: 'Osso Buco Milanese',
    description: 'Traditional Osso Buco with saffron risotto',
    prompt: 'Traditional Italian Osso Buco presented on a rustic ceramic plate, with a cross-cut veal shank perfectly braised until tender, garnished with gremolata (lemon zest, garlic, parsley). Accompanied by saffron risotto and seasonal vegetables. Rich, inviting colors with steam visible. Professional food styling with golden hour lighting through a window, creating beautiful highlights on the marrow bone.',
    aspect: 'square'
  },
  { 
    id: 'restaurant-ambiance', 
    title: 'Dining Room Ambiance',
    description: 'Evening ambiance of our main dining room',
    prompt: 'Elegant Italian restaurant dining room at dinner time, with soft candlelight on tables, patrons engaged in conversation, waitstaff in crisp white shirts and black aprons attending tables. Warm wood paneling, exposed brick wall with wine displays, soft jazz playing in the background (implied). Low-light photography with bokeh effect on background elements, creating intimate atmosphere. Shot at f/1.8, ISO 1600.',
    aspect: 'landscape'
  },
  { 
    id: 'wine-cellar', 
    title: 'Wine Cellar',
    description: 'Our curated Italian wine selection',
    prompt: 'Impressive temperature-controlled wine cellar in a fine dining restaurant, featuring floor-to-ceiling racks of Italian wines from Piedmont, Tuscany, and Sicily. A sommelier in a suit is carefully selecting a bottle, holding it up to the soft cellar lighting. Moody, dramatic lighting with highlights on bottle labels and glass. Wide angle shot showing depth of cellar.',
    aspect: 'portrait'
  },
  { 
    id: 'chef-table', 
    title: 'Chef\'s Table Experience',
    description: 'Exclusive chef\'s table kitchen view',
    prompt: 'Chef\'s table experience in an open kitchen, with guests seated at a marble counter watching our head chef artfully plate a dish. The chef is focused, with perfectly arranged ingredients, tweezers in hand, adding final garnishes. Professional kitchen equipment in background, steam rising from pans. Dynamic action shot with motion blur on background kitchen staff, sharp focus on chef and dish.',
    aspect: 'landscape'
  },
  { 
    id: 'dessert-feature', 
    title: 'Tiramisu Presentation',
    description: 'Deconstructed tiramisu dessert',
    prompt: 'Modern deconstructed tiramisu presentation in a glass dessert coupe, showing perfect layers of coffee-soaked ladyfingers, mascarpone cream, dusted with cocoa powder and gold leaf garnish. Accompanied by a small espresso cup and amaretto cookie on the side. Elegant dessert photography with dark moody background, spotlight on the dessert creating contrast. Shot with macro lens for texture detail.',
    aspect: 'square'
  },
  { 
    id: 'private-dining', 
    title: 'Private Dining Room',
    description: 'Our exclusive private dining space',
    prompt: 'Elegant private dining room in an Italian restaurant, with a long oak table set for 12 guests, floral centerpiece, personalized menus at each setting. Floor-to-ceiling windows overlooking a city skyline at dusk, with soft ambient lighting from a contemporary chandelier. The room has acoustic paneling and artisanal wall art. Interior design photography with balanced lighting.',
    aspect: 'landscape'
  },
];

type GalleryState = { 
  [key: string]: { 
    image_url: string | null;
    placeholder_color: string;
  } 
};

type ReservationForm = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  occasion: string;
  specialRequests: string;
};

export default function RistoranteSiena() {
  const [gallery, setGallery] = useState<GalleryState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reservationSubmitted, setReservationSubmitted] = useState(false);
  const [reservationForm, setReservationForm] = useState<ReservationForm>({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '19:00',
    guests: 2,
    occasion: '',
    specialRequests: ''
  });

  // Hours data
  const hours = [
    { day: 'Monday - Thursday', hours: '5:00 PM - 10:00 PM' },
    { day: 'Friday - Saturday', hours: '5:00 PM - 11:00 PM' },
    { day: 'Sunday', hours: '4:00 PM - 9:00 PM' },
  ];

  // Menu highlights
  const menuHighlights = [
    { name: 'Burrata e Parma', description: 'Fresh burrata with Parma ham, heirloom tomatoes, basil oil', price: '$24' },
    { name: 'Tagliatelle al Tartufo', description: 'Handmade tagliatelle with black truffle, parmesan cream', price: '$38' },
    { name: 'Branzino al Forno', description: 'Mediterranean sea bass with fennel, citrus, olive oil', price: '$42' },
    { name: 'Filetto di Manzo', description: 'Grilled beef tenderloin with porcini mushrooms, Barolo reduction', price: '$56' },
  ];

  // Testimonials
  const testimonials = [
    { name: 'Michael R.', comment: 'The best Italian dining experience outside of Italy. The wine pairing was exceptional.', rating: 5 },
    { name: 'Sarah L.', comment: 'Celebrated our anniversary here. The private dining room and personalized menu made it unforgettable.', rating: 5 },
    { name: 'James K.', comment: 'As a frequent traveler to Italy, I can attest this is authentic, elevated Italian cuisine.', rating: 5 },
  ];

  // Initialize gallery state with placeholder colors
  useEffect(() => {
    const initialState: GalleryState = {};
    RESTAURANT_GALLERY.forEach(art => {
      initialState[art.id] = { 
        image_url: null,
        placeholder_color: getPlaceholderColor(art.id)
      };
    });
    setGallery(initialState);
  }, []);

  function getPlaceholderColor(id: string): string {
    const colors = [
      'bg-amber-900/30', 'bg-stone-800/30', 'bg-rose-950/30', 
      'bg-emerald-950/30', 'bg-violet-950/30', 'bg-amber-950/30',
      'bg-stone-900/30', 'bg-rose-900/30'
    ];
    const index = RESTAURANT_GALLERY.findIndex(item => item.id === id);
    return colors[index % colors.length];
  }

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

  // Load gallery images
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

      const initialState: GalleryState = {};
      RESTAURANT_GALLERY.forEach(art => {
        initialState[art.id] = { 
          image_url: null,
          placeholder_color: getPlaceholderColor(art.id)
        };
      });

      if (images) {
        const latestImagePerArtwork: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX.replace('-', '_')) {
            const artId = pathParts[2];
            if (RESTAURANT_GALLERY.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        RESTAURANT_GALLERY.forEach(art => {
          if (latestImagePerArtwork[art.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerArtwork[art.id]).data.publicUrl;
            initialState[art.id] = { 
              image_url: url,
              placeholder_color: getPlaceholderColor(art.id)
            };
          }
        });
      }

      setGallery(initialState);
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

      // Clean up old images for this artwork
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
      setGallery(prev => ({ 
        ...prev, 
        [artworkId]: { 
          image_url: publicUrl,
          placeholder_color: getPlaceholderColor(artworkId)
        } 
      }));
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

  const handleReservationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReservationForm(prev => ({
      ...prev,
      [name]: name === 'guests' ? parseInt(value) : value
    }));
  };

  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would connect to a booking API
    console.log('Reservation submitted:', reservationForm);
    setReservationSubmitted(true);
    setTimeout(() => setReservationSubmitted(false), 5000);
    // Reset form
    setReservationForm({
      name: '',
      email: '',
      phone: '',
      date: '',
      time: '19:00',
      guests: 2,
      occasion: '',
      specialRequests: ''
    });
  };

  // Get hero image
  const heroImage = gallery['hero-main']?.image_url;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm z-50 border-b border-stone-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="h-8 w-8 text-amber-700" />
              <span className="text-2xl font-serif font-bold text-stone-800">Ristorante Siena</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="font-medium hover:text-amber-700 transition">About</a>
              <a href="#menu" className="font-medium hover:text-amber-700 transition">Menu</a>
              <a href="#gallery" className="font-medium hover:text-amber-700 transition">Gallery</a>
              <a href="#reservations" className="font-medium hover:text-amber-700 transition">Reservations</a>
              <a href="#contact" className="font-medium hover:text-amber-700 transition">Contact</a>
              <button className="bg-amber-700 text-white px-6 py-2 rounded-full hover:bg-amber-800 transition font-medium">
                Book a Table
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-stone-200 pt-4">
              <div className="flex flex-col space-y-4">
                <a href="#about" className="font-medium hover:text-amber-700 transition" onClick={() => setMobileMenuOpen(false)}>About</a>
                <a href="#menu" className="font-medium hover:text-amber-700 transition" onClick={() => setMobileMenuOpen(false)}>Menu</a>
                <a href="#gallery" className="font-medium hover:text-amber-700 transition" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
                <a href="#reservations" className="font-medium hover:text-amber-700 transition" onClick={() => setMobileMenuOpen(false)}>Reservations</a>
                <a href="#contact" className="font-medium hover:text-amber-700 transition" onClick={() => setMobileMenuOpen(false)}>Contact</a>
                <button className="bg-amber-700 text-white px-6 py-2 rounded-full hover:bg-amber-800 transition font-medium w-full">
                  Book a Table
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Background image with gradient overlay */}
        <div className="absolute inset-0 z-0">
          {heroImage ? (
            <img 
              src={heroImage} 
              alt="Ristorante Siena Interior" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-restaurant.jpg';
              }}
            />
          ) : (
            <div className={`w-full h-full ${gallery['hero-main']?.placeholder_color || 'bg-stone-900'} flex items-center justify-center`}>
              <div className="text-center">
                <UtensilsCrossed className="h-24 w-24 text-stone-600 mx-auto mb-4" />
                <p className="text-stone-600 font-medium">Fine Dining Italian Restaurant</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/40 to-transparent"></div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Star className="h-6 w-6 text-amber-300 mx-2" />
            <Star className="h-8 w-8 text-amber-300 mx-2" />
            <Star className="h-6 w-6 text-amber-300 mx-2" />
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">Ristorante Siena</h1>
          <p className="text-xl md:text-2xl font-light mb-8 max-w-2xl mx-auto">
            Authentic Italian fine dining where tradition meets contemporary elegance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#reservations" 
              className="bg-amber-700 text-white px-8 py-4 rounded-full hover:bg-amber-800 transition font-medium text-lg inline-flex items-center justify-center"
            >
              Reserve Your Table <ChevronRight className="ml-2 h-5 w-5" />
            </a>
            <a 
              href="#menu" 
              className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-full hover:bg-white/20 transition font-medium text-lg"
            >
              View Our Menu
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight className="h-6 w-6 text-white rotate-90" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-6">A Taste of Tuscany in the City</h2>
              <p className="text-lg text-stone-600 mb-6">
                Established in 2008, Ristorante Siena brings the soul of Italian cuisine to discerning diners. 
                Our philosophy is simple: source the finest ingredients, honor traditional techniques, and 
                present each dish as a work of art.
              </p>
              <p className="text-lg text-stone-600 mb-8">
                Head Chef Giovanni Moretti, trained in Florence's most prestigious kitchens, crafts seasonal 
                menus that tell a story of Italian culinary heritage while embracing modern innovation.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center">
                  <ChefHat className="h-8 w-8 text-amber-700 mr-3" />
                  <div>
                    <h4 className="font-bold">Master Chefs</h4>
                    <p className="text-sm text-stone-500">Trained in Italy</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Wine className="h-8 w-8 text-amber-700 mr-3" />
                  <div>
                    <h4 className="font-bold">300+ Wines</h4>
                    <p className="text-sm text-stone-500">Italian selection</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              {gallery['restaurant-ambiance']?.image_url ? (
                <img 
                  src={gallery['restaurant-ambiance'].image_url} 
                  alt="Restaurant Ambiance" 
                  className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"
                />
              ) : (
                <div className={`${gallery['restaurant-ambiance']?.placeholder_color || 'bg-stone-800'} rounded-2xl shadow-2xl w-full h-[500px] flex items-center justify-center`}>
                  <div className="text-center p-8">
                    <UtensilsCrossed className="h-16 w-16 text-stone-600 mx-auto mb-4" />
                    <p className="text-stone-600 font-medium">Elegant Dining Ambiance</p>
                  </div>
                </div>
              )}
              {/* Decorative element */}
              <div className="absolute -bottom-6 -left-6 bg-amber-700 text-white p-6 rounded-2xl shadow-xl">
                <div className="text-3xl font-bold">15+</div>
                <div className="text-sm">Years of Excellence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Highlights */}
      <section id="menu" className="py-20 bg-stone-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4">Culinary Masterpieces</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Our menu celebrates Italy's diverse regions with seasonal ingredients and artisanal techniques
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {menuHighlights.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold font-serif">{item.name}</h3>
                  <span className="text-amber-700 font-bold">{item.price}</span>
                </div>
                <p className="text-stone-600 mb-4">{item.description}</p>
                <div className="text-sm text-stone-500">Seasonal · Market Fresh</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Signature Dish 1 */}
            <div className="relative rounded-2xl overflow-hidden group">
              {gallery['signature-dish-1']?.image_url ? (
                <img 
                  src={gallery['signature-dish-1'].image_url} 
                  alt="Truffle Risotto" 
                  className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className={`${gallery['signature-dish-1']?.placeholder_color || 'bg-amber-900'} w-full h-[400px] flex items-center justify-center`}>
                  <div className="text-center">
                    <UtensilsCrossed className="h-16 w-16 text-stone-600 mx-auto mb-4" />
                    <p className="text-stone-600 font-medium">Truffle Risotto</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Signature Dish</h3>
                <p className="text-amber-200">Black Truffle Risotto with Parmigiano Reggiano</p>
              </div>
            </div>

            {/* Signature Dish 2 */}
            <div className="relative rounded-2xl overflow-hidden group">
              {gallery['signature-dish-2']?.image_url ? (
                <img 
                  src={gallery['signature-dish-2'].image_url} 
                  alt="Osso Buco" 
                  className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className={`${gallery['signature-dish-2']?.placeholder_color || 'bg-stone-800'} w-full h-[400px] flex items-center justify-center`}>
                  <div className="text-center">
                    <UtensilsCrossed className="h-16 w-16 text-stone-600 mx-auto mb-4" />
                    <p className="text-stone-600 font-medium">Osso Buco Milanese</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Chef's Special</h3>
                <p className="text-amber-200">Traditional Osso Buco with Saffron Risotto</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4">Our World</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Experience the ambiance, artistry, and attention to detail that define Ristorante Siena
            </p>
          </div>

          {/* Admin upload panel */}
          {adminMode && (
            <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
                <ChefHat className="h-6 w-6 mr-2" />
                Admin Image Management
              </h3>
              <p className="text-amber-800 mb-4">
                Upload professional restaurant images using the prompts below. Each prompt is optimized for AI image generation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {RESTAURANT_GALLERY.slice(0, 2).map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold">{item.title}</h4>
                      <button
                        onClick={() => copyPrompt(item.prompt, item.id)}
                        className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded"
                        type="button"
                      >
                        {copiedId === item.id ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>
                    <p className="text-sm text-stone-600 mb-2">{item.description}</p>
                    <label className="block text-sm bg-amber-600 text-white px-3 py-2 rounded cursor-pointer inline-flex items-center">
                      {uploading === item.id ? 'Uploading…' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, item.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RESTAURANT_GALLERY.slice(2).map((item) => {
              const itemData = gallery[item.id] || { image_url: null, placeholder_color: '' };
              const imageUrl = itemData.image_url;

              return (
                <div key={item.id} className="group relative rounded-2xl overflow-hidden">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={item.title} 
                      className="w-full h-64 md:h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className={`${itemData.placeholder_color} w-full h-64 md:h-80 flex items-center justify-center`}>
                      <div className="text-center">
                        <UtensilsCrossed className="h-12 w-12 text-stone-600 mx-auto mb-2" />
                        <p className="text-stone-600 font-medium">{item.title}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Admin controls overlay */}
                  {adminMode && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                      <h4 className="text-white font-bold mb-2">{item.title}</h4>
                      <p className="text-white/80 text-sm text-center mb-4">{item.description}</p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => copyPrompt(item.prompt, item.id)}
                          className="text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded"
                          type="button"
                        >
                          {copiedId === item.id ? 'Prompt Copied!' : 'Copy AI Prompt'}
                        </button>
                        <label className="text-sm bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded cursor-pointer text-center">
                          {uploading === item.id ? 'Uploading…' : 'Upload Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, item.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Title overlay for non-admin */}
                  {!adminMode && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <h4 className="text-white font-bold">{item.title}</h4>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reservations Section */}
      <section id="reservations" className="py-20 bg-stone-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-6">Reserve Your Table</h2>
              <p className="text-stone-300 mb-8">
                Experience culinary excellence in an intimate setting. We recommend booking in advance, 
                especially for weekend dining and special occasions.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 text-amber-400 mr-3" />
                  <div>
                    <h4 className="font-bold">Hours</h4>
                    {hours.map((hour, index) => (
                      <div key={index} className="text-stone-300">
                        {hour.day}: {hour.hours}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-6 w-6 text-amber-400 mr-3" />
                  <div>
                    <h4 className="font-bold">Reservations</h4>
                    <div className="text-stone-300">(555) 123-4567</div>
                    <div className="text-stone-300 text-sm">Call between 2 PM - 6 PM</div>
                  </div>
                </div>
              </div>

              {/* Testimonials */}
              <div className="space-y-4">
                <h4 className="text-xl font-bold">Diner Reviews</h4>
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-stone-800/50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-stone-300 mb-2">"{testimonial.comment}"</p>
                    <div className="font-medium">{testimonial.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reservation Form */}
            <div className="bg-stone-800 p-8 rounded-2xl">
              {reservationSubmitted ? (
                <div className="text-center py-12">
                  <Check className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Reservation Confirmed!</h3>
                  <p className="text-stone-300">
                    We've received your reservation request. Our team will contact you within 24 hours to confirm.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mb-6">Book Your Experience</h3>
                  <form onSubmit={handleReservationSubmit}>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={reservationForm.name}
                          onChange={handleReservationChange}
                          required
                          className="w-full bg-stone-700 border border-stone-600 rounded-lg px-4 py-3 text-white"
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={reservationForm.email}
                          onChange={handleReservationChange}
                          required
                          className="w-full bg-stone-700 border border-stone-600 rounded-lg px-4 py-3 text-white"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={reservationForm.phone}
                          onChange={handleReservationChange}
                          required
                          className="w-full bg-stone-700 border border-stone-600 rounded-lg px-4 py-3 text-white"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Date *</label>
                        <input
                          type="date"
                          name="date"
                          value={reservationForm.date}
                          onChange={handleReservationChange}
                          required
                          className="w-full bg-stone-700 border border-stone-600 rounded-lg px-4 py-3 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Time *</label>
                        <select
                          name="time"
                          value={reservationForm.time}
                          onChange={handleReservationChange}
                          required
                          className="w-full bg-stone-700 border border-stone-600 rounded-lg px-4 py-3 text-white"
                        >
                          <option value="17:00">5:00 PM</option>
                          <option value="17:30">5:30 PM</option>
                          <option value="18:00">6:00 PM</option>
                          <option value="18:30">6:30 PM</option>
                          <option value="19:00">7:00 PM</option>
                          <option value="19:30">7:30 PM</option>
                          <option value="20:00">8:00 PM</option>
                          <option value="20:30">8:30 PM</option>
                          <option value="21:00">9:00 PM</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Guests *</label>
                        <select
                          name="guests"
                          value={reservationForm.guests}
                          onChange={handleReservationChange}
                          required
                          className="w-full bg-stone-700 border border-stone-600 rounded-lg px-4 py-3 text-white"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">Special Occasion (Optional)</label>
                      <input
                        type="text"
                        name="occasion"
                        value={reservationForm.occasion}
                        onChange={handleReservationChange}
                        className="w-full bg-stone-700 border border-stone-600 rounded-lg px-4 py-3 text-white"
                        placeholder="Anniversary, Birthday, etc."
                      />
                    </div>
                    
                    <div className="mb-8">
                      <label className="block text-sm font-medium mb-2">Special Requests</label>
                      <textarea
                        name="specialRequests"
                        value={reservationForm.specialRequests}
                        onChange={handleReservationChange}
                        rows={3}
                        className="w-full bg-stone-700 border border-stone-600 rounded-lg px-4 py-3 text-white"
                        placeholder="Dietary restrictions, seating preferences..."
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-lg transition"
                    >
                      Complete Reservation
                    </button>
                    
                    <p className="text-stone-400 text-sm mt-4 text-center">
                      You'll receive a confirmation email within 24 hours
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Footer */}
      <footer id="contact" className="bg-stone-950 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <UtensilsCrossed className="h-8 w-8 text-amber-400" />
                <span className="text-2xl font-serif font-bold">Ristorante Siena</span>
              </div>
              <p className="text-stone-400 mb-4">
                Fine Italian dining where every meal tells a story of tradition, passion, and excellence.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-stone-400 hover:text-amber-400">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href="#" className="text-stone-400 hover:text-amber-400">
                  <Facebook className="h-6 w-6" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Visit Us</h4>
              <div className="space-y-3 text-stone-400">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-amber-400 mr-3 mt-0.5" />
                  <div>
                    <div>123 Via Roma</div>
                    <div>New York, NY 10013</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-amber-400 mr-3" />
                  <div>(555) 123-4567</div>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-amber-400 mr-3" />
                  <div>reservations@siena.com</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Private Events</h4>
              <p className="text-stone-400 mb-4">
                Our private dining room accommodates up to 24 guests for exclusive events, 
                corporate dinners, and celebrations.
              </p>
              <a href="#" className="text-amber-400 hover:text-amber-300 font-medium">
                Inquire about private events →
              </a>
            </div>
          </div>
          
          <div className="border-t border-stone-800 pt-8 text-center text-stone-500 text-sm">
            <p>© {new Date().getFullYear()} Ristorante Siena. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          <ChefHat className="h-4 w-4 mr-2" />
          Admin Mode Active
        </div>
      )}
    </div>
  );
}