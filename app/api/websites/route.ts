// app/api/websites/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const websitesDir = path.join(process.cwd(), 'app', 'websites');
    
    if (!fs.existsSync(websitesDir)) {
      return NextResponse.json([]);
    }

    const folders = fs.readdirSync(websitesDir).filter(file => {
      const fullPath = path.join(websitesDir, file);
      return fs.statSync(fullPath).isDirectory() && !file.startsWith('.');
    });

    const websites = [];

    for (const id of folders) {
      const pagePath = path.join(websitesDir, id, 'page.tsx');
      
      let description = `A professional small business website for ${id.replace(/-/g, ' ')}.`;
      let title = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf-8');

        // Try to extract `export const metadata = { description: ... }`
        const metadataMatch = content.match(/export\s+const\s+metadata\s*=\s*{[^}]*description\s*:\s*['"]([^'"]+)['"][^}]*}/);
        if (metadataMatch) {
          description = metadataMatch[1];
        }

        // Fallback: try `export const description = "..."` 
        const descMatch = content.match(/export\s+const\s+description\s*=\s*['"]([^'"]+)['"]/);
        if (descMatch) {
          description = descMatch[1];
        }

        // Also try to get title from metadata
        const titleMatch = content.match(/export\s+const\s+metadata\s*=\s*{[^}]*title\s*:\s*['"]([^'"]+)['"][^}]*}/);
        if (titleMatch) {
          title = titleMatch[1];
        }
      }

      websites.push({
        id,
        title,
        prompt: description, // We'll call it "prompt" for consistency with GallerySkeleton
      });
    }

    return NextResponse.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json([]);
  }
}