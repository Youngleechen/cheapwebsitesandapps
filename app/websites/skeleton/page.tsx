// app/websites/gallery-skeleton/page.tsx

export const metadata = {
  title: 'AI Art Gallery — CheapWebsites & Apps',
  description:
    'Explore a dynamic gallery of AI-generated artwork prompts and previews. Built as a demo for creative teams using CheapWebsites & Apps — where powerful templates meet simple editing.',
};

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery'; // Dedicated identifier for gallery images

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
      // Fetch ONLY gallery images for admin
      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`) // Critical filter
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
          // Path structure: [user_id, gallery_prefix, artwork_id, filename]
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            // Only consider defined artworks and take the latest
            if (ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        // Build final state with only relevant artworks
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
      // New path structure with gallery identifier
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${artworkId}/`;

      // Clean up OLD gallery images for this artwork
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

      // Upload new image with gallery prefix
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">CheapWebsites & Apps — Gallery Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ARTWORKS.map((art) => {
          const artworkData = artworks[art.id] || { image_url: null };
          const imageUrl = artworkData.image_url;

          return (
            <div key={art.id} className="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={art.title} 
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}

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