'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Image {
  id: string;
  path: string;
  created_at: string;
}

export default function ImagesPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's images on load
  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      setError('You must be logged in to view images');
      return;
    }

    const { data, error } = await supabase
      .from('images')
      .select('id, path, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images');
      return;
    }

    setImages(data || []);
  }

  async function uploadImage() {
    if (!file) return;

    setUploading(true);
    setError(null);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setError('You must be logged in to upload images');
      setUploading(false);
      return;
    }

    try {
      // Generate unique filename with user ID prefix
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user_images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user_images')
        .getPublicUrl(fileName);

      // Insert into database
      const { error: dbError } = await supabase.from('images').insert({
        user_id: session.user.id,
        path: fileName,
      });

      if (dbError) throw dbError;

      // Refresh images list
      await fetchImages();
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Check console for details.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Image Gallery</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Upload Section */}
      <div className="mb-8 p-4 border rounded-lg">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4"
        />
        <button
          onClick={uploadImage}
          disabled={uploading || !file}
          className={`px-4 py-2 rounded ${
            uploading || !file
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => {
          const { data: { publicUrl } } = supabase.storage
            .from('user_images')
            .getPublicUrl(image.path);
          
          return (
            <div
              key={image.id}
              className="border rounded-lg overflow-hidden shadow-sm"
            >
              <img
                src={publicUrl}
                alt={`Uploaded ${new Date(image.created_at).toLocaleString()}`}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="p-3">
                <p className="text-sm text-gray-500">
                  {new Date(image.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {images.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          No images uploaded yet
        </p>
      )}
    </div>
  );
}