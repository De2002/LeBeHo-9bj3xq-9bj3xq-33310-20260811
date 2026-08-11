import { useNavigate } from 'react-router-dom';
import { Lock, ChevronLeft, Shield, BookOpen, Info } from 'lucide-react';
import { SEOHead } from '@/components/features/SEOHead';

const SECTIONS = [
  { title: 'What Data We Collect', body: 'We collect: (a) your email address, used only for authentication via OTP — we never display it publicly; (b) your chosen username and display name; (c) your bio and avatar image if you provide them; (d) the thoughts and comments you post; (e) your geographic interest selections for feed personalization; (f) your vote activity (agree/disagree) to calculate engagement counts; (g) standard server logs including IP addresses and access timestamps for security and abuse prevention.' },
  { title: 'What We Do Not Collect', body: 'We do not collect your real name, physical address, phone number, or any government-issued identification. We do not track you across the web using third-party cookies. We do not sell your data to advertisers. Your email address is never associated with your public pseudonymous identity.' },
  { title: 'How Your Data Is Used', body: 'Your data is used to: operate and deliver the LeBeHo service; send you authentication OTP codes; personalize your feed based on your geographic and topic interests; display your profile and content to other users; detect and prevent abuse and violations of our Community Guidelines; comply with legal obligations.' },
  { title: 'Pseudonymous Identity Protection', body: 'The pseudonymous nature of LeBeHo is fundamental. Your email is never visible to other users. Your public identity consists only of your username, display name, bio, avatar, and the content you choose to share. We will not voluntarily link your pseudonymous identity to your real-world identity except as required by law.' },
  { title: 'Data Storage and Security', body: 'Your data is stored securely on encrypted servers. We use industry-standard security practices including TLS encryption for data in transit and row-level security policies for database access. Avatar and image files are stored in secure cloud storage with access controls.' },
  { title: 'Data Retention', body: 'We retain your account data for as long as your account is active. If you delete your account, we will delete your profile data within 30 days. Content you posted (thoughts and comments) may be retained in anonymized form to preserve discussion integrity. Server logs are retained for up to 90 days.' },
  { title: 'Your Rights', body: 'You have the right to: access a copy of your personal data; request correction of inaccurate data; request deletion of your account and personal data; withdraw consent for data processing where consent is the legal basis; lodge a complaint with your local data protection authority.' },
  { title: 'Third-Party Services', body: 'LeBeHo uses Supabase for database and authentication infrastructure. Their privacy policy governs their data handling. We do not use advertising networks or sell user data to third parties.' },
  { title: 'Contact', body: 'For privacy-related requests, contact us at: privacy@lebelho.com' },
];

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--text-primary))]">
      <SEOHead
        title="Privacy Policy"
        description="LeBeHo Privacy Policy — what data we collect, how we protect your pseudonymous identity, and your rights over your data."
        url="/privacy"
      />
      <div className="sticky top-0 z-10 bg-[hsl(var(--background))]/95 backdrop-blur-sm border-b border-[hsl(var(--border-subtle))]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={() => navigate('/inbox')} className="flex items-baseline gap-0.5">
            <span className="font-serif text-lg font-bold text-[hsl(var(--accent-primary))]">Le</span>
            <span className="font-serif text-lg font-bold text-[hsl(var(--text-primary))]">BeHo</span>
          </button>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--accent-primary))]/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-[hsl(var(--accent-primary))]" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-[hsl(var(--text-muted))]">Last updated: August 2026</p>
        </div>

        <div className="space-y-6 mb-10">
          {SECTIONS.map((s, i) => (
            <div key={i}>
              <h2 className="font-semibold text-[hsl(var(--text-primary))] mb-2">{s.title}</h2>
              <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-[hsl(var(--border-subtle))] pt-8">
          <h3 className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest mb-4">Also Read</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { to: '/guidelines', icon: Shield,   label: 'Community Guidelines' },
              { to: '/terms',      icon: BookOpen, label: 'Terms of Service' },
              { to: '/about',      icon: Info,     label: 'About LeBeHo' },
            ].map(({ to, icon: Icon, label }) => (
              <button key={to} onClick={() => navigate(to)} className="flex flex-col items-center gap-2 p-4 bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-xl hover:border-[hsl(var(--accent-primary))]/30 transition-colors text-center">
                <Icon className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                <p className="text-xs text-[hsl(var(--text-primary))] font-medium leading-snug">{label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
