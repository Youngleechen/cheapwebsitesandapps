// app/websites/page.tsx
import { Suspense } from 'react';
import WebsitesClient from './WebsitesClient';

export default function WebsitesShowcase({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading showcase...</div>
      </div>
    }>
      <WebsitesClient initialCategory={searchParams?.category || null} />
    </Suspense>
  );
}