// app/get-started/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUSINESS_CATEGORIES = [
  'E-commerce / Online Store',
  'Restaurant or Cafe',
  'Service Business (e.g., plumbing, consulting)',
  'Creative Portfolio (artist, designer, photographer)',
  'Nonprofit or Charity',
  'Health & Wellness (clinic, gym, therapist)',
  'Real Estate',
  'Education or Coaching',
  'Tech Startup or SaaS',
  'Personal Blog or Brand',
  'Other',
];

export default function GetStartedPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    businessName: '',
    category: '',
    otherCategory: '',
    websiteGoal: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [inspirationName, setInspirationName] = useState<string | null>(null);

  // Read selected inspiration from localStorage
  useEffect(() => {
    const name = localStorage.getItem('selectedInspirationName');
    if (name) {
      setInspirationName(name);
    }
  }, []);

  useEffect(() => {
    if (formData.category === 'Other') {
      setShowOtherInput(true);
    } else {
      setShowOtherInput(false);
      setFormData((prev) => ({ ...prev, otherCategory: '' }));
    }
  }, [formData.category]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const finalCategory =
      formData.category === 'Other' && formData.otherCategory.trim()
        ? formData.otherCategory.trim()
        : formData.category;

    if (!finalCategory) {
      alert('Please select or specify a business category.');
      setIsSubmitting(false);
      return;
    }

    const client_access_token = crypto.randomUUID();

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          email: formData.email,
          business_name: formData.businessName,
          category: finalCategory,
          website_goal: formData.websiteGoal,
          description: formData.description,
          inspiration_template: inspirationName || null,
          client_access_token,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // ✅ Redirect to private dashboard
      router.push(`/project/${data.id}?token=${client_access_token}`);
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitStatus('error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-gray-200"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Let’s Build Your Website
            </h1>
            <p className="text-gray-600">
              Tell us about your business and vision—we’ll handle the rest.
            </p>

            {inspirationName && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg inline-block">
                <p className="text-sm text-amber-800 font-medium">
                  Inspired by: <span className="font-bold">{inspirationName}</span>
                </p>
              </div>
            )}
          </div>

          {submitStatus === 'error' && (
            <div className="mb-6 text-red-600 text-sm text-center font-medium">
              Something went wrong. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
                placeholder="you@yourbusiness.com"
              />
            </div>

            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
                placeholder="e.g., Bella’s Bakery"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Business Category *
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 appearance-none pr-10"
                >
                  <option value="">Select a category</option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {showOtherInput && (
              <div>
                <label htmlFor="otherCategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Please specify your business type *
                </label>
                <input
                  type="text"
                  id="otherCategory"
                  name="otherCategory"
                  value={formData.otherCategory}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Mobile Auto Repair, Vegan Meal Prep"
                />
              </div>
            )}

            <div>
              <label htmlFor="websiteGoal" className="block text-sm font-medium text-gray-700 mb-1">
                Primary Goal for Your Website *
              </label>
              <input
                type="text"
                id="websiteGoal"
                name="websiteGoal"
                value={formData.websiteGoal}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
                placeholder="e.g., Sell products online, attract local customers"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Tell Us More (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
                placeholder="Anything else? Timeline, competitors, design ideas, etc."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                isSubmitting
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? 'Sending...' : 'Submit Request'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}