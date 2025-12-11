'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Heart, Phone, MapPin, Calendar, CheckCircle, Star, ChevronRight, Users, Shield, PawPrint } from 'lucide-react';
import Image from 'next/image';

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';

// Gallery items for rescue dogs
const RESCUE_DOGS = [
  { 
    id: 'buddy-golden', 
    title: 'Buddy',
    breed: 'Golden Retriever Mix',
    age: '3 years',
    prompt: 'A friendly golden retriever mix with soulful brown eyes sitting in a sunlit Colorado field, looking hopeful and gentle. Background should be slightly blurred with mountains in distance. Focus on the dog\'s warm, inviting expression.'
  },
  { 
    id: 'luna-shepherd', 
    title: 'Luna',
    breed: 'German Shepherd',
    age: '2 years',
    prompt: 'A majestic German Shepherd standing proudly in a Colorado pine forest, intelligent eyes looking at camera. Should convey strength, loyalty, and gentle nature. Professional rescue photography style.'
  },
  { 
    id: 'rocky-terrier', 
    title: 'Rocky',
    breed: 'Terrier Mix',
    age: '4 years',
    prompt: 'A playful terrier mix with scruffy fur and perky ears, mid-action catching a ball in a dog park. Show energy and joy. Bright, clean background with green grass.'
  },
  { 
    id: 'bella-lab', 
    title: 'Bella',
    breed: 'Labrador Retriever',
    age: '1.5 years',
    prompt: 'A beautiful black lab puppy with shiny coat, looking up with curious, loving eyes. Sitting on a cozy blanket near a fireplace. Warm, inviting lighting.'
  },
  { 
    id: 'max-husky', 
    title: 'Max',
    breed: 'Siberian Husky',
    age: '5 years',
    prompt: 'A striking blue-eyed husky in snow, looking majestic and loyal. Winter Colorado mountain scene. Should convey both beauty and resilience.'
  },
  { 
    id: 'daisy-beagle', 
    title: 'Daisy',
    breed: 'Beagle',
    age: '2 years',
    prompt: 'A sweet beagle with floppy ears, sniffing flowers in a garden. Show gentle, curious nature. Springtime Denver garden setting.'
  },
];

type DogState = { [key: string]: { image_url: string | null } };

export default function CascadeCanineRescue() {
  const [dogs, setDogs] = useState<DogState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('adopt');

  // Adoption application state
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dogInterest: '',
    experience: '',
    homeType: ''
  });

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
      const { data: images } = await supabase
        .from('images')
        .select('path')
        .eq('user_id', ADMIN_USER_ID);

      const initialState: DogState = {};
      RESCUE_DOGS.forEach(dog => initialState[dog.id] = { image_url: null });

      if (images) {
        RESCUE_DOGS.forEach(dog => {
          const match = images.find(img => img.path.includes(`/${dog.id}/`));
          if (match) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(match.path).data.publicUrl;
            initialState[dog.id] = { image_url: url };
          }
        });
      }

      setDogs(initialState);
    };

    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, dogId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(dogId);
    try {
      const filePath = `${ADMIN_USER_ID}/${dogId}/${Date.now()}_${file.name}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase
        .from('images')
        .insert({ user_id: ADMIN_USER_ID, path: filePath });
      if (dbErr) throw dbErr;

      const publicUrl = supabase.storage.from('user_images').getPublicUrl(filePath).data.publicUrl;
      setDogs(prev => ({ ...prev, [dogId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const copyPrompt = (prompt: string, dogId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(dogId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to your backend
    alert('Thank you for your application! We\'ll contact you within 24 hours.');
    setApplicationOpen(false);
    setFormData({ name: '', email: '', phone: '', dogInterest: '', experience: '', homeType: '' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Banner */}
      {adminMode && (
        <div className="bg-purple-900 text-white p-2 text-center text-sm">
          👤 Admin Mode Active — You can upload dog photos and copy image prompts
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-amber-500 p-2 rounded-full">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cascade Canine Rescue</h1>
                <p className="text-sm text-gray-600">Denver, Colorado</p>
              </div>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <a href="#dogs" className="text-gray-700 hover:text-amber-600 font-medium">Meet Our Dogs</a>
              <a href="#process" className="text-gray-700 hover:text-amber-600 font-medium">Adoption Process</a>
              <a href="#about" className="text-gray-700 hover:text-amber-600 font-medium">Our Mission</a>
              <a href="#donate" className="text-gray-700 hover:text-amber-600 font-medium">Donate</a>
            </div>
            
            <button 
              onClick={() => setApplicationOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Apply to Adopt
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-amber-50 to-amber-100 overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold">501(c)(3) Nonprofit Organization</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Giving <span className="text-amber-500">Colorado Dogs</span> Their Forever Homes
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 max-w-2xl">
              Since 2015, we've rescued and rehomed over 2,500 dogs in the Denver area. 
              Each dog receives medical care, training, and endless love before finding their perfect family.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setApplicationOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
              >
                Meet Our Dogs <ChevronRight className="ml-2 w-5 h-5" />
              </button>
              <a 
                href="#donate"
                className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-amber-500 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Support Our Mission
              </a>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-amber-200 rounded-full opacity-20"></div>
        <div className="absolute bottom-10 right-1/3 w-32 h-32 bg-amber-300 rounded-full opacity-30"></div>
      </section>

      {/* Stats Bar */}
      <div className="bg-amber-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">2,500+</div>
              <div className="text-amber-100">Dogs Rescued</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-amber-100">Adoption Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-amber-100">Emergency Rescue</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">150+</div>
              <div className="text-amber-100">Active Volunteers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <section id="dogs" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Rescue Dogs</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Each of these wonderful dogs is waiting for their forever home. 
              All are spayed/neutered, vaccinated, and ready for adoption.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-full bg-white p-1 shadow-md">
              <button
                onClick={() => setActiveTab('adopt')}
                className={`px-8 py-3 rounded-full font-medium transition-all ${activeTab === 'adopt' ? 'bg-amber-500 text-white' : 'text-gray-700'}`}
              >
                Available for Adoption
              </button>
              <button
                onClick={() => setActiveTab('foster')}
                className={`px-8 py-3 rounded-full font-medium transition-all ${activeTab === 'foster' ? 'bg-amber-500 text-white' : 'text-gray-700'}`}
              >
                Need Foster Homes
              </button>
            </div>
          </div>

          {/* Dogs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {RESCUE_DOGS.map((dog) => {
              const imageUrl = dogs[dog.id]?.image_url;

              return (
                <div key={dog.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  {/* Dog Image */}
                  <div className="relative h-80 bg-gray-100">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={dog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
                        <PawPrint className="w-16 h-16 text-amber-300 mb-4" />
                        <span className="text-gray-400">Awaiting photo</span>
                        
                        {/* Admin Upload Section */}
                        {adminMode && (
                          <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg">
                            <p className="text-xs text-purple-700 mb-2">Image prompt for AI generation:</p>
                            <div className="flex items-start gap-2">
                              <p className="text-xs text-gray-600 flex-1">{dog.prompt}</p>
                              <button
                                onClick={() => copyPrompt(dog.prompt, dog.id)}
                                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg transition-colors"
                                type="button"
                              >
                                {copiedId === dog.id ? '✓ Copied' : 'Copy Prompt'}
                              </button>
                            </div>
                            <label className="block mt-3 text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors text-center">
                              {uploading === dog.id ? 'Uploading…' : 'Upload Photo'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUpload(e, dog.id)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Available Badge */}
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Available
                    </div>
                  </div>
                  
                  {/* Dog Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{dog.title}</h3>
                        <p className="text-gray-600">{dog.breed} • {dog.age} old</p>
                      </div>
                      <Heart className="w-6 h-6 text-amber-400 cursor-pointer hover:text-amber-500" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-700">Spayed/Neutered</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-700">Vaccinated</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-700">House Trained</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-700">Good with Kids</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setFormData(prev => ({...prev, dogInterest: dog.title}));
                        setApplicationOpen(true);
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      Apply to Adopt {dog.title}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View More */}
          <div className="text-center mt-12">
            <button className="inline-flex items-center text-amber-600 hover:text-amber-700 font-semibold text-lg">
              View All Available Dogs <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Adoption Process */}
      <section id="process" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Adoption Process</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We ensure every dog finds the perfect home through our thorough, caring process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Apply Online', desc: 'Complete our adoption application' },
              { step: '02', title: 'Meet & Greet', desc: 'Schedule a meeting with your chosen dog' },
              { step: '03', title: 'Home Visit', desc: 'We ensure your home is ready for a new member' },
              { step: '04', title: 'Finalize Adoption', desc: 'Sign paperwork and bring your new family member home' },
            ].map((item, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-amber-600">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-500 to-amber-600">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <Users className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-6">Ready to Welcome a New Family Member?</h2>
            <p className="text-xl mb-8 opacity-90">
              Every adoption saves two lives: the dog you bring home, and the one who can now take their place in our rescue.
            </p>
            <button 
              onClick={() => setApplicationOpen(true)}
              className="bg-white text-amber-600 hover:bg-gray-100 px-10 py-4 rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300"
            >
              Start Your Adoption Journey Today
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-amber-500 p-2 rounded-full">
                  <PawPrint className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xl font-bold">Cascade Canine Rescue</div>
                  <div className="text-sm text-gray-400">501(c)(3) Nonprofit</div>
                </div>
              </div>
              <p className="text-gray-400">
                Rescuing, rehabilitating, and rehoming dogs in Colorado since 2015.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#dogs" className="text-gray-400 hover:text-white transition-colors">Available Dogs</a></li>
                <li><a href="#process" className="text-gray-400 hover:text-white transition-colors">Adoption Process</a></li>
                <li><a href="#donate" className="text-gray-400 hover:text-white transition-colors">Donate</a></li>
                <li><a href="#volunteer" className="text-gray-400 hover:text-white transition-colors">Volunteer</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3 text-gray-400">
                  <Phone className="w-5 h-5" />
                  <span>(720) 555-1234</span>
                </li>
                <li className="flex items-center space-x-3 text-gray-400">
                  <MapPin className="w-5 h-5" />
                  <span>Denver, CO 80202</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Business Hours</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Monday - Friday: 9AM - 6PM</li>
                <li>Saturday: 10AM - 4PM</li>
                <li>Sunday: Emergency Only</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Cascade Canine Rescue. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Application Modal */}
      {applicationOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900">Adoption Application</h3>
                <button 
                  onClick={() => setApplicationOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="(720) 555-1234"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Which dog are you interested in?</label>
                  <select
                    value={formData.dogInterest}
                    onChange={(e) => setFormData({...formData, dogInterest: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select a dog</option>
                    {RESCUE_DOGS.map(dog => (
                      <option key={dog.id} value={dog.title}>{dog.title} - {dog.breed}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tell us about your previous experience with dogs
                  </label>
                  <textarea
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Have you owned dogs before? What breeds? Any training experience?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type of Home</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['House with Yard', 'Apartment/Condo', 'Other'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, homeType: type})}
                        className={`px-4 py-3 border rounded-lg text-center transition-all ${
                          formData.homeType === type 
                            ? 'border-amber-500 bg-amber-50 text-amber-700' 
                            : 'border-gray-300 hover:border-amber-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-6 border-t">
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
                  >
                    Submit Application
                  </button>
                  <p className="text-center text-gray-500 text-sm mt-4">
                    We'll contact you within 24 hours to schedule a meet & greet
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}