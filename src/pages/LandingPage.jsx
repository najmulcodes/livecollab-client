import React from "react";

export default function LandingPage() {
  return (
    <>
      <style>{`
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap");

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0b0b0c;
    --amber: #e8a24a;
    --amber-dim: #b87930;
    --amber-glow: rgba(232,162,74,0.15);
    --white: #f0ede8;
    --muted: rgba(240,237,232,0.45);
    --subtle: rgba(240,237,232,0.18);
    --glass: rgba(255,255,255,0.04);
    --glass-border: rgba(255,255,255,0.08);
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--white); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

  /* ── NAV ── */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 22px 48px;
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(180deg, rgba(11,11,12,0.95) 0%, transparent 100%);
  }
  .nav-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 600;
    letter-spacing: 0.12em; color: var(--white);
    display: flex; align-items: center; gap: 10px;
  }
  .logo-icon {
    width: 32px; height: 32px;
  }
  .nav-links { display: flex; gap: 36px; list-style: none; }
  .nav-links a {
    font-size: 13px; font-weight: 400;
    color: var(--muted); text-decoration: none;
    letter-spacing: 0.04em;
    transition: color 0.2s;
  }
  .nav-links a:hover { color: var(--white); }
  .nav-signin {
    font-size: 13px; font-weight: 500;
    color: var(--muted); text-decoration: none;
    border: 1px solid var(--glass-border);
    padding: 8px 20px; border-radius: 2px;
    transition: all 0.2s; letter-spacing: 0.05em;
  }
  .nav-signin:hover { color: var(--white); border-color: var(--subtle); }

  /* ── HERO ── */
  .hero {
    position: relative; min-height: 100vh;
    display: flex; align-items: center;
    overflow: hidden;
    padding-top: 60px;
  }
  .hero-bg {
    position: absolute; inset: 0;
    background:
      linear-gradient(180deg, rgba(11,11,12,0.6) 0%, rgba(11,11,12,0.3) 40%, rgba(11,11,12,0.7) 100%),
      linear-gradient(135deg, rgba(232,162,74,0.12) 0%, transparent 50%);
    z-index: 1;
  }
  /* Cinematic rock/water scene using CSS */
  .hero-scene {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 70% 60%, rgba(232,162,74,0.25) 0%, rgba(184,121,48,0.1) 40%, transparent 70%),
      radial-gradient(ellipse 80% 50% at 50% 100%, rgba(232,162,74,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 100% 60% at 50% 50%, rgba(30,25,15,1) 0%, rgba(11,11,12,1) 100%);
  }
  /* Water reflection shimmer */
  .hero-water {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 45%;
    background: linear-gradient(180deg, transparent 0%, rgba(232,162,74,0.04) 40%, rgba(232,162,74,0.08) 100%);
    z-index: 0;
  }
  .water-line {
    position: absolute; left: 0; right: 0;
    height: 1px; background: rgba(232,162,74,0.15);
  }
  .water-line:nth-child(1) { top: 20%; width: 60%; left: 20%; }
  .water-line:nth-child(2) { top: 35%; width: 80%; left: 10%; opacity: 0.6; }
  .water-line:nth-child(3) { top: 55%; width: 50%; left: 25%; opacity: 0.3; }

  /* SVG rock silhouette */
  .hero-rock-svg {
    position: absolute;
    bottom: 15%; left: 50%; transform: translateX(-30%);
    z-index: 2; opacity: 0.7;
    width: 500px; height: 300px;
  }
  /* Glow orb - sunset */
  .sunset-orb {
    position: absolute;
    width: 420px; height: 420px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(232,162,74,0.35) 0%, rgba(220,100,30,0.15) 40%, transparent 70%);
    top: 50%; right: 15%;
    transform: translateY(-55%);
    filter: blur(40px);
    z-index: 1;
  }
  .horizon-glow {
    position: absolute;
    bottom: 30%; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(232,162,74,0.4), rgba(220,100,30,0.6), rgba(232,162,74,0.4), transparent);
    z-index: 2;
    filter: blur(3px);
  }

  .hero-content {
    position: relative; z-index: 10;
    padding: 0 80px 0 80px;
    max-width: 620px;
    padding-top:20px;
  }
  .hero-eyebrow {
    font-size: 10px; font-weight: 500;
    letter-spacing: 0.25em; color: var(--amber);
    margin-bottom: 24px; opacity: 0.9;
  }
  .hero-h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(52px, 7vw, 86px);
    font-weight: 300; line-height: 1.05;
    color: var(--white);
    margin-bottom: 12px;
  }
  .hero-h1 em {
    font-style: normal;
    color: var(--amber);
    font-weight: 600;
  }
  .hero-desc {
    font-size: 15px; line-height: 1.75;
    color: var(--muted); max-width: 400px;
    margin-bottom: 28px; font-weight: 300;
  }
  .hero-cta {
    display: inline-flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 500;
    letter-spacing: 0.08em; text-decoration: none;
    color: var(--bg);
    background: var(--amber);
    padding: 14px 32px; border-radius: 2px;
    transition: all 0.25s;
    position: relative; overflow: hidden;
  }
  .hero-cta::after {
    content: '';
    position: absolute; inset: 0;
    background: rgba(255,255,255,0.15);
    opacity: 0; transition: opacity 0.25s;
  }
  .hero-cta:hover::after { opacity: 1; }
  .hero-cta:hover { box-shadow: 0 8px 40px rgba(232,162,74,0.4); }
  .cta-arrow { font-size: 16px; transition: transform 0.2s; }
  .hero-cta:hover .cta-arrow { transform: translateX(4px); }

  /* Stats row */
  .hero-stats {
    position: absolute; bottom: 48px; left: 80px;
    z-index: 10;
    display: flex; gap: 52px;
  }
  .stat-item {}
  .stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px; font-weight: 600;
    color: var(--white); line-height: 1;
    margin-bottom: 4px;
  }
  .stat-num span { color: var(--amber); }
  .stat-label {
    font-size: 11px; color: var(--muted);
    letter-spacing: 0.06em; font-weight: 400;
  }
  .stat-divider {
    width: 1px; background: var(--glass-border);
    align-self: stretch; margin: 4px 0;
  }

  /* ── SECTIONS ── */
  section { padding: 120px 80px; }

  .section-label {
    font-size: 10px; letter-spacing: 0.3em;
    color: var(--amber); font-weight: 500;
    margin-bottom: 16px; display: block;
  }
  .section-h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 4vw, 54px);
    font-weight: 300; line-height: 1.1;
    color: var(--white); margin-bottom: 16px;
  }
  .section-desc { font-size: 15px; color: var(--muted); line-height: 1.7; max-width: 500px; font-weight: 300; }

  /* ── FEATURES ── */
  #features { background: rgba(232,162,74,0.02); border-top: 1px solid var(--glass-border); }
  .features-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
  .features-intro { position: sticky; top: 120px; }
  .feature-list { display: flex; flex-direction: column; gap: 1px; }
  .feature-item {
    padding: 28px 32px;
    border: 1px solid transparent;
    border-bottom: 1px solid var(--glass-border);
    transition: all 0.25s;
    cursor: default;
  }
  .feature-item:hover {
    border-color: rgba(232,162,74,0.2);
    background: rgba(232,162,74,0.03);
  }
  .feature-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 12px; color: var(--amber);
    opacity: 0.7; margin-bottom: 10px;
    letter-spacing: 0.1em;
  }
  .feature-title { font-size: 16px; font-weight: 500; color: var(--white); margin-bottom: 8px; }
  .feature-desc { font-size: 14px; color: var(--muted); line-height: 1.65; font-weight: 300; }

  /* ── HOW IT WORKS ── */
  #how-it-works { border-top: 1px solid var(--glass-border); }
  .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 64px; }
  .step-card {
    padding: 40px 36px;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    position: relative; overflow: hidden;
  }
  .step-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--amber), transparent);
    opacity: 0; transition: opacity 0.3s;
  }
  .step-card:hover::before { opacity: 1; }
  .step-number {
    font-family: 'Cormorant Garamond', serif;
    font-size: 64px; font-weight: 700;
    color: var(--amber); opacity: 0.12;
    line-height: 1; margin-bottom: 24px;
    display: block;
  }
  .step-title { font-size: 18px; font-weight: 500; color: var(--white); margin-bottom: 12px; }
  .step-desc { font-size: 14px; color: var(--muted); line-height: 1.65; font-weight: 300; }

  /* ── CTA BAND ── */
  .cta-band {
    border-top: 1px solid var(--glass-border);
    padding: 100px 80px;
    background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(232,162,74,0.06) 0%, transparent 70%);
    text-align: center;
  }
  .cta-band .section-h2 { max-width: 600px; margin: 0 auto 16px; }
  .cta-band .section-desc { max-width: 400px; margin: 0 auto 40px; text-align: center; }

  /* ── FOOTER ── */
  footer {
    border-top: 1px solid var(--glass-border);
    padding: 40px 80px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .footer-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; letter-spacing: 0.1em; color: var(--muted);
  }
  .footer-links { display: flex; gap: 32px; }
  .footer-links a { font-size: 12px; color: var(--subtle); text-decoration: none; transition: color 0.2s; letter-spacing: 0.05em; }
  .footer-links a:hover { color: var(--muted); }
  .footer-copy { font-size: 11px; color: var(--subtle); letter-spacing: 0.05em; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 2px; }

  @media (max-width: 900px) {
    nav { padding: 18px 24px; }
    .hero-content { padding: 120px 24px 0; }
    .hero-stats { left: 24px; gap: 32px; }
    section { padding: 80px 24px; }
    .features-layout { grid-template-columns: 1fr; gap: 40px; }
    .features-intro { position: static; }
    .steps-grid { grid-template-columns: 1fr; }
    footer { flex-direction: column; gap: 24px; padding: 32px 24px; text-align: center; }
    .cta-band { padding: 80px 24px; }
    .nav-links { display: none; }
    .hero-rock-svg { width: 300px; }
  }
      `}</style>
{/* NAV */}
<nav>
  <div className="nav-logo">
    <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
      <path d="M8 8 L20 28 L23 21 L29 18 Z" fill="#6366f1"/>
      <circle cx="27" cy="7" r="3.5" fill="#e8a24a"/>
      <line x1="10" y1="8" x2="27" y2="7" stroke="rgba(232,162,74,0.4)" strokeWidth="1.5"/>
    </svg>
    LIVECOLLAB
  </div>
  <ul className="nav-links">
    <li><a href="#features">Platform</a></li>
    <li><a href="#how-it-works">How it works</a></li>
    <li><a href="#cta">Pricing</a></li>
  </ul>
  <a href="/login" className="nav-signin">Sign In</a>
</nav>

{/* HERO */}
<section className="hero">
  <div className="hero-scene"></div>
  <div className="hero-water">
    <div className="water-line"></div>
    <div className="water-line"></div>
    <div className="water-line"></div>
  </div>
  <div className="sunset-orb"></div>
  <div className="horizon-glow"></div>

  {/* Rock silhouette SVG */}
  <svg className="hero-rock-svg" viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="250" cy="280" rx="200" ry="20" fill="rgba(232,162,74,0.08)"/>
    {/* Rock body */}
    <path d="M160 240 C155 220 148 200 152 180 C156 160 162 145 170 130 C178 115 188 105 200 98 C212 91 220 92 228 95 C240 90 252 88 262 92 C275 88 285 92 295 100 C308 110 318 125 325 145 C332 165 335 185 332 205 C328 225 322 238 315 248 C290 255 270 258 250 258 C230 258 200 252 180 248 Z" fill="rgba(20,18,14,0.9)" stroke="rgba(232,162,74,0.15)" strokeWidth="1"/>
    {/* Highlight ridge */}
    <path d="M190 145 C205 130 225 122 245 120 C265 118 282 125 295 138" stroke="rgba(232,162,74,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {/* Reflection in water */}
    <path d="M175 260 C190 268 215 272 250 272 C285 272 315 268 325 260" stroke="rgba(232,162,74,0.08)" strokeWidth="1" fill="none"/>
    <path d="M185 270 C205 276 230 279 250 279 C270 279 295 276 315 270" stroke="rgba(232,162,74,0.05)" strokeWidth="0.8" fill="none"/>
  </svg>

  <div className="hero-bg"></div>

  <div className="hero-content">
    <p className="hero-eyebrow">THE SMARTEST THING YOU CAN DO</p>
    <h1 className="hero-h1">
      Smarter<br/>
      Collaboration<br/>
      <em>Begins Now</em>
    </h1>
    <p className="hero-desc">
      Real-time sync decodes team complexity — turning parallel work into coordinated, flowing execution.
    </p>
    <a href="/register" className="hero-cta">
      Start Now <span className="cta-arrow">→</span>
    </a>
  </div>

  <div className="hero-stats">
    <div className="stat-item">
      <div className="stat-num"><span>+</span>83<span>%</span></div>
      <div className="stat-label">Avg team velocity increase</div>
    </div>
    <div className="stat-divider"></div>
    <div className="stat-item">
      <div className="stat-num">3,427</div>
      <div className="stat-label">Active workspaces</div>
    </div>
    <div className="stat-divider"></div>
    <div className="stat-item">
      <div className="stat-num">107<span>k+</span></div>
      <div className="stat-label">Global users</div>
    </div>
  </div>
</section>

{/* FEATURES */}
<section id="features">
  <div className="features-layout">
    <div className="features-intro">
      <span className="section-label">PLATFORM</span>
      <h2 className="section-h2">Everything your team needs to move as one</h2>
      <p className="section-desc">Built for speed, clarity, and real-time presence. No overhead. No lag. Just flow.</p>
    </div>
    <div className="feature-list">
      <div className="feature-item">
        <div className="feature-num">01</div>
        <div className="feature-title">Real-Time Sync</div>
        <div className="feature-desc">Every card move and update appears instantly across all sessions — no refresh, zero delay.</div>
      </div>
      <div className="feature-item">
        <div className="feature-num">02</div>
        <div className="feature-title">Live Presence</div>
        <div className="feature-desc">See who's online and exactly what they're working on with live indicators and cursor positions.</div>
      </div>
      <div className="feature-item">
        <div className="feature-num">03</div>
        <div className="feature-title">Kanban Boards</div>
        <div className="feature-desc">Drag and drop cards across columns. Assign priorities, due dates, and teammates to every task.</div>
      </div>
      <div className="feature-item">
        <div className="feature-num">04</div>
        <div className="feature-title">Activity Log</div>
        <div className="feature-desc">Every action is tracked. A full, timestamped history of who did what across your workspace.</div>
      </div>
      <div className="feature-item">
        <div className="feature-num">05</div>
        <div className="feature-title">Invite by Code</div>
        <div className="feature-desc">Share an 8-character code. Teammates join instantly — no email invites, no friction.</div>
      </div>
      <div className="feature-item">
        <div className="feature-num">06</div>
        <div className="feature-title">Secure by Default</div>
        <div className="feature-desc">JWT authentication, hashed passwords, and protected API routes. Secure without configuration.</div>
      </div>
    </div>
  </div>
</section>

{/* HOW IT WORKS */}
<section id="how-it-works">
  <span className="section-label">HOW IT WORKS</span>
  <h2 className="section-h2">Up and running in minutes</h2>
  <div className="steps-grid">
    <div className="step-card">
      <span className="step-number">01</span>
      <div className="step-title">Create a Workspace</div>
      <p className="step-desc">Set up a team workspace in seconds. Choose an icon, color, and name that fits your project.</p>
    </div>
    <div className="step-card">
      <span className="step-number">02</span>
      <div className="step-title">Invite Your Team</div>
      <p className="step-desc">Share the auto-generated invite code. Teammates join instantly — no email required.</p>
    </div>
    <div className="step-card">
      <span className="step-number">03</span>
      <div className="step-title">Collaborate Live</div>
      <p className="step-desc">Add tasks, move cards, and watch everything sync in real time across every connected device.</p>
    </div>
  </div>
</section>

{/* CTA BAND */}
<div className="cta-band" id="cta">
  <h2 className="section-h2">Ready to collaborate in real time?</h2>
  <p className="section-desc">Join teams already using LiveCollab to move faster and stay in sync.</p>
  <a href="/register" className="hero-cta">
    Create your free workspace <span className="cta-arrow">→</span>
  </a>
</div>

{/* FOOTER */}
<footer>
  <div className="footer-logo">LIVECOLLAB</div>
  <div className="footer-links">
    <a href="#features">Platform</a>
    <a href="#how-it-works">How it works</a>
    <a href="/login">Sign in</a>
    <a href="#">Privacy</a>
    <a href="#">Terms</a>
  </div>
  <div className="footer-copy">© 2025 LiveCollab</div>
</footer>
    </>
  );
}
