// components/AutoInspirationPanel.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Wand2, Sparkles } from 'lucide-react';

const WEBSITE_EXAMPLE_PATH_PREFIX = '/websites/';

const WEBSITE_NAME_MAP: Record<string, string> = {
  'coffee-roastery': 'Gourmet Coffee Roastery',
  'law-firm': 'Modern Law Firm',
  'fitness-studio': 'Urban Fitness Studio',
  // Add more as needed
};

export default function AutoInspirationPanel() {
  const pathname = usePathname();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [websiteId, setWebsiteId] = useState('');
  const [websiteName, setWebsiteName] = useState('');

  // 1. Detect if on a /websites/:slug page
  useEffect(() => {
    if (pathname?.startsWith(WEBSITE_EXAMPLE_PATH_PREFIX)) {
      const slug = pathname.replace(WEBSITE_EXAMPLE_PATH_PREFIX, '').split('/')[0];
      if (slug && slug !== '') {
        setWebsiteId(slug);
        setWebsiteName(
          WEBSITE_NAME_MAP[slug] ||
          slug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())
        );
        setIsEligible(true);
        return;
      }
    }
    setIsEligible(false);
    setIsVisible(false);
    setIsExpanded(false);
  }, [pathname]);

  // 2. Detect scroll
  const handleScroll = useCallback(() => {
    if (window.scrollY > 50 && !hasScrolled) {
      setHasScrolled(true);
    }
  }, [hasScrolled]);

  // 3. Start timer after scroll + eligibility
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;
    let showTimer: NodeJS.Timeout | null = null;

    if (isEligible && hasScrolled) {
      // Delay showing panel by 5 seconds after scroll begins
      showTimer = setTimeout(() => {
        setIsVisible(true);
        setIsExpanded(true);
      }, 5000);
    }

    // Set up scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
      if (showTimer) clearTimeout(showTimer);
    };
  }, [isEligible, hasScrolled, handleScroll]);

  // 4. Auto-collapse after 3 seconds if expanded
  useEffect(() => {
    let collapseTimer: NodeJS.Timeout | null = null;
    if (isVisible && isExpanded) {
      collapseTimer = setTimeout(() => {
        setIsExpanded(false);
      }, 4000);
    }
    return () => {
      if (collapseTimer) clearTimeout(collapseTimer);
    };
  }, [isVisible, isExpanded]);

  const handleCreate = () => {
    localStorage.setItem('selectedWebsiteTemplate', websiteId);
    localStorage.setItem('selectedWebsiteName', websiteName);
    window.location.href = '/get-started';
  };

  const toggleExpanded = () => {
    if (isVisible) {
      setIsExpanded((prev) => !prev);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-16 right-6 z-50">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white shadow-xl rounded-l-lg border border-gray-200 p-4 space-y-3 min-w-[224px]"
          >
            <a
              href="/websites"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-amber-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              View More Websites
            </a>

            <button
              onClick={handleCreate}
              className="w-full bg-amber-700 text-white text-sm font-bold py-2.5 px-3 rounded hover:bg-amber-800 transition flex items-center justify-center gap-2"
            >
              <Wand2 className="h-4 w-4" />
              Create Me This Website
            </button>

            <button
              onClick={toggleExpanded}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleExpanded}
            className="relative bg-amber-700 text-white rounded-full p-3 shadow-lg hover:bg-amber-800 transition"
            aria-label="Open inspiration panel"
          >
            <Sparkles className="h-5 w-5" />
            {/* Notification indicator */}
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}