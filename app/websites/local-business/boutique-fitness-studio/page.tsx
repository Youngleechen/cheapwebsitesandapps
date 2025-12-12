'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Artwork definitions — mapped to real page sections
const GALLERY_ITEMS = [
  {
    id: 'studio-interior',
    title: 'Studio Interior',
    prompt:
      'A bright, minimalist movement studio in Asheville with large windows, soft natural light, light oak floors, and 3-4 people in flow—barefoot, in neutral-toned activewear, practicing slow Pilates or breathwork. Warm, serene, inviting. No clutter. Plants in corners. Morning light.',
  },
  {
    id: 'outdoor-session',
    title: 'Outdoor Breathwork Session',
    prompt:
      'A small group (4 people) seated on eco-mats in a forest clearing near Asheville, eyes closed, hands resting on knees, bathed in dappled sunlight. Mist in the background. Mossy ground. Peaceful, grounded, connected to nature. Soft focus, cinematic depth.',
  },
  {
    id: 'founder-portrait',
    title: 'Founder Portrait',
    prompt:
      'Portrait of a calm, strong South Asian woman in her 30s (wavy dark hair, minimal makeup, linen tank top), smiling gently, standing in studio with soft backlight. Warm, authentic, trustworthy. Shot on 85mm, shallow depth of field.',
  },
];

type GalleryState = { [key: string]: { url: string | null; loading: boolean } };

export default function AetherMovementPage() {
  const [gallery, setGallery] = useState<GalleryState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Preload state: mark all as loading
  useEffect(() => {
    const initial: GalleryState = {};
    GALLERY_ITEMS.forEach((item) => {
      initial[item.id] = { url: null, loading: true };
    });
    setGallery(initial);
  }, []);

  // Auth check
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load images on mount
  useEffect(() => {
    const loadImages = async () => {
      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load gallery images:', error);
        // Mark all as loaded (but empty)
        setGallery((prev) =>
          GALLERY_ITEMS.reduce((acc, item) => {
            acc[item.id] = { url: null, loading: false };
            return acc;
          }, {} as GalleryState)
        );
        return;
      }

      const latest: Record<string, string> = {};
      if (images) {
        for (const img of images) {
          const parts = img.path.split('/');
          if (parts.length >= 4 && parts[1] === GALLERY_PREFIX) {
            const artId = parts[2];
            if (!latest[artId] && GALLERY_ITEMS.some((g) => g.id === artId)) {
              latest[artId] = img.path;
            }
          }
        }
      }

      // Build final state
      const newState: GalleryState = {};
      GALLERY_ITEMS.forEach((item) => {
        if (latest[item.id]) {
          const publicUrl = supabase.storage
            .from('user_images')
            .getPublicUrl(latest[item.id]).data.publicUrl;
          newState[item.id] = { url: publicUrl, loading: false };
        } else {
          newState[item.id] = { url: null, loading: false };
        }
      });

      setGallery(newState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(id);
    try {
      // Delete old images for this ID
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${id}/`;
      const { data: existing } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (existing?.length) {
        const paths = existing.map((i) => i.path);
        await supabase.storage.from('user_images').remove(paths);
        await supabase.from('images').delete().in('path', paths);
      }

      // Upload new
      const filePath = `${folderPath}${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file);
      if (uploadErr) throw uploadErr;

      await supabase.from('images').insert({ user_id: ADMIN_USER_ID, path: filePath });

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setGallery((prev) => ({ ...prev, [id]: { url: publicUrl, loading: false } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Helper to render image with loading state
  const renderImage = (id: string, alt: string, className: string) => {
    const { url, loading } = gallery[id] || { url: null, loading: false };

    if (loading) {
      return (
        <div className={`${className} bg-gray-100 animate-pulse`}>
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Loading...
          </div>
        </div>
      );
    }

    if (url) {
      return (
        <Image
          src={url}
          alt={alt}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-fitness.jpg';
          }}
        />
      );
    }

    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <span className="text-gray-400 text-sm">Image missing</span>
      </div>
    );
  };

  return (
    <div className="font-sans text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="#" className="text-2xl font-light tracking-wide">
            Aether Movement
          </Link>
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            <Link href="#classes" className="hover:text-emerald-600 transition">
              Classes
            </Link>
            <Link href="#about" className="hover:text-emerald-600 transition">
              Approach
            </Link>
            <Link href="#team" className="hover:text-emerald-600 transition">
              Team
            </Link>
            <Link href="#contact" className="hover:text-emerald-600 transition">
              Visit
            </Link>
          </nav>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-sm font-medium transition shadow-md hover:shadow-lg">
            Book a Session
          </button>
        </div>
      </header>

      <main>
        {/* Immersive Gallery Carousel */}
        <section className="relative h-screen overflow-hidden">
          {renderImage(
            'studio-interior',
            'Aether Movement Studio Interior',
            'absolute inset-0 w-full h-full'
          )}
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center text-white max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-light leading-tight mb-4">
              Move with Intention.
              <br />
              Breathe with Purpose.
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              A boutique movement studio in the Blue Ridge Mountains for those seeking strength,
              stillness, and somatic awareness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-emerald-700 hover:bg-gray-100 px-6 py-3 rounded-full font-medium text-lg transition shadow-lg hover:shadow-xl w-fit">
                Try Your First Class – $20
              </button>
              <button className="border-2 border-white text-white hover:bg-white/10 px-6 py-3 rounded-full font-medium text-lg transition w-fit">
                View Class Schedule
              </button>
            </div>
          </div>

          {adminMode && (
            <div className="absolute top-4 right-4 bg-emerald-600/90 text-white text-xs px-3 py-1 rounded-full">
              Admin: Studio Interior
            </div>
          )}
        </section>

        {/* Trust Badges */}
        <section className="py-6 bg-gray-50">
          <div className="container mx-auto px-4 flex flex-wrap justify-center gap-6 text-center">
            <div>
              <div className="text-emerald-600 font-bold text-lg">500+</div>
              <div className="text-gray-600 text-sm">Clients Transformed</div>
            </div>
            <div>
              <div className="text-emerald-600 font-bold text-lg">4.9★</div>
              <div className="text-gray-600 text-sm">Google Reviews</div>
            </div>
            <div>
              <div className="text-emerald-600 font-bold text-lg">Since 2019</div>
              <div className="text-gray-600 text-sm">Serving Asheville</div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light mb-6">Where Movement Meets Mindfulness</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                We blend classical Pilates, somatic therapy, and breathwork to help high-achievers
                reconnect with their bodies—without judgment, without pressure, just presence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-medium mb-4">Our Philosophy</h3>
                <p className="text-gray-600 mb-4">
                  In a world of high-intensity workouts and burnout, Aether offers a different path:
                  slow, intentional movement that builds resilient bodies and calm minds.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2">✓</span>
                    <span>Small classes (max 6 people)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2">✓</span>
                    <span>Trauma-informed, body-positive instruction</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2">✓</span>
                    <span>Private 1:1 somatic sessions available</span>
                  </li>
                </ul>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-xl">
                {renderImage(
                  'outdoor-session',
                  'Outdoor breathwork session in Asheville forest',
                  'absolute inset-0 w-full h-full'
                )}
                {adminMode && (
                  <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-xs px-2 py-1 rounded">
                    Admin: Outdoor Session
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section id="team" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light">Guided by Presence</h2>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="relative aspect-square rounded-full overflow-hidden mx-auto mb-6 shadow-lg w-64 h-64">
                {renderImage('founder-portrait', 'Maya Devi, Founder', 'absolute inset-0 w-full h-full')}
                {adminMode && (
                  <div className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-xs px-2 py-1 rounded">
                    Admin: Founder
                  </div>
                )}
              </div>
              <h3 className="text-xl text-center font-medium mb-2">Maya Devi</h3>
              <p className="text-gray-600 text-center mb-4">
                Certified in Classical Pilates, Somatic Experiencing®, and Breathwork. Former tech
                executive turned movement guide.
              </p>
              <p className="text-gray-600 text-center max-w-lg mx-auto">
                “I built Aether because I needed it myself—after years of burnout, I found healing
                not in doing more, but in moving slowly, listening deeply, and breathing fully.”
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-emerald-600 text-white">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-light mb-6">
              Ready to Reconnect with Your Body?
            </h2>
            <p className="text-emerald-100 text-lg mb-8">
              New clients get 10% off their first month. No experience necessary.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-emerald-700 hover:bg-gray-100 px-8 py-4 rounded-full font-medium text-lg transition shadow-lg">
                Start Your Journey
              </button>
              <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-full font-medium text-lg transition">
                Tour the Studio
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-light mb-4">Aether Movement</h3>
              <p className="text-sm">
                218 Riverside Dr, Asheville, NC 28801
                <br />
                Open Tues–Sat, 7am–7pm
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Classes</h4>
              <ul className="text-sm space-y-1">
                <li>Mat Pilates</li>
                <li>Reformer Pilates</li>
                <li>Breathwork Circles</li>
                <li>Somatic Coaching</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Connect</h4>
              <ul className="text-sm space-y-1">
                <li>(828) 555-0192</li>
                <li>hello@aethermovement.com</li>
                <li>Instagram @aether.asheville</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Legal</h4>
              <ul className="text-sm space-y-1">
                <li>Privacy Policy</li>
                <li>Terms of Use</li>
                <li>Waiver</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm">
            © {new Date().getFullYear()} Aether Movement. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Admin Upload UI (hidden from users) */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white p-4 rounded-lg shadow-lg max-w-xs z-50">
          <p className="text-sm font-medium mb-2">🖼️ Admin Gallery Controls</p>
          <div className="space-y-3">
            {GALLERY_ITEMS.map((item) => (
              <div key={item.id} className="text-xs">
                <div className="font-mono bg-purple-700 px-2 py-1 rounded mb-1">{item.id}</div>
                {!gallery[item.id]?.url && (
                  <button
                    onClick={() => copyPrompt(item.prompt, item.id)}
                    className="block text-left mb-1 text-purple-200 hover:text-white"
                  >
                    {copiedId === item.id ? '✅ Copied!' : '📋 Copy Prompt'}
                  </button>
                )}
                <label className="cursor-pointer inline-block bg-white/20 hover:bg-white/30 px-2 py-1 rounded">
                  {uploadingId === item.id ? 'Uploading…' : '📤 Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, item.id)}
                    className="hidden"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}