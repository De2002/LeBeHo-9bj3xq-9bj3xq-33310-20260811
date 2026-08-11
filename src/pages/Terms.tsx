import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronLeft, Shield, Info, Lock } from 'lucide-react';
import { SEOHead } from '@/components/features/SEOHead';

const SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By creating an account and using LeBeHo, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform. We may update these terms from time to time; continued use of the platform after changes constitutes acceptance.' },
  { title: '2. Pseudonymous Identity', body: 'LeBeHo is a pseudonymous platform. You create and maintain a public identity (username) that is not tied to your real-world identity. You are responsible for keeping your account credentials secure. You may not impersonate other LeBeHo users or real individuals.' },
  { title: '3. User Content', body: 'You retain ownership of the thoughts and comments you post on LeBeHo. By posting content, you grant LeBeHo a non-exclusive, royalty-free license to display, distribute, and store your content for the purposes of operating the platform. You represent that you have the right to post any content you submit.' },
  { title: '4. Prohibited Conduct', body: 'You agree not to: (a) post content that violates our Community Guidelines; (b) use the platform for illegal purposes; (c) attempt to gain unauthorized access to other accounts or systems; (d) use automated means to interact with the platform; (e) sell or transfer your account to another person; (f) collect user data without consent.' },
  { title: '5. Content Moderation', body: 'LeBeHo reserves the right to remove content that violates our Community Guidelines, restrict accounts that repeatedly violate guidelines, and cooperate with law enforcement as required by applicable law. We aim to enforce these policies fairly and consistently, but moderation decisions are final.' },
  { title: '6. Disclaimer of Warranties', body: 'LeBeHo is provided "as is" without warranties of any kind. We do not guarantee that the platform will be uninterrupted, error-free, or that content will be accurate. Opinions expressed by users are their own and do not represent LeBeHo\'s views.' },
  { title: '7. Limitation of Liability', body: 'To the maximum extent permitted by law, LeBeHo shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to loss of data, reputation, or revenue.' },
  { title: '8. Account Termination', body: 'You may delete your account at any time. LeBeHo may suspend or terminate your account for violations of these terms or our Community Guidelines. Upon termination, your right to use the platform ceases; however, content you have posted may remain visible to preserve discussion integrity unless you request removal.' },
  { title: '9. Governing Law', body: 'These terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these terms or your use of LeBeHo shall be resolved through good-faith negotiation or, if necessary, binding arbitration.' },
  { title: '10. Contact', body: 'For questions about these Terms, reach us at: legal@lebelho.com' },
];

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--text-primary))]">
      <SEOHead
        title="Terms of Service"
        description="LeBeHo Terms of Service — rules for using the platform, user content, content moderation, and account terms."
        url="/terms"
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
            <BookOpen className="w-7 h-7 text-[hsl(var(--accent-primary))]" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Terms of Service</h1>
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
              { to: '/guidelines', icon: Shield,  label: 'Community Guidelines' },
              { to: '/privacy',    icon: Lock,    label: 'Privacy Policy' },
              { to: '/about',      icon: Info,    label: 'About LeBeHo' },
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
