// app/websites/[websiteId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import GalleryTemplate from '@/components/templates/GalleryTemplate';

// Add more as you build them
const TEMPLATE_MAP: Record<string, React.ComponentType<any>> = {
  gallery: GalleryTemplate,
  // 'portfolio': PortfolioTemplate,
  // 'saas': SaasLandingTemplate,
};

export default function WebsitePage({ params }: { params: { websiteId: string } }) {
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('id', params.websiteId)
        .eq('visibility', 'public')
        .single();

      if (data) {
        setTemplate(data);
      } else {
        // Default demo config
        setTemplate({
          type: 'gallery',
          sections: [
            { type: 'hero', headline: 'Welcome to ' + params.websiteId, subtitle: 'A dynamic gallery experience' },
            { type: 'artwork-grid', layout: 'grid' },
            { type: 'artist-story', name: 'Curator', bio: 'This is a live demo of a data-driven template.' },
            { type: 'cta', headline: 'Ready to create your own?', buttonText: 'Get Started' }
          ],
          header: { show: true },
          footer: { show: true, text: '© 2025 CheapWebsitesAndApps' }
        });
      }
    };
    fetchTemplate();
  }, [params.websiteId]);

  if (!template) return <div className="p-8">Loading...</div>;

  const TemplateComponent = TEMPLATE_MAP[template.type];
  if (!TemplateComponent) {
    return <div>Template type "{template.type}" not supported.</div>;
  }

  return <TemplateComponent config={template} />;
}