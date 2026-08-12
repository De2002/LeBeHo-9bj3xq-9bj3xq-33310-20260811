import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Globe, Hash, Users, MapPin, ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/features/SEOHead';

import hero1 from '@/assets/hero1.jpg';
import hero2 from '@/assets/hero2.jpg';
import hero3 from '@/assets/hero3.jpg';
import hero4 from '@/assets/hero4.jpg';
import hero5 from '@/assets/hero5.jpg';
import hero6 from '@/assets/hero6.jpg';
import hero7 from '@/assets/hero7.jpg';
import hero8 from '@/assets/hero8.jpg';
import hero9 from '@/assets/hero9.jpg';

const HERO_IMAGES = [hero1, hero2, hero3, hero4, hero5, hero6, hero7, hero8, hero9];

const TAGLINES = [
  'What do you really have to say?',
  'What truth have you been keeping to yourself?',
  "What's the honest opinion you're afraid to share?",
  'What do you actually think about the world?',
  'What would you say if no one knew it was you?',
  "What's the thought you can't stop thinking?",
  'What does the world need to hear from you?',
  'What\'s something you think people get completely wrong?',
  'What\'s something you\'ve always wanted to say?',
  'What do you wish more people understood?',
  'What\'s a truth people don\'t like hearing?',
  'What\'s something you strongly agree or disagree with?',
  'What deserves to be said out loud?',
  'What\'s something you believe that others might disagree with?',
  'What are we pretending isn\'t true?',
  'What\'s something everyone should be talking about?',
  'What\'s your take? What would you say if nobody could judge you?',
  'What\'s an uncomfortable truth you\'ve learned?',
  'What\'s something people need to hear?',
  'What popular opinion do you disagree with?',
  'What\'s something you\'ve changed your mind about?',
];

function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1);
  const [fading, setFading] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [typedTagline, setTypedTagline] = useState('');
  const [taglineFading, setTaglineFading] = useState(false);

  const advance = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setCurrent(prev => {
        const n = (prev + 1) % HERO_IMAGES.length;
        setNext((n + 1) % HERO_IMAGES.length);
        return n;
      });
      setFading(false);
    }, 1800);
  }, []);

  const advanceTagline = useCallback(() => {
    setTaglineFading(true);
    setTimeout(() => {
      setTaglineIdx(prev => (prev + 1) % TAGLINES.length);
      setTaglineFading(false);
    }, 600);
  }, []);

  useEffect(() => {
    const getDelay = () => 10000 + Math.random() * 4000;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => { advance(); schedule(); }, getDelay());
    };
    schedule();
    return () => clearTimeout(timer);
  }, [advance]);

  useEffect(() => {
    const tagline = TAGLINES[taglineIdx];
    setTypedTagline('');
    let character = 0;
    const timer = setInterval(() => {
      character += 1;
      setTypedTagline(tagline.slice(0, character));
      if (character >= tagline.length) clearInterval(timer);
    }, 55);

    return () => clearInterval(timer);
  }, [taglineIdx]);

  useEffect(() => {
    const getDelay = () => 7000 + Math.random() * 4000;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => { advanceTagline(); schedule(); }, getDelay());
    };
    const initial = setTimeout(() => { schedule(); }, 5000);
    return () => { clearTimeout(timer); clearTimeout(initial); };
  }, [advanceTagline]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        key={`cur-${current}`}
        src={HERO_IMAGES[current]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 1.8s ease-in-out' }}
      />
      <img
        key={`next-${next}`}
        src={HERO_IMAGES[next]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: fading ? 1 : 0, transition: 'opacity 1.8s ease-in-out' }}
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] lg:p-14">
        <p
          aria-live="polite"
          className="font-serif text-white/90 text-sm sm:text-base lg:text-2xl leading-relaxed max-w-lg bg-black/35 px-3 py-2 rounded-lg backdrop-blur-[2px] lg:bg-transparent lg:px-0 lg:py-0 lg:rounded-none lg:backdrop-blur-0"
          style={{ opacity: taglineFading ? 0 : 1, transition: 'opacity 0.6s ease-in-out' }}
        >
          {typedTagline}
          <span aria-hidden="true" className="ml-0.5 inline-block w-px h-4 lg:h-6 align-[-0.15em] bg-white/70" />
        </p>
      </div>
    </div>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row">  
      <SEOHead
        title="Let's Be Honest — Share your real opinion"
        description="LeBeHo is a pseudonymous social platform for authentic opinions. Say what you really think about life, society, politics, relationships and more — without revealing your identity."
        url="/welcome"
      />
      {/* Slideshow panel */}
      <div className="relative lg:flex-1 h-[clamp(18rem,56svh,32rem)] lg:h-auto">
        <HeroSlideshow />
        <div className="hidden lg:flex absolute top-10 left-10 items-baseline gap-1 z-10">
          <span className="font-serif text-5xl font-bold text-white tracking-tight">Le</span>
          <span className="font-serif text-5xl font-bold text-white/60 tracking-tight">BeHo</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:w-[460px] flex flex-col justify-center px-5 sm:px-8 py-7 lg:py-12 lg:px-12 bg-black border-l border-white/[0.08]">
        <div className="lg:hidden mb-4 flex items-baseline gap-1">
          <span className="font-serif text-4xl font-bold text-white">Le</span>
          <span className="font-serif text-4xl font-bold text-white/50">BeHo</span>
        </div>

        <p className="text-white/40 text-xs tracking-widest uppercase mb-2 lg:mb-3 font-medium">Let's Be Honest.</p>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2 lg:mb-3 leading-tight">
          A global inbox for what people have to say.
        </h2>
        <p className="text-white/55 text-sm leading-relaxed mb-5 lg:mb-7">
          Follow people, topics, and places. Get their Points delivered to your inbox, from the conversations happening around the world to what&apos;s being said right where you are.
          <br /><br />
          Read the Point. See why they believe it. Agree or disagree. Then make your own.
          <br /><br />
          No real name required. Say what you mean under a pseudonym that&apos;s yours.
          <br /><br />
          Global or local. Your choice.
        </p>

        <div className="space-y-2 mb-6 lg:space-y-2.5 lg:mb-8">
          {[
            { icon: Globe, text: 'Discover Points from around the world' },
            { icon: MapPin, text: 'Follow countries and cities' },
            { icon: Hash, text: 'Explore topics like life, work, politics, technology, culture, and more' },
            { icon: Users, text: 'Follow people whose perspectives interest you' },
            { icon: Users, text: 'Agree, disagree, and explain why' },
            { icon: ArrowRight, text: 'Make your own Point and put it out there' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-white/70" />
              </div>
              <span className="text-sm text-white/55">{text}</span>
            </div>
          ))}
        </div>

        <p className="font-serif text-lg text-white/75 leading-relaxed mb-6 lg:mb-8">
          Your inbox. Their Points. Your perspective.
        </p>

        {/* Authenticated: go to inbox */}
        {user ? (
          <button
            onClick={() => navigate('/inbox')}
            className="flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-black font-semibold text-base px-8 py-3.5 rounded-xl transition-colors w-full"
          >
            Go to Inbox
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-black font-semibold text-base px-8 py-3.5 rounded-xl transition-colors w-full"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/explore')}
              className="flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-medium text-sm px-8 py-3 rounded-xl transition-colors mt-3 w-full"
            >
              <Globe className="w-4 h-4" />
              Browse as Guest
            </button>

            <p className="text-xs text-white/25 mt-4 text-center">
              Your real name stays private. LeBeHo is pseudonymous by design.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
