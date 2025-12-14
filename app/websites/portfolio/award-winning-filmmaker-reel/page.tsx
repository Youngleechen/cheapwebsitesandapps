'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Play, Award, Calendar, Clock, Globe, Mail, Phone, MapPin, Instagram, Youtube, ChevronRight, Star, Quote, Film, Camera, Video } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'filmmaker';

// Dynamic content sections that can be updated via gallery system
const UPLOADABLE_SECTIONS = [
  { 
    id: 'hero-background', 
    title: 'Hero Background',
    description: 'Cinematic background image for the hero section',
    aspect: 'landscape',
    prompt: 'A breathtaking cinematic landscape at golden hour, with dramatic lighting, film camera equipment in foreground, and epic mountain backdrop. Cinematic, 16:9 aspect ratio, professional film photography style, shallow depth of field.'
  },
  { 
    id: 'featured-project-1', 
    title: 'Featured Project 1',
    description: 'Main featured film project showcase',
    aspect: 'cinematic',
    prompt: 'A stunning cinematic still from a documentary film showing emotional human connection. Warm tones, shallow depth of field, film grain, 2.35:1 cinematic aspect ratio, emotional lighting.'
  },
  { 
    id: 'featured-project-2', 
    title: 'Featured Project 2', 
    description: 'Second featured film project',
    aspect: 'cinematic',
    prompt: 'Dramatic action scene from a short film with dynamic lighting and movement. Cool blue tones with contrast, cinematic framing, motion blur, 2.35:1 aspect ratio.'
  },
  { 
    id: 'featured-project-3', 
    title: 'Featured Project 3',
    description: 'Third featured film project',
    aspect: 'cinematic',
    prompt: 'Intimate close-up from a character-driven drama with exceptional acting performance. Warm intimate lighting, emotional expression, film stock texture, cinematic aspect ratio.'
  },
  { 
    id: 'director-portrait', 
    title: 'Director Portrait',
    description: 'Professional portrait of the filmmaker',
    aspect: 'portrait',
    prompt: 'Professional portrait of a visionary film director on set, holding a camera, with dramatic lighting that creates interesting shadows. Cinematic, professional, authentic, 4:5 portrait aspect ratio.'
  },
  { 
    id: 'behind-scenes-1', 
    title: 'Behind the Scenes 1',
    description: 'Behind the scenes production photo',
    aspect: 'landscape',
    prompt: 'Behind the scenes on a professional film set with director working with actors, lighting equipment visible. Authentic, documentary style, natural lighting, 3:2 aspect ratio.'
  },
  { 
    id: 'behind-scenes-2', 
    title: 'Behind the Scenes 2',
    description: 'Second behind the scenes photo',
    aspect: 'landscape',
    prompt: 'Cinematic equipment setup on location - camera rigs, lighting, film crew in action. Professional film production, detailed, authentic, 16:9 aspect ratio.'
  },
  { 
    id: 'award-ceremony', 
    title: 'Award Ceremony',
    description: 'Photo from award ceremony or festival',
    aspect: 'landscape',
    prompt: 'Filmmaker accepting award at prestigious film festival, emotional moment, stage lighting, audience in background. Professional event photography, emotional, 3:2 aspect ratio.'
  },
];

type ImageState = { [key: string]: { image_url: string | null; loading: boolean } };
type GalleryImage = {
  id: string;
  title: string;
  description: string;
  aspect: string;
  prompt: string;
};

export default function FilmmakerPortfolio() {
  const [images, setImages] = useState<ImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Initialize all sections with loading state
  useEffect(() => {
    const initialState: ImageState = {};
    UPLOADABLE_SECTIONS.forEach(section => {
      initialState[section.id] = { image_url: null, loading: true };
    });
    setImages(initialState);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load gallery images
  useEffect(() => {
    const loadImages = async () => {
      const { data: galleryImages, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        // Set loading to false even on error
        setImages(prev => {
          const updated = { ...prev };
          UPLOADABLE_SECTIONS.forEach(section => {
            if (updated[section.id]) {
              updated[section.id].loading = false;
            }
          });
          return updated;
        });
        return;
      }

      const latestImages: Record<string, string> = {};

      if (galleryImages) {
        for (const img of galleryImages) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const imageId = pathParts[2];
            // Only take the latest image for each section
            if (UPLOADABLE_SECTIONS.some(s => s.id === imageId) && !latestImages[imageId]) {
              latestImages[imageId] = img.path;
            }
          }
        }
      }

      // Update state with loaded images
      setImages(prev => {
        const updated = { ...prev };
        UPLOADABLE_SECTIONS.forEach(section => {
          if (latestImages[section.id]) {
            const publicUrl = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImages[section.id]).data.publicUrl;
            updated[section.id] = { image_url: publicUrl, loading: false };
          } else {
            updated[section.id] = { image_url: null, loading: false };
          }
        });
        return updated;
      });
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(sectionId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${sectionId}/`;
      
      // Set loading state
      setImages(prev => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], loading: true }
      }));

      // Clean up old images for this section
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
      
      // Update state with new image
      setImages(prev => ({
        ...prev,
        [sectionId]: { image_url: publicUrl, loading: false }
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
      setImages(prev => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], loading: false }
      }));
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, sectionId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(sectionId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getImageUrl = (sectionId: string) => {
    return images[sectionId]?.image_url || null;
  };

  const isLoading = (sectionId: string) => {
    return images[sectionId]?.loading || false;
  };

  // Film projects data
  const filmProjects = [
    {
      id: 1,
      title: "Echoes of Silence",
      year: "2023",
      category: "Documentary Feature",
      duration: "87 min",
      awards: ["Sundance Grand Jury Prize", "IDA Award", "Cinema Eye Honors"],
      description: "An intimate portrait of a deaf community finding connection through vibration and touch.",
      vimeoId: "123456789"
    },
    {
      id: 2,
      title: "Midnight River",
      year: "2022",
      category: "Drama Short",
      duration: "22 min",
      awards: ["Cannes Short Film Palme d'Or", "SXSW Grand Jury Award"],
      description: "Two strangers share a transformative night along the banks of a forgotten river.",
      vimeoId: "987654321"
    },
    {
      id: 3,
      title: "The Last Lightkeeper",
      year: "2021",
      category: "Historical Drama",
      duration: "104 min",
      awards: ["Toronto International Film Festival", "Gotham Awards"],
      description: "A solitary lighthouse keeper faces his past when civilization reaches his remote island.",
      vimeoId: "456123789"
    }
  ];

  const awardsList = [
    { name: "Sundance Film Festival", award: "Grand Jury Prize", year: "2023" },
    { name: "Cannes Film Festival", award: "Short Film Palme d'Or", year: "2022" },
    { name: "International Documentary Association", award: "Best Feature", year: "2023" },
    { name: "Cinema Eye Honors", award: "Outstanding Achievement", year: "2023" },
    { name: "SXSW Film Festival", award: "Grand Jury Award", year: "2022" },
    { name: "Toronto International Film Festival", award: "Best Canadian Film", year: "2021" },
  ];

  const testimonials = [
    {
      name: "Alexandra Chen",
      role: "Producer, A24",
      quote: "Working with this filmmaker transformed our project. Their visual storytelling is unparalleled in contemporary cinema.",
      project: "Echoes of Silence"
    },
    {
      name: "Marcus Rodriguez",
      role: "Film Critic, The New Yorker",
      quote: "A visionary director who understands the emotional language of cinema. Each frame is a painting in motion.",
      project: "The Last Lightkeeper"
    },
    {
      name: "Sophie Williams",
      role: "Festival Director, Sundance",
      quote: "The most compelling new voice in documentary filmmaking. Their work bridges art and humanity with breathtaking precision.",
      project: "Echoes of Silence"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Admin Notification */}
      {adminMode && (
        <div className="fixed top-4 right-4 z-50 bg-purple-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm">Admin Mode Active</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed w-full z-40 bg-black/90 backdrop-blur-sm border-b border-gray-900">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Film className="h-8 w-8 text-amber-500" />
            <span className="text-2xl font-bold tracking-tight">CHRONIC<span className="text-amber-500">VISUAL</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#work" className="hover:text-amber-400 transition">Work</a>
            <a href="#about" className="hover:text-amber-400 transition">About</a>
            <a href="#awards" className="hover:text-amber-400 transition">Awards</a>
            <a href="#testimonials" className="hover:text-amber-400 transition">Testimonials</a>
            <a href="#contact" className="hover:text-amber-400 transition">Contact</a>
            <button className="bg-amber-600 hover:bg-amber-700 px-6 py-2 rounded font-semibold transition">
              View Reel
            </button>
          </div>

          <button 
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="space-y-1">
              <div className="w-6 h-0.5 bg-white"></div>
              <div className="w-6 h-0.5 bg-white"></div>
              <div className="w-6 h-0.5 bg-white"></div>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-black border-t border-gray-900 px-6 py-4">
            <div className="flex flex-col gap-4">
              <a href="#work" className="py-2 hover:text-amber-400 transition">Work</a>
              <a href="#about" className="py-2 hover:text-amber-400 transition">About</a>
              <a href="#awards" className="py-2 hover:text-amber-400 transition">Awards</a>
              <a href="#testimonials" className="py-2 hover:text-amber-400 transition">Testimonials</a>
              <a href="#contact" className="py-2 hover:text-amber-400 transition">Contact</a>
              <button className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded font-semibold transition mt-2">
                View Reel
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image/Video */}
        <div className="absolute inset-0 z-0">
          {isLoading('hero-background') ? (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black animate-pulse"></div>
          ) : getImageUrl('hero-background') ? (
            <img 
              src={getImageUrl('hero-background')!} 
              alt="Cinematic background"
              className="w-full h-full object-cover opacity-40"
              onLoad={() => setImages(prev => ({...prev, ['hero-background']: {...prev['hero-background'], loading: false}}))}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-amber-900/20 to-black"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        </div>

        {/* Admin Upload for Hero */}
        {adminMode && (
          <div className="absolute top-24 left-6 z-30 bg-black/80 backdrop-blur-sm p-4 rounded-lg border border-amber-600/50 max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-amber-400">Hero Background</span>
              <button
                onClick={() => copyPrompt(UPLOADABLE_SECTIONS.find(s => s.id === 'hero-background')!.prompt, 'hero-background')}
                className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
              >
                {copiedId === 'hero-background' ? 'Copied!' : 'Copy Prompt'}
              </button>
            </div>
            <label className="block text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-2 rounded cursor-pointer text-center">
              {uploading === 'hero-background' ? 'Uploading…' : 'Upload Hero Image'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e, 'hero-background')}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Hero Content */}
        <div className="container mx-auto px-6 relative z-10 text-center pt-20">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-amber-600/20 border border-amber-600/50 rounded-full px-4 py-2 mb-6">
              <Award className="h-4 w-4" />
              <span className="text-sm">Sundance Grand Jury Prize Winner 2023</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Stories That <span className="text-amber-400">Move</span> The World
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Award-winning cinematic storytelling that captures the human experience with depth, emotion, and visual mastery.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="bg-amber-600 hover:bg-amber-700 px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition transform hover:scale-105"
                onClick={() => setActiveVideo('showreel')}
              >
                <Play className="h-5 w-5" fill="white" />
                Watch Showreel
              </button>
              <a 
                href="#work" 
                className="border-2 border-white/30 hover:border-amber-500 px-8 py-4 rounded-lg font-semibold text-lg transition hover:bg-white/5"
              >
                Explore Films
              </a>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-gray-900">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-800">
              <div className="py-6 text-center">
                <div className="text-3xl font-bold text-amber-400">47+</div>
                <div className="text-sm text-gray-400">International Awards</div>
              </div>
              <div className="py-6 text-center">
                <div className="text-3xl font-bold text-amber-400">12</div>
                <div className="text-sm text-gray-400">Films Produced</div>
              </div>
              <div className="py-6 text-center">
                <div className="text-3xl font-bold text-amber-400">28</div>
                <div className="text-sm text-gray-400">Film Festivals</div>
              </div>
              <div className="py-6 text-center">
                <div className="text-3xl font-bold text-amber-400">6</div>
                <div className="text-sm text-gray-400">Countries Filmed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Work */}
      <section id="work" className="py-20 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-400 mb-2">
                <Film className="h-5 w-5" />
                <span className="text-sm font-semibold">SELECTED WORK</span>
              </div>
              <h2 className="text-4xl font-bold">Featured <span className="text-amber-400">Projects</span></h2>
            </div>
            <a href="#" className="text-amber-400 hover:text-amber-300 flex items-center gap-2">
              View All Projects <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((num) => {
              const sectionId = `featured-project-${num}`;
              const imageUrl = getImageUrl(sectionId);
              const isLoading = images[sectionId]?.loading;
              const project = filmProjects[num - 1];
              
              return (
                <div key={num} className="group relative overflow-hidden rounded-xl bg-gray-900">
                  {/* Project Image */}
                  <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                    {isLoading ? (
                      <div className="w-full h-full animate-pulse bg-gray-800"></div>
                    ) : imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-900/20 to-gray-900 flex items-center justify-center">
                        <Video className="h-12 w-12 text-amber-600/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    
                    {/* Play Button */}
                    <button 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-600 hover:bg-amber-700 rounded-full p-4 opacity-0 group-hover:opacity-100 transition"
                      onClick={() => setActiveVideo(project.vimeoId)}
                    >
                      <Play className="h-6 w-6" fill="white" />
                    </button>
                  </div>

                  {/* Project Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold">{project.title}</h3>
                      <span className="text-amber-400 font-semibold">{project.year}</span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-sm text-gray-400">{project.category}</span>
                      <span className="flex items-center gap-1 text-sm text-gray-400">
                        <Clock className="h-3 w-3" /> {project.duration}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.awards.slice(0, 2).map((award, idx) => (
                        <span key={idx} className="text-xs bg-amber-600/20 text-amber-300 px-2 py-1 rounded">
                          {award}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Admin Upload */}
                  {adminMode && (
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-amber-600/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-amber-400">Project {num}</span>
                        <button
                          onClick={() => copyPrompt(UPLOADABLE_SECTIONS.find(s => s.id === sectionId)!.prompt, sectionId)}
                          className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
                        >
                          {copiedId === sectionId ? 'Copied!' : 'Prompt'}
                        </button>
                      </div>
                      <label className="block text-xs bg-amber-700 hover:bg-amber-600 text-white px-2 py-1 rounded cursor-pointer text-center">
                        {uploading === sectionId ? '...' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, sectionId)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Director Portrait */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden">
                {isLoading('director-portrait') ? (
                  <div className="aspect-[4/5] bg-gradient-to-br from-gray-900 to-black animate-pulse"></div>
                ) : getImageUrl('director-portrait') ? (
                  <img 
                    src={getImageUrl('director-portrait')!} 
                    alt="Filmmaker portrait"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="aspect-[4/5] bg-gradient-to-br from-amber-900/20 to-gray-900 flex items-center justify-center">
                    <Camera className="h-16 w-16 text-amber-600/50" />
                  </div>
                )}
                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl"></div>
              </div>
              
              {/* Behind the Scenes Gallery */}
              <div className="flex gap-4 mt-8">
                {['behind-scenes-1', 'behind-scenes-2'].map((sectionId, idx) => {
                  const imageUrl = getImageUrl(sectionId);
                  return (
                    <div key={sectionId} className="flex-1 rounded-lg overflow-hidden">
                      {isLoading(sectionId) ? (
                        <div className="aspect-[4/3] bg-gray-900 animate-pulse"></div>
                      ) : imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={`Behind the scenes ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="aspect-[4/3] bg-gray-900 flex items-center justify-center">
                          <Video className="h-8 w-8 text-gray-700" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Admin Upload for About Images */}
              {adminMode && (
                <div className="mt-4 space-y-4">
                  {['director-portrait', 'behind-scenes-1', 'behind-scenes-2'].map((sectionId) => (
                    <div key={sectionId} className="bg-black/80 border border-amber-600/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-amber-400">
                          {UPLOADABLE_SECTIONS.find(s => s.id === sectionId)?.title}
                        </span>
                        <button
                          onClick={() => copyPrompt(UPLOADABLE_SECTIONS.find(s => s.id === sectionId)!.prompt, sectionId)}
                          className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
                        >
                          {copiedId === sectionId ? 'Copied!' : 'Prompt'}
                        </button>
                      </div>
                      <label className="block text-xs bg-amber-700 hover:bg-amber-600 text-white px-2 py-1 rounded cursor-pointer text-center">
                        {uploading === sectionId ? 'Uploading…' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, sectionId)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* About Content */}
            <div>
              <div className="inline-flex items-center gap-2 text-amber-400 mb-4">
                <Star className="h-5 w-5" />
                <span className="text-sm font-semibold">VISIONARY STORYTELLER</span>
              </div>
              <h2 className="text-4xl font-bold mb-6">
                Crafting <span className="text-amber-400">Emotional</span> Cinematic Experiences
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                With over a decade of experience in filmmaking, I specialize in creating emotionally resonant stories that 
                connect with audiences on a profound level. My work has been recognized at prestigious festivals worldwide, 
                earning critical acclaim for its visual poetry and narrative depth.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-600/20 p-2 rounded-lg">
                    <Film className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Narrative Excellence</h4>
                    <p className="text-gray-400">Character-driven stories with emotional authenticity and visual innovation.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-amber-600/20 p-2 rounded-lg">
                    <Camera className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Visual Mastery</h4>
                    <p className="text-gray-400">Cinematic photography that transforms ordinary moments into visual poetry.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-amber-600/20 p-2 rounded-lg">
                    <Award className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Award-Winning Approach</h4>
                    <p className="text-gray-400">Recognition from top film festivals and industry organizations worldwide.</p>
                  </div>
                </div>
              </div>

              <button className="border-2 border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white px-8 py-3 rounded-lg font-semibold transition">
                Download Full CV
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Awards & Recognition */}
      <section id="awards" className="py-20 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-amber-400 mb-4">
              <Award className="h-6 w-6" />
              <span className="text-sm font-semibold">RECOGNITION</span>
            </div>
            <h2 className="text-4xl font-bold mb-6">Awards & <span className="text-amber-400">Festivals</span></h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Celebrated by prestigious festivals and organizations worldwide for cinematic excellence and storytelling innovation.
            </p>
          </div>

          {/* Awards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {awardsList.map((award, index) => (
              <div key={index} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-amber-600/50 transition group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-amber-400 font-bold text-lg">{award.name}</div>
                    <div className="text-sm text-gray-400">{award.award}</div>
                  </div>
                  <div className="text-amber-600 font-bold">{award.year}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-800 rounded-full h-1">
                    <div className="bg-amber-500 h-1 rounded-full" style={{ width: `${85 + index * 5}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Award Ceremony Photo */}
          <div className="relative rounded-2xl overflow-hidden">
            {isLoading('award-ceremony') ? (
              <div className="aspect-[21/9] bg-gradient-to-r from-gray-900 to-black animate-pulse"></div>
            ) : getImageUrl('award-ceremony') ? (
              <img 
                src={getImageUrl('award-ceremony')!} 
                alt="Award ceremony"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="aspect-[21/9] bg-gradient-to-r from-amber-900/20 to-gray-900 flex items-center justify-center">
                <Award className="h-16 w-16 text-amber-600/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-amber-600/50 rounded-full px-6 py-3 mb-4">
                  <Award className="h-5 w-5 text-amber-400" />
                  <span className="font-semibold">Latest Achievement</span>
                </div>
                <h3 className="text-3xl font-bold mb-2">Sundance Grand Jury Prize 2023</h3>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Recognized for groundbreaking documentary filmmaking and exceptional visual storytelling
                </p>
              </div>
            </div>

            {/* Admin Upload for Award Photo */}
            {adminMode && (
              <div className="absolute top-6 right-6 bg-black/80 backdrop-blur-sm p-4 rounded-lg border border-amber-600/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-amber-400">Award Photo</span>
                  <button
                    onClick={() => copyPrompt(UPLOADABLE_SECTIONS.find(s => s.id === 'award-ceremony')!.prompt, 'award-ceremony')}
                    className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
                  >
                    {copiedId === 'award-ceremony' ? 'Copied!' : 'Prompt'}
                  </button>
                </div>
                <label className="block text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-2 rounded cursor-pointer text-center">
                  {uploading === 'award-ceremony' ? 'Uploading…' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, 'award-ceremony')}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-amber-400 mb-4">
              <Quote className="h-6 w-6" />
              <span className="text-sm font-semibold">INDUSTRY PRAISE</span>
            </div>
            <h2 className="text-4xl font-bold mb-6">Critical <span className="text-amber-400">Acclaim</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 relative">
                <div className="absolute -top-4 left-8">
                  <div className="bg-amber-600 text-black font-bold text-lg w-8 h-8 rounded-full flex items-center justify-center">
                    "
                  </div>
                </div>
                <p className="text-lg text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="border-t border-gray-800 pt-6">
                  <div className="font-bold text-lg">{testimonial.name}</div>
                  <div className="text-amber-400 text-sm mb-2">{testimonial.role}</div>
                  <div className="text-gray-500 text-sm">Project: {testimonial.project}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <div className="inline-flex items-center gap-2 text-amber-400 mb-4">
                  <Mail className="h-5 w-5" />
                  <span className="text-sm font-semibold">COLLABORATE</span>
                </div>
                <h2 className="text-4xl font-bold mb-6">Let's Create <span className="text-amber-400">Together</span></h2>
                <p className="text-lg text-gray-300 mb-8">
                  Interested in collaborating on a film project, documentary, or commercial work? 
                  Let's discuss how we can bring your vision to life with cinematic excellence.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-600/20 p-3 rounded-lg">
                      <Mail className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Email</div>
                      <div className="font-semibold">contact@chronicvisual.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-600/20 p-3 rounded-lg">
                      <Phone className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Phone</div>
                      <div className="font-semibold">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-600/20 p-3 rounded-lg">
                      <MapPin className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Based in</div>
                      <div className="font-semibold">Los Angeles, CA • Available Worldwide</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <a href="#" className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg">
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href="#" className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg">
                    <Youtube className="h-5 w-5" />
                  </a>
                  <a href="#" className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg">
                    <Film className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6">Start a Project</h3>
                <form className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                      <input type="text" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                      <input type="text" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <input type="email" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Project Type</label>
                    <select className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500">
                      <option>Documentary Film</option>
                      <option>Narrative Short</option>
                      <option>Feature Film</option>
                      <option>Commercial Project</option>
                      <option>Music Video</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Project Details</label>
                    <textarea rows={4} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"></textarea>
                  </div>
                  <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition">
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-900 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <Film className="h-8 w-8 text-amber-500" />
              <span className="text-2xl font-bold">CHRONIC<span className="text-amber-500">VISUAL</span></span>
            </div>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Chronic Visual Films. All rights reserved.
            </div>
            <div className="flex gap-6 mt-6 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-amber-400 text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-amber-400 text-sm">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-amber-400"
              onClick={() => setActiveVideo(null)}
            >
              Close
            </button>
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                  <p className="text-xl font-semibold">Video Showreel</p>
                  <p className="text-gray-400 mt-2">[Video player would be integrated here]</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}