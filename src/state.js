// state.js
// Single source of truth for all mutable app state and shared constants.
// Import what you need — never mutate state from outside its owning module
// without going through the explicit setter functions below.


// App constants

export const STATUSES = ['Applied', 'Phone Screen', 'Interviewing', 'Offer', 'Rejected', 'Ghosted'];

export const STATUS_CFG = {
  'Applied':      { color: '#38BDF8', bg: 'rgba(56,189,248,0.18)',   text: '#7DD3FC', col: 'rgba(56,189,248,0.08)',   emoji: '📬' },
  'Phone Screen': { color: '#F472B6', bg: 'rgba(244,114,182,0.18)', text: '#F9A8D4', col: 'rgba(244,114,182,0.08)', emoji: '📞' },
  'Interviewing': { color: '#A78BFA', bg: 'rgba(167,139,250,0.18)', text: '#C4B5FD', col: 'rgba(167,139,250,0.08)', emoji: '✨' },
  'Offer':        { color: '#34D399', bg: 'rgba(52,211,153,0.18)',  text: '#6EE7B7', col: 'rgba(52,211,153,0.08)',  emoji: '🎉' },
  'Rejected':     { color: '#FB7185', bg: 'rgba(251,113,133,0.18)', text: '#FCA5A5', col: 'rgba(251,113,133,0.08)', emoji: '💌' },
  'Ghosted':      { color: '#D1B06B', bg: 'rgba(209,176,107,0.18)', text: '#FDE68A', col: 'rgba(209,176,107,0.08)', emoji: '👻' },
};

export const RESOLVED_STATUSES = ['Rejected', 'Ghosted', 'Offer'];
export const WARN_DAYS = 2;
export const WORKTYPE_ORDER = { Remote: 0, Hybrid: 1, 'On-site': 2 };

export const MODAL_TABS = ['details', 'contacts', 'cover', 'emails', 'resume', 'qa', 'notes', 'activity'];

export const TEXT_FIELDS = ['company', 'role', 'location', 'salary', 'link', 'cover', 'notes'];
export const DATE_FIELDS = {
  'interview-date': 'interviewDate',
  'apply-by':       'applyBy',
  'hear-back-by':   'hearBackBy',
};

export const DEFAULT_INDUSTRIES = [
  'Technology', 'Engineering', 'Finance', 'Healthcare', 'Education',
  'Marketing', 'Design', 'Legal', 'Retail', 'Hospitality',
  'Media', 'Non-profit', 'Government', 'Consulting', 'Real Estate', 'Other',
];

export const GOAL_DEFAULTS = { weekly: 5, monthly: 15, interviews: 3, offers: 1 };

export const MOODS = [
  { emoji: '😄', label: 'Great' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😔', label: 'Rough' },
  { emoji: '😤', label: 'Frustrated' },
];

export const CONFETTI_COLORS = ['#F472B6', '#A78BFA', '#38BDF8', '#34D399', '#FBBF24', '#FB7185', '#FCD34D'];

export const PARTICLE_COUNT = 55;

export const PREP_TEMPLATE = `── Interview Prep ──────────────────

Company research:


Why this role:


Interview format:


Who I'm interviewing with:


Key talking points:


Questions to ask them:
`;


// Jobs

export let jobs = [];

export function setJobs(value) { jobs = value; }
export function updateJob(id, updated) {
  const idx = jobs.findIndex(j => j.id === id);
  if (idx !== -1) jobs[idx] = updated;
}
export function addJob(job) { jobs.unshift(job); }
export function removeJob(id) { jobs = jobs.filter(j => j.id !== id); }


// Templates

export let templates = [];
export let editTemplateId = null;

export function setTemplates(value) { templates = value; }
export function setEditTemplateId(value) { editTemplateId = value; }


// User

export let userName = '';
export function setUserName(value) { userName = value; }


// Theme

export let isDark = true;
export let currentThemeName = 'purple';

export function setIsDark(value) { isDark = value; }
export function setCurrentThemeName(value) { currentThemeName = value; }


// Filters

export let activeStatuses  = new Set(STATUSES);
export let activeWorktypes = new Set(['Remote', 'Hybrid', 'On-site']);
export let activeIndustries = new Set();
export let hideInactive    = false;
export let searchQuery     = '';
export let salaryMin       = null;
export let salaryMax       = null;
export let customIndustries = [];

export function setActiveStatuses(value)   { activeStatuses  = value; }
export function setActiveWorktypes(value)  { activeWorktypes = value; }
export function setActiveIndustries(value) { activeIndustries = value; }
export function setHideInactive(value)     { hideInactive = value; }
export function setSearchQuery(value)      { searchQuery = value; }
export function setSalaryMin(value)        { salaryMin = value; }
export function setSalaryMax(value)        { salaryMax = value; }
export function setCustomIndustries(value) { customIndustries = value; }


// Goals

export let goalTargets = { ...GOAL_DEFAULTS };
export function setGoalTargets(value) { goalTargets = value; }


// Mood

export let moodLog = {};
export function setMoodLog(value) { moodLog = value; }


// Density

export let cardDensity = 'comfortable';
export function setCardDensity(value) { cardDensity = value; }


// Sort (list view)

export let sortKey = 'date';
export let sortDir = 'desc';

export function setSortKey(value) { sortKey = value; }
export function setSortDir(value) { sortDir = value; }


// Modal

export let editId = null;
export let currentResume    = null;
export let currentCoverFile = null;
export let currentQA        = [];
export let currentEmails    = [];
export let currentContacts  = [];

export function setEditId(value)          { editId = value; }
export function setCurrentResume(value)   { currentResume = value; }
export function setCurrentCoverFile(value){ currentCoverFile = value; }
export function setCurrentQA(value)       { currentQA = value; }
export function setCurrentEmails(value)   { currentEmails = value; }
export function setCurrentContacts(value) { currentContacts = value; }


// Tour

export let tourStep = 0;
export function setTourStep(value) { tourStep = value; }


// Duplicate / context menu

export let dupeSourceId = null;
export let contextJobId = null;

export function setDupeSourceId(value) { dupeSourceId = value; }
export function setContextJobId(value) { contextJobId = value; }


// Kanban drag

export let dragId      = null;
export let dragOverCol = null;

export function setDragId(value)      { dragId = value; }
export function setDragOverCol(value) { dragOverCol = value; }


// Timeline / calendar

export let timelineView = 'feed';
export let calYear      = new Date().getFullYear();
export let calMonth     = new Date().getMonth();
export let openCalDay   = null;

export function setTimelineView(value) { timelineView = value; }
export function setCalYear(value)      { calYear = value; }
export function setCalMonth(value)     { calMonth = value; }
export function setOpenCalDay(value)   { openCalDay = value; }


// Particles

export let particleBg     = [];
export let particleRaf    = null;
export let particleActive = false;
export let particleColor  = '#A78BFA';

export function setParticleBg(value)     { particleBg = value; }
export function setParticleRaf(value)    { particleRaf = value; }
export function setParticleActive(value) { particleActive = value; }
export function setParticleColor(value)  { particleColor = value; }


// Confetti

export let confettiParticles = [];
export let confettiRaf       = null;

export function setConfettiParticles(value) { confettiParticles = value; }
export function setConfettiRaf(value)       { confettiRaf = value; }


// Prep toast

export let prepToastTimer = null;
export function setPrepToastTimer(value) { prepToastTimer = value; }


// Ghost easter egg

export let ghostClickCount = 0;
export let ghostClickTimer = null;

export function setGhostClickCount(value) { ghostClickCount = value; }
export function setGhostClickTimer(value) { ghostClickTimer = value; }