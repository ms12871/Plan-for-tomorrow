const STORAGE_KEY = 'plan_for_tomorrow_data';
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwllrvlo';
const FOCUS_TIMER_SECONDS = 10 * 60;
const defaultHours = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
  '09:00 PM', '10:00 PM'
];

let appState = {
  oneThing: '',
  oneThingDone: false,
  secondary: ['', '', ''],
  secondaryDone: [false, false, false],
  timeBlocks: {},
  brainDump: '',
  theme: 'dark',
  checklistDate: '',
  checklistHistory: {}
};

let timerSecondsRemaining = FOCUS_TIMER_SECONDS;
let timerInterval = null;
let viewingYesterday = false;

function getPlanDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

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
    input.setAttribute('aria-label', `Plan for ${hour}`);
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

function saveState() {
  appState.checklistDate = appState.checklistDate || getPlanDate();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  document.getElementById('saveStatus').textContent = 'Saved locally just now';
  clearTimeout(saveState.statusTimer);
  saveState.statusTimer = setTimeout(() => {
    document.getElementById('saveStatus').textContent = 'Made Love From Zafar';
  }, 1800);
  updateProgress();
}

function updateProgress() {
  const inputs = [
    appState.oneThing,
    ...(appState.secondary || []),
    ...Object.values(appState.timeBlocks || {}),
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
  document.getElementById('themeBtn').textContent = appState.theme === 'dark' ? 'Light mode' : 'Dark mode';
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSecondsRemaining / 60).toString().padStart(2, '0');
  const seconds = (timerSecondsRemaining % 60).toString().padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${minutes}:${seconds}`;
}

function setTimerRunning(isRunning) {
  const button = document.getElementById('timerStartBtn');
  button.textContent = isRunning ? 'Pause' : 'Start';
  button.setAttribute('aria-label', isRunning ? 'Pause 10-minute focus timer' : 'Start 10-minute focus timer');
}

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    setTimerRunning(false);
    document.getElementById('timerStatus').textContent = 'Paused. Continue when you are ready.';
    return;
  }

  if (timerSecondsRemaining === 0) {
    timerSecondsRemaining = FOCUS_TIMER_SECONDS;
    updateTimerDisplay();
  }

  setTimerRunning(true);
  document.getElementById('timerStatus').textContent = 'Focus on one small next step.';
  timerInterval = setInterval(() => {
    timerSecondsRemaining -= 1;
    updateTimerDisplay();
    if (timerSecondsRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      setTimerRunning(false);
      document.getElementById('timerStatus').textContent = 'Time is up. Notice what you moved forward.';
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSecondsRemaining = FOCUS_TIMER_SECONDS;
  updateTimerDisplay();
  setTimerRunning(false);
  document.getElementById('timerStatus').textContent = 'Ready when you are.';
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
  appState.secondaryDone = Array.isArray(appState.secondaryDone) ? appState.secondaryDone : [false, false, false];
  appState.secondaryDone = [0, 1, 2].map(i => Boolean(appState.secondaryDone[i]));
  appState.checklistHistory = appState.checklistHistory && typeof appState.checklistHistory === 'object' ? appState.checklistHistory : {};
  const planDate = getPlanDate();
  if (appState.checklistDate && appState.checklistDate !== planDate) {
    appState.checklistHistory[appState.checklistDate] = {
      oneThing: appState.oneThing,
      oneThingDone: Boolean(appState.oneThingDone),
      secondary: [...appState.secondary],
      secondaryDone: [...appState.secondaryDone]
    };
    appState.oneThingDone = false;
    appState.secondaryDone = [false, false, false];
  }
  appState.checklistDate = planDate;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  appState.theme = appState.theme === 'light' ? 'light' : 'dark';

  document.getElementById('oneThingInput').value = appState.oneThing || '';
  document.getElementById('oneThingDone').checked = Boolean(appState.oneThingDone);
  const secInputs = document.querySelectorAll('.sec-task');
  secInputs.forEach((input, i) => {
    input.value = (appState.secondary && appState.secondary[i]) || '';
  });
  document.querySelectorAll('.task-check').forEach((input, i) => {
    input.checked = Boolean(appState.secondaryDone[i]);
  });

  document.getElementById('brainDumpArea').value = appState.brainDump || '';
  buildTimeGrid();
  applyTheme();
  updateProgress();
}

function setPlannerReadOnly(readOnly) {
  document.querySelectorAll('input, textarea').forEach(input => {
    input.disabled = readOnly;
  });
  document.getElementById('applySuggestedFlowBtn').disabled = readOnly;
  document.getElementById('yesterdayBtn').textContent = readOnly ? 'Today' : 'Yesterday';
  document.getElementById('yesterdayBtn').setAttribute('aria-label', readOnly ? 'Return to today' : 'View yesterday checklist');
  document.getElementById('saveStatus').textContent = readOnly ? 'Viewing yesterday (read-only)' : 'Made Love From Zafar';
}

function showYesterday() {
  const yesterday = appState.checklistHistory[Object.keys(appState.checklistHistory).sort().pop()];
  if (!yesterday) {
    document.getElementById('saveStatus').textContent = 'No saved yesterday checklist yet';
    return;
  }
  viewingYesterday = true;
  document.getElementById('oneThingInput').value = yesterday.oneThing || '';
  document.getElementById('oneThingDone').checked = Boolean(yesterday.oneThingDone);
  document.querySelectorAll('.sec-task').forEach((input, i) => { input.value = yesterday.secondary?.[i] || ''; });
  document.querySelectorAll('.task-check').forEach((input, i) => { input.checked = Boolean(yesterday.secondaryDone?.[i]); });
  setPlannerReadOnly(true);
}

function showToday() {
  viewingYesterday = false;
  loadState();
  setPlannerReadOnly(false);
}

function setupListeners() {
  document.getElementById('oneThingInput').addEventListener('input', (e) => {
    if (viewingYesterday) return;
    appState.oneThing = e.target.value;
    saveState();
  });
  document.getElementById('oneThingDone').addEventListener('change', (e) => {
    if (viewingYesterday) return;
    appState.oneThingDone = e.target.checked;
    saveState();
  });

  document.querySelectorAll('.sec-task').forEach((input, i) => {
    input.addEventListener('input', (e) => {
      if (viewingYesterday) return;
      appState.secondary[i] = e.target.value;
      saveState();
    });
  });
  document.querySelectorAll('.task-check').forEach((input, i) => {
    input.addEventListener('change', (e) => {
      if (viewingYesterday) return;
      appState.secondaryDone[i] = e.target.checked;
      saveState();
    });
  });

  document.getElementById('brainDumpArea').addEventListener('input', (e) => {
    appState.brainDump = e.target.value;
    saveState();
  });

  document.getElementById('timerStartBtn').addEventListener('click', startTimer);
  document.getElementById('timerResetBtn').addEventListener('click', resetTimer);

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
        if (!restored || typeof restored !== 'object') {
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

  document.getElementById('formSubmitBtn').addEventListener('click', async () => {
    const status = document.getElementById('formStatus');
    const button = document.getElementById('formSubmitBtn');
    button.disabled = true;
    status.textContent = 'Saving online...';
    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Twilight Routine plan - ${new Date().toLocaleDateString()}`,
          oneThing: appState.oneThing,
          secondaryTasks: appState.secondary,
          completedOneThing: appState.oneThingDone,
          completedSecondaryTasks: appState.secondaryDone,
          timeBlocks: appState.timeBlocks,
          brainDump: appState.brainDump,
        })
      });
      if (!response.ok) throw new Error(`Formspree returned ${response.status}`);
      status.textContent = 'Saved online.';
    } catch (error) {
      status.textContent = 'Online save failed. Your local copy is still safe.';
      console.error('Failed to submit planner to Formspree:', error);
    } finally {
      button.disabled = false;
    }
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

  document.getElementById('yesterdayBtn').addEventListener('click', () => {
    if (viewingYesterday) showToday();
    else showYesterday();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTomorrowDate();
  loadState();
  updateTimerDisplay();
  setupListeners();
});
