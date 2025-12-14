'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Camera, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ChevronRight,
  Star,
  Award,
  Users,
  Clock,
  ArrowRight,
  Menu,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Play,
  Filter,
  Download,
  Share2,
  Heart,
  MessageCircle,
  Check,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'fashion_portfolio';

// Fashion photography portfolio data
const PHOTO_SESSIONS = [
  {
    id: 'editorial-vogue',
    title: 'Vogue Editorial Collection',
    category: 'Editorial',
    description: 'High-fashion editorial shots featuring avant-garde designs against minimalist backdrops.',
    featured: true,
    tags: ['high-fashion', 'minimalist', 'luxury', 'black-white'],
    client: 'Vogue Paris',
    location: 'Paris Studio',
    year: '2024',
    prompt: 'A high-fashion editorial photoshoot in the style of Vogue Paris. Model wearing avant-garde designer clothing against a clean, minimalist studio backdrop with dramatic lighting that creates sharp shadows and highlights. Shot on medium format film with a timeless, elegant aesthetic. Include subtle motion blur on fabric movement.'
  },
  {
    id: 'streetwear-nyc',
    title: 'Urban Streetwear Campaign',
    category: 'Commercial',
    description: 'Vibrant street style photography capturing urban fashion in authentic city environments.',
    featured: true,
    tags: ['streetwear', 'urban', 'vibrant', 'youth-culture'],
    client: 'Supreme × Nike',
    location: 'New York City',
    year: '2024',
    prompt: 'Dynamic street style photography in downtown New York City. Models wearing Supreme × Nike collaboration pieces, captured in motion with natural city lighting. Include graffiti walls, fire escapes, and urban textures. Shot with a 35mm lens for environmental context, golden hour lighting, authentic candid moments.'
  },
  {
    id: 'bridal-collection',
    title: 'Luxury Bridal Series',
    category: 'Bridal',
    description: 'Ethereal bridal photography in natural light settings with romantic, dreamlike compositions.',
    featured: true,
    tags: ['bridal', 'romantic', 'natural-light', 'ethereal'],
    client: 'Vera Wang Bridal',
    location: 'Italian Villa',
    year: '2023',
    prompt: 'Romantic bridal photoshoot in an Italian villa at golden hour. Model wearing Vera Wang wedding gown with delicate lace details, soft focus background of olive groves and vintage architecture. Natural sunlight filtering through sheer fabrics, creating a dreamy, ethereal atmosphere with warm tones and soft shadows.'
  },
  {
    id: 'beauty-campaign',
    title: 'Skincare Beauty Campaign',
    category: 'Beauty',
    description: 'Intimate beauty portraits focusing on skin texture, natural light, and authentic expressions.',
    featured: false,
    tags: ['beauty', 'close-up', 'natural', 'skincare'],
    client: 'La Mer',
    location: 'Iceland',
    year: '2024',
    prompt: 'Beauty campaign shot in Iceland featuring natural skincare focus. Extreme close-ups of model\'s face with flawless skin, captured in pure natural light against geothermal steam and volcanic rock backgrounds. Focus on texture, hydration, and luminosity. Soft, diffused lighting with subtle reflections.'
  },
  {
    id: 'runway-highlights',
    title: 'Milan Fashion Week',
    category: 'Runway',
    description: 'Dynamic runway photography capturing movement, texture, and the energy of live fashion shows.',
    featured: true,
    tags: ['runway', 'action', 'backstage', 'fashion-week'],
    client: 'Prada',
    location: 'Milan',
    year: '2024',
    prompt: 'Runway photography at Milan Fashion Week Prada show. Capture models in motion with clothing flowing dramatically. Low-angle shots emphasizing height and movement, mixed with backstage candid moments. Use fast shutter speed to freeze motion while maintaining artistic blur in backgrounds. Dramatic show lighting.'
  },
  {
    id: 'sustainable-fashion',
    title: 'Eco-Fashion Documentary',
    category: 'Editorial',
    description: 'Documentary-style photography highlighting sustainable fashion practices and natural materials.',
    featured: false,
    tags: ['sustainable', 'documentary', 'natural-fibers', 'ethical'],
    client: 'Stella McCartney',
    location: 'Portuguese Cotton Fields',
    year: '2023',
    prompt: 'Documentary-style fashion photography in Portuguese cotton fields. Models wearing sustainable fashion pieces interacting authentically with the environment. Natural light, earthy color palette, focus on texture of fabrics and landscapes. Candid moments mixed with styled shots that tell a story of sustainable production.'
  },
  {
    id: 'menswear-editorial',
    title: 'Menswear Autumn Collection',
    category: 'Editorial',
    description: 'Sophisticated menswear photography with tailored silhouettes and moody atmospheric settings.',
    featured: false,
    tags: ['menswear', 'tailoring', 'atmospheric', 'autumn'],
    client: 'Tom Ford',
    location: 'English Countryside',
    year: '2023',
    prompt: 'Menswear editorial in English countryside estate. Models in Tom Ford autumn collection, shot in moody atmospheric conditions - misty mornings, golden hour in forests, rainy scenes. Focus on fabric texture, tailoring details, and masculine elegance. Dramatic natural lighting with cinematic composition.'
  },
  {
    id: 'swimwear-campaign',
    title: 'Luxury Swimwear',
    category: 'Commercial',
    description: 'Tropical swimwear photography with vibrant colors, ocean backgrounds, and sun-drenched lighting.',
    featured: true,
    tags: ['swimwear', 'tropical', 'ocean', 'summer'],
    client: 'Solid & Striped',
    location: 'Maldives',
    year: '2024',
    prompt: 'Luxury swimwear campaign in Maldives overwater bungalows. Models in vibrant swimwear against turquoise ocean backgrounds. Bright, sun-drenched lighting with reflections on water, captured during golden hour for warm tones. Dynamic poses that show movement and energy, mixed with relaxed lifestyle moments.'
  }
];

// Services offered
const SERVICES = [
  {
    title: 'Editorial Fashion',
    description: 'High-concept storytelling through fashion, designed for magazines and brand campaigns.',
    price: 'Starting at $5,000',
    features: ['Concept Development', 'Full Creative Direction', 'Model Casting', 'Magazine-Ready Editing'],
    icon: Camera
  },
  {
    title: 'Commercial Campaigns',
    description: 'Brand-focused photography that sells products while maintaining artistic integrity.',
    price: 'Starting at $8,000',
    features: ['Brand Strategy', 'Product Focus', 'Multi-Platform Assets', 'ROI Tracking'],
    icon: Users
  },
  {
    title: 'Lookbook & E-commerce',
    description: 'Clean, consistent product photography optimized for online sales and brand presentation.',
    price: 'Starting at $3,500',
    features: ['Studio Setup', 'Consistent Lighting', 'White Background', 'Fast Turnaround'],
    icon: Award
  },
  {
    title: 'Runway & Events',
    description: 'Dynamic coverage of fashion shows, launches, and industry events worldwide.',
    price: 'Starting at $2,500',
    features: ['Backstage Access', 'Fast Delivery', 'Social Media Ready', 'Full Event Coverage'],
    icon: Star
  }
];

type ImageState = {
  [key: string]: {
    image_url: string | null;
    thumbnail_url?: string | null;
  }
};

export default function FashionPhotographyPortfolio() {
  // State management
  const [images, setImages] = useState<ImageState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: '',
    budget: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Refs
  const galleryRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

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
      const { data: imageData, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        return;
      }

      const initialState: ImageState = {};
      PHOTO_SESSIONS.forEach(session => {
        initialState[session.id] = { image_url: null, thumbnail_url: null };
      });

      if (imageData) {
        const latestImagePerSession: Record<string, { main: string, thumb: string }> = {};

        for (const img of imageData) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const sessionId = pathParts[2];
            const fileName = pathParts[pathParts.length - 1];
            
            // Check if it's a thumbnail
            const isThumbnail = fileName.includes('thumb') || fileName.includes('thumbnail');
            
            if (PHOTO_SESSIONS.some(s => s.id === sessionId)) {
              if (!latestImagePerSession[sessionId]) {
                latestImagePerSession[sessionId] = { main: '', thumb: '' };
              }
              
              const publicUrl = supabase.storage
                .from('user_images')
                .getPublicUrl(img.path).data.publicUrl;
                
              if (isThumbnail) {
                latestImagePerSession[sessionId].thumb = publicUrl;
              } else {
                latestImagePerSession[sessionId].main = publicUrl;
              }
            }
          }
        }

        // Build final state
        PHOTO_SESSIONS.forEach(session => {
          const sessionImages = latestImagePerSession[session.id];
          if (sessionImages) {
            initialState[session.id] = {
              image_url: sessionImages.main || sessionImages.thumb || null,
              thumbnail_url: sessionImages.thumb || sessionImages.main || null
            };
          }
        });
      }

      setImages(initialState);
    };

    loadImages();
  }, []);

  // Handle image upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, sessionId: string) => {
    if (!adminMode || !e.target.files?.length) return;
    
    const file = e.target.files[0];
    setUploading(sessionId);

    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${sessionId}/`;
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${folderPath}${fileName}`;

      // Clean up old images for this session
      const { data: existingImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (existingImages?.length) {
        const pathsToDelete = existingImages.map(img => img.path);
        await Promise.all([
          supabase.storage.from('user_images').remove(pathsToDelete),
          supabase.from('images').delete().in('path', pathsToDelete)
        ]);
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      // Create thumbnail if image is large
      const { error: dbError } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      
      if (dbError) throw dbError;

      const publicUrl = supabase.storage
        .from('user_images')
        .getPublicUrl(filePath).data.publicUrl;

      setImages(prev => ({
        ...prev,
        [sessionId]: {
          image_url: publicUrl,
          thumbnail_url: prev[sessionId]?.thumbnail_url || publicUrl
        }
      }));

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  // Copy prompt to clipboard
  const copyPrompt = (prompt: string, sessionId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(sessionId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Filter sessions by category
  const filteredSessions = activeCategory === 'All' 
    ? PHOTO_SESSIONS 
    : PHOTO_SESSIONS.filter(session => session.category === activeCategory);

  // Navigation functions
  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would send this data to your backend
    console.log('Form submitted:', formData);
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  // Featured sessions (for hero section)
  const featuredSessions = PHOTO_SESSIONS.filter(s => s.featured);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">AURELIA VISION</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={scrollToGallery} className="hover:text-gray-600 transition">Portfolio</button>
              <button onClick={scrollToContact} className="hover:text-gray-600 transition">Services</button>
              <Link href="#about" className="hover:text-gray-600 transition">About</Link>
              <Link href="#clients" className="hover:text-gray-600 transition">Clients</Link>
              <button 
                onClick={scrollToContact}
                className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition flex items-center"
              >
                Book Session <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <button onClick={scrollToGallery} className="block w-full text-left py-2">Portfolio</button>
              <button onClick={scrollToContact} className="block w-full text-left py-2">Services</button>
              <Link href="#about" className="block py-2">About</Link>
              <Link href="#clients" className="block py-2">Clients</Link>
              <button 
                onClick={scrollToContact}
                className="w-full bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
              >
                Book Session
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background Image Grid */}
        <div className="absolute inset-0 grid grid-cols-3 gap-1 opacity-5">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-black aspect-square"></div>
          ))}
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">2024 AWARD WINNING</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Fashion <span className="italic">Vision</span> 
              <br />
              Transformed Into <span className="text-gray-500">Art</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Capturing the essence of fashion through editorial mastery, 
              commercial precision, and timeless storytelling for luxury brands worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button 
                onClick={scrollToGallery}
                className="bg-black text-white px-8 py-4 rounded-full hover:bg-gray-800 transition flex items-center justify-center text-lg"
              >
                View Portfolio <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button 
                onClick={scrollToContact}
                className="border-2 border-black text-black px-8 py-4 rounded-full hover:bg-black hover:text-white transition text-lg"
              >
                Book Consultation
              </button>
            </div>

            {/* Featured Images Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {featuredSessions.slice(0, 4).map((session, index) => {
                const sessionImages = images[session.id];
                return (
                  <div 
                    key={session.id} 
                    className={`relative aspect-square overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-105 ${
                      index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                    }`}
                    onClick={() => {
                      setSelectedImage(sessionImages?.image_url || null);
                      setCurrentSlide(featuredSessions.findIndex(s => s.id === session.id));
                    }}
                  >
                    {sessionImages?.thumbnail_url ? (
                      <Image
                        src={sessionImages.thumbnail_url}
                        alt={session.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-fashion.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <p className="text-white text-sm font-medium">{session.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section ref={galleryRef} className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Portfolio</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              A curated selection of recent fashion campaigns, editorials, 
              and commercial work for luxury brands worldwide.
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {['All', 'Editorial', 'Commercial', 'Bridal', 'Beauty', 'Runway'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-full transition ${
                  activeCategory === category
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSessions.map((session) => {
              const sessionImages = images[session.id];
              const imageUrl = sessionImages?.image_url;

              return (
                <div 
                  key={session.id} 
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    setSelectedImage(imageUrl || null);
                    setCurrentSlide(PHOTO_SESSIONS.findIndex(s => s.id === session.id));
                  }}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={session.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-fashion.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex flex-col items-center justify-center p-8">
                        <Camera className="w-16 h-16 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-center">No image uploaded</p>
                        {session.description && (
                          <p className="text-gray-400 text-sm text-center mt-2">{session.description}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <ArrowUpRight className="w-12 h-12 text-white" />
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-sm text-black px-3 py-1 rounded-full text-sm font-medium">
                        {session.category}
                      </span>
                    </div>
                  </div>

                  {/* Session Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold">{session.title}</h3>
                      <span className="text-gray-500 text-sm">{session.year}</span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">{session.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {session.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag} 
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="text-sm text-gray-500">
                      <p>Client: {session.client}</p>
                      <p>Location: {session.location}</p>
                    </div>

                    {/* Admin Controls */}
                    {adminMode && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyPrompt(session.prompt, session.id);
                            }}
                            className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition"
                            type="button"
                          >
                            {copiedId === session.id ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <CopyPromptIcon className="w-4 h-4" />
                                Copy Prompt
                              </>
                            )}
                          </button>
                          
                          <label className="flex items-center gap-2 text-sm bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded cursor-pointer transition">
                            {uploading === session.id ? (
                              'Uploading...'
                            ) : (
                              <>
                                <Camera className="w-4 h-4" />
                                Upload Image
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUpload(e, session.id)}
                              className="hidden"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </label>
                        </div>
                        
                        {!imageUrl && session.prompt && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <p className="text-yellow-800 text-sm font-medium mb-1">AI Prompt:</p>
                            <p className="text-yellow-700 text-xs line-clamp-2">{session.prompt}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-12 border-t border-gray-200">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">150+</div>
              <div className="text-gray-600">Campaigns Shot</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">40+</div>
              <div className="text-gray-600">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">12</div>
              <div className="text-gray-600">Industry Awards</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-gray-600">Client Retention</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Services</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Comprehensive fashion photography services tailored to elevate 
              your brand and capture your vision with precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((service, index) => {
              const Icon = service.icon;
              return (
                <div 
                  key={index} 
                  className="group p-8 rounded-2xl border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-xl"
                >
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-lg font-bold">{service.price}</p>
                    <button 
                      onClick={scrollToContact}
                      className="mt-4 text-black hover:text-gray-600 transition flex items-center text-sm font-medium"
                    >
                      Book Now <ChevronRight className="ml-1 w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact/Booking Section */}
      <section ref={contactRef} className="py-20 bg-black text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Start Your Project</h2>
              <p className="text-gray-300 text-lg">
                Ready to create something extraordinary? Let&apos;s discuss your vision.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                {formSubmitted ? (
                  <div className="bg-green-900/30 border border-green-700 rounded-2xl p-8 text-center">
                    <Check className="w-16 h-16 text-green-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Thank You!</h3>
                    <p className="text-gray-300 mb-6">
                      Your inquiry has been received. We&apos;ll contact you within 24 hours 
                      to discuss your project in detail.
                    </p>
                    <button
                      onClick={() => setFormSubmitted(false)}
                      className="text-white border border-white/30 hover:bg-white/10 px-6 py-3 rounded-full transition"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white transition"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white transition"
                        placeholder="you@company.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Project Type
                        </label>
                        <select
                          required
                          value={formData.projectType}
                          onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition"
                        >
                          <option value="">Select</option>
                          <option value="editorial">Editorial</option>
                          <option value="commercial">Commercial Campaign</option>
                          <option value="lookbook">Lookbook</option>
                          <option value="runway">Runway/Event</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Budget Range
                        </label>
                        <select
                          required
                          value={formData.budget}
                          onChange={(e) => setFormData({...formData, budget: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition"
                        >
                          <option value="">Select</option>
                          <option value="2-5k">$2,000 - $5,000</option>
                          <option value="5-10k">$5,000 - $10,000</option>
                          <option value="10-20k">$10,000 - $20,000</option>
                          <option value="20k+">$20,000+</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Project Details
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white transition resize-none"
                        placeholder="Tell us about your project, timeline, and creative vision..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-full text-lg font-medium transition flex items-center justify-center"
                    >
                      Submit Inquiry <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  </form>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Mail className="w-5 h-5 text-gray-400 mt-1 mr-4" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-gray-300">studio@aureliavision.com</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="w-5 h-5 text-gray-400 mt-1 mr-4" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-gray-300">+1 (555) 123-4567</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1 mr-4" />
                      <div>
                        <p className="font-medium">Studio Locations</p>
                        <p className="text-gray-300">New York • Paris • Tokyo</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-6">Why Choose Us</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-400 mr-3" />
                      <span>Full creative direction & production</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-400 mr-3" />
                      <span>International team & locations</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-400 mr-3" />
                      <span>Industry-leading equipment</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-400 mr-3" />
                      <span>Fast 48-hour preview delivery</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-6">Follow the Journey</h3>
                  <div className="flex space-x-4">
                    <a 
                      href="#" 
                      className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center hover:bg-white/10 transition"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a 
                      href="#" 
                      className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center hover:bg-white/10 transition"
                    >
                     
                    </a>
                    <a 
                      href="#" 
                      className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center hover:bg-white/10 transition"
                    >
                      <Camera className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-black" />
                </div>
                <span className="text-xl font-bold">AURELIA VISION</span>
              </div>
              <p className="text-gray-400">Fashion Photography Studio</p>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400 mb-2">© 2024 Aurelia Vision. All rights reserved.</p>
              <p className="text-gray-500 text-sm">Capturing fashion&apos;s future, frame by frame.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Image Modal/Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button 
            onClick={() => {
              const newIndex = (currentSlide - 1 + PHOTO_SESSIONS.length) % PHOTO_SESSIONS.length;
              setCurrentSlide(newIndex);
              const session = PHOTO_SESSIONS[newIndex];
              setSelectedImage(images[session.id]?.image_url || null);
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button 
            onClick={() => {
              const newIndex = (currentSlide + 1) % PHOTO_SESSIONS.length;
              setCurrentSlide(newIndex);
              const session = PHOTO_SESSIONS[newIndex];
              setSelectedImage(images[session.id]?.image_url || null);
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition z-10"
          >
            <ChevronRightIcon className="w-8 h-8" />
          </button>
          
          <div className="relative w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center">
            <Image
              src={selectedImage}
              alt="Full screen view"
              fill
              className="object-contain"
              sizes="100vw"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-fashion.jpg';
              }}
            />
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-center">
            <p className="text-lg font-medium">{PHOTO_SESSIONS[currentSlide]?.title}</p>
            <p className="text-gray-300 text-sm">
              {PHOTO_SESSIONS[currentSlide]?.client} • {PHOTO_SESSIONS[currentSlide]?.year}
            </p>
          </div>
        </div>
      )}

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-40">
          👑 Admin Mode Active
        </div>
      )}
    </div>
  );
}

// Helper component for copy icon
function CopyPromptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
    </svg>
  );
}