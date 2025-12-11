'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase environment variables are missing. Check your .env.local file:',
    '\n- NEXT_PUBLIC_SUPABASE_URL',
    '\n- NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'anon-key-placeholder'
);

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
  const [isLoading, setIsLoading] = useState(true);

  // Fetch images on mount (no auth required for viewing)
  useEffect(() => {
    // If env vars are missing, show config error
    if (!supabaseUrl || !supabaseAnonKey) {
      setError(
        'Supabase configuration error. Check .env.local for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
      setIsLoading(false);
      return;
    }

    fetchImages();
  }, []);

  async function fetchImages() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('images')
        .select('id, path, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        setError(`Failed to load images: ${error.message}`);
        setImages([]);
      } else {
        setImages(data || []);
      }
    } catch (err) {
      console.error('Unexpected fetch error:', err);
      setError('An unexpected error occurred');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadImage() {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Require auth only for upload
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('You must be logged in to upload images');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`;

      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user_images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Insert into database
      const { error: dbError } = await supabase.from('images').insert({
        user_id: session.user.id,
        path: fileName,
      });

      if (dbError) throw dbError;

      // Refresh images
      await fetchImages();
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      if (err instanceof Error) {
        setError(`Upload failed: ${err.message}`);
      } else {
        setError('Unknown upload error');
      }
    } finally {
      setUploading(false);
    }
  }

  // Show environment error if present
  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-50 text-red-700 rounded">
        <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
        <p>Missing environment variables:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        </ul>
        <p className="mt-4">
          Create a <code>.env.local</code> file in your project root with:
        </p>
        <pre className="bg-gray-100 p-3 rounded mt-2 whitespace-pre-wrap">
          {`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Image Gallery</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Upload Section (visible to all, but upload requires login) */}
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
                      const next = target.nextElementSibling;
                      if (next) next.classList.remove('hidden');
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

          {images.length === 0 && !isLoading && (
            <p className="text-center text-gray-500 mt-8">
              No images uploaded yet
            </p>
          )}
        </>
      )}
    </div>
  );
}