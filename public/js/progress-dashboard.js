document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  const connection = document.getElementById('progressConnection');
  let pollTimer;
  let socket;

  const initialTrendLabels = [
    ['progressLatestScore', 'Most recent assessment'],
    ['progressSolvedModules', 'Assessment modules completed'],
    ['progressBestScore', 'Highest completed assessment score'],
    ['progressAverageScore', 'Mean of completed assessment scores']
  ];
  initialTrendLabels.forEach(([id, label]) => {
    const trend = document.getElementById(id)?.parentElement.querySelector('.stat-trend');
    if (trend) trend.textContent = label;
  });

  const setConnection = (state, label) => {
    if (!connection) return;
    connection.dataset.state = state;
    connection.textContent = label;
  };

  const animateValue = (element, value, suffix = '') => {
    if (!element) return;
    const next = Number(value) || 0;
    const previous = Number(element.dataset.value || 0);
    const start = performance.now();
    const duration = 450;
    const renderFrame = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const current = previous + (next - previous) * progress;
      element.textContent = `${Number.isInteger(next) ? Math.round(current) : current.toFixed(1)}${suffix}`;
      if (progress < 1) requestAnimationFrame(renderFrame);
      else element.dataset.value = String(next);
    };
    requestAnimationFrame(renderFrame);
  };

  const formatScore = (score) => `${Number(score || 0).toFixed(1).replace(/\.0$/, '')}%`;

  const renderList = (element, rows, emptyText, scoreLabel) => {
    if (!element) return;
    element.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'progress-empty';
      empty.textContent = emptyText;
      element.append(empty);
      return;
    }

    rows.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'progress-row';
      const name = document.createElement('span');
      name.textContent = row.name;
      const score = document.createElement('strong');
      score.textContent = formatScore(row.score);
      item.append(name, score);
      if (scoreLabel) item.setAttribute('aria-label', `${row.name}: ${formatScore(row.score)}`);
      element.append(item);
    });
  };

  const render = (summary) => {
    if (!summary) return;
    animateValue(document.getElementById('progressLatestScore'), summary.score.latest, '%');
    animateValue(document.getElementById('progressBestScore'), summary.score.best, '%');
    animateValue(document.getElementById('progressAverageScore'), summary.score.average, '%');
    animateValue(document.getElementById('progressSolvedModules'), summary.modules.completed);

    const latestTrend = document.getElementById('progressLatestScore')?.parentElement.querySelector('.stat-trend');
    const moduleTrend = document.getElementById('progressSolvedModules')?.parentElement.querySelector('.stat-trend');
    const bestTrend = document.getElementById('progressBestScore')?.parentElement.querySelector('.stat-trend');
    const averageTrend = document.getElementById('progressAverageScore')?.parentElement.querySelector('.stat-trend');
    if (latestTrend) latestTrend.textContent = 'Most recent assessment';
    if (moduleTrend) moduleTrend.textContent = `${summary.modules.total} available modules`;
    if (bestTrend) bestTrend.textContent = 'Highest completed assessment score';
    if (averageTrend) averageTrend.textContent = 'Mean of completed assessment scores';

    const activity = summary.preparationActivity;
    if (activity) {
      animateValue(document.getElementById('preparationStreak'), activity.currentStreak, ' days');
      const todayStatus = document.getElementById('preparationTodayStatus');
      if (todayStatus) {
        todayStatus.textContent = activity.activeToday
          ? `Today is active: ${activity.questionsToday} question${activity.questionsToday === 1 ? '' : 's'} answered.`
          : 'Answer one question today to count this day toward your streak.';
      }
      const week = document.getElementById('preparationWeek');
      if (week) {
        week.replaceChildren();
        activity.days.forEach((day) => {
          const date = new Date(`${day.date}T12:00:00Z`);
          const item = document.createElement('div');
          item.className = `preparation-day${day.active ? ' is-active' : ''}${day.date === activity.today ? ' is-today' : ''}`;
          item.title = `${day.date}: ${day.questions} question${day.questions === 1 ? '' : 's'} answered`;
          const label = document.createElement('span');
          label.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' }).format(date);
          const count = document.createElement('strong');
          count.textContent = String(day.questions);
          item.append(label, count);
          week.append(item);
        });
      }
    }

    const total = document.getElementById('progressModuleTotal');
    if (total) total.textContent = `of ${summary.modules.total} available`;
    const moduleBadge = document.getElementById('progressModuleBadge');
    if (moduleBadge) moduleBadge.textContent = `${summary.modules.completed} modules solved`;
    const percent = Number(summary.modules.percentage || 0);
    const percentText = document.getElementById('progressModulePercent');
    if (percentText) percentText.textContent = `${Math.round(percent)}%`;
    const bar = document.getElementById('progressModuleBar');
    if (bar) bar.style.width = `${percent}%`;

    const latest = summary.modules.items[0];
    const latestName = document.getElementById('progressLatestModuleName');
    const latestMeta = document.getElementById('progressLatestModuleMeta');
    if (latestName) latestName.textContent = latest ? latest.name : 'No modules solved yet';
    if (latestMeta) latestMeta.textContent = latest
      ? `Latest score: ${formatScore(latest.score)}`
      : 'Complete an assessment to record your first score.';

    renderList(document.getElementById('solvedModulesList'), summary.modules.items, 'No solved modules yet.', true);
    renderList(document.getElementById('recentScoresList'), summary.recentScores, 'Scores will appear after you submit an assessment.', true);
  };

  const loadSummary = async () => {
    try {
      const response = await fetch('/api/progress/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.replace('/login');
        return;
      }
      if (!response.ok) throw new Error('Unable to load progress.');
      const result = await response.json();
      render(result.summary);
    } catch (_) {
      if (!socket?.connected) setConnection('offline', 'Offline');
    }
  };

  const startPolling = () => {
    if (!pollTimer) pollTimer = window.setInterval(loadSummary, 10000);
  };
  const stopPolling = () => {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  };

  loadSummary();
  if (typeof window.io !== 'function') {
    setConnection('polling', 'Polling');
    startPolling();
    return;
  }

  socket = window.io({ auth: { token }, reconnection: true });
  socket.on('connect', () => {
    setConnection('connected', 'Live');
    stopPolling();
    loadSummary();
  });
  socket.on('progress:update', render);
  socket.on('disconnect', () => {
    setConnection('reconnecting', 'Reconnecting');
    startPolling();
  });
  socket.on('connect_error', () => {
    setConnection('polling', 'Polling');
    startPolling();
  });
});
