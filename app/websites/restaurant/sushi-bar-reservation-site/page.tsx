'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { Menu, MapPin, Phone, Clock, ChevronRight, Star, Users, Calendar, CheckCircle, Instagram, Facebook } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'sakura-zen';

// Define image slots for the sushi bar website
const IMAGE_SLOTS = [
  { 
    id: 'hero-bg', 
    title: 'Hero Background',
    prompt: 'An elegant, intimate sushi bar interior at night with soft lighting, dark wood counters, and traditional Japanese decor. Focus on warm, inviting atmosphere with chefs preparing sushi behind the counter. Cinematic, moody lighting with bokeh effects.'
  },
  { 
    id: 'chef-portrait', 
    title: 'Master Chef Portrait',
    prompt: 'A distinguished Japanese master chef in traditional attire, carefully preparing nigiri sushi. Professional portrait with shallow depth of field, focusing on the chef\'s skilled hands and concentrated expression. Studio lighting, high-end restaurant ambiance.'
  },
  { 
    id: 'signature-roll', 
    title: 'Signature Roll Display',
    prompt: 'An artistic overhead shot of our signature Dragon Roll on a black ceramic plate. Vibrant colors of fresh salmon, avocado, cucumber, and eel with decorative sauces and microgreens. Food photography with professional lighting that makes the sushi look fresh and delicious.'
  },
  { 
    id: 'omakase-set', 
    title: 'Omakase Set Presentation',
    prompt: 'A beautiful presentation of a 12-piece omakase sushi set on a traditional wooden board. Various nigiri and sashimi pieces arranged artistically with wasabi, ginger, and soy sauce. Focus on texture, freshness, and Japanese aesthetic minimalism.'
  },
  { 
    id: 'interior-1', 
    title: 'Dining Area Interior',
    prompt: 'The main dining area of Sakura Zen during dinner service. Warm ambient lighting, minimalist Japanese decor with bamboo accents, comfortable seating at dark wood tables. Shows a couple enjoying their meal in an elegant, intimate setting.'
  },
  { 
    id: 'interior-2', 
    title: 'Sushi Counter',
    prompt: 'The sushi counter where guests can watch chefs prepare their meals. Focus on the fresh ingredients display, chef\'s knives, and traditional tools. Should convey craftsmanship, authenticity, and the theater of sushi preparation.'
  },
  { 
    id: 'sake-collection', 
    title: 'Premium Sake Collection',
    prompt: 'A curated selection of premium sake bottles displayed in a backlit cabinet. Various shapes and sizes of sake bottles with elegant labels, some with traditional ceramic tokkuri. Warm lighting that highlights the amber hues of the sake.'
  },
  { 
    id: 'dessert', 
    title: 'Japanese Dessert',
    prompt: 'A traditional Japanese dessert plate featuring matcha tiramisu, black sesame panna cotta, and fresh seasonal fruits. Elegant presentation on ceramic dishware with gold leaf accents and decorative elements.'
  },
];

type ImageState = { [key: string]: { image_url: string | null; loading: boolean } };

// Menu items data
const MENU_CATEGORIES = [
  {
    title: 'Nigiri & Sashimi',
    items: [
      { name: 'Bluefin Tuna (Otoro)', description: 'Premium fatty tuna belly', price: 18, popular: true },
      { name: 'Salmon (Sake)', description: 'Wild Norwegian salmon', price: 8 },
      { name: 'Yellowtail (Hamachi)', description: 'Japanese amberjack', price: 9 },
      { name: 'Sea Urchin (Uni)', description: 'Santa Barbara uni, seasonal', price: 22, popular: true },
      { name: 'Sweet Shrimp (Amaebi)', description: 'Live sweet shrimp', price: 12 },
    ]
  },
  {
    title: 'Signature Rolls',
    items: [
      { name: 'Dragon Roll', description: 'Eel, cucumber, avocado, eel sauce', price: 16, popular: true },
      { name: 'Sakura Zen Roll', description: 'Spicy tuna, salmon, yellowtail, truffle oil', price: 19 },
      { name: 'Volcano Roll', description: 'Baked scallop, crab, spicy mayo', price: 17 },
      { name: 'Rainbow Roll', description: 'California roll with assorted sashimi', price: 15 },
    ]
  },
  {
    title: 'Omakase Experience',
    items: [
      { name: 'Kiku (7-course)', description: 'Chef\'s selection of 7 courses', price: 85 },
      { name: 'Sakura (10-course)', description: 'Premium 10-course experience', price: 125, popular: true },
      { name: 'Zen (15-course)', description: 'Ultimate 15-course omakase', price: 195 },
    ]
  },
];

export default function SushiBarReservationSite() {
  const [images, setImages] = useState<ImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reservationData, setReservationData] = useState({
    date: '',
    time: '19:00',
    guests: 2,
    name: '',
    email: '',
    phone: '',
    occasion: '',
    specialRequests: ''
  });
  const [reservationSubmitted, setReservationSubmitted] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState(0);

  // Load user session and images
  useEffect(() => {
    const initializePage = async () => {
      // Check user session
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);

      // Set initial image state
      const initialState: ImageState = {};
      IMAGE_SLOTS.forEach(slot => {
        initialState[slot.id] = { image_url: null, loading: true };
      });
      setImages(initialState);

      // Load images from Supabase
      await loadImages();
    };
    
    initializePage();
  }, []);

  const loadImages = async () => {
    // Fetch images for this specific site
    const { data: siteImages, error } = await supabase
      .from('images')
      .select('path, created_at')
      .eq('user_id', ADMIN_USER_ID)
      .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading images:', error);
      return;
    }

    const updatedImages = { ...images };
    
    if (siteImages) {
      const latestImagePerSlot: Record<string, string> = {};

      // Group images by slot ID
      for (const img of siteImages) {
        const pathParts = img.path.split('/');
        if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
          const slotId = pathParts[2];
          if (IMAGE_SLOTS.some(s => s.id === slotId) && !latestImagePerSlot[slotId]) {
            latestImagePerSlot[slotId] = img.path;
          }
        }
      }

      // Update image URLs
      IMAGE_SLOTS.forEach(slot => {
        if (latestImagePerSlot[slot.id]) {
          const url = supabase.storage
            .from('user_images')
            .getPublicUrl(latestImagePerSlot[slot.id]).data.publicUrl;
          updatedImages[slot.id] = { image_url: url, loading: false };
        } else {
          updatedImages[slot.id] = { image_url: null, loading: false };
        }
      });
    } else {
      // No images found, mark all as loaded
      IMAGE_SLOTS.forEach(slot => {
        updatedImages[slot.id] = { image_url: null, loading: false };
      });
    }

    setImages(updatedImages);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(slotId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${slotId}/`;

      // Clean up old images for this slot
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

      // Update image state
      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setImages(prev => ({ 
        ...prev, 
        [slotId]: { image_url: publicUrl, loading: false } 
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, slotId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(slotId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send data to your backend
    console.log('Reservation submitted:', reservationData);
    setReservationSubmitted(true);
    setTimeout(() => setReservationSubmitted(false), 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReservationData(prev => ({
      ...prev,
      [name]: name === 'guests' ? parseInt(value) : value
    }));
  };

  // Hero section with background image
  const HeroSection = () => (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        {images['hero-bg']?.image_url ? (
          <Image
            src={images['hero-bg'].image_url}
            alt="Sakura Zen Sushi Bar interior"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
        )}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Admin upload button for hero */}
      {adminMode && !images['hero-bg']?.image_url && (
        <div className="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur-sm rounded-lg p-4 max-w-sm">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Hero Background Image</p>
              <p className="text-xs text-gray-600 mt-1">Upload a stunning restaurant interior photo</p>
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-xs text-purple-700">{IMAGE_SLOTS.find(s => s.id === 'hero-bg')?.prompt}</p>
                <button
                  onClick={() => copyPrompt(IMAGE_SLOTS.find(s => s.id === 'hero-bg')?.prompt || '', 'hero-bg')}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded self-start"
                  type="button"
                >
                  {copiedId === 'hero-bg' ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>
              <label className="block text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded cursor-pointer inline-block mt-3">
                {uploading === 'hero-bg' ? 'Uploading…' : 'Upload Hero Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, 'hero-bg')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Hero content */}
      <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
          <Star className="w-4 h-4" />
          <span className="text-sm">Michelin Guide Recommended</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Sakura Zen
          <span className="block text-2xl md:text-3xl font-light mt-3 tracking-wider">SUSHI & OMAKASE</span>
        </h1>
        
        <p className="text-xl md:text-2xl font-light mb-8 max-w-2xl mx-auto leading-relaxed">
          An intimate culinary journey through Edomae sushi traditions, 
          where every piece tells a story of craftsmanship and seasonality.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Tue-Sun: 5PM-11PM</p>
                <p className="text-sm opacity-90">Last seating at 9:30PM</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">123 Ginza Street</p>
                <p className="text-sm opacity-90">Seattle, WA 98101</p>
              </div>
            </div>
          </div>
        </div>
        
        <a 
          href="#reservation" 
          className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold text-lg px-8 py-4 rounded-full mt-10 transition-all hover:scale-105 shadow-xl"
        >
          Reserve Your Experience
          <ChevronRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  );

  // About section
  const AboutSection = () => (
    <section className="py-20 px-4 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            The Art of <span className="text-amber-600">Edomae</span>
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            For over two decades, Master Chef Hiroshi Yamamoto has curated an unparalleled 
            omakase experience at Sakura Zen. Trained in Tokyo's most revered sushi temples, 
            Chef Hiroshi brings authentic Edomae techniques to the Pacific Northwest.
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Our fish arrives daily from Tokyo's Tsukiji Market and local sustainable sources, 
            prepared with traditional methods that enhance natural flavors. Each course is a 
            dialogue between chef and guest, crafted in the moment based on the day's finest offerings.
          </p>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-amber-600 font-bold text-2xl mb-1">24</div>
              <div className="text-gray-700">Years of Excellence</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-amber-600 font-bold text-2xl mb-1">10</div>
              <div className="text-gray-700">Counter Seats Only</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-amber-600 font-bold text-2xl mb-1">100%</div>
              <div className="text-gray-700">Sustainable Sourcing</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-amber-600 font-bold text-2xl mb-1">72</div>
              <div className="text-gray-700">Sake Selections</div>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            {images['chef-portrait']?.image_url ? (
              <Image
                src={images['chef-portrait'].image_url}
                alt="Master Chef Hiroshi Yamamoto"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-gray-400 mb-2">Chef Portrait</div>
                  {adminMode && (
                    <div className="space-y-2">
                      <button
                        onClick={() => copyPrompt(IMAGE_SLOTS.find(s => s.id === 'chef-portrait')?.prompt || '', 'chef-portrait')}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                        type="button"
                      >
                        {copiedId === 'chef-portrait' ? 'Copied!' : 'Copy Prompt'}
                      </button>
                      <label className="block text-xs bg-purple-600 text-white px-3 py-1 rounded cursor-pointer">
                        {uploading === 'chef-portrait' ? 'Uploading…' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, 'chef-portrait')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl max-w-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-bold">Hiroshi Yamamoto</div>
                <div className="text-sm text-gray-600">Master Sushi Chef</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 italic">
              "True sushi is not just food—it's a moment of connection between ocean, artisan, and guest."
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  // Menu section
  const MenuSection = () => (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Signature Experiences</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Each dish reflects our commitment to seasonality, sustainability, and 
            traditional techniques perfected over generations.
          </p>
        </div>

        {/* Menu category tabs */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {MENU_CATEGORIES.map((category, index) => (
            <button
              key={index}
              onClick={() => setActiveMenuCategory(index)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${activeMenuCategory === index ? 'bg-amber-500 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              {category.title}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Menu items */}
          <div>
            {MENU_CATEGORIES[activeMenuCategory].items.map((item, index) => (
              <div key={index} className="mb-8 last:mb-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                      {item.popular && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{item.description}</p>
                  </div>
                  <div className="text-xl font-bold text-amber-600">${item.price}</div>
                </div>
                <div className="h-px bg-gray-200 mt-4"></div>
              </div>
            ))}
          </div>

          {/* Food images */}
          <div className="space-y-6">
            {['signature-roll', 'omakase-set', 'dessert'].map((imageId) => (
              <div key={imageId} className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                {images[imageId]?.image_url ? (
                  <Image
                    src={images[imageId].image_url!}
                    alt={IMAGE_SLOTS.find(s => s.id === imageId)?.title || ''}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center p-4">
                    <div className="text-gray-400 mb-2">
                      {IMAGE_SLOTS.find(s => s.id === imageId)?.title}
                    </div>
                    {adminMode && (
                      <div className="space-y-2 text-center">
                        <button
                          onClick={() => copyPrompt(IMAGE_SLOTS.find(s => s.id === imageId)?.prompt || '', imageId)}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded block mx-auto"
                          type="button"
                        >
                          {copiedId === imageId ? 'Copied!' : 'Copy Prompt'}
                        </button>
                        <label className="block text-xs bg-purple-600 text-white px-3 py-1 rounded cursor-pointer mx-auto w-fit">
                          {uploading === imageId ? 'Uploading…' : 'Upload Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, imageId)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  // Gallery section
  const GallerySection = () => (
    <section className="py-20 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 text-gray-900">Our Ambiance</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Experience the tranquility of our intimate 10-seat counter, where every detail 
          is curated to enhance your culinary journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['interior-1', 'interior-2', 'sake-collection'].map((imageId) => (
          <div key={imageId} className="relative aspect-square rounded-2xl overflow-hidden group">
            {images[imageId]?.image_url ? (
              <>
                <Image
                  src={images[imageId].image_url!}
                  alt={IMAGE_SLOTS.find(s => s.id === imageId)?.title || ''}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center p-4">
                <div className="text-gray-400 mb-2">
                  {IMAGE_SLOTS.find(s => s.id === imageId)?.title}
                </div>
                {adminMode && (
                  <div className="space-y-2 text-center">
                    <button
                      onClick={() => copyPrompt(IMAGE_SLOTS.find(s => s.id === imageId)?.prompt || '', imageId)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded block mx-auto"
                      type="button"
                    >
                      {copiedId === imageId ? 'Copied!' : 'Copy Prompt'}
                    </button>
                    <label className="block text-xs bg-purple-600 text-white px-3 py-1 rounded cursor-pointer mx-auto w-fit">
                      {uploading === imageId ? 'Uploading…' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, imageId)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  // Reservation section
  const ReservationSection = () => (
    <section id="reservation" className="py-20 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Reserve Your Seat</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            With only 10 counter seats available per service, reservations are essential 
            for our intimate omakase experience. Bookings open 30 days in advance.
          </p>
        </div>

        {reservationSubmitted ? (
          <div className="bg-green-900/30 border border-green-600 rounded-2xl p-12 text-center max-w-md mx-auto">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-4">Reservation Confirmed!</h3>
            <p className="text-gray-300 mb-6">
              Thank you for choosing Sakura Zen. We've sent a confirmation to {reservationData.email}. 
              Please arrive 15 minutes before your reservation.
            </p>
            <button
              onClick={() => setReservationSubmitted(false)}
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              Make another reservation
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-12">
            <form onSubmit={handleReservationSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={reservationData.date}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time *</label>
                  <select
                    name="time"
                    required
                    value={reservationData.time}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Number of Guests *</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReservationData(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold">{reservationData.guests}</div>
                    <div className="text-sm text-gray-400">
                      {reservationData.guests === 1 ? 'Guest' : 'Guests'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReservationData(prev => ({ ...prev, guests: Math.min(10, prev.guests + 1) }))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={reservationData.name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Your name"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={reservationData.email}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={reservationData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Special Occasion</label>
                <select
                  name="occasion"
                  value={reservationData.occasion}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">No special occasion</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="birthday">Birthday</option>
                  <option value="engagement">Engagement</option>
                  <option value="business">Business Dinner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Special Requests</label>
                <textarea
                  name="specialRequests"
                  value={reservationData.specialRequests}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  placeholder="Dietary restrictions, allergies, or special requests..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-4 rounded-lg transition-all hover:scale-[1.02]"
              >
                Complete Reservation
              </button>

              <p className="text-sm text-gray-400 text-center">
                * A credit card is required to secure your reservation. 
                48-hour cancellation policy applies.
              </p>
            </form>

            <div className="space-y-8">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4">Experience Details</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Duration</div>
                      <div className="text-gray-300">90-120 minutes per seating</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Private Events</div>
                      <div className="text-gray-300">Full restaurant buyouts available</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Booking Window</div>
                      <div className="text-gray-300">30 days in advance</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium">Address</div>
                    <div className="text-gray-300">123 Ginza Street, Seattle, WA 98101</div>
                  </div>
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-gray-300">(206) 555-1234</div>
                  </div>
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-gray-300">reservations@sakurazen.com</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  // Footer
  const Footer = () => (
    <footer className="bg-gray-950 text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="text-2xl font-bold mb-4">Sakura Zen</div>
            <p className="text-gray-400">
              An intimate omakase experience honoring traditional Edomae sushi techniques with Pacific Northwest ingredients.
            </p>
          </div>
          
          <div>
            <div className="font-bold mb-4">Hours</div>
            <div className="space-y-2 text-gray-400">
              <div>Tuesday - Sunday: 5PM - 11PM</div>
              <div>Monday: Closed</div>
              <div>Last seating at 9:30PM</div>
            </div>
          </div>
          
          <div>
            <div className="font-bold mb-4">Location</div>
            <div className="space-y-2 text-gray-400">
              <div>123 Ginza Street</div>
              <div>Seattle, WA 98101</div>
              <div>Pioneer Square Historic District</div>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Sakura Zen Sushi & Omakase. All rights reserved.</p>
          <p className="mt-2">Designed for an exceptional dining experience</p>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600">Loading Sakura Zen...</div>
          </div>
        </div>
      }>
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="text-2xl font-bold text-gray-900">Sakura Zen</div>
                <nav className="hidden md:flex items-center gap-6">
                  <a href="#about" className="text-gray-700 hover:text-amber-600 font-medium">About</a>
                  <a href="#menu" className="text-gray-700 hover:text-amber-600 font-medium">Menu</a>
                  <a href="#gallery" className="text-gray-700 hover:text-amber-600 font-medium">Gallery</a>
                  <a href="#reservation" className="text-gray-700 hover:text-amber-600 font-medium">Reservations</a>
                </nav>
              </div>
              
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-gray-600" />
                <div className="hidden md:block">
                  <div className="text-sm text-gray-600">Reservations</div>
                  <div className="font-bold text-gray-900">(206) 555-1234</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <HeroSection />
          <AboutSection />
          <MenuSection />
          <GallerySection />
          <ReservationSection />
        </main>

        <Footer />

        {/* Admin Panel */}
        {adminMode && (
          <div className="fixed bottom-6 right-6 z-50 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 max-w-xs border border-gray-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="font-medium text-gray-900">Admin Mode Active</div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Upload professional images for each section. Click "Copy Prompt" for AI image generation guidance.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {IMAGE_SLOTS.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                  <div className="truncate">{slot.title}</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyPrompt(slot.prompt, slot.id)}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                      type="button"
                    >
                      {copiedId === slot.id ? '✓' : 'Prompt'}
                    </button>
                    <label className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded cursor-pointer">
                      {uploading === slot.id ? '↑' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, slot.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Suspense>
    </div>
  );
}