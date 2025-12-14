// File: app/professional-services/wealth-management-advisor/page.tsx
// Category: professional-services/wealth-management-advisor
// Business: Summit Peak Wealth Advisors - Boston, MA

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Calendar, Phone, Mail, MapPin, Shield, TrendingUp, Users, FileText, BarChart, PiggyBank, HeartHandshake, Briefcase, GraduationCap, Star } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'gallery_summit_wealth';

const WEALTH_IMAGES = [
  { 
    id: 'team-lead', 
    title: 'Principal Advisor',
    prompt: 'Professional portrait of a distinguished, approachable male wealth advisor in his late 40s, wearing a navy suit, standing in a sophisticated Boston office with city skyline view through large windows, warm natural lighting, confident but approachable expression, high-end professional photography style'
  },
  { 
    id: 'team-associate', 
    title: 'Senior Financial Planner',
    prompt: 'Professional portrait of a sharp, trustworthy female financial planner in her early 40s, wearing business attire, in a modern conference room setting with financial charts on screens in background, natural lighting, warm professional smile, executive presence'
  },
  { 
    id: 'boston-office', 
    title: 'Boston Headquarters',
    prompt: 'Elegant exterior shot of a prestigious financial district office building in Boston at golden hour, modern architecture with glass facade, clean professional composition, urban sophistication, financial district atmosphere'
  },
  { 
    id: 'client-meeting', 
    title: 'Client Consultation',
    prompt: 'Warm, professional scene of a wealth advisor meeting with clients in a comfortable conference room, showing charts and planning documents on table, natural lighting, genuine human connection, sophisticated but approachable atmosphere'
  },
  { 
    id: 'investment-dashboard', 
    title: 'Investment Analytics',
    prompt: 'Sophisticated financial dashboard display showing portfolio performance charts, risk analysis graphs, and asset allocation pie charts on multiple high-resolution monitors, clean modern interface, professional trading floor aesthetic'
  },
  { 
    id: 'retirement-planning', 
    title: 'Retirement Strategy',
    prompt: 'Elegant conceptual illustration showing retirement planning journey - path leading from career stage to relaxed retirement lifestyle with mountains, beach house, and family activities, sophisticated color palette of blues and golds, professional financial illustration style'
  },
];

type WealthImageState = { [key: string]: { image_url: string | null } };

const WealthGallerySkeleton = () => {
  const [images, setImages] = useState<WealthImageState>({});
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
      const { data: existingImages, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${ADMIN_USER_ID}/${GALLERY_PREFIX}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading wealth images:', error);
        return;
      }

      const initialState: WealthImageState = {};
      WEALTH_IMAGES.forEach(img => initialState[img.id] = { image_url: null });

      if (existingImages) {
        const latestImagePerCategory: Record<string, string> = {};

        for (const img of existingImages) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const categoryId = pathParts[2];
            if (WEALTH_IMAGES.some(a => a.id === categoryId) && !latestImagePerCategory[categoryId]) {
              latestImagePerCategory[categoryId] = img.path;
            }
          }
        }

        WEALTH_IMAGES.forEach(img => {
          if (latestImagePerCategory[img.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerCategory[img.id]).data.publicUrl;
            initialState[img.id] = { image_url: url };
          }
        });
      }

      setImages(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(imageId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${imageId}/`;

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
      setImages(prev => ({ ...prev, [imageId]: { image_url: publicUrl } }));
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

  return {
    images,
    adminMode,
    uploading,
    copiedId,
    handleUpload,
    copyPrompt
  };
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function SummitPeakWealthAdvisors() {
  const { images, adminMode, uploading, copiedId, handleUpload, copyPrompt } = WealthGallerySkeleton();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [consultationModal, setConsultationModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    assets: '',
    goals: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Section tracking
      const sections = ['hero', 'about', 'services', 'process', 'team', 'testimonials', 'cta'];
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= scrollPosition && rect.bottom >= scrollPosition) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('consultation_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          assets: formData.assets,
          goals: formData.goals,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setFormSubmitted(true);
      setTimeout(() => {
        setConsultationModal(false);
        setFormSubmitted(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          assets: '',
          goals: ''
        });
      }, 3000);
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit consultation request. Please try again.');
    }
  };

  // Team data with fallback images
  const teamMembers = [
    {
      id: 'team-lead',
      name: 'Michael R. Harrington, CFA',
      title: 'Principal & Chief Investment Officer',
      bio: 'With over 25 years of experience in institutional finance and wealth management, Michael leads our investment strategy team. Previously a portfolio manager at a major Boston investment firm, he holds an MBA from Harvard and is a Chartered Financial Analyst. Michael is passionate about building customized investment strategies that align with clients\' life goals.',
      credentials: ['CFA Charterholder', 'MBA, Harvard Business School', 'Series 65 Licensed']
    },
    {
      id: 'team-associate',
      name: 'Sarah J. Mitchell, CFP®',
      title: 'Senior Financial Planner',
      bio: 'Sarah specializes in comprehensive financial planning for high-net-worth individuals and business owners. Her client-centered approach focuses on tax optimization, retirement planning, and estate strategies. A Certified Financial Planner™ with 15+ years of experience, Sarah is known for her ability to simplify complex financial concepts and build lasting client relationships.',
      credentials: ['CFP® Professional', 'CPA (Inactive)', 'BS Finance, Boston University']
    }
  ];

  // Services data
  const services = [
    {
      icon: <TrendingUp className="text-summit-gold" size={28} />,
      title: 'Investment Management',
      description: 'Institutional-grade portfolio construction with personalized asset allocation, risk management, and tax-efficient strategies designed to maximize after-tax returns.',
      details: [
        'Customized portfolio design based on your risk tolerance and goals',
        'Access to institutional-class investments and alternative assets',
        'Continuous monitoring and rebalancing',
        'Tax-loss harvesting and tax-efficient withdrawal strategies'
      ]
    },
    {
      icon: <PiggyBank className="text-summit-gold" size={28} />,
      title: 'Retirement Planning',
      description: 'Comprehensive retirement strategies that ensure you can maintain your desired lifestyle while optimizing tax efficiency and protecting against longevity risk.',
      details: [
        'Detailed cash flow analysis and retirement income projections',
        'Social Security optimization strategies',
        'Healthcare and long-term care planning',
        'Roth conversion analysis and tax diversification'
      ]
    },
    {
      icon: <FileText className="text-summit-gold" size={28} />,
      title: 'Estate Planning',
      description: 'Strategic wealth transfer planning that minimizes taxes, protects assets, and ensures your legacy aligns with your values and intentions.',
      details: [
        'Trust and estate structure analysis',
        'Beneficiary designation reviews',
        'Charitable giving strategies',
        'Business succession planning for entrepreneurs'
      ]
    },
    {
      icon: <HeartHandshake className="text-summit-gold" size={28} />,
      title: 'Family Wealth Office',
      description: 'Holistic wealth management for multi-generational families, including education funding, family governance, and values-based legacy planning.',
      details: [
        'Family meeting facilitation and education',
        'Next-generation financial literacy programs',
        'Concentrated stock position management',
        'Philanthropic strategy development'
      ]
    }
  ];

  // Process steps
  const processSteps = [
    {
      step: 1,
      title: 'Discovery Meeting',
      description: 'We begin with a comprehensive understanding of your financial situation, goals, values, and concerns. This 90-minute session sets the foundation for your personalized strategy.',
      icon: <Briefcase className="text-summit-blue" size={24} />
    },
    {
      step: 2,
      title: 'Strategy Development',
      description: 'Our team analyzes your situation and develops a customized wealth management strategy, including investment recommendations, tax planning, and estate considerations.',
      icon: <BarChart className="text-summit-blue" size={24} />
    },
    {
      step: 3,
      title: 'Implementation',
      description: 'We execute your strategy with precision, coordinating with your tax advisors, attorneys, and other professionals to ensure seamless implementation across all aspects of your financial life.',
      icon: <CheckCircle className="text-summit-blue" size={24} />
    },
    {
      step: 4,
      title: 'Ongoing Partnership',
      description: 'Your dedicated advisor team provides continuous monitoring, quarterly reviews, and proactive adjustments to keep you on track toward your goals through all market conditions.',
      icon: <Users className="text-summit-blue" size={24} />
    }
  ];

  // Testimonials
  const testimonials = [
    {
      id: 1,
      name: 'David & Emily Thompson',
      location: 'Back Bay, Boston',
      text: 'Summit Peak transformed our approach to wealth management. After years of fragmented advice from multiple advisors, Michael and Sarah created a unified strategy that finally made sense. Their institutional expertise combined with genuine care for our family\'s goals has been invaluable.',
      assets: '$3.5M portfolio'
    },
    {
      id: 2,
      name: 'Dr. Robert Chen',
      location: 'Newton, MA',
      text: 'As a busy physician, I needed advisors who could handle complexity without overwhelming me. Summit Peak\'s comprehensive approach to my practice sale, retirement planning, and college funding for my children exceeded my expectations. They think like fiduciaries, not salespeople.',
      assets: '$5.2M portfolio'
    },
    {
      id: 3,
      name: 'Jennifer A. Williams',
      location: 'Cambridge, MA',
      text: 'After inheriting a significant estate, I was overwhelmed by decisions and potential pitfalls. Sarah\'s expertise in estate planning and tax optimization saved me hundreds of thousands in unnecessary taxes. Their team became my trusted partners during a difficult transition.',
      assets: '$2.8M portfolio'
    }
  ];

  // Performance data (simulated for demo)
  const performanceData = [
    { year: '2023', return: '14.2%', benchmark: '12.8%', category: 'Large Cap Growth' },
    { year: '2022', return: '-8.6%', benchmark: '-10.2%', category: 'Market Downturn' },
    { year: '2021', return: '22.4%', benchmark: '19.6%', category: 'Recovery Phase' },
    { year: '2020', return: '9.8%', benchmark: '7.2%', category: 'Pandemic Volatility' },
    { year: '2019', return: '18.3%', benchmark: '16.1%', category: 'Growth Cycle' }
  ];

  const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-summit-blue w-10 h-10 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">SP</span>
            </div>
            <div>
              <h1 className={`font-bold ${scrolled ? 'text-xl' : 'text-2xl'} text-gray-900`}>Summit Peak</h1>
              <p className={`text-sm ${scrolled ? 'text-gray-600' : 'text-gray-700'}`}>Wealth Advisors</p>
            </div>
          </div>
          
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              {['About', 'Services', 'Process', 'Team', 'Results'].map((item) => (
                <li key={item}>
                  <a 
                    href={`#${item.toLowerCase()}`} 
                    className={`font-medium transition-colors ${activeSection === item.toLowerCase() ? 'text-summit-blue' : 'text-gray-700 hover:text-summit-blue'}`}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          
          <button 
            onClick={() => setConsultationModal(true)}
            className="bg-summit-blue hover:bg-summit-dark-blue text-white font-medium px-6 py-2 rounded-full transition-colors shadow-md hover:shadow-lg"
          >
            Free Consultation
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="pt-32 pb-20 bg-gradient-to-br from-summit-blue to-summit-dark-blue text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full mb-6">
                <span className="text-summit-gold font-medium">Boston's Trusted Wealth Partner Since 2010</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Strategic Wealth Management for <span className="text-summit-gold">Discerning Professionals</span>
              </h1>
              
              <p className="text-xl text-gray-200 mb-8">
                Institutional-grade investment strategies and comprehensive financial planning tailored for high-achieving individuals, business owners, and multi-generational families in the Boston area.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setConsultationModal(true)}
                  className="bg-summit-gold hover:bg-yellow-400 text-gray-900 font-bold px-8 py-4 rounded-full text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  Schedule Your Free Strategy Session <ArrowRight className="ml-2" size={20} />
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-medium px-8 py-4 rounded-full text-lg transition-colors">
                  View Our Performance
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why <span className="text-summit-blue">Summit Peak?</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We combine institutional investment expertise with personalized service to help you achieve financial confidence and build lasting wealth across generations.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="text-summit-blue" size={40} />,
                  title: 'Fiduciary Commitment',
                  description: 'We are legally obligated to act in your best interest. No commissions, no hidden fees, no conflicts of interest - just transparent, objective advice.'
                },
                {
                  icon: <TrendingUp className="text-summit-blue" size={40} />,
                  title: 'Institutional Expertise',
                  description: 'Our team brings decades of experience from major financial institutions, delivering sophisticated strategies typically reserved for ultra-high-net-worth clients.'
                },
                {
                  icon: <Users className="text-summit-blue" size={40} />,
                  title: 'Dedicated Partnership',
                  description: 'You work directly with our senior advisors, not junior associates. We maintain a selective client base to ensure personalized attention and exceptional service.'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                >
                  <div className="mb-6">{item.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive <span className="text-summit-blue">Wealth Solutions</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our integrated approach addresses every aspect of your financial life, ensuring all strategies work together harmoniously to achieve your goals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-summit-blue transition-colors"
              >
                <div className="flex items-start mb-6">
                  <div className="bg-summit-blue/10 p-3 rounded-lg mr-4">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{service.title}</h3>
                </div>
                
                <p className="text-gray-600 mb-6 text-lg">{service.description}</p>
                
                <ul className="space-y-3">
                  {service.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start">
                      <CheckCircle className="text-summit-gold mt-1 mr-3 flex-shrink-0" size={18} />
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Office Section with Gallery */}
      <section id="office" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-summit-blue">Boston Headquarters</span>
              {adminMode && (
                <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  Admin Mode: Upload office images
                </span>
              )}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the Summit Peak difference in our state-of-the-art Financial District office, designed for productive collaboration and confidential consultations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="relative aspect-video mb-8 rounded-2xl overflow-hidden shadow-2xl">
                {images['boston-office']?.image_url ? (
                  <Image 
                    src={images['boston-office'].image_url} 
                    alt="Summit Peak Boston Office" 
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-summit-blue to-summit-dark-blue flex items-center justify-center">
                    <span className="text-white text-lg font-medium">Office Exterior</span>
                  </div>
                )}
              </div>
              
              {adminMode && (
                <div className="mt-4">
                  <label className="block w-full bg-purple-600 text-white px-4 py-2 rounded-lg cursor-pointer text-center hover:bg-purple-700 transition-colors">
                    {uploading === 'boston-office' ? 'Uploading...' : 'Upload Office Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, 'boston-office')}
                      className="hidden"
                    />
                  </label>
                  {!images['boston-office']?.image_url && (
                    <div className="mt-2 text-sm text-purple-600">
                      <p className="mb-2">{WEALTH_IMAGES.find(img => img.id === 'boston-office')?.prompt}</p>
                      <button
                        onClick={() => copyPrompt(WEALTH_IMAGES.find(img => img.id === 'boston-office')?.prompt || '', 'boston-office')}
                        className="text-purple-600 hover:text-purple-800 font-medium"
                      >
                        {copiedId === 'boston-office' ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center mb-4">
                  <MapPin className="text-summit-blue mr-3" size={24} />
                  <h3 className="text-xl font-bold text-gray-900">Visit Us</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  101 Federal Street, Suite 2200<br />
                  Boston, MA 02110<br />
                  Financial District
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <span className="block font-semibold text-gray-900 mb-1">Monday-Friday</span>
                    <span className="text-gray-600">8:30 AM - 5:30 PM</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <span className="block font-semibold text-gray-900 mb-1">Saturday</span>
                    <span className="text-gray-600">By Appointment</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-summit-blue to-summit-dark-blue text-white p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <Phone className="mr-3" size={24} />
                  <h3 className="text-xl font-bold">Contact</h3>
                </div>
                <p className="mb-6">
                  Schedule a consultation with our Boston wealth advisory team to discuss your financial goals and how we can help you achieve them.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="mr-3 flex-shrink-0" size={20} />
                    <a href="tel:+16175550123" className="hover:underline">(617) 555-0123</a>
                  </div>
                  <div className="flex items-center">
                    <Mail className="mr-3 flex-shrink-0" size={20} />
                    <a href="mailto:info@summitpeakwealth.com" className="hover:underline">info@summitpeakwealth.com</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-summit-blue">Proven Process</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A systematic approach that ensures every aspect of your wealth management strategy is carefully planned, implemented, and monitored for optimal results.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-summit-blue/20" />
              
              {processSteps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col md:flex-row ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'} mb-16`}
                >
                  <div className={`w-full md:w-5/12 mb-6 md:mb-0 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'} ${index === processSteps.length - 1 ? '' : 'md:pb-16'}`}>
                    <div className="bg-gray-50 p-8 rounded-2xl shadow-md border border-gray-200 h-full">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-summit-blue rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <span className="text-white font-bold text-lg">{step.step}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-600 text-lg">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-2/12 flex justify-center md:justify-center mb-6 md:mb-0">
                    <div className="w-16 h-16 bg-summit-blue rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      {step.icon}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-5/12">
                    {index < processSteps.length - 1 && (
                      <div className="hidden md:block h-full w-px bg-summit-blue/20 mx-auto" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our <span className="text-summit-blue">Leadership Team</span>
              {adminMode && (
                <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  Admin Mode: Upload team photos
                </span>
              )}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advisors bring decades of institutional experience and a commitment to fiduciary excellence. You work directly with our senior team members who are deeply invested in your success.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 relative aspect-square">
                  {images['boston-office']?.image_url ? (
  <Image 
    src={images['boston-office'].image_url} 
    alt="Summit Peak Boston Office" 
    fill
    className="object-cover"
    priority
  />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-summit-blue to-summit-dark-blue flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-5xl font-bold mb-2">{member.name.split(' ')[0][0]}{member.name.split(' ')[1][0]}</div>
                          <span className="text-lg opacity-90">{member.title.split(' ')[0]}</span>
                        </div>
                      </div>
                    )}
                    
                    {adminMode && (
                      <div className="absolute bottom-2 right-2 z-10">
                        <label className="block bg-purple-600 text-white px-3 py-1 rounded text-xs cursor-pointer hover:bg-purple-700 transition-colors">
                          {uploading === member.id ? 'Uploading...' : 'Upload'}
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
                  
                  <div className="md:w-2/3 p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-summit-blue font-medium mb-4">{member.title}</p>
                    
                    <p className="text-gray-600 mb-6">{member.bio}</p>
                    
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Credentials & Education</h4>
                      <div className="flex flex-wrap gap-2">
                        {member.credentials.map((cred, credIndex) => (
                          <span 
                            key={credIndex} 
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                          >
                            {cred}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button className="text-summit-blue font-medium hover:text-summit-dark-blue transition-colors flex items-center">
                      View Full Profile <ArrowRight className="ml-2" size={18} />
                    </button>
                  </div>
                </div>
                
                {!images[member.id]?.image_url && adminMode && (
                  <div className="px-8 pb-8 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-purple-600 mb-2">
                      {WEALTH_IMAGES.find(img => img.id === member.id)?.prompt}
                    </p>
                    <button
                      onClick={() => copyPrompt(WEALTH_IMAGES.find(img => img.id === member.id)?.prompt || '', member.id)}
                      className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                    >
                      {copiedId === member.id ? 'Copied!' : 'Copy Prompt'}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="py-20 bg-gradient-to-br from-summit-blue to-summit-dark-blue text-white">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our <span className="text-summit-gold">Performance</span> & Impact
            </h2>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              Transparency matters. Here's how our strategies have performed across different market cycles, compared to relevant benchmarks.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-6 text-center">Annual Performance</h3>
              
              <div className="space-y-4">
                {performanceData.map((data, index) => (
                  <div key={index} className="border-b border-white/20 pb-4 last:border-b-0">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{data.year}</span>
                      <span className="font-bold text-summit-gold">{data.return}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-summit-gold rounded-full h-2" 
                        style={{ width: `${Math.min(100, (parseFloat(data.return) + 15))}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-300">{data.category}</span>
                      <span className="text-gray-300">Benchmark: {data.benchmark}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-gray-300 italic">
                  * Past performance is not indicative of future results. Returns are net of fees and reflect actual client portfolios. Benchmarks are representative indices.
                </p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-center mb-4">
                  <Star className="text-summit-gold mr-3" size={28} />
                  <h3 className="text-2xl font-bold">Client Success</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mt-6 text-center">
                  {[
                    { number: '98%', label: 'Client Retention Rate' },
                    { number: '$450M+', label: 'Assets Under Management' },
                    { number: '15+', label: 'Avg. Years Client Relationship' },
                    { number: '4.9/5', label: 'Client Satisfaction Score' }
                  ].map((stat, statIndex) => (
                    <div key={statIndex}>
                      <div className="text-3xl font-bold text-summit-gold mb-2">{stat.number}</div>
                      <div className="text-gray-300">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-summit-gold to-yellow-500 text-gray-900 rounded-2xl p-8">
                <div className="flex items-start mb-4">
                  <TrendingUp className="mr-3 mt-1" size={24} />
                  <h3 className="text-2xl font-bold">Why Our Approach Works</h3>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-gray-900 mt-1 mr-3 flex-shrink-0" size={20} />
                    <span>Institutional investment strategies with retail client focus</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-gray-900 mt-1 mr-3 flex-shrink-0" size={20} />
                    <span>Proactive tax optimization integrated into every strategy</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-gray-900 mt-1 mr-3 flex-shrink-0" size={20} />
                    <span>Multi-generational planning that builds lasting family wealth</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-gray-900 mt-1 mr-3 flex-shrink-0" size={20} />
                    <span>Transparent fee structure with no hidden costs or conflicts</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our <span className="text-summit-blue">Clients Say</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from successful professionals, business owners, and families who have achieved their financial goals through our partnership.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 p-8 rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-summit-blue to-summit-dark-blue rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-xl">{testimonial.name.split(' ')[0][0]}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.location}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 italic mb-4">"{testimonial.text}"</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{testimonial.assets}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="text-summit-gold" size={18} fill="currentColor" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 bg-gradient-to-br from-summit-dark-blue to-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
              <div className="inline-block bg-summit-gold/20 px-4 py-1 rounded-full mb-6">
                <span className="text-summit-gold font-medium">Schedule Your Complimentary Strategy Session</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Transform Your <span className="text-summit-gold">Financial Future?</span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Discover how our institutional-grade wealth management strategies can help you achieve financial confidence, build lasting wealth, and create the legacy you envision.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setConsultationModal(true)}
                  className="bg-summit-gold hover:bg-yellow-400 text-gray-900 font-bold px-8 py-4 rounded-full text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  Book Your Free Consultation <ArrowRight className="ml-2" size={20} />
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-medium px-8 py-4 rounded-full text-lg transition-colors">
                  View Our Client Success Stories
                </button>
              </div>
              
              <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10 inline-block">
                <div className="flex items-center justify-center space-x-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-summit-gold mb-1">90</div>
                    <div className="text-sm text-gray-400">Minute Strategy Session</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-summit-gold mb-1">No Cost</div>
                    <div className="text-sm text-gray-400">Initial Consultation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-summit-gold mb-1">100%</div>
                    <div className="text-sm text-gray-400">Confidential</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-summit-blue w-10 h-10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-xl">SP</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Summit Peak</h3>
                  <p className="text-summit-gold">Wealth Advisors</p>
                </div>
              </div>
              <p className="mb-6">
                Boston's premier wealth management firm serving high-net-worth individuals, business owners, and multi-generational families with institutional-grade strategies.
              </p>
              <div className="flex space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-summit-blue transition-colors">
                    <span className="text-white font-medium">{i}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Services</h4>
              <ul className="space-y-3">
                {services.map((service, index) => (
                  <li key={index}>
                    <a href="#" className="hover:text-summit-gold transition-colors flex items-start">
                      <CheckCircle className="text-summit-blue mr-2 mt-1" size={16} />
                      <span>{service.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <MapPin className="text-summit-blue mr-3 mt-1" size={20} />
                  <span>101 Federal Street, Suite 2200<br />Boston, MA 02110</span>
                </li>
                <li className="flex items-start">
                  <Phone className="text-summit-blue mr-3 mt-1" size={20} />
                  <span>(617) 555-0123</span>
                </li>
                <li className="flex items-start">
                  <Mail className="text-summit-blue mr-3 mt-1" size={20} />
                  <span>info@summitpeakwealth.com</span>
                </li>
                <li className="flex items-start">
                  <Calendar className="text-summit-blue mr-3 mt-1" size={20} />
                  <span>Mon-Fri: 8:30 AM - 5:30 PM<br />Sat: By Appointment</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Newsletter</h4>
              <p className="mb-4">
                Subscribe to our monthly insights on wealth management, market updates, and financial planning strategies.
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-blue"
                />
                <button className="w-full bg-summit-blue hover:bg-summit-dark-blue text-white font-medium px-4 py-2 rounded-lg transition-colors">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-500">
              &copy; {new Date().getFullYear()} Summit Peak Wealth Advisors. All rights reserved. | 
              <a href="#" className="hover:text-summit-gold mx-2">Privacy Policy</a> | 
              <a href="#" className="hover:text-summit-gold mx-2">Terms of Service</a> | 
              <a href="#" className="hover:text-summit-gold mx-2">Disclosures</a>
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Summit Peak Wealth Advisors is a registered investment advisor. Past performance is not indicative of future results. Investing involves risk.
            </p>
          </div>
        </div>
      </footer>

      {/* Consultation Modal */}
      {consultationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Free Strategy Session</h3>
                  <p className="text-gray-600">Let's discuss your financial goals and how we can help</p>
                </div>
                <button 
                  onClick={() => setConsultationModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {formSubmitted ? (
                <div className="text-center py-12">
                  <div className="bg-green-100 text-green-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h4>
                  <p className="text-gray-600 mb-6">
                    We've received your consultation request. Our team will contact you within 24 hours to schedule your free strategy session.
                  </p>
                  <button 
                    onClick={() => setConsultationModal(false)}
                    className="bg-summit-blue hover:bg-summit-dark-blue text-white font-medium px-6 py-3 rounded-full transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 mb-2 font-medium">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-blue focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-blue focus:border-transparent"
                        placeholder="john.smith@email.com"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-gray-700 mb-2 font-medium">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-blue focus:border-transparent"
                        placeholder="(617) 555-1234"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="assets" className="block text-gray-700 mb-2 font-medium">Approximate Investable Assets</label>
                    <select
                      id="assets"
                      name="assets"
                      value={formData.assets}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-blue focus:border-transparent"
                    >
                      <option value="">Select Range</option>
                      <option value="$500K - $1M">$500,000 - $1,000,000</option>
                      <option value="$1M - $5M">$1,000,000 - $5,000,000</option>
                      <option value="$5M - $10M">$5,000,000 - $10,000,000</option>
                      <option value="$10M+">$10,000,000+</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="goals" className="block text-gray-700 mb-2 font-medium">Primary Financial Goals</label>
                    <textarea
                      id="goals"
                      name="goals"
                      value={formData.goals}
                      onChange={handleInputChange}
                      rows={4}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-blue focus:border-transparent"
                      placeholder="e.g., Retirement planning, business succession, multi-generational wealth transfer, tax optimization..."
                    ></textarea>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">What to expect:</span> Our 90-minute complimentary strategy session includes a comprehensive review of your current financial situation, discussion of your goals, and preliminary recommendations. There's no obligation, and we'll help you determine if Summit Peak is the right fit for your needs.
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-summit-blue hover:bg-summit-dark-blue text-white font-bold px-6 py-4 rounded-full text-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    Schedule My Free Session
                  </button>
                  
                  <p className="text-center text-xs text-gray-500">
                    By submitting, you agree to our privacy policy and terms of service. We respect your privacy and will never share your information with third parties.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg z-50 animate-pulse">
          Admin Mode Active
        </div>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        :root {
          --summit-blue: #1a365d;
          --summit-dark-blue: #0c2440;
          --summit-gold: #fbbf24;
        }
        
        html, body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          scroll-behavior: smooth;
        }
        
        .text-summit-blue {
          color: var(--summit-blue);
        }
        
        .text-summit-dark-blue {
          color: var(--summit-dark-blue);
        }
        
        .text-summit-gold {
          color: var(--summit-gold);
        }
        
        .bg-summit-blue {
          background-color: var(--summit-blue);
        }
        
        .bg-summit-dark-blue {
          background-color: var(--summit-dark-blue);
        }
        
        .bg-summit-gold {
          background-color: var(--summit-gold);
        }
        
        .hover\\:bg-summit-dark-blue:hover {
          background-color: var(--summit-dark-blue);
        }
        
        .border-summit-blue {
          border-color: var(--summit-blue);
        }
        
        @media (max-width: 768px) {
          .pt-32 {
            padding-top: 24rem;
          }
        }
      `}</style>
    </div>
  );
}