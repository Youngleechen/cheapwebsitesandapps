// File: src/app/page.tsx
// Category: professional-services/b2b-marketing-consultant
// Name: Apex Growth Strategies
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
// Define types for better TypeScript support
interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  results: string[];
  description: string;
  image_path: string | null;
}
interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  image_path: string | null;
}
interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  benefits: string[];
}
interface Testimonial {
  id: string;
  quote: string;
  author: string;
  company: string;
  role: string;
  image_path: string | null;
}
// GallerySkeleton component adapted for business context
const BUSINESS_GALLERY_ARTWORKS = [
  { 
    id: 'growth-strategy-visualization', 
    title: 'Growth Strategy Framework',
    prompt: 'A professional business strategy visualization showing interconnected growth pathways with clean lines, modern blue and gold color scheme, abstract data flow representation with upward momentum arrows, corporate aesthetic with subtle gradient backgrounds.'
  },
  { 
    id: 'lead-generation-funnel', 
    title: 'Lead Generation Funnel',
    prompt: 'A sophisticated B2B marketing funnel diagram with smooth gradient transitions from awareness to conversion, modern geometric shapes, professional color palette of navy blue and teal, clean minimalist design showing lead flow through different stages, corporate business aesthetic.'
  },
  { 
    id: 'roi-dashboard', 
    title: 'ROI Dashboard Visualization',
    prompt: 'An executive dashboard visualization showing marketing ROI metrics with clean charts, upward trend lines, professional data visualization in corporate colors (deep blue, silver, gold accents), modern UI elements with glass morphism effects, business intelligence aesthetic.'
  },
  { 
    id: 'team-collaboration', 
    title: 'Strategic Team Collaboration',
    prompt: 'A professional team collaboration scene in a modern office setting with diverse executives around a glass table reviewing strategy documents, warm natural lighting, contemporary office design with plants and modern furniture, business meeting atmosphere with focused energy.'
  },
];
type BusinessArtworkState = { [key: string]: { image_url: string | null, loading: boolean } };
const GallerySkeleton = () => {
  const [artworks, setArtworks] = useState<BusinessArtworkState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === process.env.NEXT_PUBLIC_ADMIN_USER_ID);
    };
    checkUser();
  }, []);
  useEffect(() => {
    const loadImages = async () => {
      const initialState: BusinessArtworkState = {};
      BUSINESS_GALLERY_ARTWORKS.forEach(art => initialState[art.id] = { image_url: null, loading: true });
      try {
        const { data: images, error } = await supabase
          .from('images')
          .select('path, created_at')
          .eq('user_id', process.env.NEXT_PUBLIC_ADMIN_USER_ID!)
          .like('path', `${process.env.NEXT_PUBLIC_ADMIN_USER_ID}/gallery/%`)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error loading images:', error);
          BUSINESS_GALLERY_ARTWORKS.forEach(art => {
            initialState[art.id] = { image_url: null, loading: false };
          });
          setArtworks(initialState);
          return;
        }
        const latestImagePerArtwork: Record<string, string> = {};
        if (images) {
          for (const img of images) {
            const pathParts = img.path.split('/');
            if (pathParts.length >= 4 && pathParts[2] === 'gallery') {
              const artId = pathParts[3];
              if (BUSINESS_GALLERY_ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
                latestImagePerArtwork[artId] = img.path;
              }
            }
          }
        }
        BUSINESS_GALLERY_ARTWORKS.forEach(art => {
          if (latestImagePerArtwork[art.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerArtwork[art.id]).data.publicUrl;
            initialState[art.id] = { image_url: url, loading: false };
          } else {
            initialState[art.id] = { image_url: null, loading: false };
          }
        });
        setArtworks(initialState);
      } catch (err) {
        console.error('Error loading gallery images:', err);
        BUSINESS_GALLERY_ARTWORKS.forEach(art => {
          initialState[art.id] = { image_url: null, loading: false };
        });
        setArtworks(initialState);
      }
    };
    loadImages();
  }, []);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, artworkId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(artworkId);
    try {
      const folderPath = `${process.env.NEXT_PUBLIC_ADMIN_USER_ID}/gallery/${artworkId}/`;
      // Clean up old images for this artwork
      const { data: existingImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', process.env.NEXT_PUBLIC_ADMIN_USER_ID!)
        .like('path', `${folderPath}%`);
      if (existingImages && existingImages.length > 0) {
        const pathsToDelete = existingImages.map(img => img.path);
        await Promise.all([
          supabase.storage.from('user_images').remove(pathsToDelete),
          supabase.from('images').delete().in('path', pathsToDelete)
        ]);
      }
      // Upload new image
      const filePath = `${folderPath}${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { error: dbErr } = await supabase
        .from('images')
        .insert({ 
          user_id: process.env.NEXT_PUBLIC_ADMIN_USER_ID!,
          path: filePath 
        });
      if (dbErr) throw dbErr;
      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setArtworks(prev => ({
        ...prev,
        [artworkId]: { image_url: publicUrl, loading: false }
      }));
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {BUSINESS_GALLERY_ARTWORKS.map((art) => {
          const artworkData = artworks[art.id] || { image_url: null, loading: true };
          const { image_url: imageUrl, loading } = artworkData;
          return (
            <div key={art.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col h-full">
              <div className="relative w-full h-48 bg-gray-50">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : imageUrl ? (
                  <Image 
                    src={imageUrl} 
                    alt={art.title} 
                    fill
                    className="object-cover transition-transform hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2EwYTlhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gaW1hZ2UgbG9hZGVkPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-4">
                    <div className="text-center">
                      <div className="text-blue-600 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">No {art.title} image yet</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{art.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{art.prompt}</p>
                {adminMode && (
                  <div className="mt-auto space-y-2">
                    <button
                      onClick={() => copyPrompt(art.prompt, art.id)}
                      className={`w-full text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        copiedId === art.id 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                      type="button"
                    >
                      {copiedId === art.id ? 'Copied!' : 'Copy Prompt'}
                    </button>
                    <label className="block w-full">
                      <span className="sr-only">Upload image for {art.title}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, art.id)}
                        className="hidden"
                      />
                      <div className={`w-full text-center text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        uploading === art.id
                          ? 'bg-gray-100 text-gray-500 cursor-wait'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}>
                        {uploading === art.id ? 'Uploading...' : 'Upload Image'}
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {adminMode && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <strong>Admin Mode:</strong> Upload professional business visuals or copy AI prompts to generate custom images for your marketing materials.
        </div>
      )}
    </div>
  );
};
// Main Page Component
export default function HomePage() {
  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  // Refs for sections
  const heroRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const caseStudiesRef = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);
  const teamRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  // Sample data - in production this would come from a CMS or database
  const services: Service[] = [
    {
      id: 'lead-gen',
      title: 'B2B Lead Generation',
      description: 'Strategic lead generation programs that fill your pipeline with high-quality, sales-ready prospects.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      benefits: [
        'Targeted outreach to ideal customer profiles',
        'Multi-channel engagement strategies',
        'Lead scoring and qualification systems',
        '90%+ lead-to-meeting conversion rates'
      ]
    },
    {
      id: 'demand-gen',
      title: 'Demand Generation',
      description: 'Comprehensive demand generation strategies that build brand authority and create predictable revenue streams.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      benefits: [
        'Content marketing that drives engagement',
        'Account-based marketing strategies',
        'Marketing automation workflows',
        'Measurable ROI tracking and optimization'
      ]
    },
    {
      id: 'sales-enablement',
      title: 'Sales Enablement',
      description: 'Tools, content, and training that empower your sales team to close deals faster and with higher win rates.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      benefits: [
        'Sales playbooks and battle cards',
        'CRM optimization and integration',
        'Lead handoff processes',
        'Sales and marketing alignment frameworks'
      ]
    },
    {
      id: 'marketing-automation',
      title: 'Marketing Automation',
      description: 'Sophisticated automation systems that nurture leads and scale your marketing efforts efficiently.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      benefits: [
        'Email marketing automation',
        'Lead nurturing workflows',
        'Behavioral targeting systems',
        'Integration with sales tools'
      ]
    }
  ];
  const caseStudies: CaseStudy[] = [
    {
      id: 'case1',
      title: 'Enterprise Software Client',
      industry: 'SaaS',
      results: [
        '237% increase in qualified leads',
        '$1.2M in pipeline generated in 6 months',
        '43% reduction in cost per acquisition'
      ],
      description: 'Transformed lead generation strategy for a B2B SaaS company serving mid-market enterprises, implementing targeted account-based marketing and sophisticated lead scoring.',
      image_path: null
    },
    {
      id: 'case2',
      title: 'Manufacturing Solutions',
      industry: 'Industrial',
      results: [
        '189% growth in sales meetings',
        '67% improvement in lead quality',
        '9-month ROI on marketing investment'
      ],
      description: 'Developed and executed a comprehensive demand generation program for an industrial equipment manufacturer, focusing on content marketing and strategic partnerships.',
      image_path: null
    },
    {
      id: 'case3',
      title: 'Financial Services Firm',
      industry: 'Fintech',
      results: [
        '312% increase in demo requests',
        '$2.8M in closed-won revenue',
        'Customer acquisition cost reduced by 58%'
      ],
      description: 'Created a high-velocity lead generation machine for a fintech startup, combining outbound prospecting with inbound content strategies and marketing automation.',
      image_path: null
    }
  ];
  const teamMembers: TeamMember[] = [
    {
      id: 'michael',
      name: 'Michael Chen',
      title: 'Founder & Chief Growth Officer',
      bio: '20+ years driving revenue growth for B2B companies. Former VP of Marketing at two successful exits. MBA from Kellogg School of Management.',
      expertise: ['GTM Strategy', 'Revenue Operations', 'Market Positioning', 'Team Building'],
      image_path: null
    },
    {
      id: 'sarah',
      name: 'Sarah Rodriguez',
      title: 'Director of Demand Generation',
      bio: '15+ years building and scaling marketing teams. Expert in full-funnel marketing strategies with a track record of 300%+ ROI on marketing investments.',
      expertise: ['ABM Strategy', 'Content Marketing', 'Lead Generation', 'Marketing Automation'],
      image_path: null
    },
    {
      id: 'david',
      name: 'David Thompson',
      title: 'Head of Sales Enablement',
      bio: 'Former sales leader with 12+ years in B2B sales. Specializes in bridging the gap between marketing and sales to maximize revenue impact.',
      expertise: ['Sales Process Optimization', 'CRM Strategy', 'Sales Training', 'Performance Metrics'],
      image_path: null
    }
  ];
  const testimonials: Testimonial[] = [
    {
      id: 'test1',
      quote: 'Apex Growth didn\'t just deliver leads— they delivered revenue. Their strategic approach and execution discipline transformed our entire growth trajectory.',
      author: 'Jennifer Hayes',
      company: 'Veridian Solutions',
      role: 'CEO',
      image_path: null
    },
    {
      id: 'test2',
      quote: 'Working with Michael and his team was the best decision we made. They understood our complex sales cycle and built a marketing engine that consistently delivers qualified opportunities.',
      author: 'Robert Kim',
      company: 'Nexus Technologies',
      role: 'VP of Sales',
      image_path: null
    },
    {
      id: 'test3',
      quote: 'The ROI from Apex Growth\'s programs speaks for itself. We\'ve scaled our marketing efforts 5x while maintaining consistent cost per acquisition and dramatically improving lead quality.',
      author: 'Amanda Torres',
      company: 'StrategicEdge Inc.',
      role: 'CMO',
      image_path: null
    }
  ];
  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      // Navigation scroll effect
      setIsScrolled(window.scrollY > 20);
      // Active section tracking
      const sections = [
        { id: 'hero', ref: heroRef },
        { id: 'services', ref: servicesRef },
        { id: 'case-studies', ref: caseStudiesRef },
        { id: 'process', ref: processRef },
        { id: 'team', ref: teamRef },
        { id: 'testimonials', ref: testimonialsRef },
        { id: 'cta', ref: ctaRef }
      ];
      let currentSection = 'hero';
      sections.forEach(section => {
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            currentSection = section.id;
          }
        }
      });
      setActiveSection(currentSection);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // In production, this would send to your backend or CRM
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitSuccess(true);
      setEmail('');
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Form submission failed:', error);
      alert('Something went wrong. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };
  // Navigation helper
  const scrollToSection = (sectionRef: React.RefObject<HTMLElement | null>) => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };
  
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-2 w-10 h-10 flex items-center justify-center">
                <span className="font-bold text-lg">A</span>
              </div>
              <div className="hidden md:block">
                <div className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                  Apex Growth
                </div>
                <div className="text-sm text-gray-600">Strategic B2B Growth</div>
              </div>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden md:block">
              <ul className="flex space-x-8">
                {['Services', 'Case Studies', 'Our Process', 'Team', 'Testimonials'].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => scrollToSection(
                        item === 'Services' ? servicesRef :
                        item === 'Case Studies' ? caseStudiesRef :
                        item === 'Our Process' ? processRef :
                        item === 'Team' ? teamRef : testimonialsRef
                      )}
                      className={`font-medium text-sm transition-colors ${
                        activeSection === 
                          (item === 'Services' ? 'services' : 
                           item === 'Case Studies' ? 'case-studies' : 
                           item === 'Our Process' ? 'process' : 
                           item === 'Team' ? 'team' : 'testimonials')
                          ? 'text-blue-600'
                          : 'text-gray-700 hover:text-blue-600'
                      }`}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            {/* CTA Button */}
            <div className="hidden md:block">
              <button
                onClick={() => scrollToSection(ctaRef)}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Book Strategy Session
              </button>
            </div>
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-700 hover:text-blue-600 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4">
              <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
                {['Services', 'Case Studies', 'Our Process', 'Team', 'Testimonials', 'Contact'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      scrollToSection(
                        item === 'Services' ? servicesRef :
                        item === 'Case Studies' ? caseStudiesRef :
                        item === 'Our Process' ? processRef :
                        item === 'Team' ? teamRef :
                        item === 'Testimonials' ? testimonialsRef : ctaRef
                      );
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg hover:bg-blue-50 text-gray-700 font-medium transition-colors"
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={() => scrollToSection(ctaRef)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-800 transition-all"
                >
                  Book Strategy Session
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      <main className="pt-24">
        {/* Hero Section */}
        <section ref={heroRef} className="relative bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                  B2B Growth Specialists Since 2015
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Strategic Marketing That <span className="text-blue-600">Scales Revenue</span> for Mid-Market B2B Companies
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl">
                  We partner with growth-focused B2B companies to build predictable revenue engines through data-driven marketing strategies and execution excellence.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => scrollToSection(ctaRef)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Get Your Growth Plan
                  </button>
                  <button
                    onClick={() => scrollToSection(servicesRef)}
                    className="bg-white text-gray-900 border-2 border-gray-200 px-8 py-4 rounded-lg font-medium text-lg hover:border-blue-300 transition-colors"
                  >
                    Explore Services
                  </button>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 border-2 border-white flex-shrink-0"></div>
                      ))}
                    </div>
                    <div className="text-gray-600">
                      <p className="font-medium">Trusted by 150+ B2B Companies</p>
                      <p className="text-sm">Including leaders in SaaS, Manufacturing, and Financial Services</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-300 to-indigo-400 rounded-3xl blur-3xl opacity-20"></div>
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">AG</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Growth Dashboard</p>
                          <p className="text-xs text-gray-500">apexgrowth.com/dashboard</p>
                        </div>
                      </div>
                      <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Monthly Qualified Leads</p>
                        <p className="text-2xl font-bold text-blue-600">+1,247</p>
                        <p className="text-sm text-green-600 mt-1">↑ 189% from last quarter</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Sales Pipeline Value</p>
                        <p className="text-2xl font-bold text-indigo-600">$4.8M</p>
                        <p className="text-sm text-green-600 mt-1">↑ 134% from last quarter</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-900">Lead Source Performance</p>
                        <span className="text-xs text-blue-600 font-medium">View Details →</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { name: 'Content Marketing', value: 45, color: 'bg-blue-500' },
                          { name: 'Account-Based Outreach', value: 32, color: 'bg-indigo-500' },
                          { name: 'Partnership Programs', value: 18, color: 'bg-purple-500' },
                          { name: 'Paid Advertising', value: 5, color: 'bg-pink-500' }
                        ].map((source) => (
                          <div key={source.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">{source.name}</span>
                              <span className="font-medium text-gray-900">{source.value}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${source.color} rounded-full transition-all duration-500`}
                                style={{ width: `${source.value}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Floating shapes for visual interest */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-300 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-300 rounded-full opacity-10 blur-3xl"></div>
        </section>
        {/* Services Section */}
        <section ref={servicesRef} className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                Our Services
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Comprehensive B2B Growth Solutions
              </h2>
              <p className="text-xl text-gray-600">
                We provide end-to-end marketing services designed to accelerate revenue growth and maximize ROI for mid-market B2B companies.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service) => (
                <div key={service.id} className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full">
                  <div className="p-6 flex-grow">
                    <div className="mb-6">{service.icon}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {service.description}
                    </p>
                    <ul className="space-y-2 mb-6">
                      {service.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2 text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-6 pb-6 mt-auto">
                    <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors flex items-center group/btn">
                      Learn More
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-16 text-center">
              <button
                onClick={() => scrollToSection(ctaRef)}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Your Custom Growth Strategy
              </button>
            </div>
          </div>
        </section>
        {/* Case Studies Section */}
        <section ref={caseStudiesRef} className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                Results That Matter
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Proven Success with B2B Companies
              </h2>
              <p className="text-xl text-gray-600">
                We don't just create marketing campaigns—we build revenue engines that deliver measurable business impact.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <div key={study.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                  <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="text-blue-600 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="font-medium text-gray-700">{study.industry} Industry</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{study.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{study.description}</p>
                    <div className="space-y-3 mb-6">
                      {study.results.map((result, i) => (
                        <div key={i} className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2 font-medium text-gray-900">{result}</span>
                        </div>
                      ))}
                    </div>
                    <button className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors flex items-center group">
                      Read Full Case Study
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Process Section */}
        <section ref={processRef} className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block bg-purple-50 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                Our Methodology
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                The Apex Growth Framework
              </h2>
              <p className="text-xl text-gray-600">
                Our proven 5-step process ensures we build marketing strategies that deliver sustainable revenue growth and competitive advantage.
              </p>
            </div>
            <div className="relative">
              {/* Process line */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 to-indigo-200 transform -translate-x-1/2"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div 
                    key={step} 
                    className={`relative ${
                      step % 2 === 0 ? 'md:ml-auto md:pl-12' : 'md:mr-auto md:pr-12'
                    }`}
                  >
                    {/* Step number */}
                    <div className={`absolute ${
                      step % 2 === 0 ? 'md:-left-6' : 'md:-right-6'
                    } top-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-xl z-10 border-4 border-white shadow-lg`}>
                      {step}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {step === 1 ? 'Strategic Assessment' :
                         step === 2 ? 'Growth Blueprint' :
                         step === 3 ? 'Execution Planning' :
                         step === 4 ? 'Implementation' : 'Optimization & Scale'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {step === 1 ? 'Deep dive into your business, market, competitors, and growth opportunities to identify the highest-impact strategies.' :
                         step === 2 ? 'Develop a comprehensive growth roadmap with clear objectives, key metrics, and timeline for execution.' :
                         step === 3 ? 'Create detailed tactical plans, resource allocation, and timeline for each growth initiative.' :
                         step === 4 ? 'Execute marketing programs with precision, leveraging our team of specialists and proven processes.' : 'Continuously analyze performance, optimize campaigns, and scale successful initiatives.'}
                      </p>
                      {step === 1 && (
                        <div className="mt-4">
                          <div className="grid grid-cols-2 gap-3">
                            {['Market Analysis', 'Competitor Research', 'Customer Insights', 'Growth Gap Analysis'].map((item) => (
                              <div key={item} className="flex items-center text-sm text-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2a1 1 0 102 0V7zm1 4a1 1 0 10-2 0v3a1 1 0 102 0v-3z" clipRule="evenodd" />
                                </svg>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/* Team Section with Gallery */}
        <section ref={teamRef} className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block bg-amber-50 text-amber-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                Our Leadership
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Experienced Growth Architects
              </h2>
              <p className="text-xl text-gray-600">
                Our team of seasoned marketing leaders brings decades of combined experience driving revenue growth for B2B companies.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {teamMembers.map((member, index) => (
                <div key={member.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg">
                  <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 mx-auto flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-white">
                          {member.name.split(' ')[0][0]}{member.name.split(' ')[1][0]}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                      <p className="text-blue-600 font-medium">{member.title}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-4">{member.bio}</p>
                    <div className="space-y-2">
                      {member.expertise.map((skill, i) => (
                        <div key={i} className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-gray-700 font-medium">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Gallery Section for Business Visuals */}
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Marketing Strategy Visualizations</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Our strategic approach is backed by data-driven insights and visual frameworks that make complex growth strategies clear and actionable.
                </p>
              </div>
              <GallerySkeleton />
            </div>
          </div>
        </section>
        {/* Testimonials Section */}
        <section ref={testimonialsRef} className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                Client Success
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                What Our Clients Say
              </h2>
              <p className="text-xl text-gray-600">
                Don't just take our word for it—hear from the business leaders who have achieved remarkable growth through our partnership.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={testimonial.id} className="bg-gray-50 rounded-xl p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {testimonial.author.split(' ')[0][0]}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center mb-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <h4 className="font-bold text-gray-900">{testimonial.author}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic leading-relaxed relative pl-6">
                    <span className="absolute left-0 top-0 text-4xl text-blue-200">"</span>
                    {testimonial.quote}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section ref={ctaRef} className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Ready to Accelerate Your Growth?
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Let's Build Your Revenue Engine
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Schedule a free 30-minute strategy session with our founder to discuss your growth challenges and opportunities.
            </p>
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your business email"
                    className="w-full px-6 py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-100/70 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-blue-700 font-bold px-8 py-4 rounded-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Sending...' : 'Get Your Free Strategy Session'}
                </button>
              </form>
              {submitSuccess && (
                <div className="mt-4 p-4 bg-green-500/20 border border-green-400/30 rounded-lg text-green-100">
                  <p className="font-medium">Perfect! We'll be in touch shortly to schedule your strategy session.</p>
                </div>
              )}
              <p className="mt-4 text-blue-100/80 text-sm">
                By submitting, you agree to receive communications from Apex Growth Strategies. We respect your privacy and you can unsubscribe at any time.
              </p>
            </div>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center space-x-2 text-white/90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>No credit card required • 30-minute consultation</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-2 w-10 h-10 flex items-center justify-center">
                  <span className="font-bold text-lg">A</span>
                </div>
                <div>
                  <div className="font-bold text-xl">Apex Growth</div>
                  <div className="text-sm text-gray-400">Strategic B2B Growth</div>
                </div>
              </div>
              <p className="text-gray-400">
                We partner with mid-market B2B companies to build predictable revenue engines through data-driven marketing strategies.
              </p>
              <div className="flex space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                    <span className="text-sm font-bold">F{i}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Services</h3>
              <ul className="space-y-2">
                {services.map((service) => (
                  <li key={service.id}>
                    <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                      {service.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Company</h3>
              <ul className="space-y-2">
                {['About Us', 'Our Team', 'Case Studies', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Contact</h3>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>123 Growth Avenue, Suite 100<br />Chicago, IL 60601</span>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span>+1 (312) 555-0199</span>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>growth@apexgrowth.com</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Apex Growth Strategies. All rights reserved.</p>
            <div className="mt-2 flex justify-center space-x-6">
              {['Privacy Policy', 'Terms of Service', 'Sitemap'].map((item) => (
                <Link key={item} href="#" className="hover:text-white transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}