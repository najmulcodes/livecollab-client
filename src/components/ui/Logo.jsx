// src/components/ui/Logo.jsx
/**
 * Shared logo — matches the landing page and login page exactly.
 * Usage:
 *   <Logo />              → default (link to "/")
 *   <Logo size={20} />    → custom font size
 *   <Logo asDiv />        → renders a <div> instead of <a> (no navigation)
 */
export default function Logo({ size = 22, asDiv = false, style = {} }) {
  const Tag = asDiv ? 'div' : 'a';
  const linkProps = asDiv ? {} : { href: '/' };

  return (
    <Tag
      {...linkProps}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: `${size}px`,
        fontWeight: 600,
        letterSpacing: '0.12em',
        color: '#f0ede8',
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        {/* Purple arrow / cursor shape */}
        <path d="M8 8 L20 28 L23 21 L29 18 Z" fill="#6366f1" />
        {/* Amber dot */}
        <circle cx="27" cy="7" r="3.5" fill="#e8a24a" />
        {/* Connecting line */}
        <line
          x1="10" y1="8"
          x2="27" y2="7"
          stroke="rgba(232,162,74,0.4)"
          strokeWidth="1.5"
        />
      </svg>
      LIVECOLLAB
    </Tag>
  );
}
