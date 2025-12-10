// app/websites/[slug]/page.tsx
import { notFound } from 'next/navigation';
import ArtGalleryTemplate from '@/lib/templates/ArtGalleryTemplate';

// Optional: Pre-warm known slugs (helps Turbopack)
export const dynamicParams = true; // allow dynamic slugs not in generateStaticParams

export default function WebsitePage({ params }: { params: { slug: string } }) {
  // For now, only support 'art-gallery'
  if (params.slug !== 'art-gallery') {
    notFound();
  }
  return <ArtGalleryTemplate />;
}