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

// Map folder prefixes to human-readable categories
const CATEGORY_MAP: Record<string, string> = {
  'ecommerce': 'E-commerce',
  'local-business': 'Local Business',
  'professional-services': 'Professional Services',
  'portfolio': 'Creative Portfolio',
  'content': 'Content & Community',
  'restaurant': 'Restaurant & Hospitality',
  'saas': 'Startup / SaaS / Tech',
};

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
      // Parse category from folder path like "ecommerce/brand-name"
      let category = 'Uncategorized';
      const parts = id.split('/');
      if (parts.length >= 2) {
        const prefix = parts[0];
        category = CATEGORY_MAP[prefix] || 'Other';
      }

      const pagePath = path.join(websitesDir, id, 'page.tsx');

      let title = id
        .split('/')
        .pop()! // get last part (e.g., "luxury-candle-brand")
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      let description = `Professional website for ${title}.`;

      if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf8');

        const metadataMatch = content.match(/export\s+const\s+metadata\s*=\s*(\{[^]*?\});?\s*(?:\n|$)/);
        if (metadataMatch) {
          const metadataStr = metadataMatch[1];

          const titleMatch = metadataStr.match(/title\s*:\s*['"`]([^'"`]*?)['"`]/);
          if (titleMatch) title = titleMatch[1].trim();

          const descMatch = metadataStr.match(/description\s*:\s*['"`]([^'"`]*?)['"`]/);
          if (descMatch) description = descMatch[1].trim();
        }
      }

      if (process.env.NODE_ENV === 'development' && description.includes('Professional website for')) {
        console.warn(`⚠️ Missing custom description in websites/${id}/page.tsx`);
      }

      websites.push({
        id,
        title,
        prompt: description,
        category, // ✅ now included
      });
    }

    // Optional: sort by category, then title
    websites.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.title.localeCompare(b.title);
    });

    return NextResponse.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json([]);
  }
}