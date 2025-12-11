// app/websites/your-site-name/page.tsx

export const metadata = {
  title: 'Your Site Name — Small Business Website',
  description:
    'A compelling, specific description of this real business. Example: ' +
    'Family-owned bakery in Seattle crafting sourdough breads, custom cakes, ' +
    'and seasonal pastries using locally milled organic flour. Open since 2015.',
};

// Optional: Add openGraph, icons, etc. if needed later
// export const metadata = { ... }

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function YourSiteNamePage() {
  return (
    <div className={`${inter.className} min-h-screen bg-white text-gray-900`}>
      {/* Hero */}
      <header className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Your Business
          </h1>
          <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto">
            A short tagline that captures your value proposition.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">About Us</h2>
          <p>
            This is a live, editable template. Replace this content with real
            business copy. Built for makers, artisans, and service providers.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium text-lg">Services</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-gray-700">
                <li>Service one</li>
                <li>Service two</li>
                <li>Service three</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium text-lg">Contact</h3>
              <p className="mt-2 text-gray-700">
                hello@yourbusiness.com<br />
                (555) 123-4567
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Optional Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} Your Business Name. All rights reserved.
      </footer>
    </div>
  );
}