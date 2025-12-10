// app/test-upload/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type UploadRecord = {
  id: string;
  title: string;
  image_url: string;
  user_id: string;
  created_at: string;
};

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);

  // Check auth state on mount and listen for changes
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    fetchUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch uploads whenever user changes
  useEffect(() => {
    const fetchUploads = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('test_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        setMessage('❌ Failed to load uploads.');
        return;
      }

      setUploads(data || []);
    };

    fetchUploads();
  }, [user]);

  const handleLogin = async () => {
    const email = prompt('Enter admin email:');
    const password = prompt('Enter password:');
    if (!email || !password) {
      setMessage('Email and password required.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage('Login failed: ' + error.message);
    } else {
      setMessage('✅ Logged in successfully.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMessage('✅ Logged out.');
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    if (!user) {
      setMessage('You must be logged in to upload.');
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

      setMessage('✅ Success! Image uploaded and saved.');
      setFile(null);

      // Optional: refetch uploads immediately
      const { data: newUploads } = await supabase
        .from('test_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setUploads(newUploads || []);
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Upload error: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Image Upload Test</h1>

      {/* Authentication Status */}
      <div className="mb-4 p-3 bg-gray-800 text-white rounded">
        {user ? (
          <>
            <p>✅ Logged in as: <strong>{user.email}</strong></p>
            <button
              onClick={handleLogout}
              className="mt-2 text-sm text-red-300 hover:underline"
            >
              Log out
            </button>
          </>
        ) : (
          <p>❌ Not logged in</p>
        )}
      </div>

      {/* Login Button */}
      {!user && (
        <button
          onClick={handleLogin}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Login
        </button>
      )}

      {/* Upload Form */}
      {user && (
        <>
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
        </>
      )}

      {/* Message */}
      {message && (
        <p
          className={`mt-4 p-3 rounded ${
            message.startsWith('✅')
              ? 'bg-green-900 text-green-200'
              : 'bg-red-900 text-red-200'
          }`}
        >
          {message}
        </p>
      )}

      {/* Display Uploaded Images */}
      {uploads.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Your Uploaded Images</h2>
          <div className="grid grid-cols-2 gap-4">
            {uploads.map((upload) => (
              <div key={upload.id} className="border rounded overflow-hidden">
                <img
                  src={upload.image_url}
                  alt={upload.title}
                  className="w-full h-32 object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <p className="p-2 text-sm truncate">{upload.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}