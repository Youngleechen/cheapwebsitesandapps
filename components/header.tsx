// components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsAdmin(user?.id === ADMIN_USER_ID);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.id === ADMIN_USER_ID);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuth = () => {
    if (user) {
      supabase.auth.signOut().then(() => {
        router.refresh();
      });
    } else {
      router.push('/auth/signin');
    }
  };

  const isHomepage = pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Back Link */}
          <div className="flex items-center">
            {isHomepage ? (
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
              >
                WhyNotWebsite.com
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center text-gray-900 hover:text-indigo-600 transition-colors group text-sm font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1.5 text-indigo-500 group-hover:-translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                All Demos
              </Link>
            )}
          </div>

          {/* Admin Auth Control (only visible to admin or when needed) */}
          {isAdmin || !user ? (
            <button
              onClick={handleAuth}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                user
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
              }`}
            >
              {user ? 'Logout' : 'Login'}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}