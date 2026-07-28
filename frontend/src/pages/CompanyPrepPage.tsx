import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Nav, Tab, Accordion } from 'react-bootstrap';

interface CompanyPrepPageProps {
  onNavigate?: (tab: string) => void;
}

interface CompanyData {
  id: string;
  name: string;
  logo: string;
  category: 'Product' | 'Service' | 'FAANG/MANG' | 'Fintech';
  hiringRounds: string[];
  eligibility: string;
  packageRange: string;
  previousQuestions: {
    round: string;
    question: string;
    type: 'Coding' | 'Aptitude' | 'Technical' | 'HR';
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }[];
  overview: string;
}

const companyDataList: CompanyData[] = [
  {
    id: 'tcs',
    name: 'TCS (Tata Consultancy Services)',
    logo: '🏢',
    category: 'Service',
    packageRange: '₹3.36 LPA - ₹9.0 LPA (Ninja / Digital / Prime)',
    eligibility: 'BE/B.Tech/ME/M.Tech/MCA/M.Sc with min 60% or 6.0 CGPA throughout academics.',
    hiringRounds: [
      'Round 1: TCS NQT (Numerical, Verbal, Reasoning, Advanced Coding)',
      'Round 2: Technical Interview (Core CS, DBMS, Project Deep Dive)',
      'Round 3: HR & Managerial Interview (Behavioral, Relocation, Shift Readiness)',
    ],
    overview: 'TCS is India’s largest IT services exporter. Recruitment happens through TCS NQT with three profile bands: Ninja, Digital, and Prime.',
    previousQuestions: [
      {
        round: 'TCS NQT Coding',
        question: 'Find the smallest and largest element in an array and print their sum.',
        type: 'Coding',
        difficulty: 'Easy',
      },
      {
        round: 'TCS Technical',
        question: 'Explain the difference between Primary Key, Unique Key, and Foreign Key in DBMS.',
        type: 'Technical',
        difficulty: 'Medium',
      },
      {
        round: 'TCS Technical',
        question: 'What is Method Overloading vs Method Overriding in Java?',
        type: 'Technical',
        difficulty: 'Easy',
      },
    ],
  },
  {
    id: 'infosys',
    name: 'Infosys',
    logo: '💻',
    category: 'Service',
    packageRange: '₹3.6 LPA - ₹9.5 LPA (System Engineer / Specialist Programmer)',
    eligibility: 'BE/B.Tech/MCA/M.Sc graduates. Max 2 active backlogs allowed at registration time.',
    hiringRounds: [
      'Round 1: Infosys Online Test (Mathematical Ability, Reasoning, Verbal, Pseudo Code, Puzzle Solving)',
      'Round 2: HackWithInfy / InfyTQ Advanced Coding Assessment',
      'Round 3: Combined Technical + HR Interview',
    ],
    overview: 'Infosys hires through campus drives and competitive hackathons like HackWithInfy and InfyTQ certification.',
    previousQuestions: [
      {
        round: 'Infosys Online Test',
        question: 'Solve the pattern problem: Print N lines of pyramid with alternating numbers and stars.',
        type: 'Coding',
        difficulty: 'Easy',
      },
      {
        round: 'Infosys Technical',
        question: 'How does garbage collection work in Java JVM?',
        type: 'Technical',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: '📦',
    category: 'FAANG/MANG',
    packageRange: '₹28 LPA - ₹45 LPA (SDE-1)',
    eligibility: 'B.Tech/CS/IT graduates with strong Data Structures & Algorithms proficiency.',
    hiringRounds: [
      'Round 1: Online Assessment (2 Coding Questions + Work Style Survey + Reasoning)',
      'Round 2: Technical Interview 1 (DSA Data Structures & Leadership Principles)',
      'Round 3: Technical Interview 2 (System Design / Object Oriented Design & LP)',
      'Round 4: Bar Raiser Interview (Behavioral Leadership & Core Problem Solving)',
    ],
    overview: 'Amazon focuses heavily on Leadership Principles along with top-tier DSA problem-solving speed and accuracy.',
    previousQuestions: [
      {
        round: 'Amazon OA',
        question: 'Given an array of integers, find the maximum sum sub-array of size K.',
        type: 'Coding',
        difficulty: 'Medium',
      },
      {
        round: 'Amazon Technical',
        question: 'Serialize and Deserialize a Binary Tree with minimum memory overhead.',
        type: 'Coding',
        difficulty: 'Hard',
      },
      {
        round: 'Amazon HR / LP',
        question: 'Tell me about a time when you had a disagreement with a team member and how you resolved it.',
        type: 'HR',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'wipro',
    name: 'Wipro (NLTH)',
    logo: '🌐',
    category: 'Service',
    packageRange: '₹3.5 LPA - ₹6.5 LPA (Project Engineer / Turbo)',
    eligibility: '60% or 6.0 CGPA in 10th, 12th, and Graduation with no active backlogs.',
    hiringRounds: [
      'Round 1: Wipro NLTH Assessment (Aptitude, Verbal, Coding, Written Communication Essay)',
      'Round 2: Technical & HR Discussion',
    ],
    overview: 'Wipro National Level Talent Hunt (NLTH) tests aptitude, coding fundamentals, and written essay communication.',
    previousQuestions: [
      {
        round: 'Wipro NLTH',
        question: 'Write a function to check whether a string is an Anagram of another string.',
        type: 'Coding',
        difficulty: 'Easy',
      },
    ],
  },
];

export const CompanyPrepPage: React.FC<CompanyPrepPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<CompanyData>(companyDataList[0]);

  const filteredCompanies = companyDataList.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <Container fluid className="px-0">
      {/* Top Breadcrumb & Navigation Header */}
      <div className="mb-4 bg-white p-3.5 rounded-3 shadow-xs border">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-1 fs-7">
            <li className="breadcrumb-item">
              <a
                href="#dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate('dashboard');
                }}
                className="text-decoration-none text-primary fw-medium"
              >
                <img src="https://img.icons8.com/?size=100&id=aVHe2jHuORcA&format=png&color=000000" alt="Dashboard" width="16" height="16" referrerPolicy="no-referrer" className="me-1 align-text-bottom" style={{ objectFit: 'contain' }} />
                Dashboard
              </a>
            </li>
            <li className="breadcrumb-item">
              <a
                href="#placement-prep"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate('placement-prep');
                }}
                className="text-decoration-none text-primary fw-medium"
              >
                📚 Placement Preparation
              </a>
            </li>
            <li className="breadcrumb-item active text-secondary" aria-current="page">
              🏢 Company-wise Preparation
            </li>
          </ol>
        </nav>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h3 className="fw-bold text-dark mb-1">🏢 Company-wise Preparation</h3>
            <p className="text-muted mb-0 fs-7">
              Master company-specific recruitment processes, eligibility requirements, round breakdowns, and past exam questions.
            </p>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            className="fw-bold px-3"
            onClick={() => onNavigate && onNavigate('placement-prep')}
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Placement Prep
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Row className="g-3 mb-4">
        <Col md={8}>
          <InputGroup className="shadow-xs">
            <InputGroup.Text className="bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search companies (TCS, Amazon, Infosys, Wipro...)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0 py-2.5"
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2.5 shadow-xs"
          >
            <option value="All">All Categories</option>
            <option value="Service">IT Services (TCS, Infy, Wipro)</option>
            <option value="FAANG/MANG">Product / FAANG (Amazon, Google)</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Main Content Layout */}
      <Row className="g-4">
        {/* Left Column: Company List */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-3">
            {filteredCompanies.map((company) => {
              const isSelected = selectedCompany.id === company.id;
              return (
                <Card
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={`border cursor-pointer transition-all hover-lift rounded-3 ${
                    isSelected ? 'border-primary shadow-sm bg-primary-subtle' : 'bg-white'
                  }`}
                >
                  <Card.Body className="p-3.5 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <span className="fs-2">{company.logo}</span>
                      <div>
                        <h6 className="fw-bold text-dark mb-1">{company.name}</h6>
                        <Badge bg={company.category === 'FAANG/MANG' ? 'danger' : 'primary'} className="fs-8">
                          {company.category}
                        </Badge>
                      </div>
                    </div>
                    <i className={`bi bi-chevron-right ${isSelected ? 'text-primary fw-bold' : 'text-muted'}`}></i>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        </Col>

        {/* Right Column: Selected Company Details */}
        <Col lg={8}>
          <Card className="shadow-xs border-0 rounded-16 overflow-hidden">
            <Card.Header className="bg-primary text-white p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex align-items-center gap-3">
                  <span className="display-5 bg-white bg-opacity-20 p-2 rounded-3">{selectedCompany.logo}</span>
                  <div>
                    <h3 className="fw-bold mb-1">{selectedCompany.name}</h3>
                    <div className="d-flex gap-2 align-items-center">
                      <Badge bg="light" text="dark" className="fw-semibold">
                        {selectedCompany.category}
                      </Badge>
                      <span className="fs-7 text-white-50">• {selectedCompany.packageRange}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Header>

            <Card.Body className="p-4">
              <h6 className="fw-bold text-dark mb-2">📌 Company Overview</h6>
              <p className="text-secondary fs-7 leading-relaxed mb-4">{selectedCompany.overview}</p>

              <h6 className="fw-bold text-dark mb-2">🎓 Eligibility Criteria</h6>
              <div className="p-3 bg-light rounded-3 border mb-4 fs-7 text-dark fw-medium">
                <i className="bi bi-mortarboard text-primary me-2 fs-6"></i>
                {selectedCompany.eligibility}
              </div>

              <h6 className="fw-bold text-dark mb-3">🔄 Interview & Hiring Rounds</h6>
              <div className="d-flex flex-column gap-2 mb-4">
                {selectedCompany.hiringRounds.map((round, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-3 border d-flex align-items-center gap-3 shadow-xs">
                    <span className="badge bg-dark rounded-circle px-2.5 py-1.5">{idx + 1}</span>
                    <span className="fw-semibold text-dark fs-7">{round}</span>
                  </div>
                ))}
              </div>

              <h6 className="fw-bold text-dark mb-3">📝 Previous Interview Questions & Patterns</h6>
              <Accordion defaultActiveKey="0" className="mb-4">
                {selectedCompany.previousQuestions.map((item, idx) => (
                  <Accordion.Item key={idx} eventKey={idx.toString()}>
                    <Accordion.Header>
                      <div className="d-flex align-items-center justify-content-between w-100 me-3">
                        <span className="fw-semibold text-dark fs-7">
                          {item.round} — <span className="text-primary">{item.type}</span>
                        </span>
                        <Badge bg={item.difficulty === 'Easy' ? 'success' : item.difficulty === 'Medium' ? 'warning' : 'danger'}>
                          {item.difficulty}
                        </Badge>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body className="bg-light fs-7">
                      <p className="fw-bold text-dark mb-2">{item.question}</p>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="fw-bold"
                        onClick={() => {
                          if (item.type === 'Coding') onNavigate && onNavigate('leetcode-practice');
                          else if (item.type === 'Aptitude') onNavigate && onNavigate('aptitude-test');
                          else onNavigate && onNavigate('hr-prep');
                        }}
                      >
                        <i className="bi bi-play-circle me-1"></i> Practice This Question
                      </Button>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
