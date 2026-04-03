import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Users, Activity, Shield, Globe, Sparkles, Check } from 'lucide-react';
const NAV_LINKS = ['Features', 'How it Works', 'Pricing'];

const FEATURES = [
  {
    icon: Zap,
    color: '#6366f1',
    title: 'Real-Time Sync',
    desc: 'Every card move, edit, and update appears instantly for all teammates — no refresh, no lag.',
  },
  {
    icon: Users,
    color: '#ec4899',
    title: 'Live Presence',
    desc: 'See exactly who is online and what they are working on with live indicators and typing status.',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    color: '#f59e0b',
    title: 'Kanban Boards',
    desc: 'Drag and drop cards across columns. Assign priorities, due dates, and teammates to every task.',
  },
  {
    icon: Activity,
    color: '#10b981',
    title: 'Activity Log',
    desc: 'Every action is tracked. See a full history of who did what and when inside your workspace.',
  },
  {
    icon: Globe,
    color: '#3b82f6',
    title: 'Invite by Code',
    desc: 'Share an 8-character invite code to bring your team into a workspace in seconds.',
  },
  {
    icon: Shield,
    color: '#8b5cf6',
    title: 'Secure by Default',
    desc: 'JWT authentication, hashed passwords, and protected routes keep your data safe.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create a Workspace', desc: 'Set up a team workspace in seconds. Choose an icon, color, and name that fits your project.' },
  { step: '02', title: 'Invite Your Team', desc: 'Share the auto-generated invite code. Teammates join instantly — no email required.' },
  { step: '03', title: 'Collaborate Live', desc: 'Add tasks, move cards, and watch everything sync in real time across every device.' },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: '#6366f1',
    features: ['3 workspaces', 'Up to 10 members', 'Real-time board', 'Activity log (7 days)', 'Basic presence'],
    cta: 'Get started free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    color: '#ec4899',
    features: ['Unlimited workspaces', 'Unlimited members', 'Real-time board', 'Full activity history', 'Advanced presence', 'Priority support'],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$29',
    period: 'per month',
    color: '#10b981',
    features: ['Everything in Pro', 'Custom roles', 'Admin dashboard', 'SSO / SAML', 'SLA guarantee', 'Dedicated support'],
    cta: 'Contact sales',
    highlight: false,
  },
];

function GithubIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

export default function LandingPage() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0f0e1a] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#0f0e1a]/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold tracking-tight">LiveCollab</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <button key={l} onClick={() => scrollTo(l.toLowerCase().replace(' ', '-'))}
                className="text-sm text-slate-400 hover:text-white transition-colors">
                {l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link to="/register"
              className="text-sm bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-brand-500/25">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-600/15 rounded-full blur-3xl" />
          <div className="absolute top-40 left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-10 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-xs font-medium text-brand-300">Real-time collaboration, reimagined</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Your team,{' '}
            <span className="text-gradient">in sync</span>
            <br />always.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            LiveCollab is a real-time Kanban platform where your whole team sees every update the moment it happens. No refresh. No delays. Just flow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-brand-500/30 text-base w-full sm:w-auto justify-center">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={() => scrollTo('how-it-works')}
              className="flex items-center gap-2 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-8 py-4 rounded-2xl transition-all text-base w-full sm:w-auto justify-center">
              See how it works
            </button>
          </div>

          <p className="text-xs text-slate-600 mt-6">No credit card required · Free forever plan available</p>
        </div>

        {/* Hero board mockup */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="glass rounded-2xl border border-white/8 overflow-hidden shadow-[0_40px_100px_rgba(99,102,241,0.15)]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white/5 rounded-lg px-4 py-1 text-xs text-slate-500">livecollab.app/workspace/design-team</div>
              </div>
              <div className="flex -space-x-2">
                {['#6366f1','#ec4899','#10b981','#f59e0b'].map(c => (
                  <div key={c} className="w-6 h-6 rounded-full border-2 border-[#1a1730] flex items-center justify-center text-[9px] font-bold text-white" style={{ background: c }}>
                    {c === '#6366f1' ? 'J' : c === '#ec4899' ? 'S' : c === '#10b981' ? 'A' : 'M'}
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-[#1a1730] bg-white/10 flex items-center justify-center text-[9px] text-slate-400">+2</div>
              </div>
            </div>

            <div className="flex gap-4 p-4 overflow-x-auto bg-[#0d0c1a]">
              {[
                { title: 'Todo', color: '#6366f1', cards: ['Design system audit', 'Update onboarding flow', 'Write API docs'] },
                { title: 'In Progress', color: '#f59e0b', cards: ['Build auth module', 'Dashboard redesign'] },
                { title: 'On Hold', color: '#ef4444', cards: ['Performance review'] },
                { title: 'Completed', color: '#10b981', cards: ['Landing page v2', 'Set up CI/CD', 'User research'] },
              ].map(col => (
                <div key={col.title} className="flex-shrink-0 w-52">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-xs font-semibold text-slate-300">{col.title}</span>
                    <span className="text-xs text-slate-600 bg-white/5 px-1.5 rounded-full">{col.cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.cards.map((card, i) => (
                      <div key={i} className="bg-[#16132a] border border-white/6 rounded-xl p-3">
                        <p className="text-xs text-slate-300 font-medium leading-snug">{card}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
                            style={{ background: ['#6366f1','#ec4899','#10b981','#f59e0b'][i % 4] }}>
                            {['J','S','A','M'][i % 4]}
                          </div>
                          <div className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                            style={{ background: ['#10b98120','#f59e0b20','#ef444420'][i % 3], color: ['#10b981','#f59e0b','#ef4444'][i % 3] }}>
                            {['low','medium','high'][i % 3]}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-300 font-medium">4 teammates online right now</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-medium mb-3 tracking-wider uppercase">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything your team needs</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Built for speed, designed for clarity. LiveCollab has all the tools to keep your team moving.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="glass-light rounded-2xl p-6 hover:border-brand-500/20 transition-all duration-300 group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300"
                  style={{ background: f.color + '20', border: `1px solid ${f.color}30` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-28 px-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-1/2 w-96 h-96 bg-brand-600/8 rounded-full blur-3xl -translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-medium mb-3 tracking-wider uppercase">How it Works</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Up and running in minutes</h2>
            <p className="text-slate-400 text-lg">No onboarding calls. No lengthy setup. Just create, invite, and collaborate.</p>
          </div>

          <div className="space-y-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex gap-6 items-start glass-light rounded-2xl p-6">
                <div className="text-4xl font-bold text-gradient flex-shrink-0 leading-none">{step.step}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-medium mb-3 tracking-wider uppercase">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-400 text-lg">Start free. Scale when you need to.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRICING.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-6 flex flex-col relative ${plan.highlight ? 'border-2' : 'glass-light'}`}
                style={plan.highlight ? { background: plan.color + '10', border: `2px solid ${plan.color}40` } : {}}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-400 mb-2">{plan.name}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-500 text-sm mb-1">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: plan.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/register"
                  className="text-center py-3 rounded-xl text-sm font-semibold transition-all"
                  style={plan.highlight
                    ? { background: plan.color, color: 'white', boxShadow: `0 8px 24px ${plan.color}40` }
                    : { background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <div className="text-5xl mb-6">⚡</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to collaborate in real time?</h2>
              <p className="text-slate-400 mb-8 text-lg">Join teams already using LiveCollab to move faster and stay in sync.</p>
              <Link to="/register"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-brand-500/30 text-base">
                Create your free workspace <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" fill="white" />
              </div>
              <span className="font-bold text-white">LiveCollab</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-slate-500">
              {NAV_LINKS.map(l => (
                <button key={l} onClick={() => scrollTo(l.toLowerCase().replace(' ', '-'))}
                  className="hover:text-white transition-colors">{l}</button>
              ))}
              <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
            </div>

            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <GithubIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
</a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <p>© 2024 LiveCollab. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}