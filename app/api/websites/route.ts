// app/api/websites/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Optional: Exclude utility/demo folders
const EXCLUDED_FOLDERS = new Set([
  'gallery-skeleton',
  'layout',
  'not-found',
  'components',
  'hooks',
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

      // Fallback title/description from folder name
      let title = id
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      let description = `A professional small business website for ${id.replace(/-/g, ' ')}.`;

      if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf-8');

        // Extract title (looks for `title: "..."` inside metadata or standalone)
        const titleMatch = content.match(/title\s*:\s*['"`]([^'"`]*?)['"`]/);
        if (titleMatch && titleMatch[1].trim()) {
          title = titleMatch[1].trim();
        }

        // Extract description (looks for `description: "..."`)
        const descMatch = content.match(/description\s*:\s*['"`]([^'"`]*?)['"`]/);
        if (descMatch && descMatch[1].trim()) {
          description = descMatch[1].trim();
        }
      }

      websites.push({
        id,
        title,
        prompt: description, // "prompt" for consistency with admin gallery
      });
    }

    return NextResponse.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json([]);
  }
}