'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { Palette, Sparkles, CheckCircle, ArrowDownToLine, Instagram, Twitter, Facebook, Copy, Upload } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const POSTER_PREFIX = 'posters'; // Dedicated bucket prefix

const POSTER_TEMPLATES = [
  {
    id: 'promo-launch',
    name: 'Product Launch',
    description: 'Bold, eye-catching promo for new products or features',
    aspect: { platform: 'Instagram', ratio: '1:1', w: 1080, h: 1080 },
    prompt: 'Minimalist yet vibrant social media poster for a tech product launch. Clean typography, gradient background (electric blue to purple), abstract geometric shapes, negative space for logo placement. Modern, premium feel.'
  },
  {
    id: 'event-announcement',
    name: 'Event Announcement',
    description: 'Dynamic poster for webinars, sales, or events',
    aspect: { platform: 'Facebook', ratio: '1.91:1', w: 1200, h: 628 },
    prompt: 'Energetic event announcement poster with confetti elements, bold headline font, and warm sunset colors (orange, coral, gold). Include a subtle stage silhouette and clear date/time zone. Festive but professional.'
  },
  {
    id: 'brand-story',
    name: 'Brand Story',
    description: 'Emotional, narrative-driven poster for brand awareness',
    aspect: { platform: 'Twitter', ratio: '16:9', w: 1200, h: 675 },
    prompt: 'Moody, cinematic poster conveying brand authenticity. Soft focus background of a person working passionately in a cozy studio, warm lighting, shallow depth of field. Overlay subtle texture and elegant serif font for tagline.'
  }
];

type PosterState = { [key: string]: { image_url: string | null } };

export default function PosterGeneratorPage() {
  const [posters, setPosters] = useState<PosterState>({});
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
    const loadPosters = async () => {
      const initialState: PosterState = {};
      POSTER_TEMPLATES.forEach(template => initialState[template.id] = { image_url: null });

      if (!adminMode) {
        setPosters(initialState);
        return;
      }

      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${POSTER_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading posters:', error);
        setPosters(initialState);
        return;
      }

      const latestImagePerTemplate: Record<string, string> = {};
      for (const img of images) {
        const pathParts = img.path.split('/');
        if (pathParts.length >= 4 && pathParts[1] === POSTER_PREFIX) {
          const templateId = pathParts[2];
          if (POSTER_TEMPLATES.some(t => t.id === templateId) && !latestImagePerTemplate[templateId]) {
            latestImagePerTemplate[templateId] = img.path;
          }
        }
      }

      POSTER_TEMPLATES.forEach(template => {
        if (latestImagePerTemplate[template.id]) {
          const url = supabase.storage
            .from('user_images')
            .getPublicUrl(latestImagePerTemplate[template.id]).data.publicUrl;
          initialState[template.id] = { image_url: url };
        }
      });

      setPosters(initialState);
    };

    loadPosters();
  }, [adminMode]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, templateId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(templateId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${POSTER_PREFIX}/${templateId}/`;

      // Clean old uploads
      const { data: existing } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (existing?.length) {
        const paths = existing.map(img => img.path);
        await Promise.all([
          supabase.storage.from('user_images').remove(paths),
          supabase.from('images').delete().in('path', paths)
        ]);
      }

      // Upload new
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
      setPosters(prev => ({ ...prev, [templateId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload poster. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, templateId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(templateId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 bg-indigo-500/20 rounded-full mb-4 border border-indigo-500/30">
            <Palette className="h-4 w-4 mr-2 text-yellow-300" />
            <span className="text-indigo-200 text-sm font-medium">AI-Powered Poster Studio</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-yellow-200 mb-4">
            Create Scroll-Stopping <span className="text-yellow-300">Social Ads</span>
          </h1>
          <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
            Generate stunning, on-brand posters for Instagram, Facebook & Twitter — in minutes.
          </p>
        </motion.div>

        {/* Poster Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {POSTER_TEMPLATES.map((template, idx) => {
            const posterData = posters[template.id] || { image_url: null };
            const imageUrl = posterData.image_url;

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-indigo-500/50 transition-all"
              >
                {/* Preview */}
                <div className="relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={template.name}
                      className="w-full aspect-square object-cover"
                      onError={(e) => (e.target as HTMLImageElement).src = '/placeholder-poster.jpg'}
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-gray-800 to-indigo-900 flex items-center justify-center">
                      <Sparkles className="h-10 w-10 text-indigo-400" />
                    </div>
                  )}

                  {/* Aspect Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full text-xs">
                    {getPlatformIcon(template.aspect.platform)}
                    <span>{template.aspect.ratio}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-white mb-1">{template.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{template.description}</p>

                  {adminMode && (
                    <div className="space-y-3">
                      {!imageUrl && (
                        <div className="text-xs text-indigo-300 bg-indigo-900/30 p-2 rounded">
                          {template.prompt}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {!imageUrl && (
                          <button
                            onClick={() => copyPrompt(template.prompt, template.id)}
                            className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedId === template.id ? 'Copied!' : 'Copy Prompt'}
                          </button>
                        )}
                        <label className="flex items-center gap-1 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 px-2 py-1 rounded cursor-pointer">
                          <Upload className="h-3 w-3" />
                          {uploading === template.id ? 'Uploading…' : 'Upload Poster'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, template.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {!adminMode && (
                    <Link
                      href="/get-started"
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium py-2 rounded-lg hover:opacity-90"
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      Generate This Poster
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        {!adminMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-20"
          >
            <p className="text-indigo-200 mb-6">Need custom posters for your business?</p>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 font-bold rounded-xl hover:shadow-lg"
            >
              Get Your Posters Made — $69
              <ArrowDownToLine className="h-4 w-4" />
            </Link>
          </motion.div>
        )}

        {/* Admin Badge */}
        <AnimatePresence>
          {adminMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 backdrop-blur-sm"
            >
              <Palette className="h-4 w-4" />
              Poster Studio (Admin)
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}