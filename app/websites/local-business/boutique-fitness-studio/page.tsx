'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Star, 
  Award, 
  Users, 
  Heart, 
  TrendingUp,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Menu,
  X,
  PlayCircle
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery';

// Dynamic image configuration
type ImageKey = 
  | 'hero-bg'
  | 'studio-showcase'
  | 'class-pilates'
  | 'class-hiit'
  | 'class-yoga'
  | 'class-strength'
  | 'trainer-1'
  | 'trainer-2'
  | 'trainer-3'
  | 'testimonial-bg'
  | 'facility-1'
  | 'facility-2'
  | 'facility-3'
  | 'logo';

const IMAGE_CONFIG: Array<{ id: ImageKey; alt: string; fallbackColor: string }> = [
  { id: 'hero-bg', alt: 'Zenith Flow Studio modern fitness space', fallbackColor: 'bg-gradient-to-br from-purple-900 to-indigo-800' },
  { id: 'studio-showcase', alt: 'Premium fitness equipment and lighting', fallbackColor: 'bg-gradient-to-br from-gray-800 to-gray-900' },
  { id: 'class-pilates', alt: 'Reformer pilates class in session', fallbackColor: 'bg-gradient-to-br from-teal-800 to-emerald-700' },
  { id: 'class-hiit', alt: 'High intensity interval training', fallbackColor: 'bg-gradient-to-br from-orange-800 to-red-700' },
  { id: 'class-yoga', alt: 'Hot yoga studio with natural light', fallbackColor: 'bg-gradient-to-br from-blue-800 to-cyan-700' },
  { id: 'class-strength', alt: 'Strength training with premium equipment', fallbackColor: 'bg-gradient-to-br from-purple-800 to-pink-700' },
  { id: 'trainer-1', alt: 'Certified trainer Alex Morgan', fallbackColor: 'bg-gradient-to-br from-slate-700 to-slate-800' },
  { id: 'trainer-2', alt: 'Yoga specialist Maya Chen', fallbackColor: 'bg-gradient-to-br from-slate-700 to-slate-800' },
  { id: 'trainer-3', alt: 'Strength coach Marcus Rivera', fallbackColor: 'bg-gradient-to-br from-slate-700 to-slate-800' },
  { id: 'testimonial-bg', alt: 'Happy members at Zenith Flow', fallbackColor: 'bg-gradient-to-br from-indigo-800 to-purple-900' },
  { id: 'facility-1', alt: 'Luxury locker rooms and amenities', fallbackColor: 'bg-gradient-to-br from-amber-800 to-yellow-700' },
  { id: 'facility-2', alt: 'Recovery zone with massage chairs', fallbackColor: 'bg-gradient-to-br from-rose-800 to-pink-700' },
  { id: 'facility-3', alt: 'Premium supplement bar', fallbackColor: 'bg-gradient-to-br from-lime-700 to-green-600' },
  { id: 'logo', alt: 'Zenith Flow Studio logo', fallbackColor: 'bg-gradient-to-br from-purple-600 to-indigo-600' }
];

type ImageState = Record<ImageKey, { image_url: string | null; loading: boolean }>;

// Studio configuration
const CLASS_SCHEDULE = [
  { time: '6:00 AM', class: 'Sunrise Flow Yoga', instructor: 'Maya', duration: '60 min', intensity: 'Medium' },
  { time: '7:30 AM', class: 'HIIT Fusion', instructor: 'Alex', duration: '45 min', intensity: 'High' },
  { time: '9:00 AM', class: 'Mat Pilates', instructor: 'Sarah', duration: '50 min', intensity: 'Low' },
  { time: '12:00 PM', class: 'Power Lunch Strength', instructor: 'Marcus', duration: '45 min', intensity: 'High' },
  { time: '5:30 PM', class: 'Evening Vinyasa', instructor: 'Maya', duration: '60 min', intensity: 'Medium' },
  { time: '6:45 PM', class: 'Reformer Pilates', instructor: 'Alex', duration: '55 min', intensity: 'Medium' },
  { time: '8:00 PM', class: 'Late Night Stretch', instructor: 'Jordan', duration: '40 min', intensity: 'Low' },
];

const TRAINERS = [
  { name: 'Alex Morgan', specialty: 'HIIT & Strength', certification: 'NASM, ACE', experience: '8 years', quote: 'Fitness is about feeling powerful in your own body' },
  { name: 'Maya Chen', specialty: 'Yoga & Mobility', certification: 'RYT 500, Yoga Therapy', experience: '12 years', quote: 'Movement is medicine for mind and body' },
  { name: 'Marcus Rivera', specialty: 'Strength & Conditioning', certification: 'CSCS, Precision Nutrition', experience: '10 years', quote: 'Consistency beats intensity every time' },
];

const MEMBERSHIP_PLANS = [
  { name: 'Flow Starter', price: 129, period: 'month', features: ['8 classes/month', 'Basic amenities', 'Mobile app access', 'Monthly health check'], popular: false },
  { name: 'Peak Performance', price: 199, period: 'month', features: ['Unlimited classes', 'Priority booking', 'Recovery zone access', 'Nutrition consultation', 'Personalized plan'], popular: true },
  { name: 'Elite Annual', price: 1999, period: 'year', features: ['All Peak benefits', '2 guest passes/month', 'Private locker', 'Quarterly progress scans', 'Complimentary gear'], popular: false },
];

export default function ZenithFlowStudio() {
  const [images, setImages] = useState<ImageState>(() => 
    Object.fromEntries(
      IMAGE_CONFIG.map(img => [img.id, { image_url: null, loading: true }])
    ) as ImageState
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<ImageKey | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('classes');
  const [bookingStep, setBookingStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    classType: '',
    date: '',
  });

  // Check admin status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load images from Supabase
  useEffect(() => {
    const loadImages = async () => {
      // Fetch gallery images for admin
      const { data: dbImages, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        setImages(prev => {
          const updated = { ...prev };
          IMAGE_CONFIG.forEach(img => {
            updated[img.id] = { ...updated[img.id], loading: false };
          });
          return updated;
        });
        return;
      }

      // Initialize all images as loading
      const initialState: ImageState = { ...images };
      IMAGE_CONFIG.forEach(img => {
        initialState[img.id] = { image_url: null, loading: true };
      });

      if (dbImages) {
        const latestImages: Record<string, string> = {};

        // Group by image ID (from path)
        for (const img of dbImages) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const imageId = pathParts[2] as ImageKey;
            if (!latestImages[imageId] && IMAGE_CONFIG.some(cfg => cfg.id === imageId)) {
              latestImages[imageId] = img.path;
            }
          }
        }

        // Create image URLs and mark as loaded
        IMAGE_CONFIG.forEach(config => {
          const path = latestImages[config.id];
          if (path) {
            const publicUrl = supabase.storage
              .from('user_images')
              .getPublicUrl(path).data.publicUrl;
            initialState[config.id] = { image_url: publicUrl, loading: false };
          } else {
            initialState[config.id] = { image_url: null, loading: false };
          }
        });
      }

      setImages(initialState);
    };

    loadImages();
  }, []);

  // Handle image upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageId: ImageKey) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(imageId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${imageId}/`;

      // Clean up old images for this key
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

      // Record in database
      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      // Update state with new URL
      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setImages(prev => ({
        ...prev,
        [imageId]: { image_url: publicUrl, loading: false }
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  // Image component with loading state
  const OptimizedImage = ({ imageKey, className, children }: { 
    imageKey: ImageKey; 
    className: string;
    children?: React.ReactNode;
  }) => {
    const config = IMAGE_CONFIG.find(cfg => cfg.id === imageKey);
    const imageData = images[imageKey];

    if (imageData.loading) {
      return (
        <div className={`${config?.fallbackColor} ${className} animate-pulse flex items-center justify-center`}>
          <div className="text-white/50">Loading...</div>
        </div>
      );
    }

    if (imageData.image_url) {
      return (
        <div className={`relative overflow-hidden ${className}`}>
          <img 
            src={imageData.image_url} 
            alt={config?.alt || ''}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient background
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.className += ` ${config?.fallbackColor}`;
            }}
          />
          {children}
        </div>
      );
    }

    // No image uploaded
    return (
      <div className={`${config?.fallbackColor} ${className} relative flex items-center justify-center`}>
        {adminMode ? (
          <div className="text-center p-4">
            <div className="text-white/70 mb-2">No image uploaded</div>
            <label className="inline-block bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
              {uploading === imageKey ? 'Uploading...' : 'Upload Image'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e, imageKey)}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="text-white/50">Image coming soon</div>
        )}
        {children}
      </div>
    );
  };

  // Admin upload button
  const AdminUploadButton = ({ imageKey, className = '' }: { imageKey: ImageKey; className?: string }) => {
    if (!adminMode) return null;

    return (
      <div className={`absolute top-4 right-4 z-20 ${className}`}>
        <label className="inline-flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white text-sm px-3 py-2 rounded-lg cursor-pointer transition-all backdrop-blur-sm">
          {uploading === imageKey ? (
            <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            '📷 Replace'
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleUpload(e, imageKey)}
            className="hidden"
          />
        </label>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600" />
                <span className="text-2xl font-bold tracking-tight">Zenith<span className="text-purple-600">Flow</span></span>
              </div>
              
              <div className="hidden lg:flex items-center gap-8">
                <a href="#classes" className="font-medium hover:text-purple-600 transition-colors">Classes</a>
                <a href="#membership" className="font-medium hover:text-purple-600 transition-colors">Membership</a>
                <a href="#trainers" className="font-medium hover:text-purple-600 transition-colors">Trainers</a>
                <a href="#schedule" className="font-medium hover:text-purple-600 transition-colors">Schedule</a>
                <a href="#contact" className="font-medium hover:text-purple-600 transition-colors">Contact</a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="hidden lg:inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-colors">
                Book Your First Class <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-6">
            <div className="flex flex-col gap-4">
              <a href="#classes" className="font-medium py-2">Classes</a>
              <a href="#membership" className="font-medium py-2">Membership</a>
              <a href="#trainers" className="font-medium py-2">Trainers</a>
              <a href="#schedule" className="font-medium py-2">Schedule</a>
              <a href="#contact" className="font-medium py-2">Contact</a>
              <button className="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold mt-4">
                Book Your First Class
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <OptimizedImage 
          imageKey="hero-bg"
          className="absolute inset-0 w-full h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <AdminUploadButton imageKey="hero-bg" />
        </OptimizedImage>

        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Voted Best Boutique Studio 2024</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Elevate Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Fitness Journey</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-xl">
              Premium boutique fitness studio in Austin offering expert-led classes, 
              state-of-the-art equipment, and a community that inspires.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-purple-700 hover:bg-gray-100 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:-translate-y-1">
                Start Free Trial
              </button>
              <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Watch Tour
              </button>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-white">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-white/70">Active Members</div>
              </div>
              <div className="text-white">
                <div className="text-3xl font-bold">28</div>
                <div className="text-white/70">Weekly Classes</div>
              </div>
              <div className="text-white">
                <div className="text-3xl font-bold">4.9</div>
                <div className="text-white/70">Average Rating</div>
              </div>
              <div className="text-white">
                <div className="text-3xl font-bold">7</div>
                <div className="text-white/70">Expert Trainers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Classes */}
      <section id="classes" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">Signature Classes</h2>
            <p className="text-gray-600 text-lg">
              Each class is carefully designed to challenge your body and refresh your mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { key: 'class-pilates', title: 'Reformer Pilates', desc: 'Low-impact, high-results reformer training', intensity: 'Medium' },
              { key: 'class-hiit', title: 'HIIT Fusion', desc: 'High-intensity intervals with strength training', intensity: 'High' },
              { key: 'class-yoga', title: 'Hot Power Yoga', desc: 'Dynamic flows in heated studio', intensity: 'Medium' },
              { key: 'class-strength', title: 'Strength Lab', desc: 'Progressive overload strength training', intensity: 'High' },
            ].map((cls) => (
              <div key={cls.key} className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <OptimizedImage 
                  imageKey={cls.key as ImageKey}
                  className="h-64"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <AdminUploadButton imageKey={cls.key as ImageKey} />
                </OptimizedImage>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">{cls.title}</h3>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                      {cls.intensity}
                    </span>
                  </div>
                  <p className="text-white/90 mb-4">{cls.desc}</p>
                  <button className="text-white font-semibold flex items-center gap-2 group-hover:text-purple-300 transition-colors">
                    Learn More <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studio Showcase */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">More Than A Gym.<br />A Wellness Sanctuary</h2>
              <p className="text-gray-600 mb-8">
                Our 8,000 sq ft facility features premium equipment, infrared saunas, 
                cryotherapy, and recovery zones designed to optimize your performance 
                and recovery.
              </p>
              
              <div className="space-y-4">
                {[
                  'State-of-the-art Technogym equipment',
                  'Infrared sauna & cryotherapy',
                  'Luxury locker rooms with amenities',
                  'Recovery zone with percussion therapy',
                  'Organic supplement bar',
                  'Private training pods',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <OptimizedImage 
                imageKey="studio-showcase"
                className="rounded-2xl shadow-2xl h-[500px]"
              >
                <AdminUploadButton imageKey="studio-showcase" />
              </OptimizedImage>
              
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl max-w-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">97%</div>
                    <div className="text-gray-600 text-sm">Member Retention Rate</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Highest satisfaction rate in Austin for boutique fitness studios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Schedule */}
      <section id="schedule" className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Today's Schedule</h2>
            <p className="text-gray-300">Real-time availability and booking</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8">
            <div className="flex gap-4 mb-8 overflow-x-auto">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <button
                  key={day}
                  className={`px-6 py-3 rounded-full font-medium whitespace-nowrap ${idx === 2 ? 'bg-white text-gray-900' : 'hover:bg-white/10'}`}
                >
                  {day} {idx === 2 && <span className="ml-2">15</span>}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {CLASS_SCHEDULE.map((cls, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{cls.time.split(' ')[0]}</div>
                      <div className="text-gray-300 text-sm">{cls.time.split(' ')[1]}</div>
                    </div>
                    <div className="w-px h-8 bg-gray-600" />
                    <div>
                      <div className="font-bold text-lg">{cls.class}</div>
                      <div className="text-gray-300">with {cls.instructor} • {cls.duration}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-sm">
                      {cls.intensity}
                    </span>
                    <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-all">
                      Book
                    </button>
                    <div className="text-gray-300 text-sm hidden lg:block">
                      4 spots left
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <button className="w-full bg-white text-gray-900 hover:bg-gray-100 py-4 rounded-xl font-bold text-lg transition-colors">
                View Full Weekly Schedule
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Expert Trainers */}
      <section id="trainers" className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">Meet Your Expert Trainers</h2>
            <p className="text-gray-600 text-lg">
              Certified professionals with decades of combined experience in strength, 
              mobility, and holistic wellness.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TRAINERS.map((trainer, idx) => (
              <div key={trainer.name} className="group">
                <OptimizedImage 
                  imageKey={`trainer-${idx + 1}` as ImageKey}
                  className="h-80 rounded-2xl mb-6"
                >
                  <AdminUploadButton imageKey={`trainer-${idx + 1}` as ImageKey} />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="text-white">
                      <div className="text-2xl font-bold">{trainer.name}</div>
                      <div className="text-purple-300">{trainer.specialty}</div>
                    </div>
                  </div>
                </OptimizedImage>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {trainer.certification}
                    </span>
                    <span>{trainer.experience} experience</span>
                  </div>
                  <p className="text-gray-700 italic">"{trainer.quote}"</p>
                  <button className="text-purple-600 font-semibold flex items-center gap-2 hover:text-purple-800 transition-colors">
                    View Profile <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Plans */}
      <section id="membership" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">Choose Your Membership</h2>
            <p className="text-gray-600 text-lg">
              Flexible plans designed for every fitness journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {MEMBERSHIP_PLANS.map((plan) => (
              <div 
                key={plan.name}
                className={`relative rounded-2xl p-8 ${plan.popular ? 'border-2 border-purple-500 bg-white shadow-2xl' : 'border border-gray-200 bg-white'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-1 rounded-full text-sm font-semibold">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-500 ml-2">/{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${plan.popular ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600">
              All plans include 7-day free trial • No long-term contracts • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 relative overflow-hidden">
        <OptimizedImage 
          imageKey="testimonial-bg"
          className="absolute inset-0 w-full h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/80" />
          <AdminUploadButton imageKey="testimonial-bg" />
        </OptimizedImage>

        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Member Stories</h2>
            <p className="text-gray-300">Join 500+ members transforming their lives</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah J.', role: 'Member for 2 years', content: 'Zenith Flow completely changed my relationship with fitness. The trainers are incredible and the community keeps me motivated.' },
              { name: 'Michael T.', role: 'Tech Entrepreneur', content: 'As someone who spends 12 hours at a desk, the recovery amenities alone are worth the membership. My productivity has skyrocketed.' },
              { name: 'Jessica L.', role: 'Yoga Teacher', content: 'The attention to detail in every class is phenomenal. This is the only studio I trust with my own practice and my students.' },
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
                <div className="flex items-center gap-2 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-bold text-lg">{testimonial.name}</div>
                  <div className="text-gray-300">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Transform Your Fitness Journey?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Book your free trial class today and experience the Zenith Flow difference.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-purple-700 hover:bg-gray-100 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:-translate-y-1">
                Book Free Class
              </button>
              <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-full font-bold text-lg transition-all">
                Call Now: (512) 555-7890
              </button>
            </div>
            
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold">1</div>
                <div className="text-purple-200">Free Trial Class</div>
              </div>
              <div>
                <div className="text-3xl font-bold">2</div>
                <div className="text-purple-200">Goal Assessment</div>
              </div>
              <div>
                <div className="text-3xl font-bold">3</div>
                <div className="text-purple-200">Personalized Plan</div>
              </div>
              <div>
                <div className="text-3xl font-bold">4</div>
                <div className="text-purple-200">Join Community</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600" />
                <span className="text-2xl font-bold">Zenith<span className="text-purple-400">Flow</span></span>
              </div>
              <p className="text-gray-400 mb-6">
                Premium boutique fitness studio in Austin, Texas dedicated to elevating your wellness journey.
              </p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-purple-400 transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Studio Hours</h3>
              <div className="space-y-3 text-gray-400">
                <div className="flex justify-between">
                  <span>Mon - Fri</span>
                  <span>5:30 AM - 9:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>7:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>8:00 AM - 5:00 PM</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Contact</h3>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5" />
                  <span>123 Wellness Ave, Austin, TX 78701</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5" />
                  <span>(512) 555-7890</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5" />
                  <span>hello@zenithflow.com</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Newsletter</h3>
              <p className="text-gray-400 mb-4">Get fitness tips and exclusive offers</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button className="bg-purple-600 hover:bg-purple-700 px-4 rounded-lg font-semibold">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Zenith Flow Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-purple-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Admin Mode Active
        </div>
      )}
    </div>
  );
}