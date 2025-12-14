'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart3,
  Clock,
  Users,
  Target,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Calendar,
  Bell,
  FileText,
  PieChart,
  Smartphone,
  Cloud,
  Lock,
  Star,
  ChevronRight,
  Play,
  MessageSquare,
  Download,
  Menu,
  X
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'website-productivity-dashboard';

// Website images that can be uploaded by admin
const WEBSITE_IMAGES = [
  {
    id: 'hero-illustration',
    title: 'Hero Dashboard Illustration',
    prompt: 'A modern, sleek productivity dashboard interface on a MacBook Pro floating in space with cosmic background, showing beautiful charts, metrics, and to-do lists. Soft blue and purple gradients with glowing elements, clean UI design, professional business aesthetic.',
    aspect: '16:9',
    placeholder: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop'
  },
  {
    id: 'feature-analytics',
    title: 'Analytics Feature Preview',
    prompt: 'A detailed analytics dashboard showing beautiful charts and graphs with metrics like productivity score, focus time, completed tasks. Clean design with gradients of blue and green, data visualization excellence, modern UI elements.',
    aspect: '4:3',
    placeholder: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop'
  },
  {
    id: 'feature-team',
    title: 'Team Collaboration View',
    prompt: 'A team collaboration dashboard showing multiple user avatars, shared tasks, progress bars and communication threads. Clean interface with soft colors, showing connection and teamwork in digital workspace.',
    aspect: '4:3',
    placeholder: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
  },
  {
    id: 'mobile-app',
    title: 'Mobile App Showcase',
    prompt: 'An iPhone showing a beautiful productivity app dashboard with to-do lists, calendar integration, and progress tracking. Clean white interface with tasteful accent colors, floating on a soft gradient background.',
    aspect: '9:16',
    placeholder: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=800&fit=crop'
  },
  {
    id: 'testimonial-avatar-1',
    title: 'Testimonial Avatar - Sarah Chen',
    prompt: 'Professional headshot of a smiling Asian woman in her 30s, tech CEO, modern office background, professional yet approachable, high quality portrait photography, business casual attire.',
    aspect: '1:1',
    placeholder: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop'
  },
  {
    id: 'testimonial-avatar-2',
    title: 'Testimonial Avatar - Marcus Rodriguez',
    prompt: 'Professional headshot of a smiling Latino man in his 40s, COO of tech company, confident expression, modern office environment, professional portrait photography, business attire.',
    aspect: '1:1',
    placeholder: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
  },
  {
    id: 'integration-showcase',
    title: 'Integration Ecosystem',
    prompt: 'A visual representation of app integrations showing logos of tools like Slack, Google Calendar, Asana, Trello, Zoom, GitHub connected with glowing lines. Modern tech ecosystem visualization.',
    aspect: '16:9',
    placeholder: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=675&fit=crop'
  },
  {
    id: 'dashboard-dark',
    title: 'Dark Mode Dashboard',
    prompt: 'A sleek dark mode productivity dashboard with glowing charts, dark blue and purple color scheme, elegant typography, showing focus metrics and productivity insights. Futuristic but practical design.',
    aspect: '16:9',
    placeholder: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop&auto=format&q=80'
  }
];

type ImageState = { [key: string]: { image_url: string | null; loading?: boolean } };

export default function ProductivityDashboardWebsite() {
  const [images, setImages] = useState<ImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Check user authentication and admin status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load all website images from Supabase
  const loadImages = useCallback(async () => {
    // Set loading state for all images
    const loadingState: ImageState = {};
    WEBSITE_IMAGES.forEach(img => {
      loadingState[img.id] = { image_url: null, loading: true };
    });
    setImages(loadingState);

    // Fetch gallery images for this website
    const { data: imageRecords, error } = await supabase
      .from('images')
      .select('path, created_at')
      .eq('user_id', ADMIN_USER_ID)
      .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading images:', error);
      // Remove loading state
      WEBSITE_IMAGES.forEach(img => {
        loadingState[img.id] = { image_url: null, loading: false };
      });
      setImages(loadingState);
      return;
    }

    const loadedState: ImageState = {};
    WEBSITE_IMAGES.forEach(img => {
      loadedState[img.id] = { image_url: null, loading: false };
    });

    if (imageRecords) {
      const latestImagePerId: Record<string, string> = {};

      // Find the latest image for each id
      for (const record of imageRecords) {
        const pathParts = record.path.split('/');
        if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX.split('-')[0]) {
          const imageId = pathParts[3]; // Adjusted index for new path structure
          if (WEBSITE_IMAGES.some(img => img.id === imageId) && !latestImagePerId[imageId]) {
            latestImagePerId[imageId] = record.path;
          }
        }
      }

      // Build final state with URLs
      WEBSITE_IMAGES.forEach(img => {
        if (latestImagePerId[img.id]) {
          const url = supabase.storage
            .from('user_images')
            .getPublicUrl(latestImagePerId[img.id]).data.publicUrl;
          loadedState[img.id] = { image_url: url, loading: false };
        } else {
          loadedState[img.id] = { image_url: null, loading: false };
        }
      });
    }

    setImages(loadedState);
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(imageId);
    try {
      // Create folder path
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${imageId}/`;

      // Clean up old images for this id
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

      // Upload new image
      const filePath = `${folderPath}${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      // Add to database
      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      // Update state with new image
      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setImages(prev => ({ ...prev, [imageId]: { image_url: publicUrl, loading: false } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, imageId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(imageId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setSubmitSuccess(true);
    setEmail('');
    
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsSubmitting(false);
    }, 3000);
  };

  // Get image with fallback
  const getImage = (id: string) => {
    const img = images[id];
    if (!img) return { url: WEBSITE_IMAGES.find(i => i.id === id)?.placeholder, loading: false };
    if (img.loading) return { url: null, loading: true };
    return { url: img.image_url || WEBSITE_IMAGES.find(i => i.id === id)?.placeholder, loading: false };
  };

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Smart Analytics",
      description: "Track productivity trends, identify bottlenecks, and optimize your workflow with AI-powered insights."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Focus Timer",
      description: "Built-in Pomodoro timer with smart breaks and distraction blocking to maximize deep work sessions."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Real-time progress tracking, shared goals, and streamlined communication for distributed teams."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Goal Setting",
      description: "Set SMART goals, track progress with milestones, and celebrate achievements with your team."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Automation",
      description: "Automate repetitive tasks, create custom workflows, and integrate with your favorite tools."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Data Security",
      description: "Enterprise-grade security with end-to-end encryption, GDPR compliance, and regular audits."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CEO, TechFlow Inc.",
      content: "FlowFocus increased our team's productivity by 42% in the first quarter. The analytics helped us identify workflow bottlenecks we didn't even know existed.",
      avatar: getImage('testimonial-avatar-1').url
    },
    {
      name: "Marcus Rodriguez",
      role: "COO, Global Innovations",
      content: "Finally a dashboard that actually helps us work smarter, not just track time. The focus features alone have saved me 10+ hours per week.",
      avatar: getImage('testimonial-avatar-2').url
    },
    {
      name: "Priya Patel",
      role: "Product Manager, CloudScale",
      content: "The integration ecosystem is incredible. Having all our tools in one dashboard has eliminated context switching and boosted our efficiency dramatically."
    }
  ];

  const integrations = [
    { name: "Slack", icon: <MessageSquare className="w-5 h-5" /> },
    { name: "Google Calendar", icon: <Calendar className="w-5 h-5" /> },
    { name: "Asana", icon: <CheckCircle2 className="w-5 h-5" /> },
    { name: "Notion", icon: <FileText className="w-5 h-5" /> },
    { name: "GitHub", icon: <Globe className="w-5 h-5" /> },
    { name: "Zoom", icon: <Play className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Admin Controls Overlay */}
      {adminMode && (
        <div className="fixed top-4 right-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Admin Mode Active</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FlowFocus
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Testimonials</a>
              <a href="#integrations" className="text-gray-600 hover:text-blue-600 transition-colors">Integrations</a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <a 
                href="#signup" 
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                Start Free Trial
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-blue-600 py-2">Features</a>
                <a href="#pricing" className="text-gray-600 hover:text-blue-600 py-2">Pricing</a>
                <a href="#testimonials" className="text-gray-600 hover:text-blue-600 py-2">Testimonials</a>
                <a href="#integrations" className="text-gray-600 hover:text-blue-600 py-2">Integrations</a>
                <a href="#signup" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium text-center">
                  Start Free Trial
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Trusted by 5,000+ teams worldwide
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Your Team's
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Productivity Command Center
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                FlowFocus combines powerful analytics, smart automation, and team collaboration 
                into one intuitive dashboard that actually helps you get more done.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a 
                  href="#signup" 
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  Start Free 14-Day Trial
                  <ChevronRight className="w-5 h-5" />
                </a>
                <a 
                  href="#demo" 
                  className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </a>
              </div>
              
              <div className="flex items-center text-gray-500">
                <div className="flex -space-x-2 mr-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-purple-400"></div>
                  ))}
                </div>
                <span>Join 10,000+ productive teams</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                {getImage('hero-illustration').loading ? (
                  <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
                ) : (
                  <img 
                    src={getImage('hero-illustration').url || ''}
                    alt="FlowFocus Dashboard Interface"
                    className="w-full h-auto rounded-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = WEBSITE_IMAGES.find(i => i.id === 'hero-illustration')?.placeholder || '';
                    }}
                  />
                )}
                
                {/* Admin upload for hero image */}
                {adminMode && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-xs">
                      <p className="font-medium mb-2">Hero Image</p>
                      <label className="block text-xs bg-purple-600 text-white px-3 py-1 rounded cursor-pointer inline-block hover:bg-purple-700 transition-colors">
                        {uploading === 'hero-illustration' ? 'Uploading…' : 'Upload New Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, 'hero-illustration')}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => copyPrompt(
                          WEBSITE_IMAGES.find(i => i.id === 'hero-illustration')?.prompt || '',
                          'hero-illustration'
                        )}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded mt-2 block w-full"
                        type="button"
                      >
                        {copiedId === 'hero-illustration' ? '✓ Copied Prompt' : 'Copy AI Prompt'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Floating elements */}
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl rotate-12 opacity-20"></div>
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl -rotate-12 opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to supercharge productivity
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed to help teams work smarter, collaborate better, and achieve more.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Advanced Analytics That Actually Help
              </h3>
              <p className="text-gray-600 mb-6">
                Get deep insights into your team's productivity patterns. Identify bottlenecks, 
                celebrate wins, and make data-driven decisions with our intelligent analytics engine.
              </p>
              <ul className="space-y-4">
                {[
                  "Real-time productivity scoring",
                  "Custom report generation",
                  "Predictive analytics",
                  "Export to PDF/CSV",
                  "API access for custom dashboards"
                ].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              {getImage('feature-analytics').loading ? (
                <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
              ) : (
                <img 
                  src={getImage('feature-analytics').url || ''}
                  alt="Analytics Dashboard"
                  className="w-full h-auto rounded-2xl"
                />
              )}
              
              {adminMode && (
                <div className="absolute top-4 right-4">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-xs">
                    <p className="font-medium mb-2">Analytics Preview</p>
                    <label className="block text-xs bg-purple-600 text-white px-3 py-1 rounded cursor-pointer inline-block hover:bg-purple-700 transition-colors">
                      {uploading === 'feature-analytics' ? 'Uploading…' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, 'feature-analytics')}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => copyPrompt(
                        WEBSITE_IMAGES.find(i => i.id === 'feature-analytics')?.prompt || '',
                        'feature-analytics'
                      )}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded mt-2 block w-full"
                      type="button"
                    >
                      {copiedId === 'feature-analytics' ? '✓ Copied' : 'Copy AI Prompt'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Showcase */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="relative mx-auto max-w-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-[3rem] blur-2xl opacity-20"></div>
                <div className="relative bg-black rounded-[2.5rem] p-6 shadow-2xl">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
                  <div className="bg-gray-900 rounded-2xl overflow-hidden">
                    {getImage('mobile-app').loading ? (
                      <div className="w-full aspect-[9/16] bg-gradient-to-b from-gray-800 to-gray-900 animate-pulse" />
                    ) : (
                      <img 
                        src={getImage('mobile-app').url || ''}
                        alt="FlowFocus Mobile App"
                        className="w-full h-auto"
                      />
                    )}
                  </div>
                  
                  {adminMode && (
                    <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
                      <div className="bg-black/90 backdrop-blur-sm rounded-lg p-3 text-white text-sm w-48">
                        <p className="font-medium mb-2">Mobile App</p>
                        <label className="block text-xs bg-purple-600 text-white px-3 py-1 rounded cursor-pointer inline-block hover:bg-purple-700 transition-colors mb-2">
                          {uploading === 'mobile-app' ? 'Uploading…' : 'Upload Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, 'mobile-app')}
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={() => copyPrompt(
                            WEBSITE_IMAGES.find(i => i.id === 'mobile-app')?.prompt || '',
                            'mobile-app'
                          )}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded w-full"
                          type="button"
                        >
                          {copiedId === 'mobile-app' ? '✓ Copied' : 'Copy AI Prompt'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-sm font-medium mb-6">
                <Smartphone className="w-4 h-4 mr-2" />
                iOS & Android Apps Available
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Productivity in Your Pocket
              </h2>
              
              <p className="text-xl text-gray-600 mb-8">
                Stay productive on the go with our feature-packed mobile apps. 
                Track progress, join focus sessions, and collaborate with your team from anywhere.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    icon: <Bell className="w-5 h-5" />,
                    title: "Smart Notifications",
                    desc: "Get notified about important updates without distractions"
                  },
                  {
                    icon: <Cloud className="w-5 h-5" />,
                    title: "Real-time Sync",
                    desc: "All your data syncs instantly across all devices"
                  },
                  {
                    icon: <Lock className="w-5 h-5" />,
                    title: "Biometric Security",
                    desc: "Secure access with Face ID or fingerprint"
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-start">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-4 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-8">
                <button className="flex items-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </button>
                
                <button className="flex items-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.25-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.59.69.59 1.19s-.22.9-.57 1.18l-2.29 1.32-2.5-2.5 2.5-2.5 2.27 1.31m-7.12-1.23L6.05 2.66l10.76 6.25-2.27 2.27z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by teams worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See how teams of all sizes are transforming their productivity with FlowFocus.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    {testimonial.avatar ? (
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                        {testimonial.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
                
                {/* Admin upload for testimonial avatars */}
                {adminMode && index < 2 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-purple-600 mb-2">Testimonial Avatar {index + 1}</p>
                    <div className="flex gap-2">
                      <label className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded cursor-pointer hover:bg-purple-200 transition-colors">
                        {uploading === `testimonial-avatar-${index + 1}` ? 'Uploading…' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, `testimonial-avatar-${index + 1}`)}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => copyPrompt(
                          WEBSITE_IMAGES.find(i => i.id === `testimonial-avatar-${index + 1}`)?.prompt || '',
                          `testimonial-avatar-${index + 1}`
                        )}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                        type="button"
                      >
                        {copiedId === `testimonial-avatar-${index + 1}` ? '✓ Copied' : 'AI Prompt'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <div className="inline-flex items-center justify-center gap-8 text-gray-400">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">4.9/5</div>
                <div className="text-sm">Average Rating</div>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">5,000+</div>
                <div className="text-sm">Active Teams</div>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">98%</div>
                <div className="text-sm">Customer Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Works with your favorite tools
            </h2>
            <p className="text-xl text-gray-600">
              FlowFocus integrates seamlessly with the tools you already use.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 mb-12">
            {integrations.map((integration, index) => (
              <div key={index} className="bg-white rounded-xl p-6 flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-gray-700 mb-3">
                  {integration.icon}
                </div>
                <span className="font-medium text-gray-900">{integration.name}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  And 100+ more integrations
                </h3>
                <p className="text-gray-600 mb-6">
                  Our API makes it easy to connect with any tool in your stack. 
                  Custom webhooks, Zapier integration, and full developer documentation available.
                </p>
                <button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
                  View All Integrations
                </button>
              </div>
              
              <div className="relative rounded-2xl overflow-hidden shadow-lg">
                {getImage('integration-showcase').loading ? (
                  <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
                ) : (
                  <img 
                    src={getImage('integration-showcase').url || ''}
                    alt="Integration Ecosystem"
                    className="w-full h-auto rounded-2xl"
                  />
                )}
                
                {adminMode && (
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                      <label className="block text-xs bg-purple-600 text-white px-3 py-1 rounded cursor-pointer inline-block hover:bg-purple-700 transition-colors mb-2">
                        {uploading === 'integration-showcase' ? 'Uploading…' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, 'integration-showcase')}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => copyPrompt(
                          WEBSITE_IMAGES.find(i => i.id === 'integration-showcase')?.prompt || '',
                          'integration-showcase'
                        )}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded block w-full"
                        type="button"
                      >
                        {copiedId === 'integration-showcase' ? '✓ Copied' : 'Copy AI Prompt'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="signup" className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to transform your team's productivity?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join thousands of teams who have already discovered the power of FlowFocus. 
              Start your free 14-day trial today.
            </p>
            
            <div className="max-w-md mx-auto">
              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email"
                    className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    'Processing...'
                  ) : submitSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Email Sent!
                    </>
                  ) : (
                    'Start Free Trial'
                  )}
                </button>
              </form>
              
              <p className="text-gray-400 text-sm mt-4">
                No credit card required • Free 14-day trial • Cancel anytime
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-white/10">
              {[
                { value: "30-day", label: "Money-back guarantee" },
                { value: "99.9%", label: "Uptime SLA" },
                { value: "24/7", label: "Support" },
                { value: "GDPR", label: "Compliant" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">{item.value}</div>
                  <div className="text-gray-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">FlowFocus</span>
              </div>
              <p className="text-gray-400 mb-6">
                The all-in-one productivity dashboard for modern teams.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Use Cases</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 text-center text-sm">
            <p>© {new Date().getFullYear()} FlowFocus, Inc. All rights reserved.</p>
            <div className="mt-2 space-x-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Image Management Panel */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <details className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-sm">
            <summary className="p-4 cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-gray-900">Image Management</span>
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                  {WEBSITE_IMAGES.length} images
                </span>
              </div>
              <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            </summary>
            <div className="p-4 border-t border-gray-200 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Upload images for each section. Copy prompts for AI generation.
              </p>
              <div className="space-y-4">
                {WEBSITE_IMAGES.map((img) => (
                  <div key={img.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{img.title}</p>
                        <p className="text-xs text-gray-500">Aspect: {img.aspect}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyPrompt(img.prompt, img.id)}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                          type="button"
                        >
                          {copiedId === img.id ? '✓ Copied' : 'Copy Prompt'}
                        </button>
                        <label className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded cursor-pointer hover:bg-purple-200 transition-colors">
                          {uploading === img.id ? 'Uploading…' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, img.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2">{img.prompt.substring(0, 100)}...</div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}