import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/features/SEOHead';
import { Megaphone, Globe, Shield, BookOpen, Lock, Info, Users, MessageSquare, CheckCircle } from 'lucide-react';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--text-primary))]">
      <SEOHead
        title="About LeBeHo"
        description="LeBeHo (Let's Be Honest) is a pseudonymous platform for authentic expression. Learn about our mission, values, and the story behind the platform."
        url="/about"
      />
      <div className="sticky top-0 z-10 bg-[hsl(var(--background))]/95 backdrop-blur-sm border-b border-[hsl(var(--border-subtle))]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors">
            ← Back
          </button>
          <button onClick={() => navigate('/inbox')} className="flex items-baseline gap-0.5">
            <span className="font-serif text-lg font-bold text-[hsl(var(--accent-primary))]">Le</span>
            <span className="font-serif text-lg font-bold text-[hsl(var(--text-primary))]">BeHo</span>
          </button>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--accent-primary))]/10 flex items-center justify-center mx-auto mb-5">
            <Megaphone className="w-8 h-8 text-[hsl(var(--accent-primary))]" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-[hsl(var(--text-primary))] mb-4">Let's Be Honest.</h1>
          <p className="text-lg text-[hsl(var(--text-secondary))] leading-relaxed max-w-lg mx-auto">
            A global platform for authentic, reasoned opinions — where your identity is pseudonymous but your voice is real.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl p-8 mb-8">
          <h2 className="font-serif text-2xl font-bold text-[hsl(var(--text-primary))] mb-4">Our Mission</h2>
          <p className="text-[hsl(var(--text-secondary))] leading-relaxed mb-4">
            LeBeHo exists because honest discourse is increasingly rare. Social media platforms reward performance over authenticity — people say what gets likes, not what they actually think.
          </p>
          <p className="text-[hsl(var(--text-secondary))] leading-relaxed mb-4">
            We believe that when people can speak without fear of social repercussion — without their boss, family, or followers knowing it's them — they say what they really mean. Not to be anonymous and irresponsible, but to be pseudonymous and honest.
          </p>
          <p className="text-[hsl(var(--text-secondary))] leading-relaxed">
            Your LeBeHo identity is consistent and public. Others can follow your thinking over time, agree or disagree with you, and engage in real discussion. You're accountable to your ideas — just not to your real-world identity.
          </p>
        </div>

        {/* Values */}
        <div className="mb-8">
          <h2 className="font-serif text-xl font-bold text-[hsl(var(--text-primary))] mb-4">What We Stand For</h2>
          <div className="space-y-3">
            {[
              { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Radical Honesty', body: 'Say what you actually think. Not the safe version. Not the crowd-pleasing version. The real version.' },
              { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Global Perspective', body: 'Points can be scoped globally, by continent, country, or city — letting people speak to and hear from their own communities.' },
              { icon: Shield, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Protected Identity', body: 'Your email is never displayed. Your pseudonymous username is your only public identity. We will never voluntarily link the two.' },
              { icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Reasoned Discussion', body: 'Every point requires reasoning, not just conclusions. Comments are threaded and sortable. Agree/disagree counts are transparent.' },
              { icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10', title: 'Real Community', body: 'Follow thinkers you respect across topics you care about. Build a feed of perspectives that challenge and inform you.' },
            ].map((v, i) => (
              <div key={i} className="flex gap-4 p-5 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl">
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${v.bg} flex items-center justify-center mt-0.5`}>
                  <v.icon className={`w-4 h-4 ${v.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--text-primary))] mb-1">{v.title}</h3>
                  <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The name */}
        <div className="bg-[hsl(var(--accent-primary))]/5 border border-[hsl(var(--accent-primary))]/20 rounded-2xl p-6 mb-10 text-center">
          <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
            <span className="font-serif text-lg font-bold text-[hsl(var(--text-primary))]">"LeBeHo"</span> is short for <span className="italic">"Let's Be Honest."</span><br />
            It's a quiet invitation — and a quiet challenge. Every time you post, every time you comment, every time you vote: let's be honest about what we actually think.
          </p>
        </div>

        {/* Footer nav */}
        <div className="border-t border-[hsl(var(--border-subtle))] pt-8">
          <h3 className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest mb-4">More from LeBeHo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { to: '/guidelines', icon: Shield,   label: 'Community Guidelines', desc: 'Rules for healthy discourse' },
              { to: '/terms',      icon: BookOpen, label: 'Terms of Service',      desc: 'Rules for using the platform' },
              { to: '/privacy',    icon: Lock,     label: 'Privacy Policy',        desc: 'How we handle your data' },
            ].map(({ to, icon: Icon, label, desc }) => (
              <button key={to} onClick={() => navigate(to)} className="flex items-start gap-3 p-4 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl hover:border-[hsl(var(--accent-primary))]/30 transition-colors text-left">
                <Icon className="w-4 h-4 text-[hsl(var(--text-muted))] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{label}</p>
                  <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
