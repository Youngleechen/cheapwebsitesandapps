'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin user ID
const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';

const ARTWORKS = [
  { 
    id: 'midnight-garden', 
    title: 'Midnight Garden',
    prompt: 'A tranquil night garden scene where moonlight filters through dense foliage, illuminating fantastical glowing flowers in soft blues, purples, and whites. Include subtle mist and quiet shadows to enhance serenity.'
  },
  { 
    id: 'neon-dreams', 
    title: 'Neon Dreams',
    prompt: 'A vivid, rain-drenched cyberpunk cityscape at night, drenched in neon reflections—think pinks, cyans, and deep violets shimmering on wet asphalt. Include blurred motion of distant hover cars and storefront signs in Japanese or futuristic glyphs.'
  },
  { 
    id: 'ocean-memory', 
    title: 'Ocean Memory',
    prompt: 'An emotive, abstract interpretation of ocean waves using layered textures—rippling blues, deep teals, and accents of molten gold light that suggest memory, longing, or the passage of time. Avoid realism; aim for poetic fluidity.'
  },
  {
    id: 'dublin-strength-hub',
    title: 'Dublin Strength Hub',
    prompt: 'Mobile-first website for a boutique fitness studio in Dublin. Hero section showing class schedule ("Mon/Wed/Fri 6am & 6pm") with prominent "Join Free Trial" button. Clean pricing table (drop-in €20, 5-class pack €85, unlimited €149). Embedded Instagram feed showing client transformations. Trainer bio section with credentials. Professional blue/green color scheme with warm accent colors. Minimalist design showing on iPhone with Dublin cityscape background.'
  }
];

type ArtworkState = { [key: string]: { image_url: string | null } };

export default function GallerySkeleton() {
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">CheapWebsites & Apps — Gallery Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ARTWORKS.map((art) => {
          const imageUrl = artworks[art.id]?.image_url;

          return (
            <div key={art.id} className="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
              {/* Image preview */}
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={art.title} 
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}

              {/* Admin controls */}
              {adminMode && (
                <div className="p-3 border-t border-gray-700 space-y-2">
                  {!imageUrl && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-purple-300">{art.prompt}</p>
                      <button
                        onClick={() => copyPrompt(art.prompt, art.id)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded self-start"
                        type="button"
                      >
                        {copiedId === art.id ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>
                  )}
                  <label className="block text-sm bg-purple-600 text-white px-3 py-1 rounded cursor-pointer inline-block">
                    {uploading === art.id ? 'Uploading…' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, art.id)}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Title */}
              <div className="p-3 mt-auto">
                <h2 className="font-semibold">{art.title}</h2>
              </div>
            </div>
          );
        })}
      </div>

      {adminMode && (
        <div className="mt-6 p-3 bg-purple-900/30 border border-purple-600 rounded text-sm">
          👤 Admin mode active — you can upload images and copy detailed prompts.
        </div>
      )}
    </div>
  );
}