/**
 * PlacementPro — Student Personal Preparation Analytics
 * Strictly scoped to the authenticated student's real records across all 7 modules:
 * 1. Coding Rounds & C-Visualize Compiler
 * 2. Aptitude Practice
 * 3. AI Proctored Exams
 * 4. Mock Interviews
 * 5. Versant Speech Test
 * 6. Study Materials
 * 7. Resume AI Analyzer
 */

(function () {
    'use strict';

    let currentData = null;
    let isFetching = false;

    // DOM References
    const elements = {
        // Nav & Profile
        navAvatar: document.getElementById('navAvatar'),
        navUserName: document.getElementById('navUserName'),
        navUserRole: document.getElementById('navUserRole'),
        profileTrigger: document.getElementById('profileTrigger'),
        profileMenu: document.getElementById('profileMenu'),
        menuUserName: document.getElementById('menuUserName'),
        menuUserEmail: document.getElementById('menuUserEmail'),
        logoutBtn: document.getElementById('logoutBtn'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),

        // Filter & Controls
        filterRange: document.getElementById('filterRange'),
        btnRefresh: document.getElementById('btnRefresh'),

        // Banner
        bannerScore: document.getElementById('bannerScore'),
        bannerScoreBig: document.getElementById('bannerScoreBig'),
        bannerActiveDays: document.getElementById('bannerActiveDays'),
        bannerStreak: document.getElementById('bannerStreak'),
        bannerLastActivity: document.getElementById('bannerLastActivity'),
        formulaSubtitle: document.getElementById('formulaSubtitle'),

        // 8 Metric Cards
        valReadiness: document.getElementById('valReadiness'),
        valAptitudeSolved: document.getElementById('valAptitudeSolved'),
        valExamsCompleted: document.getElementById('valExamsCompleted'),
        subExamAvgNote: document.getElementById('subExamAvgNote'),
        valInterviews: document.getElementById('valInterviews'),
        subInterviewNote: document.getElementById('subInterviewNote'),
        valCoding: document.getElementById('valCoding'),
        subCodingNote: document.getElementById('subCodingNote'),
        valVersant: document.getElementById('valVersant'),
        subVersantNote: document.getElementById('subVersantNote'),
        valStudy: document.getElementById('valStudy'),
        subStudyNote: document.getElementById('subStudyNote'),
        valResume: document.getElementById('valResume'),
        subResumeNote: document.getElementById('subResumeNote'),

        // Containers
        recommendationsContainer: document.getElementById('recommendationsContainer'),
        moduleProgressList: document.getElementById('moduleProgressList'),
        weakTopicsContainer: document.getElementById('weakTopicsContainer'),
        activityChart: document.getElementById('activityChart'),
        activityChartContainer: document.getElementById('activityChartContainer'),
        assessmentsTableBody: document.getElementById('assessmentsTableBody'),
        interviewFeedbackArea: document.getElementById('interviewFeedbackArea'),
        communicationAndResumeArea: document.getElementById('communicationAndResumeArea'),
        activityFeedContainer: document.getElementById('activityFeedContainer')
    };

    // Auth Header Helper
    function getAuthHeaders() {
        const studentToken = localStorage.getItem('token');
        const adminToken = localStorage.getItem('adminToken');
        const token = studentToken || adminToken;
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    // Theme Management
    function initTheme() {
        const savedTheme = localStorage.getItem('placementpro_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        if (elements.themeToggleBtn) {
            elements.themeToggleBtn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme') || 'light';
                const next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('placementpro_theme', next);
                if (currentData) {
                    renderActivityChart(currentData.activityTimeline);
                }
            });
        }
    }

    // Profile Dropdown & Logout
    function initProfile() {
        if (elements.profileTrigger && elements.profileMenu) {
            elements.profileTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                elements.profileMenu.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!elements.profileMenu.contains(e.target) && !elements.profileTrigger.contains(e.target)) {
                    elements.profileMenu.classList.remove('active');
                }
            });
        }

        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            });
        }
    }

    // Update Header Avatar & Identity
    function updateHeaderProfile(meta) {
        if (!meta) return;

        const fullName = meta.fullName || 'Student';
        const email = meta.email || '';
        const initials = fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'ST';

        if (elements.navAvatar) elements.navAvatar.textContent = initials;
        if (elements.navUserName) elements.navUserName.textContent = fullName;
        if (elements.menuUserName) elements.menuUserName.textContent = fullName;
        if (elements.menuUserEmail) elements.menuUserEmail.textContent = email;
    }

    // Fetch Student Personal Analytics
    async function fetchAnalytics() {
        if (isFetching) return;
        isFetching = true;

        if (elements.btnRefresh) {
            elements.btnRefresh.classList.add('loading');
        }

        const range = elements.filterRange ? elements.filterRange.value : '30d';

        try {
            const res = await fetch(`/api/analytics/overview?range=${encodeURIComponent(range)}`, {
                headers: getAuthHeaders()
            });

            if (res.status === 401 || res.status === 403) {
                window.location.href = '/login';
                return;
            }

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch personal analytics');
            }

            currentData = data;
            renderAll(data);
        } catch (err) {
            console.error('Error fetching student analytics:', err);
            renderErrorState(err.message);
        } finally {
            isFetching = false;
            if (elements.btnRefresh) {
                elements.btnRefresh.classList.remove('loading');
            }
        }
    }

    // Main Render Pipeline
    function renderAll(data) {
        updateHeaderProfile(data.meta);
        renderReadinessBanner(data.readiness);
        renderOverviewCards(data);
        renderRecommendations(data.recommendations);
        renderModuleBreakdown(data.readiness.moduleProgressBreakdown);
        renderWeakTopics(data.weakTopics);
        renderActivityChart(data.activityTimeline);
        renderAssessmentsTable(data.modules.exams.history, data.modules.versant.latest);
        renderInterviewDeepDive(data.modules.interviews.latestFeedback);
        renderCommunicationAndResume(data.modules.versant.latest, data.modules.resume);
        renderActivityFeed(data.recentFeed);
    }

    // 1. Readiness Summary Banner
    function renderReadinessBanner(readiness) {
        if (!readiness) return;

        const score = readiness.overallScore || 0;
        if (elements.bannerScore) elements.bannerScore.textContent = `${score}%`;
        if (elements.bannerScoreBig) elements.bannerScoreBig.textContent = `${Math.round(score)}%`;
        if (elements.bannerActiveDays) elements.bannerActiveDays.textContent = `${readiness.activePracticeDays || 0} Days`;
        if (elements.bannerStreak) elements.bannerStreak.textContent = `${readiness.streak || 0} Day${readiness.streak === 1 ? '' : 's'}`;

        if (elements.bannerLastActivity) {
            if (readiness.lastActivityTime) {
                elements.bannerLastActivity.textContent = new Date(readiness.lastActivityTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                elements.bannerLastActivity.textContent = 'No activity yet';
            }
        }

        if (elements.formulaSubtitle && readiness.calculationFormula) {
            elements.formulaSubtitle.textContent = readiness.calculationFormula;
        }
    }

    // 2. Render 8 Personal KPI Cards
    function renderOverviewCards(data) {
        const { readiness, modules } = data;

        // Card 1: Overall Readiness
        if (elements.valReadiness) {
            elements.valReadiness.textContent = `${readiness.overallScore || 0}%`;
        }

        // Card 2: Aptitude Practice
        if (elements.valAptitudeSolved) {
            elements.valAptitudeSolved.textContent = `${modules.aptitude.questionsSolved || 0} Solved`;
        }

        // Card 3: Proctored Exams
        if (elements.valExamsCompleted) {
            elements.valExamsCompleted.textContent = `${modules.exams.completedCount || 0} Exams`;
            if (elements.subExamAvgNote) {
                elements.subExamAvgNote.textContent = `Avg score: ${modules.exams.averageScore || 0}`;
            }
        }

        // Card 4: Mock Interviews
        if (elements.valInterviews) {
            elements.valInterviews.textContent = `${modules.interviews.totalCount || 0} Sessions`;
            if (elements.subInterviewNote) {
                elements.subInterviewNote.textContent = `${modules.interviews.completedCount || 0} completed, avg ${modules.interviews.averageScore || 0}%`;
            }
        }

        // Card 5: Coding & Compiler
        if (elements.valCoding) {
            const runs = modules.coding.compilerRuns || 0;
            const subs = modules.coding.codingSubmissionsCount || 0;
            elements.valCoding.textContent = `${runs + subs} Runs`;
            if (elements.subCodingNote) {
                elements.subCodingNote.textContent = `${modules.coding.compilerSuccessful || 0} compiled (${modules.coding.compilerSuccessRate || 0}%)`;
            }
        }

        // Card 6: Versant Speech Test
        if (elements.valVersant) {
            if (modules.versant.latest && modules.versant.latest.overall_score != null) {
                elements.valVersant.textContent = `${Number(modules.versant.latest.overall_score).toFixed(1)}%`;
                if (elements.subVersantNote) {
                    elements.subVersantNote.textContent = `CEFR Level: ${modules.versant.latest.cefr_level || 'C1'}`;
                }
            } else {
                elements.valVersant.textContent = 'Not Taken';
                if (elements.subVersantNote) {
                    elements.subVersantNote.textContent = 'Take speech test';
                }
            }
        }

        // Card 7: Study Materials
        if (elements.valStudy) {
            elements.valStudy.textContent = `${modules.studyMaterials.totalTopicsTracked || 0} Topics`;
            if (elements.subStudyNote) {
                elements.subStudyNote.textContent = `${modules.studyMaterials.averageProgress || 0}% avg progress`;
            }
        }

        // Card 8: Resume AI Analyzer
        if (elements.valResume) {
            if (modules.resume && modules.resume.ats_score != null) {
                elements.valResume.textContent = `${modules.resume.ats_score} / 100`;
                if (elements.subResumeNote) {
                    elements.subResumeNote.textContent = `Formatting: ${modules.resume.formatting_status || 'Good'}`;
                }
            } else {
                elements.valResume.textContent = 'Not Uploaded';
                if (elements.subResumeNote) {
                    elements.subResumeNote.textContent = 'Upload in Resume AI';
                }
            }
        }
    }

    // 3. Personalized Recommendations ("What to Practise Next")
    function renderRecommendations(recommendations) {
        const container = elements.recommendationsContainer;
        if (!container) return;

        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
                    Great job! You are consistently performing across all active modules. Continue solving practice questions and mock tests.
                </div>
            `;
            return;
        }

        container.innerHTML = recommendations.map(rec => {
            const priorityClass = rec.priority === 'high' ? 'high' : (rec.priority === 'medium' ? 'medium' : 'low');
            return `
                <div class="recommendation-card">
                    <div>
                        <div class="rec-header">
                            <span class="rec-module">${escapeHtml(rec.module)}</span>
                            <span class="rec-priority ${priorityClass}">${rec.priority} Priority</span>
                        </div>
                        <div class="rec-title">${escapeHtml(rec.title)}</div>
                        <div class="rec-desc">${escapeHtml(rec.description)}</div>
                    </div>
                    <a href="${rec.actionUrl}" class="rec-btn">
                        <span>${escapeHtml(rec.actionText)}</span>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </a>
                </div>
            `;
        }).join('');
    }

    // 4. Module-Wise Progress Breakdown
    function renderModuleBreakdown(modules) {
        const container = elements.moduleProgressList;
        if (!container) return;

        if (!modules || modules.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">No module progress records found.</div>`;
            return;
        }

        const colors = ['blue', 'indigo', 'emerald', 'amber', 'purple', 'rose', 'teal'];

        container.innerHTML = modules.map((m, idx) => {
            const colorClass = colors[idx % colors.length];
            const pct = Math.min(100, Math.max(0, m.progress || 0));

            return `
                <div class="module-item">
                    <div class="module-item-header">
                        <div>
                            <span style="font-weight: 600; color: var(--text-primary);">${escapeHtml(m.module)}</span>
                            <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">(${m.weight} Weight)</span>
                        </div>
                        <span style="font-weight: 700; color: var(--brand-blue);">${pct}%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${colorClass}" style="width: ${pct}%;"></div>
                    </div>
                    <div class="module-item-meta">
                        ${escapeHtml(m.status)}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 5. Weak Topics Based on Actual Performance
    function renderWeakTopics(topics) {
        const container = elements.weakTopicsContainer;
        if (!container) return;

        if (!topics || topics.length === 0) {
            container.innerHTML = `
                <div style="width: 100%; text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" style="display: block; margin: 0 auto 8px; color: #10B981; opacity: 0.8;">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="9 12 11 14 15 10" />
                    </svg>
                    <strong>No critical weak topics diagnosed!</strong>
                    <p style="margin-top: 4px; font-size: 12px;">Your recent attempt accuracy and proctored scores are above alert thresholds.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = topics.map(t => {
            const badgeClass = t.severity === 'critical' ? 'critical' : 'moderate';
            return `
                <div class="weak-topic-card">
                    <div class="weak-topic-info">
                        <span class="weak-topic-name">${escapeHtml(t.topic)}</span>
                        <span class="weak-topic-reason">${escapeHtml(t.reason)}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                        <span class="weak-topic-badge ${badgeClass}">${t.severity}</span>
                        <a href="/available-exams" style="font-size: 11px; font-weight: 600; color: var(--brand-blue); text-decoration: none;">Practice &rarr;</a>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 6. Interactive Canvas Chart: Daily Practice Activity
    function renderActivityChart(timeline) {
        const canvas = elements.activityChart;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = elements.activityChartContainer;
        const rect = container.getBoundingClientRect();

        const dpr = window.devicePixelRatio || 1;
        const width = rect.width || 600;
        const height = 240;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.resetTransform();
        ctx.scale(dpr, dpr);

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)';
        const brandBlue = '#2563eb';
        const brandFill = isDark ? 'rgba(37, 99, 235, 0.25)' : 'rgba(37, 99, 235, 0.12)';

        ctx.clearRect(0, 0, width, height);

        if (!timeline || timeline.length === 0) {
            ctx.fillStyle = textColor;
            ctx.font = '500 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No recorded practice activity in this date range.', width / 2, height / 2 - 10);
            ctx.font = '400 12px Inter, system-ui, sans-serif';
            ctx.fillText('Solve aptitude questions, take proctored exams, or run code to log actions.', width / 2, height / 2 + 14);
            return;
        }

        const padding = { top: 25, right: 30, bottom: 40, left: 45 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        const maxVal = Math.max(...timeline.map(d => d.totalActions), 5);
        const yMax = Math.ceil(maxVal * 1.2);

        // Grid lines
        const gridLines = 4;
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.fillStyle = textColor;
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let i = 0; i <= gridLines; i++) {
            const yVal = Math.round((yMax / gridLines) * i);
            const y = padding.top + chartH - (i / gridLines) * chartH;

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartW, y);
            ctx.stroke();

            ctx.fillText(yVal.toString(), padding.left - 10, y);
        }

        // Map Points
        const points = timeline.map((d, i) => {
            const x = timeline.length === 1
                ? padding.left + chartW / 2
                : padding.left + (i / (timeline.length - 1)) * chartW;
            const y = padding.top + chartH - (d.totalActions / yMax) * chartH;
            return { x, y, data: d };
        });

        // Area Fill
        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartH);
        points.forEach((pt, i) => {
            if (i === 0) ctx.lineTo(pt.x, pt.y);
            else {
                const prev = points[i - 1];
                const cx = (prev.x + pt.x) / 2;
                ctx.bezierCurveTo(cx, prev.y, cx, pt.y, pt.x, pt.y);
            }
        });
        ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        grad.addColorStop(0, brandFill);
        grad.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        points.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else {
                const prev = points[i - 1];
                const cx = (prev.x + pt.x) / 2;
                ctx.bezierCurveTo(cx, prev.y, cx, pt.y, pt.x, pt.y);
            }
        });
        ctx.strokeStyle = brandBlue;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Circles & Dates
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = textColor;
        ctx.font = '11px Inter, system-ui, sans-serif';

        points.forEach((pt, idx) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
            ctx.fill();
            ctx.strokeStyle = brandBlue;
            ctx.lineWidth = 2;
            ctx.stroke();

            const showLabel = timeline.length <= 8 || idx % Math.ceil(timeline.length / 7) === 0 || idx === timeline.length - 1;
            if (showLabel) {
                const parts = pt.data.date.split('-');
                const labelText = parts.length === 3 ? `${parts[1]}/${parts[2]}` : pt.data.date;
                ctx.fillStyle = textColor;
                ctx.fillText(labelText, pt.x, padding.top + chartH + 10);
            }
        });
    }

    // 7. Assessments & Tests History Table
    function renderAssessmentsTable(history, latestVersant) {
        const tbody = elements.assessmentsTableBody;
        if (!tbody) return;

        const allItems = [...(history || [])];
        if (latestVersant && latestVersant.submitted_at) {
            allItems.push({
                title: `Versant Speech: ${latestVersant.title}`,
                exam_type: 'versant',
                score: latestVersant.overall_score,
                warnings_count: 0,
                submitted_at: latestVersant.submitted_at
            });
        }

        allItems.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

        if (allItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 32px 16px; color: var(--text-muted);">
                        No assessment attempts recorded in this time range. Start an Aptitude Test or Versant Speech round to see history.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = allItems.slice(0, 8).map(item => {
            const dateStr = item.submitted_at
                ? new Date(item.submitted_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
                : 'Recent';

            const scoreNum = Number(item.score || 0);
            let scoreBadgeClass = 'badge-success';
            if (scoreNum < 40) scoreBadgeClass = 'badge-danger';
            else if (scoreNum < 70) scoreBadgeClass = 'badge-warning';

            const warnings = Number(item.warnings_count || 0);
            const proctorBadge = warnings > 0
                ? `<span class="table-badge badge-warning">${warnings} Alerts</span>`
                : `<span class="table-badge badge-success">Clean</span>`;

            return `
                <tr>
                    <td style="font-weight: 500; color: var(--text-primary);">${escapeHtml(item.title || 'Standard Assessment')}</td>
                    <td><span class="table-badge badge-blue">${escapeHtml(item.exam_type || 'Aptitude')}</span></td>
                    <td><span class="table-badge ${scoreBadgeClass}">${scoreNum.toFixed(1)}%</span></td>
                    <td>${proctorBadge}</td>
                    <td style="color: var(--text-muted); font-size: 12px;">${dateStr}</td>
                </tr>
            `;
        }).join('');
    }

    // 8. Mock Interview Deep-Dive Card
    function renderInterviewDeepDive(interview) {
        const container = elements.interviewFeedbackArea;
        if (!container) return;

        if (!interview || !interview.ai_feedback) {
            container.innerHTML = `
                <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
                    No evaluated mock interview session available yet.
                    <div style="margin-top: 10px;">
                        <a href="/available-exams" class="rec-btn" style="display: inline-flex;">Launch a Mock Interview &rarr;</a>
                    </div>
                </div>
            `;
            return;
        }

        const fb = interview.ai_feedback;
        const scores = fb.scores || {};

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
                    <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Clarity</div>
                        <div style="font-size: 18px; font-weight: 700; color: var(--brand-blue);">${scores.clarity || 0}%</div>
                    </div>
                    <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Confidence</div>
                        <div style="font-size: 18px; font-weight: 700; color: #10B981;">${scores.confidence || 0}%</div>
                    </div>
                    <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Communication</div>
                        <div style="font-size: 18px; font-weight: 700; color: #6366F1;">${scores.communication || 0}%</div>
                    </div>
                    <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Relevance</div>
                        <div style="font-size: 18px; font-weight: 700; color: #F59E0B;">${scores.relevance || 0}%</div>
                    </div>
                    <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Structure (STAR)</div>
                        <div style="font-size: 18px; font-weight: 700; color: #EF4444;">${scores.answerStructure || 0}%</div>
                    </div>
                </div>

                ${fb.executiveSummary ? `
                    <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px 14px; font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                        <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">Executive Evaluation Summary:</strong>
                        ${escapeHtml(fb.executiveSummary)}
                    </div>
                ` : ''}

                ${fb.areasForImprovement && fb.areasForImprovement.length > 0 ? `
                    <div>
                        <strong style="font-size: 12px; color: var(--text-primary); display: block; margin-bottom: 6px;">Key Action Items:</strong>
                        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                            ${fb.areasForImprovement.slice(0, 3).map(area => `<li>${escapeHtml(area)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 9. Versant & Resume Combined Readiness
    function renderCommunicationAndResume(versant, resume) {
        const container = elements.communicationAndResumeArea;
        if (!container) return;

        let versantHtml = '';
        if (versant && versant.overall_score != null) {
            versantHtml = `
                <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 13px; color: var(--text-primary);">Versant Spoken English Proficiency</strong>
                        <span class="table-badge badge-success">${versant.cefr_level || 'CEFR C1'} • ${Number(versant.overall_score).toFixed(1)}%</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 12px; color: var(--text-muted); text-align: center;">
                        <div>Fluency: <strong style="color: var(--text-primary);">${versant.fluency_score || 0}</strong></div>
                        <div>Pronunciation: <strong style="color: var(--text-primary);">${versant.pronunciation_score || 0}</strong></div>
                        <div>Grammar: <strong style="color: var(--text-primary);">${versant.grammar_score || 0}</strong></div>
                    </div>
                </div>
            `;
        } else {
            versantHtml = `
                <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; margin-bottom: 12px; text-align: center;">
                    <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Versant Spoken English Not Attempted</div>
                    <p style="font-size: 12px; color: var(--text-muted); margin: 4px 0 8px;">Assess your spoken English fluency, vocabulary, and grammar before MNC screening.</p>
                    <a href="/available-exams" class="rec-btn" style="display: inline-flex;">Take Versant Test &rarr;</a>
                </div>
            `;
        }

        let resumeHtml = '';
        if (resume && resume.ats_score != null) {
            resumeHtml = `
                <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 13px; color: var(--text-primary);">${escapeHtml(resume.file_name)}</strong>
                        <span class="table-badge badge-blue">ATS: ${resume.ats_score}/100</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);">
                        <span>Skills Match: <strong>${resume.skills_match || 0}%</strong></span>
                        <span>Keywords: <strong>${resume.keyword_match || 0}%</strong></span>
                        <span>Format: <strong>${escapeHtml(resume.formatting_status || 'Good')}</strong></span>
                    </div>
                </div>
            `;
        } else {
            resumeHtml = `
                <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; text-align: center;">
                    <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">No Resume Analyzed Yet</div>
                    <p style="font-size: 12px; color: var(--text-muted); margin: 4px 0 8px;">Upload your resume to get automated ATS scoring and keyword suggestions.</p>
                    <a href="/dashboard#resumeSection" class="rec-btn" style="display: inline-flex;">Upload Resume &rarr;</a>
                </div>
            `;
        }

        container.innerHTML = versantHtml + resumeHtml;
    }

    // 10. Unified Activity Feed
    function renderActivityFeed(feed) {
        const container = elements.activityFeedContainer;
        if (!container) return;

        if (!feed || feed.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">No recent activities logged in this window.</div>`;
            return;
        }

        const iconBg = {
            exam: 'rgba(147, 51, 234, 0.1)',
            versant: 'rgba(244, 63, 94, 0.1)',
            interview: 'rgba(37, 99, 235, 0.1)',
            resume: 'rgba(16, 185, 129, 0.1)',
            study: 'rgba(245, 158, 11, 0.1)'
        };

        const iconColor = {
            exam: '#9333ea',
            versant: '#f43f5e',
            interview: '#2563eb',
            resume: '#10b981',
            study: '#f59e0b'
        };

        container.innerHTML = feed.map(item => {
            const dateStr = item.date
                ? new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : 'Recent';

            const bg = iconBg[item.type] || 'rgba(37, 99, 235, 0.1)';
            const clr = iconColor[item.type] || '#2563eb';

            return `
                <div class="activity-feed-item">
                    <div class="activity-feed-left">
                        <div class="activity-feed-icon" style="background: ${bg}; color: ${clr};">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 14 14" />
                            </svg>
                        </div>
                        <div>
                            <div class="activity-feed-title">${escapeHtml(item.title)}</div>
                            <div class="activity-feed-sub">${escapeHtml(item.subtitle)}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="table-badge badge-blue">${escapeHtml(item.badge)}</span>
                        <span style="font-size: 12px; color: var(--text-muted);">${dateStr}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Helper: HTML Escaping
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Render Error State
    function renderErrorState(message) {
        if (elements.assessmentsTableBody) {
            elements.assessmentsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 24px; color: #ef4444;">
                        Failed to load personal analytics: ${escapeHtml(message)}
                    </td>
                </tr>
            `;
        }
    }

    // Window Resize Handler for Canvas
    function initResizeHandler() {
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (currentData) {
                    renderActivityChart(currentData.activityTimeline);
                }
            }, 150);
        });
    }

    // Event Listeners for Filters
    function initFilterEvents() {
        if (elements.filterRange) {
            elements.filterRange.addEventListener('change', () => fetchAnalytics());
        }
        if (elements.btnRefresh) {
            elements.btnRefresh.addEventListener('click', () => fetchAnalytics());
        }
    }

    // Bootstrap
    function init() {
        initTheme();
        initProfile();
        initFilterEvents();
        initResizeHandler();
        fetchAnalytics();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
