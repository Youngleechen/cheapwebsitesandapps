// app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Instagram, Leaf, Scissors, Truck } from 'lucide-react';

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Pet-focused gallery content
const PET_GALLERY_ITEMS = [
  { 
    id: 'puppy-spa', 
    title: 'Puppy Spa Day',
    prompt: 'A fluffy golden retriever puppy after a professional grooming session, wearing a blue bandana, looking happy and refreshed in a bright, clean salon environment with soft natural lighting. Professional photography, high detail, warm atmosphere.'
  },
  { 
    id: 'cat-comfort', 
    title: 'Senior Cat Care',
    prompt: 'A gentle senior cat receiving a calming grooming session from a compassionate professional, soft focus background showing a serene pet spa environment with warm wood tones and plants. Emphasis on trust and comfort, natural window lighting.'
  },
  { 
    id: 'pet-wedding', 
    title: 'Special Occasion Styling',
    prompt: 'An elegant poodle with a delicate floral accessory around its neck, posed for a wedding event. Soft bokeh background showing a luxury venue, golden hour lighting, professional pet photography with shallow depth of field.'
  },
];

type GalleryItem = { [key: string]: { image_url: string | null } };

function PetGallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';

  // Check if user is admin (via auth OR dev override)
  useEffect(() => {
    const checkUser = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const forceAdmin = urlParams.get('admin') === '1';
      
      if (forceAdmin) {
        setUserId(ADMIN_USER_ID);
        setAdminMode(true);
        return;
      }

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
      const { data: images } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID);

      const initialState: GalleryItem = {};
      PET_GALLERY_ITEMS.forEach(item => initialState[item.id] = { image_url: null });

      if (images) {
        PET_GALLERY_ITEMS.forEach(item => {
          const match = images.find(img => img.path.includes(`/${item.id}/`));
          if (match) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(match.path).data.publicUrl;
            initialState[item.id] = { image_url: url };
          }
        });
      }

      setGalleryItems(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(itemId);
    setUploadError(null);

    try {
      const filePath = `${ADMIN_USER_ID}/${itemId}/${Date.now()}_${file.name}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      // Upsert: delete old path if exists, then insert new
      await supabase
        .from('images')
        .delete()
        .eq('user_id', ADMIN_USER_ID)
        .like('path', `%/${itemId}/%`);

      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setGalleryItems(prev => ({ ...prev, [itemId]: { image_url: publicUrl } }));
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, itemId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <section className="py-16 bg-gradient-to-b from-amber-50/30 to-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/floral-pattern.svg')] bg-repeat opacity-5" />
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Happy Tails Gallery
          </h2>
          <p className="text-lg text-gray-600">
            See the transformations and joyful moments we create for Seattle's beloved pets
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PET_GALLERY_ITEMS.map((item) => {
            const imageUrl = galleryItems[item.id]?.image_url;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * PET_GALLERY_ITEMS.indexOf(item) }}
                className="bg-white rounded-2xl overflow-hidden shadow-xl border border-amber-100 hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="h-64 overflow-hidden">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-rose-50 flex items-center justify-center">
                      <Leaf className="w-16 h-16 text-amber-300" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  
                  {/* Only show prompt in admin mode */}
                  {adminMode && (
                    <div className="mt-2 text-xs text-gray-600 bg-amber-50 p-2 rounded border border-amber-200">
                      <strong>Prompt:</strong> {item.prompt}
                    </div>
                  )}

                  {!imageUrl && !adminMode && (
                    <p className="text-gray-600 italic text-sm mt-2">
                      Image coming soon — check back next week!
                    </p>
                  )}
                </div>

                {adminMode && (
                  <div className="p-4 border-t border-amber-100 bg-amber-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <button
                        onClick={() => copyPrompt(item.prompt, item.id)}
                        className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-md transition-colors flex items-center"
                        type="button"
                      >
                        {copiedId === item.id ? (
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </span>
                        ) : (
                          'Copy Prompt'
                        )}
                      </button>
                      
                      <label className="block text-sm bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md cursor-pointer transition-colors text-center whitespace-nowrap">
                        {uploading === item.id ? 'Uploading…' : 'Upload Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, item.id)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {uploadError && (
                      <p className="text-red-600 text-xs mt-2">{uploadError}</p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {adminMode && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 p-4 bg-amber-100 border border-amber-300 rounded-xl text-center max-w-2xl mx-auto"
          >
            <p className="text-amber-800 font-medium">
              👤 Admin Mode: Upload client transformation photos using the buttons below.
              Prompts are shown for reference (e.g., for AI generation).
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', service: '', message: '' });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      setFormData({ name: '', email: '', service: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      setSubmitStatus('error');
    }
  };

  return (
    <div className="font-sans bg-white text-gray-800 overflow-x-hidden">
      {/* Navigation */}
      <header className="fixed w-full bg-white/90 backdrop-blur-md z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="bg-amber-100 p-2 rounded-full">
                <Leaf className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Bella's Blooms</h1>
                <p className="text-xs text-amber-700 font-medium">Seattle's Premier Pet Grooming Studio</p>
              </div>
            </motion.div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <nav className="hidden md:block">
              <ul className="flex space-x-8">
                {['Services', 'Gallery', 'About', 'Contact'].map((item) => (
                  <li key={item}>
                    <a 
                      href={`#${item.toLowerCase()}`} 
                      className="font-medium hover:text-rose-500 transition-colors py-2 relative group"
                    >
                      {item}
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t"
            >
              <div className="container mx-auto px-4 py-4">
                <ul className="space-y-4">
                  {['Services', 'Gallery', 'About', 'Contact'].map((item) => (
                    <li key={item}>
                      <a 
                        href={`#${item.toLowerCase()}`} 
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 font-medium text-lg hover:text-rose-500 transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pb-32 bg-gradient-to-br from-rose-50 to-amber-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pawprint-pattern.svg')] bg-repeat opacity-3" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="md:w-1/2 mb-12 md:mb-0"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Seattle's Most <span className="text-rose-500">Loved</span> Pet Grooming Experience
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Luxury grooming services that prioritize your pet's comfort and wellbeing in a stress-free environment
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="#contact" 
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transition-all transform hover:scale-105"
                >
                  Book Appointment
                </a>
                <a 
                  href="#gallery" 
                  className="bg-white border-2 border-rose-200 text-rose-700 font-medium py-4 px-8 rounded-xl text-lg hover:bg-rose-50 transition-colors"
                >
                  View Transformations
                </a>
              </div>
              <div className="mt-10 flex items-center space-x-6">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-300 to-amber-300 border-2 border-white"></div>
                  ))}
                </div>
                <div>
                  <p className="font-bold">1,200+ Happy Pets</p>
                  <p className="text-gray-500 text-sm">Served in Seattle area</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="md:w-1/2 flex justify-center"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-rose-200 to-amber-200 rounded-3xl blur-xl opacity-70 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-rose-50 to-amber-50 rounded-3xl p-4 shadow-2xl overflow-hidden">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                    <img 
                      src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80" 
                      alt="Happy golden retriever after grooming" 
                      className="w-full h-auto aspect-square object-cover"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Signature <span className="text-rose-500">Services</span>
            </h2>
            <p className="text-xl text-gray-600">
              Every service includes our signature comfort care protocol designed by veterinary behaviorists
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[{
              icon: Scissors,
              title: "Luxury Spa Bath",
              description: "Hypoallergenic shampoos, blueberry facials, and pawdicures in our serene hydrotherapy tubs",
              price: "$65+"
            }, {
              icon: Leaf,
              title: "Holistic Wellness",
              description: "Stress-free grooming with calming pheromones, gentle handling techniques, and anxiety-reducing environments",
              price: "$85+"
            }, {
              icon: Truck,
              title: "Mobile Grooming",
              description: "Our fully-equipped luxury van comes to your home for pets with mobility issues or severe anxiety",
              price: "$120+"
            }].map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="bg-gradient-to-br from-amber-50 to-rose-50/5 border border-amber-100 rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6">
                  <service.icon className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-rose-600">{service.price}</span>
                  <span className="text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-medium">Most Popular</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <a 
              href="#contact" 
              className="inline-flex items-center bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-xl text-lg shadow-md transition-all"
            >
              View Full Service Menu
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery">
        <PetGallery />
      </section>

      {/* Testimonials */}
      <section id="about" className="py-20 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Seattle Pet Parents <span className="text-rose-500">Trust Us</span>
            </h2>
            <p className="text-xl text-gray-600">
              Hear from our community of happy pet parents and their well-groomed companions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{
              name: "Sarah J.",
              location: "Capitol Hill",
              pet: "Luna (Golden Retriever)",
              quote: "Bella transformed Luna's anxiety around grooming. Now she actually wags her tail when we pull up! The hydrotherapy tub was a game-changer for her sensitive skin."
            }, {
              name: "Michael T.",
              location: "Ballard",
              pet: "Mittens (Senior Cat)",
              quote: "After trying 3 other groomers who couldn't handle Mittens' arthritis, Bella's gentle approach made all the difference. They took 2 hours just to make her comfortable before starting."
            }, {
              name: "Priya K.",
              location: "Queen Anne",
              pet: "Rocky (Rescue Pitbull)",
              quote: "The mobile grooming service saved us during Rocky's recovery from surgery. Bella handled his special needs with such care - they even brought calming music and his favorite treat!"
            }].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="bg-white p-8 rounded-2xl shadow-md border border-amber-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-rose-500">{testimonial.location}</p>
                  <p className="text-gray-500 text-sm">{testimonial.pet}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 flex flex-col md:flex-row items-center justify-center gap-8"
          >
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Meet Our Lead Groomer</h3>
              <p className="text-lg text-gray-600 mb-4">
                Bella Rodriguez, CPG (Certified Professional Groomer) with 12+ years experience specializing in anxious and special needs pets
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <a href="#" className="bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-6 rounded-lg transition-colors">About Our Studio</a>
                <a href="#" className="bg-white border border-rose-200 text-rose-700 font-medium py-2 px-6 rounded-lg hover:bg-rose-50 transition-colors">Our Certifications</a>
              </div>
            </div>
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" 
                alt="Bella Rodriguez, lead groomer" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Ready for a <span className="text-rose-500">Pampered Pooch</span>?
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  Book your appointment today and give your pet the luxury experience they deserve
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-rose-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Visit Our Studio</p>
                    <p className="text-gray-600">1234 Petal Lane, Seattle, WA 98101</p>
                    <a href="#" className="text-rose-500 hover:underline mt-1 block">Get Directions</a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-rose-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Call Us</p>
                    <p className="text-gray-600">(206) 555-7890</p>
                    <p className="text-sm text-gray-500 mt-1">Mon-Fri: 8am-6pm • Sat: 9am-4pm</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-rose-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Email Us</p>
                    <p className="text-gray-600">hello@bellaspaws.com</p>
                    <a href="#" className="text-rose-500 hover:underline mt-1 block">Send a Message</a>
                  </div>
                </div>

                <div className="pt-4 border-t border-amber-200">
                  <p className="font-medium mb-2">Follow Our Happy Clients</p>
                  <div className="flex space-x-4">
                    <a 
                      href="#" 
                      className="w-10 h-10 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl p-8 border border-amber-100"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Book Your Appointment</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                    placeholder="Sarah Johnson"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                    placeholder="sarah@example.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">Service Interested In</label>
                  <select
                    id="service"
                    value={formData.service}
                    onChange={(e) => setFormData({...formData, service: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition bg-white"
                  >
                    <option value="">Select a service</option>
                    <option value="spa">Luxury Spa Bath</option>
                    <option value="holistic">Holistic Wellness</option>
                    <option value="mobile">Mobile Grooming</option>
                    <option value="other">Other Services</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                  <textarea
                    id="message"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                    placeholder="Pet's name, breed, special needs, etc."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitStatus === 'submitting'}
                  className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl text-lg shadow-md transition-all transform ${
                    submitStatus === 'submitting' ? 'opacity-75 cursor-not-allowed' : 'hover:scale-[1.02]'
                  }`}
                >
                  {submitStatus === 'submitting' ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Booking Appointment...
                    </span>
                  ) : submitStatus === 'success' ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Booking Confirmed!
                    </span>
                  ) : (
                    "Request Appointment"
                  )}
                </button>

                {submitStatus === 'error' && (
                  <p className="text-red-500 text-center text-sm mt-2">
                    Something went wrong. Please try again or call us directly.
                  </p>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Leaf className="w-6 h-6 text-rose-500" />
                </div>
                <span className="text-xl font-bold">Bella's Blooms</span>
              </div>
              <p className="text-gray-400 mb-4">
                Seattle's most trusted pet grooming studio, providing stress-free luxury care since 2015.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-800 hover:bg-rose-500 rounded-full flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {['Services', 'Gallery', 'About', 'Contact', 'Blog', 'FAQ'].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} className="text-gray-400 hover:text-white transition-colors block py-1">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Services</h3>
              <ul className="space-y-2">
                {['Luxury Spa Bath', 'Holistic Wellness', 'Mobile Grooming', 'Puppy Packages', 'Senior Care', 'Special Needs'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors block py-1">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <MapPin className="w-5 h-5 text-amber-400 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-400">1234 Petal Lane<br/>Seattle, WA 98101</span>
                </li>
                <li className="flex items-center">
                  <Phone className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-400">(206) 555-7890</span>
                </li>
                <li className="flex items-center">
                  <Mail className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-400">hello@bellaspaws.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Bella's Blooms Pet Studio. All rights reserved. Licensed & Insured.</p>
            <p className="mt-2">Certified by National Dog Groomers Association of America • Member of Seattle Pet Business Alliance</p>
          </div>
        </div>
      </footer>
    </div>
  );
}