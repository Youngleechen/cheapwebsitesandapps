'use client';

import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Define types for better TypeScript safety
interface PhotoDb {
  id: string;
  user_id: string;
  image_path: string;
  created_at: string;
}

interface PhotoWithUrl extends PhotoDb {
  signedUrl?: string;
}

export default function ImageUploader() {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  // Fetch user's photos on component mount
  useEffect(() => {
    const fetchPhotos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user. Redirect or show login.');
        return;
      }

      const { data, error } = await supabase
        .from('photos')
        .select('id, image_path')
        .eq('user_id', user.id)
        .returns<PhotoDb[]>() // ✅ Explicitly type Supabase response
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching photos:', error);
        return;
      }

      // Generate signed URLs for each image
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          const { data: signedData } = await supabase.storage
            .from('user_images')
            .createSignedUrl(photo.image_path, 3600); // URL valid for 1 hour
          return {
            ...photo,
            signedUrl: signedData?.signedUrl,
          };
        })
      );

      setPhotos(photosWithUrls);
    };

    fetchPhotos();
  }, [supabase]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    const file = e.target.files?.[0];
    if (!file) {
      setUploading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be signed in to upload images.');
      setUploading(false);
      return;
    }

    // Generate unique file path: user_id/timestamp-filename
    const fileName = `${user.id}/${Date.now()}-${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user_images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      alert('Failed to upload image.');
      setUploading(false);
      return;
    }

    // Save metadata to database
    const { error: dbError } = await supabase
      .from('photos')
      .insert({
        user_id: user.id,
        image_path: fileName,
      });

    if (dbError) {
      console.error('Database insert failed:', dbError);
      alert('Failed to save image record.');
      setUploading(false);
      return;
    }

    // Immediately generate signed URL and update UI without full refetch
    const { data: signedData } = await supabase.storage
      .from('user_images')
      .createSignedUrl(fileName, 3600);

    setPhotos((prev) => [
      {
        id: crypto.randomUUID(), // Temporary ID for UI; real ID comes from DB if needed
        user_id: user.id,
        image_path: fileName,
        created_at: new Date().toISOString(),
        signedUrl: signedData?.signedUrl,
      },
      ...prev,
    ]);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Car Image Gallery</h1>
      <p>Upload and view your images securely.</p>

      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        ref={fileInputRef}
        disabled={uploading}
        style={{ marginBottom: '1.5rem', padding: '0.5rem' }}
      />
      {uploading && <p>Uploading image...</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '1rem',
        }}
      >
        {photos.map((photo) =>
          photo.signedUrl ? (
            <div key={photo.id} style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <img
                src={photo.signedUrl}
                alt="Uploaded car"
                style={{
                  width: '100%',
                  height: '150px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          ) : null
        )}
      </div>

      {photos.length === 0 && !uploading && (
        <p>No images uploaded yet.</p>
      )}
    </div>
  );
}