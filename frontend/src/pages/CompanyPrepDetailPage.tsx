import React from 'react';
import { Button, Card, Col, Container, Row, Badge } from 'react-bootstrap';
import { CompanyLogo } from '../components/common/CompanyLogo';

interface CompanyPrepDetailPageProps {
  companyId: string;
  onBack: () => void;
}

const companyDetails = {
  amazon: {
    name: 'Amazon SDE Preparation Roadmap',
    subtitle: 'A structured 4-week path to ace your Amazon interview, designed by elite mentors from AWS and Alexa teams.',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    milestones: [
      { title: 'Week 1', description: 'Online Assessment Prep', status: 'Current Milestone' },
      { title: 'Week 2', description: 'Core DSA Patterns', status: 'Next Milestone' },
    ],
    progress: '0%',
    modules: [
      { title: 'Arrays, Strings & Linked Lists', subtitle: 'Master foundational concepts common in Amazon OA.', duration: '8h', status: 'In Progress' },
      { title: 'Leadership Principles Intro', subtitle: 'Understanding the importance of Amazon’s culture.', duration: '2h', status: 'In Progress' },
      { title: 'Advanced DSA & System Design', subtitle: 'Trees, Graphs, DP and Amazon scalability.', duration: '5h', status: 'Locked' },
      { title: 'Final Revision & 1:1 Mock', subtitle: 'Mock interview with Amazon SDE Mentor', duration: '3h', status: 'Locked' },
    ],
    leadership: [
      { title: 'Customer Obsession', description: 'Leaders start with the customer and work backwards.' },
      { title: 'Ownership', description: 'They never say “that’s not my job.”' },
    ],
    recommendation: {
      title: 'AWS Scale Patterns',
      subtitle: 'Recommended for System Design',
    },
  },
  microsoft: {
    name: 'Microsoft SDE Preparation Roadmap',
    subtitle: 'A focused preparation journey for Microsoft technical interviews and product culture fit.',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    milestones: [
      { title: 'Week 1', description: 'Core Algorithms', status: 'Current Milestone' },
      { title: 'Week 2', description: 'System Design Foundations', status: 'Next Milestone' },
    ],
    progress: '20%',
    modules: [
      { title: 'Dynamic Programming Essentials', subtitle: 'Prepare for coding rounds with optimal DP solutions.', duration: '6h', status: 'In Progress' },
      { title: 'Behavioral Interview Prep', subtitle: 'Practice STAR responses for Microsoft culture.', duration: '3h', status: 'Locked' },
    ],
    leadership: [
      { title: 'Growth Mindset', description: 'Embrace continuous learning and improvement.' },
      { title: 'Customer Obsession', description: 'Focus on creating value for users and stakeholders.' },
    ],
    recommendation: {
      title: 'Azure System Design',
      subtitle: 'Recommended for cloud infrastructure prep',
    },
  },
  google: {
    name: 'Google SDE Preparation Roadmap',
    subtitle: 'Structured prep for Google interviews with emphasis on algorithms, product sense, and scale.',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    milestones: [
      { title: 'Week 1', description: 'Data Structures & Algorithms', status: 'Current Milestone' },
      { title: 'Week 2', description: 'System Design & Product Sense', status: 'Next Milestone' },
    ],
    progress: '15%',
    modules: [
      { title: 'Graph Theory Deep Dive', subtitle: 'Master graph traversal and shortest paths.', duration: '5h', status: 'In Progress' },
      { title: 'Leadership Communication', subtitle: 'Build strong answers for behavioral questions.', duration: '2h', status: 'Locked' },
    ],
    leadership: [
      { title: 'Problem Solving', description: 'Use first principles to simplify complex issues.' },
      { title: 'Think Big', description: 'Create ambitious solutions that scale globally.' },
    ],
    recommendation: {
      title: 'Google Product Sense',
      subtitle: 'Recommended for interview strategy',
    },
  },
};

export const CompanyPrepDetailPage: React.FC<CompanyPrepDetailPageProps> = ({ companyId, onBack }) => {
  const company = companyDetails[companyId as keyof typeof companyDetails] || companyDetails.amazon;

  return (
    <Container fluid className="px-0">
      <Button variant="link" className="text-primary fw-bold mb-3" onClick={onBack}>
        <i className="bi bi-arrow-left me-2"></i> Back to Company Prep
      </Button>

      <Card className="rounded-16 shadow-xs overflow-hidden border-0 mb-4">
        <div style={{ position: 'relative', minHeight: 240, overflow: 'hidden' }}>
          <img
            src={company.imageUrl}
            alt={company.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
          />
          <div style={{ position: 'absolute', inset: 0, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div className="d-flex align-items-center gap-3 mb-2">
              <CompanyLogo companyName={companyId} size={56} />
              <div>
                <Badge bg="info" className="mb-1 text-uppercase fs-8 rounded-pill">{companyId.toUpperCase()}</Badge>
                <h1 className="text-white fw-bold mb-0 fs-3">{company.name}</h1>
              </div>
            </div>
            <p className="text-white-50 fs-7 mb-0" style={{ maxWidth: 540 }}>{company.subtitle}</p>
          </div>
        </div>
      </Card>

      <Row className="g-4">
        <Col xl={8}>
          <Card className="rounded-16 shadow-xs border-0 overflow-hidden mb-4">
            <Card.Body className="p-4">
              <Row className="g-3">
                <Col md={4}>
                  <Card className="rounded-16 border-0 bg-dark text-white h-100">
                    <Card.Body className="p-3 text-center">
                      <h5 className="fw-bold mb-2">{company.progress}</h5>
                      <p className="text-white-50 fs-8 mb-0">Done</p>
                    </Card.Body>
                  </Card>
                </Col>
                {company.milestones.map((milestone) => (
                  <Col md={4} key={milestone.title}>
                    <Card className="rounded-16 border-0 h-100">
                      <Card.Body className="p-3">
                        <p className="text-muted fs-8 mb-1">{milestone.title}</p>
                        <h6 className="fw-bold mb-2">{milestone.description}</h6>
                        <Badge bg="secondary" className="fs-8">{milestone.status}</Badge>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold">Weekly Curriculum</h5>
              <p className="text-muted fs-8 mb-0">Follow the roadmap to complete the most important prep modules first.</p>
            </div>
            <Button variant="outline-primary" size="sm">Continue Learning</Button>
          </div>

          <Row className="g-3">
            {company.modules.map((module) => (
              <Col key={module.title} md={6}>
                <Card className="rounded-16 border-0 shadow-xs h-100 bg-dark text-white">
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <p className="text-white-50 fs-8 mb-0">{module.duration}</p>
                      <Badge bg={module.status === 'Locked' ? 'secondary' : 'primary'} className="fs-8">
                        {module.status}
                      </Badge>
                    </div>
                    <h6 className="fw-bold mb-2">{module.title}</h6>
                    <p className="text-white-50 fs-8 mb-3">{module.subtitle}</p>
                    <Button variant="light" size="sm" className="w-100 fw-bold">Start Module</Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        <Col xl={4}>
          <Card className="rounded-16 shadow-xs border-0 mb-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">Leadership Focus</h6>
              {company.leadership.map((item) => (
                <Card key={item.title} className="mb-3 rounded-16 border-0 bg-dark text-white">
                  <Card.Body className="p-3">
                    <h6 className="fw-semibold mb-2">{item.title}</h6>
                    <p className="text-white-50 fs-8 mb-0">{item.description}</p>
                  </Card.Body>
                </Card>
              ))}
              <div className="mt-3">
                <p className="text-muted fs-8 mb-2">LP Interview Tips:</p>
                <ul className="text-muted fs-8" style={{ paddingLeft: '1rem' }}>
                  <li>Use the STAR method (Situation, Task, Action, Result).</li>
                  <li>Prepare 2 stories per principle.</li>
                </ul>
              </div>
            </Card.Body>
          </Card>

          <Card className="rounded-16 shadow-xs border-0 bg-dark text-white">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">Hand-picked for you</h6>
              <div className="bg-secondary bg-opacity-10 rounded-16 p-3">
                <p className="text-white mb-2 fs-7 fw-semibold">{company.recommendation.title}</p>
                <p className="text-white-50 fs-8 mb-0">{company.recommendation.subtitle}</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
