// app/api/websites/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const EXCLUDED_FOLDERS = new Set([
  'gallery-skeleton',
  'components',
  'hooks',
  'layout',
  'not-found',
  'error',
  'api',
]);

export async function GET() {
  try {
    const websitesDir = path.join(process.cwd(), 'app', 'websites');

    if (!fs.existsSync(websitesDir)) {
      return NextResponse.json([]);
    }

    const folders = fs.readdirSync(websitesDir).filter((file) => {
      const fullPath = path.join(websitesDir, file);
      return (
        fs.statSync(fullPath).isDirectory() &&
        !file.startsWith('.') &&
        !EXCLUDED_FOLDERS.has(file)
      );
    });

    const websites = [];

    for (const id of folders) {
      const pagePath = path.join(websitesDir, id, 'page.tsx');

      // Default: derive from folder name
      let title = id
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      let description = `Professional website for ${title}.`;

      if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf8');

        // Try to extract metadata object as a whole (multiline-safe)
        const metadataMatch = content.match(/export\s+const\s+metadata\s*=\s*(\{[^]*?\});?\s*(?:\n|$)/);
        if (metadataMatch) {
          const metadataStr = metadataMatch[1];

          // Extract title
          const titleMatch = metadataStr.match(/title\s*:\s*['"`]([^'"`]*?)['"`]/);
          if (titleMatch) title = titleMatch[1].trim();

          // Extract description
          const descMatch = metadataStr.match(/description\s*:\s*['"`]([^'"`]*?)['"`]/);
          if (descMatch) description = descMatch[1].trim();
        }
      }

      // Optional: warn in dev if description is generic
      if (process.env.NODE_ENV === 'development' && description.includes('Professional website for')) {
        console.warn(`⚠️ Missing custom description in websites/${id}/page.tsx`);
      }

      websites.push({
        id,
        title,
        prompt: description,
      });
    }

    return NextResponse.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json([]);
  }
}