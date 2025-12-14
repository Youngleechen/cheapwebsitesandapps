'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { 
  ChevronRight, 
  Star, 
  MapPin, 
  CheckCircle, 
  Calendar, 
  Phone, 
  Mail, 
  Instagram, 
  Pinterest,
  Menu,
  X,
  ArrowRight,
  Home,
  Palette,
  Layers,
  Droplets
} from 'lucide-react';

// Supabase setup (same as your gallery system)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'interior-design-gallery';

// Interior design projects with detailed descriptions
const DESIGN_PROJECTS = [
  { 
    id: 'modern-coastal-retreat', 
    title: 'Modern Coastal Retreat',
    category: 'Residential',
    location: 'Malibu, California',
    description: 'A serene beachfront home blending minimalist aesthetics with organic textures and panoramic ocean views.',
    features: ['Open-plan living', 'Custom joinery', 'Sustainable materials', 'Indoor-outdoor flow'],
    prompt: 'A luxurious coastal interior with clean lines, natural light, and organic materials. Features white oak floors, linen textiles, and a neutral palette with ocean-blue accents. Include floor-to-ceiling windows overlooking the Pacific, minimalist furniture, and subtle nautical elements.'
  },
  { 
    id: 'urban-loft-transformation', 
    title: 'Urban Loft Transformation',
    category: 'Commercial',
    location: 'New York, NY',
    description: 'Industrial warehouse converted into a sophisticated creative studio space.',
    features: ['Exposed brick', 'Steel beams', 'Custom lighting', 'Modular furniture'],
    prompt: 'A converted industrial loft with high ceilings, exposed brick walls, and black steel beams. Include large factory-style windows, polished concrete floors, and a mix of vintage and modern furniture. Use a monochrome palette with pops of mustard yellow and forest green.'
  },
  { 
    id: 'mid-century-modern-revival', 
    title: 'Mid-Century Modern Revival',
    category: 'Residential',
    location: 'Palm Springs',
    description: 'Faithful restoration of a 1960s home with contemporary updates for modern living.',
    features: ['Original features preserved', 'Terrazzo floors', 'Vintage furniture', 'Desert landscaping'],
    prompt: 'A mid-century modern living room with floor-to-ceiling windows overlooking desert landscape. Features iconic Eames furniture, terrazzo floors, sunken conversation pit, and a stone fireplace. Color palette of mustard, olive green, and burnt orange with teak wood accents.'
  },
  { 
    id: 'luxury-hotel-lobby', 
    title: 'Luxury Hotel Lobby',
    category: 'Hospitality',
    location: 'Miami, Florida',
    description: 'Opulent yet welcoming hotel lobby designed for the modern luxury traveler.',
    features: ['Double-height space', 'Art installation', 'Custom marble', 'Tropical garden atrium'],
    prompt: 'A luxury hotel lobby with double-height ceilings and a dramatic staircase. Include marble floors, velvet seating clusters, a living green wall, and a stunning chandelier. Modern tropical aesthetic with rattan accents, palm plants, and gold metal finishes.'
  },
  { 
    id: 'mountain-cabin-sanctuary', 
    title: 'Mountain Cabin Sanctuary',
    category: 'Residential',
    location: 'Aspen, Colorado',
    description: 'Rustic-modern retreat designed for year-round mountain living with cozy sophistication.',
    features: ['Floor-to-ceiling fireplace', 'Ski storage', 'Heated floors', 'Outdoor hot tub'],
    prompt: 'A cozy mountain cabin living room with massive stone fireplace and timber beams. Include plush sectional sofas, sheepskin rugs, and floor-to-ceiling windows with mountain views. Warm color palette of charcoal, cream, and rust with natural wood textures.'
  },
  { 
    id: 'wellness-center-oasis', 
    title: 'Wellness Center Oasis',
    category: 'Commercial',
    location: 'Sedona, Arizona',
    description: 'Healing space designed around principles of biophilic design and tranquility.',
    features: ['Natural light optimization', 'Living walls', 'Salt therapy room', 'Meditation garden'],
    prompt: 'A serene wellness center reception area with curved walls and organic shapes. Include marble reception desk, hanging plants, natural stone floors, and soft indirect lighting. Earthy color palette with sage green, terracotta, and warm beige tones.'
  },
];

type ProjectState = { 
  [key: string]: { 
    image_url: string | null;
    additional_images?: string[];
  } 
};

export default function InteriorDesignPortfolio() {
  const [projects, setProjects] = useState<ProjectState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    projectType: 'residential',
    message: ''
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

      const initialState: ProjectState = {};
      DESIGN_PROJECTS.forEach(project => initialState[project.id] = { image_url: null });

      if (images) {
        const latestImagePerProject: Record<string, string> = {};
        const allProjectImages: Record<string, string[]> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX.replace('-', '/')) {
            const projectId = pathParts[2];
            
            if (DESIGN_PROJECTS.some(p => p.id === projectId)) {
              // Store latest image
              if (!latestImagePerProject[projectId]) {
                latestImagePerProject[projectId] = img.path;
              }
              
              // Store all images for this project
              if (!allProjectImages[projectId]) {
                allProjectImages[projectId] = [];
              }
              const url = supabase.storage
                .from('user_images')
                .getPublicUrl(img.path).data.publicUrl;
              allProjectImages[projectId].push(url);
            }
          }
        }

        // Build final state
        DESIGN_PROJECTS.forEach(project => {
          if (latestImagePerProject[project.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerProject[project.id]).data.publicUrl;
            
            initialState[project.id] = { 
              image_url: url,
              additional_images: allProjectImages[project.id] || []
            };
          }
        });
      }

      setProjects(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(projectId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${projectId}/`;
      const filePath = `${folderPath}${Date.now()}_${file.name}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      // Refresh image
      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setProjects(prev => ({ 
        ...prev, 
        [projectId]: { 
          ...prev[projectId],
          image_url: publicUrl,
          additional_images: [...(prev[projectId]?.additional_images || []), publicUrl]
        } 
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would connect to your backend
    alert('Thank you for your inquiry! We\'ll contact you within 24 hours.');
    setContactForm({ name: '', email: '', projectType: 'residential', message: '' });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-500 rounded-full"></div>
              <span className="text-xl font-bold tracking-tight">Aura Interiors</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#work" className="hover:text-amber-600 transition">Portfolio</Link>
              <Link href="#services" className="hover:text-amber-600 transition">Services</Link>
              <Link href="#process" className="hover:text-amber-600 transition">Process</Link>
              <Link href="#about" className="hover:text-amber-600 transition">Studio</Link>
              <Link href="#contact" className="bg-amber-500 text-white px-6 py-2 rounded-full hover:bg-amber-600 transition">
                Start Your Project
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <Link href="#work" className="block py-2">Portfolio</Link>
              <Link href="#services" className="block py-2">Services</Link>
              <Link href="#process" className="block py-2">Process</Link>
              <Link href="#about" className="block py-2">Studio</Link>
              <Link href="#contact" className="block bg-amber-500 text-white px-6 py-2 rounded-full w-full text-center">
                Start Your Project
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-amber-50 text-amber-700 rounded-full mb-6">
                <Star size={16} className="mr-2" />
                <span className="text-sm font-medium">Award-Winning Design Studio</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                Transform Your Space into <span className="text-amber-500">Art</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                We create bespoke interiors that reflect your personality while optimizing for comfort, function, and timeless beauty.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="#contact" 
                  className="bg-amber-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-600 transition flex items-center justify-center"
                >
                  Book a Consultation <ArrowRight className="ml-2" size={20} />
                </Link>
                <Link 
                  href="#work" 
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:border-amber-500 transition flex items-center justify-center"
                >
                  View Our Work
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                {projects['modern-coastal-retreat']?.image_url ? (
                  <Image
                    src={projects['modern-coastal-retreat'].image_url}
                    alt="Modern Coastal Retreat"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Home size={48} className="mx-auto text-amber-300 mb-4" />
                      <p className="text-gray-500">Featured Project Preview</p>
                      {adminMode && (
                        <label className="mt-4 inline-block bg-amber-500 text-white px-6 py-3 rounded-lg cursor-pointer">
                          {uploading === 'modern-coastal-retreat' ? 'Uploading...' : 'Upload Hero Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUpload(e, 'modern-coastal-retreat')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl w-64">
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600">"Transformed our home beyond expectations. Professional, creative, and attentive to every detail."</p>
                <p className="text-sm font-semibold mt-2">— Sarah & James Peterson</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="work" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Projects</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Each space tells a unique story, crafted with precision and passion</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {DESIGN_PROJECTS.map((project) => {
              const projectData = projects[project.id] || { image_url: null, additional_images: [] };
              
              return (
                <div 
                  key={project.id} 
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 group cursor-pointer"
                  onClick={() => setSelectedProject(project.id)}
                >
                  <div className="relative h-64 overflow-hidden">
                    {projectData.image_url ? (
                      <Image
                        src={projectData.image_url}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex flex-col items-center justify-center p-6">
                        <Palette size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-400 text-center mb-4">Project visual coming soon</p>
                        {adminMode && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 max-w-xs">{project.prompt}</p>
                            <label className="inline-block bg-amber-500 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
                              {uploading === project.id ? 'Uploading...' : 'Upload Image'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUpload(e, project.id)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-sm font-medium">{project.category}</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold">{project.title}</h3>
                      {projectData.additional_images && projectData.additional_images.length > 0 && (
                        <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          +{projectData.additional_images.length} more
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-gray-500 mb-3">
                      <MapPin size={16} className="mr-1" />
                      <span className="text-sm">{project.location}</span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{project.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {project.features.map((feature, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Design Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Comprehensive solutions from concept to completion</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Home size={32} />,
                title: 'Residential Design',
                description: 'Full-service interior design for homes, apartments, and vacation properties.',
                features: ['Space planning', 'Furniture selection', 'Lighting design', 'Color consultation']
              },
              {
                icon: <Layers size={32} />,
                title: 'Commercial Spaces',
                description: 'Workplace, retail, and hospitality interiors that enhance brand identity.',
                features: ['Brand integration', 'Wayfinding', 'Acoustic solutions', 'ADA compliance']
              },
              {
                icon: <Droplets size={32} />,
                title: 'Renovation & Styling',
                description: 'Transform existing spaces with strategic updates and impeccable styling.',
                features: ['Material selection', 'Art curation', 'Accessory styling', 'Final installation']
              }
            ].map((service, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-amber-200 transition">
                <div className="text-amber-500 mb-4">{service.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle size={16} className="text-green-500 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-16 bg-amber-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Our Design Process</h2>
          
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-amber-200 transform -translate-y-1/2"></div>
            
            <div className="grid md:grid-cols-4 gap-8 relative">
              {[
                { step: '01', title: 'Discovery', description: 'We learn about your lifestyle, preferences, and vision' },
                { step: '02', title: 'Concept Design', description: 'Mood boards, floor plans, and material selections' },
                { step: '03', title: 'Development', description: 'Detailed drawings, specifications, and procurement' },
                { step: '04', title: 'Installation', description: 'Transformation day - we bring the vision to life' }
              ].map((stage, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 relative z-10">
                    {stage.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{stage.title}</h3>
                  <p className="text-gray-600">{stage.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-4xl font-bold mb-6">Start Your Transformation</h2>
              <p className="text-gray-600 mb-8">
                Ready to create a space that inspires you every day? Let's schedule a complimentary discovery call to discuss your project.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <Phone size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Call Us</p>
                    <p className="text-gray-600">(555) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <Mail size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-gray-600">hello@aurainteriors.com</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <Calendar size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Office Hours</p>
                    <p className="text-gray-600">Mon-Fri: 9AM-6PM PST</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
                  <Instagram size={20} />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
                  <Pinterest size={20} />
                </a>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    value={contactForm.projectType}
                    onChange={(e) => setContactForm({...contactForm, projectType: e.target.value})}
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="renovation">Renovation</option>
                    <option value="consultation">Design Consultation</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tell us about your project</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-amber-500 text-white py-4 rounded-lg font-semibold hover:bg-amber-600 transition"
                >
                  Schedule Free Consultation
                </button>
                
                <p className="text-sm text-gray-500 text-center">
                  We typically respond within 24 hours
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-amber-500 rounded-full"></div>
                <span className="text-xl font-bold">Aura Interiors</span>
              </div>
              <p className="text-gray-400">Creating beautiful, functional spaces since 2012</p>
            </div>
            
            <div className="text-gray-400">
              <p>© {new Date().getFullYear()} Aura Interiors. All rights reserved.</p>
              <p className="mt-2">Serving clients across North America</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span>Admin Mode Active</span>
          </div>
          <p className="text-xs mt-1">You can upload project images</p>
        </div>
      )}

      {/* Project Modal */}
      {selectedProject && (() => {
        const project = DESIGN_PROJECTS.find(p => p.id === selectedProject);
        const projectData = projects[selectedProject];
        
        if (!project) return null;
        
        return (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-3xl font-bold">{project.title}</h3>
                    <p className="text-gray-600">{project.location}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedProject(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {projectData?.image_url ? (
                  <div className="relative h-96 rounded-xl overflow-hidden mb-6">
                    <Image
                      src={projectData.image_url}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                  </div>
                ) : (
                  <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                    <p className="text-gray-500">No image uploaded yet</p>
                  </div>
                )}
                
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <h4 className="text-xl font-bold mb-4">Project Details</h4>
                    <p className="text-gray-600 mb-6">{project.description}</p>
                    
                    <div className="mb-6">
                      <h5 className="font-semibold mb-2">Design Features:</h5>
                      <div className="flex flex-wrap gap-2">
                        {project.features.map((feature, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-bold mb-4">Design Prompt</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-600 text-sm">{project.prompt}</p>
                      {adminMode && (
                        <button
                          onClick={() => navigator.clipboard.writeText(project.prompt)}
                          className="mt-4 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition"
                        >
                          Copy Prompt for AI Generation
                        </button>
                      )}
                    </div>
                    
                    {adminMode && (
                      <div className="mt-6">
                        <label className="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg cursor-pointer text-center hover:bg-purple-700 transition">
                          {uploading === project.id ? 'Uploading...' : 'Upload Additional Images'}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleUpload(e, project.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                
                {projectData?.additional_images && projectData.additional_images.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-xl font-bold mb-4">Additional Views</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {projectData.additional_images.map((img, index) => (
                        <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                          <Image
                            src={img}
                            alt={`${project.title} view ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}