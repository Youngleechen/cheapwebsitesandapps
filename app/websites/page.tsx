// app/test-upload/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'your-admin@email.com', // replace with your real admin email
      password: 'your-password'       // or use magic link if preferred
    });
    if (error) setMessage('Login failed: ' + error.message);
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
      // 1. Upload file to bucket
      const filePath = `test-images/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data } = supabase.storage.from('test-images').getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      // 3. Insert record into table
      const { error: dbError } = await supabase
        .from('test_uploads')
        .insert({
          title: file.name,
          image_url: imageUrl,
          user_id: user.id
        });

      if (dbError) throw dbError;

      setMessage('✅ Success! Image uploaded and record saved.');
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Error: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Upload Test</h1>

      <button
        onClick={handleLogin}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Login (if needed)
      </button>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
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

      {message && (
        <p className={`mt-4 p-3 rounded ${message.startsWith('✅') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
          {message}
        </p>
      )}
    </div>
  );
}