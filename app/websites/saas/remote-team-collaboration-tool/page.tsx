'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiUsers, FiActivity, FiCalendar, FiFileText, FiSettings, FiBell, FiSearch, FiPlus, FiArrowRight, FiClock, FiCheckCircle, FiMessageCircle } from 'react-icons/fi';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Mock data for the dashboard
const TEAM_MEMBERS = [
  { id: 'member1', name: 'Alex Rivera', role: 'Product Manager', status: 'online', lastActive: '2m ago' },
  { id: 'member2', name: 'Maya Chen', role: 'Frontend Developer', status: 'online', lastActive: '5m ago' },
  { id: 'member3', name: 'Jamal Washington', role: 'UX Designer', status: 'away', lastActive: '30m ago' },
  { id: 'member4', name: 'Sophia Patel', role: 'Backend Engineer', status: 'offline', lastActive: '2h ago' },
  { id: 'member5', name: 'Marcus Johnson', role: 'DevOps Specialist', status: 'online', lastActive: '10m ago' },
];

const PROJECTS = [
  { id: 'proj1', name: 'Mobile App Redesign', progress: 75, deadline: 'Dec 20, 2025', tasks: 12, completed: 9 },
  { id: 'proj2', name: 'API Integration', progress: 45, deadline: 'Jan 15, 2026', tasks: 20, completed: 9 },
  { id: 'proj3', name: 'Dashboard Analytics', progress: 90, deadline: 'Dec 18, 2025', tasks: 15, completed: 14 },
  { id: 'proj4', name: 'User Authentication', progress: 30, deadline: 'Jan 5, 2026', tasks: 25, completed: 8 },
];

const RECENT_ACTIVITY = [
  { id: 'act1', type: 'task', member: 'Alex Rivera', action: 'completed task', target: '"User Login Flow"', time: '10:23 AM' },
  { id: 'act2', type: 'comment', member: 'Maya Chen', action: 'commented on', target: '"Mobile UI Mockups"', time: '10:15 AM' },
  { id: 'act3', type: 'file', member: 'Jamal Washington', action: 'uploaded file', target: '"Design System v2.pdf"', time: '9:45 AM' },
  { id: 'act4', type: 'project', member: 'Sophia Patel', action: 'updated project', target: '"API Documentation"', time: '9:30 AM' },
];

const TEAM_PERFORMANCE_DATA = [
  { week: 'Week 1', tasksCompleted: 45, hoursLogged: 120 },
  { week: 'Week 2', tasksCompleted: 62, hoursLogged: 135 },
  { week: 'Week 3', tasksCompleted: 58, hoursLogged: 128 },
  { week: 'Week 4', tasksCompleted: 73, hoursLogged: 142 },
];

const PROJECT_STATUS_DATA = [
  { name: 'On Track', value: 65, color: '#10B981' },
  { name: 'At Risk', value: 25, color: '#F59E0B' },
  { name: 'Behind', value: 10, color: '#EF4444' },
];

// Gallery Skeleton Component Integration
const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery'; // Dedicated identifier for gallery images

const GALLERY_ARTWORKS = [
  { 
    id: 'team-member-1', 
    title: 'Alex Rivera - Product Manager',
    prompt: 'Professional headshot of a confident South Asian man in his 30s, wearing business casual attire, neutral background, warm lighting, approachable expression, high resolution'
  },
  { 
    id: 'team-member-2', 
    title: 'Maya Chen - Frontend Developer',
    prompt: 'Professional portrait of an Asian woman in her late 20s, modern tech workspace background, wearing stylish glasses, friendly smile, natural lighting, crisp details'
  },
  { 
    id: 'team-member-3', 
    title: 'Jamal Washington - UX Designer',
    prompt: 'Professional headshot of an African American man in his early 30s, creative studio environment background, wearing modern casual attire, thoughtful expression, soft lighting'
  },
  { 
    id: 'team-member-4', 
    title: 'Sophia Patel - Backend Engineer',
    prompt: 'Professional portrait of a South Asian woman in her mid-20s, clean office background with monitors visible, wearing professional attire, warm smile, natural daylight'
  },
  { 
    id: 'team-member-5', 
    title: 'Marcus Johnson - DevOps Specialist',
    prompt: 'Professional headshot of a Caucasian man in his late 30s, tech-heavy workspace background with servers visible, wearing casual business attire, confident expression, professional lighting'
  },
];

type ArtworkState = { [key: string]: { image_url: string | null } };

function GallerySkeletonForTeam() {
  const [artworks, setArtworks] = useState<ArtworkState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      if (isMounted.current) {
        setUserId(uid);
        setAdminMode(uid === ADMIN_USER_ID);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      if (!isMounted.current) return;

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
      GALLERY_ARTWORKS.forEach(art => initialState[art.id] = { image_url: null });

      if (images) {
        const latestImagePerArtwork: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          // Path structure: [user_id, gallery_prefix, artwork_id, filename]
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const artId = pathParts[2];
            // Only consider defined artworks and take the latest
            if (GALLERY_ARTWORKS.some(a => a.id === artId) && !latestImagePerArtwork[artId]) {
              latestImagePerArtwork[artId] = img.path;
            }
          }
        }

        // Build final state with only relevant artworks
        GALLERY_ARTWORKS.forEach(art => {
          if (latestImagePerArtwork[art.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerArtwork[art.id]).data.publicUrl;
            if (isMounted.current) {
              initialState[art.id] = { image_url: url };
            }
          }
        });
      }

      if (isMounted.current) {
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
      if (isMounted.current) {
        setArtworks(prev => ({ ...prev, [artworkId]: { image_url: publicUrl } }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      if (isMounted.current) {
        setUploading(null);
      }
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, artworkId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      if (isMounted.current) {
        setCopiedId(artworkId);
        setTimeout(() => {
          if (isMounted.current) {
            setCopiedId(null);
          }
        }, 2000);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Team Member Profiles</h3>
        {adminMode && (
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
            Admin Mode: Upload custom profile images
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {GALLERY_ARTWORKS.map((art) => {
          const artworkData = artworks[art.id] || { image_url: null };
          const imageUrl = artworkData.image_url;

          return (
            <div key={art.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative w-full h-48">
                {imageUrl ? (
                  <Image 
                    src={imageUrl} 
                    alt={art.title} 
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                    placeholder="blur"
                    blurDataURL="/placeholder-image.jpg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center p-2">
                      <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          {art.title.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">No profile image</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3">
                <h4 className="font-medium text-gray-900 truncate">{art.title}</h4>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {art.title.split(' - ')[1] || 'Team Member'}
                </p>

                {adminMode && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => copyPrompt(art.prompt, art.id)}
                        className={`text-xs w-full ${copiedId === art.id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-2 py-1.5 rounded transition-colors`}
                        type="button"
                      >
                        {copiedId === art.id ? 'Copied!' : 'Copy AI Image Prompt'}
                      </button>
                      <label className="block w-full">
                        <span className={`text-xs inline-block w-full text-center ${uploading === art.id ? 'bg-blue-100 text-blue-800' : 'bg-blue-500 text-white'} px-2 py-1.5 rounded cursor-pointer hover:bg-blue-600 transition-colors`}>
                          {uploading === art.id ? 'Uploading…' : 'Upload Profile Image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, art.id)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {adminMode && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Admin Tip:</strong> Use the prompts above with AI image generators like DALL-E, Midjourney, or Stable Diffusion to create professional profile images for your team members. Upload the generated images directly to each profile.
        </div>
      )}
    </div>
  );
}

// Custom Bar Chart Component
function TeamPerformanceChart() {
  const maxValue = Math.max(
    ...TEAM_PERFORMANCE_DATA.map(d => Math.max(d.tasksCompleted, d.hoursLogged))
  );
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Tasks Completed</span>
        <span>Hours Logged</span>
      </div>
      
      <div className="space-y-6">
        {TEAM_PERFORMANCE_DATA.map((data, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-600">{data.week}</span>
              <span className="text-gray-600">{data.tasksCompleted} tasks</span>
            </div>
            
            <div className="flex space-x-2 h-8">
              {/* Tasks Completed Bar */}
              <div 
                className="bg-blue-500 rounded-l-lg flex items-center justify-end pr-2 text-white text-xs font-medium"
                style={{ 
                  width: `${(data.tasksCompleted / maxValue) * 90}%`,
                  minWidth: '40px'
                }}
              >
                {data.tasksCompleted}
              </div>
              
              {/* Hours Logged Bar */}
              <div 
                className="bg-emerald-500 rounded-r-lg flex items-center pl-2 text-white text-xs font-medium"
                style={{ 
                  width: `${(data.hoursLogged / maxValue) * 90}%`,
                  minWidth: '40px'
                }}
              >
                {data.hoursLogged}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex space-x-3 text-xs mt-2">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
          <span>Tasks</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-emerald-500 rounded mr-1"></div>
          <span>Hours</span>
        </div>
      </div>
    </div>
  );
}

// Custom Pie Chart Component
function ProjectStatusChart() {
  const total = PROJECT_STATUS_DATA.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {PROJECT_STATUS_DATA.map((item, index) => {
            const percentage = item.value / total;
            const endAngle = startAngle + percentage * 360;
            const largeArcFlag = percentage > 0.5 ? 1 : 0;
            
            // Calculate path points
            const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
            const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
            const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
            const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
            
            const path = `
              M 50 50
              L ${startX} ${startY}
              A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}
              Z
            `;
            
            startAngle = endAngle;
            
            return (
              <path
                key={index}
                d={path}
                fill={item.color}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Center circle for label */}
          <circle cx="50" cy="50" r="20" fill="white" stroke="#e5e7eb" strokeWidth="2" />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500">Projects</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-xs">
        {PROJECT_STATUS_DATA.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
            <span className="text-xs font-medium mt-1">{item.name}</span>
            <span className="text-xs text-gray-500">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RemoteTeamDashboard() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0]);

  // Define mock images with proper typing
  const mockImages: Record<string, string> = {
    'member1': '/placeholder-image.jpg',
    'member2': '/placeholder-image.jpg',
    'member3': '/placeholder-image.jpg',
    'member4': '/placeholder-image.jpg',
    'member5': '/placeholder-image.jpg',
  };

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Auto-update notification count
  useEffect(() => {
    const interval = setInterval(() => {
      setNotificationCount(prev => {
        const newCount = prev + 1;
        return newCount > 9 ? 1 : newCount;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredTeamMembers = TEAM_MEMBERS.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMemberImageUrl = (memberId: string) => {
    return mockImages[memberId] || '/placeholder-image.jpg';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-700">
            <FiUsers className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-4">
            <button className="relative text-gray-700">
              <FiBell className="h-6 w-6" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </button>
            <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white"></div>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar - Desktop */}
        <div className={`hidden lg:block lg:w-64 bg-white border-r border-gray-200 h-screen sticky top-0`}>
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="font-bold text-xl text-gray-900">CollaboratePro</span>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', icon: FiActivity, label: 'Dashboard' },
                { id: 'projects', icon: FiFileText, label: 'Projects' },
                { id: 'team', icon: FiUsers, label: 'Team' },
                { id: 'calendar', icon: FiCalendar, label: 'Calendar' },
                { id: 'reports', icon: FiFileText, label: 'Reports' },
                { id: 'settings', icon: FiSettings, label: 'Settings' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${currentView === item.id ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 hidden lg:block sticky top-0 z-30">
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search projects, team members, or tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="relative text-gray-700 hover:text-gray-900">
                  <FiBell className="h-6 w-6" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    {TEAM_MEMBERS.slice(0, 3).map((member, index) => (
                      <div key={index} className="relative">
                        <div className={`w-8 h-8 rounded-full border-2 border-white ${getStatusColor(member.status)}`}>
                          <img 
                            src={getMemberImageUrl(member.id)} 
                            alt={member.name} 
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>
                        {index === 2 && TEAM_MEMBERS.length > 3 && (
                          <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center border-2 border-white">
                            +{TEAM_MEMBERS.length - 3}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Good morning, Alex!</p>
                    <p className="text-xs text-gray-500">4 team members online</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="p-4 lg:p-6 space-y-6">
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                {/* Welcome Banner */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div className="mb-4 md:mb-0">
                      <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, Alex!</h1>
                      <p className="text-blue-100 text-lg">You have 3 pending tasks and 2 project updates today</p>
                    </div>
                    <button className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center">
                      <FiPlus className="mr-2 h-4 w-4" />
                      New Project
                    </button>
                  </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {[
                    { title: 'Active Projects', value: '4', change: '+12%', icon: FiFileText, color: 'text-blue-600' },
                    { title: 'Team Members', value: '5', change: '+1', icon: FiUsers, color: 'text-green-600' },
                    { title: 'Tasks Completed', value: '287', change: '+15%', icon: FiCheckCircle, color: 'text-purple-600' },
                    { title: 'Avg. Response Time', value: '2h 15m', change: '-18%', icon: FiClock, color: 'text-orange-600' },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                          <p className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'} mt-1`}>
                            {stat.change} this week
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color.replace('text', 'bg').replace('600', '100')}`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Projects & Activity */}
                  <div className="space-y-6 lg:col-span-2">
                    {/* Projects Overview */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors">
                          View all
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {PROJECTS.slice(0, 4).map((project) => (
                              <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center">
                                    <div className="w-2 h-8 bg-blue-500 rounded mr-3"></div>
                                    <div>
                                      <p className="font-medium text-gray-900">{project.name}</p>
                                      <p className="text-xs text-gray-500">{project.completed}/{project.tasks} tasks completed</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full`} 
                                      style={{ width: `${project.progress}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">{project.progress}% complete</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm font-medium text-gray-900">{project.deadline}</p>
                                  <p className={`text-xs font-medium ${new Date(project.deadline) < new Date() ? 'text-red-500' : 'text-green-500'}`}>
                                    {new Date(project.deadline) < new Date() ? 'Overdue' : 'On track'}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex -space-x-2">
                                    {TEAM_MEMBERS.slice(0, 3).map((member, index) => (
                                      <div key={index} className="relative">
                                        <div className={`w-6 h-6 rounded-full border-2 border-white ${getStatusColor(member.status)}`}>
                                          <img 
                                            src={getMemberImageUrl(member.id)} 
                                            alt={member.name} 
                                            className="w-full h-full rounded-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {RECENT_ACTIVITY.map((activity) => (
                          <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${
                                activity.type === 'task' ? 'bg-green-100' : 
                                activity.type === 'comment' ? 'bg-blue-100' : 
                                activity.type === 'file' ? 'bg-purple-100' : 'bg-yellow-100'
                              }`}>
                                {activity.type === 'task' && <FiCheckCircle className="h-5 w-5 text-green-600" />}
                                {activity.type === 'comment' && <FiMessageCircle className="h-5 w-5 text-blue-600" />}
                                {activity.type === 'file' && <FiFileText className="h-5 w-5 text-purple-600" />}
                                {activity.type === 'project' && <FiFileText className="h-5 w-5 text-yellow-600" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-medium text-gray-900">{activity.member}</span>
                                  <span className="text-gray-500 mx-1">{activity.action}</span>
                                  <span className="font-medium text-gray-900">{activity.target}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Right Column - Team & Analytics */}
                  <div className="space-y-6">
                    {/* Team Performance */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Team Performance</h2>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Last 4 weeks</span>
                      </div>
                      <div className="h-64 flex items-center justify-center">
                        <TeamPerformanceChart />
                      </div>
                    </motion.div>

                    {/* Project Status */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                    >
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h2>
                      <div className="h-48 flex items-center justify-center">
                        <ProjectStatusChart />
                      </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.9 }}
                      className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100"
                    >
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                      <div className="space-y-3">
                        {[ 
                          { icon: FiPlus, label: 'Create New Project', color: 'text-indigo-600' },
                          { icon: FiFileText, label: 'Add Task', color: 'text-blue-600' },
                          { icon: FiMessageCircle, label: 'Start Discussion', color: 'text-green-600' },
                          { icon: FiCalendar, label: 'Schedule Meeting', color: 'text-purple-600' }
                        ].map((action, index) => (
                          <button
                            key={index}
                            className={`w-full flex items-center space-x-3 p-3 rounded-lg bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all ${index === 0 ? 'border-indigo-300 shadow-sm' : ''}`}
                          >
                            <div className={`p-2 rounded-lg ${action.color.replace('text', 'bg').replace('600', '100')}`}>
                              <action.icon className={`h-5 w-5 ${action.color}`} />
                            </div>
                            <span className="font-medium text-gray-900">{action.label}</span>
                            {index === 0 && (
                              <span className="ml-auto text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                                Recommended
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Team Gallery Integration */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                >
                  <GallerySkeletonForTeam />
                </motion.div>
              </div>
            )}

            {currentView === 'team' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <FiPlus className="mr-2 h-4 w-4" />
                    Add Team Member
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTeamMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className={`w-16 h-16 rounded-full border-2 border-white ${getStatusColor(member.status)}`}>
                              <img 
                                src={getMemberImageUrl(member.id)} 
                                alt={member.name} 
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                }}
                              />
                            </div>
                            <span className={`absolute -bottom-1 -right-1 block h-4 w-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                            <p className="text-blue-600 font-medium">{member.role}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Last active: {member.lastActive}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-2">
                            <button className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                              Message
                            </button>
                            <button className="w-full bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                              Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <FiPlus className="mr-2 h-4 w-4" />
                    New Project
                  </button>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                      {['Active', 'Completed', 'Archived'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab.toLowerCase())}
                          className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab.toLowerCase()
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </nav>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {PROJECTS.map((project) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                          onClick={() => setSelectedProject(project)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                              <p className="text-gray-600 mt-1 text-sm">Due: {project.deadline}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              project.progress >= 90 ? 'bg-green-100 text-green-800' :
                              project.progress >= 50 ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {project.progress >= 90 ? 'Nearly Complete' : 
                               project.progress >= 50 ? 'In Progress' : 'Getting Started'}
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full`} 
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">{project.progress}% complete</p>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                            <div className="flex -space-x-2">
                              {TEAM_MEMBERS.slice(0, 3).map((member, index) => (
                                <div key={index} className="relative">
                                  <div className={`w-6 h-6 rounded-full border-2 border-white ${getStatusColor(member.status)}`}>
                                    <img 
                                      src={getMemberImageUrl(member.id)} 
                                      alt={member.name} 
                                      className="w-full h-full rounded-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                              View Details
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl z-50">
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-8">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="font-bold text-xl text-gray-900">CollaboratePro</span>
              </div>

              <nav className="space-y-1">
                {[
                  { id: 'dashboard', icon: FiActivity, label: 'Dashboard' },
                  { id: 'projects', icon: FiFileText, label: 'Projects' },
                  { id: 'team', icon: FiUsers, label: 'Team' },
                  { id: 'calendar', icon: FiCalendar, label: 'Calendar' },
                  { id: 'reports', icon: FiFileText, label: 'Reports' },
                  { id: 'settings', icon: FiSettings, label: 'Settings' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${currentView === item.id ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}