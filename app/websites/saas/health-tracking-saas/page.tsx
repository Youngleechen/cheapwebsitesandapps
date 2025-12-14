'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Users, 
  Heart, 
  Activity, 
  Brain, 
  Moon, 
  Sun, 
  Target, 
  Award, 
  Calendar, 
  Clock, 
  Zap, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  Settings, 
  Bell, 
  Menu, 
  X 
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'dashboard_gallery'; // Dedicated identifier for dashboard gallery images

// Health-focused artwork prompts for the gallery
const DASHBOARD_ARTWORKS = [
  { 
    id: 'morning-wellness', 
    title: 'Morning Wellness Routine',
    prompt: 'A serene morning wellness scene showing a person doing gentle yoga on a balcony at sunrise, with soft golden light filtering through plants, a steaming cup of herbal tea on a small table, and a fitness tracker visible on their wrist. The atmosphere should be peaceful and motivating.'
  },
  { 
    id: 'health-data-visualization', 
    title: 'Health Data Analytics',
    prompt: 'A modern, clean dashboard interface displaying health analytics with glowing charts and graphs in blues and greens. Show heart rate, sleep patterns, and activity levels with smooth gradients and subtle shadows. Include a person looking at the screen with a satisfied expression. Tech-meets-wellness aesthetic.'
  },
  { 
    id: 'recovery-moment', 
    title: 'Post-Workout Recovery',
    prompt: 'A calming post-workout recovery scene in a minimalist home gym. Show a person stretching on a yoga mat near a large window with natural light, a water bottle and towel nearby, with subtle steam rising from a protein shake. Include fitness equipment in soft focus background. Colors should be soothing blues and whites with warm accents.'
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };
type HealthMetric = {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: number;
  color: string;
};

type HealthDataPoint = {
  date: string;
  steps: number;
  heartRate: number;
  sleepHours: number;
  calories: number;
  stressLevel: number;
  hydration: number;
};

type UserGoal = {
  id: string;
  name: string;
  current: number;
  target: number;
  unit: string;
  progress: number;
  color: string;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic';
};

// Sample health data for demonstration
const sampleHealthData: HealthDataPoint[] = [
  { date: '2025-12-08', steps: 8450, heartRate: 68, sleepHours: 7.5, calories: 2100, stressLevel: 3, hydration: 85 },
  { date: '2025-12-09', steps: 9200, heartRate: 65, sleepHours: 8.0, calories: 2200, stressLevel: 2, hydration: 90 },
  { date: '2025-12-10', steps: 7800, heartRate: 70, sleepHours: 6.5, calories: 1950, stressLevel: 4, hydration: 75 },
  { date: '2025-12-11', steps: 10500, heartRate: 63, sleepHours: 7.8, calories: 2300, stressLevel: 2, hydration: 95 },
  { date: '2025-12-12', steps: 8900, heartRate: 67, sleepHours: 8.2, calories: 2150, stressLevel: 3, hydration: 88 },
  { date: '2025-12-13', steps: 9700, heartRate: 64, sleepHours: 7.9, calories: 2250, stressLevel: 2, hydration: 92 },
  { date: '2025-12-14', steps: 11200, heartRate: 62, sleepHours: 8.5, calories: 2400, stressLevel: 1, hydration: 98 },
];

const sampleMetrics: HealthMetric[] = [
  { id: 'steps', name: 'Daily Steps', value: '9,850', unit: 'steps', trend: 'up', trendValue: 12.5, color: '#4ade80' },
  { id: 'heart', name: 'Resting Heart Rate', value: '62', unit: 'bpm', trend: 'down', trendValue: 5.2, color: '#3b82f6' },
  { id: 'sleep', name: 'Sleep Quality', value: '8.2', unit: 'hours', trend: 'up', trendValue: 8.7, color: '#8b5cf6' },
  { id: 'calories', name: 'Calories Burned', value: '2,450', unit: 'kcal', trend: 'up', trendValue: 15.3, color: '#f59e0b' },
];

const sampleGoals: UserGoal[] = [
  { id: 'step-goal', name: 'Daily Steps', current: 9850, target: 10000, unit: 'steps', progress: 98.5, color: '#4ade80' },
  { id: 'sleep-goal', name: 'Sleep Hours', current: 8.2, target: 8, unit: 'hours', progress: 102.5, color: '#8b5cf6' },
  { id: 'water-goal', name: 'Water Intake', current: 2.8, target: 3, unit: 'liters', progress: 93.3, color: '#3b82f6' },
  { id: 'workout-goal', name: 'Workouts', current: 5, target: 6, unit: 'sessions', progress: 83.3, color: '#f59e0b' },
];

const sampleAchievements: Achievement[] = [
  { id: 'step-master', title: 'Step Master', description: 'Reached 10,000 steps for 7 consecutive days', date: '2025-12-10', icon: <Award className="w-6 h-6 text-yellow-400" />, rarity: 'rare' },
  { id: 'sleep-champion', title: 'Sleep Champion', description: 'Maintained 8+ hours sleep for 5 nights straight', date: '2025-12-13', icon: <Moon className="w-6 h-6 text-purple-400" />, rarity: 'epic' },
  { id: 'hydration-hero', title: 'Hydration Hero', description: 'Hit daily water goal for 14 days', date: '2025-12-08', icon: <Zap className="w-6 h-6 text-blue-400" />, rarity: 'common' },
];

export default function HealthVitalityDashboard() {
  const [artworks, setArtworks] = useState<ArtworkState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<HealthDataPoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Simulate data loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Load gallery images
        await loadGalleryImages();
        
        // Set health data
        setHealthData(sampleHealthData);
        setLastUpdated(new Date());
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const loadGalleryImages = async () => {
    try {
      // Fetch ONLY gallery images for admin
      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`) // Critical filter
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading gallery images:', error);
        return;
      }

      const initialState: ArtworkState = {};
      DASHBOARD_ARTWORKS.forEach(art => initialState[art.id] = { image_url: null });

      if (images) {
        const latestImagePerArtwork: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          // Path structure: [user_id, gallery_prefix, artwork_id, filename]
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            // Only consider defined artworks and take the latest
            if (DASHBOARD_ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        // Build final state with only relevant artworks
        DASHBOARD_ARTWORKS.forEach(art => {
          if (latestImagePerArtwork[art.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerArtwork[art.id]).data.publicUrl;
            initialState[art.id] = { image_url: url };
          }
        });
      }

      setArtworks(initialState);
    } catch (error) {
      console.error('Error loading gallery images:', error);
    }
  };

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
      
      // Show success animation
      await new Promise(resolve => setTimeout(resolve, 300));
      
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

  // Calculate trends and insights
  const healthInsights = useMemo(() => {
    if (healthData.length === 0) return {
      avgSteps: 0,
      avgSleep: 0,
      bestSleepDay: '',
      mostActiveDay: '',
      stressTrend: 'neutral'
    };

    const avgSteps = Math.round(healthData.reduce((sum, day) => sum + day.steps, 0) / healthData.length);
    const avgSleep = parseFloat((healthData.reduce((sum, day) => sum + day.sleepHours, 0) / healthData.length).toFixed(1));
    
    const bestSleepDay = healthData.reduce((best, current) => 
      current.sleepHours > best.sleepHours ? current : best
    ).date;
    
    const mostActiveDay = healthData.reduce((most, current) => 
      current.steps > most.steps ? current : most
    ).date;
    
    const recentStress = healthData.slice(-3).map(day => day.stressLevel);
    const stressTrend = recentStress[0] > recentStress[2] ? 'improving' : 
                       recentStress[0] < recentStress[2] ? 'worsening' : 'stable';

    return {
      avgSteps,
      avgSleep,
      bestSleepDay,
      mostActiveDay,
      stressTrend
    };
  }, [healthData]);

  // Get today's health data
  const todayData = useMemo(() => {
    return healthData[healthData.length - 1] || sampleHealthData[sampleHealthData.length - 1];
  }, [healthData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-700 font-medium">Loading your health dashboard...</p>
          <p className="text-sm text-indigo-500 mt-1">Personalizing your wellness insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden mr-3 text-indigo-600 hover:text-indigo-800"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Health Vitality</h1>
                  <p className="text-sm text-indigo-600 font-medium">Your Personal Wellness Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              
              <div className="relative group">
                <div className="flex items-center space-x-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                    HV
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">Jane Morgan</p>
                    <p className="text-xs text-indigo-600">Premium Plan</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
                </div>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 hidden group-hover:block z-50">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 flex items-center">
                    <Settings className="h-4 w-4 mr-2 text-indigo-500" />
                    Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-indigo-500" />
                    Profile
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Mobile only */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg md:hidden"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Health Vitality</h2>
                </div>
              </div>
              
              <nav className="p-4 space-y-1">
                {['overview', 'metrics', 'goals', 'insights', 'gallery'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                      activeTab === tab
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab === 'overview' && <Activity className="h-5 w-5" />}
                    {tab === 'metrics' && <TrendingUp className="h-5 w-5" />}
                    {tab === 'goals' && <Target className="h-5 w-5" />}
                    {tab === 'insights' && <Brain className="h-5 w-5" />}
                    {tab === 'gallery' && <ImageIcon className="h-5 w-5" />}
                    <span className="capitalize">{tab}</span>
                  </button>
                ))}
                
                {adminMode && (
                  <div className="mt-6 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-medium">👑 Admin Mode</p>
                    <p className="text-xs text-indigo-500 mt-1">Manage gallery assets and content</p>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Metrics & Goals */}
            <div className="lg:col-span-2 space-y-8">
              {/* Welcome Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Good morning, Jane! 🌞</h2>
                    <p className="text-gray-600 mt-1">Here's your wellness snapshot for today</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Last updated</p>
                    <p className="font-medium text-indigo-600">
                      {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {sampleMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          {metric.id === 'steps' && <Activity className="h-5 w-5 text-indigo-600" />}
                          {metric.id === 'heart' && <Heart className="h-5 w-5 text-red-500" />}
                          {metric.id === 'sleep' && <Moon className="h-5 w-5 text-purple-600" />}
                          {metric.id === 'calories' && <Flame className="h-5 w-5 text-orange-500" />}
                        </div>
                        <span className={`text-sm font-medium ${
                          metric.trend === 'up' ? 'text-green-600' : 
                          metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {metric.trend === 'up' && <ArrowUpRight className="inline h-4 w-4 mr-1" />}
                          {metric.trend === 'down' && <ArrowDownRight className="inline h-4 w-4 mr-1" />}
                          {metric.trendValue}% {metric.trend}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                      <p className="text-sm text-gray-500">{metric.name}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Brain className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-indigo-800">AI-Powered Insight</p>
                      <p className="text-sm text-indigo-600 mt-1">
                        Your sleep quality has improved by 15% this week! 
                        <span className="font-medium">Try maintaining this routine</span> for even better recovery.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Health Trends Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Health Trends</h2>
                    <p className="text-gray-500 text-sm">Your weekly progress across key metrics</p>
                  </div>
                  <div className="flex space-x-2">
                    {['7d', '14d', '30d'].map((period) => (
                      <button
                        key={period}
                        className={`px-3 py-1 text-sm rounded-lg ${
                          period === '7d'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={healthData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fontFamily: 'inherit' }}
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      />
                      <YAxis 
                        yAxisId="left" 
                        tick={{ fontSize: 12, fontFamily: 'inherit' }} 
                        label={{ value: 'Steps', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tick={{ fontSize: 12, fontFamily: 'inherit' }} 
                        label={{ value: 'Sleep (hrs)', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                        labelStyle={{ fontWeight: 'bold' }}
                        formatter={(value, name) => {
                          if (name === 'steps') return [`${value.toLocaleString()} steps`, 'Daily Steps'];
                          if (name === 'sleepHours') return [`${value} hours`, 'Sleep Duration'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="steps" 
                        stroke="#4ade80" 
                        fill="#4ade80" 
                        fillOpacity={0.1}
                        name="Daily Steps"
                      />
                      <Area 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="sleepHours" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.1}
                        name="Sleep Hours"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Goals & Achievements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Your Goals & Achievements</h2>
                    <p className="text-gray-500 text-sm">Track your progress and celebrate wins</p>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    View all goals →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {sampleGoals.map((goal, index) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          goal.progress >= 100
                            ? 'bg-green-100 text-green-800'
                            : goal.progress >= 80
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {goal.progress >= 100 ? '✅ Completed' : '🎯 In Progress'}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            goal.progress >= 100 ? 'bg-green-500' : goal.color
                          }`}
                          style={{ width: `${Math.min(goal.progress, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{goal.current} {goal.unit}</span>
                        <span>{goal.target} {goal.unit} target</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Recent Achievements</h3>
                  <div className="space-y-3">
                    {sampleAchievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className={`flex items-start space-x-3 p-3 rounded-lg ${
                          achievement.rarity === 'epic'
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'
                            : achievement.rarity === 'rare'
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          achievement.rarity === 'epic' ? 'bg-purple-100' :
                          achievement.rarity === 'rare' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {achievement.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                            {achievement.rarity === 'epic' && (
                              <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">EPIC</span>
                            )}
                            {achievement.rarity === 'rare' && (
                              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">RARE</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Unlocked on {achievement.date}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Insights & Gallery */}
            <div className="space-y-8">
              {/* Today's Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Summary</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Sun className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium text-gray-900">Morning Routine Complete</p>
                        <p className="text-sm text-indigo-600">Meditation + Light Exercise</p>
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Heart className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900">Heart Rate Recovery</p>
                        <p className="text-sm text-blue-600">Excellent (58 bpm resting)</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-blue-600">Optimal</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Moon className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium text-gray-900">Sleep Quality</p>
                        <p className="text-sm text-purple-600">Deep sleep: 2.1 hours</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-purple-600">8.2/10</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="font-medium text-gray-900">Stress Level</p>
                        <p className="text-sm text-amber-600">Slightly elevated afternoon</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-amber-600">Level 2/5</span>
                  </div>
                </div>

                <button className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">
                  Start Evening Wind-Down Routine
                </button>
              </motion.div>

              {/* Wellness Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Wellness Gallery</h2>
                    <p className="text-gray-500 text-sm">Inspiring wellness moments and insights</p>
                  </div>
                  {adminMode && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                      Admin Mode
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {DASHBOARD_ARTWORKS.map((art) => {
                    const artworkData = artworks[art.id] || { image_url: null };
                    const imageUrl = artworkData.image_url;

                    return (
                      <motion.div
                        key={art.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200"
                      >
                        {imageUrl ? (
                          <div className="relative group">
                            <img 
                              src={imageUrl} 
                              alt={art.title} 
                              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-wellness.jpg';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-4 left-4 text-white">
                                <h3 className="font-bold text-lg">{art.title}</h3>
                                <p className="text-sm opacity-90">{art.prompt.substring(0, 60)}...</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                            <div className="text-center p-4">
                              <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                                <ImageIcon className="h-6 w-6 text-indigo-600" />
                              </div>
                              <p className="text-gray-500 text-sm">{art.title}</p>
                              <p className="text-xs text-indigo-500 mt-1 max-w-xs mx-auto">
                                {art.prompt.substring(0, 40)}...
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">{art.title}</h3>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {art.prompt.substring(0, 80)}...
                              </p>
                            </div>
                            
                            {adminMode && (
                              <div className="flex flex-col items-end space-y-2">
                                <button
                                  onClick={() => copyPrompt(art.prompt, art.id)}
                                  className={`text-xs ${
                                    copiedId === art.id 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  } px-2 py-1 rounded flex items-center`}
                                  type="button"
                                >
                                  {copiedId === art.id ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Copied!
                                    </>
                                  ) : (
                                    'Copy Prompt'
                                  )}
                                </button>
                                
                                <label className={`block text-xs ${
                                  uploading === art.id 
                                    ? 'bg-gray-300' 
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                } text-white px-2 py-1 rounded cursor-pointer`}>
                                  {uploading === art.id ? (
                                    <span className="flex items-center">
                                      <span className="animate-spin mr-1">⟳</span>
                                      Uploading...
                                    </span>
                                  ) : (
                                    'Upload Image'
                                  )}
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
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {adminMode && (
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
                    <p className="text-indigo-700">
                      👤 Admin mode active — upload wellness-themed images and copy detailed prompts for AI generation.
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white"
              >
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <p className="text-indigo-100 mb-6">What would you like to do today?</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Calendar className="h-5 w-5" />, text: 'Schedule Workout' },
                    { icon: <Clock className="h-5 w-5" />, text: 'Set Sleep Timer' },
                    { icon: <Target className="h-5 w-5" />, text: 'Update Goals' },
                    { icon: <Users className="h-5 w-5" />, text: 'Connect Devices' },
                  ].map((action, index) => (
                    <button
                      key={index}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 text-left transition-all flex items-center space-x-3"
                    >
                      <div className="bg-white/20 p-2 rounded-lg">{action.icon}</div>
                      <span className="font-medium">{action.text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center text-gray-500 text-sm py-4 border-t border-gray-100">
            <p>
              © {new Date().getFullYear()} Health Vitality — AI-Powered Health Tracking Platform
            </p>
            <p className="mt-1">
              Your data is secure and private • Advanced analytics powered by machine learning
            </p>
          </footer>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around py-3">
          {['overview', 'metrics', 'goals', 'gallery'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center space-y-1 p-2 ${
                activeTab === tab
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' && <Activity className="h-6 w-6" />}
              {tab === 'metrics' && <TrendingUp className="h-6 w-6" />}
              {tab === 'goals' && <Target className="h-6 w-6" />}
              {tab === 'gallery' && <ImageIcon className="h-6 w-6" />}
              <span className="text-xs font-medium capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper components
const ImageIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Flame = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 3v1m6-2v2M6 19v1m6-2v2M5 5v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
  </svg>
);