'use client';

import { Sparkles } from 'lucide-react';

export default function WebsitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border mb-6">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">Demo Preview</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Wine Bar with Tasting Menu
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          This is a premium website concept designed for a modern {(Wine Bar with Tasting Menu -replace ' ','').ToLower()} business. 
          Built with Next.js, Tailwind CSS, and responsive UX principles.
        </p>
        
        <div className="bg-white rounded-2xl border p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3"> Coming Soon</h2>
          <p className="text-gray-600">
            This demo will include: custom animations, CMS integration, 
            mobile-first layout, and conversion-optimized design.
          </p>
        </div>
        
        <p className="mt-10 text-sm text-gray-500">
          Created by your agency  Ready to build yours?
        </p>
      </div>
    </div>
  );
}
