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

// Admin configuration (matches GallerySkeleton requirements)
const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Impact story templates for admin uploads
const IMPACT_STORIES = [
  { 
    id: 'classroom-transformation', 
    title: 'Classroom Transformation',
    prompt: 'A warm, sunlit rural classroom in Appalachia with engaged students learning on new laptops, teacher smiling proudly, books and educational materials visible, authentic rural setting with mountains visible through window, hopeful atmosphere, documentary photography style'
  },
  { 
    id: 'mentorship-moment', 
    title: 'Mentorship Moment',
    prompt: 'Close-up of hands: an elderly community elder teaching a young student traditional woodworking skills in a rustic workshop, sawdust in air, warm golden hour lighting, genuine connection, authentic rural craftsmanship scene'
  },
  { 
    id: 'digital-access', 
    title: 'Digital Access Bridge',
    prompt: 'Group of rural youth gathered around a mobile tech lab van parked in a small Appalachian town, students excitedly using tablets and laptops, community members watching with hope, mountain backdrop, vibrant community spirit'
  },
];

type StoryState = { [key: string]: { image_url: string | null } };

function ImpactGallery() {
  const [stories, setStories] = useState<StoryState>({});
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
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        return;
      }

      const initialState: StoryState = {};
      IMPACT_STORIES.forEach(story => initialState[story.id] = { image_url: null });

      if (images) {
        const latestImagePerStory: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const storyId = pathParts[2];
            if (IMPACT_STORIES.some(s => s.id === storyId) && !latestImagePerStory[storyId]) {
              latestImagePerStory[storyId] = img.path;
            }
          }
        }

        IMPACT_STORIES.forEach(story => {
          if (latestImagePerStory[story.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerStory[story.id]).data.publicUrl;
            initialState[story.id] = { image_url: url };
          }
        });
      }

      setStories(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, storyId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(storyId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${storyId}/`;

      // Clean up OLD gallery images for this story
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
      setStories(prev => ({ ...prev, [storyId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, storyId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(storyId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {IMPACT_STORIES.map((story) => {
        const storyData = stories[story.id] || { image_url: null };
        const imageUrl = storyData.image_url;

        return (
          <div key={story.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 md:h-72">
              {imageUrl ? (
                <Image 
                  src={imageUrl} 
                  alt={story.title} 
                  fill
                  className="object-cover"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/placeholder-image.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-blue-600 font-bold text-xl">+</span>
                    </div>
                    <p className="text-gray-600 font-medium">Impact story image will appear here</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{story.title}</h3>
              
              {adminMode && imageUrl && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700 font-medium">Admin: Image uploaded successfully</p>
                </div>
              )}

              {adminMode && !imageUrl && (
                <div className="space-y-3 mt-3">
                  <p className="text-sm text-gray-600 italic">{story.prompt}</p>
                  <button
                    onClick={() => copyPrompt(story.prompt, story.id)}
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded transition-colors"
                    type="button"
                  >
                    {copiedId === story.id ? 'Copied!' : 'Copy AI Prompt'}
                  </button>
                </div>
              )}

              <div className="mt-4">
                {adminMode ? (
                  <label className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer text-center font-medium transition-colors">
                    {uploading === story.id ? 'Uploading...' : 'Upload Impact Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, story.id)}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {story.id === 'classroom-transformation' && 'Students in Mountain View Elementary gained access to modern technology and personalized learning resources.'}
                    {story.id === 'mentorship-moment' && 'Intergenerational knowledge transfer preserves cultural heritage while building future leaders.'}
                    {story.id === 'digital-access' && 'Mobile tech labs bring digital literacy to remote communities, bridging the opportunity gap.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  const [stats, setStats] = useState({
    students: 1240,
    communities: 18,
    mentors: 85,
    graduation: 94
  });

  useEffect(() => {
    // Simulate count-up animation for impact stats
    const animateStats = () => {
      const targets = {
        students: 1240,
        communities: 18,
        mentors: 85,
        graduation: 94
      };

      const durations = {
        students: 2000,
        communities: 1500,
        mentors: 1800,
        graduation: 2200
      };

      Object.entries(targets).forEach(([key, target]) => {
        const element = document.getElementById(`stat-${key}`);
        if (!element) return;

        let start = 0;
        const duration = durations[key as keyof typeof durations];
        const increment = target / (duration / 16); // 60fps approximation

        const updateCount = () => {
          start += increment;
          if (start >= target) {
            element.textContent = target.toLocaleString() + (key === 'graduation' ? '%' : '');
          } else {
            element.textContent = Math.floor(start).toLocaleString() + (key === 'graduation' ? '%' : '');
            requestAnimationFrame(updateCount);
          }
        };

        updateCount();
      });
    };

    animateStats();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-green-600 text-white rounded-lg p-2">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="font-bold text-xl text-gray-900">Rural Roots</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#impact" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Our Impact</a>
              <a href="#stories" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Success Stories</a>
              <a href="#programs" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Programs</a>
              <a href="#support" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Get Involved</a>
            </nav>
            
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg">
              Donate Today
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Bridging the <span className="text-green-600">Opportunity Gap</span> in Rural Appalachia
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl">
                  We empower underserved rural youth through education, mentorship, and digital access, breaking cycles of poverty and building thriving communities.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Support Our Mission
                </button>
                <button className="bg-white text-green-600 border-2 border-green-600 hover:bg-green-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors">
                  Learn Our Story
                </button>
              </div>
              
              <div className="flex items-center space-x-4 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                      {i * 2}
                    </div>
                  ))}
                </div>
                <p className="text-gray-600">
                  <span className="font-bold text-gray-900">500+</span> community members impacted last year
                </p>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-3xl blur-2xl opacity-30 animate-pulse" />
              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                    <span className="font-medium text-gray-600">Real-time impact</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">Sarah's Story</p>
                          <p className="text-sm text-gray-600 mt-1">Hazelton, KY • Age 17</p>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Success</span>
                      </div>
                      <p className="mt-3 text-gray-700">
                        "Rural Roots provided the laptop and mentorship I needed to apply for college scholarships. I'm the first in my family to attend university."
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">Community Tech Hub</p>
                          <p className="text-sm text-gray-600 mt-1">Pike County, WV</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Active</span>
                      </div>
                      <p className="mt-3 text-gray-700">
                        Mobile tech lab visited 12 communities last month, providing digital literacy training to 87 residents.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent z-0" />
      </section>

      {/* Impact Statistics */}
      <section id="impact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Measurable Impact, <span className="text-green-600">Real Change</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every investment in Rural Roots creates lasting transformation in communities often overlooked by traditional educational systems. [[1]]
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { id: 'students', label: 'Students Served', icon: 'users' },
              { id: 'communities', label: 'Communities Reached', icon: 'map-pin' },
              { id: 'mentors', label: 'Active Mentors', icon: 'heart' },
              { id: 'graduation', label: 'Graduation Rate', icon: 'award' }
            ].map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100 hover:border-green-200 transition-all duration-300">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d={stat.icon === 'users' ? 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' : 
                           stat.icon === 'map-pin' ? 'M12 8v4m0-4v4m0 0v4m0-4h4m-4 0H8' : 
                           stat.icon === 'heart' ? 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' : 
                           'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'} />
                    </svg>
                  </div>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  <span id={`stat-${stat.id}`}>0</span>
                </div>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stories Gallery */}
      <section id="stories" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              <span className="text-green-600">Real Stories,</span> Real Transformation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These are the faces and voices behind our mission. Each story represents a life changed through education, mentorship, and opportunity. [[7]]
            </p>
          </div>
          
          <ImpactGallery />
          
          <div className="mt-16 text-center">
            <div className="inline-block bg-green-50 text-green-700 px-6 py-3 rounded-xl font-medium">
              💡 Admin Tip: Upload images using the buttons above to showcase real community impact
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-green-600">Programs</span> Create Lasting Change
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We design programs that address the unique challenges of rural communities while building sustainable pathways to success. [[10]]
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Digital Access Initiative',
                description: 'Mobile tech labs bring computers, internet access, and digital literacy training to remote communities with limited infrastructure.',
                icon: 'wifi',
                stats: '12 mobile labs serving 450+ residents monthly'
              },
              {
                title: 'Mentorship Bridge',
                description: 'Connects rural youth with experienced professionals and community elders for career guidance, academic support, and cultural preservation.',
                icon: 'users',
                stats: '85 active mentors across 18 communities'
              },
              {
                title: 'Classroom Revival',
                description: 'Modernizes rural school facilities with technology, learning materials, and teacher training programs to create engaging educational environments.',
                icon: 'book-open',
                stats: '23 classrooms transformed since 2022'
              }
            ].map((program, index) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-8">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d={program.icon === 'wifi' ? 'M5.5 13.5l4.5-1.5-4.5-1.5M18.5 13.5l-4.5-1.5 4.5-1.5m-12 6V7.5a4.5 4.5 0 119 0v8.25m0-6.75h.008v.008H12v-.008z' : 
                           program.icon === 'users' ? 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' : 
                           'M4 6.5h16M4 11.5h16M4 16.5h16'} />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{program.title}</h3>
                  <p className="text-gray-600 mb-4">{program.description}</p>
                  <p className="text-green-600 font-medium">{program.stats}</p>
                </div>
                <div className="bg-green-50 px-8 py-4 border-t border-gray-100">
                  <button className="text-green-600 font-medium hover:text-green-700 transition-colors">
                    Learn More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Voices from the <span className="text-green-600">Community</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear directly from the students, families, and community leaders whose lives have been transformed through our work. [[5]]
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Marcus Johnson',
                role: 'Student, Age 16',
                location: 'Hazelton, Kentucky',
                quote: 'Before Rural Roots, I didn\'t think college was possible. Now I have a mentor who helps me apply for scholarships, and I\'m on track to be the first in my family to graduate university.',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'
              },
              {
                name: 'Dr. Patricia Miller',
                role: 'Principal, Mountain View Elementary',
                location: 'Pike County, West Virginia',
                quote: 'The technology resources and teacher training transformed our school. Student engagement has increased by 40%, and we\'re seeing real academic improvement.',
                image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80'
              },
              {
                name: 'Elder Robert Whitefeather',
                role: 'Community Mentor & Traditional Craftsman',
                location: 'Harlan County, Kentucky',
                quote: 'This program honors our heritage while preparing youth for the future. I teach woodworking and storytelling, preserving traditions that might otherwise be lost.',
                image: 'https://images.unsplash.com/photo-1560250097-4be4f9e0c9a2?auto=format&fit=crop&w=150&h=150&q=80'
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start mb-6">
                  <Image 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    width={60} 
                    height={60} 
                    className="rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600">{testimonial.role}</p>
                    <p className="text-sm text-green-600 mt-1">{testimonial.location}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic relative pl-6">
                  <span className="absolute left-0 top-0 text-green-400 text-3xl">"</span>
                  {testimonial.quote}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section id="support" className="py-24 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Be Part of the <span className="text-yellow-300">Transformation</span>
              </h2>
              <p className="text-xl text-green-100 max-w-2xl mx-auto">
                Your support creates real change in communities that need it most. Together, we can build a future where every rural child has the opportunity to thrive. [[9]]
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-green-700 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg">
                Make a Donation
              </button>
              <button className="bg-green-800 hover:bg-green-900 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors">
                Volunteer with Us
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-6">
              {[
                { amount: '$50', impact: 'Provides a month of internet access for a student' },
                { amount: '$250', impact: 'Supplies a complete tech kit for one classroom' },
                { amount: '$1,000', impact: 'Funds a full mentorship program for 10 students' }
              ].map((option, index) => (
                <div key={index} className="bg-green-700/50 backdrop-blur-sm rounded-lg p-4 border border-green-500/30">
                  <p className="text-2xl font-bold text-white">{option.amount}</p>
                  <p className="text-green-100">{option.impact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-green-600 text-white rounded-lg p-2">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="font-bold text-xl">Rural Roots</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering rural youth through education, mentorship, and opportunity since 2018.
              </p>
              <div className="flex space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                    <span className="sr-only">Social media link {i}</span>
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[ 
                {
                  title: 'Our Programs',
                  links: [
                    'Digital Access Initiative',
                    'Mentorship Bridge',
                    'Classroom Revival',
                    'Scholarship Fund'
                  ]
                },
                {
                  title: 'Get Involved',
                  links: [
                    'Donate Today',
                    'Volunteer Opportunities',
                    'Corporate Partnerships',
                    'Host a Fundraiser'
                  ]
                },
                {
                  title: 'About Us',
                  links: [
                    'Our Story',
                    'Team & Leadership',
                    'Annual Reports',
                    'Contact Us',
                    'Careers'
                  ]
                }
              ].map((column, index) => (
                <div key={index}>
                  <h3 className="text-lg font-bold text-white mb-4">{column.title}</h3>
                  <ul className="space-y-2">
                    {column.links.map((link, i) => (
                      <li key={i}>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>
              Rural Roots Education Initiative is a 501(c)(3) nonprofit organization. 
              EIN: 81-3456789
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} Rural Roots. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 animate-pulse">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}