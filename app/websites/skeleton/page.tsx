// app/websites/skeleton/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const ARTWORKS = [
  { id: 'midnight-garden', title: 'Midnight Garden', prompt: 'A tranquil night garden...' },
  { id: 'neon-dreams', title: 'Neon Dreams', prompt: 'A vivid, rain-drenched cyberpunk...' },
  { id: 'ocean-memory', title: 'Ocean Memory', prompt: 'An emotive, abstract interpretation...' },
];

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

type ArtworkState = { [key: string]: { image_url: string | null } };

// ✅ Helper: create Supabase client ONLY when needed and only if env vars exist
function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

export default function GallerySkeleton() {
  const [artworks, setArtworks] = useState<ArtworkState>({});
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ✅ Create client inside useEffect (safe for SSR/prerendering)
  useEffect(() => {
    const supabase = createSupabaseClient();

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setAdminMode(uid === ADMIN_USER_ID);
    };

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

      const initialState: ArtworkState = {};
      ARTWORKS.forEach(art => initialState[art.id] = { image_url: null });

      if (images) {
        const latest: Record<string, string> = {};
        for (const img of images) {
          const parts = img.path.split('/');
          if (parts.length >= 4 && parts[1] === GALLERY_PREFIX) {
            const artId = parts[2];
            if (ARTWORKS.some(a => a.id === artId) && !latest[artId]) {
              latest[artId] = img.path;
            }
          }
        }

        ARTWORKS.forEach(art => {
          if (latest[art.id]) {
            const url = supabase.storage.from('user_images').getPublicUrl(latest[art.id]).data.publicUrl;
            initialState[art.id] = { image_url: url };
          }
        });
      }

      setArtworks(initialState);
    };

    checkUser();
    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createSupabaseClient();
    setUploading(artworkId);

    try {
      const folder = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${artworkId}/`;
      
      // Clean old
      const { data: existing } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folder}%`);

      if (existing?.length) {
        const paths = existing.map(i => i.path);
        await Promise.all([
          supabase.storage.from('user_images').remove(paths),
          supabase.from('images').delete().in('path', paths)
        ]);
      }

      const filePath = `${folder}${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('user_images').upload(filePath, file);
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase.from('images').insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      const url = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setArtworks(prev => ({ ...prev, [artworkId]: { image_url: url } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Gallery Demo</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ARTWORKS.map((art) => {
          const data = artworks[art.id] || { image_url: null };
          return (
            <div key={art.id} className="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
              {data.image_url ? (
                <img src={data.image_url} alt={art.title} className="w-full h-64 object-cover" />
              ) : (
                <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
              {adminMode && (
                <div className="p-3 border-t border-gray-700 space-y-2">
                  {!data.image_url && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-purple-300">{art.prompt}</p>
                      <button
                        onClick={() => copyPrompt(art.prompt, art.id)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded self-start"
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
              <div className="p-3">
                <h2 className="font-semibold">{art.title}</h2>
              </div>
            </div>
          );
        })}
      </div>
      {adminMode && (
        <div className="mt-6 p-3 bg-purple-900/30 border border-purple-600 rounded text-sm">
          👤 Admin mode active
        </div>
      )}
    </div>
  );
}