'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Podcast episodes data - real-world content
const PODCAST_EPISODES = [
  {
    id: 'ep001',
    title: 'The Last Record Store in Detroit',
    description: 'Exploring the underground vinyl scene in Motor City with legendary DJ Marcus "Spin" Johnson. We visit three hidden shops keeping analog culture alive despite digital dominance.',
    duration: '48:21',
    date: '2024-11-15',
    artworkId: 'vinyl-detroit'
  },
  {
    id: 'ep002',
    title: 'Seattle\'s Secret Cassette Collective',
    description: 'Inside the basement studio where a collective of artists is reviving cassette culture. Meet the creators behind the underground tape scene and hear exclusive demos.',
    duration: '52:08',
    date: '2024-10-28',
    artworkId: 'cassette-seattle'
  },
  {
    id: 'ep003',
    title: 'New Orleans: Brass, Beats & Basement Sessions',
    description: 'From Preservation Hall to hidden speakeasies, we explore how New Orleans musicians are preserving tradition while creating the future of analog sound.',
    duration: '55:17',
    date: '2024-10-12',
    artworkId: 'nola-brass'
  },
  {
    id: 'ep004',
    title: 'The Analog Revolution in Brooklyn',
    description: 'How a new generation of Brooklyn artists is rejecting digital perfection in favor of warm, imperfect analog recordings. Featuring interviews with studio engineers and indie labels.',
    duration: '46:39',
    date: '2024-09-25',
    artworkId: 'brooklyn-analog'
  },
  {
    id: 'ep005',
    title: 'Austin\'s Hidden Turntable Haven',
    description: 'A journey through Austin\'s underground vinyl community, where record collectors, DJs, and musicians gather in secret locations to share rare finds and analog wisdom.',
    duration: '49:52',
    date: '2024-09-08',
    artworkId: 'austin-vinyl'
  },
  {
    id: 'ep006',
    title: 'Chicago\'s Jazz Cellar Revival',
    description: 'Inside the intimate jazz clubs of Chicago where analog recording equipment and live performance create magic that streaming can\'t replicate.',
    duration: '51:14',
    date: '2024-08-22',
    artworkId: 'chicago-jazz'
  }
];

// Gallery artwork definitions
const ARTWORKS = [
  { 
    id: 'vinyl-detroit', 
    title: 'The Last Record Store in Detroit',
    prompt: 'A warm, atmospheric photo of a small, cluttered vinyl record store in Detroit. Wooden shelves filled with records, vintage turntables on display, soft golden hour lighting filtering through a dusty window. A Black DJ in his 50s with glasses is carefully examining a record sleeve. The scene feels nostalgic and authentic, capturing the essence of analog culture preservation.'
  },
  { 
    id: 'cassette-seattle', 
    title: 'Seattle\'s Secret Cassette Collective',
    prompt: 'A moody, underground basement studio in Seattle filled with cassette tapes, reel-to-reel machines, and analog recording equipment. Soft neon lights cast a blue-purple glow on band posters and handmade tape labels. Three diverse young artists in their 20s are huddled around a mixing console, creating music. The atmosphere is creative, intimate, and slightly mysterious.'
  },
  { 
    id: 'nola-brass', 
    title: 'New Orleans: Brass, Beats & Basement Sessions',
    prompt: 'A vibrant scene of a New Orleans basement jazz session at night. Warm candlelight illuminates a small brass ensemble - trumpet, trombone, and tuba players in their 30s-60s. Vintage microphones, analog recording gear, and beads from Mardi Gras hang on the walls. The energy is electric, capturing the intersection of tradition and underground music culture.'
  },
  { 
    id: 'brooklyn-analog', 
    title: 'The Analog Revolution in Brooklyn',
    prompt: 'A modern Brooklyn recording studio filled with vintage analog equipment - tape machines, tube preamps, and warm wooden consoles. A diverse group of young musicians and engineers in their 20s-30s are collaborating. Large windows show the Brooklyn skyline at dusk. The space feels both professional and creatively chaotic, representing the revival of analog recording in the digital age.'
  },
  { 
    id: 'austin-vinyl', 
    title: 'Austin\'s Hidden Turntable Haven',
    prompt: 'A cozy, hidden vinyl listening room in Austin with exposed brick walls, string lights, and comfortable vintage furniture. Records cover every surface, and several people in their 20s-40s are sharing music on high-end turntables. The atmosphere is intimate and community-focused, with warm amber lighting creating a welcoming space for analog music lovers.'
  },
  { 
    id: 'chicago-jazz', 
    title: 'Chicago\'s Jazz Cellar Revival',
    prompt: 'An intimate Chicago jazz club basement during a late-night session. A small quartet plays under soft spotlight - saxophone, double bass, drums, and piano. Vintage analog recording equipment sits in the corner, ready to capture the performance. The audience is close, drinks in hand, completely absorbed. The mood is sophisticated yet underground, with rich blues and gold tones dominating the scene.'
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };
type Episode = typeof PODCAST_EPISODES[0];

export default function Page() {
  const [artworks, setArtworks] = useState<ArtworkState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check admin status and load images
  useEffect(() => {
    const initializePage = async () => {
      try {
        // Check user session
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user.id || null;
        setUserId(uid);
        setAdminMode(uid === ADMIN_USER_ID);
        
        // Load images
        await loadImages();
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, []);

  const loadImages = async () => {
    try {
      // Fetch ONLY gallery images for admin
      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        return;
      }

      const initialState: ArtworkState = {};
      ARTWORKS.forEach(art => initialState[art.id] = { image_url: '/placeholder-podcast.jpg' });

      if (images) {
        const latestImagePerArtwork: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            if (ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        // Build final state with only relevant artworks
        ARTWORKS.forEach(art => {
          if (latestImagePerArtwork[art.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerArtwork[art.id]).data.publicUrl;
            initialState[art.id] = { image_url: url };
          }
        });
      }

      setArtworks(initialState);
    } catch (err) {
      console.error('Error loading images:', err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(artworkId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${artworkId}/`;

      // Clean up OLD gallery images for this artwork
      const { data: existingImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (existingImages && existingImages.length > 0) {
        const pathsToDelete = existingImages.map(img => img.path);
        await Promise.all([
          supabase.storage.from('user_images').remove(pathsToDelete),
          supabase.from('images').delete().in('path', pathsToDelete)
        ]);
      }

      // Upload new image with gallery prefix
      const filePath = `${folderPath}${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setArtworks(prev => ({ ...prev, [artworkId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, artworkId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(artworkId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    // In a real app, this would call an API endpoint
    console.log('Subscribing email:', email);
    setIsSubscribed(true);
    setEmail('');
    
    // Show success message
    const successElement = document.getElementById('subscribe-success');
    if (successElement) {
      successElement.classList.remove('hidden');
      setTimeout(() => {
        successElement.classList.add('hidden');
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading The Analog Underground...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/30 border-b border-indigo-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white">
                AU
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                The Analog Underground
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#episodes" className="text-indigo-200 hover:text-white font-medium transition-colors">Episodes</Link>
              <Link href="#about" className="text-indigo-200 hover:text-white font-medium transition-colors">About</Link>
              <Link href="#community" className="text-indigo-200 hover:text-white font-medium transition-colors">Community</Link>
              
              <div className="flex items-center space-x-4">
                <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" 
                  className="text-indigo-200 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.75 17.48c-.47.26-1.05.39-1.65.39-1.53 0-3.02-.67-4.08-1.81-.98-1.05-1.56-2.48-1.56-3.98 0-.95.27-1.86.73-2.63.32-.53.75-.96 1.26-1.29.46-.3 1.01-.47 1.56-.47.53 0 1.02.17 1.43.44.39.26.69.67.83 1.14.16.53.09 1.11-.19 1.58-.28.48-.75.84-1.31.99-.57.14-1.11.02-1.52-.31a1.17 1.17 0 0 1-.42-.93c0-.52.21-1.02.58-1.39.37-.36.9-.56 1.42-.56.54 0 1.05.21 1.46.57.41.36.71.87.82 1.43h2.41c-.13-1.58-.81-3.02-1.9-4.11C15.66 5.81 14.1 5 12.42 5c-1.83 0-3.52.84-4.75 2.25-1.23 1.41-1.88 3.22-1.88 5.09 0 1.87.65 3.68 1.88 5.09 1.23 1.41 2.92 2.25 4.75 2.25.96 0 1.88-.24 2.71-.67.83-.43 1.54-1.08 2.01-1.89.47-.81.66-1.78.54-2.72-.11-.94-.46-1.8-.98-2.49-.52-.69-1.18-1.2-1.93-1.48-.75-.28-1.55-.33-2.29-.14-.74.19-1.41.59-1.91 1.13-.5.54-.82 1.22-.92 1.96-.1.74.02 1.5.34 2.16.32.66.85 1.2 1.53 1.53.68.33 1.46.42 2.19.26.73-.16 1.39-.54 1.91-1.06.52-.52.9-1.19 1.09-1.95.19-.76.18-1.57-.03-2.32h-2.41c-.23.48-.41.98-.54 1.49-.13.51-.19 1.03-.19 1.55 0 .52.06 1.03.19 1.53.13.5.31.98.54 1.44.1.21.26.37.47.44.21.07.44.04.64-.09.2-.13.34-.33.39-.56.05-.23.01-.48-.12-.69-.27-.45-.71-.77-1.21-.88-.5-.11-1.02-.01-1.44.27-.42.28-.73.69-.88 1.16-.15.47-.2 1.01-.14 1.53.06.52.22 1.01.48 1.43.26.42.61.77 1.03 1.02.42.25.9.4 1.39.4 1.41 0 2.74-.67 3.7-1.8 1.05-1.23 1.64-2.93 1.64-4.69 0-1.38-.35-2.7-.99-3.83-.64-1.13-1.55-2.01-2.62-2.57C14.84 5.48 13.66 5 12.42 5c-3.31 0-6 2.69-6 6s2.69 6 6 6c1.4 0 2.73-.48 3.83-1.32.33-.25.74-.22.99.1.25.33.22.74-.1 1l-2.3 2.3a.75.75 0 0 1-1.06 0 .75.75 0 0 1 0-1.06l1.47-1.47c-1.34 1.03-2.96 1.63-4.64 1.63-3.73 0-6.75-3.02-6.75-6.75S8.69 5.25 12.42 5.25c1.49 0 2.91.48 4.11 1.37z"/>
                  </svg>
                </a>
                <a href="https://podcasts.apple.com" target="_blank" rel="noopener noreferrer" 
                  className="text-indigo-200 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.38 1.26-1.46 2.58-3.02 2.58-1.29 0-1.63-.94-3.11-.94-1.48 0-1.87.94-3.03.94-1.56 0-2.69-1.32-3.03-2.58-.46-1.86-.73-3.67.76-5.44 1.39-1.64 3.53-2.3 5.35-2.3 1.82 0 3.92.66 5.31 2.3.67.8 1.12 1.7 1.39 2.65.14.52.18 1 .13 1.5-.04.57-.21 1.08-.7 1.43-.39.28-.82.3-1.23.09-.42-.21-.67-.58-.87-.99-.28-.57-.85-1.01-1.94-1.01-1.15 0-1.7.65-2.03 1.06-.33.41-.88.72-1.49.72-.66 0-.94-.44-1.49-1.1-1.82-2.19-4.67-2.46-6.52-2.46-1.3 0-2.84.53-3.92 1.99C1.75 14.81 1.44 17.42 3.17 19.5c1.54 1.86 3.77 3.04 6.27 3.04 2.69 0 5.22-1.33 6.45-3.62.32-.59.84-.94 1.49-.94.4 0 .81.21 1.05.59.24.38.21.9-.08 1.31zm1.49-12.04c.69 0 1.33-.26 1.82-.73.51-.5.76-1.17.7-1.88-.03-.38-.12-.74-.27-1.07-.28-.61-.78-1.06-1.39-1.26-.28-.09-.57-.14-.86-.14-1.05 0-2.01.9-2.36 2.26-.15.58-.05 1.16.25 1.67.31.51.76.89 1.3 1.1 1.03.02 1.55-.07 1.55-.07.13-.02.25-.05.35-.08.52-.15 1.02-.49 1.34-1 .33-.5.5-1.09.47-1.69-.02-.39-.11-.76-.26-1.09-.25-.54-.66-.95-1.19-1.18-.27-.12-.55-.17-.84-.17-.94 0-1.8.65-2.13 1.57-.19.53-.19 1.11 0 1.64.32.87 1.02 1.6 1.94 1.95.4.15.82.23 1.24.23z"/>
                  </svg>
                </a>
              </div>
            </nav>
            
            <button className="md:hidden text-indigo-200 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block px-4 py-1 bg-indigo-800/50 rounded-full mb-6 border border-indigo-700">
            <span className="text-indigo-300 font-medium">Exploring America's Hidden Analog Music Scenes</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Where Vinyl Meets Underground Culture
          </h1>
          
          <p className="text-xl text-indigo-200 mb-8">
            Join host Marcus Ken as we dig through record crates, basement studios, and hidden venues to uncover the artists, collectors, and communities keeping analog culture alive in the digital age.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-500/25">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Listen Now</span>
              </div>
            </button>
            
            <button className="bg-white/10 hover:bg-white/15 text-white font-bold py-3 px-8 rounded-full border border-indigo-400/30 transition-all duration-300">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Newsletter</span>
              </div>
            </button>
          </div>
          
          <div className="flex justify-center space-x-6 text-indigo-300">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">128</div>
              <div className="text-sm">Episodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">45K</div>
              <div className="text-sm">Monthly Listeners</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">98%</div>
              <div className="text-sm">Listener Retention</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Episode */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 bg-indigo-800/50 text-indigo-300 rounded-full text-sm font-medium mb-4">
            Featured Episode
          </span>
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Latest Underground Discoveries
          </h2>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-800/30 to-purple-800/30 rounded-2xl overflow-hidden border border-indigo-700/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative h-80 lg:h-auto">
              {artworks['vinyl-detroit']?.image_url && (
                <Image
                  src={artworks['vinyl-detroit'].image_url || '/placeholder-podcast.jpg'}
                  alt="The Last Record Store in Detroit - Featured Episode"
                  fill
                  className="object-cover"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/placeholder-podcast.jpg';
                  }}
                />
              )}
            </div>
            
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 bg-indigo-900 text-indigo-300 rounded-full text-xs font-medium">
                  EPISODE 128
                </span>
                <span className="text-indigo-300 text-sm">November 15, 2024</span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                The Last Record Store in Detroit
              </h3>
              
              <p className="text-indigo-200 mb-6 text-lg">
                Exploring the underground vinyl scene in Motor City with legendary DJ Marcus "Spin" Johnson. We visit three hidden shops keeping analog culture alive despite digital dominance.
              </p>
              
              <div className="flex items-center space-x-4 mb-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-900 bg-indigo-700 flex items-center justify-center text-xs font-bold">
                      {i}
                    </div>
                  ))}
                </div>
                <span className="text-indigo-300">48 minutes</span>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Play Episode</span>
                </button>
                
                <button className="bg-white/10 hover:bg-white/15 text-white font-bold py-3 px-6 rounded-lg border border-indigo-400/30 transition-all duration-300 flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>Save for Later</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Episodes Grid */}
      <section id="episodes" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 bg-indigo-800/50 text-indigo-300 rounded-full text-sm font-medium mb-4">
            Explore Episodes
          </span>
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Underground Sound Archives
          </h2>
          <p className="text-indigo-300 mt-4 max-w-2xl mx-auto">
            Dive into our catalog of episodes exploring America's vibrant analog music scenes. Each story uncovers hidden gems and the people behind them.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PODCAST_EPISODES.slice(1).map((episode) => {
            const artworkData = artworks[episode.artworkId] || { image_url: '/placeholder-podcast.jpg' };
            return (
              <div key={episode.id} className="bg-gradient-to-br from-indigo-800/20 to-purple-800/20 rounded-xl overflow-hidden border border-indigo-700/30 backdrop-blur-sm hover:border-indigo-600/50 transition-all duration-300 transform hover:-translate-y-1">
                <div className="relative h-48">
                  {artworkData.image_url && (
                    <Image
                      src={artworkData.image_url}
                      alt={episode.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/placeholder-podcast.jpg';
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="px-3 py-1 bg-indigo-900 text-indigo-300 rounded-full text-xs font-medium">
                      EPISODE {episode.id.replace('ep', '')}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-indigo-300 text-sm">{episode.date}</span>
                    <span className="text-indigo-300 text-sm">{episode.duration}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 hover:text-indigo-400 transition-colors cursor-pointer">
                    {episode.title}
                  </h3>
                  
                  <p className="text-indigo-200 mb-4 line-clamp-2">
                    {episode.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <button className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">Subscribe</span>
                    </button>
                    
                    <button className="w-10 h-10 rounded-full bg-indigo-900 hover:bg-indigo-800 flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-full transition-all duration-300 hover:scale-105">
            View All Episodes →
          </button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-950 to-purple-950/90">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1 bg-indigo-800/50 rounded-full mb-6 border border-indigo-700">
                <span className="text-indigo-300 font-medium">Our Mission</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Preserving Analog Culture in a Digital World
              </h2>
              
              <p className="text-indigo-200 mb-6 text-lg">
                The Analog Underground was born from a simple observation: while streaming dominates music consumption, there's a thriving underground movement of artists, collectors, and communities who believe in the magic of analog sound and physical media.
              </p>
              
              <p className="text-indigo-200 mb-8">
                We travel across America to document these hidden scenes - from basement recording studios in Brooklyn to vinyl collectors' warehouses in Detroit, from cassette tape revivalists in Seattle to jazz cellars in Chicago. Each episode is a love letter to the people keeping analog culture alive.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-800/50">
                  <div className="text-2xl font-bold text-indigo-400 mb-1">50+</div>
                  <div className="text-indigo-300">Cities Explored</div>
                </div>
                <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-800/50">
                  <div className="text-2xl font-bold text-indigo-400 mb-1">200+</div>
                  <div className="text-indigo-300">Artists Featured</div>
                </div>
              </div>
              
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 inline-flex items-center space-x-2">
                <span>Meet the Host</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="relative h-[500px] rounded-2xl overflow-hidden border border-indigo-700/50">
              {artworks['brooklyn-analog']?.image_url && (
                <Image
                  src={artworks['brooklyn-analog'].image_url || '/placeholder-podcast.jpg'}
                  alt="Marcus Henry in Brooklyn recording studio"
                  fill
                  className="object-cover"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/placeholder-podcast.jpg';
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 to-transparent"></div>
              <div className="absolute bottom-6 left-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full border-2 border-indigo-400 overflow-hidden">
                    <Image
                      src="/placeholder-host.jpg"
                      alt="Marcus Chen"
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Marcus Chen</h3>
                    <p className="text-indigo-300">Host & Creator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section id="community" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 bg-indigo-800/50 text-indigo-300 rounded-full text-sm font-medium mb-4">
            Join Our Community
          </span>
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Never Miss an Underground Discovery
          </h2>
          <p className="text-indigo-300 mt-4">
            Get exclusive access to bonus content, early episode releases, and behind-the-scenes stories from our analog adventures across America.
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubscribe} className="bg-gradient-to-br from-indigo-800/30 to-purple-800/30 rounded-2xl p-6 md:p-8 border border-indigo-700/50 backdrop-blur-sm">
            <div className="mb-6">
              <label htmlFor="email" className="block text-indigo-300 mb-2 text-sm">
                Your Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-indigo-900/50 border border-indigo-700/50 rounded-lg text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-indigo-600 rounded border-indigo-700/50 bg-indigo-900/50"
                  defaultChecked
                />
                <span className="text-indigo-200">Send me occasional updates about exclusive content and events</span>
              </label>
            </div>
            
            <button
              type="submit"
              className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] ${isSubscribed ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSubscribed}
            >
              {isSubscribed ? '✅ Subscribed Successfully!' : 'Join the Underground →'}
            </button>
            
            <div id="subscribe-success" className="mt-4 text-center text-green-400 font-medium hidden">
              ✨ Welcome to The Analog Underground! Check your email for confirmation.
            </div>
            
            <p className="mt-4 text-center text-indigo-400 text-sm">
              We respect your privacy. No spam, ever. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </section>

      {/* Gallery Section - Admin Image Management */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-950 to-purple-950/90">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-indigo-800/50 text-indigo-300 rounded-full text-sm font-medium mb-4">
              {adminMode ? 'Admin Gallery Management' : 'Behind the Scenes'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              {adminMode ? 'Episode Artwork Management' : 'Visual Stories from the Field'}
            </h2>
            <p className="text-indigo-300 mt-4 max-w-2xl mx-auto">
              {adminMode 
                ? 'Upload and manage episode artwork. Use the AI prompts to generate consistent, high-quality images for each episode.' 
                : 'Authentic moments captured during our underground music explorations across America.'}
            </p>
          </div>
          
          {/* Reusing the GallerySkeleton component logic but integrated into the page */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ARTWORKS.map((art) => {
              const artworkData = artworks[art.id] || { image_url: null };
              const imageUrl = artworkData.image_url;

              return (
                <div key={art.id} className="bg-indigo-900/30 rounded-lg overflow-hidden flex flex-col border border-indigo-800/50">
                  {imageUrl ? (
                    <div className="relative h-64">
                      <Image
                        src={imageUrl}
                        alt={art.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/placeholder-gallery.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-bold text-white">{art.title}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-indigo-900/40 flex items-center justify-center">
                      <span className="text-indigo-400">No artwork uploaded</span>
                    </div>
                  )}

                  {adminMode && (
                    <div className="p-4 border-t border-indigo-800/50 space-y-3 bg-indigo-900/20">
                      {!imageUrl && (
                        <div className="flex flex-col gap-3">
                          <p className="text-xs text-indigo-300 line-clamp-2">{art.prompt}</p>
                          <button
                            onClick={() => copyPrompt(art.prompt, art.id)}
                            className="text-xs bg-indigo-800 hover:bg-indigo-700 text-indigo-200 px-3 py-1.5 rounded self-start transition-colors"
                            type="button"
                          >
                            {copiedId === art.id ? 'Copied!' : 'Copy Prompt'}
                          </button>
                        </div>
                      )}
                      <label className="block text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded cursor-pointer inline-block w-full text-center hover:opacity-90 transition-opacity">
                        {uploading === art.id ? 'Uploading…' : 'Upload Artwork'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, art.id)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {adminMode && (
            <div className="mt-8 p-4 bg-indigo-900/30 border border-indigo-700 rounded-lg text-sm text-indigo-300">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Admin mode active — Upload episode artwork here. Each image should represent the episode's theme and location. 
                  Use the AI prompts as a starting point for consistent visual storytelling. 
                  Images are automatically optimized and served via CDN.
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-950 to-purple-950 border-t border-indigo-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white">
                  AU
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  The Analog Underground
                </span>
              </div>
              <p className="text-indigo-300 mb-4">
                Exploring America's hidden analog music scenes. Documenting the artists, collectors, and communities keeping vinyl, cassette, and reel-to-reel culture alive in the digital age.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-indigo-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.265.058 2.15.262 2.916.592.767.329 1.428.813 2.088 1.473.66.66 1.144 1.321 1.473 2.088.33.766.534 1.651.592 2.916.058 1.265.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.058 1.265-.262 2.15-.592 2.916-.33.767-.813 1.428-1.473 2.088-.66.66-1.321 1.144-2.088 1.473-.767.33-1.651.534-2.916.592-1.265.058-1.645.07-4.85.07s-3.584-.012-4.85-.07c-1.265-.058-2.15-.262-2.916-.592-.767-.33-1.428-.813-2.088-1.473-.66-.66-1.144-1.321-1.473-2.088-.33-.767-.534-1.651-.592-2.916-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.058-1.265.262-2.15.592-2.916.33-.767.813-1.428 1.473-2.088.66-.66 1.321-1.144 2.088-1.473.767-.33 1.651-.534 2.916-.592 1.265-.058 1.645-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.28.058-2.206.262-2.988.592-.782.33-1.484.814-2.144 1.474-.66.66-1.144 1.362-1.474 2.144-.33.782-.534 1.708-.592 2.988-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.058 1.28.262 2.206.592 2.988.33.782.814 1.484 1.474 2.144.66.66 1.362 1.144 2.144 1.474.782.33 1.708.534 2.988.592 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.28-.058 2.206-.262 2.988-.592.782-.33 1.484-.814 2.144-1.474.66-.66 1.144-1.362 1.474-2.144.33-.782.534-1.708.592-2.988.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.058-1.28-.262-2.206-.592-2.988-.33-.782-.814-1.484-1.474-2.144-.66-.66-1.362-1.144-2.144-1.474-.782-.33-1.708-.534-2.988-.592-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="text-indigo-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.959-2.173-1.559-3.591-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .382.042.759.127 1.123-4.113-.204-7.718-2.175-10.147-5.138-.432.742-.676 1.604-.676 2.523 0 1.708.867 3.219 2.188 4.095-.789-.025-1.533-.241-2.163-.622v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.398 0-.79-.023-1.175-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z" />
                  </svg>
                </a>
                <a href="#" className="text-indigo-400 hover:text-white transition-colors">
                  <span className="sr-only">YouTube</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Listen On
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="https://open.spotify.com" className="text-indigo-300 hover:text-white transition-colors flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.75 17.48c-.47.26-1.05.39-1.65.39-1.53 0-3.02-.67-4.08-1.81-.98-1.05-1.56-2.48-1.56-3.98 0-.95.27-1.86.73-2.63.32-.53.75-.96 1.26-1.29.46-.3 1.01-.47 1.56-.47.53 0 1.02.17 1.43.44.39.26.69.67.83 1.14.16.53.09 1.11-.19 1.58-.28.48-.75.84-1.31.99-.57.14-1.11.02-1.52-.31a1.17 1.17 0 0 1-.42-.93c0-.52.21-1.02.58-1.39.37-.36.9-.56 1.42-.56.54 0 1.05.21 1.46.57.41.36.71.87.82 1.43h2.41c-.13-1.58-.81-3.02-1.9-4.11C15.66 5.81 14.1 5 12.42 5c-1.83 0-3.52.84-4.75 2.25-1.23 1.41-1.88 3.22-1.88 5.09 0 1.87.65 3.68 1.88 5.09 1.23 1.41 2.92 2.25 4.75 2.25.96 0 1.88-.24 2.71-.67.83-.43 1.54-1.08 2.01-1.89.47-.81.66-1.78.54-2.72-.11-.94-.46-1.8-.98-2.49-.52-.69-1.18-1.2-1.93-1.48-.75-.28-1.55-.33-2.29-.14-.74.19-1.41.59-1.91 1.13-.5.54-.82 1.22-.92 1.96-.1.74.02 1.5.34 2.16.32.66.85 1.2 1.53 1.53.68.33 1.46.42 2.19.26.73-.16 1.39-.54 1.91-1.06.52-.52.9-1.19 1.09-1.95.19-.76.18-1.57-.03-2.32h-2.41c-.23.48-.41.98-.54 1.49-.13.51-.19 1.03-.19 1.55 0 .52.06 1.03.19 1.53.13.5.31.98.54 1.44.1.21.26.37.47.44.21.07.44.04.64-.09.2-.13.34-.33.39-.56.05-.23.01-.48-.12-.69-.27-.45-.71-.77-1.21-.88-.5-.11-1.02-.01-1.44.27-.42.28-.73.69-.88 1.16-.15.47-.2 1.01-.14 1.53.06.52.22 1.01.48 1.43.26.42.61.77 1.03 1.02.42.25.9.4 1.39.4 1.41 0 2.74-.67 3.7-1.8 1.05-1.23 1.64-2.93 1.64-4.69 0-1.38-.35-2.7-.99-3.83-.64-1.13-1.55-2.01-2.62-2.57C14.84 5.48 13.66 5 12.42 5c-3.31 0-6 2.69-6 6s2.69 6 6 6c1.4 0 2.73-.48 3.83-1.32.33-.25.74-.22.99.1.25.33.22.74-.1 1l-2.3 2.3a.75.75 0 0 1-1.06 0 .75.75 0 0 1 0-1.06l1.47-1.47c-1.34 1.03-2.96 1.63-4.64 1.63-3.73 0-6.75-3.02-6.75-6.75S8.69 5.25 12.42 5.25c1.49 0 2.91.48 4.11 1.37z"/>
                    </svg>
                    <span>Spotify</span>
                  </a>
                </li>
                <li>
                  <a href="https://podcasts.apple.com" className="text-indigo-300 hover:text-white transition-colors flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.38 1.26-1.46 2.58-3.02 2.58-1.29 0-1.63-.94-3.11-.94-1.48 0-1.87.94-3.03.94-1.56 0-2.69-1.32-3.03-2.58-.46-1.86-.73-3.67.76-5.44 1.39-1.64 3.53-2.3 5.35-2.3 1.82 0 3.92.66 5.31 2.3.67.8 1.12 1.7 1.39 2.65.14.52.18 1 .13 1.5-.04.57-.21 1.08-.7 1.43-.39.28-.82.3-1.23.09-.42-.21-.67-.58-.87-.99-.28-.57-.85-1.01-1.94-1.01-1.15 0-1.7.65-2.03 1.06-.33.41-.88.72-1.49.72-.66 0-.94-.44-1.49-1.1-1.82-2.19-4.67-2.46-6.52-2.46-1.3 0-2.84.53-3.92 1.99C1.75 14.81 1.44 17.42 3.17 19.5c1.54 1.86 3.77 3.04 6.27 3.04 2.69 0 5.22-1.33 6.45-3.62.32-.59.84-.94 1.49-.94.4 0 .81.21 1.05.59.24.38.21.9-.08 1.31zm1.49-12.04c.69 0 1.33-.26 1.82-.73.51-.5.76-1.17.7-1.88-.03-.38-.12-.74-.27-1.07-.28-.61-.78-1.06-1.39-1.26-.28-.09-.57-.14-.86-.14-1.05 0-2.01.9-2.36 2.26-.15.58-.05 1.16.25 1.67.31.51.76.89 1.3 1.1 1.03.02 1.55-.07 1.55-.07.13-.02.25-.05.35-.08.52-.15 1.02-.49 1.34-1 .33-.5.5-1.09.47-1.69-.02-.39-.11-.76-.26-1.09-.25-.54-.66-.95-1.19-1.18-.27-.12-.55-.17-.84-.17-.94 0-1.8.65-2.13 1.57-.19.53-.19 1.11 0 1.64.32.87 1.02 1.6 1.94 1.95.4.15.82.23 1.24.23z"/>
                    </svg>
                    <span>Apple Podcasts</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-indigo-300 hover:text-white transition-colors flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                    </svg>
                    <span>Google Podcasts</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-indigo-300 hover:text-white transition-colors flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                    </svg>
                    <span>Amazon Music</span>
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#episodes" className="text-indigo-300 hover:text-white transition-colors">
                    All Episodes
                  </Link>
                </li>
                <li>
                  <Link href="#about" className="text-indigo-300 hover:text-white transition-colors">
                    About the Show
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-indigo-300 hover:text-white transition-colors">
                    Support the Show
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-indigo-300 hover:text-white transition-colors">
                    Contact & Press
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-indigo-300 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-indigo-800/50 text-center text-indigo-400 text-sm">
            <p>© {new Date().getFullYear()} The Analog Underground. All rights reserved. Handcrafted with ❤️ for analog music lovers.</p>
            <p className="mt-2">Recorded in studios across America. Artwork generated with AI assistance and human curation.</p>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold w-16 h-16 rounded-full shadow-lg shadow-indigo-500/25 flex items-center justify-center transition-all duration-300 hover:scale-110 animate-pulse">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}