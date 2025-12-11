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
    id: 'midnight-garden', 
    title: 'Hero Banner',
    prompt: 'A golden retriever mix puppy curled up in soft hay inside a rustic barn at dawn, sunlight streaming through dusty windows, conveying safety and hope. Warm tones, shallow depth of field.'
  },
  { 
    id: 'neon-dreams', 
    title: 'Adoptable Dogs',
    prompt: 'A joyful collage of three adoptable rescue dogs (a senior beagle, a scruffy terrier mix, and a shy pit bull) in a sunlit Asheville backyard with mountains in the distance. Natural lighting, candid expressions.'
  },
  { 
    id: 'ocean-memory', 
    title: 'Our Mission',
    prompt: 'Abstract but warm composition: overlapping hands gently holding a small dog, blurred background of volunteers at a rural foster home. Use soft focus and amber tones to evoke compassion and community.'
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };

export default function PawprintRescuePage() {
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

      if (existingImages?.length) {
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

  const heroImage = artworks['midnight-garden']?.image_url || '/placeholder-hero.jpg';
  const adoptableImage = artworks['neon-dreams']?.image_url || '/placeholder-adopt.jpg';
  const missionImage = artworks['ocean-memory']?.image_url || '/placeholder-mission.jpg';

  return (
    <div className="font-sans text-gray-800 antialiased">
      {/* Hero Section */}
      <section className="relative w-full h-screen max-h-[800px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold max-w-3xl leading-tight">
            Every Dog Deserves a Second Chance
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl opacity-90">
            Pawprint Rescue saves at-risk dogs across Western North Carolina — one loving home at a time.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a
              href="#adopt"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-md transition"
            >
              Meet Our Dogs
            </a>
            <a
              href="#donate"
              className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/30 transition"
            >
              Support Our Mission
            </a>
          </div>
        </div>
        {adminMode && (
          <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded text-sm">
            Admin: Hero Image
          </div>
        )}
      </section>

      {/* Who We Are */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Based in Asheville. Saving Lives Since 2017.</h2>
            <p className="text-lg text-gray-600 mb-4">
              We rescue dogs from high-kill shelters, hoarding situations, and medical emergencies across Buncombe, Haywood, and Madison counties.
            </p>
            <p className="text-lg text-gray-600 mb-6">
              Every dog receives vet care, behavioral support, and foster love before finding their forever family.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-amber-600">500+</span>
                <span className="ml-2 text-gray-600">Dogs Saved</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-amber-600">98%</span>
                <span className="ml-2 text-gray-600">Adoption Success</span>
              </div>
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden shadow-xl border border-gray-200">
            <img
              src={missionImage}
              alt="Volunteers caring for rescue dogs"
              className="w-full h-auto object-cover"
              onError={(e) => (e.currentTarget.src = '/placeholder-mission.jpg')}
            />
            {adminMode && (
              <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
                Mission Image
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Adoptable Dogs */}
      <section id="adopt" className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Available Friends</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            All are spayed/neutered, vaccinated, and ready for love.
          </p>
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 max-w-4xl mx-auto">
            <img
              src={adoptableImage}
              alt="Adoptable rescue dogs"
              className="w-full h-auto object-cover"
              onError={(e) => (e.currentTarget.src = '/placeholder-adopt.jpg')}
            />
            {adminMode && (
              <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
                Adoptable Dogs
              </div>
            )}
          </div>
          <div className="mt-8 flex justify-center">
            <a
              href="https://forms.pawprintrescue.org/adopt"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow transition"
            >
              Start Your Adoption Application
            </a>
          </div>
        </div>
      </section>

      {/* Support */}
      <section id="donate" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">You Make This Possible</h2>
          <p className="text-lg text-gray-600 mb-8">
            $75 feeds a dog for a month. $200 covers emergency surgery. Every gift changes a life.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://donate.pawprintrescue.org"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow transition"
            >
              Donate Now
            </a>
            <a
              href="https://volunteer.pawprintrescue.org"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg shadow transition"
            >
              Volunteer With Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Welcome a New Best Friend?</h3>
          <p className="text-gray-300 mb-6">
            Asheville’s most trusted rescue — serving Western NC with compassion since 2017.
          </p>
          <div className="text-sm text-gray-400">
            Pawprint Rescue • 501(c)(3) Nonprofit • EIN: 82-1234567
          </div>
        </div>
      </footer>

      {/* Admin Gallery (Hidden in production for non-admins, but present for dev) */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <details className="bg-purple-900 text-white rounded shadow-lg">
            <summary className="px-3 py-2 cursor-pointer font-medium">🛠️ Admin Gallery</summary>
            <div className="p-4 bg-gray-900 border border-purple-700 rounded-b">
              <h4 className="font-semibold mb-2">Upload Management Images</h4>
              {ARTWORKS.map((art) => {
                const img = artworks[art.id]?.image_url;
                return (
                  <div key={art.id} className="mb-3">
                    <div className="text-xs text-purple-300 mb-1">{art.title}</div>
                    {!img && (
                      <button
                        onClick={() => copyPrompt(art.prompt, art.id)}
                        className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded mr-2"
                      >
                        {copiedId === art.id ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    )}
                    <label className="text-xs bg-purple-700 hover:bg-purple-600 px-2 py-1 rounded cursor-pointer inline-block">
                      {uploading === art.id ? 'Uploading…' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, art.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}