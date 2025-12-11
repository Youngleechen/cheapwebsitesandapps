// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';

const ARTWORKS = [
  { 
    id: 'hero-banner', 
    title: 'Hero Banner',
    prompt: 'A vibrant, inviting hero banner for "Boulder Bark & Co.", a local dog walking and pet care service in Boulder, Colorado. Show a joyful golden retriever running through a sunlit mountain trail with a smiling owner nearby. Clean, modern typography space at top-left for logo and tagline. Warm, earthy colors with pops of sky blue.'
  },
  { 
    id: 'services-mosaic', 
    title: 'Services Mosaic',
    prompt: 'A clean 3-panel mosaic showing pet care services: top-left—grooming with a fluffy dog in a bathtub; top-right—dog walking on a leafy suburban street; bottom-center—pet sitting with a cozy living room and relaxed cat. Soft shadows, consistent lighting, neutral background to keep focus on pets. Professional yet friendly mood.'
  },
  { 
    id: 'testimonial-bg', 
    title: 'Testimonial Background',
    prompt: 'A soft-focus background image for customer testimonials: blurred backyard with string lights at golden hour, shallow depth of field, warm bokeh. Should feel personal, trustworthy, and community-oriented—ideal for overlaying quote text. No people or animals in frame, just ambiance.'
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };

export default function HomePage() {
  const [artworks, setArtworks] = useState<ArtworkState>({});
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
      const { data: images } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID);

      const initialState: ArtworkState = {};
      ARTWORKS.forEach(art => initialState[art.id] = { image_url: null });

      if (images) {
        ARTWORKS.forEach(art => {
          const match = images.find(img => img.path.includes(`/${art.id}/`));
          if (match) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(match.path).data.publicUrl;
            initialState[art.id] = { image_url: url };
          }
        });
      }

      setArtworks(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(artworkId);
    try {
      const filePath = `${ADMIN_USER_ID}/${artworkId}/${Date.now()}_${file.name}`;
      
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

  const heroImage = artworks['hero-banner']?.image_url || '';
  const servicesImage = artworks['services-mosaic']?.image_url || '';
  const testimonialBg = artworks['testimonial-bg']?.image_url || '';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative">
        {heroImage ? (
          <img 
            src={heroImage} 
            alt="Boulder Bark & Co. — Trusted Pet Care in Boulder"
            className="w-full h-[70vh] object-cover"
          />
        ) : (
          <div className="w-full h-[70vh] bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-center">
            <div className="text-center max-w-2xl px-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Boulder Bark & Co.
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Loving, reliable pet care for busy Boulder families.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="tel:+13035550198" 
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  Call Now: (303) 555-0198
                </a>
                <a 
                  href="#services"
                  className="border border-amber-600 text-amber-700 font-semibold px-6 py-3 rounded-lg hover:bg-amber-50 transition"
                >
                  Our Services
                </a>
              </div>
            </div>
          </div>
        )}

        {adminMode && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded shadow-md max-w-xs">
            <p className="text-xs text-gray-600 mb-2">Hero Banner</p>
            <button
              onClick={() => copyPrompt(ARTWORKS.find(a => a.id === 'hero-banner')!.prompt, 'hero-banner')}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded mr-2"
            >
              {copiedId === 'hero-banner' ? 'Copied!' : 'Copy Prompt'}
            </button>
            <label className="text-xs bg-amber-600 text-white px-2 py-1 rounded cursor-pointer inline-block">
              {uploading === 'hero-banner' ? 'Uploading…' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e, 'hero-banner')}
                className="hidden"
              />
            </label>
          </div>
        )}
      </section>

      {/* Services */}
      <section id="services" className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Our Pet Care Services</h2>
          
          {servicesImage ? (
            <div className="rounded-xl overflow-hidden shadow-lg max-w-4xl mx-auto">
              <img 
                src={servicesImage} 
                alt="Dog walking, grooming, and pet sitting services"
                className="w-full"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { title: 'Daily Dog Walking', desc: 'Reliable 30/60-min walks with GPS-tracked routes and photo updates.' },
                { title: 'In-Home Pet Sitting', desc: 'Overnight or daily visits so your pets stay in their comfort zone.' },
                { title: 'Spa Grooming', desc: 'Gentle baths, nail trims, and ear cleaning in a stress-free environment.' }
              ].map((service, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🐾</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.desc}</p>
                </div>
              ))}
            </div>
          )}

          {adminMode && (
            <div className="mt-6 bg-white/80 p-3 rounded border border-dashed border-amber-300 max-w-2xl mx-auto">
              <p className="text-xs text-gray-600 mb-2">Services Mosaic</p>
              <button
                onClick={() => copyPrompt(ARTWORKS.find(a => a.id === 'services-mosaic')!.prompt, 'services-mosaic')}
                className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded mr-2"
              >
                {copiedId === 'services-mosaic' ? 'Copied!' : 'Copy Prompt'}
              </button>
              <label className="text-xs bg-amber-600 text-white px-2 py-1 rounded cursor-pointer inline-block">
                {uploading === 'services-mosaic' ? 'Uploading…' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, 'services-mosaic')}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 relative">
        <div 
          className="absolute inset-0 z-0 opacity-10"
          style={testimonialBg ? { backgroundImage: `url(${testimonialBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        ></div>
        <div className="max-w-4xl mx-auto relative z-10 bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg">
          <blockquote className="text-center">
            <p className="text-xl italic text-gray-700 mb-6">
              "Boulder Bark & Co. has been a lifesaver! My anxious rescue dog actually wags his tail when they arrive. Their communication is top-notch—photos, updates, and always on time."
            </p>
            <footer className="text-gray-600 font-medium">— Sarah T., Boulder</footer>
          </blockquote>
        </div>

        {adminMode && (
          <div className="mt-6 max-w-2xl mx-auto bg-white/80 p-3 rounded border border-dashed border-gray-300">
            <p className="text-xs text-gray-600 mb-2">Testimonial Background</p>
            <button
              onClick={() => copyPrompt(ARTWORKS.find(a => a.id === 'testimonial-bg')!.prompt, 'testimonial-bg')}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded mr-2"
            >
              {copiedId === 'testimonial-bg' ? 'Copied!' : 'Copy Prompt'}
            </button>
            <label className="text-xs bg-gray-700 text-white px-2 py-1 rounded cursor-pointer inline-block">
              {uploading === 'testimonial-bg' ? 'Uploading…' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e, 'testimonial-bg')}
                className="hidden"
              />
            </label>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-amber-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Give Your Pet the Care They Deserve?</h2>
          <p className="text-xl mb-8">Serving Boulder, Louisville, and Lafayette with love since 2018.</p>
          <a 
            href="tel:+13035550198" 
            className="bg-white text-amber-700 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg inline-block transition"
          >
            Call (303) 555-0198 to Book Today
          </a>
          <p className="mt-4 text-amber-100 text-sm">Free consultation • Fully insured • Bonded & background-checked</p>
        </div>
      </section>

      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          👤 Admin Mode: Upload custom images for this page
        </div>
      )}
    </div>
  );
}