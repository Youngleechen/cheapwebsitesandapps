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
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Get authenticated user
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) {
        throw new Error('Authentication required. Please log in first.');
      }
      const userId = session.user.id;

      // 2. Upload to storage
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('test-images')
        .getPublicUrl(fileName);

      // 4. Save to database
      const { error: dbError } = await supabase
        .from('test_uploads')
        .insert({
          user_id: userId,
          image_path: fileName
        });

      if (dbError) throw dbError;

      // 5. Verify insertion
      const { data: verification } = await supabase
        .from('test_uploads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      setResult({
        success: true,
        storagePath: fileName,
        publicUrl,
        dbRecord: verification?.[0]
      });

    } catch (err: any) {
      setError(`Upload failed: ${err.message || 'Unknown error'}`);
      console.error('Full error:', err);
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Supabase Upload Tester
          </h1>
          <p className="mt-4 text-gray-300">
            Diagnose your RLS and storage issues with this verified workflow
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-purple-900/50">
          <div className="space-y-6">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Image (PNG/JPG under 5MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-purple-900 file:text-purple-200
                  hover:file:bg-purple-800"
              />
              {file && (
                <p className="mt-2 text-green-400 text-sm">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className={`w-full py-3 px-4 rounded-lg font-medium text-lg transition-all ${
                uploading || !file
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Upload & Verify'
              )}
            </button>

            {/* Results Display */}
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
                <p className="text-red-300 font-medium">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-4 p-4 bg-green-900/20 border border-green-500 rounded-lg">
                <h3 className="text-xl font-bold text-green-300">Success!</h3>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Storage Path:</p>
                  <code className="block p-2 bg-gray-900 rounded text-green-300 text-sm break-all">
                    {result.storagePath}
                  </code>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Public URL:</p>
                  <a 
                    href={result.publicUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline break-all block mb-2"
                  >
                    {result.publicUrl}
                  </a>
                  <img 
                    src={result.publicUrl} 
                    alt="Uploaded preview" 
                    className="max-h-48 w-auto rounded border border-purple-500/30"
                  />
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Database Record:</p>
                  <pre className="text-xs text-gray-300 p-3 bg-gray-900 rounded overflow-auto max-h-48">
                    {JSON.stringify(result.dbRecord, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Debug Info */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h4 className="text-lg font-medium text-purple-400 mb-3">If Upload Fails:</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>1. Check your Supabase environment variables in <code>.env.local</code></li>
                <li>2. Verify you're logged in to Supabase (this test requires authentication)</li>
                <li>3. Inspect browser console for detailed error messages</li>
                <li>4. Check RLS policies in Supabase dashboard > Authentication > Policies</li>
                <li>5. Ensure bucket permissions match the SQL policies above</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Verification Steps */}
        <div className="mt-12 bg-gray-800/50 rounded-xl p-6 border border-purple-900/30">
          <h2 className="text-2xl font-bold text-purple-300 mb-4">Verification Checklist</h2>
          <ol className="space-y-3 text-gray-300">
            <li>✅ <strong>Bucket exists:</strong> Go to Storage > Buckets and confirm "test-images" exists</li>
            <li>✅ <strong>Table exists:</strong> Go to Table Editor > public > test_uploads</li>
            <li>✅ <strong>RLS Policies:</strong> Check both table and bucket have policies matching the SQL above</li>
            <li>✅ <strong>Auth test:</strong> Click your profile icon in Supabase dashboard - you should see your user ID</li>
            <li>✅ <strong>Network test:</strong> Try uploading a small image (under 1MB) first</li>
          </ol>
        </div>
      </div>
    </div>
  );
}