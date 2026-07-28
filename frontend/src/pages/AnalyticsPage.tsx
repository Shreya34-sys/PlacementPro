import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Badge, ProgressBar } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('30days');

  // Chart 1: Personal Placement Readiness Growth Trend (Line)
  const readinessTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    datasets: [
      {
        label: 'My Placement Readiness Score (%)',
        data: [42, 50, 58, 63, 68, 72, 75, 78],
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointBackgroundColor: '#0d6efd',
      },
      {
        label: 'Target Benchmark (85%)',
        data: [85, 85, 85, 85, 85, 85, 85, 85],
        borderColor: '#198754',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      }
    ]
  };

  // Chart 2: Solved Problems Distribution by Difficulty (Doughnut)
  const difficultyData = {
    labels: ['Easy (65)', 'Medium (42)', 'Hard (18)'],
    datasets: [
      {
        data: [65, 42, 18],
        backgroundColor: ['#198754', '#ffc107', '#dc3545'],
        hoverOffset: 6,
      }
    ]
  };

  // Chart 3: Skill Mastery Radar Chart (Personal)
  const skillRadarData = {
    labels: ['Data Structures', 'Algorithms', 'Aptitude & Math', 'System Design', 'Versant English', 'HR & Behavioral'],
    datasets: [
      {
        label: 'My Competency Score',
        data: [85, 72, 80, 65, 78, 90],
        backgroundColor: 'rgba(13, 110, 253, 0.25)',
        borderColor: '#0d6efd',
        pointBackgroundColor: '#0d6efd',
      },
      {
        label: 'Target SDE Role Requirement',
        data: [80, 80, 75, 70, 75, 80],
        backgroundColor: 'rgba(108, 117, 125, 0.1)',
        borderColor: '#6c757d',
        borderDash: [3, 3],
        pointBackgroundColor: '#6c757d',
      }
    ]
  };

  // Chart 4: Weekly Solved Problems & Practice Hours (Bar)
  const weeklyPracticeData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Problems Solved',
        data: [4, 6, 3, 7, 5, 8, 4],
        backgroundColor: '#0d6efd',
        borderRadius: 6,
      },
      {
        label: 'Mock Tests Completed',
        data: [1, 2, 1, 2, 1, 3, 1],
        backgroundColor: '#20c997',
        borderRadius: 6,
      }
    ]
  };

  return (
    <Container fluid className="px-3 px-lg-4 py-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <Badge bg="primary-subtle" text="primary" className="fw-bold px-2.5 py-1 mb-1 fs-8 rounded-pill">
            📊 Personal Performance
          </Badge>
          <h3 className="fw-extrabold text-dark mb-1">My Placement Preparation Analytics</h3>
          <p className="text-secondary fs-7 mb-0">
            Track your personal progress, problem-solving accuracy, mock test scores, and skill mastery.
          </p>
        </div>

        <Form.Select
          size="sm"
          style={{ width: '180px' }}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="fw-semibold shadow-xs"
        >
          <option value="30days">Last 30 Days</option>
          <option value="60days">Last 60 Days</option>
          <option value="all">All Time</option>
        </Form.Select>
      </div>

      {/* KPI Cards */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-16 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-uppercase fw-bold text-muted fs-8 d-block mb-1">Total Solved Problems</span>
                <h3 className="fw-extrabold text-dark mb-0">125 Problems</h3>
                <small className="text-success fw-semibold fs-8">
                  <i className="bi bi-arrow-up-right me-1"></i>+18 this week
                </small>
              </div>
              <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-12">
                <i className="bi bi-code-square fs-4"></i>
              </div>
            </div>
          </Card>
        </Col>

        <Col sm={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-16 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-uppercase fw-bold text-muted fs-8 d-block mb-1">Mock Interview Score</span>
                <h3 className="fw-extrabold text-success mb-0">88 / 100</h3>
                <small className="text-muted fs-8">Avg across 6 mock rounds</small>
              </div>
              <div className="bg-success bg-opacity-10 text-success p-3 rounded-12">
                <i className="bi bi-robot fs-4"></i>
              </div>
            </div>
          </Card>
        </Col>

        <Col sm={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-16 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-uppercase fw-bold text-muted fs-8 d-block mb-1">Aptitude Accuracy</span>
                <h3 className="fw-extrabold text-info mb-0">86.4 %</h3>
                <small className="text-muted fs-8">14 Quizzes completed</small>
              </div>
              <div className="bg-info bg-opacity-10 text-info p-3 rounded-12">
                <i className="bi bi-calculator fs-4"></i>
              </div>
            </div>
          </Card>
        </Col>

        <Col sm={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-16 p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-uppercase fw-bold text-muted fs-8 d-block mb-1">Versant Voice Rating</span>
                <h3 className="fw-extrabold text-warning mb-0">C1 Advanced</h3>
                <small className="text-success fw-semibold fs-8">Fluency Grade: 78/80</small>
              </div>
              <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-12">
                <i className="bi bi-mic-fill fs-4"></i>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Charts Row */}
      <Row className="g-4 mb-4">
        {/* Line Chart: Readiness Growth */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm rounded-16 p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">Placement Readiness Progress</h5>
                <small className="text-muted fs-8">8-week score trajectory based on test performance</small>
              </div>
              <Badge bg="primary-subtle" text="primary" className="fw-bold fs-8 rounded-pill px-2.5 py-1">
                Score: 78%
              </Badge>
            </div>
            <div style={{ height: '280px' }}>
              <Line
                data={readinessTrendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' as const } },
                  scales: { y: { min: 30, max: 100 } }
                }}
              />
            </div>
          </Card>
        </Col>

        {/* Doughnut Chart: Solved Problems Difficulty */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm rounded-16 p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">Solved Problem Breakdown</h5>
                <small className="text-muted fs-8">125 Total solved questions</small>
              </div>
            </div>
            <div style={{ height: '260px' }} className="d-flex align-items-center justify-content-center">
              <Doughnut
                data={difficultyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' as const } }
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        {/* Radar Chart: Skill Competency */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm rounded-16 p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">My Skill Competency Radar</h5>
                <small className="text-muted fs-8">Benchmark against top tech hiring expectations</small>
              </div>
            </div>
            <div style={{ height: '280px' }}>
              <Radar
                data={skillRadarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { r: { min: 0, max: 100 } }
                }}
              />
            </div>
          </Card>
        </Col>

        {/* Bar Chart: Weekly Practice Activity */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm rounded-16 p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">Weekly Practice Activity</h5>
                <small className="text-muted fs-8">Problems solved and mock assessments this week</small>
              </div>
            </div>
            <div style={{ height: '280px' }}>
              <Bar
                data={weeklyPracticeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' as const } }
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Personal Strengths & Improvement Areas */}
      <Card className="border-0 shadow-sm rounded-16 p-4 bg-white">
        <h5 className="fw-bold text-dark mb-3">🎯 AI Skill Focus Recommendations</h5>
        <Row className="g-3">
          <Col md={6}>
            <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-12">
              <h6 className="fw-bold text-success mb-2">
                <i className="bi bi-check-circle-fill me-2"></i> Strong Competencies
              </h6>
              <ul className="mb-0 ps-3 fs-7 text-dark space-y-1">
                <li><strong>Data Structures:</strong> Arrays, Linked Lists, Trees & BFS (85% Score)</li>
                <li><strong>Behavioral & HR:</strong> Strong situational STAR response structure</li>
                <li><strong>Quantitative Aptitude:</strong> High speed in Probability & Percentages</li>
              </ul>
            </div>
          </Col>

          <Col md={6}>
            <div className="p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-12">
              <h6 className="fw-bold text-dark mb-2">
                <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i> Target Areas for Improvement
              </h6>
              <ul className="mb-0 ps-3 fs-7 text-dark space-y-1">
                <li><strong>Dynamic Programming:</strong> Memoization speed can be improved by 15%</li>
                <li><strong>System Design:</strong> Review Load Balancing & Caching strategies for Amazon</li>
                <li><strong>Versant Speech:</strong> Maintain steady pacing in complex sentence repetition</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};
