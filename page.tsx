// app/page.tsx
import { Header } from '@/components/header';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            Cheap Websites <span className="text-indigo-600">&</span> Apps
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Professional, editable templates — not cookie-cutter sites. Launch fast, customize easily, and own your digital presence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link
              href="/editor"
              className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5"
            >
              Start Building →
            </Link>
            <Link
              href="/portfolio"
              className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
            >
              See Examples
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {[
              {
                title: 'Editable Templates',
                desc: 'No coding needed. Tweak text, images, and layout right in your browser.',
              },
              {
                title: 'Truly Affordable',
                desc: 'High quality doesn’t have to cost thousands. Simple pricing, no hidden fees.',
              },
              {
                title: 'Reusable Everywhere',
                desc: 'Use the same powerful editor for blogs, portfolios, real estate listings, and more.',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-200 mt-auto">
        <p>© {new Date().getFullYear()} Cheap Websites and Apps. Built for founders, creators, and small teams.</p>
      </footer>
    </>
  );
}