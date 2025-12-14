// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle,
  Calculator,
  PieChart,
  Download,
  Sparkles,
  ArrowRight,
  Lock,
  Globe
} from 'lucide-react';

// Supabase client initialization
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Image configuration with detailed prompts for admin uploads
const PLATFORM_IMAGES = [
  { 
    id: 'hero-dashboard', 
    title: 'Main Dashboard Preview',
    prompt: 'A modern, sleek fintech dashboard interface showing financial metrics, charts, and KPIs. Use a dark theme with teal and blue accents. Include clean data visualizations like bar charts, line graphs, and metric cards. Show a professional, intuitive layout with clear typography and subtle shadows. Style: clean, professional, corporate fintech.'
  },
  { 
    id: 'forecast-visualization', 
    title: 'Forecasting Visualization',
    prompt: 'An interactive financial forecasting visualization showing revenue projections vs actuals. Use gradient colors (teal to blue) with smooth line charts and prediction bands. Include trend lines, confidence intervals, and comparison metrics. Add subtle motion blur to show dynamic data. Style: data visualization, analytical, professional.'
  },
  { 
    id: 'mobile-app-preview', 
    title: 'Mobile App Experience',
    prompt: 'A realistic mobile phone mockup showing a budgeting app interface. Display expense categorization, budget tracking, and spending alerts. Use clean card designs with icons and progress bars. Show dark mode interface with vibrant accent colors. Include subtle reflections and shadows for realism. Style: modern app design, clean UI, professional.'
  },
  { 
    id: 'integration-showcase', 
    title: 'Platform Integrations',
    prompt: 'A visual representation of multiple financial platforms connecting to a central hub. Show logos of accounting software, banking apps, and payment processors flowing into a central dashboard. Use connecting lines and nodes with glowing effects. Style: technical illustration, connected systems, professional.'
  },
  { 
    id: 'team-collab', 
    title: 'Team Collaboration View',
    prompt: 'A team collaboration dashboard showing multiple users working on financial plans. Display shared budgets, comments, and approval workflows. Use a clean interface with user avatars, comment threads, and task status indicators. Style: collaborative workspace, professional, intuitive.'
  },
];

type ImageState = { [key: string]: { image_url: string | null; loading: boolean } };

export default function HomePage() {
  // State for gallery images
  const [platformImages, setPlatformImages] = useState<ImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Financial calculator state
  const [revenue, setRevenue] = useState<number>(250000);
  const [savingsGoal, setSavingsGoal] = useState<number>(15);
  const [timeSaved, setTimeSaved] = useState<number>(15);

  // Initialize image state with loading indicators
  useEffect(() => {
    const initialState: ImageState = {};
    PLATFORM_IMAGES.forEach(img => {
      initialState[img.id] = { image_url: null, loading: true };
    });
    setPlatformImages(initialState);
  }, []);

  // Check admin status and load images
  useEffect(() => {
    const initializePage = async () => {
      // Check user session
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);

      // Load gallery images
      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        // Set loading to false on error
        setPlatformImages(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(key => {
            newState[key] = { ...newState[key], loading: false };
          });
          return newState;
        });
        return;
      }

      const latestImagePerArtwork: Record<string, string> = {};
      
      if (images) {
        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const imgId = pathParts[2];
            if (PLATFORM_IMAGES.some(a => a.id === imgId) && !latestImagePerArtwork[imgId]) {
              latestImagePerArtwork[imgId] = img.path;
            }
          }
        }
      }

      // Update state with loaded images
      const updatedState: ImageState = {};
      PLATFORM_IMAGES.forEach(img => {
        if (latestImagePerArtwork[img.id]) {
          const url = supabase.storage
            .from('user_images')
            .getPublicUrl(latestImagePerArtwork[img.id]).data.publicUrl;
          updatedState[img.id] = { image_url: url, loading: false };
        } else {
          updatedState[img.id] = { image_url: null, loading: false };
        }
      });

      setPlatformImages(updatedState);
    };

    initializePage();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(imageId);
    // Update loading state for this image
    setPlatformImages(prev => ({
      ...prev,
      [imageId]: { ...prev[imageId], loading: true }
    }));

    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${imageId}/`;

      // Clean up old images for this artwork
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

      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setPlatformImages(prev => ({ 
        ...prev, 
        [imageId]: { image_url: publicUrl, loading: false } 
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
      setPlatformImages(prev => ({ 
        ...prev, 
        [imageId]: { ...prev[imageId], loading: false } 
      }));
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

  // Calculate financial metrics
  const calculatedSavings = (revenue * savingsGoal) / 100;
  const monthlyTimeSaved = (timeSaved * 20); // Assuming 20 business days

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-500 rounded-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">Econnex</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="hover:text-teal-300 transition">Features</a>
            <a href="#solutions" className="hover:text-teal-300 transition">Solutions</a>
            <a href="#pricing" className="hover:text-teal-300 transition">Pricing</a>
            <a href="#testimonials" className="hover:text-teal-300 transition">Testimonials</a>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 rounded-lg hover:bg-gray-800 transition">
              Sign In
            </button>
            <button className="px-6 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold transition transform hover:scale-105">
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span className="text-sm">Trusted by 5,000+ growing businesses</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Financial Clarity for <span className="text-teal-400">Smart</span> Business Growth
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Econnex transforms complex financial data into actionable insights. Automate budgeting, forecasting, and financial planning with AI-powered precision.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition transform hover:scale-105">
                <span>Start Free 14-Day Trial</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button className="px-8 py-4 border border-gray-700 hover:border-teal-500 rounded-lg font-semibold text-lg transition">
                Book a Demo
              </button>
            </div>
            
            <div className="mt-8 flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>SOC 2 Type II certified</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Hero Dashboard Image with Admin Upload */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {platformImages['hero-dashboard']?.loading ? (
                <div className="w-full h-[500px] bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse"></div>
              ) : platformImages['hero-dashboard']?.image_url ? (
                <img 
                  src={platformImages['hero-dashboard'].image_url} 
                  alt="Econnex Dashboard Interface"
                  className="w-full h-auto"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-[500px] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-500">Dashboard Preview</p>
                    {adminMode && (
                      <div className="mt-4">
                        <label className="inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer transition">
                          Upload Dashboard Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, 'hero-dashboard')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Floating metrics overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-gray-900/90 backdrop-blur-sm rounded-xl p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-400">24%</div>
                    <div className="text-sm text-gray-400">Avg. Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-400">15h</div>
                    <div className="text-sm text-gray-400">Time Saved/Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-400">99%</div>
                    <div className="text-sm text-gray-400">Accuracy</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Admin prompt for hero image */}
            {adminMode && !platformImages['hero-dashboard']?.image_url && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-300 mb-2">Prompt for dashboard image:</p>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-teal-300 flex-1">{PLATFORM_IMAGES.find(img => img.id === 'hero-dashboard')?.prompt}</p>
                  <button
                    onClick={() => copyPrompt(PLATFORM_IMAGES.find(img => img.id === 'hero-dashboard')?.prompt || '', 'hero-dashboard')}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded whitespace-nowrap"
                  >
                    {copiedId === 'hero-dashboard' ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <p className="text-gray-400 mb-6">TRUSTED BY INDUSTRY LEADERS</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-70">
            <div className="text-2xl font-bold">TechScale Inc.</div>
            <div className="text-2xl font-bold">Global Retail Co.</div>
            <div className="text-2xl font-bold">Innovate Labs</div>
            <div className="text-2xl font-bold">Prime Services</div>
            <div className="text-2xl font-bold">Growth Partners</div>
          </div>
        </div>
      </section>

      {/* Value Calculator */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-gray-800/30 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-center mb-10">
            <Calculator className="h-12 w-12 mx-auto text-teal-400 mb-4" />
            <h2 className="text-3xl font-bold mb-4">Calculate Your Potential Savings</h2>
            <p className="text-gray-400">See how much Econnex could save your business</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium mb-2">Annual Revenue</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="50000"
                    max="1000000"
                    step="50000"
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold">${(revenue / 1000).toFixed(0)}k</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Savings Goal</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={savingsGoal}
                    onChange={(e) => setSavingsGoal(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold">{savingsGoal}%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Weekly Finance Hours</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={timeSaved}
                    onChange={(e) => setTimeSaved(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold">{timeSaved}h</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6">Your Estimated Impact</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                  <div>
                    <div className="font-medium">Annual Savings</div>
                    <div className="text-sm text-gray-400">With optimized budgeting</div>
                  </div>
                  <div className="text-2xl font-bold text-teal-400">${calculatedSavings.toLocaleString()}</div>
                </div>
                
                <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                  <div>
                    <div className="font-medium">Time Reclaimed</div>
                    <div className="text-sm text-gray-400">Monthly hours saved</div>
                  </div>
                  <div className="text-2xl font-bold text-teal-400">{monthlyTimeSaved}h</div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">ROI (First Year)</div>
                    <div className="text-sm text-gray-400">Based on starter plan</div>
                  </div>
                  <div className="text-2xl font-bold text-teal-400">412%</div>
                </div>
              </div>
              
              <button className="w-full mt-8 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold transition">
                Start Your Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Powerful Features for Financial Mastery</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to take control of your business finances
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <TrendingUp className="h-8 w-8" />,
              title: "AI-Powered Forecasting",
              description: "Predict future revenue and expenses with 95% accuracy using machine learning algorithms",
              color: "text-blue-400"
            },
            {
              icon: <PieChart className="h-8 w-8" />,
              title: "Real-Time Analytics",
              description: "Monitor cash flow, profitability, and budget adherence with live dashboards",
              color: "text-purple-400"
            },
            {
              icon: <Users className="h-8 w-8" />,
              title: "Team Collaboration",
              description: "Share budgets, track approvals, and collaborate seamlessly across departments",
              color: "text-green-400"
            },
            {
              icon: <Zap className="h-8 w-8" />,
              title: "Automated Workflows",
              description: "Automate expense tracking, invoicing, and financial reporting",
              color: "text-yellow-400"
            },
            {
              icon: <Lock className="h-8 w-8" />,
              title: "Enterprise Security",
              description: "Bank-level encryption, SOC 2 compliance, and granular permission controls",
              color: "text-red-400"
            },
            {
              icon: <Globe className="h-8 w-8" />,
              title: "Global Support",
              description: "Multi-currency support and compliance with international accounting standards",
              color: "text-teal-400"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-gray-800/30 rounded-xl p-6 hover:bg-gray-800/50 transition group"
            >
              <div className={`p-3 rounded-lg bg-gray-900 w-fit mb-4 ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visual Showcase Section with Admin Gallery */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Experience the Platform</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            See how Econnex transforms complex financial data into clear insights
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLATFORM_IMAGES.filter(img => img.id !== 'hero-dashboard').map((image) => {
            const imageData = platformImages[image.id] || { image_url: null, loading: true };
            
            return (
              <div key={image.id} className="bg-gray-800/30 rounded-xl overflow-hidden flex flex-col">
                {/* Image Container */}
                <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900">
                  {imageData.loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-500"></div>
                    </div>
                  ) : imageData.image_url ? (
                    <img 
                      src={imageData.image_url} 
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <div className="p-3 bg-gray-700/50 rounded-lg mb-3">
                        <BarChart3 className="h-8 w-8 text-gray-500" />
                      </div>
                      <p className="text-gray-500 text-center text-sm">{image.title}</p>
                    </div>
                  )}
                </div>
                
                {/* Admin Controls */}
                {adminMode && (
                  <div className="p-3 border-t border-gray-700 space-y-2">
                    {!imageData.image_url && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-teal-300 line-clamp-2">{image.prompt}</p>
                        <button
                          onClick={() => copyPrompt(image.prompt, image.id)}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded self-start"
                          type="button"
                        >
                          {copiedId === image.id ? 'Copied!' : 'Copy Prompt'}
                        </button>
                      </div>
                    )}
                    <label className="block text-sm bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded cursor-pointer text-center transition">
                      {uploading === image.id ? 'Uploading…' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, image.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                
                {/* Image Title */}
                <div className="p-3 mt-auto">
                  <h3 className="font-semibold">{image.title}</h3>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Trusted by Finance Leaders</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            See what businesses like yours are achieving with Econnex
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              quote: "Econnex reduced our monthly financial review time from 40 hours to just 5. The forecasting accuracy has been transformative for our planning.",
              author: "Sarah Chen",
              role: "CFO, TechScale Inc.",
              savings: "35 hours saved monthly"
            },
            {
              quote: "The AI-powered insights helped us identify $120k in unnecessary expenses in our first quarter. ROI was immediate.",
              author: "Michael Rodriguez",
              role: "Finance Director, Growth Partners",
              savings: "$120k identified savings"
            },
            {
              quote: "Implementation was seamless, and our team adopted it instantly. The collaborative features revolutionized our budgeting process.",
              author: "Jessica Williams",
              role: "VP Finance, Innovate Labs",
              savings: "75% faster budgeting"
            }
          ].map((testimonial, index) => (
            <div key={index} className="bg-gray-800/30 rounded-xl p-6">
              <div className="text-4xl text-gray-600 mb-4">"</div>
              <p className="text-lg mb-6">{testimonial.quote}</p>
              <div className="border-t border-gray-800 pt-4">
                <div className="font-bold">{testimonial.author}</div>
                <div className="text-gray-400 text-sm mb-2">{testimonial.role}</div>
                <div className="flex items-center text-teal-400 text-sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {testimonial.savings}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-teal-900/30 to-blue-900/30 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Financial Management?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join 5,000+ businesses that trust Econnex with their financial operations. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-semibold text-lg transition transform hover:scale-105">
              Start Free 14-Day Trial
            </button>
            <button className="px-8 py-4 border border-gray-600 hover:border-white rounded-lg font-semibold text-lg transition">
              Schedule a Demo
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-6">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-800">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-teal-500 rounded-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold">Econnex</span>
            </div>
            <p className="text-gray-400">Intelligent financial management for modern businesses.</p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">Features</a></li>
              <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition">API Documentation</a></li>
              <li><a href="#" className="hover:text-white transition">Integrations</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition">Community</a></li>
              <li><a href="#" className="hover:text-white transition">Status</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">About Us</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
              <li><a href="#" className="hover:text-white transition">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Econnex. All rights reserved. | SOC 2 Type II Certified | GDPR Compliant</p>
        </div>
      </footer>

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-teal-900/80 backdrop-blur-sm border border-teal-600 rounded-lg p-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-teal-400 rounded-full animate-pulse"></div>
            <span>Admin Mode Active</span>
          </div>
          <p className="text-xs text-teal-300 mt-1">You can upload and manage gallery images</p>
        </div>
      )}
    </div>
  );
}