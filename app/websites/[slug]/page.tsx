// app/websites/[slug]/page.tsx
import { notFound } from 'next/navigation';
import ArtGalleryTemplate from '@/lib/templates/ArtGalleryTemplate';

// Optional: Pre-render known slugs at build time
export async function generateStaticParams() {
  return [{ slug: 'art-gallery' }]; // Add more later if needed
}

export default async function WebsitePage({ params }: { params: { slug: string } }) {
  // For testing: only allow 'art-gallery'
  if (params.slug !== 'art-gallery') {
    notFound();
  }

  // Render the template directly — it handles its own data fetching
  return <ArtGalleryTemplate />;
}