'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Zap, Brain, Target, MessageSquare, Shield, Star } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery_scriptflow';

// Define all artwork prompts for the AI writing assistant theme
const ARTWORKS = [
  { 
    id: 'hero-illustration', 
    title: 'Hero Illustration',
    prompt: 'A modern, sleek dashboard interface showing AI-generated content with floating text bubbles, neural network connections, and clean UI elements. Use a professional blue and purple gradient color scheme with subtle glowing effects.'
  },
  { 
    id: 'features-visualization', 
    title: 'Features Visualization',
    prompt: 'An abstract visualization of AI writing capabilities showing interconnected nodes representing different writing styles (business, creative, technical) with flowing text streams connecting them. Use a sophisticated dark mode aesthetic with cyan and magenta accents.'
  },
  { 
    id: 'team-collaboration', 
    title: 'Team Collaboration',
    prompt: 'A diverse team of professionals collaborating on content creation with AI assistance. Show a modern office environment with people working on laptops displaying AI writing interfaces, with holographic text floating above their screens. Warm, inviting lighting with professional atmosphere.'
  },
  { 
    id: 'mobile-preview', 
    title: 'Mobile Preview',
    prompt: 'A realistic smartphone mockup showing the ScriptFlow AI mobile app interface with content generation in progress. Show the app on a marble surface with soft shadows, surrounded by coffee cup and notebook for authentic workspace feel. Clean, minimalist design.'
  },
  { 
    id: 'analytics-dashboard', 
    title: 'Analytics Dashboard',
    prompt: 'A professional analytics dashboard displaying content performance metrics, AI suggestions, and engagement data. Show charts, graphs, and data visualizations with a modern UI design using dark blue and gold accent colors. Corporate, trustworthy aesthetic.'
  },
  { 
    id: 'testimonial-background', 
    title: 'Testimonial Background',
    prompt: 'An abstract background pattern representing trust and credibility, with subtle geometric shapes forming a network pattern. Use soft gradients of teal and navy blue with gentle light effects to create a professional, calming atmosphere for testimonials section.'
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };

// Gallery Skeleton Component (adapted for ScriptFlow AI)
function GallerySkeleton() {
  const [artworks, setArtworks] = useState<ArtworkState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      // Fetch ONLY gallery images for admin
      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`) // Critical filter
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        return;
      }

      const initialState: ArtworkState = {};
      ARTWORKS.forEach(art => initialState[art.id] = { image_url: null });

      if (images) {
        const latestImagePerArtwork: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          // Path structure: [user_id, gallery_prefix, artwork_id, filename]
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            // Only consider defined artworks and take the latest
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
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(artworkId);
    try {
      // New path structure with gallery identifier
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

  // Create a utility function to get image URL with fallback
  const getImageUrl = (artworkId: string): string | null => {
    const artwork = artworks[artworkId];
    return artwork?.image_url || null;
  };

  // Return the utility functions and state needed by the main component
  return {
    adminMode,
    uploading,
    copiedId,
    handleUpload,
    copyPrompt,
    getImageUrl
  };
}

// Main ScriptFlow AI Page Component
export default function ScriptFlowAIPage() {
  // Initialize gallery skeleton functionality
  const gallery = GallerySkeleton();
  
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Feature data with AI-generated content capabilities
  const features = [
    {
      id: 'content-generation',
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      title: 'Smart Content Generation',
      description: 'Generate high-quality blog posts, articles, and marketing copy in seconds with AI that understands your brand voice and industry context.',
      prompt: 'A dynamic content generation interface showing AI writing process with text appearing in real-time, surrounded by content strategy icons and brand voice settings. Modern UI with blue and white color scheme.'
    },
    {
      id: 'seo-optimization',
      icon: <Target className="w-6 h-6 text-green-400" />,
      title: 'SEO Intelligence',
      description: 'Built-in SEO analysis that suggests keywords, optimizes content structure, and tracks performance to help your content rank higher in search results.',
      prompt: 'An SEO dashboard visualization showing keyword density analysis, content optimization suggestions, and ranking metrics with upward trending graphs. Professional green and white color palette with data visualization elements.'
    },
    {
      id: 'tone-adaptation',
      icon: <MessageSquare className="w-6 h-6 text-purple-400" />,
      title: 'Tone Adaptation',
      description: 'Automatically adapt your writing style from professional to casual, technical to conversational, ensuring your message resonates with every audience.',
      prompt: 'A visual representation of tone adaptation showing the same content transforming between different styles (professional, friendly, technical) with color-coded text layers and style indicators. Purple gradient aesthetic with smooth transitions.'
    },
    {
      id: 'plagiarism-check',
      icon: <Shield className="w-6 h-6 text-amber-400" />,
      title: 'Originality Guarantee',
      description: 'Advanced plagiarism detection and fact-checking tools ensure your content is 100% original and accurate before publishing.',
      prompt: 'A security and originality verification interface showing content being scanned with checkmarks, green verification badges, and authenticity certificates. Trustworthy amber and navy blue color scheme with shield motifs.'
    }
  ];

  // Testimonial data
  const testimonials = [
    {
      id: 'testimonial-1',
      name: 'Sarah Johnson',
      role: 'Content Marketing Director',
      company: 'TechGrowth Inc.',
      content: 'ScriptFlow AI has transformed our content workflow. What used to take our team 3 days now takes 3 hours, and the quality has actually improved. Our SEO traffic increased by 47% in just two months.',
      image: '/placeholder-avatar-1.jpg'
    },
    {
      id: 'testimonial-2',
      name: 'Michael Chen',
      role: 'Founder & CEO',
      company: 'StartupBoost',
      content: 'As a solo founder, I was struggling to keep up with content demands. ScriptFlow AI not only saves me 15+ hours per week but also helps me maintain a consistent brand voice across all platforms. Game-changer!',
      image: '/placeholder-avatar-2.jpg'
    },
    {
      id: 'testimonial-3',
      name: 'Emily Rodriguez',
      role: 'Digital Marketing Manager',
      company: 'EcoBrand Solutions',
      content: 'The tone adaptation feature is incredible. We can create content for our sustainability blog, LinkedIn thought leadership pieces, and investor updates all from the same platform while maintaining completely different voices. Worth every penny.',
      image: '/placeholder-avatar-3.jpg'
    }
  ];

  // Pricing plans
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      period: 'month',
      features: [
        '50,000 words/month',
        'Basic SEO optimization',
        '3 brand voices',
        'Chrome extension',
        'Email support'
      ],
      popular: false,
      cta: 'Get Started'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$79',
      period: 'month',
      features: [
        '200,000 words/month',
        'Advanced SEO + analytics',
        '10 brand voices',
        'Team collaboration (3 seats)',
        'Priority support',
        'Content calendar'
      ],
      popular: true,
      cta: 'Most Popular'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$199',
      period: 'month',
      features: [
        'Unlimited words',
        'Full AI suite + custom models',
        'Unlimited brand voices',
        'Team collaboration (10+ seats)',
        '24/7 dedicated support',
        'API access',
        'Custom integrations'
      ],
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  // FAQ data
  const faqs = [
    {
      question: 'How does ScriptFlow AI compare to other writing tools?',
      answer: 'Unlike generic AI writers, ScriptFlow AI is specifically trained on business and marketing content with deep understanding of brand voice, SEO best practices, and conversion optimization. We focus on quality over quantity, ensuring every piece of content drives real business results.'
    },
    {
      question: 'Can I use ScriptFlow AI for my specific industry?',
      answer: 'Absolutely! ScriptFlow AI has specialized models for healthcare, finance, technology, e-commerce, legal, and more. Our industry-specific training ensures the content is accurate, compliant, and resonates with your target audience.'
    },
    {
      question: 'Is my content safe and private?',
      answer: 'Yes. We use enterprise-grade encryption and never share your content with third parties. You retain full ownership of all generated content, and we offer SOC 2 compliance for enterprise customers.'
    },
    {
      question: 'How easy is it to integrate with my existing workflow?',
      answer: 'ScriptFlow AI integrates seamlessly with WordPress, Shopify, HubSpot, Google Docs, and over 50 other tools. Our browser extension works on any website, and our API allows custom integrations for enterprise workflows.'
    }
  ];

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Handle scroll for active section detection
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'features', 'testimonials', 'pricing', 'faq'];
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ensure component is mounted for browser-only features
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return minimal loading state to prevent hydration mismatch
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading ScriptFlow AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full bg-black/50 backdrop-blur-md z-50 border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-blue-400" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                ScriptFlow AI
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-10">
              {['features', 'testimonials', 'pricing', 'faq'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === section
                      ? 'text-blue-400'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </div>
            <button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/20"
              onClick={() => scrollToSection('pricing')}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-block bg-blue-900/30 backdrop-blur-sm border border-blue-800/50 rounded-full px-4 py-1 text-sm font-medium text-blue-300">
                ✨ AI-Powered Content Creation
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Transform Your Content Strategy with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">AI That Understands Your Business</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-xl">
                Create high-converting, SEO-optimized content 10x faster with ScriptFlow AI's intelligent writing assistant designed specifically for growth-focused businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-blue-500/30"
                >
                  Start Free Trial →
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-4 px-8 rounded-full text-lg transition-colors backdrop-blur-sm"
                >
                  See Features
                </button>
              </div>
              <div className="flex items-center space-x-6 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full border-2 border-gray-900 ${
                        i === 1 ? 'bg-blue-400' : 
                        i === 2 ? 'bg-purple-500' : 
                        i === 3 ? 'bg-green-400' : 
                        i === 4 ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-medium">3,482+ businesses trust ScriptFlow AI</p>
                  <p className="text-gray-400">Join companies like Stripe, HubSpot, and Shopify</p>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              {gallery.getImageUrl('hero-illustration') ? (
                <Image
                  src={gallery.getImageUrl('hero-illustration')!}
                  alt="ScriptFlow AI Dashboard Interface"
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain"
                  priority
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/placeholder-scriptflow-dashboard.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-[600px] bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading dashboard preview...</p>
                  </div>
                </div>
              )}
              {gallery.adminMode && (
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm border border-blue-800/50 rounded-lg p-2">
                  <label className="block text-xs bg-blue-600 text-white px-2 py-1 rounded cursor-pointer">
                    {gallery.uploading === 'hero-illustration' ? 'Uploading...' : 'Update Hero'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => gallery.handleUpload(e, 'hero-illustration')}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => gallery.copyPrompt(ARTWORKS.find(a => a.id === 'hero-illustration')?.prompt || '', 'hero-illustration')}
                    className="mt-1 text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded w-full"
                  >
                    {gallery.copiedId === 'hero-illustration' ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
              )}
            </motion.div>
            <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 shadow-xl transform rotate-3">
              <div className="flex items-center space-x-3">
                <Star className="w-6 h-6 text-yellow-300 fill-current" />
                <div>
                  <p className="font-bold text-white">4.9/5</p>
                  <p className="text-sm text-blue-100">Based on 1,247 reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-black/30 backdrop-blur-sm border-t border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-purple-900/30 backdrop-blur-sm border border-purple-800/50 rounded-full px-4 py-1 text-sm font-medium text-purple-300 mb-6"
            >
              Powerful Features
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              Everything You Need to Create <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">High-Impact Content</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              ScriptFlow AI combines cutting-edge AI with business intelligence to deliver content that actually drives results.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 mb-4">{feature.description}</p>
                <Link href="#" className="text-blue-400 hover:text-blue-300 font-medium flex items-center">
                  Learn more <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-blue-900/30">
            {gallery.getImageUrl('features-visualization') ? (
              <Image
                src={gallery.getImageUrl('features-visualization')!}
                alt="ScriptFlow AI Features Visualization"
                width={1200}
                height={600}
                className="w-full h-auto object-contain"
                priority
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/placeholder-features-visualization.jpg';
                }}
              />
            ) : (
              <div className="w-full h-[500px] bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading features visualization...</p>
                </div>
              </div>
            )}
            {gallery.adminMode && (
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm border border-purple-800/50 rounded-lg p-2">
                <label className="block text-xs bg-purple-600 text-white px-2 py-1 rounded cursor-pointer">
                  {gallery.uploading === 'features-visualization' ? 'Uploading...' : 'Update Visualization'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => gallery.handleUpload(e, 'features-visualization')}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => gallery.copyPrompt(ARTWORKS.find(a => a.id === 'features-visualization')?.prompt || '', 'features-visualization')}
                  className="mt-1 text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded w-full"
                >
                  {gallery.copiedId === 'features-visualization' ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-green-900/30 backdrop-blur-sm border border-green-800/50 rounded-full px-4 py-1 text-sm font-medium text-green-300 mb-6"
            >
              Real Results
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              Loved by <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">Growth-Focused Teams</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              See how businesses are transforming their content operations with ScriptFlow AI.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-bl-full" />
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold">{testimonial.name}</h3>
                      <p className="text-sm text-gray-400">
                        {testimonial.role} @ {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300 italic mb-6">"{testimonial.content}"</p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-green-900/30">
            {gallery.getImageUrl('team-collaboration') ? (
              <Image
                src={gallery.getImageUrl('team-collaboration')!}
                alt="Team Collaboration with ScriptFlow AI"
                width={1200}
                height={600}
                className="w-full h-auto object-contain"
                priority
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/placeholder-team-collaboration.jpg';
                }}
              />
            ) : (
              <div className="w-full h-[500px] bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading team collaboration image...</p>
                </div>
              </div>
            )}
            {gallery.adminMode && (
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm border border-green-800/50 rounded-lg p-2">
                <label className="block text-xs bg-green-600 text-white px-2 py-1 rounded cursor-pointer">
                  {gallery.uploading === 'team-collaboration' ? 'Uploading...' : 'Update Team Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => gallery.handleUpload(e, 'team-collaboration')}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => gallery.copyPrompt(ARTWORKS.find(a => a.id === 'team-collaboration')?.prompt || '', 'team-collaboration')}
                  className="mt-1 text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded w-full"
                >
                  {gallery.copiedId === 'team-collaboration' ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-black/30 backdrop-blur-sm border-t border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-amber-900/30 backdrop-blur-sm border border-amber-800/50 rounded-full px-4 py-1 text-sm font-medium text-amber-300 mb-6"
            >
              Simple Pricing
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              Plans That <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">Grow With Your Business</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              Start with a free trial, then choose the plan that fits your needs. No hidden fees, cancel anytime.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`rounded-2xl p-8 border ${
                  plan.popular
                    ? 'bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/50 relative overflow-hidden'
                    : 'bg-gray-800/50 backdrop-blur-sm border-gray-700/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 text-green-400 mt-1 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center max-w-3xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <h3 className="text-2xl font-bold mb-4">Start Your Free Trial Today</h3>
            <p className="text-gray-300 mb-6">
              Get full access to all features for 14 days. No credit card required. Cancel anytime.
            </p>
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-blue-500/30">
              Start 14-Day Free Trial
            </button>
            <p className="text-sm text-gray-400 mt-4">
              By signing up, you agree to our <span className="text-blue-400 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-blue-400 hover:underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-red-900/30 backdrop-blur-sm border border-red-800/50 rounded-full px-4 py-1 text-sm font-medium text-red-300 mb-6"
            >
              Questions & Answers
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              Everything You Need to Know About <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-pink-500">ScriptFlow AI</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              Find answers to common questions about our AI writing assistant.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
              >
                <h3 className="text-xl font-bold mb-3 text-white">{faq.question}</h3>
                <p className="text-gray-300">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border-t border-blue-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1 text-sm font-medium text-white mb-8"
          >
            Ready to Transform Your Content?
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-8"
          >
            Start Creating <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">High-Converting Content</span> Today
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto"
          >
            Join thousands of businesses that are scaling their content production while maintaining quality and brand consistency.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-blue-500/30">
              Start Free Trial →
            </button>
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-4 px-8 rounded-full text-lg transition-colors backdrop-blur-sm">
              Schedule Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-sm border-t border-blue-900/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <Brain className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  ScriptFlow AI
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-xl">
                The intelligent writing assistant that helps businesses create high-converting, SEO-optimized content at scale. Powered by advanced AI that understands your brand and industry.
              </p>
              <div className="flex space-x-4">
                {[{ icon: '𝕏', label: 'Twitter' }, { icon: 'LinkedIn', label: 'LinkedIn' }, { icon: 'YouTube', label: 'YouTube' }, { icon: 'GitHub', label: 'GitHub' }].map((social) => (
                  <button
                    key={social.label}
                    className="w-10 h-10 rounded-full bg-gray-800/50 border border-gray-700/50 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Case Studies', 'API Documentation', 'Changelog'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-3">
                {['Blog', 'Guides', 'Webinars', 'Community', 'Support Center'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} ScriptFlow AI. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'].map((item) => (
                <Link key={item} href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Mode Indicator */}
      {gallery.adminMode && (
        <div className="fixed bottom-4 right-4 bg-blue-900/80 backdrop-blur-sm border border-blue-700 rounded-xl p-4 shadow-lg z-50">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-blue-200 font-medium">Admin Mode Active</span>
          </div>
          <p className="text-xs text-blue-300 mt-1">Upload images and manage gallery content</p>
        </div>
      )}
    </div>
  );
}