// components/Header.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const loginPromptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowLoginPrompt(false);
        if (loginPromptTimeoutRef.current) {
          clearTimeout(loginPromptTimeoutRef.current);
        }
      }
    });

    loginPromptTimeoutRef.current = setTimeout(() => {
      if (!user) {
        setShowLoginPrompt(true);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      if (loginPromptTimeoutRef.current) {
        clearTimeout(loginPromptTimeoutRef.current);
      }
    };
  }, [user]);

  const handleAuth = () => {
    if (user) {
      supabase.auth.signOut().then(() => {
        router.refresh();
      });
    } else {
      router.push('/auth/signin');
    }
  };

  const dismissPrompt = () => {
    setShowLoginPrompt(false);
    if (loginPromptTimeoutRef.current) {
      clearTimeout(loginPromptTimeoutRef.current);
    }
  };

  // Updated nav for whynowebsite.com
  const navItems = [
    { name: 'Showcase', href: '/websites' },
    { name: 'Build Yours', href: '/builder' },
    { name: 'Inspiration', href: '/inspiration' },
    { name: 'Blog', href: '/blog' },
    { name: 'About', href: '/about' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                aria-label="WhyNowWebsite Home"
              >
                <span className="text-indigo-600">Why</span>
                <span className="font-mono">Now</span>
                <span className="text-gray-500">.website</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleAuth}
                className={`ml-3 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  user
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow hover:shadow-md'
                }`}
              >
                {user ? 'Account' : 'Get Started'}
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2.5 rounded-lg font-medium ${
                      pathname === item.href
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    handleAuth();
                    setIsMenuOpen(false);
                  }}
                  className={`mt-3 px-4 py-2.5 rounded-lg font-semibold text-center ${
                    user
                      ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {user ? 'My Account' : 'Get Started'}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Login Prompt – Brand-aligned */}
      {showLoginPrompt && !user && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:p-6">
          <div
            className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
            onClick={dismissPrompt}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full transform transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Build your standout website</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Log in to save your custom designs, manage projects, and publish with confidence.
                </p>
              </div>
              <button
                onClick={dismissPrompt}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close prompt"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <button
                onClick={dismissPrompt}
                className="px-3.5 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Not now
              </button>
              <button
                onClick={() => {
                  dismissPrompt();
                  handleAuth();
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                Start Building
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}