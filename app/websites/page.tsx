'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return;

    setUploading(true);
    setError(null);
    
    try {
      // CRITICAL FIX: Use "public/" prefix for public buckets
      const fileName = `public/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL (no need for "public/" here)
      const { data } = supabase.storage
        .from('test-images')
        .getPublicUrl(fileName.replace('public/', ''));
      
      const imageUrl = data.publicUrl;
      setImageUrl(imageUrl);

      // Save to database
      const { error: dbError } = await supabase
        .from('test_uploads')
        .insert({ name, image_url: imageUrl });

      if (dbError) throw dbError;

      setSuccess(true);
      setName('');
      setFile(null);
    } catch (err: any) {
      setError(`Upload failed: ${err.message || 'Check bucket permissions'}`);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Test Upload (Fixed)
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-500 rounded-lg text-green-300">
            Success! Image uploaded and saved to database.
          </div>
        )}
        
        <form onSubmit={handleUpload} className="space-y-6">
          {/* [Name field remains the same] */}
          
          <div>
            <label className="block text-sm font-medium mb-2">Image File</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-900 file:text-purple-200 hover:file:bg-purple-800"
              required
            />
            {file && (
              <p className="mt-1 text-sm text-purple-300">
                Selected: {file.name}
              </p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={uploading}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              uploading
                ? 'bg-gray-600 cursor-not-allowed'
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
              'Upload Test Image'
            )}
          </button>
        </form>
        
        {imageUrl && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h2 className="text-lg font-semibold mb-3">Preview (Should work now):</h2>
            <div className="border border-purple-500/30 rounded-lg overflow-hidden">
              <img 
                src={imageUrl} 
                alt="Uploaded preview" 
                className="w-full h-48 object-contain bg-gray-700"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.alt = "Preview failed - check bucket permissions";
                  setError("Preview failed! Check: 1) Bucket public access ON 2) 'public/' prefix");
                }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-400 break-all">{imageUrl}</p>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <h3 className="font-medium text-purple-300 mb-2">Critical Checklist</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Bucket: <code className="bg-gray-700 px-1 rounded">test-images</code> set to PUBLIC</li>
            <li>Policy: <code className="bg-gray-700 px-1 rounded">Public read access</code> exists</li>
            <li>File path: <code className="bg-gray-700 px-1 rounded">public/</code> prefix used</li>
            <li>URL: <code className="bg-gray-700 px-1 rounded">getPublicUrl</code> called correctly</li>
          </ol>
        </div>
      </div>
    </div>
  );
}