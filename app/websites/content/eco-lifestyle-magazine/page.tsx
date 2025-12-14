'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  Calendar, 
  User, 
  Bookmark, 
  Share2, 
  Heart,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  ArrowRight,
  PlayCircle
} from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin user ID for image uploads
const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GALLERY_PREFIX = 'magazine'; // Dedicated identifier for magazine images

// Magazine articles data with image placeholders
const FEATURED_ARTICLE = {
  id: 'featured-urban-farming',
  title: 'Urban Farming Revolution: How City Dwellers Are Growing 40% of Their Food',
  excerpt: 'From rooftop gardens to vertical farms, discover how urban agriculture is transforming cities and reducing food miles by up to 90%.',
  category: 'Sustainable Living',
  readTime: '8 min read',
  author: 'Dr. Maya Rodriguez',
  date: 'March 15, 2024',
  prompt: 'A vibrant urban rooftop garden at golden hour with diverse vegetables, herbs, and flowers growing in wooden planters. Include a diverse group of people tending to the garden with modern city skyscrapers in the background. Warm, hopeful lighting with rich greens and golden sunlight.'
};

const ARTICLES = [
  {
    id: 'zero-waste-home',
    title: 'The Zero-Waste Home: 30 Days to 90% Less Trash',
    excerpt: 'A practical guide to eliminating household waste without sacrificing convenience or style.',
    category: 'Minimalism',
    readTime: '6 min read',
    author: 'Sarah Chen',
    date: 'March 12, 2024',
    prompt: 'A beautifully organized minimalist kitchen with glass jars, cloth produce bags, and stainless steel containers. Natural morning light, wooden countertops, and lush indoor plants. Clean, organized aesthetic with warm tones.'
  },
  {
    id: 'sustainable-fashion',
    title: 'Slow Fashion Movement: Building a Conscious Wardrobe That Lasts',
    excerpt: 'Beyond trends: How to curate a sustainable closet that reflects your values and stands the test of time.',
    category: 'Fashion',
    readTime: '10 min read',
    author: 'James Wilson',
    date: 'March 10, 2024',
    prompt: 'A well-organized sustainable wardrobe with natural fiber clothing in neutral tones. Include clothing racks with linen, cotton, and hemp garments, a repair kit, and quality accessories. Soft, diffused lighting with earthy color palette.'
  },
  {
    id: 'circular-economy',
    title: 'Circular Economy: How Businesses Are Turning Waste into Wealth',
    excerpt: 'Innovative companies proving that sustainability and profitability can go hand-in-hand.',
    category: 'Business',
    readTime: '12 min read',
    author: 'Michael Torres',
    date: 'March 8, 2024',
    prompt: 'Modern circular economy workspace showing product repair, material sorting, and upcycling processes. Diverse team collaborating with recycled materials, digital screens showing circular diagrams. Bright, clean industrial aesthetic.'
  },
  {
    id: 'plant-based-future',
    title: 'The Plant-Based Future: How Alternative Proteins Are Changing Our Food System',
    excerpt: 'From lab-grown meat to fermented proteins, explore the innovations reducing our environmental footprint.',
    category: 'Food',
    readTime: '9 min read',
    author: 'Dr. Elena Petrov',
    date: 'March 5, 2024',
    prompt: 'Stylish flat lay of diverse plant-based foods including colorful vegetables, legumes, meat alternatives, and fermented products. Rustic wooden background with recipe books and kitchen tools. Appetizing, vibrant food photography.'
  },
  {
    id: 'green-energy-homes',
    title: 'Powering Your Home with 100% Renewable Energy: A Practical Guide',
    excerpt: 'Solar, wind, and geothermal options for homeowners looking to reduce their carbon footprint.',
    category: 'Technology',
    readTime: '11 min read',
    author: 'Robert Kim',
    date: 'March 3, 2024',
    prompt: 'Modern sustainable home with solar panels, green roof, and rainwater harvesting system. Family enjoying their eco-friendly backyard with electric vehicle charging. Sunny day with clear blue skies and lush landscaping.'
  },
  {
    id: 'ocean-conservation',
    title: 'Guardians of the Sea: Community-Led Initiatives Saving Our Oceans',
    excerpt: 'How local communities worldwide are implementing effective marine conservation strategies.',
    category: 'Conservation',
    readTime: '7 min read',
    author: 'Isabella Martinez',
    date: 'March 1, 2024',
    prompt: 'Coastal conservation scene with diverse volunteers cleaning beaches, monitoring wildlife, and planting mangroves. Crystal clear ocean water with marine life visible. Golden hour lighting with hopeful, inspiring atmosphere.'
  }
];

const CATEGORIES = [
  { name: 'Sustainable Living', count: 42 },
  { name: 'Conscious Fashion', count: 28 },
  { name: 'Green Tech', count: 35 },
  { name: 'Eco Travel', count: 19 },
  { name: 'Zero Waste', count: 31 },
  { name: 'Climate Action', count: 27 },
  { name: 'Organic Food', count: 38 },
  { name: 'Biodiversity', count: 23 }
];

const POPULAR_TAGS = [
  'Circular Economy', 'Carbon Neutral', 'Upcycling', 'Farm to Table', 
  'Slow Living', 'Renewable Energy', 'Ethical Brands', 'Mindful Consumption',
  'Urban Gardening', 'Plastic Free', 'Sustainable Travel', 'Green Buildings'
];

type ArticleState = { [key: string]: { image_url: string | null } };

export default function EcoLifestyleMagazine() {
  const [articles, setArticles] = useState<ArticleState>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [likedArticles, setLikedArticles] = useState<string[]>([]);

  // Check admin status and load images
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id || null;
      setUserId(uid);
      setAdminMode(uid === ADMIN_USER_ID);
    };
    checkUser();
  }, []);

  // Load images for all articles
  useEffect(() => {
    const loadImages = async () => {
      // Fetch magazine images for admin
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

      // Initialize state for all articles
      const initialState: ArticleState = {};
      [FEATURED_ARTICLE, ...ARTICLES].forEach(art => {
        initialState[art.id] = { image_url: null };
      });

      if (images) {
        const latestImagePerArticle: Record<string, string> = {};

        for (const img of images) {
          const pathParts = img.path.split('/');
          if (pathParts.length >= 4 && pathParts[1] === GALLERY_PREFIX) {
            const articleId = pathParts[2];
            if (!latestImagePerArticle[articleId]) {
              latestImagePerArticle[articleId] = img.path;
            }
          }
        }

        // Build final state with only relevant articles
        [FEATURED_ARTICLE, ...ARTICLES].forEach(article => {
          if (latestImagePerArticle[article.id]) {
            const url = supabase.storage
              .from('user_images')
              .getPublicUrl(latestImagePerArticle[article.id]).data.publicUrl;
            initialState[article.id] = { image_url: url };
          }
        });
      }

      setArticles(initialState);
    };

    loadImages();
  }, []);

  // Handle image uploads
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, articleId: string) => {
    if (!adminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(articleId);
    try {
      const folderPath = `${ADMIN_USER_ID}/${GALLERY_PREFIX}/${articleId}/`;

      // Clean up old images for this article
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
      setArticles(prev => ({ ...prev, [articleId]: { image_url: publicUrl } }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  // Copy prompt for AI image generation
  const copyPrompt = (prompt: string, articleId: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(articleId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Handle article interactions
  const toggleSavedArticle = (articleId: string) => {
    setSavedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const toggleLikedArticle = (articleId: string) => {
    setLikedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  // Newsletter subscription
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as HTMLFormElement).email.value;
    alert(`Thank you for subscribing, ${email}! Welcome to the Green Current community.`);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">GC</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Green Current</h1>
                <p className="text-sm text-emerald-600 font-medium">Eco Lifestyle Magazine</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {['Home', 'Articles', 'Topics', 'Guides', 'Podcast', 'About'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="search"
                  placeholder="Search articles..."
                  className="bg-transparent border-none outline-none px-2 text-sm w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors hidden md:block">
                Subscribe
              </button>
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4">
            <div className="space-y-4">
              <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="search"
                  placeholder="Search articles..."
                  className="bg-transparent border-none outline-none px-2 text-sm flex-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {['Home', 'Articles', 'Topics', 'Guides', 'Podcast', 'About'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="block py-2 text-gray-700 hover:text-emerald-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <button className="w-full bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 to-cyan-50 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Featured Article */}
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium">
                <Calendar className="w-4 h-4" />
                <span>{FEATURED_ARTICLE.date}</span>
                <span>•</span>
                <span>{FEATURED_ARTICLE.readTime}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                {FEATURED_ARTICLE.title}
              </h1>
              
              <p className="text-xl text-gray-600">
                {FEATURED_ARTICLE.excerpt}
              </p>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">{FEATURED_ARTICLE.author}</p>
                    <p className="text-sm text-gray-500">Environmental Scientist</p>
                  </div>
                </div>
                <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center space-x-2">
                  <span>Read Full Article</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative">
              <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                {articles[FEATURED_ARTICLE.id]?.image_url ? (
                  <img 
                    src={articles[FEATURED_ARTICLE.id].image_url!}
                    alt={FEATURED_ARTICLE.title}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onLoad={(e) => (e.target as HTMLImageElement).style.opacity = '1'}
                    style={{ opacity: 0 }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-200 to-cyan-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PlayCircle className="w-8 h-8 text-emerald-600" />
                      </div>
                      <p className="text-gray-600">Featured Article Visual</p>
                      {adminMode && (
                        <p className="text-sm text-gray-500 mt-2">Upload image to replace placeholder</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Admin Upload Overlay */}
                {adminMode && (
                  <div className="absolute bottom-4 right-4">
                    <label className="block bg-emerald-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors">
                      {uploading === FEATURED_ARTICLE.id ? 'Uploading…' : 'Upload Featured Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, FEATURED_ARTICLE.id)}
                        className="hidden"
                      />
                    </label>
                    {!articles[FEATURED_ARTICLE.id]?.image_url && (
                      <div className="mt-2 bg-gray-900/90 text-white p-3 rounded-lg max-w-xs">
                        <p className="text-sm mb-2">AI Prompt for featured image:</p>
                        <p className="text-xs text-gray-300 mb-2">{FEATURED_ARTICLE.prompt}</p>
                        <button
                          onClick={() => copyPrompt(FEATURED_ARTICLE.prompt, FEATURED_ARTICLE.id)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded"
                          type="button"
                        >
                          {copiedId === FEATURED_ARTICLE.id ? 'Copied!' : 'Copy Prompt'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Category Badge */}
              <div className="absolute -top-4 left-6">
                <span className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  {FEATURED_ARTICLE.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Articles Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Latest Articles</h2>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">Sort by:</span>
                <select className="bg-transparent border-none outline-none font-medium">
                  <option>Most Recent</option>
                  <option>Most Popular</option>
                  <option>Editor's Pick</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {ARTICLES.map((article) => {
                const articleData = articles[article.id] || { image_url: null };
                const imageUrl = articleData.image_url;

                return (
                  <article 
                    key={article.id} 
                    className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    {/* Article Image */}
                    <div className="relative h-48 md:h-56">
                      {imageUrl ? (
                        <img 
                          src={imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onLoad={(e) => (e.target as HTMLImageElement).style.opacity = '1'}
                          style={{ opacity: 0 }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                          <div className="text-center p-4">
                            <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Bookmark className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-gray-600 text-sm">{article.category}</p>
                            {adminMode && (
                              <p className="text-xs text-gray-500 mt-1">Image placeholder</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Category Tag */}
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-sm text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                          {article.category}
                        </span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <button 
                          onClick={() => toggleSavedArticle(article.id)}
                          className="bg-white/90 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Bookmark className={`w-4 h-4 ${savedArticles.includes(article.id) ? 'fill-emerald-600 text-emerald-600' : 'text-gray-700'}`} />
                        </button>
                        <button 
                          onClick={() => toggleLikedArticle(article.id)}
                          className="bg-white/90 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${likedArticles.includes(article.id) ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
                        </button>
                      </div>
                      
                      {/* Admin Upload */}
                      {adminMode && (
                        <div className="absolute bottom-4 right-4">
                          <label className="block bg-emerald-600 text-white px-3 py-1 rounded text-sm cursor-pointer hover:bg-emerald-700 transition-colors">
                            {uploading === article.id ? 'Uploading…' : 'Upload Image'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUpload(e, article.id)}
                              className="hidden"
                            />
                          </label>
                          {!imageUrl && (
                            <div className="mt-2 bg-gray-900/90 text-white p-2 rounded text-xs max-w-xs">
                              <button
                                onClick={() => copyPrompt(article.prompt, article.id)}
                                className="text-emerald-300 hover:text-emerald-200"
                                type="button"
                              >
                                {copiedId === article.id ? 'Copied!' : 'Copy AI Prompt'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Article Content */}
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{article.date}</span>
                        <span className="mx-2">•</span>
                        <span>{article.readTime}</span>
                        <span className="mx-2">•</span>
                        <User className="w-3 h-3 mr-1" />
                        <span>{article.author}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {article.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <button className="text-emerald-600 font-medium hover:text-emerald-700 flex items-center space-x-1">
                          <span>Read Article</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-gray-700">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            
            {/* Load More */}
            <div className="text-center mt-12">
              <button className="bg-white border-2 border-emerald-600 text-emerald-600 px-8 py-3 rounded-lg font-medium hover:bg-emerald-50 transition-colors">
                Load More Articles
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Newsletter Signup */}
            <div className="bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-3">Join Our Community</h3>
              <p className="text-emerald-100 mb-6">
                Get weekly insights on sustainable living, exclusive guides, and early access to our content.
              </p>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <input
                  type="email"
                  name="email"
                  placeholder="Your email address"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-emerald-200 focus:outline-none focus:border-white"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-white text-emerald-600 px-6 py-3 rounded-lg font-medium hover:bg-emerald-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <Mail className="w-5 h-5" />
                  <span>Subscribe Now</span>
                </button>
              </form>
              <p className="text-xs text-emerald-200 mt-4">
                Join 45,000+ conscious readers. No spam, ever.
              </p>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Explore Topics</h3>
              <div className="space-y-3">
                {CATEGORIES.map((category) => (
                  <a
                    key={category.name}
                    href="#"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-50 transition-colors group"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-emerald-600">
                      {category.name}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-sm px-2 py-1 rounded">
                      {category.count}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Trending Tags</h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => (
                  <a
                    key={tag}
                    href="#"
                    className="inline-block bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    #{tag}
                  </a>
                ))}
              </div>
            </div>

            {/* Podcast Section */}
            <div className="bg-gradient-to-br from-gray-900 to-emerald-900 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">The Green Current Podcast</h3>
                  <p className="text-emerald-200 text-sm">Weekly conversations with change-makers</p>
                </div>
              </div>
              <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Listen Now
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">GC</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Green Current</h2>
                  <p className="text-emerald-400 text-sm">Eco Lifestyle Magazine</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                Inspiring conscious living through curated content on sustainability, wellness, and positive impact.
              </p>
              <div className="flex space-x-4">
                {[Instagram, Facebook, Twitter, Linkedin, Youtube].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {['About Us', 'Editorial Team', 'Contact', 'Write for Us', 'Advertise', 'Press Kit'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-bold mb-4">Resources</h3>
              <ul className="space-y-3">
                {['Sustainability Guide', 'Carbon Calculator', 'Eco Brands Directory', 'Research Library', 'Events Calendar'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-gray-400">
                <li>hello@greencurrent.com</li>
                <li>+1 (555) 123-4567</li>
                <li>123 Sustainability Ave<br />Portland, OR 97201</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Green Current Magazine. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Notification */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-sm font-medium">Admin Mode Active</span>
          </div>
          <p className="text-xs mt-1">You can upload images and copy AI prompts</p>
        </div>
      )}
    </div>
  );
}