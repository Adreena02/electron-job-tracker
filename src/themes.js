// themes.js
// Theme definitions and functions to apply and toggle them.
// Depends on: state.js, storage.js, particles.js

import * as state from './state.js';
import { persistTheme, persistMode } from './storage.js';


// Theme definitions
// Each base name has a matching "-light" variant.

export const THEMES = {
  // Dark themes
  purple:           { accent:'#A78BFA', accentBg:'rgba(167,139,250,0.2)',  accentBorder:'#7C5FCC', accentText:'#DDD6FE', gradA:'#C084FC', gradB:'#818CF8', bg:'#1A1030', surface:'#241840', surface2:'#2E1F52', border:'rgba(167,139,250,0.15)', border2:'rgba(167,139,250,0.28)', text:'#EDE9FE', text2:'#A78BFA', text3:'#6D5FA0' },
  pink:             { accent:'#EC4899', accentBg:'rgba(236,72,153,0.15)',   accentBorder:'#BE185D', accentText:'#FBCFE8', gradA:'#F472B6', gradB:'#FB7185', bg:'#1C0A14', surface:'#2A1020', surface2:'#381528', border:'rgba(244,114,182,0.15)', border2:'rgba(244,114,182,0.28)', text:'#FDF2F8', text2:'#F472B6', text3:'#7A3050' },
  peach:            { accent:'#FB923C', accentBg:'rgba(251,146,60,0.2)',    accentBorder:'#C2410C', accentText:'#FED7AA', gradA:'#FB923C', gradB:'#F59E0B', bg:'#1C1004', surface:'#281808', surface2:'#33200C', border:'rgba(251,146,60,0.15)',  border2:'rgba(251,146,60,0.28)',  text:'#FFF7ED', text2:'#FB923C', text3:'#7C3508' },
  mint:             { accent:'#10B981', accentBg:'rgba(16,185,129,0.15)',   accentBorder:'#059669', accentText:'#A7F3D0', gradA:'#34D399', gradB:'#059669', bg:'#021810', surface:'#072418', surface2:'#0D3020', border:'rgba(52,211,153,0.15)',  border2:'rgba(52,211,153,0.28)',  text:'#ECFDF5', text2:'#34D399', text3:'#1A5C38' },
  ocean:            { accent:'#0EA5E9', accentBg:'rgba(14,165,233,0.15)',   accentBorder:'#0369A1', accentText:'#BAE6FD', gradA:'#38BDF8', gradB:'#3B82F6', bg:'#030D1C', surface:'#071828', surface2:'#0C2238', border:'rgba(56,189,248,0.15)',  border2:'rgba(56,189,248,0.28)',  text:'#F0F9FF', text2:'#38BDF8', text3:'#1A4A6C' },
  midnight:         { accent:'#94A3B8', accentBg:'rgba(148,163,184,0.15)', accentBorder:'#475569',  accentText:'#E2E8F0', gradA:'#64748B', gradB:'#334155', bg:'#020408', surface:'#0D1117', surface2:'#161B22', border:'rgba(255,255,255,0.06)', border2:'rgba(255,255,255,0.12)', text:'#F1F5F9', text2:'#94A3B8', text3:'#3D4A5C' },

  // Light themes
  'purple-light':   { accent:'#7C3AED', accentBg:'rgba(124,58,237,0.1)',   accentBorder:'#7C3AED', accentText:'#5B21B6', gradA:'#C084FC', gradB:'#818CF8', bg:'#FAF8FF', surface:'#FFFFFF', surface2:'#F0EBFF', border:'rgba(124,58,237,0.12)',  border2:'rgba(124,58,237,0.22)',  text:'#1E1030', text2:'#6D28D9', text3:'#9D85C9' },
  'pink-light':     { accent:'#DB2777', accentBg:'rgba(219,39,119,0.1)',   accentBorder:'#BE185D', accentText:'#831843', gradA:'#F472B6', gradB:'#FB7185', bg:'#FFF7FA', surface:'#FFFFFF', surface2:'#FDE8F1', border:'rgba(219,39,119,0.12)',  border2:'rgba(219,39,119,0.22)',  text:'#1C0A14', text2:'#BE185D', text3:'#C07090' },
  'peach-light':    { accent:'#EA580C', accentBg:'rgba(234,88,12,0.1)',    accentBorder:'#C2410C', accentText:'#7C2D12', gradA:'#FB923C', gradB:'#F59E0B', bg:'#FFFAF7', surface:'#FFFFFF', surface2:'#FEF0E4', border:'rgba(234,88,12,0.12)',   border2:'rgba(234,88,12,0.22)',   text:'#1C1004', text2:'#C2410C', text3:'#C09060' },
  'mint-light':     { accent:'#059669', accentBg:'rgba(5,150,105,0.1)',    accentBorder:'#047857', accentText:'#064E3B', gradA:'#34D399', gradB:'#059669', bg:'#F7FFFC', surface:'#FFFFFF', surface2:'#E6FAF4', border:'rgba(5,150,105,0.12)',   border2:'rgba(5,150,105,0.22)',   text:'#022810', text2:'#047857', text3:'#60A890' },
  'ocean-light':    { accent:'#0369A1', accentBg:'rgba(3,105,161,0.1)',    accentBorder:'#0369A1', accentText:'#0C4A6E', gradA:'#38BDF8', gradB:'#3B82F6', bg:'#F7FBFF', surface:'#FFFFFF', surface2:'#E8F4FD', border:'rgba(3,105,161,0.12)',   border2:'rgba(3,105,161,0.22)',   text:'#030D1C', text2:'#0369A1', text3:'#6090B0' },
  'midnight-light': { accent:'#475569', accentBg:'rgba(71,85,105,0.1)',    accentBorder:'#334155', accentText:'#1E293B', gradA:'#64748B', gradB:'#475569', bg:'#F8FAFC', surface:'#FFFFFF', surface2:'#F1F5F9', border:'rgba(71,85,105,0.12)',   border2:'rgba(71,85,105,0.22)',   text:'#0F172A', text2:'#475569', text3:'#94A3B8' },
};


// Apply a theme by name.
// Updates all CSS custom properties, the active swatch, persists the
// choice, refreshes the mode button, and updates the particle colour.
// particles.js is imported lazily inside the function to avoid a
// circular dependency (particles -> themes -> particles).

export function applyTheme(name) {
  state.setCurrentThemeName(name);

  const key = state.isDark ? name : name + '-light';
  const t   = THEMES[key] || THEMES[name];
  const root = document.documentElement.style;

  root.setProperty('--accent',        t.accent);
  root.setProperty('--accent-bg',     t.accentBg);
  root.setProperty('--accent-border', t.accentBorder);
  root.setProperty('--accent-text',   t.accentText);
  root.setProperty('--grad-a',        t.gradA);
  root.setProperty('--grad-b',        t.gradB);
  root.setProperty('--bg',            t.bg);
  root.setProperty('--surface',       t.surface);
  root.setProperty('--surface2',      t.surface2);
  root.setProperty('--border',        t.border);
  root.setProperty('--border2',       t.border2);
  root.setProperty('--text',          t.text);
  root.setProperty('--text2',         t.text2);
  root.setProperty('--text3',         t.text3);

  document.body.style.background = t.bg;

  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  document.getElementById('sw-' + name)?.classList.add('active');

  persistTheme(name);
  updateModeBtn();

  // Update cached particle colour and restart if running
  state.setParticleColor(t.accent);
  if (state.particleActive) {
    cancelAnimationFrame(state.particleRaf);
    // Imported lazily to avoid circular dependency
    import('./particles.js').then(({ tickParticles }) => tickParticles());
  }
}

export function toggleMode() {
  state.setIsDark(!state.isDark);
  persistMode(state.isDark);
  applyTheme(state.currentThemeName);
}

export function updateModeBtn() {
  const btn = document.getElementById('modeBtn');
  if (btn) btn.textContent = state.isDark ? '☀️' : '🌙';
}