'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Phone, Clock, Calendar, Upload, Copy, Check } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const POSTER_PREFIX = 'web_poster';

export default function WebDesignPoster() {
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('Whynowebsite');
  const [headline, setHeadline] = useState('PROFESSIONAL WEBSITES');
  const [subHeadline, setSubHeadline] = useState('FOR ENTREPRENEURS & CREATIVES!');
  const [feature1, setFeature1] = useState('5-page website live in 48 hours — just $69');
  const [feature2, setFeature2] = useState('No monthly fees. No tech skills needed.');
  const [cta, setCta] = useState('GET YOUR WEBSITE NOW');
  const [prompt, setPrompt] = useState(
    'A bold, modern social media ad for a web design service. Vibrant blue-to-indigo gradient background, clean layout, confident model holding a laptop showing a live website, yellow accent highlights, sharp typography, 1080x1350 vertical ad format.'
  );
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check admin
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load latest poster image
  useEffect(() => {
    if (!adminMode) return;
    const loadImage = async () => {
      const { data: images } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${POSTER_PREFIX}/%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (images?.[0]) {
        const url = supabase.storage
          .from('user_images')
          .getPublicUrl(images[0].path).data.publicUrl;
        setImageUrl(url);
      }
    };
    loadImage();
  }, [adminMode]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Clean old poster images
      const { data: oldImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${POSTER_PREFIX}/%`);

      if (oldImages?.length) {
        const paths = oldImages.map(img => img.path);
        await supabase.storage.from('user_images').remove(paths);
        await supabase.from('images').delete().in('path', paths);
      }

      const path = `${ADMIN_USER_ID}/${POSTER_PREFIX}/${Date.now()}_${file.name}`;
      await supabase.storage.from('user_images').upload(path, file, { upsert: true });
      await supabase.from('images').insert({ user_id: ADMIN_USER_ID, path });
      const publicUrl = supabase.storage.from('user_images').getPublicUrl(path).data.publicUrl;
      setImageUrl(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      {/* Main Poster Container — Full viewport for easy screenshot */}
      <div className="relative w-full h-screen flex items-center justify-center p-4 md:p-8">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-90"></div>

        {/* Decorative Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full -translate-y-1/2 translate-x-1/2 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 -translate-x-1/2 opacity-20"></div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl w-full h-full flex flex-col md:flex-row items-center justify-between gap-8 px-4 py-8">
          
          {/* LEFT: Text Content */}
          <div className="w-full md:w-1/2 space-y-6 text-white">
            {/* Brand Title */}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>

            {/* Main Headline */}
            <div className="space-y-2">
              <span className="text-yellow-300 text-xl md:text-2xl font-extrabold">FOR</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight">
                {headline}
              </h2>
              <h3 className="text-2xl md:text-3xl font-bold text-yellow-200">{subHeadline}</h3>
            </div>

            {/* Features */}
            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-300 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">»</div>
                <p className="text-lg">{feature1}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-yellow-300 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">»</div>
                <p className="text-lg">{feature2}</p>
              </div>
            </div>

            {/* Operational Badge */}
            <div className="flex items-center gap-3 mt-8">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6" />
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xl font-semibold">GO LIVE IN 48 HOURS</span>
            </div>

            {/* CTA Button */}
            <div className="mt-8">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-blue-800 font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                {cta}
              </button>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-3 mt-6">
              <Phone className="w-5 h-5" />
              <span className="text-xl font-semibold">0757248296</span>
            </div>

            {/* Decorative Dots */}
            <div className="flex gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-white rounded-full"></div>
              ))}
            </div>
          </div>

          {/* RIGHT: Image */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative">
              <div className="relative w-full max-w-md h-[500px] md:h-[600px] overflow-hidden rounded-2xl border-4 border-purple-400 shadow-2xl">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Website showcase"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x800/4F46E5/FFFFFF?text=Your+Website';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center">
                    <span className="text-white text-center p-4">Upload a screenshot or AI visual</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-900/20 to-transparent"></div>
              </div>

              {/* Logo badge */}
              <div className="absolute top-4 right-4 bg-white rounded-lg p-2 shadow-lg">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">W</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Corner dots */}
        <div className="absolute top-4 left-4 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-white rounded-full"></div>
          ))}
        </div>
        <div className="absolute top-4 right-4 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-white rounded-full"></div>
          ))}
        </div>
      </div>

      {/* Admin Controls (overlay at bottom) */}
      {adminMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md text-white p-4 border-t border-purple-600 z-50">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-sm">
            
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-purple-300" />
              <label className="cursor-pointer bg-purple-700 hover:bg-purple-600 px-3 py-1.5 rounded text-xs">
                {uploading ? 'Uploading…' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 max-w-md">
              <div className="flex gap-1 items-center">
                <span className="text-gray-300">Prompt:</span>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-gray-800 text-white text-xs px-2 py-1 rounded w-full"
                />
                <button
                  onClick={copyPrompt}
                  className="text-gray-400 hover:text-white"
                >
                  {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            <div className="text-yellow-300 text-xs font-semibold">✏️ Admin Mode — edit & screenshot</div>
          </div>
        </div>
      )}
    </div>
  );
}