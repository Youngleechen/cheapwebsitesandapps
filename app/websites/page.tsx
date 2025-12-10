// app/test-upload/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type UploadRecord = {
  id: string;
  title: string;
  image_url: string;
  created_at: string;
  user_id: string;
};

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);

  // Check auth state on mount and set up auth listener
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUploads(session.user.id);
      } else {
        setLoadingUploads(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUploads(session.user.id);
      } else {
        setUploads([]);
        setLoadingUploads(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user's uploads
  const fetchUploads = async (userId: string) => {
    setLoadingUploads(true);
    try {
      const { data, error } = await supabase
        .from('test_uploads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (err: any) {
      console.error('Error fetching uploads:', err);
      setMessage(`❌ Failed to load uploads: ${err.message}`);
    } finally {
      setLoadingUploads(false);
    }
  };

  const handleLogin = async () => {
    const email = prompt('Enter admin email:');
    const password = prompt('Enter password:');
    
    if (!email || !password) {
      setMessage('Login canceled');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      setMessage(`Login failed: ${error.message}`);
    } else {
      setMessage('✅ Successfully logged in!');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUploads([]);
    setMessage('✅ Successfully logged out');
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    if (!user) {
      setMessage('You must be logged in');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      // Upload file to bucket
      const filePath = `test-images/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('test-images').getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      // Insert record into table
      const { data: newUpload, error: dbError } = await supabase
        .from('test_uploads')
        .insert({
          title: file.name,
          image_url: imageUrl,
          user_id: user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Update UI
      setUploads(prev => [newUpload, ...prev]);
      setMessage('✅ Success! Image uploaded and record saved.');
      setFile(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage(`❌ Error: ${err.message || 'Unknown error during upload'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Supabase Upload Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test image uploads with authentication and database records
          </p>

          {/* Auth Status */}
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
            {user ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-700">✅ Logged in as:</p>
                    <p className="text-blue-600">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="font-medium text-red-600 mb-2">❌ Not logged in</p>
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Login to Admin Account
                </button>
              </>
            )}
          </div>

          {/* Upload Form */}
          <div className="mb-8 p-5 border rounded-lg bg-gray-50">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image to Upload
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || !user}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
                uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : !user
                  ? 'bg-yellow-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {uploading
                ? 'Uploading...'
                : !user
                ? 'Login Required'
                : 'Upload & Save to Database'}
            </button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.startsWith('✅') 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            } border`}>
              {message}
            </div>
          )}

          {/* Uploads Gallery */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              Your Uploads
              {loadingUploads && (
                <span className="ml-2 text-blue-500 text-sm">Loading...</span>
              )}
            </h2>
            
            {user && loadingUploads ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-200 border-2 border-dashed rounded-lg animate-pulse h-48" />
                ))}
              </div>
            ) : user && uploads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploads.map((upload) => (
                  <div 
                    key={upload.id} 
                    className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-48 w-full">
                      <Image
                        src={upload.image_url}
                        alt={upload.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-gray-800 truncate">{upload.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(upload.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : user ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                <p className="text-gray-500 text-lg">
                  No uploads found. Upload your first image!
                </p>
              </div>
            ) : (
              <div className="text-center py-12 bg-blue-50 rounded-lg">
                <p className="text-blue-600 text-lg font-medium">
                  Login to see your uploads
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}