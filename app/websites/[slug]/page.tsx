// app/websites/[slug]/page.tsx
import { notFound } from 'next/navigation';
import ArtGalleryTemplate from '@/lib/templates/ArtGalleryTemplate';

export default function WebsitePage({ params }: { params: { slug: string } }) {
  if (params.slug !== 'art-gallery') {
    return notFound();
  }
  return <ArtGalleryTemplate />;
}