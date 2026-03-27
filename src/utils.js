// utils.js
// Pure utility functions with no side effects and no dependencies.
// Safe to import from anywhere.


// IDs

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}


// Dates

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Returns [startISO, endISO] for the current Mon-Sun week.
export function weekRange() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return [mon.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)];
}


// Strings

export function escHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


// Salary

// Parses a salary string like "$120k-$150k" or "$120,000" into a number.
// Returns the midpoint for ranges, -1 if unparseable.
export function parseSalary(str) {
  if (!str) return -1;

  const parts = str.split(/[-–—to]+/i);

  const nums = parts.map(part => {
    part = part.trim().toLowerCase().replace(/[$£€,\s]/g, '');
    if (!part) return 0;
    if (part.endsWith('m')) return parseFloat(part) * 1_000_000;
    if (part.endsWith('k')) return parseFloat(part) * 1_000;
    return parseFloat(part) || 0;
  }).filter(n => n > 0);

  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : -1;
}

export function formatSalary(n) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'm';
  if (n >= 1_000)     return '$' + Math.round(n / 1_000) + 'k';
  return '$' + Math.round(n);
}


// localStorage

// Safe localStorage.getItem with JSON parsing and a fallback value.
// Returns fallback if the key doesn't exist or JSON is malformed.
export function lsGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`JobQuest: failed to save "${key}" to localStorage`, e);
  }
}


// Job factory

// Creates a job object with all fields initialised to safe defaults.
// Pass only the fields you want to override.
export function makeJob(fields = {}) {
  return {
    id:            uid(),
    company:       '',
    role:          '',
    location:      '',
    worktype:      'Remote',
    industry:      '',
    status:        'Applied',
    salary:        '',
    date:          todayISO(),
    interviewDate: '',
    applyBy:       '',
    hearBackBy:    '',
    link:          '',
    cover:         '',
    coverFile:     null,
    resume:        null,
    notes:         '',
    qa:            [],
    emails:        [],
    contacts:      [],
    activity:      [],
    ...fields,
  };
}