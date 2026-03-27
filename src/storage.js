// storage.js
// All localStorage read and write operations live here.
// Nothing else in the app should call localStorage directly.

import { lsGet, lsSet } from './utils.js';
import {
  setJobs, setTemplates, setGoalTargets, setCustomIndustries,
  setMoodLog, setCardDensity, setUserName, setIsDark,
  setHideInactive, setActiveStatuses,
  STATUSES, GOAL_DEFAULTS,
} from './state.js';


// Storage keys

const KEYS = {
  jobs:         'jobquest_jobs',
  templates:    'jobquest_templates',
  goals:        'jobquest_goals',
  industries:   'jobquest_industries',
  moods:        'jobquest_moods',
  density:      'jobquest_density',
  userName:     'jobquest_user_name',
  theme:        'jobquest_theme',
  mode:         'jobquest_mode',
  hideInactive: 'jobquest_hide_inactive',
  tourDone:     'jobquest_tour_done',
};


// Load all persisted state into memory.
// Called once on app startup in app.js.
// Returns the saved theme name so app.js can call applyTheme() after.

export function loadAll(defaultTemplates, seedData) {
  const savedJobs = lsGet(KEYS.jobs);
  setJobs(savedJobs ?? seedData());

  const savedTemplates = lsGet(KEYS.templates);
  setTemplates(savedTemplates ?? JSON.parse(JSON.stringify(defaultTemplates)));

  setGoalTargets({ ...GOAL_DEFAULTS, ...lsGet(KEYS.goals, {}) });
  setCustomIndustries(lsGet(KEYS.industries, []));
  setMoodLog(lsGet(KEYS.moods, {}));
  setCardDensity(lsGet(KEYS.density, 'comfortable'));

  const savedName = lsGet(KEYS.userName, '');
  setUserName(savedName);

  const savedMode = lsGet(KEYS.mode, 'dark');
  setIsDark(savedMode !== 'light');

  if (lsGet(KEYS.hideInactive)) {
    setHideInactive(true);
    const active = new Set(STATUSES);
    active.delete('Rejected');
    active.delete('Ghosted');
    setActiveStatuses(active);
  }

  const theme = lsGet(KEYS.theme, 'purple');
  return theme;
}


// Individual persist functions.
// Each module calls the one it needs after mutating state.

export function persistJobs(jobs) {
  lsSet(KEYS.jobs, jobs);
}

export function persistTemplates(templates) {
  lsSet(KEYS.templates, templates);
}

export function persistGoals(goalTargets) {
  lsSet(KEYS.goals, goalTargets);
}

export function persistIndustries(customIndustries) {
  lsSet(KEYS.industries, customIndustries);
}

export function persistMoods(moodLog) {
  lsSet(KEYS.moods, moodLog);
}

export function persistDensity(density) {
  lsSet(KEYS.density, density);
}

export function persistUserName(name) {
  lsSet(KEYS.userName, name);
}

export function persistTheme(themeName) {
  lsSet(KEYS.theme, themeName);
}

export function persistMode(isDark) {
  lsSet(KEYS.mode, isDark ? 'dark' : 'light');
}

export function persistHideInactive(value) {
  // stored as '1' or '' to match existing saved data shape
  localStorage.setItem(KEYS.hideInactive, value ? '1' : '');
}

export function markTourDone() {
  lsSet(KEYS.tourDone, '1');
}

export function isTourDone() {
  return !!lsGet(KEYS.tourDone);
}