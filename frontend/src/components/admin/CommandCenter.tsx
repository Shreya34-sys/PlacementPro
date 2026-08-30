import React from "react";
import {
  Sparkles,
  BriefcaseBusiness,
  ShieldAlert,
  FileText,
  TrendingUp,
  Send,
  CheckCircle2,
  ArrowRight,
  Zap,
} from "lucide-react";

const CommandCenter: React.FC = () => {
  return (
    <div className="command-center">

      {/* HERO */}
      <section className="hero-card">

        <div className="hero-left">

          <div className="season-label">
            <Sparkles size={17} />
            CAMPUS PLACEMENT SEASON 2026-2027
          </div>

          <h2>
            Welcome back, <span>Admin</span>
          </h2>

          <p>
            PlacementPro's AI Agents & RAG Knowledge Engine are
            synchronizing live market trends, orchestrating campus
            test drives, and analyzing student placement readiness
            for KIT CSBS.
          </p>

        </div>


        <div className="hero-right">

          <div className="readiness-card">

            <span>Batch Readiness</span>

            <strong>
              <i />
              88.5% Benchmark
            </strong>

          </div>

          <button className="primary-button">
            <BriefcaseBusiness size={18} />
            Manage Campus Drives
          </button>

        </div>

      </section>


      {/* STAT CARDS */}
      <section className="stats-grid">

        <StatCard
          title="Active Drives"
          value="2"
          subtitle="470 Registrations"
          icon={<BriefcaseBusiness />}
          type="blue"
        />

        <StatCard
          title="Market Alerts"
          value="2"
          subtitle="Pending AI Approvals"
          icon={<Sparkles />}
          type="yellow"
        />

        <StatCard
          title="Proctoring Flags"
          value="2"
          subtitle="Integrity Alerts"
          icon={<ShieldAlert />}
          type="red"
        />

        <StatCard
          title="RAG Chunks"
          value="4"
          subtitle="Vector Knowledge Base"
          icon={<FileText />}
          type="blue"
        />

        <StatCard
          title="Avg Readiness"
          value="88.5%"
          subtitle="KIT TY CSBS Batch"
          icon={<TrendingUp />}
          type="green"
        />

      </section>


      {/* MAIN GRID */}
      <section className="dashboard-grid">

        {/* AI INGESTION */}
        <div className="dashboard-card ingestion-card">

          {/* <div className="gemini-label">
            <Sparkles size={15} />
            Google Gemini 2.0 Flash Ingestion AI
          </div> */}

          <div className="card-heading">

            <div className="heading-icon blue-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <h3>
                Faculty AI Ingestion Engine
                <span> AI POWERED</span>
              </h3>

              <p>
                Paste unstructured syllabus notes or job postings —
                AI extracts questions & RAG chunks.
              </p>
            </div>

            <select defaultValue="TCS">
              <option value="TCS">
                TCS (Digital / Ninja)
              </option>
              <option>
                Persistent Systems
              </option>
              <option>
                Infosys DSE
              </option>
            </select>

          </div>


          <textarea
            placeholder="Paste Job Description, Hiring Syllabus, or Exam Topics here (e.g. 'TCS 2026 has added 15% more questions on Data Structures and memory optimization...')"
          />


          <div className="preset-row">

            <span>PRESETS:</span>

            <button>TCS 2026 Hiring Shift</button>

            <button>
              Persistent Systems Core CS
            </button>

            <button>
              Infosys DSE Syllabus
            </button>

          </div>


          <div className="ingestion-bottom">

            <span>
              Auto-populates: MCQ Questions • Coding Specs •
              Eligibility Rules • RAG Store
            </span>

            <button className="gradient-button">
              <Send size={16} />
              Run AI Ingestion
            </button>

          </div>

        </div>


        {/* MARKET ALERTS */}
        <div className="dashboard-card market-card">

          <div className="section-title-row">

            <div>
              <Sparkles className="yellow-icon" size={20} />

              <h3>
                AI Market Trend Alerts
              </h3>
            </div>

            <span className="approval-badge">
              1-Click Approvals
            </span>

          </div>

          <p className="section-description">
            AI agents periodically scan recruiter patterns and
            propose instant updates to syllabus, questions,
            or proctoring rules.
          </p>


          <MarketAlert
            company="Tata Consultancy Services (TCS)"
            confidence="97% Confidence"
            title="Auto-Upgrade TCS Digital Coding Pool to Include TAC Verification"
            description="TCS Digital 2026 exam benchmarks demonstrate a 25% higher candidate rejection rate for unoptimized intermediate memory code. Recruiter rubric prioritizes TAC efficiency."
          />


          <MarketAlert
            company="Persistent Systems"
            confidence="93% Confidence"
            title="Stricter Head-Pose & Voice AI Proctoring Thresholds"
            description="Persistent remote screening drives have adopted stricter multi-face and browser unfocus penalties with maximum 2 warnings before auto-submission."
          />

          <button className="full-market-button">
            Open Full Market Intelligence & RAG Store
            <ArrowRight size={16} />
          </button>

        </div>


        {/* CAMPUS DRIVES */}
        <div className="dashboard-card drives-card">

          <div className="section-title-row">

            <div>
              <BriefcaseBusiness
                className="blue-icon-text"
                size={20}
              />

              <h3>
                Active Campus Placement Drives
              </h3>
            </div>

            <button className="view-button">
              View All & Create
              <ArrowRight size={15} />
            </button>

          </div>


          <Drive
            company="Tata Consultancy Services (TCS)"
            role="TCS Digital / Ninja Campus Drive 2026 • 7.5 LPA (Avg)"
            eligibility="Eligibility: Min CGPA 6.5 | CSBS, CSE, IT, ENTC, Electrical"
            registrations="218"
            rounds="4 Evaluated Rounds"
            status="ACTIVE"
          />

          <Drive
            company="Persistent Systems"
            role="Software Product Engineer (SPE) • 8.5 LPA"
            eligibility="Eligibility: Min CGPA 7 | CSBS, CSE, IT"
            registrations="164"
            rounds="3 Evaluated Rounds"
            status="ACTIVE"
          />

          <Drive
            company="Google India"
            role="Software Engineer - Early Career 2026 • 32.0 LPA"
            eligibility="Eligibility: Min CGPA 8.5 | CSBS, CSE, IT"
            registrations="88"
            rounds="2 Evaluated Rounds"
            status="DRAFT"
          />

        </div>


        {/* PROCTORING */}
        <div className="dashboard-card proctoring-card">

          <div className="section-title-row">

            <div>
              <ShieldAlert
                className="red-icon"
                size={20}
              />

              <h3>
                Live Proctoring Supervisor
              </h3>
            </div>

            <span className="live-dot" />

          </div>


          <Violation
            name="Rohit Deshmukh"
            type="TAB SWITCH"
            description="Browser focus lost for 4.2 seconds. Window blurred. Switched to external application."
          />

          <Violation
            name="Rohit Deshmukh"
            type="MULTIPLE FACES"
            description="AI Face Mesh detected 2 distinct facial contours in the webcam stream simultaneously..."
          />

          <Violation
            name="Aaryan Yerudkar"
            type="HEAD POSE DEVIATION"
            description="Minor pitch/yaw angle shift (32 degrees) for 3 seconds while referencing scratchpad."
          />


          <button className="monitor-button">
            Monitor Live AI Proctoring Center
            <ArrowRight size={16} />
          </button>

        </div>

      </section>

    </div>
  );
};


/* ---------------- COMPONENTS ---------------- */

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  type: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  type,
}) => (
  <div className={`stat-card ${type}`}>

    <div className="stat-top">

      <span>{title}</span>

      {React.cloneElement(
        icon as React.ReactElement,
        {
         // size: 19,
        }
      )}

    </div>

    <strong>{value}</strong>

    <small>{subtitle}</small>

  </div>
);


interface MarketAlertProps {
  company: string;
  confidence: string;
  title: string;
  description: string;
}

const MarketAlert: React.FC<MarketAlertProps> = ({
  company,
  confidence,
  title,
  description,
}) => (
  <div className="market-alert">

    <div className="alert-top">
      <strong>{company}</strong>
      <span>{confidence}</span>
    </div>

    <h4>{title}</h4>

    <p>{description}</p>

    <div className="alert-actions">
      <button>Reject</button>

      <button className="approve-button">
        <CheckCircle2 size={15} />
        Approve & Sync
      </button>
    </div>

  </div>
);


interface DriveProps {
  company: string;
  role: string;
  eligibility: string;
  registrations: string;
  rounds: string;
  status: string;
}

const Drive: React.FC<DriveProps> = ({
  company,
  role,
  eligibility,
  registrations,
  rounds,
  status,
}) => (
  <div className="drive-item">

    <div className="company-logo">
      <BriefcaseBusiness size={20} />
    </div>

    <div className="drive-info">

      <div className="drive-company">
        <strong>{company}</strong>

        <span
          className={
            status === "ACTIVE"
              ? "active-status"
              : "draft-status"
          }
        >
          {status}
        </span>
      </div>

      <span>{role}</span>

      <small>{eligibility}</small>

    </div>

    <div className="drive-numbers">

      <strong>{registrations}</strong>

      <span>registered</span>

      <a>{rounds}</a>

    </div>

  </div>
);


interface ViolationProps {
  name: string;
  type: string;
  description: string;
}

const Violation: React.FC<ViolationProps> = ({
  name,
  type,
  description,
}) => (
  <div className="violation">

    <div>
      <strong>{name}</strong>

      <p>{description}</p>
    </div>

    <span>{type}</span>

  </div>
);


export default CommandCenter;