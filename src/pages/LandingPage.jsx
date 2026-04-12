/**
 * LandingPage.jsx — Marketing / home page
 *
 * CHANGES vs previous version:
 *   Issue B: Nav now uses shared <Navbar /> component with position="fixed".
 *            Before login: Home | Create Workspace → /register | Sign In
 *            After login:  Home | Dashboard | Sign Out
 *            Hero section uses margin-top:60px to clear fixed navbar.
 *
 * PRESERVED: all hero content, features, steps, CTA band, footer.
 * ONLY the <nav> section is replaced with <Navbar />.
 */
import React from 'react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';

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
  --amber: #F59E0B;
  --white: #E5E7EB;
  --muted: rgba(229,231,235,0.5);
  --subtle: rgba(229,231,235,0.18);
  --glass-border: rgba(255,255,255,0.08);
}

html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--white); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

/* ── HERO ── */
.lc-hero {
  position: relative;
  min-height: calc(100vh - 60px); /* 60px = Navbar height */
  margin-top: 60px;               /* clear fixed Navbar */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.lc-hero-scene {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 65% 55%, rgba(245,158,11,0.16) 0%, rgba(184,121,48,0.07) 40%, transparent 70%),
    radial-gradient(ellipse 100% 70% at 50% 100%, rgba(245,158,11,0.04) 0%, transparent 60%),
    radial-gradient(ellipse 100% 60% at 50% 50%, rgba(13,17,23,1) 0%, rgba(11,15,20,1) 100%);
  z-index: 0;
}
.lc-sunset-orb {
  position: absolute;
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(245,158,11,0.28) 0%, rgba(220,120,30,0.1) 40%, transparent 70%);
  top: 45%; right: 10%; transform: translateY(-55%);
  filter: blur(50px); z-index: 1; pointer-events: none;
}
.lc-hero-bg {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(11,15,20,0.4) 0%, rgba(11,15,20,0.15) 40%, rgba(11,15,20,0.6) 100%);
  z-index: 2;
}
.lc-hero-rock {
  position: absolute; bottom: 12%; left: 52%;
  transform: translateX(-20%); z-index: 2; opacity: 0.55;
  width: clamp(180px, 35vw, 480px); height: auto;
  pointer-events: none;
}
.lc-hero-content {
  position: relative; z-index: 10;
  padding: clamp(40px, 6vw, 80px) clamp(20px, 6vw, 80px) 40px;
  max-width: 640px;
  flex: 1;
}
.lc-eyebrow {
  font-size: 10px; font-weight: 600; letter-spacing: 0.3em; color: var(--amber);
  margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
}
.lc-eyebrow::before { content: ''; display: block; width: 24px; height: 1px; background: var(--amber); opacity: 0.7; }
.lc-hero-h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(40px, 6.5vw, 80px); font-weight: 300;
  line-height: 1.08; color: var(--white); margin-bottom: 20px;
}
.lc-hero-h1 em { font-style: italic; color: var(--amber); font-weight: 400; }
.lc-hero-desc {
  font-size: clamp(14px, 1.5vw, 16px); line-height: 1.75;
  color: var(--muted); max-width: 420px; margin-bottom: 36px; font-weight: 300;
}
.lc-hero-cta {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 600; letter-spacing: 0.08em;
  text-decoration: none; color: #0B0F14; background: var(--amber);
  padding: 14px 32px; border-radius: 10px; transition: all 0.25s;
  box-shadow: 0 8px 28px rgba(245,158,11,0.3);
}
.lc-hero-cta:hover { box-shadow: 0 12px 40px rgba(245,158,11,0.45); transform: translateY(-2px); }
.lc-cta-arrow { transition: transform 0.2s; }
.lc-hero-cta:hover .lc-cta-arrow { transform: translateX(5px); }

/* Stats */
.lc-stats-wrap {
  position: relative; z-index: 10;
  display: flex; gap: 0;
  padding: clamp(20px, 4vw, 48px) clamp(20px, 6vw, 80px);
}
.lc-stat-item { padding: 0 clamp(16px, 3vw, 28px); }
.lc-stat-item:first-child { padding-left: 0; }
.lc-stat-num {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(22px, 3.5vw, 30px); font-weight: 600;
  color: var(--white); line-height: 1; margin-bottom: 4px;
}
.lc-stat-num span { color: var(--amber); }
.lc-stat-label { font-size: clamp(10px, 1.2vw, 12px); color: var(--muted); letter-spacing: 0.05em; }
.lc-stat-div { width: 1px; background: var(--glass-border); align-self: stretch; margin: 4px 0; }

/* ── SECTIONS ── */
.lc-section { padding: clamp(60px, 8vw, 100px) clamp(20px, 6vw, 80px); }
.lc-section-label { font-size: 10px; letter-spacing: 0.3em; color: var(--amber); font-weight: 600; margin-bottom: 14px; display: block; }
.lc-section-h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px, 4vw, 50px); font-weight: 300; line-height: 1.1; color: var(--white); margin-bottom: 14px; }
.lc-section-desc { font-size: 15px; color: var(--muted); line-height: 1.7; max-width: 480px; font-weight: 300; }

/* ── FEATURES ── */
#lc-features { background: rgba(17,24,39,0.45); border-top: 1px solid var(--glass-border); }
.lc-features-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: clamp(32px, 6vw, 80px); align-items: start; }
.lc-features-intro { position: sticky; top: 80px; }
.lc-feature-list { display: flex; flex-direction: column; gap: 2px; }
.lc-feature-item { padding: 22px 26px; border: 1px solid transparent; border-bottom: 1px solid var(--glass-border); border-radius: 10px; transition: all 0.25s; }
.lc-feature-item:hover { border-color: rgba(245,158,11,0.15); background: rgba(245,158,11,0.03); }
.lc-feature-num { font-family: 'Cormorant Garamond', serif; font-size: 11px; color: var(--amber); opacity: 0.8; margin-bottom: 7px; letter-spacing: 0.1em; }
.lc-feature-title { font-size: 15px; font-weight: 600; color: var(--white); margin-bottom: 5px; }
.lc-feature-desc { font-size: 13px; color: var(--muted); line-height: 1.65; font-weight: 300; }

/* ── HOW IT WORKS ── */
#lc-how { border-top: 1px solid var(--glass-border); }
.lc-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 48px; }
.lc-step-card { padding: 32px 26px; background: rgba(17,24,39,0.65); border: 1px solid var(--glass-border); border-radius: 12px; position: relative; overflow: hidden; transition: all 0.25s; }
.lc-step-card:hover { border-color: rgba(245,158,11,0.2); background: rgba(245,158,11,0.025); }
.lc-step-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background: linear-gradient(90deg, var(--amber), transparent); opacity:0; transition:opacity 0.3s; }
.lc-step-card:hover::before { opacity: 1; }
.lc-step-num { font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 700; color: var(--amber); opacity: 0.1; line-height: 1; margin-bottom: 18px; display: block; }
.lc-step-title { font-size: 16px; font-weight: 600; color: var(--white); margin-bottom: 10px; }
.lc-step-desc { font-size: 13px; color: var(--muted); line-height: 1.65; font-weight: 300; }

/* ── CTA BAND ── */
.lc-cta-band { border-top: 1px solid var(--glass-border); padding: clamp(60px, 8vw, 100px) clamp(20px, 6vw, 80px); background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245,158,11,0.05) 0%, transparent 70%); text-align: center; }
.lc-cta-band .lc-section-h2 { max-width: 580px; margin: 0 auto 12px; }
.lc-cta-band .lc-section-desc { max-width: 400px; margin: 0 auto 32px; text-align: center; }

/* ── FOOTER ── */
.lc-footer { border-top: 1px solid var(--glass-border); padding: clamp(24px, 4vw, 36px) clamp(20px, 6vw, 80px); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.lc-footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 17px; letter-spacing: 0.1em; color: var(--muted); }
.lc-footer-links { display: flex; gap: clamp(16px, 2.5vw, 28px); flex-wrap: wrap; }
.lc-footer-links a { font-size: 12px; color: var(--subtle); text-decoration: none; transition: color 0.2s; }
.lc-footer-links a:hover { color: var(--muted); }
.lc-footer-copy { font-size: 11px; color: var(--subtle); }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .lc-features-layout { grid-template-columns: 1fr; }
  .lc-features-intro { position: static; }
  .lc-steps-grid { grid-template-columns: 1fr; }
  .lc-sunset-orb { width: 300px; height: 300px; right: -40px; }
}
@media (max-width: 640px) {
  .lc-hero-rock { left: 35%; opacity: 0.3; width: clamp(140px, 45vw, 220px); }
  .lc-footer { justify-content: center; text-align: center; }
  .lc-footer-links { justify-content: center; }
}
      `}</style>

      {/* ── Shared Navbar — Issue B fix ──────────────────────────────────── */}
      {/* position="fixed" so it stays at top while hero scrolls */}
      <Navbar position="fixed" />

      {/* HERO */}
      <section className="lc-hero">
        <div className="lc-hero-scene" />
        <div className="lc-sunset-orb" />
        <div className="lc-hero-bg" />

        {/* Rock silhouette */}
        <svg className="lc-hero-rock" viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="250" cy="280" rx="200" ry="18" fill="rgba(245,158,11,0.05)"/>
          <path d="M160 240 C155 220 148 200 152 180 C156 160 162 145 170 130 C178 115 188 105 200 98 C212 91 220 92 228 95 C240 90 252 88 262 92 C275 88 285 92 295 100 C308 110 318 125 325 145 C332 165 335 185 332 205 C328 225 322 238 315 248 C290 255 270 258 250 258 C230 258 200 252 180 248 Z"
            fill="rgba(17,24,39,0.95)" stroke="rgba(245,158,11,0.12)" strokeWidth="1"/>
          <path d="M190 145 C205 130 225 122 245 120 C265 118 282 125 295 138"
            stroke="rgba(245,158,11,0.18)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
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
            {isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
            <span className="lc-cta-arrow">→</span>
          </a>
        </div>

        {/* Stats — in normal document flow below hero content */}
        <div className="lc-stats-wrap">
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
              ['02','Live Presence','See who\'s online and what they\'re working on with live status indicators.'],
              ['03','Kanban Boards','Drag and drop cards across columns. Assign priorities, due dates, and teammates.'],
              ['04','Activity Log','Every action is tracked. Full timestamped history across your workspace.'],
              ['05','Invite by Code','Share an 8-character code. Teammates join instantly — no email invites.'],
              ['06','Secure by Default','JWT auth, hashed passwords, and protected API routes out of the box.'],
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
            ['01','Create a Workspace','Set up a team workspace in seconds. Choose an icon, color, and name.'],
            ['02','Invite Your Team','Share the auto-generated invite code. Teammates join instantly.'],
            ['03','Collaborate Live','Add tasks, move cards, and watch everything sync in real time.'],
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
