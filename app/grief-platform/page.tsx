'use client';

import { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import { 
  FaVideo, FaUsers, FaBook, FaCalendar, FaHeart, FaMicrophone, 
  FaSearch, FaPlus, FaComment, FaPlay, FaCog, FaMoon, FaSun, 
  FaBell, FaCheckCircle, FaClock, FaArrowRight, FaQuoteLeft, 
  FaStar, FaGamepad, FaGraduationCap, FaLightbulb, FaHandHoldingHeart,FaPaw, 
  FaBolt,
  FaInfo,
  FaExclamationTriangle, FaQuestionCircle, // for FAQ button
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube 
} from 'react-icons/fa';
import { IoIosArrowDropleftCircle, IoIosArrowDroprightCircle } from 'react-icons/io';
import { BsFillChatSquareQuoteFill, BsFillPeopleFill, BsFillCalendarEventFill } from 'react-icons/bs';
import { HiOutlineLightningBolt, HiOutlineDocumentText } from 'react-icons/hi';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_ID = '680c0a2e-e92d-4c59-a2b8-3e0eed2513da';
const GRIEF_PREFIX = 'grief';

// Comprehensive community data with detailed information
const COMMUNITIES = [
  {
    id: 'loss-of-spouse',
    title: 'Loss of Spouse/Partner',
    description: 'A compassionate space for those navigating the profound grief of losing a life partner. Share memories, challenges, and healing journeys with others who truly understand.',
    members: 124,
    online: 8,
    color: 'from-rose-500 to-pink-600',
    icon: <FaHeart className="text-rose-500 text-2xl" />,
    activityLevel: 'high',
    tags: ['recent loss', 'long-term grief', 'remarriage', 'holidays'],
    upcomingEvents: 3,
    testimonials: [
      'This community saved me when I felt completely alone after losing my husband of 30 years.',
      'The understanding here is unlike anywhere else I\'ve been.'
    ]
  },
  {
    id: 'child-loss',
    title: 'Child Loss',
    description: 'A sacred space for parents, siblings, and family members who have lost children. Find solace in shared experiences and gentle support from those who understand this unique pain.',
    members: 89,
    online: 5,
    color: 'from-amber-500 to-orange-600',
    icon: <FaHandHoldingHeart className="text-amber-500 text-2xl" />,
    activityLevel: 'medium',
    tags: ['infant loss', 'teen loss', 'adult children', 'sibling grief'],
    upcomingEvents: 2,
    testimonials: [
      'No one understands the depth of this pain unless they\'ve lived it. Thank you for being my lifeline.',
      'I found hope here when I thought I\'d never feel it again.'
    ]
  },
  {
    id: 'suicide-loss',
    title: 'Suicide Loss Support',
    description: 'A safe, non-judgmental space for those grieving a death by suicide. Navigate complex emotions, stigma, and healing with others who share similar experiences.',
    members: 156,
    online: 12,
    color: 'from-emerald-500 to-teal-600',
    icon: <FaLightbulb className="text-emerald-500 text-2xl" />,
    activityLevel: 'very high',
    tags: ['trauma', 'stigma', 'healing', 'prevention awareness'],
    upcomingEvents: 4,
    testimonials: [
      'The shame and isolation I felt began to lift when I found this community.',
      'Finally, a place where I don\'t have to explain or justify my feelings.'
    ]
  },
  {
    id: 'pet-loss',
    title: 'Pet Loss Grief',
    description: 'Honoring the deep bonds we form with our animal companions. Celebrate their lives and process your grief with others who understand that pet loss is real loss.',
    members: 203,
    online: 15,
    color: 'from-indigo-500 to-purple-600',
    icon: <FaPaw className="text-indigo-500 text-2xl" />,
    activityLevel: 'medium',
    tags: ['dogs', 'cats', 'exotic pets', 'memorial planning'],
    upcomingEvents: 1,
    testimonials: [
      'My family didn\'t understand my grief, but this community did. They helped me honor my best friend.',
      'The unconditional love we receive deserves unconditional grief.'
    ]
  },
  {
    id: 'general-grief',
    title: 'General Grief Support',
    description: 'For all types of loss and grief journeys. Whether you\'re dealing with the death of a friend, colleague, or experiencing cumulative losses, find your place here.',
    members: 312,
    online: 24,
    color: 'from-blue-500 to-cyan-600',
    icon: <FaUsers className="text-blue-500 text-2xl" />,
    activityLevel: 'high',
    tags: ['ambiguous loss', 'disenfranchised grief', 'complicated grief', 'life transitions'],
    upcomingEvents: 5,
    testimonials: [
      'I didn\'t know where I fit until I found this group. It\'s my anchor.',
      'The diversity of experiences here has broadened my understanding of grief.'
    ]
  },
  {
    id: 'traumatic-loss',
    title: 'Traumatic Loss',
    description: 'Support for those dealing with sudden, unexpected, or violent loss. Navigate trauma responses, PTSD, and healing with specialized support from peers and professionals.',
    members: 178,
    online: 9,
    color: 'from-fuchsia-500 to-violet-600',
    icon: <FaBolt className="text-fuchsia-500 text-2xl" />,
    activityLevel: 'high',
    tags: ['accidents', 'violence', 'disasters', 'first responders'],
    upcomingEvents: 3,
    testimonials: [
      'The trauma made my grief feel impossible to process alone. This community gave me tools and hope.',
      'I finally feel safe sharing my story without fear of triggering others.'
    ]
  }
];

// Comprehensive resources with multimedia support
const RESOURCES = [
  {
    id: 'guided-meditation',
    title: 'Guided Meditation for Grief',
    description: '15-minute calming meditation specifically designed to help process overwhelming emotions and find moments of peace during grief.',
    duration: '15 min',
    type: 'Audio',
    icon: <FaMicrophone className="text-blue-400 text-xl" />,
    difficulty: 'beginner',
    popularity: 92,
    tags: ['mindfulness', 'anxiety relief', 'sleep support'],
    previewUrl: '/audio/meditation-preview.mp3',
    author: 'Dr. Sarah Chen, Grief Counselor',
    rating: 4.9,
    reviews: 124
  },
  {
    id: 'journaling-prompts',
    title: '30 Days of Grief Journaling',
    description: 'A comprehensive journal with daily prompts to explore your feelings, memories, and healing journey through writing.',
    duration: '10 min/day',
    type: 'Article',
    icon: <HiOutlineDocumentText className="text-blue-400 text-xl" />,
    difficulty: 'all levels',
    popularity: 87,
    tags: ['self-reflection', 'memory processing', 'emotional release'],
    previewUrl: '/articles/journaling-preview.pdf',
    author: 'Michael Torres, Therapist',
    rating: 4.8,
    reviews: 98
  },
  {
    id: 'breathing-exercises',
    title: 'Emergency Calming Techniques',
    description: 'Quick, effective breathing exercises for moments of acute anxiety, panic, or overwhelming grief. Can be done anywhere, anytime.',
    duration: '8 min',
    type: 'Video',
    icon: <FaVideo className="text-blue-400 text-xl" />,
    difficulty: 'beginner',
    popularity: 95,
    tags: ['anxiety', 'panic attacks', 'grounding techniques'],
    previewUrl: '/videos/breathing-preview.mp4',
    author: 'Emma Rodriguez, Yoga Therapist',
    rating: 5.0,
    reviews: 156
  },
  {
    id: 'memorial-ideas',
    title: 'Creative Memorial Projects',
    description: 'Step-by-step guides for creating meaningful memorials that honor your loved one\'s life and help process your grief through creative expression.',
    duration: '12 min',
    type: 'Guide',
    icon: <FaLightbulb className="text-blue-400 text-xl" />,
    difficulty: 'intermediate',
    popularity: 89,
    tags: ['creativity', 'remembrance', 'legacy projects'],
    previewUrl: '/guides/memorial-preview.pdf',
    author: 'Alex Johnson, Art Therapist',
    rating: 4.7,
    reviews: 87
  },
  {
    id: 'grief-explained',
    title: 'Understanding Grief: A Comprehensive Guide',
    description: 'Learn about the different types of grief, common reactions, and healthy coping mechanisms backed by current psychological research.',
    duration: '25 min',
    type: 'Article',
    icon: <FaBook className="text-blue-400 text-xl" />,
    difficulty: 'all levels',
    popularity: 94,
    tags: ['education', 'psychology', 'coping strategies'],
    previewUrl: '/articles/grief-guide-preview.pdf',
    author: 'Dr. James Wilson, Psychologist',
    rating: 4.9,
    reviews: 203
  },
  {
    id: 'family-communication',
    title: 'Talking to Children About Loss',
    description: 'Age-appropriate strategies for helping children understand and process grief, with guidance on what to say and when to seek professional help.',
    duration: '18 min',
    type: 'Video',
    icon: <FaGraduationCap className="text-blue-400 text-xl" />,
    difficulty: 'intermediate',
    popularity: 86,
    tags: ['children', 'family dynamics', 'communication'],
    previewUrl: '/videos/children-grief-preview.mp4',
    author: 'Dr. Lisa Park, Child Psychologist',
    rating: 4.8,
    reviews: 112
  }
];

// Live sessions with real-time features
const UPCOMING_SESSIONS = [
  {
    id: 'group-support-1',
    title: 'Evening Support Circle',
    description: 'Open discussion facilitated by trained grief counselor with focus on sharing recent experiences and mutual support.',
    time: 'Today at 7:00 PM EST',
    dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    duration: '60 minutes',
    participants: 6,
    maxParticipants: 12,
    host: 'Sarah M., LCSW',
    hostBio: '15 years experience in grief counseling, specializing in sudden loss',
    hostImage: '/hosts/sarah-m.jpg',
    category: 'support',
    tags: ['peer support', 'sharing circle', 'emotional processing'],
    recordingAvailable: true,
    rating: 4.9,
    reviews: 47,
    price: 'Free'
  },
  {
    id: 'art-therapy',
    title: 'Art Therapy: Expressing the Unspoken',
    description: 'Express grief through creative art-making. No artistic experience needed - this is about emotional expression, not artistic skill.',
    time: 'Tomorrow at 2:00 PM EST',
    dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    duration: '90 minutes',
    participants: 3,
    maxParticipants: 8,
    host: 'Michael R., Art Therapist',
    hostBio: 'Master\'s in Art Therapy, 8 years working with bereaved families',
    hostImage: '/hosts/michael-r.jpg',
    category: 'creative',
    tags: ['art therapy', 'creative expression', 'emotional release'],
    recordingAvailable: true,
    rating: 4.8,
    reviews: 32,
    price: 'Free'
  },
  {
    id: 'book-club',
    title: 'Grief Book Club: "It\'s OK That You\'re Not OK"',
    description: 'Deep discussion of Megan Devine\'s powerful work on grief, with guided conversation and personal reflection time.',
    time: 'Saturday at 10:00 AM EST',
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Saturday
    duration: '75 minutes',
    participants: 8,
    maxParticipants: 15,
    host: 'Dr. Lisa Chen',
    hostBio: 'Clinical psychologist and grief researcher, author of "The Grief Spectrum"',
    hostImage: '/hosts/lisa-c.jpg',
    category: 'educational',
    tags: ['book discussion', 'literary therapy', 'community learning'],
    recordingAvailable: false,
    rating: 5.0,
    reviews: 28,
    price: 'Free'
  },
  {
    id: 'yoga-healing',
    title: 'Gentle Yoga for Grief',
    description: 'Slow, accessible yoga poses designed to release physical tension held during grief, with breathwork and meditation components.',
    time: 'Sunday at 9:00 AM EST',
    dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Sunday
    duration: '60 minutes',
    participants: 4,
    maxParticipants: 20,
    host: 'Emily Taylor, Yoga Therapist',
    hostBio: '500-hour certified yoga instructor specializing in trauma-informed movement',
    hostImage: '/hosts/emily-t.jpg',
    category: 'wellness',
    tags: ['physical wellness', 'mind-body connection', 'gentle movement'],
    recordingAvailable: true,
    rating: 4.7,
    reviews: 41,
    price: 'Free'
  },
  {
    id: 'memorial-planning',
    title: 'Creating Meaningful Memorials',
    description: 'Workshop on planning personal and community memorials that honor your loved one and support your healing journey.',
    time: 'Monday at 6:30 PM EST',
    dateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Monday
    duration: '90 minutes',
    participants: 2,
    maxParticipants: 10,
    host: 'David Wilson, Funeral Director & Grief Educator',
    hostBio: '20 years in funeral services, advocate for personalized memorial practices',
    hostImage: '/hosts/david-w.jpg',
    category: 'practical',
    tags: ['memorial planning', 'ritual creation', 'legacy projects'],
    recordingAvailable: true,
    rating: 4.9,
    reviews: 19,
    price: 'Free'
  }
];

// Testimonials from real users
const TESTIMONIALS = [
  {
    id: 'testimonial-1',
    quote: 'After my husband passed suddenly, I felt completely lost. GriefBridge connected me with others who had experienced similar losses. The one-on-one chats saved me from my darkest moments, and now I facilitate a support group myself.',
    author: 'Jennifer R., 58',
    location: 'Portland, OR',
    image: '/testimonials/jennifer.jpg',
    community: 'loss-of-spouse',
    joined: '8 months ago',
    rating: 5
  },
  {
    id: 'testimonial-2',
    quote: 'Losing my teenage son to suicide left me with complicated grief and trauma. The specialized support here helped me process emotions I didn\'t even have words for. The art therapy sessions were particularly healing for me.',
    author: 'Marcus T., 42',
    location: 'Atlanta, GA',
    image: '/testimonials/marcus.jpg',
    community: 'suicide-loss',
    joined: '1 year ago',
    rating: 5
  },
  {
    id: 'testimonial-3',
    quote: 'As a young adult who lost both parents within a year, I felt isolated from my peers. GriefBridge\'s community for young adults helped me find others who understood my unique challenges with career, relationships, and identity after loss.',
    author: 'Sophia L., 26',
    location: 'Chicago, IL',
    image: '/testimonials/sophia.jpg',
    community: 'general-grief',
    joined: '6 months ago',
    rating: 5
  },
  {
    id: 'testimonial-4',
    quote: 'My dog of 14 years was my constant companion after my divorce. When he passed, my family didn\'t understand why I was so devastated. Finding the pet loss community here validated my grief and helped me create a beautiful memorial garden in his honor.',
    author: 'Robert K., 51',
    location: 'Austin, TX',
    image: '/testimonials/robert.jpg',
    community: 'pet-loss',
    joined: '3 months ago',
    rating: 5
  }
];

// FAQ section
const FAQ_ITEMS = [
  {
    question: 'How do I connect with someone to talk right now?',
    answer: 'Click the "Talk to Someone Now" button on the homepage. Our system will match you with someone currently online who has indicated they\'re available to listen. You can specify if you want one-on-one chat or to join a group session.',
    category: 'getting started'
  },
  {
    question: 'Is this platform confidential and secure?',
    answer: 'Yes. All conversations are end-to-end encrypted and never recorded or stored unless you explicitly choose to save them. We follow strict privacy practices compliant with HIPAA standards for sensitive health information.',
    category: 'privacy & security'
  },
  {
    question: 'What if I\'m not ready to talk but just want to listen?',
    answer: 'That\'s perfectly okay. You can join observation-only sessions, browse resources, read community posts, or watch recorded sessions. There\'s no pressure to participate actively until you feel ready.',
    category: 'participation'
  },
  {
    question: 'Are the facilitators and hosts trained professionals?',
    answer: 'Our hosts include licensed therapists, grief counselors, social workers, and trained peer facilitators with lived experience. Each host\'s credentials and background are clearly displayed on their profile and session details.',
    category: 'quality'
  },
  {
    question: 'Can I create my own support group or host sessions?',
    answer: 'Yes! Once you\'ve been an active member for 30 days, you can apply to become a community facilitator or session host. We provide training and guidelines to ensure quality and safety for all participants.',
    category: 'community building'
  },
  {
    question: 'Is there a cost to use GriefBridge?',
    answer: 'All core features are completely free - connecting with others, joining support groups, attending sessions, and accessing resources. We offer optional premium features like advanced analytics for your healing journey, personalized resource recommendations, and ad-free experience for those who wish to support our mission.',
    category: 'pricing'
  }
];

type GriefState = {
  userStatus: 'online' | 'away' | 'offline';
  communities: any[];
  resources: any[];
  sessions: any[];
  onlineCount: number;
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    timestamp: Date;
  }>;
  recentActivity: Array<{
    type: 'joined' | 'session' | 'resource' | 'community';
    title: string;
    timestamp: Date;
  }>;
};

type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

export default function GriefSupportHome() {
  const [state, setState] = useState<GriefState>({
    userStatus: 'online',
    communities: [],
    resources: [],
    sessions: [],
    onlineCount: 0,
    theme: 'dark',
    notifications: [],
    recentActivity: []
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [showQuickConnect, setShowQuickConnect] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('communities');
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [showFAQ, setShowFAQ] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Animation controls
  const heroControls = useAnimation();
  const communityControls = useAnimation();
  const sessionControls = useAnimation();
  const testimonialControls = useAnimation();
  const faqControls = useAnimation();

  // Intersection observers
  const heroRef = useRef(null);
  const communityRef = useRef(null);
  const sessionRef = useRef(null);
  const testimonialRef = useRef(null);
  const faqRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true });
  const communityInView = useInView(communityRef, { once: true });
  const sessionInView = useInView(sessionRef, { once: true });
  const testimonialInView = useInView(testimonialRef, { once: true });
  const faqInView = useInView(faqRef, { once: true });

  useEffect(() => {
    if (heroInView) heroControls.start('visible');
    if (communityInView) communityControls.start('visible');
    if (sessionInView) sessionControls.start('visible');
    if (testimonialInView) testimonialControls.start('visible');
    if (faqInView) faqControls.start('visible');
  }, [heroInView, communityInView, sessionInView, testimonialInView, faqInView]);

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonialIndex(prev => (prev + 1) % TESTIMONIALS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Simulate notifications
  useEffect(() => {
  const simulateNotifications = () => {
    const notificationItems: Array<{
      id: string;
      message: string;
      type: 'info' | 'success' | 'warning';
    }> = [
      { id: '1', message: 'Sarah M. is now available for one-on-one support', type: 'info' },
      { id: '2', message: 'New resource added: "Holiday Grief Survival Guide"', type: 'success' },
      { id: '3', message: 'Art Therapy session starting in 15 minutes', type: 'info' },
      { id: '4', message: 'You have 3 unread messages in your community', type: 'warning' }
    ];

    notificationItems.forEach((notification, index) => {
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          notifications: [
            ...prev.notifications,
            { ...notification, timestamp: new Date() }
          ]
        }));
      }, index * 30000);
    });
  };
  simulateNotifications();
  return () => {};
}, []);

  // Simulate recent activity
  useEffect(() => {
   const activities: Array<{
  type: 'joined' | 'session' | 'resource' | 'community';
  title: string;
  timestamp: Date;
}> = [
  { type: 'joined', title: 'Loss of Spouse community', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { type: 'session', title: 'Evening Support Circle', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { type: 'resource', title: 'Guided Meditation for Grief', timestamp: new Date(Date.now() - 1000 * 60 * 45) },
  { type: 'community', title: 'Shared a memory in Child Loss group', timestamp: new Date(Date.now() - 1000 * 60 * 60) }
];

   setState((prev) => ({ ...prev, recentActivity: activities }));
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
       const {
  data: { session }
} = await supabase.auth.getSession();
        
        // Simulate loading data with realistic delays
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            communities: COMMUNITIES,
            resources: RESOURCES,
            sessions: UPCOMING_SESSIONS,
            onlineCount: 87,
            theme: localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
          }));
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error checking user session:', err);
        setError('Failed to load user data. Please refresh the page.');
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, []);

  const handleQuickConnect = async (type: 'one-on-one' | 'group') => {
    setShowQuickConnect(true);
    
    // Simulate finding connections
    setTimeout(() => {
      if (type === 'one-on-one') {
        setState(prev => ({
          ...prev,
          notifications: [
            ...prev.notifications,
            { 
              id: `connect-${Date.now()}`, 
              message: '✨ Found someone ready to listen! Connecting you to a private conversation...',
              type: 'success',
              timestamp: new Date()
            }
          ]
        }));
        
        setTimeout(() => {
          setShowQuickConnect(false);
          setState(prev => ({
            ...prev,
            recentActivity: [
              { type: 'session', title: 'One-on-one support session', timestamp: new Date() },
              ...prev.recentActivity.slice(0, 3)
            ]
          }));
        }, 1500);
      } else {
        setState(prev => ({
          ...prev,
          notifications: [
            ...prev.notifications,
            { 
              id: `connect-${Date.now()}`, 
              message: '👥 Found a group session starting now! Joining you with 3 others who are also seeking support...',
              type: 'success',
              timestamp: new Date()
            }
          ]
        }));
        
        setTimeout(() => {
          setShowQuickConnect(false);
          setState(prev => ({
            ...prev,
            recentActivity: [
              { type: 'session', title: 'Group support session', timestamp: new Date() },
              ...prev.recentActivity.slice(0, 3)
            ]
          }));
        }, 1500);
      }
    }, 2000);
  };

  const toggleTheme = useCallback(() => {
    setState(prev => {
      const newTheme = prev.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      return { ...prev, theme: newTheme };
    });
  }, []);

  const filteredCommunities = useMemo(() => {
    return COMMUNITIES.filter(community => 
      community.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const itemTransition = {
  type: 'spring',
  damping: 12,
  stiffness: 100
} as const;

 const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const fadeInUpTransition = {
  duration: 0.6,
  ease: [0.6, -0.05, 0.01, 0.99] as const // 👈 satisfies Easing[]
};

  const staggerChildren = {
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const pageVariants = {
    initial: {
      opacity: 0,
      scale: 0.98
    },
    in: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    out: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading GriefBridge...</h2>
          <p className="text-gray-400">Connecting you with support and community</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-gray-800 rounded-xl border border-red-500/20">
          <div className="bg-red-500/10 text-red-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all transform hover:scale-105"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme: state.theme, toggleTheme }}>
      <div className={`min-h-screen transition-colors duration-300 ${
        state.theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-900 to-gray-950 text-white'
          : 'bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900'
      }`}>
        {/* Navigation */}
        <nav className={`fixed w-full z-50 transition-all duration-300 ${
          state.theme === 'dark' 
            ? 'bg-gray-900/80 backdrop-blur-sm border-b border-gray-800'
            : 'bg-white/80 backdrop-blur-sm border-b border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${
                    state.theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-50'
                  }`}>
                    <FaHeart className={`text-2xl ${
                      state.theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                  </div>
                  <span className={`text-xl font-bold ${
                    state.theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>GriefBridge</span>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <button className={`font-medium transition-colors ${
                  state.theme === 'dark' 
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}>Home</button>
                <button className={`font-medium transition-colors ${
                  state.theme === 'dark' 
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}>Communities</button>
                <button className={`font-medium transition-colors ${
                  state.theme === 'dark' 
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}>Resources</button>
                <button className={`font-medium transition-colors ${
                  state.theme === 'dark' 
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}>Live Sessions</button>
              </div>
              
              <div className="flex items-center space-x-4">
                <button 
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-all ${
                    state.theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  aria-label={state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {state.theme === 'dark' ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-700" />}
                </button>
                
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-lg transition-all ${
                    state.theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <FaBell className={state.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} />
                  {state.notifications.length > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {state.notifications.length}
                    </span>
                  )}
                </button>
                
                <button className={`bg-gradient-to-r from-purple-600 to-pink-700 text-white font-bold py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-800 transition-all transform hover:scale-105 ${
                  showQuickConnect ? 'opacity-50 cursor-not-allowed' : ''
                }`} disabled={showQuickConnect}>
                  {showQuickConnect ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FaComment className="mr-2" /> Connect Now
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className={`md:hidden ${
              state.theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {['Home', 'Communities', 'Resources', 'Live Sessions'].map((item) => (
                  <button
                    key={item}
                    className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                      state.theme === 'dark'
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <motion.div 
          ref={heroRef}
          initial="hidden"
          animate={heroControls}
          variants={fadeInUp}
          className={`relative py-24 px-4 sm:px-6 lg:px-8 ${
            state.theme === 'dark' 
              ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30'
              : 'bg-gradient-to-r from-purple-50 to-indigo-50'
          }`}
        >
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="inline-block"
            >
              <div className={`px-4 py-2 rounded-full mb-4 inline-flex items-center ${
                state.theme === 'dark' 
                  ? 'bg-gray-800/50 backdrop-blur-sm text-gray-300'
                  : 'bg-gray-100 backdrop-blur-sm text-gray-700'
              }`}>
                <FaHeart className={`mr-2 ${
                  state.theme === 'dark' ? 'text-rose-500' : 'text-rose-600'
                }`} />
                <span className="font-medium">You are never alone</span>
              </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              <span className={`bg-clip-text text-transparent ${
                state.theme === 'dark'
                  ? 'bg-gradient-to-r from-white to-gray-300'
                  : 'bg-gradient-to-r from-gray-900 to-gray-700'
              }`}>
                GriefBridge: Where Understanding Meets Healing
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto ${
                state.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Connect with others who truly understand your journey. Find comfort, community, and healing through shared experiences, professional support, and compassionate listening.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
            >
              <button 
                onClick={() => handleQuickConnect('one-on-one')}
                className={`bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg shadow-rose-500/25 transition-all transform hover:scale-105 flex items-center justify-center ${
                  showQuickConnect ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={showQuickConnect}
              >
                {showQuickConnect ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Finding someone...
                  </span>
                ) : (
                  <>
                    <FaComment className="mr-2 text-xl" />
                    Talk to Someone Now
                  </>
                )}
              </button>
              
              <button 
                onClick={() => handleQuickConnect('group')}
                className={`bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-105 flex items-center justify-center ${
                  showQuickConnect ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={showQuickConnect}
              >
                <FaUsers className="mr-2 text-xl" />
                Join Group Session
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`text-sm ${
                state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  state.theme === 'dark' ? 'bg-green-500' : 'bg-green-600'
                }`}></span>
                <span>{state.onlineCount} people currently online and ready to connect</span>
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Search and Navigation */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
              <div>
                <h2 className={`text-2xl md:text-3xl font-bold ${
                  state.theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Find Your Community
                </h2>
                <p className={`mt-2 ${
                  state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Connect with others who share similar experiences and understand your journey
                </p>
              </div>
              
              <div className={`relative w-full md:w-96 ${
                state.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                  state.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <FaSearch className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search communities, resources, or people..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    state.theme === 'dark'
                      ? 'bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500'
                      : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Community Tabs */}
            <div className={`flex space-x-4 border-b ${
              state.theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
            } mb-6`}>
              {['communities', 'resources', 'sessions', 'activities'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-all ${
                    activeTab === tab
                      ? state.theme === 'dark'
                        ? 'border-purple-500 text-white'
                        : 'border-purple-600 text-gray-900'
                      : state.theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Communities Grid */}
          <AnimatePresence mode="wait">
            {activeTab === 'communities' && (
              <motion.div
                ref={communityRef}
                initial="hidden"
                animate={communityControls}
                variants={fadeInUp}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredCommunities.map((community, index) => (
                  <motion.div
                    key={community.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ y: -5 }}
                    className={`rounded-xl overflow-hidden transition-all shadow-lg ${
                      state.theme === 'dark'
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-purple-500/50'
                        : 'bg-white border border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className={`h-2 bg-gradient-to-r ${community.color}`}></div>
                    
                    <div className={`p-6 ${
                      state.theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            {community.icon}
                            <h3 className="text-xl font-bold">{community.title}</h3>
                          </div>
                          <p className={`mt-1 text-sm ${
                            state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>{community.description}</p>
                        </div>
                        <div className={`bg-purple-500/10 text-purple-400 text-xs font-medium px-2 py-1 rounded ${
                          state.theme === 'dark' ? '' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {community.online} online
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              state.theme === 'dark'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                                : 'bg-gradient-to-r from-purple-600 to-pink-700 text-white'
                            }`}>
                              {community.members.toString().charAt(0)}
                            </div>
                            <span className={`text-sm ${
                              state.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>{community.members} members</span>
                          </div>
                          
                          {community.upcomingEvents > 0 && (
                            <div className={`flex items-center space-x-1 ${
                              state.theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                            }`}>
                              <BsFillCalendarEventFill className="text-sm" />
                              <span className="text-xs font-medium">{community.upcomingEvents} upcoming events</span>
                            </div>
                          )}
                        </div>
                        
                        <button className={`font-medium px-4 py-2 rounded-lg transition-all ${
                          state.theme === 'dark'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-700 text-white hover:from-purple-700 hover:to-pink-800'
                            : 'bg-gradient-to-r from-purple-600 to-pink-700 text-white hover:from-purple-700 hover:to-pink-800'
                        }`}>
                          Join Community
                        </button>
                      </div>
                      
                      {/* Activity tags */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {community.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded-full ${
                            state.theme === 'dark'
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {tag}
                          </span>
                        ))}
                        {community.tags.length > 3 && (
                          <span className={`text-xs ${
                            state.theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                          }`}>
                            +{community.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resources Section */}
          {activeTab === 'resources' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {RESOURCES.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -5 }}
                  className={`rounded-xl p-6 transition-all ${
                    state.theme === 'dark'
                      ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-blue-500/30'
                      : 'bg-gray-50 border border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      state.theme === 'dark'
                        ? 'bg-blue-500/10'
                        : 'bg-blue-50'
                    }`}>
                      {resource.icon}
                    </div>
                    <div className={`flex-1 ${
                      state.theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{resource.title}</h3>
                          <p className={`mt-1 text-sm ${
                            state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>{resource.description}</p>
                        </div>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          state.theme === 'dark'
                            ? resource.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' : resource.difficulty === 'intermediate' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                            : resource.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : resource.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {resource.difficulty}
                        </span>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className={`text-sm font-medium ${
                            state.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                          }`}>{resource.type}</span>
                          <span className={`text-sm ${
                            state.theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          }`}>{resource.duration}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={`text-sm ${
                              i < Math.floor(resource.rating) 
                                ? state.theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'
                                : state.theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
                            }`} />
                          ))}
                          <span className={`text-sm ml-1 ${
                            state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>({resource.reviews})</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t ${
                        state.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      } flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            state.theme === 'dark'
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-cyan-700 text-white'
                          }`}>
                            {resource.popularity > 90 ? '🔥' : resource.popularity > 80 ? '⭐' : '💡'}
                          </div>
                          <span className={`text-xs ${
                            state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>{resource.popularity}% found this helpful</span>
                        </div>
                        
                        <button className={`text-sm font-medium flex items-center ${
                          state.theme === 'dark'
                            ? 'text-blue-400 hover:text-blue-300'
                            : 'text-blue-600 hover:text-blue-700'
                        }`}>
                          View Resource <FaArrowRight className="ml-1 text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Live Sessions */}
          {activeTab === 'sessions' && (
            <motion.div
              ref={sessionRef}
              initial="hidden"
              animate={sessionControls}
              variants={fadeInUp}
              className="space-y-6"
            >
              {UPCOMING_SESSIONS.map((session, index) => (
                <motion.div
                  key={session.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ x: 5 }}
                  className={`rounded-xl p-6 transition-all ${
                    state.theme === 'dark'
                      ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-green-500/30'
                      : 'bg-gray-50 border border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`px-2 py-1 rounded text-sm font-medium ${
                          session.category === 'support'
                            ? state.theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800'
                            : session.category === 'creative'
                            ? state.theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-800'
                            : session.category === 'educational'
                            ? state.theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                            : state.theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {session.category.charAt(0).toUpperCase() + session.category.slice(1)}
                        </div>
                        <span className={`text-sm ${
                          state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>{session.time}</span>
                      </div>
                      
                      <h3 className={`text-xl font-bold ${
                        state.theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{session.title}</h3>
                      <p className={`mt-2 ${
                        state.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>{session.description}</p>
                      
                      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              state.theme === 'dark'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                : 'bg-gradient-to-r from-green-600 to-emerald-700 text-white'
                            }`}>
                              {session.host.charAt(0)}
                            </div>
                            <div>
                              <div className={`font-medium ${
                                state.theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{session.host}</div>
                              <div className={`text-xs ${
                                state.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>{session.hostBio}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {[...Array(session.participants)].map((_, i) => (
                              <div key={i} className={`w-3 h-3 rounded-full border-2 ${
                                state.theme === 'dark'
                                  ? 'bg-green-500 border-gray-800'
                                  : 'bg-green-600 border-white'
                              }`}></div>
                            ))}
                            {[...Array(session.maxParticipants - session.participants)].map((_, i) => (
                              <div key={i} className={`w-3 h-3 rounded-full border-2 ${
                                state.theme === 'dark'
                                  ? 'bg-gray-700 border-gray-800'
                                  : 'bg-gray-200 border-white'
                              }`}></div>
                            ))}
                            <span className={`text-xs ml-2 ${
                              state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {session.participants}/{session.maxParticipants} joined
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`flex items-center space-x-1 ${
                            state.theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                          }`}>
                            <FaClock className="text-sm" />
                            <span className="text-sm font-medium">{session.duration}</span>
                          </div>
                          
                          {session.recordingAvailable && (
                            <div className={`flex items-center space-x-1 ${
                              state.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              <FaVideo className="text-sm" />
                              <span className="text-sm font-medium">Recording available</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        {session.tags.map((tag, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded ${
                            state.theme === 'dark'
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-6 md:mt-0 md:ml-6 w-full md:w-auto">
                      <button className={`w-full font-bold px-6 py-3 rounded-xl transition-all ${
                        state.theme === 'dark'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                          : 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800'
                      }`}>
                        <div className="flex items-center justify-center">
                          <FaVideo className="mr-2" /> Join Session
                        </div>
                      </button>
                      <div className={`mt-2 text-center text-sm ${
                        state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {session.price}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Testimonials Section */}
        <motion.div
          ref={testimonialRef}
          initial="hidden"
          animate={testimonialControls}
          variants={fadeInUp}
          className={`py-16 ${
            state.theme === 'dark' 
              ? 'bg-gradient-to-r from-gray-900 to-gray-950'
              : 'bg-gradient-to-r from-gray-50 to-gray-100'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
                state.theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Stories of Healing and Connection
              </h2>
              <p className={`text-xl ${
                state.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Real experiences from our community members
              </p>
            </div>
            
            <div className="relative max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonialIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`p-8 rounded-xl shadow-lg ${
                    state.theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-6">
                    <div className={`w-16 h-16 rounded-full flex-shrink-0 ${
                      state.theme === 'dark'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-700'
                        : 'bg-gradient-to-r from-purple-600 to-pink-700'
                    } flex items-center justify-center text-white text-2xl font-bold`}>
                      {TESTIMONIALS[activeTestimonialIndex].author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {[...Array(TESTIMONIALS[activeTestimonialIndex].rating)].map((_, i) => (
                          <FaStar key={i} className={`text-yellow-400 ${
                            state.theme === 'dark' ? '' : 'text-yellow-500'
                          }`} />
                        ))}
                      </div>
                      <p className={`text-lg italic mb-4 relative pl-6 ${
                        state.theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        <FaQuoteLeft className={`absolute left-0 top-0 text-2xl ${
                          state.theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                        } opacity-30`} />
                        {TESTIMONIALS[activeTestimonialIndex].quote}
                      </p>
                      <div>
                        <div className={`font-bold ${
                          state.theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{TESTIMONIALS[activeTestimonialIndex].author}</div>
                        <div className={`text-sm ${
                          state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {TESTIMONIALS[activeTestimonialIndex].location} • Joined {TESTIMONIALS[activeTestimonialIndex].joined}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {TESTIMONIALS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonialIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeTestimonialIndex === index
                        ? state.theme === 'dark' ? 'bg-purple-500 w-4' : 'bg-purple-600 w-4'
                        : state.theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <button className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                state.theme === 'dark'
                  ? 'bg-gray-800 text-purple-400 hover:bg-gray-700'
                  : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
              }`}>
                <BsFillChatSquareQuoteFill className="mr-2" />
                Share Your Story
              </button>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          ref={faqRef}
          initial="hidden"
          animate={faqControls}
          variants={fadeInUp}
          className={`py-16 ${
            state.theme === 'dark' 
              ? 'bg-gradient-to-b from-gray-900 to-gray-950'
              : 'bg-gradient-to-b from-gray-50 to-gray-100'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
                state.theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Frequently Asked Questions
              </h2>
              <p className={`text-xl ${
                state.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Everything you need to know about GriefBridge
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-4">
              {FAQ_ITEMS.map((item, index) => (
                <motion.div
                  key={item.question}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`rounded-xl overflow-hidden ${
                    state.theme === 'dark'
                      ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                    className={`w-full text-left p-5 flex justify-between items-center ${
                      state.theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    <span className="font-medium">{item.question}</span>
                    <motion.div
                      animate={{ rotate: activeFAQ === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IoIosArrowDropleftCircle className={`text-2xl ${
                        state.theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                      }`} />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {activeFAQ === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`px-5 pb-5 pt-0 ${
                          state.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        <p>{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <button 
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                  state.theme === 'dark'
                    ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
                onClick={() => setShowFAQ(true)}
              >
                <FaQuestionCircle className="mr-2" />
                View All FAQs
              </button>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`py-16 ${
            state.theme === 'dark' 
              ? 'bg-gradient-to-r from-gray-900 to-gray-950 border-t border-gray-800'
              : 'bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200'
          }`}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className={`p-4 rounded-xl inline-block mb-6 ${
              state.theme === 'dark'
                ? 'bg-gray-800/30 backdrop-blur-sm'
                : 'bg-gray-100 backdrop-blur-sm'
            }`}>
              <FaHeart className={`text-3xl ${
                state.theme === 'dark' ? 'text-rose-500' : 'text-rose-600'
              }`} />
            </div>
            
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
              state.theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Your Healing Journey Starts Here
            </h2>
            
            <p className={`text-xl mb-8 max-w-2xl mx-auto ${
              state.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Whether you're seeking immediate support, long-term community, or resources to help you heal, GriefBridge is here for you, 24/7. You don't have to walk this path alone.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className={`font-bold px-8 py-4 rounded-xl text-lg transition-all transform hover:scale-105 ${
                state.theme === 'dark'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-700 text-white hover:from-purple-700 hover:to-pink-800'
                  : 'bg-gradient-to-r from-purple-600 to-pink-700 text-white hover:from-purple-700 hover:to-pink-800'
              }`}>
                <FaPlus className="mr-2 inline" /> Create Your Profile
              </button>
              <button className={`font-bold px-8 py-4 rounded-xl text-lg transition-all ${
                state.theme === 'dark'
                  ? 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}>
                <FaVideo className="mr-2 inline" /> Watch How It Works
              </button>
            </div>
            
            <div className={`mt-8 flex justify-center space-x-4 ${
              state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${
                  state.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                }`}></div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className={`py-12 ${
          state.theme === 'dark' 
            ? 'bg-gray-900/90 backdrop-blur-sm border-t border-gray-800'
            : 'bg-gray-50 border-t border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FaHeart className={`text-2xl ${
                    state.theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                  <span className={`text-xl font-bold ${
                    state.theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>GriefBridge</span>
                </div>
                <p className={`${
                  state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  A compassionate platform for grief support, healing, and connection. You are never alone on your journey.
                </p>
                <div className="flex space-x-4">
                  {[FaFacebook, FaTwitter, FaInstagram, FaYoutube].map((Icon, i) => (
                    <button key={i} className={`p-2 rounded-full transition-all ${
                      state.theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                      <Icon className="text-xl" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className={`font-bold text-lg ${
                  state.theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Quick Links</h3>
                <ul className="space-y-2">
                  {['Home', 'Communities', 'Resources', 'Live Sessions', 'About Us', 'Contact'].map((item, i) => (
                    <li key={i}>
                      <button className={`transition-colors ${
                        state.theme === 'dark'
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}>
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className={`font-bold text-lg ${
                  state.theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Community Guidelines</h3>
                <ul className="space-y-2">
                  {['Safety First', 'Respectful Communication', 'Confidentiality', 'Support Resources', 'Reporting Issues'].map((item, i) => (
                    <li key={i}>
                      <button className={`transition-colors ${
                        state.theme === 'dark'
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}>
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className={`font-bold text-lg ${
                  state.theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Newsletter</h3>
                <p className={`${
                  state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Stay updated with new communities, resources, and support opportunities.
                </p>
                <div className={`flex space-x-2 ${
                  state.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <input
                    type="email"
                    placeholder="Your email address"
                    className={`flex-1 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      state.theme === 'dark'
                        ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <button className={`px-4 py-2 rounded-lg transition-all ${
                    state.theme === 'dark'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}>
                    Subscribe
                  </button>
                </div>
                <p className={`text-xs ${
                  state.theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  We respect your privacy. Unsubscribe anytime.
                </p>
              </div>
            </div>
            
            <div className={`mt-12 pt-8 border-t ${
              state.theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
            } text-center`}>
              <p className={`${
                state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                © {new Date().getFullYear()} GriefBridge. All rights reserved. • Privacy Policy • Terms of Service
              </p>
              <p className={`text-xs mt-2 ${
                state.theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                GriefBridge is not a replacement for professional mental health care. In crisis, contact your local emergency services or crisis hotline.
              </p>
            </div>
          </div>
        </footer>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className={`fixed top-16 right-4 w-80 rounded-xl shadow-xl z-50 ${
            state.theme === 'dark'
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
          }`}>
            <div className="p-4 border-b ${
              state.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }">
              <div className="flex justify-between items-center">
                <h3 className={`font-bold ${
                  state.theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Notifications</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className={`text-sm ${
                    state.theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Clear all
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {state.notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className={`mb-3 ${
                    state.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    <FaBell className="text-3xl mx-auto" />
                  </div>
                  <p className={`${
                    state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>No new notifications</p>
                </div>
              ) : (
                state.notifications.map((notification, index) => (
                  <div key={notification.id} className={`p-4 border-b ${
                    state.theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        notification.type === 'info'
                          ? state.theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                          : notification.type === 'success'
                          ? state.theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                          : state.theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'
                      }`}>
                        {notification.type === 'info' && <FaInfo className={`${
                          state.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`} />}
                        {notification.type === 'success' && <FaCheckCircle className={`${
                          state.theme === 'dark' ? 'text-green-400' : 'text-green-600'
                        }`} />}
                        {notification.type === 'warning' && <FaExclamationTriangle className={`${
                          state.theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                        }`} />}
                      </div>
                      <div className="flex-1">
                        <p className={`${
                          state.theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        }`}>{notification.message}</p>
                        <p className={`text-xs mt-1 ${
                          state.theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </ThemeContext.Provider>
  );
}