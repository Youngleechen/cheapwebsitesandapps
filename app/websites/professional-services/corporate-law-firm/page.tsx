'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  Award, 
  Users, 
  Globe, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin,
  ArrowRight,
  Shield,
  Building2,
  FileText,
  TrendingUp
} from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'law-firm-gallery';

// Team members data
const TEAM_MEMBERS = [
  { 
    id: 'elizabeth-sterling', 
    name: 'Elizabeth Sterling, Esq.',
    position: 'Managing Partner, M&A',
    bio: 'Harvard Law graduate with 25+ years in corporate law. Specializes in cross-border acquisitions.',
    prompt: 'Professional headshot of a sophisticated female attorney in her 50s with silver-streaked hair, wearing a navy blue power suit with a pearl necklace, standing in a modern law office with floor-to-ceiling windows overlooking a city skyline. Photorealistic, professional lighting, confident expression.'
  },
  { 
    id: 'robert-hart', 
    name: 'Robert Hart, JD',
    position: 'Senior Partner, Securities Law',
    bio: 'Former SEC counsel with expertise in regulatory compliance and public offerings.',
    prompt: 'Distinguished male attorney in his late 40s, wearing a charcoal gray suit with subtle pinstripes, standing confidently in a book-lined office with legal volumes in the background. Warm but authoritative expression, natural morning light from window.'
  },
  { 
    id: 'samantha-chen', 
    name: 'Samantha Chen, LL.M',
    position: 'Partner, Intellectual Property',
    bio: 'Technology law specialist with background in software engineering. MIT and Stanford Law.',
    prompt: 'Asian female attorney in her mid-30s, wearing a modern burgundy pantsuit, standing in a high-tech conference room with digital displays showing patent diagrams. Intelligent, approachable expression, holding a tablet.'
  },
  { 
    id: 'marcus-thorne', 
    name: 'Marcus Thorne, Esq.',
    position: 'Partner, Corporate Restructuring',
    bio: 'Turnaround specialist with record of successful Chapter 11 reorganizations.',
    prompt: 'African American male attorney in his 40s, wearing a navy three-piece suit, seated at a polished conference table with financial documents. Serious, thoughtful expression, dramatic office lighting.'
  }
];

// Practice areas
const PRACTICE_AREAS = [
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Mergers & Acquisitions',
    description: 'End-to-end transaction support from due diligence to post-merger integration.',
    features: ['Cross-border deals', 'Private equity', 'Joint ventures', 'Due diligence']
  },
  {
    icon: <Building2 className="w-8 h-8" />,
    title: 'Corporate Governance',
    description: 'Board advisory, compliance programs, and regulatory navigation.',
    features: ['Board counsel', 'Compliance audits', 'Policy development', 'Risk management']
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Securities & Compliance',
    description: 'SEC filings, public offerings, and ongoing regulatory compliance.',
    features: ['IPO guidance', 'Regulation D', 'Periodic filings', 'Insider trading policies']
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: 'Contracts & Agreements',
    description: 'Drafting, negotiation, and enforcement of complex business contracts.',
    features: ['Supplier agreements', 'Partnership contracts', 'NDAs', 'Licensing deals']
  }
];

// Client testimonials
const TESTIMONIALS = [
  {
    company: 'Vertex Technologies',
    quote: 'Sterling & Hart navigated our $450M acquisition flawlessly. Their strategic counsel was invaluable.',
    author: 'CEO, Sarah Jenkins',
    industry: 'Tech Unicorn'
  },
  {
    company: 'Global Pharma Inc.',
    quote: 'Their regulatory expertise saved us months in FDA approval processes. Exceptional attention to detail.',
    author: 'General Counsel, Michael Torres',
    industry: 'Pharmaceutical'
  },
  {
    company: 'Heritage Bank',
    quote: 'The team restructured our international subsidiaries with precision. Results exceeded expectations.',
    author: 'Chairman, Richard Chen',
    industry: 'Financial Services'
  }
];

type TeamMemberState = { [key: string]: { image_url: string | null; loaded: boolean } };

export default function CorporateLawFirmPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const imageRefs = useRef<{ [key: string]: HTMLImageElement | null }>({});

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

  // Load team member images
  useEffect(() => {
    const loadImages = async () => {
      // Fetch only gallery images for admin
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

      const initialState: TeamMemberState = {};
      TEAM_MEMBERS.forEach(member => initialState[member.id] = { image_url: null, loaded: false });

      if (images) {
        const latestImagePerMember: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX.replace('-', '_')) {
            const memberId = pathParts[2];
            if (TEAM_MEMBERS.some(m => m.id === memberId) && !latestImagePerMember[memberId]) {
              latestImagePerMember[memberId] = img.path;
            }
          }
        }

        TEAM_MEMBERS.forEach(member => {
          if (latestImagePerMember[member.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerMember[member.id]).data.publicUrl;
            initialState[member.id] = { image_url: url, loaded: false };
          }
        });
      }

      setTeamMembers(initialState);
    };

    loadImages();
  }, []);

  // Handle image load
  const handleImageLoad = (memberId: string) => {
    setTeamMembers(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], loaded: true }
    }));
  };

  // Handle image upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, memberId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(memberId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX.replace('-', '_')}/${memberId}/`;

      // Clean up old images for this team member
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
      setTeamMembers(prev => ({ 
        ...prev, 
        [memberId]: { image_url: publicUrl, loaded: false } 
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, memberId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(memberId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production, connect to your backend
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
    setFormData({ name: '', email: '', company: '', message: '' });
  };

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Sterling & Hart</h1>
                <p className="text-xs text-gray-600">LAW PARTNERS</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-700 hover:text-blue-700 font-medium">Services</a>
              <a href="#team" className="text-gray-700 hover:text-blue-700 font-medium">Our Team</a>
              <a href="#clients" className="text-gray-700 hover:text-blue-700 font-medium">Clients</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-700 font-medium">Contact</a>
              <button className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors">
                Schedule Consultation
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Award className="w-5 h-5" />
              <span className="text-sm">Top-Tier Corporate Law Firm • Chambers Ranked</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Strategic Legal Counsel for
              <span className="text-blue-200"> Complex Business Challenges</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-10 max-w-2xl">
              Premier corporate law firm specializing in M&A, securities, governance, 
              and international business transactions. Your success, legally secured.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-blue-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center">
                Request Consultation
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors">
                View Our Cases
              </button>
            </div>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold">25+</div>
                <div className="text-blue-200">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">500+</div>
                <div className="text-blue-200">M&A Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">98%</div>
                <div className="text-blue-200">Client Retention</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">50+</div>
                <div className="text-blue-200">Countries Served</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Specialized Practice Areas</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Comprehensive legal solutions for corporations, financial institutions, and growing enterprises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PRACTICE_AREAS.map((area, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="text-blue-900 mb-6">
                  {area.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{area.title}</h3>
                <p className="text-gray-600 mb-6">{area.description}</p>
                <ul className="space-y-2">
                  {area.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section with Image Upload */}
      <section id="team" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Leadership Team</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Seasoned attorneys with deep industry expertise and a track record of success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM_MEMBERS.map((member) => {
              const memberData = teamMembers[member.id] || { image_url: null, loaded: false };
              const imageUrl = memberData.image_url;
              
              return (
                <div key={member.id} className="group relative">
                  <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                    {/* Image Container with Skeleton */}
                    <div className="relative h-80 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                      {imageUrl && (
                        <>
                          <div 
                            className={`absolute inset-0 transition-opacity duration-300 ${
                              memberData.loaded ? 'opacity-0' : 'opacity-100'
                            }`}
                            style={{
                              background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                              backgroundSize: '200% 100%',
                              animation: 'pulse 2s infinite'
                            }}
                          />
                          <img
  ref={(el) => {
    imageRefs.current[member.id] = el;
  }}
  src={imageUrl}
  alt={member.name}
  className={`w-full h-full object-cover transition-opacity duration-300 ${
    memberData.loaded ? 'opacity-100' : 'opacity-0'
  }`}
  onLoad={() => handleImageLoad(member.id)}
  onError={(e) => {
    (e.target as HTMLImageElement).style.display = 'none';
    const parent = (e.target as HTMLImageElement).parentElement;
    if (parent) {
      parent.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
          <div class="text-center">
            <Briefcase class="w-12 h-12 text-blue-300 mx-auto mb-2" />
            <p class="text-blue-900 font-semibold">${member.name.split(' ')[0]}</p>
          </div>
        </div>
      `;
    }
  }}
/>
                        </>
                      )}
                      
                      {!imageUrl && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
                          <div className="text-center">
                            <Briefcase className="w-12 h-12 text-blue-300 mx-auto mb-2" />
                            <p className="text-blue-900 font-semibold">{member.name.split(' ')[0]}</p>
                            <p className="text-blue-700 text-sm">Attorney</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Admin Upload Overlay */}
                      {adminMode && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <label className="cursor-pointer bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                            {uploading === member.id ? 'Uploading...' : 'Change Photo'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUpload(e, member.id)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                      <p className="text-blue-700 font-medium mb-2">{member.position}</p>
                      <p className="text-gray-600 text-sm">{member.bio}</p>
                      
                      {adminMode && !imageUrl && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex flex-col gap-2">
                            <p className="text-xs text-purple-600 font-semibold">Image Prompt:</p>
                            <p className="text-xs text-gray-700 mb-2">{member.prompt}</p>
                            <button
                              onClick={() => copyPrompt(member.prompt, member.id)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded flex items-center justify-center gap-1"
                              type="button"
                            >
                              {copiedId === member.id ? '✓ Copied' : 'Copy Prompt'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="clients" className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Client Success Stories</h2>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              Trusted by Fortune 500 companies and innovative startups alike.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center mr-4">
                  <span className="text-xl font-bold">{TESTIMONIALS[activeTestimonial].company.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold">{TESTIMONIALS[activeTestimonial].company}</h4>
                  <p className="text-blue-200">{TESTIMONIALS[activeTestimonial].industry}</p>
                </div>
              </div>
              
              <blockquote className="text-2xl italic mb-8">
                "{TESTIMONIALS[activeTestimonial].quote}"
              </blockquote>
              
              <div className="text-right">
                <p className="font-bold">{TESTIMONIALS[activeTestimonial].author}</p>
              </div>
              
              <div className="flex justify-center space-x-2 mt-8">
                {TESTIMONIALS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTestimonial(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      idx === activeTestimonial ? 'bg-white w-8' : 'bg-white/50'
                    }`}
                    aria-label={`View testimonial ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Client Logos */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 opacity-80">
            {['Vertex Tech', 'Global Pharma', 'Heritage Bank', 'Quantum AI', 'Nova Energy', 'Horizon Retail'].map((logo) => (
              <div key={logo} className="bg-white/5 rounded-lg p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-200 mb-1">{logo.split(' ')[0]}</div>
                  <div className="text-sm text-blue-300">{logo.split(' ')[1]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Schedule Your Initial Consultation</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Contact us for a confidential discussion about your legal needs. 
                Our team responds within 24 hours.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center">
                  <Phone className="w-6 h-6 text-blue-700 mr-4" />
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-gray-600">(212) 555-0100</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="w-6 h-6 text-blue-700 mr-4" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-gray-600">contact@sterlinghartlaw.com</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-6 h-6 text-blue-700 mr-4" />
                  <div>
                    <p className="font-semibold">Office</p>
                    <p className="text-gray-600">One Liberty Plaza, 23rd Floor<br />New York, NY 10006</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 p-6 bg-blue-50 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-3">Why Choose Sterling & Hart?</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span>Fixed-Fee Project Quotes Available</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span>24/7 Urgent Matter Response</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span>Multilingual Legal Team</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span>Proven Track Record in Your Industry</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div>
              <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                {formSubmitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
                    <p className="text-gray-600">
                      We've received your inquiry and will contact you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.company}
                          onChange={(e) => setFormData({...formData, company: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                          placeholder="Acme Corporation"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                        placeholder="john@company.com"
                      />
                    </div>
                    
                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How Can We Assist You? *
                      </label>
                      <textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition resize-none"
                        placeholder="Describe your legal needs or specific matter..."
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-blue-900 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-800 transition-colors"
                    >
                      Request Confidential Consultation
                    </button>
                    
                    <p className="text-center text-gray-500 text-sm mt-4">
                      By submitting, you agree to our Privacy Policy. We never share your information.
                    </p>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Sterling & Hart</h3>
                  <p className="text-xs text-gray-400">LAW PARTNERS</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Premier corporate legal counsel for businesses navigating complex challenges.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Practice Areas</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Mergers & Acquisitions</a></li>
                <li><a href="#" className="hover:text-white transition">Corporate Governance</a></li>
                <li><a href="#" className="hover:text-white transition">Securities Law</a></li>
                <li><a href="#" className="hover:text-white transition">Intellectual Property</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Legal Insights Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Case Studies</a></li>
                <li><a href="#" className="hover:text-white transition">Industry Reports</a></li>
                <li><a href="#" className="hover:text-white transition">Compliance Checklist</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Connect</h4>
              <p className="text-gray-400 mb-4">
                Subscribe for legal updates and insights:
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 rounded-l-lg flex-grow text-gray-900"
                />
                <button className="bg-blue-600 px-4 py-2 rounded-r-lg hover:bg-blue-700 transition">
                  →
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Sterling & Hart Law Partners LLP. All rights reserved.</p>
            <p className="mt-2">Attorney Advertising. Prior results do not guarantee a similar outcome.</p>
          </div>
        </div>
      </footer>

      {/* Admin Notice */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-purple-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Admin Mode Active</span>
          </div>
          <p className="text-xs text-purple-200 mt-1">You can upload team photos</p>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}