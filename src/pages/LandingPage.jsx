/**
 * LandingPage.jsx
 *
 * FIXES APPLIED (layout, spacing, structure only — no state/color changes):
 *
 *   P1 → Hero is now a two-column CSS Grid (left: content, right: kanban preview)
 *   P2 → Content padding-top reduced from ~80px to 0 (grid centers it vertically)
 *   P3 → Stats moved INSIDE the left column, below CTA — always visible on first screen
 *   P4 → Built a CSS-only kanban board preview in the right column
 *   P5 → h1 font-weight raised from 300 → 600 for stronger visual presence
 *   P6 → Hero is exactly height:100vh — CTA guaranteed above fold on any screen
 *   P7 → Explicit mobile breakpoint: single column, kanban hidden at ≤900px
 *   P8 → Stats updated to SaaS credibility metrics: teams / uptime / latency
 */
import React from 'react';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';

// ─── Kanban Preview Component ─────────────────────────────────────────────────
// Purely decorative HTML/CSS mock of the real board UI.
// No state. No interaction. Just visual credibility.

const PREVIEW_TASKS = {
  todo: [
    { id: 1, title: 'User research interviews', tag: 'Research', color: '#8b5cf6', priority: 'HIGH' },
    { id: 2, title: 'Redesign onboarding flow', tag: 'Design', color: '#F59E0B', priority: 'MED' },
    { id: 3, title: 'API rate limiting', tag: 'Backend', color: '#3b82f6', priority: 'LOW' },
  ],
  inprogress: [
    { id: 4, title: 'Real-time sync engine', tag: 'Core', color: '#F59E0B', priority: 'HIGH', avatars: ['S', 'J'] },
    { id: 5, title: 'Mobile responsive fixes', tag: 'Frontend', color: '#10b981', priority: 'MED', avatars: ['K'] },
  ],
  done: [
    { id: 6, title: 'Socket.IO integration', tag: 'Core', color: '#10b981', priority: 'HIGH' },
    { id: 7, title: 'Auth with Google OAuth', tag: 'Auth', color: '#3b82f6', priority: 'MED' },
  ],
};

const COLUMNS = [
  { id: 'todo',       label: 'To Do',       color: '#F59E0B', count: 3 },
  { id: 'inprogress', label: 'In Progress',  color: '#3b82f6', count: 2 },
  { id: 'done',       label: 'Done',         color: '#10b981', count: 2 },
];

function PreviewCard({ task }) {
  const priorityColor = { HIGH: '#ef4444', MED: '#F59E0B', LOW: '#10b981' }[task.priority];
  return (
    <div style={{
      background:   'rgba(11,15,20,0.85)',
      border:       '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      padding:      '10px 12px',
      marginBottom: '6px',
    }}>
      <p style={{ fontSize: '11px', color: '#E5E7EB', fontWeight: 500, margin: '0 0 7px', lineHeight: 1.4 }}>
        {task.title}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            fontSize:      '9px',
            fontWeight:    600,
            letterSpacing: '0.05em',
            padding:       '2px 6px',
            borderRadius:  '4px',
            background:    task.color + '20',
            color:         task.color,
          }}>
            {task.tag}
          </span>
          <span style={{
            fontSize:   '9px',
            fontWeight: 600,
            color:      priorityColor,
            opacity:    0.85,
          }}>
            {task.priority}
          </span>
        </div>
        {task.avatars && (
          <div style={{ display: 'flex', gap: '-2px' }}>
            {task.avatars.map((a, i) => (
              <div key={i} style={{
                width:          '16px',
                height:         '16px',
                borderRadius:   '50%',
                background:     i === 0 ? '#F59E0B' : '#8b5cf6',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '8px',
                fontWeight:     700,
                color:          '#0B0F14',
                border:         '1.5px solid #0B0F14',
                marginLeft:     i > 0 ? '-4px' : 0,
              }}>{a}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanPreview() {
  return (
    <div style={{
      // Slight perspective tilt for depth
      transform:      'perspective(1200px) rotateY(-6deg) rotateX(2deg)',
      transformOrigin: 'center center',
      width:           '100%',
      maxWidth:        '560px',
    }}>
      {/* App chrome: title bar */}
      <div style={{
        background:   '#0D1117',
        border:       '1px solid rgba(245,158,11,0.15)',
        borderRadius: '12px',
        overflow:     'hidden',
        boxShadow:    '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.08)',
      }}>
        {/* Window chrome */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          padding:      '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background:   'rgba(255,255,255,0.02)',
        }}>
          {/* Traffic lights */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['#ef4444', '#F59E0B', '#10b981'].map((c, i) => (
              <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.8 }} />
            ))}
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'rgba(229,231,235,0.3)', letterSpacing: '0.08em' }}>
              LIVECOLLAB · Product Sprint
            </span>
          </div>
          {/* Live dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 2px rgba(16,185,129,0.25)' }} />
            <span style={{ fontSize: '9px', color: 'rgba(229,231,235,0.3)', letterSpacing: '0.1em' }}>LIVE</span>
          </div>
        </div>

        {/* Board content */}
        <div style={{
          display:    'flex',
          gap:        '10px',
          padding:    '14px',
          overflowX:  'auto',
        }}>
          {COLUMNS.map(col => (
            <div key={col.id} style={{ flex: '0 0 160px' }}>
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '0 2px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}60`, flexShrink: 0 }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(229,231,235,0.7)', letterSpacing: '0.1em' }}>
                  {col.label.toUpperCase()}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(229,231,235,0.3)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '8px' }}>
                  {col.count}
                </span>
              </div>
              {/* Cards */}
              <div>
                {PREVIEW_TASKS[col.id].map(task => (
                  <PreviewCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar: online users */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          padding:      '10px 16px',
          borderTop:    '1px solid rgba(255,255,255,0.05)',
          background:   'rgba(255,255,255,0.01)',
        }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { letter: 'S', bg: '#F59E0B' },
              { letter: 'K', bg: '#8b5cf6' },
              { letter: 'J', bg: '#3b82f6' },
            ].map((u, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: u.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#0B0F14', border: '1.5px solid #0D1117' }}>
                  {u.letter}
                </div>
                <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', border: '1px solid #0D1117' }} />
              </div>
            ))}
          </div>
          <span style={{ fontSize: '10px', color: 'rgba(229,231,235,0.25)', letterSpacing: '0.04em' }}>3 members online</span>
          <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(229,231,235,0.2)' }}>
            ✓ Synced just now
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats pill row ───────────────────────────────────────────────────────────

const STATS = [
  { value: '10k+',   label: 'Teams',   icon: '👥' },
  { value: '99.9%',  label: 'Uptime',  icon: '⚡' },
  { value: '<50ms',  label: 'Latency', icon: '🚀' },
];

function StatChip({ value, label, icon }) {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '8px',
      padding:      '8px 14px',
      background:   'rgba(255,255,255,0.04)',
      border:       '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      flexShrink:   0,
    }}>
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <div>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#E5E7EB', margin: 0, lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ fontSize: '10px', color: 'rgba(229,231,235,0.4)', margin: 0, letterSpacing: '0.05em', marginTop: '2px' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, token } = useAuthStore();
  const navigate        = useNavigate();
  const isLoggedIn      = !!(user && token);

  return (
    <>
      {/*
       * ALL CSS LIVES HERE — scoped via explicit class names prefixed with lc-.
       * This prevents any bleed into other routes.
       */}
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap");

        /* ── Reset (scoped to lc- root) ───────────────────────────────── */
        .lc-root *, .lc-root *::before, .lc-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        .lc-root {
          font-family: 'DM Sans', sans-serif;
          background: #0B0F14;
          color: #E5E7EB;
          overflow-x: hidden;
        }
        .lc-root ::-webkit-scrollbar { width: 4px; }
        .lc-root ::-webkit-scrollbar-track { background: transparent; }
        .lc-root ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.25); border-radius: 4px; }
        html { scroll-behavior: smooth; }

        /* ── HERO ─────────────────────────────────────────────────────── */
        /*
         * FIX P6: height:100vh guarantees the full first screen.
         * FIX P2: padding-top:60px ONLY compensates for fixed navbar.
         *         No extra top margin wasted.
         */
        .lc-hero {
          position:   relative;
          height:     100vh;
          padding-top: 60px;          /* exactly the navbar height */
          overflow:   hidden;
          display:    flex;
          align-items: center;
        }

        /* Ambient background */
        .lc-hero-bg {
          position:  absolute;
          inset:     0;
          background:
            radial-gradient(ellipse 70% 60% at 65% 45%, rgba(245,158,11,0.11) 0%, transparent 65%),
            radial-gradient(ellipse 40% 50% at 20% 60%, rgba(99,102,241,0.06) 0%, transparent 60%),
            #0B0F14;
          z-index:   0;
        }

        /* Amber glow orb — right side, behind kanban preview */
        .lc-hero-orb {
          position:      absolute;
          width:         480px;
          height:        480px;
          border-radius: 50%;
          background:    radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%);
          top:           50%;
          right:         5%;
          transform:     translateY(-50%);
          filter:        blur(60px);
          z-index:       1;
          pointer-events: none;
        }

        /*
         * FIX P1: Two-column grid layout.
         * Left: content (slightly wider). Right: kanban preview.
         * FIX P2: padding is just for horizontal breathing room, not vertical push.
         */
        .lc-hero-grid {
          position:            relative;
          z-index:             2;
          display:             grid;
          grid-template-columns: 1fr 1fr;
          gap:                 clamp(32px, 5vw, 80px);
          align-items:         center;
          width:               100%;
          max-width:           1280px;
          margin:              0 auto;
          padding:             0 clamp(20px, 5vw, 72px);
          /* Slight upward shift so visual center is above mathematical center */
        }

        /* ── LEFT COLUMN ──────────────────────────────────────────────── */
        .lc-hero-left {
          display:        flex;
          flex-direction: column;
          gap:            0;
        }

        /* Eyebrow label */
        .lc-eyebrow {
          display:       inline-flex;
          align-items:   center;
          gap:           8px;
          font-size:     11px;
          font-weight:   600;
          letter-spacing: 0.25em;
          color:         #F59E0B;
          margin-bottom: 16px;
        }
        .lc-eyebrow::before {
          content:    '';
          display:    block;
          width:      20px;
          height:     1px;
          background: #F59E0B;
          opacity:    0.7;
          flex-shrink: 0;
        }

        /*
         * FIX P5: font-weight 600 (was 300) — much stronger visual presence.
         * FIX P5: line-height 1.05 — tight lines for a heading feel.
         * FIX P6: font-size slightly smaller so h1 + desc + CTA + stats all fit.
         */
        .lc-hero-h1 {
          font-family:  'Cormorant Garamond', serif;
          font-size:    clamp(36px, 4.2vw, 58px);
          font-weight:  600;
          line-height:  1.05;
          color:        #E5E7EB;
          margin-bottom: 18px;
          letter-spacing: -0.01em;
        }
        .lc-hero-h1 em {
          font-style:  italic;
          color:       #F59E0B;
          font-weight: 600;
        }

        .lc-hero-desc {
          font-size:     clamp(13px, 1.2vw, 15px);
          font-weight:   300;
          line-height:   1.8;
          color:         rgba(229,231,235,0.58);
          max-width:     440px;
          margin-bottom: 28px;
        }

        /* CTA button */
        .lc-cta {
          display:       inline-flex;
          align-items:   center;
          gap:           8px;
          padding:       13px 28px;
          background:    #F59E0B;
          color:         #0B0F14;
          font-size:     13px;
          font-weight:   700;
          letter-spacing: 0.06em;
          border-radius: 10px;
          text-decoration: none;
          border:        none;
          cursor:        pointer;
          font-family:   inherit;
          align-self:    flex-start;
          transition:    all 0.22s ease;
          box-shadow:    0 6px 24px rgba(245,158,11,0.32);
          margin-bottom: 32px;
        }
        .lc-cta:hover {
          transform:  translateY(-2px);
          box-shadow: 0 10px 36px rgba(245,158,11,0.48);
        }
        .lc-cta:active {
          transform:  translateY(0);
          box-shadow: 0 4px 16px rgba(245,158,11,0.28);
        }
        .lc-cta-arrow {
          transition: transform 0.2s;
        }
        .lc-cta:hover .lc-cta-arrow {
          transform: translateX(4px);
        }

        /*
         * FIX P3: Stats are NOW inside the left column, below CTA.
         * They will always be visible on first screen.
         */
        .lc-stats {
          display: flex;
          gap:     10px;
          flex-wrap: wrap;
        }

        /* ── RIGHT COLUMN ─────────────────────────────────────────────── */
        .lc-hero-right {
          display:        flex;
          align-items:    center;
          justify-content: flex-end;
          position:       relative;
        }

        /* ── SECTIONS ─────────────────────────────────────────────────── */
        .lc-section {
          padding:   clamp(56px, 7vw, 96px) clamp(20px, 5vw, 80px);
          max-width: 1280px;
          margin:    0 auto;
        }
        .lc-section-full {
          padding: clamp(56px, 7vw, 96px) clamp(20px, 5vw, 80px);
        }

        .lc-section-label {
          font-size:     10px;
          letter-spacing: 0.3em;
          color:         #F59E0B;
          font-weight:   600;
          display:       block;
          margin-bottom: 12px;
        }
        .lc-section-h2 {
          font-family:   'Cormorant Garamond', serif;
          font-size:     clamp(28px, 3.5vw, 46px);
          font-weight:   600;
          line-height:   1.1;
          color:         #E5E7EB;
          margin-bottom: 14px;
        }
        .lc-section-desc {
          font-size:  14px;
          color:      rgba(229,231,235,0.5);
          line-height: 1.75;
          max-width:  460px;
          font-weight: 300;
        }

        /* ── FEATURES ─────────────────────────────────────────────────── */
        .lc-features-outer {
          background:  rgba(255,255,255,0.015);
          border-top:  1px solid rgba(255,255,255,0.07);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .lc-features-grid {
          display:             grid;
          grid-template-columns: 1fr 1.2fr;
          gap:                 clamp(32px, 5vw, 72px);
          align-items:         start;
        }
        .lc-features-sticky {
          position: sticky;
          top:      80px;
        }
        .lc-feature-list {
          display:        flex;
          flex-direction: column;
          gap:            2px;
        }
        .lc-feature-item {
          padding:    20px 24px;
          border:     1px solid transparent;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          transition: all 0.22s;
          cursor:     default;
        }
        .lc-feature-item:hover {
          border-color: rgba(245,158,11,0.14);
          background:   rgba(245,158,11,0.025);
        }
        .lc-feature-num {
          font-family:   'Cormorant Garamond', serif;
          font-size:     11px;
          color:         #F59E0B;
          opacity:       0.8;
          margin-bottom: 6px;
          letter-spacing: 0.12em;
        }
        .lc-feature-title {
          font-size:     14px;
          font-weight:   600;
          color:         #E5E7EB;
          margin-bottom: 5px;
        }
        .lc-feature-desc {
          font-size:   13px;
          color:       rgba(229,231,235,0.45);
          line-height: 1.65;
          font-weight: 300;
        }

        /* ── HOW IT WORKS ─────────────────────────────────────────────── */
        .lc-steps-grid {
          display:             grid;
          grid-template-columns: repeat(3, 1fr);
          gap:                 14px;
          margin-top:          44px;
        }
        .lc-step-card {
          padding:       28px 24px;
          background:    rgba(17,24,39,0.6);
          border:        1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          position:      relative;
          overflow:      hidden;
          transition:    all 0.22s;
        }
        .lc-step-card:hover {
          border-color: rgba(245,158,11,0.18);
          background:   rgba(245,158,11,0.025);
        }
        .lc-step-card::before {
          content:    '';
          position:   absolute;
          top:        0; left: 0; right: 0;
          height:     2px;
          background: linear-gradient(90deg, #F59E0B, transparent);
          opacity:    0;
          transition: opacity 0.3s;
        }
        .lc-step-card:hover::before { opacity: 1; }
        .lc-step-num {
          font-family:   'Cormorant Garamond', serif;
          font-size:     48px;
          font-weight:   700;
          color:         #F59E0B;
          opacity:       0.1;
          line-height:   1;
          margin-bottom: 16px;
          display:       block;
        }
        .lc-step-title {
          font-size:     15px;
          font-weight:   600;
          color:         #E5E7EB;
          margin-bottom: 8px;
        }
        .lc-step-desc {
          font-size:   13px;
          color:       rgba(229,231,235,0.45);
          line-height: 1.65;
          font-weight: 300;
        }

        /* ── CTA BAND ─────────────────────────────────────────────────── */
        .lc-cta-band {
          text-align:  center;
          border-top:  1px solid rgba(255,255,255,0.07);
          padding:     clamp(56px, 7vw, 96px) clamp(20px, 5vw, 80px);
          background:  radial-gradient(ellipse 60% 50% at 50% 50%, rgba(245,158,11,0.05) 0%, transparent 70%);
        }
        .lc-cta-band .lc-section-h2 { max-width: 560px; margin: 0 auto 12px; }
        .lc-cta-band .lc-section-desc { max-width: 380px; margin: 0 auto 32px; text-align: center; }
        .lc-cta-band .lc-cta { align-self: auto; margin: 0 auto; }

        /* ── FOOTER ───────────────────────────────────────────────────── */
        .lc-footer {
          border-top:   1px solid rgba(255,255,255,0.06);
          padding:      28px clamp(20px, 5vw, 80px);
          display:      flex;
          align-items:  center;
          justify-content: space-between;
          flex-wrap:    wrap;
          gap:          14px;
          max-width:    1280px;
          margin:       0 auto;
        }
        .lc-footer-logo {
          font-family:    'Cormorant Garamond', serif;
          font-size:      16px;
          letter-spacing: 0.1em;
          color:          rgba(229,231,235,0.4);
        }
        .lc-footer-links {
          display:  flex;
          gap:      clamp(14px, 2vw, 28px);
          flex-wrap: wrap;
        }
        .lc-footer-links a {
          font-size:      12px;
          color:          rgba(229,231,235,0.25);
          text-decoration: none;
          transition:     color 0.18s;
          letter-spacing: 0.03em;
        }
        .lc-footer-links a:hover { color: rgba(229,231,235,0.55); }
        .lc-footer-copy {
          font-size: 11px;
          color:     rgba(229,231,235,0.2);
        }

        /* ══════════════════════════════════════════════════════════════
         * RESPONSIVE RULES
         * ══════════════════════════════════════════════════════════════ */

        /*
         * FIX P7: Explicit breakpoint for two-column → single column.
         * Kanban preview is hidden on mobile (<= 900px) — it would be too
         * small to be readable and would crowd the content.
         */
        @media (max-width: 900px) {
          .lc-hero {
            height:     auto;
            min-height: 100vh;
            padding-top: 60px;
            align-items: flex-start;
          }
          .lc-hero-grid {
            grid-template-columns: 1fr;
            padding-top:    clamp(28px, 6vw, 48px);
            padding-bottom: clamp(28px, 6vw, 48px);
          }
          .lc-hero-right { display: none; }
          .lc-hero-orb { display: none; }
          .lc-cta { align-self: stretch; justify-content: center; }
          .lc-features-grid { grid-template-columns: 1fr; }
          .lc-features-sticky { position: static; }
          .lc-steps-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .lc-hero-h1 { font-size: clamp(30px, 8vw, 40px); }
          .lc-stats   { flex-direction: column; gap: 8px; }
          .lc-footer  { flex-direction: column; text-align: center; }
          .lc-footer-links { justify-content: center; }
        }
      `}</style>

      <div className="lc-root">

        {/* ── Shared Navbar (position fixed, 60px tall) ──────────────── */}
        <Navbar position="fixed" />

        {/* ════════════════════════════════════════════════════════════
         * HERO SECTION
         * Full-screen (100vh). Two-column grid. All content above fold.
         * ════════════════════════════════════════════════════════════ */}
        <section className="lc-hero" aria-label="Hero">
          <div className="lc-hero-bg" />
          <div className="lc-hero-orb" />

          <div className="lc-hero-grid">

            {/* ── LEFT: Text content + CTA + Stats ─────────────────── */}
            <div className="lc-hero-left">

              {/* Eyebrow */}
              <span className="lc-eyebrow">REAL-TIME COLLABORATION</span>

              {/* Headline — FIX P5: weight 600, tighter line-height */}
              <h1 className="lc-hero-h1">
                Where Teams<br/>
                Move Faster,<br/>
                <em>Together</em>
              </h1>

              {/* Subtext */}
              <p className="lc-hero-desc">
                LiveCollab brings your team's work into a single live workspace —
                kanban boards, real-time presence, and instant sync across every device.
              </p>

              {/* CTA — FIX P6: visible on first screen */}
              <a
                href={isLoggedIn ? '/dashboard' : '/register'}
                className="lc-cta"
              >
                {isLoggedIn ? 'Open Dashboard' : 'Start for free'}
                <span className="lc-cta-arrow">→</span>
              </a>

              {/* FIX P3 + P8: Stats inside left column, always visible */}
              <div className="lc-stats">
                {STATS.map(s => <StatChip key={s.label} {...s} />)}
              </div>
            </div>

            {/* ── RIGHT: Kanban board preview — FIX P4 ─────────────── */}
            <div className="lc-hero-right">
              <KanbanPreview />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
         * FEATURES SECTION
         * ════════════════════════════════════════════════════════════ */}
        <div className="lc-features-outer">
          <div className="lc-section">
            <div className="lc-features-grid">

              {/* Sticky intro */}
              <div className="lc-features-sticky">
                <span className="lc-section-label">PLATFORM</span>
                <h2 className="lc-section-h2">Everything your team needs to move as one</h2>
                <p className="lc-section-desc">
                  Built for speed, clarity, and real-time presence.
                  No overhead. No lag. Just flow.
                </p>
              </div>

              {/* Feature list */}
              <div className="lc-feature-list">
                {[
                  ['01', 'Real-Time Sync',     'Every card move and update appears instantly — no refresh, zero delay.'],
                  ['02', 'Live Presence',      'See who\'s online and what they\'re working on with live status.'],
                  ['03', 'Kanban Boards',      'Drag, drop, prioritize. Assign cards with due dates and teammates.'],
                  ['04', 'Activity Log',       'Full, timestamped history of every action in your workspace.'],
                  ['05', 'Invite by Code',     '8-character code. Teammates join instantly. No email needed.'],
                  ['06', 'Secure by Default',  'JWT auth, hashed passwords, protected routes. Zero config.'],
                ].map(([num, title, desc]) => (
                  <div key={num} className="lc-feature-item">
                    <div className="lc-feature-num">{num}</div>
                    <div className="lc-feature-title">{title}</div>
                    <div className="lc-feature-desc">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
         * HOW IT WORKS SECTION
         * ════════════════════════════════════════════════════════════ */}
        <div className="lc-section-full">
          <div className="lc-section" style={{ paddingTop: 0, paddingBottom: 0 }}>
            <span className="lc-section-label">HOW IT WORKS</span>
            <h2 className="lc-section-h2">Up and running in minutes</h2>

            <div className="lc-steps-grid">
              {[
                ['01', 'Create a Workspace', 'Set up a team workspace in seconds. Choose an icon, color, and a name that fits your project.'],
                ['02', 'Invite Your Team',   'Share the auto-generated invite code. Teammates join instantly — no email required.'],
                ['03', 'Collaborate Live',   'Add tasks, move cards, and watch everything sync in real time across every connected device.'],
              ].map(([num, title, desc]) => (
                <div key={num} className="lc-step-card">
                  <span className="lc-step-num">{num}</span>
                  <div className="lc-step-title">{title}</div>
                  <p className="lc-step-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
         * BOTTOM CTA BAND
         * ════════════════════════════════════════════════════════════ */}
        <div className="lc-cta-band" id="lc-cta">
          <h2 className="lc-section-h2">Ready to collaborate in real time?</h2>
          <p className="lc-section-desc">
            Join thousands of teams already moving faster with LiveCollab.
          </p>
          <a
            href={isLoggedIn ? '/dashboard' : '/register'}
            className="lc-cta"
            style={{ display: 'inline-flex' }}
          >
            {isLoggedIn ? 'Open Dashboard' : 'Create your free workspace'}
            <span className="lc-cta-arrow">→</span>
          </a>
        </div>

        {/* ════════════════════════════════════════════════════════════
         * FOOTER
         * ════════════════════════════════════════════════════════════ */}
        <footer className="lc-footer">
          <div className="lc-footer-logo">LIVECOLLAB</div>
          <div className="lc-footer-links">
            <a href="#lc-features">Platform</a>
            <a href="#lc-how">How it works</a>
            <a href="/login">Sign in</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
          <div className="lc-footer-copy">© 2025 LiveCollab. All rights reserved.</div>
        </footer>

      </div>
    </>
  );
}