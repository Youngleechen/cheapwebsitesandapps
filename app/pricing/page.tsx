'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, Shield, Crown, Zap, Star, CheckCircle, MessageCircle, Mail } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';

export default function PricingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'quick' | 'starter' | 'growth'>('quick');
  const { scrollY } = useScroll();
  const backgroundOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);
  const heroScale = useTransform(scrollY, [0, 200], [1, 0.98]);

  // Check admin status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Updated pricing plans
  const plans = [
    {
      id: 'quick',
      name: 'Quick Launch',
      price: 69,
      period: 'one-time',
      description: 'Professional 5-page website — live in 2 days!',
      features: [
        '5 responsive pages (Home, About, Services, Portfolio, Contact)',
        'Mobile-friendly & fast loading',
        'Contact form included',
        'Clean, modern design',
        'Go live in 48 hours',
        'One-time payment — no monthly fees'
      ],
      mostPopular: true,
      icon: <Zap className="h-6 w-6 text-green-500" />,
      gradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      buttonColor: 'from-green-500 to-emerald-600'
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 299,
      period: 'one-time',
      description: 'Editable website with easy content updates',
      features: [
        'Everything in Quick Launch',
        'Up to 7 pages',
        'Simple CMS to edit text & images anytime',
        'Google Analytics + SEO setup',
        '2 rounds of revisions',
        '30-day support'
      ],
      mostPopular: false,
      icon: <Shield className="h-6 w-6 text-indigo-500" />,
      gradient: 'from-indigo-50 to-blue-50',
      borderColor: 'border-indigo-200',
      buttonColor: 'from-indigo-500 to-blue-600'
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 599,
      period: 'one-time',
      description: 'Advanced site with blog or shop-ready features',
      features: [
        'Everything in Starter',
        'Up to 10 pages + blog or product listings',
        'Social/media embeds',
        'Performance & security optimization',
        'E-commerce ready (Stripe + Supabase)',
        '3 rounds of revisions',
        '60-day priority support'
      ],
      mostPopular: false,
      icon: <Star className="h-6 w-6 text-purple-500" />,
      gradient: 'from-purple-50 to-fuchsia-50',
      borderColor: 'border-purple-200',
      buttonColor: 'from-purple-500 to-fuchsia-600'
    }
  ];

  // FAQ items
  const faqs = [
    {
      question: "How fast will my site go live?",
      answer: "Our Quick Launch plan gets your 5-page website live in just 48 hours! Just send us your text and images, and we handle the rest."
    },
    {
      question: "Do I need to know coding or tech?",
      answer: "Not at all! You just provide your content (text and photos), and we build and launch everything for you. It’s completely hands-off."
    },
    {
      question: "Are there any monthly fees?",
      answer: "No! All plans are one-time payments. You own your website outright. Hosting is included for the first year — after that, it’s just $12/year if you stay with us (or move it anywhere)."
    },
    {
      question: "What if I want to make changes later?",
      answer: "The Starter and Growth plans include a simple dashboard so you can update text and images anytime. For Quick Launch, we offer affordable edits at $25/hour."
    },
    {
      question: "Can I see examples before ordering?",
      answer: "Yes! We’ll show you live samples of recent sites during your onboarding. Every site is custom-built — no generic templates."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.div 
        style={{ opacity: backgroundOpacity, scale: heroScale }}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[size:60px_60px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20"
            >
              <Zap className="h-4 w-4 text-yellow-300 mr-2" />
              <span className="text-indigo-200 font-medium text-sm">
                Live in 48 Hours — Starting at $69
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6 leading-tight"
            >
              Real Websites. <span className="text-yellow-300">From Just $69.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-indigo-100/90 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              No subscriptions. No hidden fees. Just a fast, beautiful website — ready in 2 days.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link
                href="/get-started"
                className="group relative px-8 py-4 bg-gradient-to-r from-white to-indigo-100 text-indigo-900 font-semibold rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                href="/contact"
                className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Talk to Us First
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-indigo-900 to-transparent pointer-events-none" />
      </motion.div>

      {/* Pricing Tiers Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-full font-medium text-sm mb-4"
          >
            <Shield className="h-4 w-4 mr-2" />
            One-Time Payment. No Surprises.
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-indigo-800 mb-4"
          >
            Simple Plans. <span className="text-indigo-600">Real Results.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Choose the perfect fit — all websites are custom-built, mobile-ready, and yours forever.
          </motion.p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className={`relative bg-white rounded-2xl overflow-hidden shadow-xl border-2 ${plan.borderColor} ${
                plan.mostPopular ? 'ring-4 ring-green-400/50 scale-105' : ''
              }`}
            >
              {plan.mostPopular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl z-10">
                  MOST POPULAR
                </div>
              )}
              
              <div className={`p-8 ${plan.gradient}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    {plan.icon}
                    <h3 className="text-2xl font-bold text-gray-900 ml-3">{plan.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <div className="text-gray-600 mt-1">one-time</div>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <Link
                  href="/get-started"
                  className={`w-full inline-block text-center py-4 rounded-xl font-semibold text-white bg-gradient-to-r ${plan.buttonColor} hover:opacity-90 transition-opacity`}
                >
                  Get Started
                </Link>
              </div>
              
              <div className="p-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <Link
                    href="/contact"
                    className="flex items-center justify-center text-green-600 font-medium hover:text-green-800 transition-colors"
                  >
                    <span>Have special needs?</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Got Questions?</h2>
            <p className="text-gray-600">
              We’ve got simple answers.
            </p>
          </motion.div>
          
          <div className="space-y-5">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
              >
                <button 
                  className="flex items-center justify-between w-full text-left focus:outline-none"
                  onClick={() => setSelectedPlan(prev => prev === faq.question ? null : faq.question as any)}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: selectedPlan === faq.question ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-green-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>
                <AnimatePresence>
                  {selectedPlan === faq.question && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-3 text-gray-600 text-sm pl-1 overflow-hidden"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-indigo-900 to-purple-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
              Ready to Launch Your Website?
            </h2>
            <p className="text-lg text-indigo-100/90 mb-8 max-w-xl mx-auto">
              Get started today — your first step takes less than 2 minutes.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/get-started"
                className="inline-flex items-center px-10 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                <span>Start Your Site Now — Only $69</span>
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
            
            <p className="mt-6 text-indigo-200/80 text-sm">
              No risk. No monthly fees. Cancel anytime (though you’ll own it forever!).
            </p>
          </motion.div>
        </div>
      </div>

      {/* Admin mode indicator */}
      <AnimatePresence>
        {adminMode && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-5 py-2.5 rounded-xl shadow-lg text-sm font-medium z-50 flex items-center gap-2 backdrop-blur-sm"
          >
            <Shield className="h-4 w-4" />
            <span>Admin Mode</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}