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
];

type ArtworkState = { [key: string]: { image_url: string | null; loading: boolean; error: string | null } };

export default function GallerySkeleton() {
  const [artworks, setArtworks] = useState<ArtworkState>(() => {
    const initialState: ArtworkState = {};
    ARTWORKS.forEach(art => {
      initialState[art.id] = { 
        image_url: null, 
        loading: true,
        error: null
      };
    });
    return initialState;
  });
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
      // Reset loading states
      setArtworks(prev => {
        const newState = {...prev};
        Object.keys(newState).forEach(key => {
          newState[key] = { ...newState[key], loading: true, error: null };
        });
        return newState;
      });

      try {
        // Get latest image for each artwork in a single query
        const promises = ARTWORKS.map(async (art) => {
          const { data: images, error } = await supabase
            .from('images')
            .select('path, created_at')
            .eq('user_id', ADMIN_USER_ID)
            .like('path', `%/${art.id}/%`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) throw error;

          if (images && images.length > 0) {
            const filePath = images[0].path;
            const publicUrl = supabase.storage
              .from('user_images')
              .getPublicUrl(filePath, {
                // Prevent caching with timestamp param
                transform: { width: 800 }
              }).data.publicUrl + `?v=${new Date(images[0].created_at).getTime()}`;
            
            return { 
              artworkId: art.id, 
              url: publicUrl 
            };
          }
          return { artworkId: art.id, url: null };
        });

        const results = await Promise.all(promises);
        
        // Update state with results
        setArtworks(prev => {
          const newState = {...prev};
          results.forEach(({ artworkId, url }) => {
            if (newState[artworkId]) {
              newState[artworkId] = { 
                ...newState[artworkId], 
                image_url: url,
                loading: false
              };
            }
          });
          return newState;
        });
      } catch (error) {
        console.error('Error loading images:', error);
        setArtworks(prev => {
          const newState = {...prev};
          Object.keys(newState).forEach(key => {
            newState[key] = { 
              ...newState[key], 
              error: 'Failed to load image',
              loading: false
            };
          });
          return newState;
        });
      }
    };

    if (adminMode !== undefined) {
      loadImages();
    }
  }, [adminMode]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(artworkId);
    setArtworks(prev => ({
      ...prev,
      [artworkId]: { ...prev[artworkId], loading: true, error: null }
    }));

    try {
      const folderPath = `${ADMIN_USER_ID}/${artworkId}/`;
      
      // 1. Get existing images for this artwork
      const { data: existingImages, error: fetchError } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (fetchError) throw fetchError;

      // 2. Delete existing images if any
      if (existingImages && existingImages.length > 0) {
        const pathsToDelete = existingImages.map(img => img.path);
        
        // Delete from storage
        const { error: storageDelError } = await supabase.storage
          .from('user_images')
          .remove(pathsToDelete);
        if (storageDelError) throw storageDelError;

        // Delete from database
        const { error: dbDelError } = await supabase
          .from('images')
          .delete()
          .in('path', pathsToDelete);
        if (dbDelError) throw dbDelError;
      }

      // 3. Upload new image with unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const filePath = `${folderPath}${timestamp}.${fileExt}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true, cacheControl: '3600' });
      if (uploadErr) throw uploadErr;

      // 4. Insert new database record
      const { error: dbErr } = await supabase
        .from('images')
        .insert({ 
          user_id: ADMIN_USER_ID, 
          path: filePath,
          // Add explicit timestamp for ordering
          created_at: new Date().toISOString()
        });
      if (dbErr) throw dbErr;

      // 5. Generate cache-busted URL
      const publicUrl = supabase.storage
        .from('user_images')
        .getPublicUrl(filePath, {
          transform: { width: 800 }
        }).data.publicUrl + `?v=${timestamp}`;

      // 6. Update UI
      setArtworks(prev => ({
        ...prev,
        [artworkId]: { 
          image_url: publicUrl,
          loading: false,
          error: null
        }
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      setArtworks(prev => ({
        ...prev,
        [artworkId]: {
          ...prev[artworkId],
          error: 'Upload failed. Please try again.',
          loading: false
        }
      }));
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
          const artworkData = artworks[art.id] || { image_url: null, loading: false, error: null };
          const { image_url, loading, error } = artworkData;

          return (
            <div key={art.id} className="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
              {/* Image preview with loading/error states */}
              <div className="relative w-full h-64 bg-gray-700">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                )}
                
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                {image_url ? (
                  <img 
                    src={image_url} 
                    alt={art.title} 
                    className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      setArtworks(prev => ({
                        ...prev,
                        [art.id]: { ...prev[art.id], error: 'Image failed to load' }
                      }));
                    }}
                  />
                ) : (
                  !loading && !error && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )
                )}
              </div>

              {/* Admin controls */}
              {adminMode && (
                <div className="p-3 border-t border-gray-700 space-y-2">
                  {!image_url && !loading && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-purple-300">{art.prompt}</p>
                      <button
                        onClick={() => copyPrompt(art.prompt, art.id)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded self-start transition-colors"
                        type="button"
                      >
                        {copiedId === art.id ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>
                  )}
                  <label className={`block text-sm px-3 py-1 rounded cursor-pointer inline-block transition-colors ${
                    uploading === art.id 
                      ? 'bg-purple-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}>
                    <span className="flex items-center justify-center">
                      {uploading === art.id ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Uploading...
                        </>
                      ) : (
                        'Upload New Image'
                      )}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, art.id)}
                      className="hidden"
                      disabled={uploading !== null}
                    />
                  </label>
                </div>
              )}

              {/* Title */}
              <div className="p-3 mt-auto">
                <h2 className="font-semibold text-lg">{art.title}</h2>
              </div>
            </div>
          );
        })}
      </div>

      {adminMode && (
        <div className="mt-6 p-4 bg-purple-900/30 border border-purple-600 rounded text-sm">
          <div className="flex items-start">
            <div className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 text-xs">i</div>
            <p>Admin mode active — upload images and copy detailed prompts. Images are stored at: 
              <code className="ml-1 bg-black/30 px-1 rounded">user_images/{`{user_id}`}/{`{artwork_id}`}/</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}