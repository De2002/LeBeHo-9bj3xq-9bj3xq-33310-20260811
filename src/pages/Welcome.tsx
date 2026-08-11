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
];

function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1);
  const [fading, setFading] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);
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

      <div className="absolute inset-x-0 bottom-0 p-8 lg:p-14">
        <p
          className="font-serif text-white/90 text-xl lg:text-2xl italic leading-snug max-w-lg"
          style={{ opacity: taglineFading ? 0 : 1, transition: 'opacity 0.6s ease-in-out' }}
        >
          "{TAGLINES[taglineIdx]}"
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
      <div className="relative lg:flex-1 h-[50vh] lg:h-auto">
        <HeroSlideshow />
        <div className="hidden lg:flex absolute top-10 left-10 items-baseline gap-1 z-10">
          <span className="font-serif text-5xl font-bold text-white tracking-tight">Le</span>
          <span className="font-serif text-5xl font-bold text-white/60 tracking-tight">BeHo</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:w-[460px] flex flex-col justify-center px-5 sm:px-8 py-10 lg:py-12 lg:px-12 bg-black border-l border-white/[0.08]">
        <div className="lg:hidden mb-6 flex items-baseline gap-1">
          <span className="font-serif text-4xl font-bold text-white">Le</span>
          <span className="font-serif text-4xl font-bold text-white/50">BeHo</span>
        </div>

        <p className="text-white/40 text-xs tracking-widest uppercase mb-3 font-medium">Let's Be Honest.</p>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
          A global inbox for what people really think.
        </h2>
        <p className="text-white/55 text-sm leading-relaxed mb-7">
          Subscribe to people, topics, and places. Read honest opinions from around the world.
          Agree, disagree, and share your own view — under a pseudonym that's yours to keep.
        </p>

        <div className="space-y-2.5 mb-8">
          {[
            { icon: Globe, text: 'Geographic scoping — global, country, city' },
            { icon: Hash, text: 'Topics: life, work, politics, tech, and more' },
            { icon: Users, text: 'Follow thinkers whose honesty you respect' },
            { icon: MapPin, text: 'Your inbox, your perspective, your voice' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-white/70" />
              </div>
              <span className="text-sm text-white/55">{text}</span>
            </div>
          ))}
        </div>

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
