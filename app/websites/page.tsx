// app/test-upload/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestUploadPage() {
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploads, setUploads] = useState<any[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);

  // Check auth state on load
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user's uploads whenever user changes
  useEffect(() => {
    const fetchUploads = async () => {
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
        console.error('Fetch error:', error);
        setMessage('❌ Failed to load uploads');
      } else {
        setUploads(data || []);
      }
      setLoadingUploads(false);
    };

    fetchUploads();
  }, [user]);

  const handleLogin = async () => {
    const email = prompt('Enter your email:');
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin + '/test-upload' : undefined,
      },
    });

    if (error) {
      setMessage(`Login failed: ${error.message}`);
    } else {
      setMessage('Check your email for login link');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUploads([]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('⚠️ Please select a file');
      return;
    }
    if (!user) {
      setMessage('⚠️ You must be logged in to upload');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const filePath = `test-images/${user.id}/${Date.now()}_${file.name}`;
      
      // Upload to bucket
      const { error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('test-images').getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      // Save to DB
      const { error: dbError } = await supabase
        .from('test_uploads')
        .insert({
          title: file.name,
          image_url: imageUrl,
          user_id: user.id,
        });

      if (dbError) throw dbError;

      setMessage('✅ Upload successful!');
      setFile(null);

      // Refetch uploads
      const { data: freshData } = await supabase
        .from('test_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setUploads(freshData || []);
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Upload & Display Test</h1>

        {/* Auth Status */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          {user ? (
            <div>
              <p className="text-green-400">✅ Logged in as: {user.email}</p>
              <button
                onClick={handleLogout}
                className="mt-2 text-sm text-red-400 hover:underline"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div>
              <p className="text-red-400">❌ Not logged in</p>
              <button
                onClick={handleLogin}
                className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              >
                Sign in with Email
              </button>
            </div>
          )}
        </div>

        {/* Upload Form */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-3"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-4 py-2 rounded ${
              uploading ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
          {message && (
            <p className="mt-3 text-sm">
              {message.startsWith('✅') ? (
                <span className="text-green-400">{message}</span>
              ) : message.startsWith('❌') ? (
                <span className="text-red-400">{message}</span>
              ) : (
                <span className="text-yellow-400">{message}</span>
              )}
            </p>
          )}
        </div>

        {/* Display Uploads */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Uploads:</h2>
          {loadingUploads ? (
            <p>Loading your uploads...</p>
          ) : uploads.length === 0 ? (
            <p className="text-gray-400">No uploads yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {uploads.map((upload) => (
                <div key={upload.id} className="bg-gray-800 p-3 rounded">
                  <img
                    src={upload.image_url}
                    alt={upload.title}
                    className="w-full h-40 object-cover rounded mb-2"
                    onError={(e) => (e.currentTarget.src = '/placeholder-image.png')}
                  />
                  <p className="text-sm text-gray-300 truncate">{upload.title}</p>
                  <p className="text-xs text-gray-500">{new Date(upload.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}