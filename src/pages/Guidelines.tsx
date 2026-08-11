import { useNavigate } from 'react-router-dom';
import { Shield, ChevronLeft, ExternalLink, AlertTriangle, CheckCircle, XCircle, BookOpen, Lock, Info } from 'lucide-react';
import { SEOHead } from '@/components/features/SEOHead';

const GUIDELINES = [
  {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Be Honest',
    body: 'Share what you genuinely think. LeBeHo exists for authentic voices — not performative opinions. If you believe it, say it clearly and stand behind it.'
  },
  {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Explain Your Reasoning',
    body: 'A point without reasoning is just noise. When you share a thought, explain why you hold it. Engage others with your logic, not just your conclusion.'
  },
  {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Disagree Respectfully',
    body: 'Disagreement is healthy and expected here. Challenge ideas — not people. Focus on arguments, not attacks. A well-reasoned disagreement strengthens the community.'
  },
  {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Protect Your Pseudonymity',
    body: 'Do not share your real name, location, workplace, or any information that compromises your pseudonymous identity — or anyone else\'s. Your LeBeHo identity is your shield.'
  },
  {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    title: 'No Hate Speech',
    body: 'Content that attacks, demeans, or calls for discrimination against individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin is prohibited.'
  },
  {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    title: 'No Harassment or Threats',
    body: 'Do not target, stalk, intimidate, or make threats toward other users. Repeated negative engagement directed at a specific person to cause distress is harassment and will not be tolerated.'
  },
  {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    title: 'No Doxxing',
    body: 'Never share private or personally identifying information about another user or any private individual without their consent — this includes real names, addresses, phone numbers, or photos.'
  },
  {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    title: 'No Misinformation',
    body: 'Do not deliberately spread false information presented as fact, particularly on matters of public health, elections, or safety. Opinions are welcome; deliberate deception is not.'
  },
  {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    title: 'No Spam or Manipulation',
    body: 'Do not create multiple accounts to manipulate votes, flood feeds with repetitive content, or use automated means to game engagement. One identity, one honest voice.'
  },
  {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    title: 'Content Warnings',
    body: 'For sensitive but permitted topics (graphic descriptions, trauma, mental health struggles), use appropriate framing in your title to signal the nature of the content to readers.'
  },
];

export default function Guidelines() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--text-primary))]">
      <SEOHead
        title="Community Guidelines"
        description="LeBeHo community rules: be honest, explain your reasoning, disagree respectfully. No hate speech, harassment, doxxing, or misinformation."
        url="/guidelines"
      />
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[hsl(var(--background))]/95 backdrop-blur-sm border-b border-[hsl(var(--border-subtle))]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
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
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--accent-primary))]/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-[hsl(var(--accent-primary))]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[hsl(var(--text-primary))] mb-3">Community Guidelines</h1>
          <p className="text-[hsl(var(--text-muted))] leading-relaxed max-w-md mx-auto">
            LeBeHo is built on radical honesty. These guidelines protect the space where authentic thinking can happen safely.
          </p>
          <p className="text-xs text-[hsl(var(--text-muted))]/60 mt-3">Last updated: August 2026</p>
        </div>

        {/* Preamble */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 mb-8">
          <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
            LeBeHo ("Let's Be Honest") is a pseudonymous platform for authentic expression. Your identity here is protected — your ideas stand on their own merit. With that freedom comes responsibility: to engage honestly, to challenge ideas not people, and to keep this a space where difficult truths can be spoken without fear or harm.
          </p>
          <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed mt-3">
            Violations of these guidelines may result in comment restrictions, thought removal, or account suspension depending on severity and pattern.
          </p>
        </div>

        {/* Guidelines */}
        <div className="space-y-4 mb-10">
          {GUIDELINES.map((g, i) => (
            <div key={i} className="flex gap-4 p-5 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl">
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${g.bg} flex items-center justify-center mt-0.5`}>
                <g.icon className={`w-4 h-4 ${g.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-[hsl(var(--text-primary))] mb-1.5">{g.title}</h3>
                <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{g.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reporting */}
        <div className="bg-[hsl(var(--accent-primary))]/5 border border-[hsl(var(--accent-primary))]/20 rounded-2xl p-6 mb-10">
          <h2 className="font-serif text-lg font-bold text-[hsl(var(--text-primary))] mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Reporting Violations
          </h2>
          <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
            If you see a comment that violates these guidelines, tap the ⋯ menu on the comment and select "Report". Our moderation team reviews all reports. Repeated or severe violations result in restrictions or removal. False reporting to harass others is itself a violation.
          </p>
        </div>

        {/* Footer nav */}
        <div className="border-t border-[hsl(var(--border-subtle))] pt-8">
          <h3 className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest mb-4">More from LeBeHo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { to: '/terms',   icon: BookOpen, label: 'Terms of Service', desc: 'Rules for using the platform' },
              { to: '/privacy', icon: Lock,     label: 'Privacy Policy',   desc: 'How we handle your data' },
              { to: '/about',   icon: Info,     label: 'About LeBeHo',     desc: 'Our mission and story' },
            ].map(({ to, icon: Icon, label, desc }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex items-start gap-3 p-4 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl hover:border-[hsl(var(--accent-primary))]/30 transition-colors text-left"
              >
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
