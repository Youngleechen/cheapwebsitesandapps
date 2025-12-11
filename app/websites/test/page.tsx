'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';

const ARTWORKS = [
  { 
    id: 'midnight-garden', 
    title: 'Emergency Storm Cleanup',
    prompt: 'A dramatic dusk scene of professional arborists using rigging and cranes to safely remove a massive oak limb that fell across a suburban driveway during a storm. Wet pavement reflects emergency lights; focus on precision and calm under pressure.'
  },
  { 
    id: 'neon-dreams', 
    title: 'Precision Tree Trimming',
    prompt: 'Sun-dappled close-up of a certified arborist making a clean pruning cut on a mature Japanese maple in an upscale Asheville garden. Show healthy branching structure, sharp tools, and attention to detail—no leaves on ground.'
  },
  { 
    id: 'ocean-memory', 
    title: 'Stump Grinding & Site Restoration',
    prompt: 'Before-and-after style: left shows raw stump in grass, right shows smooth, seeded lawn with wood chips neatly bagged. Early morning light, dew on grass—emphasize cleanliness and care.'
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };

export default function HomePage() {
  const [artworks, setArtworks] = useState<ArtworkState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleTick);
    function handleTick() {
      requestAnimationFrame(handleScroll);
    }
    return () => window.removeEventListener('scroll', handleTick);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || null;
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        return;
      }

      const initialState: ArtworkState = {};
      ARTWORKS.forEach(art => initialState[art.id] = { image_url: null });

      if (images) {
        const latestImagePerArtwork: Record<string, string> = {};
        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 3) {
            const artId = pathParts[1];
            if (ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        ARTWORKS.forEach(art => {
          if (latestImagePerArtwork[art.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerArtwork[art.id]).data.publicUrl;
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
      const folderPath = `${ADMIN_USER_ID}/${artworkId}/`;
      const { data: existingImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (existingImages && existingImages.length > 0) {
        const pathsToDelete = existingImages.map(img => img.path);
        await supabase.storage.from('user_images').remove(pathsToDelete);
        await supabase.from('images').delete().in('path', pathsToDelete);
      }

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

  const imageUrl = (id: string) => {
    return artworks[id]?.image_url || '/placeholder-tree.jpg';
  };

  return (
    <div className="font-sans bg-gradient-to-b from-amber-50 to-white text-gray-800">
      {/* Sticky CTA Bar */}
      {scrolled && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white py-2 px-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center text-sm">
            <span className="font-semibold">🌳 Same-Day Emergency Service</span>
            <a 
              href="tel:+18285550198" 
              className="bg-white text-amber-700 px-4 py-1 rounded-full font-bold hover:bg-amber-100 transition"
            >
              Call Now: (828) 555-0198
            </a>
          </div>
        </div>
      )}

      <main className="pt-6 pb-16">
        {/* Headline */}
        <div className="max-w-4xl mx-auto px-4 text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Certified Tree Care That <span className="text-amber-700">Protects</span> Your Property
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gryscol Tree Care serves Asheville homeowners with ISA-certified arborists, 
            storm emergency response, and meticulous pruning—backed by 15+ years of local trust.
          </p>
        </div>

        {/* Services Overview */}
        <div className="max-w-6xl mx-auto px-4 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Emergency Tree Removal', desc: '24/7 storm response. Fully insured. No hidden fees.' },
              { title: 'Precision Pruning', desc: 'Health-focused trimming that extends tree life & beauty.' },
              { title: 'Stump Grinding', desc: 'Clean, complete removal—lawn-ready in one visit.' }
            ].map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Photo Gallery — Powered by Your System */}
        <div className="max-w-6xl mx-auto px-4 mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Real Work. Real Results.</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {ARTWORKS.map((art) => {
              const artworkData = artworks[art.id] || { image_url: null };
              const imageUrl = artworkData.image_url;

              return (
                <div key={art.id} className="group relative overflow-hidden rounded-xl shadow-lg">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={art.title}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => (e.currentTarget.src = '/placeholder-tree.jpg')}
                    />
                  ) : (
                    <div className="w-full h-64 bg-amber-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Project image loading...</span>
                    </div>
                  )}

                  {adminMode && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!imageUrl && (
                        <div className="text-white text-center mb-3">
                          <p className="text-xs mb-2">{art.prompt}</p>
                          <button
                            onClick={() => copyPrompt(art.prompt, art.id)}
                            className="text-xs bg-white text-amber-700 px-2 py-1 rounded"
                          >
                            {copiedId === art.id ? 'Copied!' : 'Copy Prompt'}
                          </button>
                        </div>
                      )}
                      <label className="text-white bg-amber-600 px-3 py-1.5 rounded cursor-pointer text-sm">
                        {uploading === art.id ? 'Uploading…' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, art.id)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="text-white font-semibold">{art.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          {adminMode && (
            <div className="mt-6 p-3 bg-amber-100 border border-amber-300 rounded text-sm text-amber-800 text-center">
              👤 Admin mode: Upload project photos using the prompts above.
            </div>
          )}
        </div>

        {/* Final CTA */}
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Free On-Site Estimate</h2>
            <p className="text-gray-600 mb-6">
              Get a detailed quote with no obligation. We’ll assess your trees, explain options, and honor your budget.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="tel:+18285550198"
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full font-bold transition"
              >
                Call (828) 555-0198
              </a>
              <a
                href="mailto:hello@gryscoltreecare.com"
                className="border border-amber-600 text-amber-700 hover:bg-amber-50 px-8 py-3 rounded-full font-bold transition"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Gryscol Tree Care — Asheville, NC</p>
          <p className="mt-1 text-sm">Fully Licensed • ISA Certified • $2M Liability Insurance</p>
        </div>
      </footer>
    </div>
  );
}