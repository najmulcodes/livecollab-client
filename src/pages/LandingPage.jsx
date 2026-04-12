
import React from 'react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const isLoggedIn = !!(user && token);

  return (
    <>
      <style>{`
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap");

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0B0F14;
  --surface: #111827;
  --amber: #F59E0B;
  --amber-dim: #D97706;
  --amber-glow: rgba(245,158,11,0.15);
  --white: #E5E7EB;
  --muted: rgba(229,231,235,0.5);
  --subtle: rgba(229,231,235,0.18);
  --glass: rgba(255,255,255,0.04);
  --glass-border: rgba(255,255,255,0.08);
}

html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--white); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

/* ── NAV ── */
.lc-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 16px 48px;
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(11,15,20,0.92);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  backdrop-filter: blur(12px);
  height: 68px;
}
.lc-nav-logo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px; font-weight: 600;
  letter-spacing: 0.12em; color: var(--white);
  display: flex; align-items: center; gap: 10px;
  text-decoration: none;
}
.lc-logo-icon { width: 28px; height: 28px; }
.lc-nav-center { display: flex; gap: 32px; list-style: none; }
.lc-nav-center a { font-size: 13px; font-weight: 400; color: var(--muted); text-decoration: none; letter-spacing: 0.03em; transition: color 0.2s; }
.lc-nav-center a:hover { color: var(--white); }
.lc-nav-right { display: flex; align-items: center; gap: 10px; }
.lc-btn-ghost {
  font-size: 13px; font-weight: 500; color: var(--muted); text-decoration: none;
  border: 1px solid rgba(255,255,255,0.1); padding: 8px 18px; border-radius: 8px;
  transition: all 0.2s; letter-spacing: 0.04em;
  background: transparent; cursor: pointer; font-family: inherit;
  display: inline-flex; align-items: center; gap: 6px;
}
.lc-btn-ghost:hover { color: var(--white); border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); }
.lc-btn-amber {
  font-size: 13px; font-weight: 600; color: #0B0F14; background: var(--amber);
  border: none; padding: 9px 20px; border-radius: 8px;
  transition: all 0.2s; letter-spacing: 0.05em; cursor: pointer; font-family: inherit;
  text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
  box-shadow: 0 4px 20px rgba(245,158,11,0.25);
}
.lc-btn-amber:hover { box-shadow: 0 6px 30px rgba(245,158,11,0.4); transform: translateY(-1px); }

/* ── HERO ── */
.lc-hero {
  position: relative;
  /* FIX Issue 9: min-height accounts for nav + ensures no overflow */
  min-height: calc(100vh - 68px);
  margin-top: 68px; /* push below fixed nav */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.lc-hero-scene {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 65% 55%, rgba(245,158,11,0.18) 0%, rgba(184,121,48,0.08) 40%, transparent 70%),
    radial-gradient(ellipse 100% 70% at 50% 100%, rgba(245,158,11,0.05) 0%, transparent 60%),
    radial-gradient(ellipse 100% 60% at 50% 50%, rgba(13,17,23,1) 0%, rgba(11,15,20,1) 100%);
  z-index: 0;
}
.lc-sunset-orb {
  position: absolute; width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(245,158,11,0.3) 0%, rgba(220,120,30,0.12) 40%, transparent 70%);
  top: 45%; right: 10%; transform: translateY(-55%);
  filter: blur(50px); z-index: 1; pointer-events: none;
}
.lc-hero-bg {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(11,15,20,0.4) 0%, rgba(11,15,20,0.2) 40%, rgba(11,15,20,0.6) 100%);
  z-index: 2;
}

/* Rock SVG */
.lc-hero-rock {
  position: absolute; bottom: 12%; left: 52%;
  transform: translateX(-20%); z-index: 2; opacity: 0.6;
  width: clamp(200px, 35vw, 480px); height: auto;
  pointer-events: none;
}

/* Hero content */
.lc-hero-content {
  position: relative; z-index: 10;
  padding: 30px 80px 90px;
  max-width: 640px;
  /* FIX Issue 9: flex:1 so content fills space above stats */
  flex: 1;
}
.lc-eyebrow {
  font-size: 10px; font-weight: 600; letter-spacing: 0.3em; color: var(--amber);
  margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
}
.lc-eyebrow::before { content: ''; display: block; width: 24px; height: 1px; background: var(--amber); opacity: 0.7; }
.lc-hero-h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(44px, 6vw, 80px); font-weight: 300;
  line-height: 1.08; color: var(--white); margin-bottom: 20px;
}
.lc-hero-h1 em { font-style: italic; color: var(--amber); font-weight: 400; }
.lc-hero-desc {
  font-size: 16px; line-height: 1.75; color: var(--muted);
  max-width: 420px; margin-bottom: 20px; font-weight: 300;
}
.lc-hero-cta {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 600; letter-spacing: 0.08em; margin-bottom: 20px;
  text-decoration: none; color: #0B0F14; background: var(--amber);
  padding: 15px 36px; border-radius: 10px; transition: all 0.25s;
  box-shadow: 0 8px 30px rgba(245,158,11,0.3);
}
.lc-hero-cta:hover { box-shadow: 0 12px 40px rgba(245,158,11,0.45); transform: translateY(-2px); }
.lc-cta-arrow { transition: transform 0.2s; }
.lc-hero-cta:hover .lc-cta-arrow { transform: translateX(5px); }

/* ── Stats
 * FIX Issue 9: On desktop, position absolute at bottom.
 * On mobile, position relative (in-flow) after content.
 * This prevents the stats from overlapping the CTA button.
 * ── */
.lc-stats-desktop {
  position: absolute; bottom: 20px; left: 80px; z-index: 10;
  display: flex; gap: 0 margin-top: 14px;
}
.lc-stats-mobile {
  display: none; /* hidden by default, shown via media query */
  position: relative; z-index: 10;
  padding: 24px 20px 32px;
  gap: 0;
}
.lc-stat-item { padding: 0 28px; }
.lc-stat-item:first-child { padding-left: 0; }
.lc-stat-num {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px; font-weight: 600; color: var(--white); line-height: 1; margin-bottom: 4px;
}
.lc-stat-num span { color: var(--amber); }
.lc-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.05em; }
.lc-stat-div { width: 1px; background: rgba(255,255,255,0.08); align-self: stretch; margin: 4px 0; }

/* ── SECTIONS ── */
.lc-section { padding: 100px 80px; }
.lc-section-label { font-size: 10px; letter-spacing: 0.3em; color: var(--amber); font-weight: 600; margin-bottom: 14px; display: block; }
.lc-section-h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(32px, 4vw, 50px); font-weight: 300; line-height: 1.1; color: var(--white); margin-bottom: 16px; }
.lc-section-desc { font-size: 15px; color: var(--muted); line-height: 1.7; max-width: 480px; font-weight: 300; }

/* ── FEATURES ── */
#lc-features { background: rgba(17,24,39,0.5); border-top: 1px solid rgba(255,255,255,0.06); }
.lc-features-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 80px; align-items: start; }
.lc-features-intro { position: sticky; top: 100px; }
.lc-feature-list { display: flex; flex-direction: column; gap: 2px; }
.lc-feature-item { padding: 24px 28px; border: 1px solid transparent; border-bottom: 1px solid rgba(255,255,255,0.06); border-radius: 10px; transition: all 0.25s; }
.lc-feature-item:hover { border-color: rgba(245,158,11,0.15); background: rgba(245,158,11,0.03); }
.lc-feature-num { font-family: 'Cormorant Garamond', serif; font-size: 11px; color: var(--amber); opacity: 0.8; margin-bottom: 8px; letter-spacing: 0.1em; }
.lc-feature-title { font-size: 15px; font-weight: 600; color: var(--white); margin-bottom: 6px; }
.lc-feature-desc { font-size: 13px; color: var(--muted); line-height: 1.65; font-weight: 300; }

/* ── HOW IT WORKS ── */
#lc-how { border-top: 1px solid rgba(255,255,255,0.06); }
.lc-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 56px; }
.lc-step-card { padding: 36px 28px; background: rgba(17,24,39,0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; position: relative; overflow: hidden; transition: all 0.25s; }
.lc-step-card:hover { border-color: rgba(245,158,11,0.2); background: rgba(245,158,11,0.03); }
.lc-step-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--amber), transparent); opacity: 0; transition: opacity 0.3s; }
.lc-step-card:hover::before { opacity: 1; }
.lc-step-num { font-family: 'Cormorant Garamond', serif; font-size: 56px; font-weight: 700; color: var(--amber); opacity: 0.12; line-height: 1; margin-bottom: 20px; display: block; }
.lc-step-title { font-size: 17px; font-weight: 600; color: var(--white); margin-bottom: 10px; }
.lc-step-desc { font-size: 13px; color: var(--muted); line-height: 1.65; font-weight: 300; }

/* ── CTA BAND ── */
.lc-cta-band { border-top: 1px solid rgba(255,255,255,0.06); padding: 100px 80px; background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 70%); text-align: center; }
.lc-cta-band .lc-section-h2 { max-width: 600px; margin: 0 auto 14px; }
.lc-cta-band .lc-section-desc { max-width: 400px; margin: 0 auto 36px; text-align: center; }

/* ── FOOTER ── */
.lc-footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 36px 80px; display: flex; align-items: center; justify-content: space-between; }
.lc-footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 17px; letter-spacing: 0.1em; color: var(--muted); }
.lc-footer-links { display: flex; gap: 28px; }
.lc-footer-links a { font-size: 12px; color: var(--subtle); text-decoration: none; transition: color 0.2s; }
.lc-footer-links a:hover { color: var(--muted); }
.lc-footer-copy { font-size: 11px; color: var(--subtle); }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

/* ── RESPONSIVE ──
 * FIX Issue 9: below 768px, stats switch from absolute to in-flow
 * ── */
@media (max-width: 1024px) {
  .lc-nav { padding: 14px 24px; }
  .lc-nav-center { display: none; }
  .lc-section { padding: 72px 24px; }
  .lc-features-layout { grid-template-columns: 1fr; gap: 40px; }
  .lc-features-intro { position: static; }
  .lc-steps-grid { grid-template-columns: 1fr; }
  .lc-cta-band { padding: 72px 24px; }
  .lc-footer { flex-direction: column; gap: 20px; padding: 28px 24px; text-align: center; }
  .lc-footer-links { flex-wrap: wrap; justify-content: center; gap: 16px; }
  .lc-sunset-orb { width: 300px; height: 300px; right: -50px; }
}

@media (max-width: 768px) {
  /* Hero */
  .lc-hero-content { padding: 40px 24px 32px; max-width: 100%; }
  .lc-hero-h1 { font-size: clamp(36px, 9vw, 56px); }

  /* FIX Issue 9: hide absolute stats, show in-flow stats */
  .lc-stats-desktop { display: none; }
  .lc-stats-mobile   { display: flex; }
  .lc-stat-item { padding: 0 16px; }
  .lc-stat-num { font-size: 22px; }

  /* Hero rock smaller on mobile */
  .lc-hero-rock { left: 40%; width: clamp(160px, 50vw, 280px); opacity: 0.4; }
}

@media (max-width: 480px) {
  .lc-hero-content { padding: 32px 20px 24px; }
  .lc-hero-h1 { font-size: 34px; }
  .lc-hero-desc { font-size: 14px; }
  .lc-hero-cta { padding: 13px 28px; font-size: 12px; }
  .lc-stat-item { padding: 0 10px; }
  .lc-stat-num { font-size: 18px; }
  .lc-stat-label { font-size: 10px; }
}
      `}</style>

      {/* NAV */}
      <nav className="lc-nav">
        <a href="/" className="lc-nav-logo">
          <svg className="lc-logo-icon" viewBox="0 0 32 32" fill="none">
            <path d="M8 8 L20 28 L23 21 L29 18 Z" fill="#6366f1"/>
            <circle cx="27" cy="7" r="3.5" fill="#F59E0B"/>
            <line x1="10" y1="8" x2="27" y2="7" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5"/>
          </svg>
          LIVECOLLAB
        </a>

        <ul className="lc-nav-center">
<li><a href="#lc-hero">Home</a></li>          <li><a href="#lc-features">Platform</a></li>
          <li><a href="#lc-how">How it works</a></li>
          <li><a href="#lc-cta">Pricing</a></li>
        </ul>

        {/* FIX Issue 11: dynamic auth-aware nav */}
        <div className="lc-nav-right">
          {isLoggedIn ? (
            <>
              <button className="lc-btn-ghost" onClick={() => navigate('/dashboard')}>
                Dashboard
              </button>
              <button className="lc-btn-amber" onClick={() => navigate('/dashboard')}>
                My Workspaces →
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="lc-btn-ghost">Sign In</a>
              <a href="/register" className="lc-btn-amber">Get Started →</a>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
<section className="lc-hero" id="lc-hero">
          <div className="lc-hero-scene" />
        <div style={{ position:'absolute',width:'500px',height:'500px',borderRadius:'50%',background:'radial-gradient(circle, rgba(245,158,11,0.3) 0%, rgba(220,120,30,0.12) 40%, transparent 70%)',top:'45%',right:'10%',transform:'translateY(-55%)',filter:'blur(50px)',zIndex:1,pointerEvents:'none' }} className="lc-sunset-orb" />
        <div className="lc-hero-bg" />

        {/* Rock SVG */}
        <svg className="lc-hero-rock" viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="250" cy="280" rx="200" ry="18" fill="rgba(245,158,11,0.06)"/>
          <path d="M160 240 C155 220 148 200 152 180 C156 160 162 145 170 130 C178 115 188 105 200 98 C212 91 220 92 228 95 C240 90 252 88 262 92 C275 88 285 92 295 100 C308 110 318 125 325 145 C332 165 335 185 332 205 C328 225 322 238 315 248 C290 255 270 258 250 258 C230 258 200 252 180 248 Z" fill="rgba(17,24,39,0.95)" stroke="rgba(245,158,11,0.12)" strokeWidth="1"/>
          <path d="M190 145 C205 130 225 122 245 120 C265 118 282 125 295 138" stroke="rgba(245,158,11,0.18)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M185 262 C205 268 230 271 250 271 C270 271 295 268 315 262" stroke="rgba(245,158,11,0.06)" strokeWidth="0.8" fill="none"/>
        </svg>

        {/* Hero content */}
        <div className="lc-hero-content">
          <p className="lc-eyebrow">THE SMARTEST THING YOU CAN DO</p>
          <h1 className="lc-hero-h1">
            Smarter<br/>
            Collaboration<br/>
            <em>Begins Now</em>
          </h1>
          <p className="lc-hero-desc">
            Real-time sync decodes team complexity — turning parallel work into coordinated, flowing execution.
          </p>
          <a href={isLoggedIn ? '/dashboard' : '/register'} className="lc-hero-cta">
            {isLoggedIn ? 'Go to Dashboard' : 'Start Now'}
            <span className="lc-cta-arrow">→</span>
          </a>
        </div>

        {/* Stats — desktop: absolute positioned | mobile: in-flow */}
        {/* FIX Issue 9: Two separate elements controlled by CSS media queries */}
        <div className="lc-stats-desktop">
          <StatsContent />
        </div>
        <div className="lc-stats-mobile">
          <StatsContent />
        </div>
      </section>

      {/* FEATURES */}
      <section className="lc-section" id="lc-features">
        <div className="lc-features-layout">
          <div className="lc-features-intro">
            <span className="lc-section-label">PLATFORM</span>
            <h2 className="lc-section-h2">Everything your team needs to move as one</h2>
            <p className="lc-section-desc">Built for speed, clarity, and real-time presence. No overhead. No lag. Just flow.</p>
          </div>
          <div className="lc-feature-list">
            {[
              ['01','Real-Time Sync','Every card move and update appears instantly across all sessions — no refresh, zero delay.'],
              ['02','Live Presence','See who\'s online and exactly what they\'re working on with live status indicators.'],
              ['03','Kanban Boards','Drag and drop cards across columns. Assign priorities, due dates, and teammates to every task.'],
              ['04','Activity Log','Every action is tracked. A full, timestamped history of who did what across your workspace.'],
              ['05','Invite by Code','Share an 8-character code. Teammates join instantly — no email invites, no friction.'],
              ['06','Secure by Default','JWT auth, hashed passwords, and protected API routes. Secure without configuration.'],
            ].map(([num, title, desc]) => (
              <div key={num} className="lc-feature-item">
                <div className="lc-feature-num">{num}</div>
                <div className="lc-feature-title">{title}</div>
                <div className="lc-feature-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lc-section" id="lc-how">
        <span className="lc-section-label">HOW IT WORKS</span>
        <h2 className="lc-section-h2">Up and running in minutes</h2>
        <div className="lc-steps-grid">
          {[
            ['01','Create a Workspace','Set up a team workspace in seconds. Choose an icon, color, and name that fits your project.'],
            ['02','Invite Your Team','Share the auto-generated invite code. Teammates join instantly — no email required.'],
            ['03','Collaborate Live','Add tasks, move cards, and watch everything sync in real time across every connected device.'],
          ].map(([num, title, desc]) => (
            <div key={num} className="lc-step-card">
              <span className="lc-step-num">{num}</span>
              <div className="lc-step-title">{title}</div>
              <p className="lc-step-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <div className="lc-cta-band" id="lc-cta">
        <h2 className="lc-section-h2">Ready to collaborate in real time?</h2>
        <p className="lc-section-desc">Join teams already using LiveCollab to move faster and stay in sync.</p>
        <a href={isLoggedIn ? '/dashboard' : '/register'} className="lc-hero-cta">
          {isLoggedIn ? 'Open Dashboard' : 'Create your free workspace'}
          <span className="lc-cta-arrow">→</span>
        </a>
      </div>

      {/* FOOTER */}
      <footer className="lc-footer">
        <div className="lc-footer-logo">LIVECOLLAB</div>
        <div className="lc-footer-links">
          <a href="#lc-features">Platform</a>
          <a href="#lc-how">How it works</a>
          <a href="/login">Sign in</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
        <div className="lc-footer-copy">© 2025 LiveCollab</div>
      </footer>
    </>
  );
}

// ─── Reusable stats content (rendered twice for CSS breakpoint trick) ─────────
function StatsContent() {
  return (
    <>
      <div className="lc-stat-item">
        <div className="lc-stat-num"><span>+</span>83<span>%</span></div>
        <div className="lc-stat-label">Avg team velocity increase</div>
      </div>
      <div className="lc-stat-div" />
      <div className="lc-stat-item">
        <div className="lc-stat-num">3,427</div>
        <div className="lc-stat-label">Active workspaces</div>
      </div>
      <div className="lc-stat-div" />
      <div className="lc-stat-item">
        <div className="lc-stat-num">107<span>k+</span></div>
        <div className="lc-stat-label">Global users</div>
      </div>
    </>
  );
}
