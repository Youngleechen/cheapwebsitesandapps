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
  const [session, setSession] = useState<any>(null);

  // Check authentication state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all images (publicly visible)
  useEffect(() => {
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

      if (error) throw error;
      setImages(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(`Failed to load images: ${err.message}`);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadImage() {
    if (!file || !session?.user) return;

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      if (!fileExt) throw new Error('Invalid file type');

      const fileName = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user_images')
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Insert into DB
      const { error: dbError } = await supabase.from('images').insert({
        user_id: session.user.id,
        path: fileName,
      });

      if (dbError) throw dbError;

      // Refresh list
      await fetchImages();
      setFile(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  // Handle missing env vars
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
      <h1 className="text-2xl font-bold mb-6">Public Image Gallery</h1>

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
          {/* Upload Section — only works if logged in */}
          {session?.user ? (
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
          ) : (
            <div className="mb-8 p-4 border rounded-lg bg-blue-50">
              <p className="text-blue-700">
                Log in to upload images. All uploaded images are publicly visible to everyone.
              </p>
            </div>
          )}

          {/* Public Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.length > 0 ? (
              images.map((image) => {
                const { data: publicUrlData } = supabase.storage
                  .from('user_images')
                  .getPublicUrl(image.path);
                const publicUrl = publicUrlData?.publicUrl || '';

                return (
                  <div
                    key={image.id}
                    className="border rounded-lg overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="relative w-full h-48">
                      {publicUrl ? (
                        <>
                          <img
                            src={publicUrl}
                            alt={`Uploaded on ${new Date(image.created_at).toLocaleDateString()}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div 
                            className="hidden absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500"
                            style={{ display: 'none' }}
                          >
                            Image unavailable
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500">
                          Invalid image path
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t">
                      <p className="text-xs text-gray-500">
                        {new Date(image.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="col-span-3 text-center text-gray-500 py-8">
                No images uploaded yet. Log in to be the first to upload!
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}