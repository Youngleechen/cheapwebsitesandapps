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

export const CATEGORY_LABELS: Record<string, string> = {
  ecommerce: '🛒 E-Commerce',
  'local-business': '🏢 Local Business',
  'professional-services': '💼 Professional Services',
  portfolio: '🎨 Creative Portfolio',
  content: '📰 Content & Community',
  restaurant: '🍽️ Restaurant & Hospitality',
  saas: '🚀 Startup / SaaS / Tech',
};

// Helper to normalize category keys (kebab-case)
function normalizeCategoryKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, '-');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category');
    
    const websitesDir = path.join(process.cwd(), 'app', 'websites');

    if (!fs.existsSync(websitesDir)) {
      return NextResponse.json([]);
    }

    const topLevelFolders = fs.readdirSync(websitesDir).filter((file) => {
      const fullPath = path.join(websitesDir, file);
      return (
        fs.statSync(fullPath).isDirectory() &&
        !file.startsWith('.') &&
        !EXCLUDED_FOLDERS.has(file)
      );
    });

    const websites: {
      id: string;
      title: string;
      prompt: string;
      categoryKey: string;
      categoryName: string;
    }[] = [];

    for (const categoryFolder of topLevelFolders) {
      // Apply category filter if provided
      const normalizedCategoryKey = normalizeCategoryKey(categoryFolder);
      if (categoryFilter && normalizedCategoryKey !== normalizeCategoryKey(categoryFilter)) {
        continue;
      }

      const categoryPath = path.join(websitesDir, categoryFolder);
      const items = fs.readdirSync(categoryPath).filter((file) => {
        const itemPath = path.join(categoryPath, file);
        return fs.statSync(itemPath).isDirectory() && !file.startsWith('.');
      });

      const categoryName =
        CATEGORY_LABELS[categoryFolder] ||
        categoryFolder
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

      for (const item of items) {
        const id = `${categoryFolder}/${item}`;
        const pagePath = path.join(categoryPath, item, 'page.tsx');

        let title = item
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        let description = `Professional website for ${title}.`;

        if (fs.existsSync(pagePath)) {
          const content = fs.readFileSync(pagePath, 'utf8');

          const metadataMatch = content.match(
            /export\s+const\s+metadata\s*=\s*(\{[^]*?\});?\s*(?:\n|$)/
          );
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
          categoryKey: categoryFolder, // exact folder name — must match route param
          categoryName,
        });
      }
    }

    return NextResponse.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json([]);
  }
}