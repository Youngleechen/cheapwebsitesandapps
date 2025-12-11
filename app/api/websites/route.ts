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

    const websites = folders.map(id => ({
      id,
      title: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      prompt: `A professional small business website for ${id.replace(/-/g, ' ')}.`,
    }));

    return NextResponse.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json([]);
  }
}