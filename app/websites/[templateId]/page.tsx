// src/components/templates/GalleryTemplate.tsx
'use client';

import React from 'react';

// --- Section Components ---
const HeroSection = ({ data }: { data: any }) => {
  const headline = data.headline || 'Welcome to My Gallery';
  const subtitle = data.subtitle || 'A dynamic gallery experience';
  
  return (
    <div className="py-20 text-center bg-gradient-to-b from-purple-900/30 to-black">
      <h1 className="text-5xl font-bold mb-4">{headline}</h1>
      <p className="text-xl text-purple-200">{subtitle}</p>
    </div>
  );
};

const ArtworkGridSection = ({ data }: { data: any }) => {
  const layout = data.layout || 'grid';
  return (
    <div className={`py-16 ${layout === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3 gap-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-gray-800/50 rounded-xl p-4 break-inside-avoid">
          <div className="bg-gray-700 h-48 rounded mb-3" />
          <h3 className="font-medium">Artwork {i}</h3>
          <p className="text-sm text-gray-400">Digital • 2025</p>
        </div>
      ))}
    </div>
  );
};

const ArtistStorySection = ({ data }: { data: any }) => {
  const name = data.name || 'Artist Name';
  const bio = data.bio || 'Artist biography...';
  
  return (
    <div className="py-16 max-w-3xl mx-auto px-4">
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
        <h2 className="text-2xl font-bold mb-4">About {name}</h2>
        <p className="text-gray-300 leading-relaxed">{bio}</p>
      </div>
    </div>
  );
};

const CtaSection = ({ data }: { data: any }) => {
  const headline = data.headline || 'Ready to create your own?';
  const buttonText = data.buttonText || 'Get Started';
  
  return (
    <div className="py-16 text-center">
      <h2 className="text-3xl font-bold mb-6">{headline}</h2>
      <button className="px-8 py-3 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 transition-colors">
        {buttonText}
      </button>
    </div>
  );
};

// --- Main Template ---
export default function GalleryTemplate({ config }: { config: any }) {
  // Provide defaults if config is missing
  const sections = config?.sections || [];
  const header = config?.header || { show: true };
  const footer = config?.footer || { show: true };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      {header.show && (
        <header className="py-6 px-4 border-b border-gray-800">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Gallery</h1>
            <nav className="hidden md:block">
              <a href="#" className="ml-6 hover:text-purple-400">Artworks</a>
              <a href="#" className="ml-6 hover:text-purple-400">Artists</a>
              <a href="#" className="ml-6 hover:text-purple-400">About</a>
            </nav>
          </div>
        </header>
      )}

      {/* Dynamic Sections */}
      <main>
        {sections.map((section: any, index: number) => {
          switch(section.type) {
            case 'hero':
              return <HeroSection key={index} data={section} />;
            case 'artwork-grid':
              return <ArtworkGridSection key={index} data={section} />;
            case 'artist-story':
              return <ArtistStorySection key={index} data={section} />;
            case 'cta':
              return <CtaSection key={index} data={section} />;
            default:
              return null;
          }
        })}
      </main>

      {/* Footer */}
      {footer.show && (
        <footer className="py-8 px-4 border-t border-gray-800 text-center text-gray-500">
          {footer.text || '© 2025 Art Gallery'}
        </footer>
      )}
    </div>
  );
}