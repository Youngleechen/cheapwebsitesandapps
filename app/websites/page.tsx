// app/test-upload/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UploadRecord {
  id: string;
  title: string;
  image_url: string;
  user_id: string;
  created_at: string;
}

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);

  // Fetch user uploads from Supabase
  const fetchUploads = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploads([]);
      setLoadingUploads(false);
      return;
    }

    setLoadingUploads(true);
    const { data, error } = await supabase
      .from('test_uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch uploads error:', error);
      setMessage('❌ Failed to load uploads.');
      setUploads([]);
    } else {
      setUploads(data || []);
    }
    setLoadingUploads(false);
  };

  // Fetch on mount
  useEffect(() => {
    fetchUploads();
  }, []);

  const handleLogin = async () => {
    // ⚠️ Replace with your real admin email and password in development only
    const { error } = await supabase.auth.signInWithPassword({
      email: 'your-admin@email.com',
      password: 'your-password',
    });

    if (error) {
      setMessage(`❌ Login failed: ${error.message}`);
    } else {
      setMessage('✅ Logged in successfully.');
      fetchUploads();
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('⚠️ Please select a file.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('⚠️ You must be logged in to upload.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      // Upload to Supabase Storage
      const filePath = `test-images/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('test-images').getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      // Save to database
      const { error: dbError } = await supabase
        .from('test_uploads')
        .insert({
          title: file.name,
          image_url: imageUrl,
          user_id: user.id,
        });

      if (dbError) throw dbError;

      setMessage('✅ Upload successful! Image saved.');
      setFile(null);
      await fetchUploads(); // Refresh list
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage(`❌ Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Image Upload Test</h1>

      <div className="mb-6">
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
        >
          Login (Admin)
        </button>

        <div className="flex flex-col gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-2"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-4 py-2 rounded text-white ${
              uploading
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload & Save'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded mb-6 ${
            message.startsWith('✅')
              ? 'bg-green-900 text-green-200'
              : message.startsWith('⚠️')
              ? 'bg-yellow-900 text-yellow-200'
              : 'bg-red-900 text-red-200'
          }`}
        >
          {message}
        </div>
      )}

      {/* Uploaded Images Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Uploaded Images</h2>
        {loadingUploads ? (
          <p className="text-gray-500">Loading uploads...</p>
        ) : uploads.length === 0 ? (
          <p className="text-gray-500">No images uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="border rounded-lg overflow-hidden shadow-sm"
              >
                <img
                  src={upload.image_url}
                  alt={upload.title}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://via.placeholder.com/300x200?text=Image+Failed';
                  }}
                />
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{upload.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(upload.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}