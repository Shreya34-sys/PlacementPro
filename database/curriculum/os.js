/**
 * PlacementPro Theory Learning Library - Operating Systems (OS) Curriculum
 * Covers:
 * 1. CPU Scheduling Algorithms & Gantt Charts (FCFS, SJF, Round Robin calculations)
 * 2. Deadlock Characterization, Prevention & Banker's Algorithm
 * 3. Virtual Memory, Paging, TLB & Page Replacement Algorithms (LRU, FIFO)
 */

module.exports = [
  {
    chapterTitle: '1. CPU Scheduling & Concurrency Management',
    chapterDescription: 'Preemptive and non-preemptive scheduling algorithms, Gantt charts, turnaround and waiting time derivations.',
    topics: [
      {
        title: 'CPU Scheduling Algorithms: FCFS, SJF, SRTF, and Round Robin with Gantt Charts',
        slug: 'cpu-scheduling-algorithms-and-gantt-charts',
        summary: 'Comprehensive analysis of process scheduling algorithms with full Gantt charts, turnaround time, waiting time calculations, and Convoy Effect analysis.',
        minutes: 18,
        video_url: 'https://www.youtube.com/watch?v=ewabbgePCk4',
        video_title: 'CPU Scheduling Algorithms with Gantt Charts - Gate Smashers',
        video_source: 'Gate Smashers',
        video_objective: 'Calculate Turnaround Time (TAT), Waiting Time (WT), Response Time (RT), draw Gantt charts for preemptive and non-preemptive schedulers, and evaluate algorithmic trade-offs.',
        content: `
          <div class="callout callout-def">
            <strong>1. Definition & Core Meaning:</strong>
            <strong>CPU Scheduling</strong> is the core Operating System process by which the <strong>Short-Term Scheduler (CPU Dispatcher)</strong> selects which process from the Ready Queue will be allocated the CPU core for execution. Scheduling algorithms balance system throughput, latency, and fairness.
          </div>

          <h2>2. Key Scheduling Metrics & Formulas</h2>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Performance Metric</th>
                  <th>Mathematical Definition</th>
                  <th>Explanation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Arrival Time (AT)</strong></td>
                  <td>Point in time process enters Ready Queue</td>
                  <td>Recorded when OS loads process state</td>
                </tr>
                <tr>
                  <td><strong>Burst Time (BT)</strong></td>
                  <td>Total CPU time required for execution</td>
                  <td>Determined by compute workload</td>
                </tr>
                <tr>
                  <td><strong>Completion Time (CT)</strong></td>
                  <td>Timestamp when process finishes last instruction</td>
                  <td>Derived directly from the Gantt Chart</td>
                </tr>
                <tr>
                  <td><strong>Turnaround Time (TAT)</strong></td>
                  <td><code>TAT = Completion Time - Arrival Time</code></td>
                  <td>Total lifetime elapsed from arrival to completion</td>
                </tr>
                <tr>
                  <td><strong>Waiting Time (WT)</strong></td>
                  <td><code>WT = Turnaround Time - Burst Time</code></td>
                  <td>Total time spent sitting idle in the Ready Queue</td>
                </tr>
                <tr>
                  <td><strong>Response Time (RT)</strong></td>
                  <td><code>RT = First CPU Allocation - Arrival Time</code></td>
                  <td>Crucial for interactive user interfaces</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>3. Step-by-Step Worked Problem: Round Robin (Time Quantum = 2 ms)</h2>
          <p>Consider four processes arriving at time <code>AT = 0</code>:</p>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Process ID</th>
                  <th>Arrival Time (AT)</th>
                  <th>Burst Time (BT)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>P1</td><td>0 ms</td><td>5 ms</td></tr>
                <tr><td>P2</td><td>0 ms</td><td>3 ms</td></tr>
                <tr><td>P3</td><td>0 ms</td><td>1 ms</td></tr>
                <tr><td>P4</td><td>0 ms</td><td>2 ms</td></tr>
              </tbody>
            </table>
          </div>

          <h3>Execution Trace via Ready Queue (TQ = 2 ms):</h3>
          <ol>
            <li><strong>Time 0 - 2 ms:</strong> <code>P1</code> executes for 2 ms (3 ms remaining). Ready Queue: <code>[P2, P3, P4, P1]</code>.</li>
            <li><strong>Time 2 - 4 ms:</strong> <code>P2</code> executes for 2 ms (1 ms remaining). Ready Queue: <code>[P3, P4, P1, P2]</code>.</li>
            <li><strong>Time 4 - 5 ms:</strong> <code>P3</code> executes for 1 ms and <strong>completes at CT = 5 ms</strong>! Ready Queue: <code>[P4, P1, P2]</code>.</li>
            <li><strong>Time 5 - 7 ms:</strong> <code>P4</code> executes for 2 ms and <strong>completes at CT = 7 ms</strong>! Ready Queue: <code>[P1, P2]</code>.</li>
            <li><strong>Time 7 - 9 ms:</strong> <code>P1</code> executes for 2 ms (1 ms remaining). Ready Queue: <code>[P2, P1]</code>.</li>
            <li><strong>Time 9 - 10 ms:</strong> <code>P2</code> executes for 1 ms and <strong>completes at CT = 10 ms</strong>! Ready Queue: <code>[P1]</code>.</li>
            <li><strong>Time 10 - 11 ms:</strong> <code>P1</code> executes for 1 ms and <strong>completes at CT = 11 ms</strong>!</li>
          </ol>

          <h2>4. Architectural Diagram: Round Robin Gantt Chart</h2>
          <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <svg viewBox="0 0 680 180" width="100%" height="auto" style="max-width: 640px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <text x="340" y="30" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">ROUND ROBIN GANTT CHART (TIME QUANTUM = 2 ms)</text>

              <!-- Gantt Chart Blocks -->
              <!-- P1: 0-2 (width 90) -->
              <rect x="50" y="60" width="90" height="50" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" />
              <text x="95" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">P1</text>

              <!-- P2: 2-4 (width 90) -->
              <rect x="140" y="60" width="90" height="50" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
              <text x="185" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">P2</text>

              <!-- P3: 4-5 (width 50) -->
              <rect x="230" y="60" width="50" height="50" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" />
              <text x="255" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="#92400e">P3</text>

              <!-- P4: 5-7 (width 90) -->
              <rect x="280" y="60" width="90" height="50" fill="#f3e8ff" stroke="#7e22ce" stroke-width="1.5" />
              <text x="325" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="#6b21a8">P4</text>

              <!-- P1: 7-9 (width 90) -->
              <rect x="370" y="60" width="90" height="50" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" />
              <text x="415" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">P1</text>

              <!-- P2: 9-10 (width 50) -->
              <rect x="460" y="60" width="50" height="50" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
              <text x="485" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">P2</text>

              <!-- P1: 10-11 (width 50) -->
              <rect x="510" y="60" width="50" height="50" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" />
              <text x="535" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">P1</text>

              <!-- Time Markers -->
              <text x="50" y="130" text-anchor="middle" font-size="11" fill="#475569">0</text>
              <text x="140" y="130" text-anchor="middle" font-size="11" fill="#475569">2</text>
              <text x="230" y="130" text-anchor="middle" font-size="11" fill="#475569">4</text>
              <text x="280" y="130" text-anchor="middle" font-size="11" fill="#475569">5</text>
              <text x="370" y="130" text-anchor="middle" font-size="11" fill="#475569">7</text>
              <text x="460" y="130" text-anchor="middle" font-size="11" fill="#475569">9</text>
              <text x="510" y="130" text-anchor="middle" font-size="11" fill="#475569">10</text>
              <text x="560" y="130" text-anchor="middle" font-size="11" fill="#475569">11</text>
            </svg>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 5.1: Preemptive Round Robin Execution Timeline Showing Timeslice Transitions</div>
          </div>

          <h3>Derived Calculation Table:</h3>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Process</th>
                  <th>Completion Time (CT)</th>
                  <th>Turnaround Time (TAT = CT - AT)</th>
                  <th>Waiting Time (WT = TAT - BT)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>P1</td><td>11 ms</td><td>11 - 0 = 11 ms</td><td>11 - 5 = 6 ms</td></tr>
                <tr><td>P2</td><td>10 ms</td><td>10 - 0 = 10 ms</td><td>10 - 3 = 7 ms</td></tr>
                <tr><td>P3</td><td>5 ms</td><td>5 - 0 = 5 ms</td><td>5 - 1 = 4 ms</td></tr>
                <tr><td>P4</td><td>7 ms</td><td>7 - 0 = 7 ms</td><td>7 - 2 = 5 ms</td></tr>
              </tbody>
            </table>
          </div>
          <p><strong>Average Turnaround Time:</strong> <code>(11 + 10 + 5 + 7) / 4 = 33 / 4 = 8.25 ms</code></p>
          <p><strong>Average Waiting Time:</strong> <code>(6 + 7 + 4 + 5) / 4 = 22 / 4 = 5.50 ms</code></p>

          <h2>5. Comparison Analysis of CPU Scheduling Algorithms</h2>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Preemptive?</th>
                  <th>Selection Criteria</th>
                  <th>Advantages</th>
                  <th>Limitations</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>FCFS (First-Come, First-Served)</strong></td>
                  <td>No</td>
                  <td>Smallest Arrival Time</td>
                  <td>Simple implementation; zero starvation</td>
                  <td>Suffers from severe <strong>Convoy Effect</strong></td>
                </tr>
                <tr>
                  <td><strong>SJF (Shortest Job First)</strong></td>
                  <td>No</td>
                  <td>Smallest Burst Time</td>
                  <td><strong>Mathematically optimal</strong> minimum average waiting time</td>
                  <td>Requires future burst estimation; causes starvation</td>
                </tr>
                <tr>
                  <td><strong>SRTF (Shortest Remaining Time First)</strong></td>
                  <td>Yes</td>
                  <td>Smallest Remaining Burst</td>
                  <td>Highly responsive for short tasks</td>
                  <td>High context-switching overhead</td>
                </tr>
                <tr>
                  <td><strong>Round Robin (RR)</strong></td>
                  <td>Yes</td>
                  <td>FIFO queue + Time Quantum slice</td>
                  <td>Fair, starvation-free; optimal response time</td>
                  <td>Performance heavily depends on Time Quantum size</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>6. Multiple Choice Questions (MCQ)</h2>
          <div class="mcq-container">
            <div class="mcq-card">
              <div class="mcq-header">
                <span class="mcq-badge">MCQ Practice 3</span>
                <span style="font-size:0.8rem; color:var(--study-text-muted);">OS Core Principles</span>
              </div>
              <div class="mcq-question">
                What occurs if the Round Robin Time Quantum (TQ) is set extremely large (approaching infinity)?
              </div>
              <div class="mcq-options-list">
                <div class="mcq-option"><span class="mcq-option-letter">A)</span> <span>It degenerates into Shortest Job First (SJF)</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">B)</span> <span>It degenerates into First-Come First-Served (FCFS)</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">C)</span> <span>System throughput drops to zero due to thrashing</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">D)</span> <span>Average response time reaches mathematical optimum</span></div>
              </div>
              <button type="button" class="mcq-reveal-btn">Show Answer &amp; Detailed Explanation</button>
              <div class="mcq-explanation" style="display: none;">
                <strong>Correct Answer: B) It degenerates into First-Come First-Served (FCFS)</strong><br>
                <em>Explanation:</em> If the Time Quantum exceeds the burst time of every process in the Ready Queue, each process runs to completion before preemption can occur. Consequently, processes execute in the exact order of their initial queue arrival, behaving identically to non-preemptive FCFS.
              </div>
            </div>
          </div>
        `
      }
    ]
  }
];
