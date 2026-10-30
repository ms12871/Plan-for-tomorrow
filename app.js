const STORAGE_KEY = 'plan_for_tomorrow_data';

const defaultHours = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
  '09:00 PM', '10:00 PM'
];

const helpfulQuotes = [
  {
    text: 'You do not have to see the whole path. You only need to take the next kind step.',
    author: 'A reminder for starting'
  },
  {
    text: 'Clarity often comes after action, not before it.',
    author: 'A reminder for overthinking'
  },
  {
    text: 'Make the next step so small that your brain has nothing left to argue with.',
    author: 'A reminder for momentum'
  },
  {
    text: 'A good plan is a place to begin, not a promise to control everything.',
    author: 'A reminder for flexibility'
  },
  {
    text: 'Done gently is better than perfect in your head.',
    author: 'A reminder for self-compassion'
  },
  {
    text: 'You can care deeply without carrying every possible outcome tonight.',
    author: 'A reminder for rest'
  }
];

let appState = {
  oneThing: '',
  secondary: ['', '', ''],
  timeBlocks: {},
  habits: {
    h_clothes: false,
    h_desk: false,
    h_bag: false,
    h_water: false,
    h_phone: false
  },
  quickWins: [],
  brainDump: '',
  reset: {
    worry: '',
    control: '',
    nextStep: ''
  },
  quoteIndex: 0,
  favoriteQuote: '',
  gratitude: ['', '', ''],
  completedWins: [],
  theme: 'dark'
};

let timerSeconds = 300;
let timerId = null;

function initTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  document.getElementById('tomorrowDateDisplay').textContent = `Target Date: ${tomorrow.toLocaleDateString(undefined, options)}`;
}

function buildTimeGrid() {
  const container = document.getElementById('timeGrid');
  container.innerHTML = '';
  defaultHours.forEach((hour, idx) => {
    const row = document.createElement('div');
    row.className = 'time-row';

    const lbl = document.createElement('div');
    lbl.className = 'time-label';
    lbl.textContent = hour;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'time-input';
    input.placeholder = 'Focus block, meeting, transit, or rest...';
    input.value = appState.timeBlocks[hour] || '';
    input.addEventListener('input', (e) => {
      appState.timeBlocks[hour] = e.target.value;
      saveState();
    });

    row.appendChild(lbl);
    row.appendChild(input);
    container.appendChild(row);
  });
}

function renderQuickWins() {
  const list = document.getElementById('quickWinsList');
  const empty = document.getElementById('quickWinsEmpty');
  list.innerHTML = '';
  empty.hidden = appState.quickWins.length > 0;
  appState.quickWins.forEach((win, index) => {
    const li = document.createElement('li');
    const label = document.createElement('label');
    label.className = 'win-label';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = appState.completedWins.includes(index);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) appState.completedWins.push(index);
      else appState.completedWins = appState.completedWins.filter(i => i !== index);
      saveState();
      renderQuickWins();
      updateProgress();
    });
    const text = document.createElement('span');
    text.textContent = win;
    if (checkbox.checked) text.className = 'completed';
    label.append(checkbox, text);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.title = 'Remove';
    remove.textContent = '×';
    li.append(label, remove);
    remove.addEventListener('click', () => {
      appState.quickWins.splice(index, 1);
      appState.completedWins = appState.completedWins.filter(i => i !== index).map(i => i > index ? i - 1 : i);
      saveState();
      renderQuickWins();
      updateProgress();
    });
    list.appendChild(li);
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  document.getElementById('saveStatus').textContent = 'Saved locally just now';
  clearTimeout(saveState.statusTimer);
  saveState.statusTimer = setTimeout(() => {
    document.getElementById('saveStatus').textContent = 'Saved locally in your browser';
  }, 1800);
  updateProgress();
}

function updateProgress() {
  const inputs = [
    appState.oneThing,
    ...(appState.secondary || []),
    ...Object.values(appState.timeBlocks || {}),
    ...Object.values(appState.habits || {}).map(Boolean),
    ...(appState.quickWins || []),
    ...(appState.gratitude || [])
  ];
  const filled = inputs.filter(value => typeof value === 'boolean' ? value : String(value).trim()).length;
  const total = inputs.length || 1;
  const percent = Math.round((filled / total) * 100);
  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('progressLabel').textContent = `${percent}% ready`;
  document.getElementById('progressDetail').textContent = percent === 100 ? 'You are ready for tomorrow' : `${filled} of ${total} planning prompts complete`;
}

function applyTheme() {
  document.body.dataset.theme = appState.theme;
  document.getElementById('themeBtn').textContent = appState.theme === 'dark' ? '☼ Light mode' : '☾ Dark mode';
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatTimer() {
  const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const seconds = (timerSeconds % 60).toString().padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${minutes}:${seconds}`;
}

function getTomorrowDateParts() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return {
    date,
    compact: date.toISOString().slice(0, 10).replace(/-/g, '')
  };
}

function getLocalDateKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDailyQuoteIndex(dateKey) {
  return [...dateKey].reduce((total, character) => total + character.charCodeAt(0), 0) % helpfulQuotes.length;
}

function renderQuote() {
  const quote = helpfulQuotes[appState.quoteIndex % helpfulQuotes.length];
  document.getElementById('quoteText').textContent = `“${quote.text}”`;
  document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;
  document.getElementById('saveQuoteBtn').textContent = appState.favoriteQuote === quote.text ? 'Saved favorite' : 'Save favorite';
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      appState = { ...appState, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }
  }
  appState.secondary = Array.isArray(appState.secondary) ? appState.secondary : ['', '', ''];
  appState.quickWins = Array.isArray(appState.quickWins) ? appState.quickWins : [];
  appState.completedWins = Array.isArray(appState.completedWins) ? appState.completedWins : [];
  appState.reset = appState.reset && typeof appState.reset === 'object' ? appState.reset : { worry: '', control: '', nextStep: '' };
  appState.quoteIndex = Number.isInteger(appState.quoteIndex) ? appState.quoteIndex : 0;
  appState.favoriteQuote = typeof appState.favoriteQuote === 'string' ? appState.favoriteQuote : '';
  appState.gratitude = Array.isArray(appState.gratitude) ? appState.gratitude : ['', '', ''];
  const today = getLocalDateKey();
  if (appState.quoteDate !== today) {
    appState.quoteIndex = getDailyQuoteIndex(today);
    appState.quoteDate = today;
    appState.favoriteQuote = '';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }
  appState.theme = appState.theme === 'light' ? 'light' : 'dark';

  document.getElementById('oneThingInput').value = appState.oneThing || '';
  const secInputs = document.querySelectorAll('.sec-task');
  secInputs.forEach((input, i) => {
    input.value = (appState.secondary && appState.secondary[i]) || '';
  });

  Object.keys(appState.habits || {}).forEach(k => {
    const el = document.getElementById(k);
    if (el) el.checked = !!appState.habits[k];
  });

  document.getElementById('brainDumpArea').value = appState.brainDump || '';
  document.getElementById('worryInput').value = appState.reset.worry || '';
  document.getElementById('controlInput').value = appState.reset.control || '';
  document.getElementById('nextStepInput').value = appState.reset.nextStep || '';
  appState.gratitude.forEach((value, index) => {
    document.getElementById(`gratitude${index + 1}`).value = value || '';
  });
  buildTimeGrid();
  renderQuickWins();
  applyTheme();
  renderQuote();
  updateProgress();
}

function setupListeners() {
  document.getElementById('oneThingInput').addEventListener('input', (e) => {
    appState.oneThing = e.target.value;
    saveState();
  });

  document.querySelectorAll('.sec-task').forEach((input, i) => {
    input.addEventListener('input', (e) => {
      appState.secondary[i] = e.target.value;
      saveState();
    });
  });

  ['h_clothes', 'h_desk', 'h_bag', 'h_water', 'h_phone'].forEach(k => {
    const el = document.getElementById(k);
    if (el) {
      el.addEventListener('change', (e) => {
        appState.habits[k] = e.target.checked;
        saveState();
      });
    }
  });

  document.getElementById('brainDumpArea').addEventListener('input', (e) => {
    appState.brainDump = e.target.value;
    saveState();
  });

  document.getElementById('backupBtn').addEventListener('click', () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(`twilight-routine-${date}.json`, JSON.stringify(appState, null, 2), 'application/json');
    document.getElementById('saveStatus').textContent = 'Backup downloaded';
  });

  document.getElementById('restoreBtn').addEventListener('click', () => {
    document.getElementById('restoreInput').click();
  });

  document.getElementById('restoreInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const restored = JSON.parse(reader.result);
        if (!restored || typeof restored !== 'object' || !Array.isArray(restored.quickWins)) {
          throw new Error('Invalid planner backup');
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...appState, ...restored }));
        location.reload();
      } catch (error) {
        document.getElementById('saveStatus').textContent = 'That backup file is not valid';
        console.error('Failed to restore backup:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  });

  document.getElementById('calendarBtn').addEventListener('click', () => {
    const { date, compact } = getTomorrowDateParts();
    const events = Object.entries(appState.timeBlocks || {}).filter(([, title]) => title && title.trim());
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Twilight Routine//EN'];
    events.forEach(([hour, title], index) => {
      const time = hour.match(/(\d{2}):(\d{2}) (AM|PM)/);
      if (!time) return;
      let hours = Number(time[1]) % 12;
      if (time[3] === 'PM') hours += 12;
      const start = `${compact}T${String(hours).padStart(2, '0')}${time[2]}00`;
      const endHour = hours + 1;
      const end = `${compact}T${String(endHour).padStart(2, '0')}${time[2]}00`;
      lines.push('BEGIN:VEVENT', `UID:twilight-${compact}-${index}@local`, `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${title.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n')}`, 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    downloadFile(`twilight-routine-${date.toISOString().slice(0, 10)}.ics`, lines.join('\r\n'), 'text/calendar');
    document.getElementById('saveStatus').textContent = events.length ? 'Calendar file downloaded' : 'Add time blocks before exporting';
  });

  document.getElementById('timerBtn').addEventListener('click', () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      document.getElementById('timerBtn').textContent = 'Resume focus';
      return;
    }
    document.getElementById('timerBtn').textContent = 'Pause';
    timerId = setInterval(() => {
      timerSeconds -= 1;
      formatTimer();
      if (timerSeconds <= 0) {
        clearInterval(timerId);
        timerId = null;
        document.getElementById('timerBtn').textContent = 'Start focus';
        document.getElementById('saveStatus').textContent = 'Focus session complete';
      }
    }, 1000);
  });

  document.getElementById('timerResetBtn').addEventListener('click', () => {
    clearInterval(timerId);
    timerId = null;
    timerSeconds = 300;
    formatTimer();
    document.getElementById('timerBtn').textContent = 'Start focus';
  });

  ['worryInput', 'controlInput', 'nextStepInput'].forEach((id) => {
    document.getElementById(id).addEventListener('input', (e) => {
      appState.reset[{ worryInput: 'worry', controlInput: 'control', nextStepInput: 'nextStep' }[id]] = e.target.value;
      saveState();
    });

    document.querySelectorAll('.gratitude-input').forEach((input, index) => {
      input.addEventListener('input', (event) => {
        appState.gratitude[index] = event.target.value;
        saveState();
      });
    });
  });

  const addQuickWin = () => {
    const input = document.getElementById('quickWinInput');
    const val = input.value.trim();
    if (val) {
      appState.quickWins.push(val);
      saveState();
      renderQuickWins();
      input.value = '';
    }
  };

  document.getElementById('addQuickWinBtn').addEventListener('click', addQuickWin);
  document.getElementById('quickWinInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addQuickWin();
  });

  document.getElementById('turnDumpToTasksBtn').addEventListener('click', () => {
    const lines = appState.brainDump.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
    if (lines.length) {
      appState.quickWins.push(...lines);
      appState.brainDump = '';
      document.getElementById('brainDumpArea').value = '';
      saveState();
      renderQuickWins();
      updateProgress();
    }
  });

  document.getElementById('parkThoughtBtn').addEventListener('click', () => {
    const nextStep = appState.reset.nextStep.trim();
    const confirmation = document.getElementById('resetConfirmation');
    if (!nextStep) {
      confirmation.textContent = 'Add one tiny next step first.';
      return;
    }
    if (!appState.quickWins.includes(nextStep)) appState.quickWins.push(nextStep);
    appState.reset.worry = '';
    appState.reset.control = '';
    appState.reset.nextStep = '';
    document.getElementById('worryInput').value = '';
    document.getElementById('controlInput').value = '';
    document.getElementById('nextStepInput').value = '';
    saveState();
    renderQuickWins();
    confirmation.textContent = 'Thought parked. Your next step is in Quick Wins.';
  });

  document.getElementById('clearResetBtn').addEventListener('click', () => {
    appState.reset = { worry: '', control: '', nextStep: '' };
    document.getElementById('worryInput').value = '';
    document.getElementById('controlInput').value = '';
    document.getElementById('nextStepInput').value = '';
    document.getElementById('resetConfirmation').textContent = 'Reset cleared.';
    saveState();
  });

  document.getElementById('newQuoteBtn').addEventListener('click', () => {
    appState.quoteIndex = (appState.quoteIndex + 1) % helpfulQuotes.length;
    appState.quoteDate = getLocalDateKey();
    document.getElementById('quoteStatus').textContent = '';
    renderQuote();
    saveState();
  });

  document.getElementById('saveQuoteBtn').addEventListener('click', () => {
    const quote = helpfulQuotes[appState.quoteIndex % helpfulQuotes.length];
    appState.favoriteQuote = appState.favoriteQuote === quote.text ? '' : quote.text;
    document.getElementById('quoteStatus').textContent = appState.favoriteQuote ? 'Saved for your next reset.' : 'Favorite removed.';
    renderQuote();
    saveState();
  });

  document.getElementById('applySuggestedFlowBtn').addEventListener('click', () => {
    const suggested = {
      '07:00 AM': 'Morning warmup, hydrate & light breakfast',
      '08:00 AM': 'Transit / commute & day setup',
      '09:00 AM': 'DEEP WORK: ' + (appState.oneThing || 'Main focus objective'),
      '11:00 AM': 'Secondary priority execution',
      '12:00 PM': 'Lunch & screen-free walk',
      '01:00 PM': 'Admin, inbox, micro-tasks',
      '03:00 PM': 'Team check-in / follow-ups',
      '05:00 PM': 'Daily shutdown & evening commute',
      '07:00 PM': 'Dinner, family & recharge',
      '10:00 PM': 'Wind down & prep next tomorrow'
    };
    appState.timeBlocks = { ...appState.timeBlocks, ...suggested };
    saveState();
    buildTimeGrid();
  });

  document.getElementById('themeBtn').addEventListener('click', () => {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveState();
  });

  document.getElementById('copyMdBtn').addEventListener('click', () => {
    let md = `# Plan For Tomorrow\n\n`;
    md += `## The One Thing\n- ${appState.oneThing || 'Not set'}\n\n`;
    md += `## Secondary Tasks\n`;
    (appState.secondary || []).forEach((t, i) => { if (t) md += `${i + 1}. ${t}\n`; });
    md += `\n## Schedule\n`;
    Object.keys(appState.timeBlocks || {}).forEach(k => {
      if (appState.timeBlocks[k]) md += `- **${k}**: ${appState.timeBlocks[k]}\n`;
    });
    md += `\n## Quick Wins\n`;
    (appState.quickWins || []).forEach(w => md += `- [ ] ${w}\n`);
    md += `\n## Gratitude\n`;
    (appState.gratitude || []).forEach(g => { if (g) md += `- ${g}\n`; });
    const showCopyStatus = (message) => {
      const btn = document.getElementById('copyMdBtn');
      const original = btn.textContent;
      btn.textContent = message;
      setTimeout(() => btn.textContent = original, 2000);
    };
    if (!navigator.clipboard) {
      showCopyStatus('Copy unavailable');
      return;
    }
    navigator.clipboard.writeText(md).then(() => {
      showCopyStatus('Copied!');
    }).catch(() => {
      showCopyStatus('Copy unavailable');
    });
  });

  document.getElementById('printBtn').addEventListener('click', () => window.print());

  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Reset your plan for tomorrow?')) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTomorrowDate();
  loadState();
  setupListeners();
});
