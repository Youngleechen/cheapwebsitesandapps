'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// ✅ Deferred and safe Supabase client creation
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    );
  }

  return createClient(url, key);
}

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

const ARTWORKS = [
  {
    id: 'rescue-mission',
    title: 'Rescue Mission',
    prompt:
      'A golden retriever mix with hopeful eyes being gently lifted from a muddy ditch by a rescuer wearing a Wildroot Canine Rescue vest. Early morning light, misty mountains in background, emotional but hopeful tone.',
  },
  {
    id: 'forever-home',
    title: 'Forever Home',
    prompt:
      'A joyful family (two adults, one child) playing fetch in a sun-dappled backyard with a newly adopted black lab. Warm golden hour lighting, overgrown grass, sense of belonging and safety.',
  },
  {
    id: 'volunteer-day',
    title: 'Volunteer Day',
    prompt:
      'Diverse group of volunteers walking a pack of dogs through a red rock trail near Boulder. Clear blue sky, happy dogs on leashes, community spirit, vibrant outdoor energy.',
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };

function GallerySkeleton() {
  const [artworks, setArtworks] = useState<ArtworkState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = getSupabaseClient(); // ✅ Safe: called in effect
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      const supabase = getSupabaseClient(); // ✅
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
      ARTWORKS.forEach((art) => (initialState[art.id] = { image_url: null }));

      if (images) {
        const latestImagePerArtwork: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            if (ARTWORKS.some((a) => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        ARTWORKS.forEach((art) => {
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

    const supabase = getSupabaseClient(); // ✅
    setUploading(artworkId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${artworkId}/`;

      const { data: existingImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (existingImages && existingImages.length > 0) {
        const pathsToDelete = existingImages.map((img) => img.path);
        await Promise.all([
          supabase.storage.from('user_images').remove(pathsToDelete),
          supabase.from('images').delete().in('path', pathsToDelete),
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

      const publicUrl = supabase.storage
        .from('user_images')
        .getPublicUrl(filePath).data.publicUrl;
      setArtworks((prev) => ({ ...prev, [artworkId]: { image_url: publicUrl } }));
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {ARTWORKS.map((art) => {
        const artworkData = artworks[art.id] || { image_url: null };
        const imageUrl = artworkData.image_url;

        return (
          <div key={art.id} className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={art.title}
                className="w-full h-56 object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/eee/999?text=Image+Not+Available';
                }}
              />
            ) : (
              <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Awaiting upload</span>
              </div>
            )}

            {adminMode && (
              <div className="p-3 border-t border-gray-200 space-y-2">
                {!imageUrl && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-gray-600">{art.prompt}</p>
                    <button
                      onClick={() => copyPrompt(art.prompt, art.id)}
                      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded self-start transition"
                      type="button"
                    >
                      {copiedId === art.id ? 'Copied!' : 'Copy Prompt'}
                    </button>
                  </div>
                )}
                <label className="block text-sm bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded cursor-pointer inline-block transition">
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

            <div className="p-4">
              <h3 className="font-bold text-gray-800">{art.title}</h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Main Page Component
export default function WildrootCanineRescuePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Wildroot Canine Rescue</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="#adopt" className="text-gray-700 hover:text-amber-700 font-medium">
              Adopt
            </Link>
            <Link href="#donate" className="text-gray-700 hover:text-amber-700 font-medium">
              Donate
            </Link>
            <Link href="#volunteer" className="text-gray-700 hover:text-amber-700 font-medium">
              Volunteer
            </Link>
          </nav>
          <button className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition font-medium">
            Contact Us
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Mission Statement */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Every Dog Deserves a Second Chance
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Wildroot Canine Rescue saves abandoned, abused, and neglected dogs across Boulder County. 
            Since 2018, we’ve placed over 1,200 dogs into loving forever homes — and we’re just getting started.
          </p>
        </section>

        {/* Urgent CTA Bar */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-12 text-center">
          <h2 className="text-2xl font-bold text-amber-800 mb-2">Urgent: 14 Dogs Need Foster Homes This Week</h2>
          <p className="text-amber-700 mb-4">Fostering saves lives. You provide the love — we cover all medical costs.</p>
          <button className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition font-bold text-lg">
            Become a Foster
          </button>
        </div>

        {/* Gallery Section */}
        <section id="gallery" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Dogs, Our Family</h2>
          {isClient && <GallerySkeleton />}
        </section>

        {/* Stats */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-amber-600">1,200+</div>
              <div className="text-gray-600">Dogs Adopted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600">98%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600">42</div>
              <div className="text-gray-600">Active Volunteers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600">2018</div>
              <div className="text-gray-600">Founded</div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Hear From Our Adopters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border">
              <p className="text-gray-700 italic">“Baxter was terrified when he arrived. Now he’s the joy of our family. Wildroot gave us hope.”</p>
              <p className="mt-4 font-bold text-gray-900">— Sarah T., Boulder</p>
            </div>
            <div className="bg-white p-6 rounded-xl border">
              <p className="text-gray-700 italic">“As a volunteer, I’ve seen firsthand how every dollar and hour makes a real difference.”</p>
              <p className="mt-4 font-bold text-gray-900">— Marcus L., Louisville</p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="bg-gray-900 text-white rounded-2xl p-8 text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Change a Life?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <Link
              href="#adopt"
              className="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              View Dogs for Adoption
            </Link>
            <Link
              href="#donate"
              className="bg-amber-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-amber-700 transition"
            >
              Donate Now
            </Link>
          </div>
        </div>

        {/* Trust Footer */}
        <footer className="border-t pt-8 pb-12 text-center text-gray-600 text-sm">
          <p>Wildroot Canine Rescue • Nonprofit EIN: 82-3456789 • Licensed by Colorado Dept. of Agriculture</p>
          <p className="mt-2">1234 Pine St, Boulder, CO 80302 • (303) 555-0198</p>
        </footer>
      </main>
    </div>
  );
}