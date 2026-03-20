# JobQuest

I built this because I was tracking job applications in a spreadsheet and it was making me miserable. Spreadsheets are fine for data but they don't really capture the emotional reality of job hunting — the waiting, the ghosting, the occasional confetti-worthy moment when something moves forward.

JobQuest is a desktop app built with Electron. It runs locally, keeps your data on your machine, and tries to be something you actually want to open.

![JobQuest — deep purple theme](screenshot.png)

---

## Features

There are six views: Board, List, Stats, Goals, Timeline, and Templates.

**Board** is a kanban with six columns — Applied, Phone Screen, Interviewing, Offer, Rejected, and Ghosted. Drag cards between them as things progress. Each card shows the basics plus any deadlines coming up, color-coded by urgency.

**List** is a sortable table for when you want rows instead of cards. You can sort by date, company, salary, or work type, and toggle a "Hide inactive" button to get Rejected and Ghosted out of your eyeline.

**Stats** gives you a breakdown of where everything stands — how many applications are active, your response funnel, work type distribution, and a quick summary of your goals.

**Goals** lets you set targets: applications per week, applications per month, interviews this month, and total offers. Progress counts automatically from your data and resets on schedule — weekly goals reset every Monday, monthly ones on the first of the month.

**Timeline** has two modes. The feed is a reverse-chronological list of everything that's happened across all your applications — when you applied, when statuses changed, when interviews are scheduled, upcoming deadlines. The calendar shows the same events on a monthly grid you can click through.

**Templates** is a library of email templates you can reuse across applications. There are four starter templates (follow-up after applying, thank you after an interview, feedback request after rejection, recruiter outreach) and you can add as many of your own as you want. Templates support `{{company}}`, `{{role}}`, and `{{your_name}}` placeholders that get filled in automatically when you use them.

---

Each job card has its own set of tabs:

- **Details** — the basics plus interview date, apply-by deadline, and hear-back-by deadline
- **Cover letter** — upload a PDF, DOCX, or TXT file, write/paste text, or both
- **Emails** — pick from your template library and they auto-fill with that job's details. You can have multiple emails saved per job
- **Resume** — upload the specific resume you submitted for that role
- **Bonus Q&A** — save answers to those long application form questions so you're not rewriting them every time
- **Notes** — anything else. Interview prep, contacts, follow-up reminders
- **Activity** — a log of changes: status moves, when a resume was attached, when dates were set

---

**Search and filters** sit above the stat cards. The search bar filters by company and role as you type. Click into it and filter pills expand underneath for status, work type, and salary range. Everything — the board, the list, and the CSV export — reflects whatever filters are active.

**Deadlines** show up as a badge on kanban cards and a column in the list view. Within 2 days the badge turns amber. Overdue goes red. Jobs that are already resolved (Rejected, Ghosted, Offer) don't show warnings.

**Themes** — six dark themes: purple, pink, peach, mint, ocean, midnight. Pick from the swatches in the top bar. The scrollbars match, the window controls match, everything matches.

**Export to CSV** lives in the gear menu and exports whatever's currently visible after filters.

---

## Getting started

You'll need [Node.js](https://nodejs.org) — the LTS version is fine.

```bash
git clone https://github.com/yourusername/jobquest.git
cd jobquest
npm install
npm start
```

The first time it opens, it'll ask for your name. That's just for the `{{your_name}}` placeholder in email templates — you can change it any time from the gear menu.

---

## Your data

Everything stays local. Nothing goes anywhere.

- **Windows:** `%APPDATA%\jobquest`
- **macOS:** `~/Library/Application Support/jobquest`
- **Linux:** `~/.config/jobquest`

Resumes and cover letter files are stored as base64 in the same JSON as everything else, so there's no separate folder to manage. If you want to back things up, the relevant localStorage keys are `jobquest_jobs`, `jobquest_templates`, `jobquest_theme`, `jobquest_goals`, and `jobquest_user_name`.

To update the app, replace `index.html`. If `main.js` or `preload.js` also changed in that update, replace those too. Only run `npm install` again if `package.json` changed.

---

## Project structure

```
jobquest/
├── index.html    # the whole app — UI, logic, everything
├── main.js       # Electron wrapper — window setup, IPC
├── preload.js    # bridge between the renderer and Electron APIs
└── package.json
```

---

## Building

To build an installable instead of running from source:

```bash
npm run build:win    # .exe
npm run build:mac    # .dmg
npm run build:linux  # AppImage
```

Builds go to `dist/`. You need to be on the target platform.

---

## License

MIT