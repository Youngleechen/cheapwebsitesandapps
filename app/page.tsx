// app/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Fallback for icons on old devices
const ArrowRightIcon = () => <span>→</span>;
const UploadIcon = () => <span>🖼️</span>;
const ShieldIcon = () => <span>🛡️</span>;
const SparklesIcon = () => <span>✨</span>;
const MailIcon = () => <span>✉️</span>;
const MessageCircleIcon = () => <span>💬</span>;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const WEBSITES_PREVIEW_PREFIX = 'websites_preview';

type WebsiteItem = {
  id: string;
  title: string;
  prompt: string;
  categoryKey: string;
  categoryName: string;
};

export default function HomePage() {
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [previewImages, setPreviewImages] = useState<Record<string, string | null>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple scroll effect fallback
  const [scrollPosition, setScrollPosition] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch websites from API
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const res = await fetch('/api/websites');
        if (!res.ok) throw new Error('Failed to fetch websites');
        const data: WebsiteItem[] = await res.json();
        setWebsites(data);
      } catch (err) {
        console.error('Failed to load websites:', err);
        setWebsites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWebsites();
  }, []);

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

  // Load preview images
  useEffect(() => {
    if (websites.length === 0) return;

    const loadPreviews = async () => {
      const initialState: Record<string, string | null> = {};
      websites.forEach((site) => {
        initialState[site.id] = null;
      });

      const paths = websites.map((site) => `${ADMIN_USER_ID}/${WEBSITES_PREVIEW_PREFIX}/${site.id}/`);
      const { data: images, error } = await supabase
        .from('images')
        .select('path, created_at')
        .eq('user_id', ADMIN_USER_ID)
        .or(paths.map(p => `path.like."${p}%"`).join(','))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading preview images:', error);
        setPreviewImages(initialState);
        return;
      }

      const latestImagePerSite: Record<string, string> = {};
      for (const img of images) {
        const parts = img.path.split('/');
        if (parts.length >= 5 && parts[1] === WEBSITES_PREVIEW_PREFIX) {
          const siteId = `${parts[2]}/${parts[3]}`;
          if (!latestImagePerSite[siteId]) {
            latestImagePerSite[siteId] = img.path;
          }
        }
      }

      const updatedState: Record<string, string | null> = { ...initialState };
      websites.forEach((site) => {
        if (latestImagePerSite[site.id]) {
          const url = supabase.storage
            .from('user_images')
            .getPublicUrl(latestImagePerSite[site.id]).data.publicUrl;
          updatedState[site.id] = url;
        }
      });
      setPreviewImages(updatedState);
    };

    loadPreviews();
  }, [websites]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, siteId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(siteId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${WEBSITES_PREVIEW_PREFIX}/${siteId}/`;

      // Clean up old images
      const { data: oldImages } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `${folderPath}%`);

      if (oldImages && oldImages.length > 0) {
        const oldPaths = oldImages.map(img => img.path);
        await Promise.all([
          supabase.storage.from('user_images').remove(oldPaths),
          supabase.from('images').delete().in('path', oldPaths)
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
      setPreviewImages(prev => ({ ...prev, [siteId]: publicUrl }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  };

  // Select featured sites
  const featuredSites = useMemo(() => {
    if (websites.length === 0) return [];
    const shuffled = [...websites].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 9);
  }, [websites]);

  // Simple loading state
  if (loading && websites.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8f9fa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          textAlign: 'center' as const,
          padding: '40px 0'
        }}>
          <div style={{ 
            height: '48px', 
            width: '192px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '9999px',
            margin: '0 auto 16px'
          }} />
          <div style={{ 
            height: '24px', 
            width: '384px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '4px',
            margin: '0 auto'
          }} />
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            marginTop: '48px'
          }}>
            {[...Array(9)].map((_, i) => (
              <div key={i} style={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                overflow: 'hidden'
              }}>
                <div style={{ height: '256px', backgroundColor: '#f8f9fa' }} />
                <div style={{ padding: '24px' }}>
                  <div style={{ height: '16px', backgroundColor: '#e9ecef', width: '33%', marginBottom: '8px' }} />
                  <div style={{ height: '24px', backgroundColor: '#e9ecef', width: '66%', marginBottom: '12px' }} />
                  <div style={{ height: '16px', backgroundColor: '#e9ecef', width: '100%', marginBottom: '16px' }} />
                  <div style={{ height: '16px', backgroundColor: '#e9ecef', width: '25%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      color: '#212529'
    }}>
      {/* Hero Section - Simplified for old devices */}
      <div style={{ 
        backgroundColor: '#4f46e5',
        backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center' as const
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-block',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            borderRadius: '9999px',
            padding: '8px 16px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <SparklesIcon /> 
            <span style={{ marginLeft: '8px', fontSize: '14px' }}>Premium Web Solutions for Visionary Businesses</span>
          </div>
          
          <h1 style={{ 
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '24px',
            lineHeight: 1.2
          }}>
            Digital Excellence, <span style={{ color: '#fbbf24' }}>Engineered</span>
          </h1>
          
          <p style={{ 
            fontSize: '1.25rem',
            marginBottom: '32px',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            We craft high-performance websites that transform digital presence into measurable business growth
          </p>
          
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <Link 
              href="/websites"
              style={{ 
                display: 'block',
                width: '100%',
                backgroundColor: 'white',
                color: '#4f46e5',
                padding: '16px 32px',
                borderRadius: '12px',
                fontWeight: 'bold',
                textDecoration: 'none',
                textAlign: 'center' as const,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              Explore Portfolio
            </Link>
            
            <Link 
              href="/get-started"
              style={{ 
                display: 'block',
                width: '100%',
                backgroundColor: '#fbbf24',
                color: '#1e293b',
                padding: '16px 32px',
                borderRadius: '12px',
                fontWeight: 'bold',
                textDecoration: 'none',
                textAlign: 'center' as const,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              Let Us Create Your Website
            </Link>
          </div>
          
          <div style={{ marginTop: '24px' }}>
            <Link 
              href="/contact"
              style={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MailIcon />
              <span style={{ marginLeft: '8px' }}>Just have a question? Contact us</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '60px 20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
            borderRadius: '9999px',
            padding: '8px 24px',
            marginBottom: '16px'
          }}>
            <ShieldIcon />
            <span style={{ marginLeft: '8px', fontWeight: '500' }}>Our Portfolio</span>
          </div>
          
          <h2 style={{ 
            fontSize: '2.25rem',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            Transforming Digital Experiences
          </h2>
          
          <p style={{ 
            fontSize: '1.125rem',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Each website we create is a strategic asset engineered to achieve specific business objectives
          </p>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '32px'
        }}>
          {featuredSites.map((site) => {
            const imageUrl = previewImages[site.id] || '/placeholder-site.jpg';
            const loading = uploadingId === site.id;

            return (
              <div key={site.id} style={{ 
                backgroundColor: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0',
                position: 'relative'
              }}>
                <div style={{ height: '256px', position: 'relative' }}>
                  <Image
                    src={imageUrl}
                    alt={`${site.title} website preview`}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority={false}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y4ZjlmYSIvPjwvc3ZnPg=="
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/placeholder-site.jpg';
                    }}
                  />
                  
                  {/* Category badge */}
                  <div style={{ 
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    backgroundColor: '#4f46e5',
                    backgroundImage: 'linear-gradient(to right, #4f46e5, #7c3aed)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    zIndex: 10
                  }}>
                    {site.categoryName}
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  <h3 style={{ 
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#1e293b'
                  }}>
                    {site.title}
                  </h3>
                  
                  <p style={{ 
                    color: '#475569',
                    marginBottom: '20px',
                    minHeight: '60px'
                  }}>
                    {site.prompt}
                  </p>
                  
                  <div style={{ 
                    paddingTop: '16px',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <Link
                      href={`/websites/${site.id}`}
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: '#4f46e5',
                        fontWeight: '500',
                        textDecoration: 'none'
                      }}
                    >
                      <span>View Case Study</span>
                      <span style={{ marginLeft: '6px' }}>→</span>
                    </Link>
                  </div>
                </div>

                {adminMode && (
                  <div style={{ 
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    backgroundColor: '#f0f9ff',
                    padding: '12px',
                    borderTop: '1px solid #bae6fd'
                  }}>
                    <label style={{ 
                      display: 'block',
                      textAlign: 'center' as const,
                      cursor: 'pointer',
                      color: '#1e40af',
                      fontWeight: '500'
                    }}>
                      {loading ? (
                        <span>Uploading...</span>
                      ) : (
                        <>
                          <UploadIcon />
                          <span style={{ marginLeft: '6px' }}>Update Preview</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, site.id)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '48px'
        }}>
          <Link
            href="/websites"
            style={{ 
              display: 'inline-block',
              backgroundColor: '#4f46e5',
              backgroundImage: 'linear-gradient(to right, #4f46e5, #7c3aed)',
              color: 'white',
              padding: '14px 32px',
              borderRadius: '12px',
              fontWeight: 'bold',
              textDecoration: 'none',
              boxShadow: '0 4px 6px rgba(79, 70, 229, 0.3)'
            }}
          >
            Explore All {websites.length} Projects
          </Link>
        </div>
      </div>

      {/* Value Proposition Section */}
      <div style={{ 
        backgroundColor: '#f1f5f9',
        padding: '60px 20px',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f9ff',
              color: '#7e3af2',
              borderRadius: '9999px',
              padding: '8px 24px',
              marginBottom: '16px'
            }}>
              ⚡
              <span style={{ marginLeft: '8px', fontWeight: '500' }}>Our Process</span>
            </div>
            
            <h2 style={{ 
              fontSize: '2.25rem',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              The WhyNoWebsite Methodology
            </h2>
            
            <p style={{ 
              fontSize: '1.125rem',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              We blend strategic thinking with technical excellence to deliver websites that drive measurable business results
            </p>
          </div>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>
            {[{
              icon: '🎯',
              title: "Strategic Discovery",
              desc: "Deep business analysis to understand your unique challenges and align digital strategy with core objectives."
            },
            {
              icon: '🚀',
              title: "Precision Execution",
              desc: "Meticulous design and development focusing on performance, user experience, and conversion optimization."
            },
            {
              icon: '📈',
              title: "Growth Partnership",
              desc: "Ongoing optimization and strategic guidance to ensure your digital presence evolves with your business."
            }].map((item, i) => (
              <div key={i} style={{ 
                backgroundColor: 'white',
                padding: '32px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  fontSize: '2rem',
                  marginBottom: '16px'
                }}>
                  {item.icon}
                </div>
                <h3 style={{ 
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  color: '#1e293b'
                }}>
                  {item.title}
                </h3>
                <p style={{ color: '#475569' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            maxWidth: '800px',
            margin: '0 auto 48px'
          }}>
            {[{
              title: "95%+ Client Satisfaction",
              desc: "Our commitment to quality and communication ensures exceptional results."
            },
            {
              title: "48-Hour Response Guarantee",
              desc: "We prioritize your project and maintain clear communication throughout."
            },
            {
              title: "Performance-First Approach",
              desc: "Every site is optimized for speed, SEO, and conversion from day one."
            },
            {
              title: "Strategic Growth Focus",
              desc: "We build websites that scale with your business and drive real ROI."
            }].map((benefit, i) => (
              <div key={i} style={{ 
                display: 'flex',
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: i % 2 === 0 ? '#f0f9ff' : '#fdf4ff',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ 
                  fontSize: '1.5rem',
                  marginRight: '12px',
                  color: '#1e40af'
                }}>
                  ✓
                </div>
                <div>
                  <h4 style={{ 
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    color: '#0f172a'
                  }}>
                    {benefit.title}
                  </h4>
                  <p style={{ color: '#334155' }}>{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            maxWidth: '600px', 
            margin: '0 auto'
          }}>
            <Link
              href="/get-started"
              style={{ 
                display: 'inline-block',
                backgroundColor: '#fbbf24',
                color: '#1e293b',
                padding: '16px 48px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '1.125rem',
                textDecoration: 'none',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                margin: '10px'
              }}
            >
              Let Us Create Your Website
            </Link>
            <p style={{ 
              marginTop: '16px',
              color: '#475569'
            }}>
              Ready to transform your digital presence? Get started today and we'll create a website that drives real business results.
            </p>
            
            <div style={{ marginTop: '24px' }}>
              <Link
                href="/contact"
                style={{ 
                  color: '#4f46e5',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MessageCircleIcon />
                <span style={{ marginLeft: '8px' }}>Have questions first? Get in touch</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        backgroundColor: '#4f46e5',
        backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center' as const
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ 
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            fontWeight: '500',
            marginBottom: '16px',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            Ready to transform your digital presence?
          </div>
          
          <h2 style={{ 
            fontSize: '2.25rem',
            fontWeight: 'bold',
            marginBottom: '16px',
            lineHeight: 1.2
          }}>
            Your <span style={{ color: '#fbbf24' }}>Website Awaits</span>
          </h2>
          
          <p style={{ 
            fontSize: '1.125rem',
            opacity: 0.9,
            marginBottom: '32px'
          }}>
            Fill out our simple form and we'll create a custom website proposal tailored to your business goals
          </p>
          
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <Link 
              href="/get-started"
              style={{ 
                display: 'block',
                width: '100%',
                backgroundColor: '#fbbf24',
                color: '#1e293b',
                padding: '16px 32px',
                borderRadius: '12px',
                fontWeight: 'bold',
                textDecoration: 'none',
                fontSize: '1.125rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
              }}
            >
              Get Started Now
            </Link>
            
            <Link 
              href="/contact"
              style={{ 
                display: 'block',
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                color: 'white',
                padding: '14px 32px',
                borderRadius: '12px',
                fontWeight: '500',
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <MailIcon />
              <span style={{ marginLeft: '8px' }}>Contact Us</span>
            </Link>
          </div>
          
          <p style={{ 
            marginTop: '24px',
            opacity: 0.8,
            fontSize: '0.95rem'
          }}>
            Not ready to start a project? We're happy to answer your questions and provide guidance.
          </p>
        </div>
      </div>

      {/* Admin mode indicator */}
      {adminMode && (
        <div style={{ 
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#4f46e5',
          backgroundImage: 'linear-gradient(to right, #4f46e5, #7c3aed)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ShieldIcon />
          <span>Admin Mode Active</span>
        </div>
      )}
    </div>
  );
}