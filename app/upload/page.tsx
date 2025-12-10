'use client';

import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase'; // 👈 import the instance

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    setUploading(true);
    setUploadedUrl(null);

    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image.');
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      setUploadedUrl(publicUrl);
    }

    setUploading(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Upload an Image</h1>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {uploadedUrl && (
        <div style={{ marginTop: '1rem' }}>
          <p>Upload successful!</p>
          <img
            src={uploadedUrl}
            alt="Uploaded"
            style={{ maxWidth: '300px', height: 'auto', marginTop: '1rem' }}
          />
        </div>
      )}
    </div>
  );
}