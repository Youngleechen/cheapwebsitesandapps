// app/test-upload/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Helper to create Supabase client on the client side
function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase env vars');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export default function TestUploadPage() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch existing uploads on mount
  useEffect(() => {
    const fetchImages = async () => {
      const supabase = getSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        router.push('/auth/signin');
        return;
      }

      const { data, error } = await supabase
        .from('test_uploads')
        .select('id, url')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        setError('Failed to load images');
      } else {
        setImages(data || []);
      }
    };

    fetchImages();
  }, [router]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (jpg, png, etc.)');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = getSupabaseClient();
    const filename = `${Date.now()}-${file.name}`;

    try {
      // Upload to bucket
      const { error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('test-images')
        .getPublicUrl(filename);

      const publicUrl = publicUrlData.publicUrl;

      // Save to DB
      const { error: dbError } = await supabase
        .from('test_uploads')
        .insert({ filename, url: publicUrl });

      if (dbError) throw dbError;

      // Add to UI instantly
      setImages((prev) => [{ id: filename, url: publicUrl }, ...prev]);
      setSuccess('Image uploaded successfully!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Check bucket permissions and table schema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📸 Test Image Upload</h1>
      <p>Upload images to test your Supabase bucket and database.</p>

      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: '1rem' }}>{success}</div>}

      <div style={{ marginTop: '1.5rem' }}>
        <label
          htmlFor="file-upload"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          {loading ? 'Uploading...' : 'Choose Image'}
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
          disabled={loading}
        />
      </div>

      {/* Display uploaded images */}
      <div style={{ marginTop: '2rem' }}>
        <h2>Uploaded Images</h2>
        {images.length === 0 ? (
          <p>No images uploaded yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {images.map((img) => (
              <div key={img.id} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                <img
                  src={img.url}
                  alt="Uploaded"
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}