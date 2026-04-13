/**
 * LandingPage.jsx — LiveCollab marketing landing page
 *
 * Layout (100vh, no scroll required for key content):
 *   Left  → headline + subtext + CTA buttons + 3 stat chips
 *   Right → animated board preview visual (pure CSS, no image dependency)
 *
 * Navbar is rendered separately via layout — this component starts at
 * the top of the content area (below the 57px sticky nav).
 *
 * Design decisions:
 *   - Syne font for the hero headline (geometric, commanding)
 *   - Asymmetric split: 52% text / 48% visual
 *   - Stats inside the hero column, not below fold
 *   - Subtle amber grid pattern in background for depth
 *   - Board preview uses real column/card shapes — communicates the product
 */
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Users, Shield } from 'lucide-react';
import useAuthStore from '../store/authStore';

// ─── Board preview card shapes ─────────────────────────────────────────────────
const PREVIEW_COLUMNS = [
  {
    id: 'todo', label: 'TO DO', color: '#F59E0B',
    cards: [
      { title: 'Design system audit', tag: 'HIGH', tagColor: '#ef4444' },
      { title: 'API rate limiting', tag: 'MED', tagColor: '#F59E0B' },
    ],
  },
  {
    id: 'inprogress', label: 'IN PROGRESS', color: '#3b82f6',
    cards: [
      { title: 'WebRTC signaling', tag: 'URGENT', tagColor: '#dc2626' },
      { title: 'Dashboard redesign', tag: 'HIGH', tagColor: '#ef4444' },
      { title: 'Socket reconnect', tag: 'MED', tagColor: '#F59E0B' },
    ],
  },
  {
    id: 'done', label: 'DONE', color: '#10b981',
    cards: [
      { title: 'Auth middleware', tag: 'LOW', tagColor: '#10b981' },
      { title: 'Board store fix', tag: 'MED', tagColor: '#F59E0B' },
    ],
  },
];

function BoardPreview() {
  return (
    <div style={preview.root}>
      {/* Top bar mockup */}
      <div style={preview.topBar}>
        <div style={preview.topBarDot} />
        <span style={preview.topBarLabel}>Engineering · Sprint 4</span>
        <div style={preview.livePill}>
          <span style={preview.liveDot} />
          LIVE
        </div>
      </div>

      {/* Columns */}
      <div style={preview.columns}>
        {PREVIEW_COLUMNS.map(col => (
          <div key={col.id} style={preview.column}>
            {/* Column header */}
            <div style={preview.colHeader}>
              <span style={{ ...preview.colDot, background: col.color, boxShadow: `0 0 6px ${col.color}60` }} />
              <span style={preview.colLabel}>{col.label}</span>
              <span style={preview.colCount}>{col.cards.length}</span>
            </div>

            {/* Cards */}
            <div style={preview.colCards}>
              {col.cards.map((card, i) => (
                <div key={i} style={preview.card}>
                  <div style={{ ...preview.cardAccent, background: col.color }} />
                  <p style={preview.cardTitle}>{card.title}</p>
                  <div style={{ ...preview.cardTag, background: card.tagColor + '18', color: card.tagColor }}>
                    {card.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const preview = {
  root: {
    width:        '100%',
    height:       '100%',
    background:   '#0d1117',
    borderRadius: '14px',
    border:       '1px solid rgba(245,158,11,0.15)',
    overflow:     'hidden',
    display:      'flex',
    flexDirection: 'column',
    boxShadow:    '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
  },
  topBar: {
    height:      '40px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display:     'flex',
    alignItems:  'center',
    gap:         '8px',
    padding:     '0 14px',
    background:  'rgba(11,15,20,0.8)',
    flexShrink:  0,
  },
  topBarDot: {
    width:        '7px',
    height:       '7px',
    borderRadius: '50%',
    background:   'rgba(245,158,11,0.4)',
    boxShadow:    '0 0 6px rgba(245,158,11,0.3)',
  },
  topBarLabel: {
    fontSize:      '10px',
    color:         'rgba(229,231,235,0.45)',
    letterSpacing: '0.06em',
    flex:          1,
    fontFamily:    "'DM Sans', sans-serif",
  },
  livePill: {
    display:       'flex',
    alignItems:    'center',
    gap:           '4px',
    fontSize:      '9px',
    letterSpacing: '0.1em',
    color:         'rgba(245,158,11,0.6)',
    fontFamily:    "'DM Sans', sans-serif",
  },
  liveDot: {
    display:      'block',
    width:        '5px',
    height:       '5px',
    borderRadius: '50%',
    background:   '#F59E0B',
    animation:    'pulse-dot 2s ease-in-out infinite',
  },
  columns: {
    display:  'flex',
    gap:      '8px',
    padding:  '12px',
    flex:     1,
    overflow: 'hidden',
  },
  column: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
    minWidth:      0,
  },
  colHeader: {
    display:    'flex',
    alignItems: 'center',
    gap:        '5px',
    marginBottom: '4px',
  },
  colDot: {
    display:      'block',
    width:        '6px',
    height:       '6px',
    borderRadius: '50%',
    flexShrink:   0,
  },
  colLabel: {
    fontSize:      '8px',
    fontWeight:    700,
    color:         'rgba(229,231,235,0.6)',
    letterSpacing: '0.1em',
    fontFamily:    "'DM Sans', sans-serif",
    flex:          1,
  },
  colCount: {
    fontSize:      '8px',
    color:         'rgba(229,231,235,0.3)',
    background:    'rgba(255,255,255,0.06)',
    borderRadius:  '8px',
    padding:       '1px 5px',
    fontFamily:    "'DM Sans', sans-serif",
  },
  colCards: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '5px',
  },
  card: {
    background:   '#111827',
    border:       '1px solid rgba(255,255,255,0.07)',
    borderRadius: '7px',
    padding:      '7px 8px',
    position:     'relative',
    overflow:     'hidden',
    display:      'flex',
    flexDirection: 'column',
    gap:          '5px',
  },
  cardAccent: {
    position:     'absolute',
    left:         0,
    top:          0,
    bottom:       0,
    width:        '2px',
    borderRadius: '2px 0 0 2px',
    opacity:      0.7,
  },
  cardTitle: {
    fontSize:        '9px',
    fontWeight:      500,
    color:           'rgba(229,231,235,0.8)',
    lineHeight:      1.4,
    paddingLeft:     '6px',
    fontFamily:      "'DM Sans', sans-serif",
    display:         '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow:        'hidden',
    margin:          0,
  },
  cardTag: {
    alignSelf:     'flex-start',
    fontSize:      '7px',
    fontWeight:    700,
    letterSpacing: '0.08em',
    padding:       '1px 5px',
    borderRadius:  '6px',
    marginLeft:    '6px',
    fontFamily:    "'DM Sans', sans-serif",
  },
};

// ─── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({ value, label, icon: Icon }) {
  return (
    <div style={chipStyle.root}>
      <div style={chipStyle.iconWrap}>
        <Icon style={{ width: 12, height: 12, color: '#F59E0B' }} />
      </div>
      <div>
        <p style={chipStyle.value}>{value}</p>
        <p style={chipStyle.label}>{label}</p>
      </div>
    </div>
  );
}

const chipStyle = {
  root: {
    display:     'flex',
    alignItems:  'center',
    gap:         '10px',
    padding:     '10px 14px',
    borderRadius: '10px',
    background:  'rgba(255,255,255,0.03)',
    border:      '1px solid rgba(255,255,255,0.07)',
    flex:        1,
  },
  iconWrap: {
    width:          '28px',
    height:         '28px',
    borderRadius:   '8px',
    background:     'rgba(245,158,11,0.1)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  value: {
    fontSize:   '16px',
    fontWeight: 700,
    color:      '#E5E7EB',
    margin:     0,
    lineHeight: 1.2,
    fontFamily: "'Syne', sans-serif",
  },
  label: {
    fontSize:   '10px',
    color:      'rgba(229,231,235,0.4)',
    margin:     0,
    lineHeight: 1.3,
    fontFamily: "'DM Sans', sans-serif",
  },
};

// ─── Main component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div style={styles.root}>
      {/* Ambient background grid */}
      <div style={styles.gridOverlay} aria-hidden="true" />
      {/* Amber ambient glow */}
      <div style={styles.glow} aria-hidden="true" />

      <div style={styles.container}>

        {/* ── Left column ───────────────────────────────────────────── */}
        <div style={styles.left}>

          {/* Eyebrow pill */}
          <div style={styles.eyebrow}>
            <Zap style={{ width: 11, height: 11, color: '#F59E0B' }} />
            <span>Real-time collaboration, reimagined</span>
          </div>

          {/* Headline */}
          <h1 style={styles.headline}>
            Build faster,<br />
            <span style={styles.headlineAccent}>together.</span>
          </h1>

          {/* Subtext */}
          <p style={styles.subtext}>
            LiveCollab brings your team's work into one real-time workspace —
            Kanban boards, live presence, and built-in video calls.
            No context switching.
          </p>

          {/* CTAs */}
          <div style={styles.ctaRow}>
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                style={styles.ctaPrimary}
              >
                Open Dashboard
                <ArrowRight style={{ width: 15, height: 15 }} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register')}
                  style={styles.ctaPrimary}
                >
                  Get started free
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  style={styles.ctaSecondary}
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {/* Stats row — inside hero, above fold */}
          <div style={styles.statsRow}>
            <StatChip value="10k+" label="Active teams" icon={Users} />
            <StatChip value="99.9%" label="Uptime SLA"  icon={Shield} />
            <StatChip value="<50ms" label="Sync latency" icon={Zap} />
          </div>
        </div>

        {/* ── Right column: board preview ────────────────────────────── */}
        <div style={styles.right}>
          {/* Decorative frame glow */}
          <div style={styles.previewGlow} aria-hidden="true" />
          <div style={styles.previewWrap}>
            <BoardPreview />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  root: {
    minHeight:  'calc(100vh - 57px)',  // viewport minus navbar
    background: '#0B0F14',
    position:   'relative',
    overflow:   'hidden',
    display:    'flex',
    alignItems: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },
  gridOverlay: {
    position:        'absolute',
    inset:           0,
    backgroundImage: `
      linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)
    `,
    backgroundSize:  '48px 48px',
    pointerEvents:   'none',
  },
  glow: {
    position:     'absolute',
    top:          '-20%',
    right:        '-10%',
    width:        '600px',
    height:       '600px',
    borderRadius: '50%',
    background:   'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    maxWidth:   '1200px',
    width:      '100%',
    margin:     '0 auto',
    padding:    '48px 24px',
    display:    'flex',
    alignItems: 'center',
    gap:        '64px',
    position:   'relative',
    zIndex:     1,
  },
  left: {
    flex:          '0 0 52%',
    display:       'flex',
    flexDirection: 'column',
    gap:           '24px',
    maxWidth:      '560px',
  },
  eyebrow: {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           '7px',
    padding:       '5px 12px',
    borderRadius:  '99px',
    background:    'rgba(245,158,11,0.08)',
    border:        '1px solid rgba(245,158,11,0.18)',
    fontSize:      '12px',
    color:         'rgba(245,158,11,0.85)',
    letterSpacing: '0.02em',
    fontWeight:    500,
    alignSelf:     'flex-start',
  },
  headline: {
    fontFamily:    "'Syne', sans-serif",
    fontSize:      'clamp(38px, 5vw, 56px)',
    fontWeight:    800,
    color:         '#E5E7EB',
    lineHeight:    1.05,
    letterSpacing: '-0.02em',
    margin:        0,
  },
  headlineAccent: {
    color: '#F59E0B',
  },
  subtext: {
    fontSize:   '15px',
    color:      'rgba(229,231,235,0.55)',
    lineHeight: 1.65,
    maxWidth:   '440px',
    margin:     0,
  },
  ctaRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    flexWrap:   'wrap',
  },
  ctaPrimary: {
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    padding:      '12px 24px',
    borderRadius: '10px',
    background:   '#F59E0B',
    color:        '#0B0F14',
    fontSize:     '14px',
    fontWeight:   700,
    border:       'none',
    cursor:       'pointer',
    transition:   'all 0.15s ease',
    boxShadow:    '0 0 24px rgba(245,158,11,0.3)',
    fontFamily:   "'DM Sans', sans-serif",
    letterSpacing: '0.01em',
  },
  ctaSecondary: {
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    padding:      '12px 24px',
    borderRadius: '10px',
    background:   'transparent',
    color:        'rgba(229,231,235,0.7)',
    fontSize:     '14px',
    fontWeight:   500,
    border:       '1px solid rgba(255,255,255,0.1)',
    cursor:       'pointer',
    transition:   'all 0.15s ease',
    fontFamily:   "'DM Sans', sans-serif",
  },
  statsRow: {
    display: 'flex',
    gap:     '10px',
    flexWrap: 'wrap',
  },
  right: {
    flex:     1,
    minWidth: 0,
    position: 'relative',
    height:   'clamp(340px, 50vh, 480px)',
    display:  'flex',
    alignItems: 'center',
  },
  previewGlow: {
    position:     'absolute',
    inset:        '-20px',
    borderRadius: '20px',
    background:   'radial-gradient(ellipse at center, rgba(245,158,11,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  previewWrap: {
    width:    '100%',
    height:   '100%',
    position: 'relative',
    zIndex:   1,
    // Slight perspective tilt for premium feel
    transform:           'perspective(1200px) rotateY(-4deg) rotateX(2deg)',
    transformStyle:      'preserve-3d',
    filter:              'drop-shadow(0 32px 64px rgba(0,0,0,0.5))',
  },
};
