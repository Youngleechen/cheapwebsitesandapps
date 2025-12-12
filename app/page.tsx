// app/page.tsx
import { Header } from '@/components/Header';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

// Define your live demos — pulled from your taxonomy
const DEMOS = [
  {
    id: 'vegan-bakery-asheville',
    title: 'Sunseed Hearth — Vegan Bakery',
    location: 'Asheville, NC',
    description: 'Plant-based pastries, ethical sourcing, warm community space.',
    category: 'Restaurant & Hospitality',
    slug: '/vegan-bakery',
    cta: 'View Live Site',
  },
  {
    id: 'alpine-tree-surgeons',
    title: 'Alpine Tree Surgeons',
    location: 'Bend, OR',
    description: 'Certified arborists offering emergency care, pruning & removal.',
    category: 'Local Business',
    slug: '/tree-service',
    cta: 'See Full Site',
  },
  {
    id: 'veridian-legal',
    title: 'Veridian Legal Group',
    location: 'Austin, TX',
    description: 'Boutique family law firm focused on mediation & clarity.',
    category: 'Professional Services',
    slug: '/law-firm',
    cta: 'Explore Site',
  },
  {
    id: 'wildroot-skincare',
    title: 'Wildroot Botanicals',
    location: 'Portland, ME',
    description: 'Small-batch organic skincare with zero-waste packaging.',
    category: 'E-commerce',
    slug: '/skincare',
    cta: 'Live Demo',
  },
  {
    id: 'ember-yoga-studio',
    title: 'Ember Movement Studio',
    location: 'Santa Fe, NM',
    description: 'Trauma-informed yoga, workshops, and holistic wellness.',
    category: 'Content & Community',
    slug: '/yoga-studio',
    cta: 'Visit Site',
  },
  {
    id: 'coastal-arch-design',
    title: 'Coastal Frame Architecture',
    location: 'Charleston, SC',
    description: 'Sustainable residential design blending heritage & innovation.',
    category: 'Creative Portfolio',
    slug: '/architecture',
    cta: 'View Portfolio',
  },
];

export default function Home() {
  return (
    <PageWithChrome>
      {/* Hero */}
      <div className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Websites that <span className="text-indigo-600">actually convert</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Fast, affordable, and built for real Western small businesses—no templates, no fluff. Just results.
          </p>
          <div className="mt-10">
            <Link
              href="/vegan-bakery"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              See a Live Demo
              <ChevronRightIcon className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Built in Days, Not Months</h3>
              <p className="mt-2 text-gray-600">Launch a professional site in under a week—without sacrificing quality or speed.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No Template Feel</h3>
              <p className="mt-2 text-gray-600">Every site is custom-structured for your industry—contractors, coaches, bakers, and more.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Affordable for Small Biz</h3>
              <p className="mt-2 text-gray-600">High-impact design without enterprise pricing—because your budget matters.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Gallery */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Real Sites. Real Businesses.</h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Each demo is a fully functional, mobile-optimized website built for a specific niche.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {DEMOS.map((demo) => (
              <Link
                key={demo.id}
                href={demo.slug}
                className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <span className="inline-block px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full mb-3">
                    {demo.category}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {demo.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{demo.location}</p>
                  <p className="mt-3 text-gray-600 text-sm">{demo.description}</p>
                  <div className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 group-hover:underline">
                    {demo.cta}
                    <ChevronRightIcon className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600">
              Want a site like this for your business?
              <Link href="mailto:dave@whynowebsite.com" className="ml-1 font-medium text-indigo-600 hover:underline">
                Let’s talk.
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="py-12 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white">Stop settling for Wix clones.</h2>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
            Get a website that reflects your expertise, speaks to your clients, and works from day one.
          </p>
          <div className="mt-8">
            <Link
              href="/vegan-bakery"
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-base font-semibold rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Experience a Live Demo
            </Link>
          </div>
        </div>
      </div>
    </PageWithChrome>
  );
}

// Layout wrapper that applies consistent chrome (header, maybe footer later)
function PageWithChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow">{children}</main>
      {/* Optional: <Footer /> later */}
    </div>
  );
}