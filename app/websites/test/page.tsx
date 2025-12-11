'use client';

import { useState } from 'react';

export default function AustinFoundationRepairPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // In a real app, this would POST to an API route or third-party CRM
    // For demo, we simulate success
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitStatus('success');
      (e.target as HTMLFormElement).reset();
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-sans bg-gray-50 text-gray-800">
      {/* Hero */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <h1 className="text-3xl md:text-5xl font-bold max-w-3xl mx-auto">
            Trusted Foundation Repair in Austin — <span className="text-orange-400">Free Inspection</span>
          </h1>
          <p className="mt-4 text-lg max-w-2xl mx-auto opacity-90">
            Licensed, insured, and BBB-accredited. Same-day assessments. 150+ homes stabilized since 2018.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="tel:+15125550199"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition"
            >
              Call Now: (512) 555-0199
            </a>
            <a
              href="#contact"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-bold py-3 px-8 rounded-lg text-lg transition"
            >
              Get Free Estimate
            </a>
          </div>
        </div>
      </header>

      {/* Trust Badges */}
      <div className="bg-white py-4 border-b">
        <div className="container mx-auto px-4 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            BBB Accredited
          </span>
          <span>✅ Licensed & Insured (TX #123456)</span>
          <span>🏠 150+ Austin Homes Repaired</span>
          <span>⏱️ Same-Day Inspections</span>
        </div>
      </div>

      {/* Services */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold">Signs You Need Foundation Repair</h2>
            <p className="mt-3 text-gray-600">
              Ignoring these can lead to structural damage, plumbing leaks, and decreased home value.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Cracks in walls or floors',
              'Sticking doors/windows',
              'Sloping or uneven floors',
              'Gaps around door frames',
              'Cracks in exterior brick',
              'Pooling water near foundation',
            ].map((item, i) => (
              <div key={i} className="p-5 border border-gray-200 rounded-lg hover:shadow-md transition">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                  <span className="text-orange-600 font-bold">{i + 1}</span>
                </div>
                <h3 className="font-semibold">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Gallery */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold">Real Austin Home Repairs</h2>
            <p className="mt-3 text-gray-600">All work performed by our in-house team — no subcontractors.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { before: '/austin-foundation-repair/before-1.jpg', after: '/austin-foundation-repair/after-1.jpg', location: 'South Congress' },
              { before: '/austin-foundation-repair/before-2.jpg', after: '/austin-foundation-repair/after-2.jpg', location: 'Cedar Park' },
            ].map((project, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="grid grid-cols-2 h-48">
                  <div className="relative">
                    <img
                      src={project.before}
                      alt="Before repair"
                      className="w-full h-full object-cover"
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-center py-1 text-sm">Before</div>
                  </div>
                  <div className="relative">
                    <img
                      src={project.after}
                      alt="After repair"
                      className="w-full h-full object-cover"
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-center py-1 text-sm">After</div>
                  </div>
                </div>
                <div className="p-3 text-center text-gray-700 text-sm">{project.location}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="py-16 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Get Your Free Foundation Inspection</h2>
            <p className="mt-3 opacity-90">Licensed engineer will assess your home — no obligation.</p>
          </div>
          {submitStatus === 'success' ? (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold text-green-300">Thank you!</h3>
              <p>We’ll call you within 1 hour to schedule your free inspection.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                required
                className="px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="tel"
                placeholder="Phone (e.g. 512-555-0199)"
                required
                className="px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                placeholder="Address or Neighborhood"
                required
                className="px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 md:col-span-2"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="md:col-span-2 bg-orange-500 hover:bg-orange-600 py-3 px-6 rounded-lg font-bold transition disabled:opacity-70"
              >
                {isSubmitting ? 'Sending...' : 'Request Free Inspection'}
              </button>
              {submitStatus === 'error' && (
                <p className="md:col-span-2 text-red-300 text-center">Failed to send. Please try again.</p>
              )}
            </form>
          )}
          <div className="mt-8 text-center text-sm opacity-75">
            📞 Prefer to call? <a href="tel:+15125550199" className="underline">Call (512) 555-0199</a> — we answer 24/7 for emergencies.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-sm">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Austin Foundation Repair Pros. Licensed in Texas (#123456). BBB Accredited.</p>
          <p className="mt-2">Serving Austin, Round Rock, Cedar Park, and Pflugerville since 2018.</p>
        </div>
      </footer>
    </div>
  );
}