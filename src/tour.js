// tour.js
// Onboarding tour — spotlight overlay and tooltip positioning.
// Depends on: state.js, storage.js

import * as state from './state.js';
import { markTourDone } from './storage.js';


const TOUR_STEPS = [
  {
    target: () => document.getElementById('kanbanBoard'),
    title:  'Your job board 📋',
    desc:   'Applications live here as cards in columns. Drag them between columns as things progress — Applied, Phone Screen, Interviewing, and so on.',
    place:  'bottom',
  },
  {
    target: () => document.querySelector('.btn-add'),
    title:  'Add a job ➕',
    desc:   'Click here to log a new application. Fill in the basics and you can always come back to add more detail later.',
    place:  'bottom',
  },
  {
    target: () => document.querySelector('.theme-swatches'),
    title:  'Pick a theme 🎨',
    desc:   "Six dark themes to choose from. It's a tough market — you deserve something nice to look at.",
    place:  'bottom',
  },
  {
    target: () => document.getElementById('searchBar'),
    title:  'Search & filter 🔍',
    desc:   'Type to search by company or role. Click into the bar to expand filters for status, work type, and salary range.',
    place:  'bottom',
  },
  {
    target: () => document.querySelectorAll('.tab')[4],
    title:  'Timeline 📅',
    desc:   'A chronological feed and calendar of everything happening across your applications — status changes, interviews, deadlines.',
    place:  'bottom',
  },
  {
    target: () => document.querySelectorAll('.tab')[3],
    title:  'Goals 🎯',
    desc:   'Set weekly and monthly application targets, interview goals, and track your total offers. Progress updates automatically.',
    place:  'bottom',
  },
  {
    target: () => document.querySelectorAll('.tab')[5],
    title:  'Email templates ✉️',
    desc:   'Build a library of reusable templates for follow-ups, thank yous, and recruiter outreach. They auto-fill with job details when you use them.',
    place:  'bottom',
  },
  {
    target: () => document.querySelector('.settings-btn'),
    title:  'Settings ⚙️',
    desc:   'Export your applications to CSV or change your name from here. You can also re-run this tour any time.',
    place:  'left',
  },
];


export function startTour() {
  document.getElementById('settingsDropdown')?.classList.remove('open');
  state.setTourStep(0);
  document.getElementById('tourOverlay').style.display = 'block';
  showTourStep();
}

export function endTour() {
  document.getElementById('tourOverlay').style.display = 'none';
  markTourDone();
}

export function tourNext() {
  state.setTourStep(state.tourStep + 1);
  if (state.tourStep >= TOUR_STEPS.length) { endTour(); return; }
  showTourStep();
}

function showTourStep() {
  const step   = TOUR_STEPS[state.tourStep];
  const target = step.target();

  if (!target) { tourNext(); return; }

  const rect = target.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) { tourNext(); return; }

  const pad = 8;
  const W   = window.innerWidth;
  const H   = window.innerHeight;

  // Update spotlight hole
  const hole = document.getElementById('tourHole');
  hole.setAttribute('x',      Math.max(0, rect.left   - pad));
  hole.setAttribute('y',      Math.max(0, rect.top    - pad));
  hole.setAttribute('width',  rect.width  + pad * 2);
  hole.setAttribute('height', rect.height + pad * 2);

  const svg = document.getElementById('tourSpotlight');
  svg.setAttribute('width',  W);
  svg.setAttribute('height', H);

  // Update tooltip content
  document.getElementById('tourStepLabel').textContent = `Step ${state.tourStep + 1} of ${TOUR_STEPS.length}`;
  document.getElementById('tourTitle').textContent     = step.title;
  document.getElementById('tourDesc').textContent      = step.desc;
  document.getElementById('tourNextBtn').textContent   = state.tourStep === TOUR_STEPS.length - 1 ? "Let's go! 🎉" : 'Next →';

  document.getElementById('tourDots').innerHTML = TOUR_STEPS.map((_, i) =>
    `<div class="tour-dot ${i === state.tourStep ? 'active' : ''}"></div>`
  ).join('');

  // Position tooltip using fixed known dimensions
  const tt  = document.getElementById('tourTooltip');
  const ttW = 290;
  const ttH = 160;
  let top, left;

  if (step.place === 'bottom') {
    top  = rect.bottom + pad + 10;
    left = rect.left + rect.width / 2 - ttW / 2;
  } else if (step.place === 'left') {
    top  = rect.top + rect.height / 2 - ttH / 2;
    left = rect.left - ttW - pad - 10;
    if (left < 10) left = rect.right + pad + 10;
  } else {
    top  = rect.top - ttH - pad - 10;
    left = rect.left + rect.width / 2 - ttW / 2;
  }

  // Clamp to viewport
  left = Math.max(10, Math.min(left, W - ttW - 10));
  top  = Math.max(10, Math.min(top,  H - ttH - 10));

  tt.style.top     = `${top}px`;
  tt.style.left    = `${left}px`;
  tt.style.opacity = '1';
  tt.style.width   = `${ttW}px`;
}