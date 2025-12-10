// app/templates/[templateId]/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TemplateData {
  id: string;
  name: string;
  image_url: string | null;
  config: Record<string, any> | null;
}

export default function TemplatePage({ params }: { params: { templateId: string } }) {
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('id', params.templateId)
        .eq('visibility', 'public')
        .single();

      if (data) {
        setTemplate(data);
      } else {
        setTemplate({
          id: params.templateId,
          name: 'Untitled Template',
          image_url: null,
          config: null,
        });
      }
    };
    fetchTemplate();
  }, [params.templateId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus(null);

    try {
      const filePath = `template-images/${params.templateId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('template-images')
        .upload(filePath, file, { upsert: false });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('template-images').getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      await supabase
        .from('templates')
        .upsert({
          id: params.templateId,
          name: template?.name || `${params.templateId} (Uploaded)`,
          type: 'portfolio',
          visibility: 'public',
          image_url: imageUrl,
          config: { uploadedAt: new Date().toISOString() },
        });

      setTemplate(prev => ({
        ...prev!,
        image_url: imageUrl,
      }));

      setStatus('✅ Template updated!');
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!template) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">{template.name}</h1>

      <div className="mb-6">
        <label className="block mb-2 text-sm text-gray-300">
          Upload preview image (will be public):
        </label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleUpload}
          className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
          disabled={uploading}
        />
        {uploading && <p className="mt-2 text-sm text-yellow-400">Uploading...</p>}
        {status && <p className="mt-2 text-sm">{status}</p>}
      </div>

      <div className="border-2 border-dashed border-gray-700 rounded-xl bg-gray-800 h-96 flex items-center justify-center">
        {template.image_url ? (
          <img
            src={template.image_url}
            alt={template.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <p className="text-gray-500">No preview uploaded yet</p>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-400">
        Template ID: <code className="bg-gray-700 px-1 rounded">{params.templateId}</code>
      </p>
    </div>
  );
}