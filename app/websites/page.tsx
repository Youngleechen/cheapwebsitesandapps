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
      // 1. Upload file to bucket
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data } = supabase.storage
        .from('test-images')
        .getPublicUrl(fileName);
      
      const imageUrl = data.publicUrl;
      setImageUrl(imageUrl);

      // 3. Save to database
      const { error: dbError } = await supabase
        .from('test_uploads')
        .insert({ name, image_url: imageUrl });

      if (dbError) throw dbError;

      setSuccess(true);
      setName('');
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Test Upload
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
          <div>
            <label className="block text-sm font-medium mb-2">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Sunset Photo"
              required
            />
          </div>
          
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
            <h2 className="text-lg font-semibold mb-3">Preview:</h2>
            <img 
              src={imageUrl} 
              alt="Uploaded preview" 
              className="w-full h-48 object-contain rounded-lg bg-gray-700 p-2"
            />
            <p className="mt-2 text-sm text-gray-400 break-all">{imageUrl}</p>
          </div>
        )}
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Bucket: test-images</p>
          <p>Table: test_uploads</p>
        </div>
      </div>
    </div>
  );
}