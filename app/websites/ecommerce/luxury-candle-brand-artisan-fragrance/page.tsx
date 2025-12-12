'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, 
  Sparkles, 
  Truck, 
  Shield, 
  Star, 
  Heart, 
  ChevronRight,
  Menu,
  X,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Leaf,
  Moon,
  Sunset,
  Sunrise
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

const IMAGE_SLOTS = [
  { 
    id: 'hero-background', 
    title: 'Hero Background',
    description: 'Main banner image - should be atmospheric, moody lighting with candles',
    prompt: 'A luxury candle collection arranged artfully on a marble surface with soft, ambient lighting. Cinematic shot with shallow depth of field, warm golden hour light filtering through, elegant minimalism with natural elements like dried flowers or raw crystals. Moody, sophisticated aesthetic with rich textures and warm shadows. Professional product photography style.'
  },
  { 
    id: 'signature-collection', 
    title: 'Signature Collection',
    description: 'Featured product display',
    prompt: 'Three distinctive luxury candles of different heights and colors arranged on a weathered wooden table. One candle has visible dried botanicals embedded in wax, another shows hand-carved geometric patterns, third has smooth minimalist design. Natural morning light, shallow depth of field, lifestyle aesthetic with open notebook and coffee cup in background.'
  },
  { 
    id: 'process-image', 
    title: 'Artisan Process',
    description: 'Handcrafting demonstration',
    prompt: 'Close-up shot of artisan hands carefully pouring scented wax into a ceramic vessel. Artistic focus on the liquid wax stream, visible steam, elegant hand with minimal jewelry. Workshop setting with natural light, other raw materials visible in soft focus. Warm, intimate, authentic craftsmanship feel.'
  },
  { 
    id: 'materials-image', 
    title: 'Premium Materials',
    description: 'Raw ingredients display',
    prompt: 'Overhead flat lay arrangement of luxury candle-making materials: organic soy wax flakes, high-quality essential oil bottles, natural wooden wicks, dried lavender, cinnamon sticks, vanilla beans, and ceramic vessels. Clean, bright natural lighting, minimalist composition, textural contrast. Brand aesthetic with neutral palette.'
  },
  { 
    id: 'ambiance-1', 
    title: 'Candle Ambiance 1',
    description: 'Lifestyle scene with burning candle',
    prompt: 'Evening scene: a single burning luxury candle on a nightstand casting warm, flickering light across a curated space with art books, simple vase with single stem, soft bedding in background. Cozy, intimate, cinematic lighting with visible flame glow and subtle smoke trail. Relaxed luxury atmosphere.'
  },
  { 
    id: 'ambiance-2', 
    title: 'Candle Ambiance 2',
    description: 'Bathroom relaxation scene',
    prompt: 'Bathroom sanctuary scene with luxury candle burning beside bathtub. Soft candlelight reflecting in water, bath salts, minimalist ceramic containers, fresh eucalyptus hanging. Steam effect, warm golden tones, serene spa-like atmosphere. Photorealistic lifestyle photography.'
  },
  { 
    id: 'gift-box', 
    title: 'Gift Packaging',
    description: 'Unboxing experience',
    prompt: 'Luxury candle gift box being opened, showing layered unboxing experience: tissue paper, handwritten note, custom matches, ceramic vessel nestled in custom insert. Clean, bright studio lighting focusing on textures of paper, wax, ceramic. Elevated unboxing moment, brand attention to detail.'
  },
  { 
    id: 'storefront', 
    title: 'Studio Storefront',
    description: 'Physical location exterior',
    prompt: 'Charming boutique storefront at golden hour with warm light glowing through large windows. Clean minimalist sign, visible candle displays inside, potted olive trees flanking entrance. Cobblestone street, subtle motion blur of passerby. European-inspired architecture, inviting luxury retail aesthetic.'
  }
];

type ImageState = { [key: string]: { image_url: string | null } };

export default function LumièreCollectiveHomePage() {
  const [images, setImages] = useState<ImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(3);
  const [selectedCandle, setSelectedCandle] = useState(0);

  const candles = [
    { id: 1, name: "Midnight Noir", scent: "Sandalwood & Amber", price: "$68", burnTime: "65 hours" },
    { id: 2, name: "Golden Hour", scent: "Bergamot & Fig", price: "$62", burnTime: "60 hours" },
    { id: 3, name: "Coastal Mist", scent: "Sea Salt & Sage", price: "$65", burnTime: "62 hours" },
  ];

  const collections = [
    { name: "Signature", icon: <Star size={20} />, count: "8 scents" },
    { name: "Seasonal", icon: <Leaf size={20} />, count: "Limited edition" },
    { name: "Collaboration", icon: <Sparkles size={20} />, count: "Artist series" },
  ];

  const benefits = [
    { icon: <Leaf />, title: "100% Natural", desc: "Organic soy wax & essential oils" },
    { icon: <Shield />, title: "Clean Burning", desc: "Lead-free cotton wicks" },
    { icon: <Truck />, title: "Carbon Neutral", desc: "Shipping offset with every order" },
    { icon: <Heart />, title: "Hand-poured", desc: "Small batches in our Seattle studio" },
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
      const { data: dbImages, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        return;
      }

      const initialState: ImageState = {};
      IMAGE_SLOTS.forEach(slot => initialState[slot.id] = { image_url: null });

      if (dbImages) {
        const latestImagePerSlot: Record<string, string> = {};

        for (const img of dbImages) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const slotId = pathParts[2];
            if (IMAGE_SLOTS.some(s => s.id === slotId) && !latestImagePerSlot[slotId]) {
              latestImagePerSlot[slotId] = img.path;
            }
          }
        }

        IMAGE_SLOTS.forEach(slot => {
          if (latestImagePerSlot[slot.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerSlot[slot.id]).data.publicUrl;
            initialState[slot.id] = { image_url: url };
          }
        });
      }

      setImages(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(slotId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${slotId}/`;

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
      setImages(prev => ({ ...prev, [slotId]: { image_url: publicUrl } }));
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

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2C2C]">
      {/* Admin Overlay Controls */}
      {adminMode && (
        <div className="fixed top-4 right-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Sparkles size={16} />
          <span className="text-sm font-medium">Admin Mode Active</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E2D9]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="text-2xl font-serif tracking-wider">LUMIÈRE</div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#" className="hover:text-[#B8A27A] transition-colors">Collections</a>
                <a href="#" className="hover:text-[#B8A27A] transition-colors">Scents</a>
                <a href="#" className="hover:text-[#B8A27A] transition-colors">Gifting</a>
                <a href="#" className="hover:text-[#B8A27A] transition-colors">Our Story</a>
                <a href="#" className="hover:text-[#B8A27A] transition-colors">Journal</a>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <button className="hidden md:block hover:text-[#B8A27A]">Search</button>
              <button className="hidden md:block hover:text-[#B8A27A]">Account</button>
              <button className="relative hover:text-[#B8A27A]">
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#B8A27A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              <button 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <a href="#" className="block py-2">Collections</a>
              <a href="#" className="block py-2">Scents</a>
              <a href="#" className="block py-2">Gifting</a>
              <a href="#" className="block py-2">Our Story</a>
              <a href="#" className="block py-2">Journal</a>
              <div className="pt-4 border-t space-y-2">
                <button className="block w-full text-left py-2">Search</button>
                <button className="block w-full text-left py-2">Account</button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[90vh] overflow-hidden">
        {adminMode && (
          <div className="absolute top-4 left-4 z-30 bg-black/70 text-white p-3 rounded-lg max-w-xs">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-purple-300">{IMAGE_SLOTS[0].prompt}</p>
              <button
                onClick={() => copyPrompt(IMAGE_SLOTS[0].prompt, IMAGE_SLOTS[0].id)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded self-start"
                type="button"
              >
                {copiedId === IMAGE_SLOTS[0].id ? 'Copied!' : 'Copy Prompt'}
              </button>
              <label className="block text-xs bg-purple-600 text-white px-3 py-1 rounded cursor-pointer inline-block">
                {uploading === 'hero-background' ? 'Uploading…' : 'Upload Hero Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, 'hero-background')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {images['hero-background']?.image_url ? (
          <img 
            src={images['hero-background'].image_url} 
            alt="Luxury candle collection"
            className="w-full h-full object-cover transition-opacity duration-1000"
            onLoad={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            style={{ opacity: 0 }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E8E2D9] to-[#D4C9B8] flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-serif mb-4">LUMIÈRE</div>
              <div className="text-xl text-[#6B6B6B]">Artisan Candles • Seattle</div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="container mx-auto">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6">
                <Sparkles size={16} />
                <span className="text-sm">New Seasonal Collection</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight">
                The Art of<br />Atmosphere
              </h1>
              <p className="text-xl text-white/90 mb-8 max-w-lg">
                Hand-poured luxury candles crafted from organic soy wax and premium essential oils. 
                Each vessel tells a story of light, scent, and slow moments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-[#2C2C2C] px-8 py-4 rounded-full font-medium hover:bg-[#FAF7F2] transition-colors flex items-center justify-center gap-2">
                  Explore Collections <ChevronRight size={20} />
                </button>
                <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-colors">
                  Book a Private Scent Consultation
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif mb-4">Curated Collections</h2>
            <p className="text-[#6B6B6B] max-w-2xl mx-auto">
              Discover our thoughtfully designed ranges, each telling a unique story through scent and craftsmanship.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {collections.map((collection, index) => (
              <div key={index} className="text-center p-8 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#B8A27A] transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAF7F2] mb-4 text-[#B8A27A]">
                  {collection.icon}
                </div>
                <h3 className="text-xl font-medium mb-2">{collection.name}</h3>
                <p className="text-[#6B6B6B]">{collection.count}</p>
              </div>
            ))}
          </div>

          {/* Featured Products */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-serif">Signature Scents</h3>
              <button className="text-[#B8A27A] hover:underline flex items-center gap-2">
                View All <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {candles.map((candle, index) => (
                <div 
                  key={candle.id}
                  className={`cursor-pointer transition-transform duration-300 ${selectedCandle === index ? 'scale-[1.02]' : ''}`}
                  onClick={() => setSelectedCandle(index)}
                  onMouseEnter={() => setSelectedCandle(index)}
                >
                  <div className="relative overflow-hidden rounded-2xl mb-4 bg-gradient-to-br from-[#E8E2D9] to-[#D4C9B8] h-96">
                    {adminMode && images['signature-collection']?.image_url && (
                      <div className="absolute top-4 right-4 z-20">
                        <label className="block text-xs bg-black/70 text-white px-3 py-1 rounded cursor-pointer">
                          {uploading === 'signature-collection' ? 'Uploading…' : 'Replace'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, 'signature-collection')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                    {images['signature-collection']?.image_url ? (
                      <img 
                        src={images['signature-collection'].image_url} 
                        alt={candle.name}
                        className="w-full h-full object-cover transition-opacity duration-1000"
                        onLoad={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        style={{ opacity: 0 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-serif mb-2">{candle.name}</div>
                          <div className="text-[#6B6B6B]">{candle.scent}</div>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                      <div className="text-white">
                        <div className="text-2xl font-serif mb-1">{candle.name}</div>
                        <div className="text-white/80">{candle.scent}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{candle.name}</div>
                      <div className="text-[#6B6B6B] text-sm">{candle.scent}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-xl">{candle.price}</div>
                      <div className="text-[#6B6B6B] text-sm">{candle.burnTime}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {adminMode && (
            <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-purple-700 font-medium">
                  <Sparkles size={16} />
                  Admin: Image Prompt for Signature Collection
                </div>
                <p className="text-sm text-purple-600">{IMAGE_SLOTS[1].prompt}</p>
                <button
                  onClick={() => copyPrompt(IMAGE_SLOTS[1].prompt, IMAGE_SLOTS[1].id)}
                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded self-start"
                  type="button"
                >
                  {copiedId === IMAGE_SLOTS[1].id ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Craftsmanship Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              {adminMode && (
                <div className="absolute top-4 left-4 z-10">
                  <label className="block text-xs bg-black/70 text-white px-3 py-1 rounded cursor-pointer">
                    {uploading === 'process-image' ? 'Uploading…' : 'Upload Process Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, 'process-image')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
              <div className="rounded-2xl overflow-hidden h-[500px] bg-gradient-to-br from-[#E8E2D9] to-[#D4C9B8]">
                {images['process-image']?.image_url ? (
                  <img 
                    src={images['process-image'].image_url} 
                    alt="Artisan process"
                    className="w-full h-full object-cover transition-opacity duration-1000"
                    onLoad={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    style={{ opacity: 0 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Sunrise size={48} className="mx-auto mb-4 text-[#B8A27A]" />
                      <div className="text-2xl font-serif mb-2">Hand-poured in Seattle</div>
                      <div className="text-[#6B6B6B]">Artisan craftsmanship</div>
                    </div>
                  </div>
                )}
              </div>
              {adminMode && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 mb-2">{IMAGE_SLOTS[2].prompt}</p>
                  <button
                    onClick={() => copyPrompt(IMAGE_SLOTS[2].prompt, IMAGE_SLOTS[2].id)}
                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded"
                    type="button"
                  >
                    {copiedId === IMAGE_SLOTS[2].id ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-[#B8A27A] mb-4">
                <Sparkles size={16} />
                <span className="text-sm font-medium">Our Craft</span>
              </div>
              <h2 className="text-4xl font-serif mb-6">The Artisan Difference</h2>
              <p className="text-[#6B6B6B] mb-8 leading-relaxed">
                Each LUMIÈRE candle begins as raw, organic soy wax and premium essential oils. 
                Our master chandlers hand-pour every vessel in small batches, ensuring consistent 
                quality and optimal scent throw. The process takes 48 hours from pour to cure.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="text-[#B8A27A] mt-1">{benefit.icon}</div>
                    <div>
                      <div className="font-medium mb-1">{benefit.title}</div>
                      <div className="text-sm text-[#6B6B6B]">{benefit.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="text-[#B8A27A] hover:underline flex items-center gap-2 font-medium">
                Visit Our Studio <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Materials Gallery */}
      <section className="py-20 bg-[#FAF7F2]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif mb-4">Premium Ingredients</h2>
            <p className="text-[#6B6B6B] max-w-2xl mx-auto">
              We source only the finest materials, prioritizing sustainability and quality 
              without compromise.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative">
              {adminMode && (
                <div className="absolute top-4 left-4 z-10">
                  <label className="block text-xs bg-black/70 text-white px-3 py-1 rounded cursor-pointer">
                    {uploading === 'materials-image' ? 'Uploading…' : 'Upload Materials'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, 'materials-image')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
              <div className="rounded-2xl overflow-hidden h-[400px] bg-gradient-to-br from-[#E8E2D9] to-[#D4C9B8]">
                {images['materials-image']?.image_url ? (
                  <img 
                    src={images['materials-image'].image_url} 
                    alt="Premium materials"
                    className="w-full h-full object-cover transition-opacity duration-1000"
                    onLoad={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    style={{ opacity: 0 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Leaf size={48} className="mx-auto mb-4 text-[#B8A27A]" />
                      <div className="text-2xl font-serif mb-2">Natural Ingredients</div>
                    </div>
                  </div>
                )}
              </div>
              {adminMode && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 mb-2">{IMAGE_SLOTS[3].prompt}</p>
                  <button
                    onClick={() => copyPrompt(IMAGE_SLOTS[3].prompt, IMAGE_SLOTS[3].id)}
                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded"
                    type="button"
                  >
                    {copiedId === IMAGE_SLOTS[3].id ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#B8A27A]">
                    <Leaf size={20} />
                  </div>
                  <div>
                    <div className="font-medium">Organic Soy Wax</div>
                    <div className="text-sm text-[#6B6B6B]">Renewable, clean-burning</div>
                  </div>
                </div>
                <p className="text-[#6B6B6B]">
                  Sourced from American farms, our soy wax is GMO-free and burns cleaner 
                  than paraffin, with no toxins or soot.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#B8A27A]">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="font-medium">Essential Oil Blends</div>
                    <div className="text-sm text-[#6B6B6B]">Therapeutic grade</div>
                  </div>
                </div>
                <p className="text-[#6B6B6B]">
                  Each scent is carefully blended by our perfumers using 100% pure essential 
                  oils, never synthetic fragrances.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#B8A27A]">
                    <Shield size={20} />
                  </div>
                  <div>
                    <div className="font-medium">Eco Packaging</div>
                    <div className="text-sm text-[#6B6B6B]">100% Recyclable</div>
                  </div>
                </div>
                <p className="text-[#6B6B6B]">
                  From FSC-certified paper to compostable fills, every element is chosen 
                  with environmental impact in mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ambiance Gallery */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-serif mb-2">Create Your Sanctuary</h2>
              <p className="text-[#6B6B6B]">Moments of calm, curated by light</p>
            </div>
            <button className="text-[#B8A27A] hover:underline flex items-center gap-2">
              #LumiereMoments <Instagram size={16} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative">
              {adminMode && (
                <div className="absolute top-4 left-4 z-10">
                  <label className="block text-xs bg-black/70 text-white px-3 py-1 rounded cursor-pointer">
                    {uploading === 'ambiance-1' ? 'Uploading…' : 'Upload Scene'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, 'ambiance-1')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
              <div className="rounded-2xl overflow-hidden h-[500px] bg-gradient-to-br from-[#E8E2D9] to-[#D4C9B8]">
                {images['ambiance-1']?.image_url ? (
                  <img 
                    src={images['ambiance-1'].image_url} 
                    alt="Evening ambiance"
                    className="w-full h-full object-cover transition-opacity duration-1000"
                    onLoad={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    style={{ opacity: 0 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Moon size={48} className="mx-auto mb-4 text-[#B8A27A]" />
                      <div className="text-2xl font-serif mb-2">Evening Rituals</div>
                    </div>
                  </div>
                )}
              </div>
              {adminMode && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 mb-2">{IMAGE_SLOTS[4].prompt}</p>
                  <button
                    onClick={() => copyPrompt(IMAGE_SLOTS[4].prompt, IMAGE_SLOTS[4].id)}
                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded"
                    type="button"
                  >
                    {copiedId === IMAGE_SLOTS[4].id ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              {adminMode && (
                <div className="absolute top-4 left-4 z-10">
                  <label className="block text-xs bg-black/70 text-white px-3 py-1 rounded cursor-pointer">
                    {uploading === 'ambiance-2' ? 'Uploading…' : 'Upload Scene'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, 'ambiance-2')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
              <div className="rounded-2xl overflow-hidden h-[500px] bg-gradient-to-br from-[#E8E2D9] to-[#D4C9B8]">
                {images['ambiance-2']?.image_url ? (
                  <img 
                    src={images['ambiance-2'].image_url} 
                    alt="Bathroom sanctuary"
                    className="w-full h-full object-cover transition-opacity duration-1000"
                    onLoad={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    style={{ opacity: 0 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Sunset size={48} className="mx-auto mb-4 text-[#B8A27A]" />
                      <div className="text-2xl font-serif mb-2">Spa Sanctuary</div>
                    </div>
                  </div>
                )}
              </div>
              {adminMode && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 mb-2">{IMAGE_SLOTS[5].prompt}</p>
                  <button
                    onClick={() => copyPrompt(IMAGE_SLOTS[5].prompt, IMAGE_SLOTS[5].id)}
                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded"
                    type="button"
                  >
                    {copiedId === IMAGE_SLOTS[5].id ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-[#B8A27A] mb-4">
              <Sparkles size={16} />
              <span className="text-sm font-medium">Join Our Community</span>
            </div>
            <h2 className="text-4xl font-serif mb-6">Light the Way Together</h2>
            <p className="text-[#6B6B6B] mb-8">
              Receive early access to new collections, exclusive offers, and seasonal scent guides. 
              Plus, get 15% off your first order.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Your email address"
                className="flex-1 px-6 py-4 rounded-full border border-[#E8E2D9] focus:outline-none focus:border-[#B8A27A]"
              />
              <button 
                type="submit"
                className="bg-[#2C2C2C] text-white px-8 py-4 rounded-full font-medium hover:bg-[#1A1A1A] transition-colors"
              >
                Subscribe
              </button>
            </form>
            
            <p className="text-sm text-[#6B6B6B] mt-4">
              By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C2C2C] text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="text-2xl font-serif mb-4">LUMIÈRE</div>
              <p className="text-white/70 text-sm mb-6">
                Artisan candles crafted with intention in Seattle, Washington.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-white/70 hover:text-white"><Instagram size={20} /></a>
                <a href="#" className="text-white/70 hover:text-white"><Facebook size={20} /></a>
                <a href="#" className="text-white/70 hover:text-white"><Twitter size={20} /></a>
              </div>
            </div>

            <div>
              <div className="font-medium mb-4">Shop</div>
              <div className="space-y-2 text-sm text-white/70">
                <a href="#" className="block hover:text-white">All Candles</a>
                <a href="#" className="block hover:text-white">Collections</a>
                <a href="#" className="block hover:text-white">Best Sellers</a>
                <a href="#" className="block hover:text-white">Gift Sets</a>
                <a href="#" className="block hover:text-white">Accessories</a>
              </div>
            </div>

            <div>
              <div className="font-medium mb-4">Company</div>
              <div className="space-y-2 text-sm text-white/70">
                <a href="#" className="block hover:text-white">Our Story</a>
                <a href="#" className="block hover:text-white">Sustainability</a>
                <a href="#" className="block hover:text-white">Wholesale</a>
                <a href="#" className="block hover:text-white">Careers</a>
                <a href="#" className="block hover:text-white">Press</a>
              </div>
            </div>

            <div>
              <div className="font-medium mb-4">Contact</div>
              <div className="space-y-3 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>1423 Artisan Way, Seattle, WA 98101</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>(206) 555-7890</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>hello@lumiere.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-white/50">
                © 2024 LUMIÈRE Collective. All rights reserved.
              </div>
              <div className="flex gap-6 text-sm text-white/50">
                <a href="#" className="hover:text-white">Privacy Policy</a>
                <a href="#" className="hover:text-white">Terms of Service</a>
                <a href="#" className="hover:text-white">Accessibility</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Quick Shop Floating Button */}
      <button className="fixed bottom-8 right-8 bg-[#2C2C2C] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[#1A1A1A] transition-colors z-30">
        <ShoppingBag size={24} />
      </button>

      {/* Admin Panel */}
      {adminMode && (
        <div className="fixed bottom-4 left-4 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 max-w-sm">
          <div className="flex items-center gap-2 text-purple-700 font-medium mb-4">
            <Sparkles size={16} />
            <span>Admin Image Control Panel</span>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {IMAGE_SLOTS.slice(6).map((slot) => (
              <div key={slot.id} className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm text-purple-800">{slot.title}</div>
                    <div className="text-xs text-purple-600">{slot.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyPrompt(slot.prompt, slot.id)}
                      className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded"
                      type="button"
                    >
                      {copiedId === slot.id ? 'Copied!' : 'Copy'}
                    </button>
                    <label className="text-xs bg-purple-600 text-white px-2 py-1 rounded cursor-pointer">
                      {uploading === slot.id ? '...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, slot.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                {images[slot.id]?.image_url && (
                  <div className="text-xs text-green-700 mt-1">
                    ✓ Image uploaded
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
            Upload images will replace existing ones for each slot. Images load instantly for visitors.
          </div>
        </div>
      )}
    </div>
  );
}