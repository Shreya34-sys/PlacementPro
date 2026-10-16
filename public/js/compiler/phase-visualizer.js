/**
 * Phase Visualizer Manager
 * Orchestrates navigation across the 6 Compiler Phases and Supporting Stages.
 */

export class PhaseVisualizer {
  constructor() {
    this.currentPhase = 'lexical';
    this.tabs = document.querySelectorAll('.phase-tab');
    this.containers = document.querySelectorAll('.phase-container');
    this.phaseData = null;
    this.initEventListeners();
  }

  initEventListeners() {
    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetPhase = tab.dataset.phase;
        this.switchPhase(targetPhase);
      });
    });

    // Next & Previous buttons inside phase views
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-nav-phase]')) {
        const target = e.target.getAttribute('data-nav-phase');
        this.switchPhase(target);
      }
    });
  }

  switchPhase(phaseKey) {
    this.currentPhase = phaseKey;

    this.tabs.forEach((tab) => {
      if (tab.dataset.phase === phaseKey) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    this.containers.forEach((container) => {
      if (container.id === `phase-${phaseKey}`) {
        container.classList.add('active');
      } else {
        container.classList.remove('active');
      }
    });
  }

  updatePhaseStatuses(phases = {}, supporting = {}) {
    this.tabs.forEach((tab) => {
      const phaseKey = tab.dataset.phase;
      const statusDot = tab.querySelector('.phase-status-dot');
      if (!statusDot) return;

      statusDot.className = 'phase-status-dot';
      let status = 'blocked';

      if (phases[phaseKey]) {
        status = phases[phaseKey].status;
      } else if (supporting[phaseKey]) {
        status = supporting[phaseKey].status;
      }

      statusDot.classList.add(status);
      const phaseName = phases[phaseKey]?.name || supporting[phaseKey]?.name || tab.textContent.trim();
      const statusText = status === 'success' ? 'completed' : status === 'failed' ? 'failed' : 'unavailable';
      tab.title = `${phaseName}: ${statusText}`;
      tab.setAttribute('aria-label', `${phaseName}, ${statusText}`);
    });
  }
}
