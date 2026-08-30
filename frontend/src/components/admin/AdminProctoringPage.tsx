import React, { useMemo, useState } from "react";
import {
  ShieldAlert,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Users,
  AlertTriangle,
  Eye,
  Activity,
  ChevronLeft,
  ChevronRight,
  Flag,
  X,
  Volume2,
  Monitor,
} from "lucide-react";

import "./AdminProctoringPage.css";

type Severity = "LOW" | "MEDIUM" | "HIGH";

interface StudentMonitor {
  id: string;
  name: string;
  rollNo: string;
  status: "LIVE" | "WARNING" | "FLAGGED";
  camera: boolean;
  microphone: boolean;
  gaze: number;
  warnings: number;
  severity?: Severity;
  issue?: string;
}

const students: StudentMonitor[] = Array.from(
  { length: 100 },
  (_, index) => {
    const number = index + 1;

    if (number === 3) {
      return {
        id: `student-${number}`,
        name: "Rohit Deshmukh",
        rollNo: "CSBS_05",
        status: "FLAGGED",
        camera: true,
        microphone: true,
        gaze: 72,
        warnings: 3,
        severity: "HIGH",
        issue: "Multiple faces detected",
      };
    }

    if (number === 7) {
      return {
        id: `student-${number}`,
        name: "Aaryan Yerudkar",
        rollNo: "CSBS_01",
        status: "WARNING",
        camera: true,
        microphone: true,
        gaze: 86,
        warnings: 1,
        severity: "LOW",
        issue: "Head pose deviation",
      };
    }

    if (number === 12) {
      return {
        id: `student-${number}`,
        name: "Priya Patil",
        rollNo: "CSBS_12",
        status: "WARNING",
        camera: true,
        microphone: true,
        gaze: 64,
        warnings: 2,
        severity: "MEDIUM",
        issue: "Tab switch detected",
      };
    }

    return {
      id: `student-${number}`,
      name: `Student ${number}`,
      rollNo: `CSBS_${String(number).padStart(2, "0")}`,
      status: "LIVE",
      camera: true,
      microphone: true,
      gaze: 90 + (number % 10),
      warnings: 0,
    };
  }
);

const AdminProctoringPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [selectedSeverity, setSelectedSeverity] =
    useState<"ALL" | Severity>("ALL");

  const studentsPerPage = 50;

  const filteredStudents = useMemo(() => {
    if (selectedSeverity === "ALL") {
      return students;
    }

    return students.filter(
      (student) => student.severity === selectedSeverity
    );
  }, [selectedSeverity]);

  const totalPages = Math.ceil(
    filteredStudents.length / studentsPerPage
  );

  const visibleStudents = filteredStudents.slice(
    page * studentsPerPage,
    page * studentsPerPage + studentsPerPage
  );

  const high = students.filter(
    (student) => student.severity === "HIGH"
  ).length;

  const medium = students.filter(
    (student) => student.severity === "MEDIUM"
  ).length;

  const low = students.filter(
    (student) => student.severity === "LOW"
  ).length;

  return (
    <div className="proctoring-page">

      {/* PAGE HEADER */}
      <section className="proctoring-hero">

        <div>
          <div className="proctoring-kicker">
            <ShieldAlert size={17} />
            AUDIO-VISUAL INTEGRITY & SURVEILLANCE CONSOLE
          </div>

          <h1>
            Live AI Proctoring & Audio Surveillance Supervisor
          </h1>

          <p>
            Real-time candidate camera tracking, synchronized ambient
            microphone analysis, gaze monitoring and AI-powered integrity
            detection.
          </p>
        </div>

        <div className="hero-actions">

          <button className="listen-btn">
            <Volume2 size={17} />
            Listen Live Audio
          </button>

          <div className="live-indicator">
            <span />
            Live Feeds Active
          </div>

        </div>

      </section>


      {/* STATS */}
      <section className="proctor-stats">

        <div className="proctor-stat">
          <Users size={21} />
          <span>ACTIVE TEST TAKERS</span>
          <strong>100</strong>
          <small>Live monitored</small>
        </div>

        <div className="proctor-stat danger">
          <ShieldAlert size={21} />
          <span>HIGH SEVERITY</span>
          <strong>{high}</strong>
          <small>Immediate attention</small>
        </div>

        <div className="proctor-stat warning">
          <AlertTriangle size={21} />
          <span>MEDIUM SEVERITY</span>
          <strong>{medium}</strong>
          <small>Needs review</small>
        </div>

        <div className="proctor-stat info">
          <Eye size={21} />
          <span>LOW SEVERITY</span>
          <strong>{low}</strong>
          <small>AI observations</small>
        </div>

        <div className="proctor-stat success">
          <Activity size={21} />
          <span>INTEGRITY INDEX</span>
          <strong>97.8%</strong>
          <small>Live AI confidence</small>
        </div>

      </section>


      {/* MAIN MONITORING AREA */}
      <section className="monitoring-panel">

        <div className="panel-header">

          <div>
            <h2>
              <Monitor size={20} />
              Live Student Monitoring
            </h2>

            <p>
              Monitor up to 50 students simultaneously
            </p>
          </div>


          <div className="monitor-controls">

            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(
                  e.target.value as "ALL" | Severity
                );
                setPage(0);
              }}
            >
              <option value="ALL">
                All Students
              </option>

              <option value="HIGH">
                High Severity
              </option>

              <option value="MEDIUM">
                Medium Severity
              </option>

              <option value="LOW">
                Low Severity
              </option>
            </select>

            <div className="page-control">

              <button
                disabled={page === 0}
                onClick={() =>
                  setPage((current) =>
                    Math.max(0, current - 1)
                  )
                }
              >
                <ChevronLeft size={18} />
              </button>

              <span>
                {page + 1} / {Math.max(totalPages, 1)}
              </span>

              <button
                disabled={
                  page >= totalPages - 1
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages - 1,
                      current + 1
                    )
                  )
                }
              >
                <ChevronRight size={18} />
              </button>

            </div>

          </div>

        </div>


        {/* STUDENT GRID */}
        <div className="student-grid">

          {visibleStudents.map((student) => (

            <div
              key={student.id}
              className={`student-card ${
                student.severity
                  ? student.severity.toLowerCase()
                  : ""
              }`}
            >

              {/* VIDEO AREA */}
              <div className="student-video">

                <div className="video-background">
                  <Video size={32} />
                  <span>LIVE CAMERA</span>
                </div>


                <div className="camera-status">

                  {student.camera ? (
                    <Video size={13} />
                  ) : (
                    <VideoOff size={13} />
                  )}

                  {student.camera
                    ? "CAM"
                    : "OFF"}

                </div>


                <div className="student-live">
                  <span />
                  LIVE
                </div>


                {student.severity && (
                  <div
                    className={`severity-badge ${student.severity.toLowerCase()}`}
                  >
                    {student.severity}
                  </div>
                )}

              </div>


              {/* STUDENT INFO */}
              <div className="student-info">

                <div className="student-name">
                  <strong>
                    {student.name}
                  </strong>

                  <small>
                    {student.rollNo}
                  </small>
                </div>


                <div className="student-signals">

                  <span>
                    <Eye size={14} />
                    {student.gaze}%
                  </span>

                  <span>
                    {student.microphone ? (
                      <Mic size={14} />
                    ) : (
                      <MicOff size={14} />
                    )}
                  </span>

                  <span
                    className={
                      student.warnings > 0
                        ? "warning-count"
                        : ""
                    }
                  >
                    ⚠ {student.warnings}
                  </span>

                </div>


                {student.issue && (
                  <div className="student-issue">
                    <AlertTriangle size={13} />
                    {student.issue}
                  </div>
                )}


                <div className="student-actions">

                  {student.warnings >= 3 ? (
                    <button className="flag-btn">
                      <Flag size={13} />
                      Flagged / Auto Submit
                    </button>
                  ) : (
                    <button className="monitor-btn">
                      <Eye size={13} />
                      Monitor
                    </button>
                  )}

                  <button className="dismiss-btn">
                    <X size={13} />
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* AI EVENT STREAM */}
      <section className="ai-event-panel">

        <div className="ai-event-header">

          <div>
            <h2>
              <Activity size={19} />
              AI Real-Time Integrity Event Stream
            </h2>

            <p>
              AI-generated audio, video and behaviour alerts
            </p>
          </div>

          <span className="ai-status">
            AI ENGINE ACTIVE
          </span>

        </div>


        <div className="event-list">

          <div className="event high-event">
            <ShieldAlert size={17} />
            <div>
              <strong>Rohit Deshmukh</strong>
              <p>
                Multiple faces detected for 6.8 seconds.
              </p>
            </div>
            <span>HIGH</span>
          </div>


          <div className="event medium-event">
            <Volume2 size={17} />
            <div>
              <strong>Priya Patil</strong>
              <p>
                Unusual secondary voice/audio pattern detected.
              </p>
            </div>
            <span>MEDIUM</span>
          </div>


          <div className="event low-event">
            <Eye size={17} />
            <div>
              <strong>Aaryan Yerudkar</strong>
              <p>
                Head pose deviation detected while reading.
              </p>
            </div>
            <span>LOW</span>
          </div>

        </div>

      </section>

    </div>
  );
};

export default AdminProctoringPage;