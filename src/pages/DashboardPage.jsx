import React from "react";

export default function DashboardPage() {
  return (
    <>
      <style>{`
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap");

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f4f5f7;
    --sidebar: #1a2035;
    --sidebar-hover: rgba(255,255,255,0.06);
    --sidebar-active: rgba(99,102,241,0.2);
    --sidebar-active-border: #6366f1;
    --white: #ffffff;
    --text: #1a1a2e;
    --text-muted: #6b7280;
    --text-light: #9ca3af;
    --border: #e5e7eb;
    --accent: #6366f1;
    --accent-hover: #4f52d3;
    --green: #10b981;
    --green-hover: #059669;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
    --shadow: 0 4px 16px rgba(0,0,0,0.08);
    --radius: 8px;
    --step-active: #6366f1;
    --step-done: #10b981;
    --step-pending: #d1d5db;
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); display: flex; height: 100vh; overflow: hidden; }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 60px;
    background: var(--sidebar);
    display: flex; flex-direction: column; align-items: center;
    padding: 16px 0; gap: 0;
    flex-shrink: 0; height: 100vh;
    position: relative; z-index: 10;
  }
  .sidebar-logo {
    width: 36px; height: 36px; margin-bottom: 28px;
    background: var(--accent);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .sidebar-logo svg { width: 20px; height: 20px; }

  .sidebar-nav { display: flex; flex-direction: column; gap: 2px; width: 100%; flex: 1; }
  .nav-item {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    width: 100%; padding: 10px 0; gap: 4px;
    color: rgba(255,255,255,0.38);
    cursor: pointer; transition: all 0.15s;
    border-left: 2px solid transparent;
    position: relative;
  }
  .nav-item:hover { color: rgba(255,255,255,0.7); background: var(--sidebar-hover); }
  .nav-item.active {
    color: #fff;
    background: var(--sidebar-active);
    border-left-color: var(--sidebar-active-border);
  }
  .nav-item svg { width: 18px; height: 18px; }
  .nav-label { font-size: 9px; font-weight: 500; letter-spacing: 0.04em; }

  .sidebar-bottom { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px 0; }
  .avatar-sm {
    width: 32px; height: 32px; border-radius: 50%;
    background: #4f52d3; color: #fff;
    font-size: 12px; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
  }

  /* ── MAIN LAYOUT ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  /* ── TOP BAR ── */
  .topbar {
    height: 56px; background: var(--white);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; flex-shrink: 0;
  }
  .topbar-title { font-size: 17px; font-weight: 600; color: var(--text); }
  .topbar-right { display: flex; align-items: center; gap: 8px; }
  .icon-btn {
    width: 34px; height: 34px; border-radius: var(--radius);
    border: 1px solid var(--border); background: transparent;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-muted); transition: all 0.15s;
  }
  .icon-btn:hover { background: var(--bg); color: var(--text); }
  .icon-btn svg { width: 16px; height: 16px; }
  .topbar-dropdown {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 500; color: var(--text);
    padding: 6px 12px; border-radius: var(--radius);
    border: 1px solid var(--border); cursor: pointer;
    background: var(--white); transition: all 0.15s;
  }
  .topbar-dropdown:hover { background: var(--bg); }
  .topbar-divider { width: 1px; height: 20px; background: var(--border); margin: 0 4px; }

  /* ── CONTENT AREA ── */
  .content-area { flex: 1; overflow-y: auto; padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

  /* Campaign Header */
  .campaign-header {
    background: var(--white);
    border-radius: var(--radius); border: 1px solid var(--border);
    padding: 20px 24px;
    box-shadow: var(--shadow-sm);
  }
  .campaign-title { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
  .campaign-sub { font-size: 13px; color: var(--text-muted); }

  /* STEPPER */
  .stepper {
    display: flex; align-items: center; gap: 0;
    margin-top: 20px;
  }
  .step {
    display: flex; align-items: center; gap: 8px;
    flex: 1;
  }
  .step-circle {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid var(--step-pending);
    background: transparent; color: var(--text-light);
    font-size: 11px; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.2s;
  }
  .step.done .step-circle { background: var(--step-done); border-color: var(--step-done); color: #fff; }
  .step.active .step-circle { background: var(--step-active); border-color: var(--step-active); color: #fff; }
  .step-name { font-size: 12px; font-weight: 500; color: var(--text-light); white-space: nowrap; }
  .step.active .step-name { color: var(--step-active); }
  .step.done .step-name { color: var(--step-done); }
  .step-bar { flex: 1; height: 2px; background: var(--step-pending); margin: 0 8px; border-radius: 1px; }
  .step-bar.done { background: var(--step-done); }
  .step-bar.active { background: linear-gradient(90deg, var(--step-done), var(--step-active)); }
  .step:last-child .step-bar { display: none; }

  /* BUILDER COLUMNS */
  .builder { display: grid; grid-template-columns: 1fr 360px; gap: 20px; flex: 1; }

  /* CENTER - EMAIL CANVAS */
  .canvas-area {
    background: var(--white);
    border-radius: var(--radius); border: 1px solid var(--border);
    box-shadow: var(--shadow-sm); overflow: hidden;
    display: flex; flex-direction: column;
  }
  .canvas-toolbar {
    border-bottom: 1px solid var(--border);
    padding: 10px 16px;
    display: flex; align-items: center; gap: 8px;
    background: #fafafa;
  }
  .toolbar-btn {
    padding: 5px 10px; border-radius: 4px;
    font-size: 11px; font-weight: 500; color: var(--text-muted);
    border: 1px solid var(--border); background: var(--white);
    cursor: pointer; transition: all 0.15s;
  }
  .toolbar-btn:hover { background: var(--bg); color: var(--text); }
  .toolbar-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
  .toolbar-sep { width: 1px; height: 16px; background: var(--border); margin: 0 4px; }

  .canvas-scroll { flex: 1; overflow-y: auto; padding: 24px; background: #e8eaed; display: flex; justify-content: center; }
  .email-frame {
    width: 100%; max-width: 560px;
    background: var(--white);
    border-radius: 4px;
    box-shadow: 0 2px 24px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .email-block {
    padding: 20px 24px;
    border-bottom: 1px dashed rgba(99,102,241,0.12);
    position: relative; cursor: pointer;
    transition: background 0.15s;
  }
  .email-block:hover { background: rgba(99,102,241,0.025); }
  .email-block:hover .block-tag { opacity: 1; }
  .block-tag {
    position: absolute; top: 8px; right: 8px;
    font-size: 9px; font-weight: 600; letter-spacing: 0.08em;
    background: var(--accent); color: #fff;
    padding: 2px 6px; border-radius: 3px;
    opacity: 0; transition: opacity 0.15s; pointer-events: none;
  }

  .email-header {
    background: #1a2035; padding: 20px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .email-logo-placeholder {
    font-size: 11px; font-weight: 500;
    color: rgba(255,255,255,0.4);
    border: 1px dashed rgba(255,255,255,0.2);
    padding: 6px 14px; border-radius: 4px;
    letter-spacing: 0.08em;
  }
  .email-header-links { display: flex; gap: 16px; }
  .email-header-links span { font-size: 11px; color: rgba(255,255,255,0.45); cursor: pointer; }

  .email-greeting { font-size: 15px; color: #374151; line-height: 1.5; }
  .email-greeting span { color: var(--accent); }
  .email-section-title { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
  .email-section-sub { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

  .email-img-placeholder {
    background: linear-gradient(135deg, #f0f1f3, #e4e6ea);
    border-radius: 6px; height: 160px;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-light); font-size: 12px;
    border: 1.5px dashed #d1d5db; margin: 12px 0;
  }
  .email-img-placeholder svg { width: 24px; height: 24px; margin-right: 8px; opacity: 0.5; }

  .email-cta {
    display: inline-block;
    background: var(--accent); color: #fff;
    font-size: 13px; font-weight: 600;
    padding: 11px 28px; border-radius: 6px;
    text-decoration: none; margin-top: 8px;
    cursor: pointer;
  }
  .email-footer-block {
    background: #f9fafb; padding: 16px 24px;
    text-align: center;
  }
  .email-footer-block p { font-size: 11px; color: var(--text-light); line-height: 1.6; }

  /* BOTTOM ACTIONS */
  .canvas-actions {
    border-top: 1px solid var(--border);
    padding: 12px 20px;
    display: flex; align-items: center; justify-content: space-between;
    background: #fafafa;
  }
  .btn-ghost {
    font-size: 13px; font-weight: 500;
    color: var(--text-muted); background: transparent;
    border: none; cursor: pointer; padding: 8px 16px;
    border-radius: var(--radius); transition: all 0.15s;
  }
  .btn-ghost:hover { background: var(--border); color: var(--text); }
  .canvas-actions-right { display: flex; gap: 8px; }
  .btn-secondary {
    font-size: 13px; font-weight: 500; color: var(--text);
    background: var(--white); border: 1px solid var(--border);
    padding: 8px 18px; border-radius: var(--radius);
    cursor: pointer; transition: all 0.15s;
  }
  .btn-secondary:hover { background: var(--bg); }
  .btn-primary {
    font-size: 13px; font-weight: 600; color: #fff;
    background: var(--green); border: none;
    padding: 8px 20px; border-radius: var(--radius);
    cursor: pointer; transition: all 0.15s;
    box-shadow: 0 2px 8px rgba(16,185,129,0.3);
  }
  .btn-primary:hover { background: var(--green-hover); }

  /* RIGHT PANEL */
  .right-panel {
    background: var(--white);
    border-radius: var(--radius); border: 1px solid var(--border);
    box-shadow: var(--shadow-sm); overflow: hidden;
    display: flex; flex-direction: column;
  }
  .panel-tabs {
    display: flex; border-bottom: 1px solid var(--border);
    background: #fafafa;
  }
  .panel-tab {
    flex: 1; padding: 11px 0; text-align: center;
    font-size: 12px; font-weight: 500; color: var(--text-muted);
    cursor: pointer; border-bottom: 2px solid transparent;
    transition: all 0.15s;
  }
  .panel-tab.active { color: var(--accent); border-bottom-color: var(--accent); background: var(--white); }

  .panel-body { flex: 1; overflow-y: auto; padding: 16px; }
  .panel-section { margin-bottom: 20px; }
  .panel-section-title {
    font-size: 10px; font-weight: 600;
    letter-spacing: 0.1em; color: var(--text-light);
    text-transform: uppercase; margin-bottom: 10px;
  }
  .component-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .component-item {
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    padding: 10px 6px; border-radius: var(--radius);
    border: 1px solid var(--border);
    cursor: grab; transition: all 0.15s;
    background: var(--white);
  }
  .component-item:hover {
    border-color: var(--accent);
    background: rgba(99,102,241,0.04);
    box-shadow: 0 2px 8px rgba(99,102,241,0.1);
  }
  .component-item svg { width: 20px; height: 20px; color: var(--text-muted); }
  .component-item:hover svg { color: var(--accent); }
  .component-label { font-size: 10px; font-weight: 500; color: var(--text-muted); }
  .component-item:hover .component-label { color: var(--accent); }

  .row-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: var(--radius);
    border: 1px solid var(--border); margin-bottom: 6px;
    cursor: grab; transition: all 0.15s;
  }
  .row-item:hover { border-color: var(--accent); background: rgba(99,102,241,0.04); }
  .row-preview { display: flex; gap: 3px; flex: 1; }
  .row-col { height: 20px; background: #e5e7eb; border-radius: 3px; flex: 1; }
  .row-item:hover .row-col { background: rgba(99,102,241,0.15); }
  .row-label { font-size: 11px; color: var(--text-muted); }

  /* Scrollbars */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>
{/* SIDEBAR */}
<div className="sidebar">
  <div className="sidebar-logo">
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M5 5 L13 17 L15 12 L19 10 Z" fill="#fff" opacity="0.9"/>
      <circle cx="17" cy="4" r="2.5" fill="#e8a24a"/>
    </svg>
  </div>
  <div className="sidebar-nav">
    {/* Dashboard */}
    <div className="nav-item" title="Dashboard">
      <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
      <span className="nav-label">Dash</span>
    </div>
    {/* SMS */}
    <div className="nav-item" title="SMS">
      <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
      <span className="nav-label">SMS</span>
    </div>
    {/* Email (active) */}
    <div className="nav-item active" title="Email">
      <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      <span className="nav-label">Email</span>
    </div>
    {/* Stats */}
    <div className="nav-item" title="Statistics">
      <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
      <span className="nav-label">Stats</span>
    </div>
    {/* Contacts */}
    <div className="nav-item" title="Contacts">
      <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
      <span className="nav-label">Contacts</span>
    </div>
    {/* Settings */}
    <div className="nav-item" title="Settings">
      <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      <span className="nav-label">Settings</span>
    </div>
  </div>
  <div className="sidebar-bottom">
    <div className="avatar-sm">A</div>
  </div>
</div>

{/* MAIN */}
<div className="main">
  {/* TOPBAR */}
  <div className="topbar">
    <div className="topbar-title">Email</div>
    <div className="topbar-right">
      <button className="icon-btn" title="Search">
        <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </button>
      <button className="icon-btn" title="Notifications" style={{position: "relative"}}>
        <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        <span style={{position: "absolute", top: "6px", right: "6px", width: "6px", height: "6px", background: "#ef4444", borderRadius: "50%", border: "1.5px solid #fff"}}></span>
      </button>
      <div className="topbar-divider"></div>
      <div className="avatar-sm" style={{width: "30px", height: "30px", fontSize: "11px"}}>AJ</div>
      <button className="topbar-dropdown">
        Campaigns
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
      </button>
    </div>
  </div>

  {/* CONTENT */}
  <div className="content-area">

    {/* Campaign Header + Stepper */}
    <div className="campaign-header">
      <div className="campaign-title">Campaign configuration</div>
      <div className="campaign-sub">Go through all steps to configure your campaign</div>
      <div className="stepper">
        <div className="step done">
          <div className="step-circle">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span className="step-name">Setup</span>
          <div className="step-bar done"></div>
        </div>
        <div className="step done">
          <div className="step-circle">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span className="step-name">Audience</span>
          <div className="step-bar active"></div>
        </div>
        <div className="step active">
          <div className="step-circle">3</div>
          <span className="step-name">Template</span>
          <div className="step-bar"></div>
        </div>
        <div className="step">
          <div className="step-circle">4</div>
          <span className="step-name">Design</span>
          <div className="step-bar"></div>
        </div>
        <div className="step">
          <div className="step-circle">5</div>
          <span className="step-name">Review</span>
          <div className="step-bar" style={{display: "none"}}></div>
        </div>
      </div>
    </div>

    {/* 2-column builder */}
    <div className="builder">

      {/* CENTER: EMAIL CANVAS */}
      <div className="canvas-area">
        <div className="canvas-toolbar">
          <button className="toolbar-btn active">Desktop</button>
          <button className="toolbar-btn">Mobile</button>
          <div className="toolbar-sep"></div>
          <button className="toolbar-btn">Preview</button>
          <button className="toolbar-btn">Send test</button>
          <div style={{flex: "1"}}></div>
          <button className="toolbar-btn">Undo</button>
          <button className="toolbar-btn">Redo</button>
        </div>

        <div className="canvas-scroll">
          <div className="email-frame">

            {/* Header */}
            <div className="email-header">
              <div className="email-logo-placeholder">YOUR LOGO HERE</div>
              <div className="email-header-links">
                <span>View online</span>
                <span>Unsubscribe</span>
              </div>
            </div>

            {/* Greeting block */}
            <div className="email-block">
              <span className="block-tag">TEXT</span>
              <p className="email-greeting">
                Hi <span>&#123;&#123; person.firstname | default: 'there' &#125;&#125;</span>,<br/>
                <span style={{color: "#6b7280", fontSize: "14px"}}>We have some exciting products to share with you this week.</span>
              </p>
            </div>

            {/* Section 1 */}
            <div className="email-block">
              <span className="block-tag">SECTION</span>
              <div className="email-section-title">Showcase products</div>
              <p className="email-section-sub">Discover our newest arrivals, crafted for performance and built to last through every challenge.</p>
              <div className="email-img-placeholder">
                <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                Drop image here
              </div>
              <a className="email-cta">Shop Now →</a>
            </div>

            {/* Section 2 */}
            <div className="email-block" style={{borderBottom: "none"}}>
              <span className="block-tag">SECTION</span>
              <div className="email-section-title" style={{fontSize: "16px"}}>New arrivals this week</div>
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px"}}>
                <div>
                  <div className="email-img-placeholder" style={{height: "100px", fontSize: "10px", margin: "0 0 8px"}}>Image</div>
                  <p style={{fontSize: "12px", fontWeight: "600", color: "#1a1a2e"}}>Product Name</p>
                  <p style={{fontSize: "11px", color: "#6b7280"}}>$99.00</p>
                </div>
                <div>
                  <div className="email-img-placeholder" style={{height: "100px", fontSize: "10px", margin: "0 0 8px"}}>Image</div>
                  <p style={{fontSize: "12px", fontWeight: "600", color: "#1a1a2e"}}>Product Name</p>
                  <p style={{fontSize: "11px", color: "#6b7280"}}>$149.00</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="email-footer-block">
              <p>You received this email because you signed up for our newsletter.<br/>
              <a href="#" style={{color: "#6366f1", textDecoration: "none"}}>Unsubscribe</a> · <a href="#" style={{color: "#6366f1", textDecoration: "none"}}>Privacy Policy</a></p>
            </div>
          </div>
        </div>

        <div className="canvas-actions">
          <button className="btn-ghost">← Return</button>
          <div className="canvas-actions-right">
            <button className="btn-secondary">Save & Exit</button>
            <button className="btn-primary">Continue →</button>
          </div>
        </div>
      </div>

      {/* RIGHT: COMPONENT PANEL */}
      <div className="right-panel">
        <div className="panel-tabs">
          <div className="panel-tab active">Content</div>
          <div className="panel-tab">Rows</div>
          <div className="panel-tab">Settings</div>
        </div>
        <div className="panel-body">
          <div className="panel-section">
            <div className="panel-section-title">Content Blocks</div>
            <div className="component-grid">
              <div className="component-item">
                <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
                <span className="component-label">Text</span>
              </div>
              <div className="component-item">
                <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                <span className="component-label">Image</span>
              </div>
              <div className="component-item">
                <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="8" rx="4"/></svg>
                <span className="component-label">Button</span>
              </div>
              <div className="component-item">
                <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M4 12h16"/></svg>
                <span className="component-label">Divider</span>
              </div>
              <div className="component-item">
                <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
                <span className="component-label">Share</span>
              </div>
              <div className="component-item">
                <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                <span className="component-label">HTML</span>
              </div>
              <div className="component-item">
                <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                <span className="component-label">Video</span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-section-title">Row Layouts</div>
            <div className="row-item">
              <div className="row-preview"><div className="row-col"></div></div>
              <span className="row-label">Full width</span>
            </div>
            <div className="row-item">
              <div className="row-preview"><div className="row-col"></div><div className="row-col"></div></div>
              <span className="row-label">Two columns</span>
            </div>
            <div className="row-item">
              <div className="row-preview"><div className="row-col"></div><div className="row-col"></div><div className="row-col"></div></div>
              <span className="row-label">Three columns</span>
            </div>
            <div className="row-item">
              <div className="row-preview"><div className="row-col" style={{flex: "2"}}></div><div className="row-col"></div></div>
              <span className="row-label">2/3 + 1/3</span>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-section-title">Active Block Settings</div>
            <div style={{background: "#f9fafb", border: "1px solid var(--border)", borderRadius: "6px", padding: "12px"}}>
              <p style={{fontSize: "12px", color: "var(--text-light)", textAlign: "center", padding: "8px 0"}}>Select a block in the canvas to edit its settings</p>
            </div>
          </div>
        </div>
      </div>

    </div>{/* /builder */}

  </div>{/* /content-area */}
</div>{/* /main */}
    </>
  );
}
