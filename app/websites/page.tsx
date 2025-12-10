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

  // Fetch uploads for the current user
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
      console.error('Failed to fetch uploads:', error);
      setMessage('Failed to load uploads.');
    } else {
      setUploads(data || []);
    }
    setLoadingUploads(false);
  };

  // Refetch uploads whenever the user logs in/out or uploads
  useEffect(() => {
    fetchUploads();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'your-admin@email.com', // ⚠️ Replace with real admin email
      password: 'your-password',     // ⚠️ Or use magic links / OAuth
    });
    if (error) {
      setMessage('Login failed: ' + error.message);
    } else {
      setMessage('✅ Logged in successfully.');
      fetchUploads(); // Refresh uploads after login
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('You must be logged in');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const filePath = `test-images/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('test-images').getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      const { error: dbError } = await supabase
        .from('test_uploads')
        .insert({
          title: file.name,
          image_url: imageUrl,
          user_id: user.id,
        });

      if (dbError) throw dbError;

      setMessage('✅ Success! Image uploaded and record saved.');
      setFile(null);
      await fetchUploads(); // Refresh the list
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Error: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Upload Test</h1>

      <button
        onClick={handleLogin}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Login (if needed)
      </button>

      <div className="mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-2"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`px-4 py-2 rounded ${
            uploading ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {uploading ? 'Uploading...' : 'Upload & Save'}
        </button>
      </div>

      {message && (
        <p
          className={`mt-2 p-3 rounded ${
            message.startsWith('✅') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
          }`}
        >
          {message}
        </p>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Uploaded Images</h2>
        {loadingUploads ? (
          <p>Loading your uploads...</p>
        ) : uploads.length === 0 ? (
          <p className="text-gray-500">No uploads yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="border rounded p-3 flex flex-col items-center"
              >
                <img
                  src={upload.image_url}
                  alt={upload.title}
                  className="w-full h-32 object-cover rounded mb-2"
                  onError={(e) => (e.currentTarget.src = '/placeholder-image.png')}
                />
                <p className="text-sm font-medium text-center truncate w-full">
                  {upload.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(upload.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}