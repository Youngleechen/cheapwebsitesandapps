'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Define real rescue dogs (not abstract art)
const DOGS = [
  {
    id: 'buddy',
    name: 'Buddy',
    age: '3 yrs',
    breed: 'Lab Mix',
    status: 'Ready to Adopt',
    prompt:
      'A friendly golden-brown Labrador mix sitting attentively on grass, tongue out, tail wagging, with soft sunlight highlighting his gentle eyes. Background: clean rescue yard in Austin, Texas.',
  },
  {
    id: 'luna',
    name: 'Luna',
    age: '1 yr',
    breed: 'Shepherd Mix',
    status: 'In Foster',
    prompt:
      'A sleek black-and-tan German Shepherd mix puppy looking up with curious, intelligent eyes, ears perked, lying on a cozy indoor rug. Warm home lighting, shallow depth of field.',
  },
  {
    id: 'daisy',
    name: 'Daisy',
    age: '5 yrs',
    breed: 'Beagle',
    status: 'Needs Medical',
    prompt:
      'A gentle-eyed Beagle with a slightly worn collar, sitting calmly on a vet clinic floor, looking loving but tired. Soft focus background, natural window light, evoke empathy without sadness.',
  },
];

type DogImageState = { [key: string]: { image_url: string | null } };

export default function HomePage() {
  const [dogs, setDogs] = useState<DogImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load dog images
  useEffect(() => {
    const loadImages = async () => {
      setHasAttemptedLoad(true);

      // Initialize state
      const initialState: DogImageState = {};
      DOGS.forEach(dog => (initialState[dog.id] = { image_url: null }));

      try {
        const { data: images, error } = await supabase
          .from('images')
          .select('path, created_at')
          .eq('user_id', ADMIN_USER_ID)
          .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const latestImagePerDog: Record<string, string> = {};

        if (images) {
          for (const img of images) {
            const pathParts = img.path.split('/');
            if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
              const dogId = pathParts[2];
              if (DOGS.some(d => d.id === dogId) && !latestImagePerDog[dogId]) {
                latestImagePerDog[dogId] = img.path;
              }
            }
          }

          DOGS.forEach(dog => {
            if (latestImagePerDog[dog.id]) {
              const url = supabase.storage
                .from('user_images')
                .getPublicUrl(latestImagePerDog[dog.id]).data.publicUrl;
              initialState[dog.id] = { image_url: url };
            }
          });
        }

        setDogs(initialState);
      } catch (err) {
        console.error('Failed to load dog images:', err);
        setDogs(initialState); // fallback to null images
      }
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, dogId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(dogId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${dogId}/`;

      // Clean old images
      const { data: existingImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (existingImages?.length) {
        const pathsToDelete = existingImages.map(img => img.path);
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

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setDogs(prev => ({ ...prev, [dogId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, dogId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(dogId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Render placeholder only *after* load attempt
  const renderDogCard = (dog: typeof DOGS[0]) => {
    const image = dogs[dog.id]?.image_url;
    const showPlaceholder = hasAttemptedLoad && !image;

    return (
      <div
        key={dog.id}
        className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow"
      >
        <div className="relative h-56 w-full">
          {image ? (
            <img
              src={image}
              alt={dog.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={e => {
                (e.target as HTMLImageElement).src = '/dog-placeholder.jpg';
              }}
            />
          ) : showPlaceholder ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400 text-center px-2">
                <p className="font-medium">{dog.name}</p>
                <p className="text-sm">Photo pending</p>
              </div>
            </div>
          ) : (
            // While loading, show subtle skeleton (no "No image" flash)
            <div className="w-full h-full bg-gray-200 animate-pulse"></div>
          )}
          {dog.status && (
            <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
              dog.status.includes('Adopt') ? 'bg-green-500 text-white' :
              dog.status.includes('Foster') ? 'bg-blue-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {dog.status}
            </div>
          )}
        </div>

        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-xl font-bold text-gray-800">{dog.name}</h3>
          <p className="text-gray-600 text-sm">{dog.age} • {dog.breed}</p>
          <div className="mt-3">
            <button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              onClick={() => alert(`Learn more about adopting ${dog.name}!`)}
            >
              Meet {dog.name}
            </button>
          </div>
        </div>

        {adminMode && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            {!image && (
              <div className="mb-2">
                <p className="text-xs text-gray-600 mb-1">{dog.prompt}</p>
                <button
                  onClick={() => copyPrompt(dog.prompt, dog.id)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                  type="button"
                >
                  {copiedId === dog.id ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>
            )}
            <label className="block text-sm bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded cursor-pointer text-center w-full">
              {uploading === dog.id ? 'Uploading…' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={e => handleUpload(e, dog.id)}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-r from-amber-800 to-amber-900 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold max-w-3xl mx-auto leading-tight">
            Every Dog Deserves a Loving Home
          </h1>
          <p className="text-xl md:text-2xl mt-6 max-w-2xl mx-auto opacity-90">
            Gryscol Paws rescues, rehabilitates, and rehomes abandoned dogs across Central Texas.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <button
              className="bg-white text-amber-800 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg"
              onClick={() => document.getElementById('adopt')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Meet Our Dogs
            </button>
            <button
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              onClick={() => document.getElementById('donate')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Support Our Mission
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-12 bg-white rounded-t-[50%]"></div>
      </header>

      {/* Stats */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '212', label: 'Dogs Rescued in 2025' },
              { value: '94%', label: 'Adoption Success Rate' },
              { value: '47', label: 'Volunteers' },
              { value: '12', label: 'Partner Vets' },
            ].map((stat, i) => (
              <div key={i} className="p-4">
                <div className="text-3xl md:text-4xl font-bold text-amber-700">{stat.value}</div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Dogs */}
      <section id="adopt" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Dogs Looking for Forever Homes</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              These amazing companions are ready to bring joy, loyalty, and love into your life.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {DOGS.map(renderDogCard)}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <img
                src="/founder.jpg"
                alt="Sarah Mitchell, Founder"
                className="rounded-xl shadow-md w-full"
                onError={e => (e.target as HTMLImageElement).src = '/placeholder-person.jpg'}
              />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold text-gray-800">Our Story</h2>
              <p className="mt-4 text-gray-600">
                In 2018, after finding an injured stray near Barton Creek, Sarah Mitchell couldn’t walk away.
                What started as one dog in her garage grew into Gryscol Paws—a licensed nonprofit that has
                saved over 1,200 dogs with the help of foster families, donors, and volunteers.
              </p>
              <p className="mt-4 text-gray-600">
                We believe no dog should die alone in a shelter. With your support, we provide medical care,
                behavioral training, and loving foster homes until adoption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Donation CTA */}
      <section id="donate" className="py-20 bg-gradient-to-r from-amber-700 to-amber-800 text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold">Change a Life Today</h2>
          <p className="mt-6 text-xl opacity-90">
            $50 feeds a dog for a month. $200 covers spay/neuter surgery. Every dollar goes directly to care.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            {['$25', '$50', '$100', 'Other'].map(amount => (
              <button
                key={amount}
                className={`py-3 px-6 rounded-lg font-bold transition-colors ${
                  amount === 'Other'
                    ? 'bg-white text-amber-800 hover:bg-gray-100'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                Donate {amount}
              </button>
            ))}
          </div>
          <p className="mt-6 text-sm opacity-80">Tax-deductible • 501(c)(3) nonprofit</p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-6">Trusted By</h3>
            <div className="flex flex-wrap justify-center gap-8 opacity-70">
              {['Austin Pets Alive!', 'Texas Humane Heroes', 'BarkBox', 'Austin Chronicle'].map(org => (
                <div key={org} className="text-gray-600 font-medium">{org}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h4 className="text-xl font-bold text-white">Gryscol Paws Rescue</h4>
            <p className="mt-2">Austin, TX • hello@gryscolpaws.org</p>
            <p className="mt-4 text-sm">© {new Date().getFullYear()} Gryscol Paws. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Admin Note */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-amber-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-xs">
          👤 Admin Mode: Upload dog photos using the prompts below each card.
        </div>
      )}
    </div>
  );
}