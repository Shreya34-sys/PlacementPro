import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Tabs, Tab } from 'react-bootstrap';
import { mockCompanies, CompanyDetail } from '../data/mockCompanies';
import { usePlacement } from '../context/PlacementContext';
import { useAuth } from '../context/AuthContext';

interface CompaniesPageProps {
  onNavigateToJob?: (jobId: string) => void;
}

export const CompaniesPage: React.FC<CompaniesPageProps> = ({ onNavigateToJob }) => {
  const { jobDrives, applyForJob, applications } = usePlacement();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'ctc' | 'alumni'>('alumni');
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);

  // Filter logic
  const filteredCompanies = mockCompanies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.techStack.some((tech) => tech.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesIndustry = selectedIndustry === 'All' || company.industry === selectedIndustry;
    const matchesTier = selectedTier === 'All' || company.tier === selectedTier;
    const matchesStatus = selectedStatus === 'All' || company.hiringStatus === selectedStatus;

    return matchesSearch && matchesIndustry && matchesTier && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'alumni') return b.alumniPlaced - a.alumniPlaced;
    if (sortBy === 'ctc') {
      const ctcA = parseFloat(a.avgCtc.replace(/[^0-9.]/g, '')) || 0;
      const ctcB = parseFloat(b.avgCtc.replace(/[^0-9.]/g, '')) || 0;
      return ctcB - ctcA;
    }
    return 0;
  });

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Super Dream':
        return <Badge bg="danger" className="px-2.5 py-1 text-uppercase fs-8"><i className="bi bi-star-fill me-1"></i> Super Dream</Badge>;
      case 'Dream':
        return <Badge bg="primary" className="px-2.5 py-1 text-uppercase fs-8"><i className="bi bi-award-fill me-1"></i> Dream Tier</Badge>;
      default:
        return <Badge bg="secondary" className="px-2.5 py-1 text-uppercase fs-8">Standard Tier</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active Drive':
        return <Badge bg="success"><i className="bi bi-record-fill me-1 text-white animate-pulse"></i> Active Drive</Badge>;
      case 'Visiting Soon':
        return <Badge bg="warning" text="dark"><i className="bi bi-clock-history me-1"></i> Visiting Soon</Badge>;
      default:
        return <Badge bg="light" text="dark" className="border"><i className="bi bi-check2-circle me-1 text-muted"></i> Drive Completed</Badge>;
    }
  };

  if (selectedCompany) {
    const companyActiveDrives = jobDrives.filter(
      (j) => j.companyName.toLowerCase() === selectedCompany.name.toLowerCase()
    );

    return (
      <Container fluid className="px-0">
        <Button variant="outline-secondary" size="sm" onClick={() => setSelectedCompany(null)} className="mb-4">
          <i className="bi bi-arrow-left me-1"></i> Back to Companies List
        </Button>

        {/* Company Hero Card */}
        <Card className="shadow-sm border-0 mb-4 overflow-hidden">
          <div
            style={{
              height: '180px',
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${selectedCompany.bannerUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className="d-flex align-items-end p-4 text-white"
          >
            <div className="d-flex flex-wrap align-items-center gap-3 w-100">
              <img
                src={selectedCompany.logo}
                alt={selectedCompany.name}
                className="rounded-3 border border-3 border-white bg-white shadow-sm"
                width="72"
                height="72"
                style={{ objectFit: 'cover' }}
              />
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h3 className="fw-bold mb-0 text-white">{selectedCompany.name}</h3>
                  {getTierBadge(selectedCompany.tier)}
                  {getStatusBadge(selectedCompany.hiringStatus)}
                </div>
                <div className="fs-7 opacity-90 d-flex align-items-center gap-3 flex-wrap">
                  <span><i className="bi bi-geo-alt me-1"></i>{selectedCompany.location}</span>
                  <span><i className="bi bi-building me-1"></i>{selectedCompany.industry}</span>
                  <a
                    href={selectedCompany.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white text-decoration-underline"
                  >
                    <i className="bi bi-globe me-1"></i>Website
                  </a>
                </div>
              </div>
            </div>
          </div>

          <Card.Body className="p-4 bg-white">
            <Row className="g-3 text-center border-bottom pb-4 mb-4">
              <Col sm={3} className="border-end-sm">
                <small className="text-muted d-block text-uppercase fw-semibold fs-8">Average Package</small>
                <span className="fs-5 fw-bold text-success">{selectedCompany.avgCtc}</span>
              </Col>
              <Col sm={3} className="border-end-sm">
                <small className="text-muted d-block text-uppercase fw-semibold fs-8">Package Range</small>
                <span className="fs-6 fw-bold text-dark">{selectedCompany.packageRange}</span>
              </Col>
              <Col sm={3} className="border-end-sm">
                <small className="text-muted d-block text-uppercase fw-semibold fs-8">Min CGPA Required</small>
                <span className="fs-5 fw-bold text-primary">{selectedCompany.minCgpa} CGPA</span>
              </Col>
              <Col sm={3}>
                <small className="text-muted d-block text-uppercase fw-semibold fs-8">Alumni Placed</small>
                <span className="fs-5 fw-bold text-dark">{selectedCompany.alumniPlaced} Students</span>
              </Col>
            </Row>

            <Tabs defaultActiveKey="overview" id="company-details-tabs" className="mb-4">
              <Tab eventKey="overview" title="Company Overview & Culture">
                <div className="pt-2">
                  <h6 className="fw-bold text-dark mb-2">About {selectedCompany.name}</h6>
                  <p className="text-secondary leading-relaxed mb-4">{selectedCompany.description}</p>

                  <h6 className="fw-bold text-dark mb-3">Core Technology Stack</h6>
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {selectedCompany.techStack.map((tech) => (
                      <Badge key={tech} bg="light" text="dark" className="border px-3 py-2 fs-7 fw-medium">
                        <i className="bi bi-code-slash text-primary me-1"></i>{tech}
                      </Badge>
                    ))}
                  </div>

                  <h6 className="fw-bold text-dark mb-3">Work Culture & Benefits</h6>
                  <Row className="g-2">
                    {selectedCompany.cultureHighlights.map((highlight, idx) => (
                      <Col key={idx} md={6}>
                        <div className="p-3 bg-light rounded d-flex align-items-center">
                          <i className="bi bi-check-circle-fill text-success me-2 fs-5"></i>
                          <span className="fs-7 fw-medium text-dark">{highlight}</span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="drives" title={`Active Recruitment Drives (${companyActiveDrives.length})`}>
                <div className="pt-3">
                  {companyActiveDrives.length > 0 ? (
                    companyActiveDrives.map((drive) => {
                      const isApplied = applications.some(
                        (a) => a.jobId === drive.id && a.studentId === currentUser?.id
                      );

                      return (
                        <Card key={drive.id} className="border mb-3 shadow-2hs">
                          <Card.Body className="p-3.5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                            <div>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <Badge bg="primary">{drive.category}</Badge>
                                <h5 className="fw-bold text-dark mb-0">{drive.title}</h5>
                              </div>
                              <div className="fs-7 text-muted">
                                <span className="me-3"><i className="bi bi-geo-alt me-1"></i>{drive.location}</span>
                                <span className="me-3"><i className="bi bi-cash-stack me-1"></i>{drive.ctc}</span>
                                <span><i className="bi bi-journal-text me-1"></i>CGPA &gt;= {drive.eligibilityCgpa}</span>
                              </div>
                            </div>
                            <div className="d-flex gap-2">
                              {onNavigateToJob && (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => onNavigateToJob(drive.id)}
                                >
                                  View Job Details
                                </Button>
                              )}
                              {isApplied ? (
                                <Button variant="success" size="sm" disabled>
                                  <i className="bi bi-check-lg me-1"></i> Applied
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    if (currentUser) {
                                      applyForJob(
                                        drive.id,
                                        currentUser.id,
                                        currentUser.name,
                                        currentUser.email,
                                        currentUser.department || 'Computer Science',
                                        currentUser.cgpa || 8.5
                                      );
                                    }
                                  }}
                                >
                                  Apply Now
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-5 bg-light rounded">
                      <i className="bi bi-building-exclamation display-4 text-muted d-block mb-2"></i>
                      <h6 className="fw-bold mb-1">No Active Drives Currently Open</h6>
                      <p className="text-muted fs-7 mb-0">Check back soon for upcoming drive schedules from {selectedCompany.name}.</p>
                    </div>
                  )}
                </div>
              </Tab>

              <Tab eventKey="process" title="Selection Rounds & Interview Tips">
                <div className="pt-3">
                  <h6 className="fw-bold text-dark mb-3">Recruitment Process Rounds</h6>
                  <div className="timeline position-relative ps-4 border-start border-2 border-primary mb-4">
                    {selectedCompany.roundsBreakdown.map((round) => (
                      <div key={round.roundNumber} className="mb-4 position-relative">
                        <span
                          className="position-absolute bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-8"
                          style={{ left: '-33px', top: '0', width: '24px', height: '24px' }}
                        >
                          {round.roundNumber}
                        </span>
                        <h6 className="fw-bold text-dark mb-1">{round.title}</h6>
                        <p className="text-muted fs-7 mb-0">{round.description}</p>
                      </div>
                    ))}
                  </div>

                  <h6 className="fw-bold text-dark mb-3">Previous Year Interview Tips</h6>
                  <div className="bg-light p-3.5 rounded border">
                    {selectedCompany.interviewTips.map((tip, idx) => (
                      <div key={idx} className="d-flex align-items-start mb-2 last-mb-0">
                        <i className="bi bi-lightbulb-fill text-warning me-2 mt-1"></i>
                        <span className="fs-7 text-dark">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="px-0">
      {/* Header Banner */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Partner Companies & Recruiters</h3>
        <p className="text-muted mb-0">Explore campus recruiting partners, package tiers, selection criteria, and past placement records.</p>
      </div>

      {/* Search & Filter Controls */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-3.5">
          <Row className="g-3">
            <Col lg={4}>
              <InputGroup>
                <InputGroup.Text className="bg-white text-muted">
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by company name, location, or tech..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col md={3} lg={2}>
              <Form.Select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
              >
                <option value="All">All Industries</option>
                <option value="Tech & Software">Tech & Software</option>
                <option value="Data & Analytics">Data & Analytics</option>
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Fintech & Banking">Fintech & Banking</option>
                <option value="Core Engineering">Core Engineering</option>
              </Form.Select>
            </Col>

            <Col md={3} lg={2}>
              <Form.Select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
              >
                <option value="All">All Tiers</option>
                <option value="Super Dream">Super Dream</option>
                <option value="Dream">Dream Tier</option>
                <option value="Standard">Standard Tier</option>
              </Form.Select>
            </Col>

            <Col md={3} lg={2}>
              <Form.Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Drive Statuses</option>
                <option value="Active Drive">Active Drive</option>
                <option value="Visiting Soon">Visiting Soon</option>
                <option value="Drive Completed">Drive Completed</option>
              </Form.Select>
            </Col>

            <Col md={3} lg={2}>
              <Form.Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="alumni">Sort by Alumni Placed</option>
                <option value="ctc">Sort by Package (CTC)</option>
                <option value="name">Sort by Name (A-Z)</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Companies Grid */}
      <Row className="g-4">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => (
            <Col key={company.id} md={6} xl={4}>
              <Card className="shadow-sm border-0 h-100 hover-shadow transition-all overflow-hidden d-flex flex-column">
                <div className="position-relative">
                  <div
                    style={{
                      height: '100px',
                      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${company.bannerUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="position-absolute top-100 start-0 translate-middle-y ms-3">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="rounded-3 border border-2 border-white bg-white shadow-sm"
                      width="52"
                      height="52"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="position-absolute top-0 end-0 p-2.5">
                    {getTierBadge(company.tier)}
                  </div>
                </div>

                <Card.Body className="p-4 pt-4 mt-2 d-flex flex-column flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="fw-bold text-dark mb-0">{company.name}</h5>
                      <span className="text-muted fs-7"><i className="bi bi-geo-alt me-1"></i>{company.location}</span>
                    </div>
                    {getStatusBadge(company.hiringStatus)}
                  </div>

                  <p className="text-muted fs-7 line-clamp-2 mb-3">
                    {company.description}
                  </p>

                  <div className="bg-light p-3 rounded mb-3 fs-7 mt-auto">
                    <div className="d-flex justify-content-between mb-1.5">
                      <span className="text-muted">Avg CTC:</span>
                      <strong className="text-success">{company.avgCtc}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1.5">
                      <span className="text-muted">Min Cutoff:</span>
                      <span className="fw-semibold">{company.minCgpa} CGPA</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Alumni Hired:</span>
                      <span className="fw-bold text-primary">{company.alumniPlaced} Students</span>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {company.techStack.slice(0, 4).map((tech) => (
                      <Badge key={tech} bg="white" text="dark" className="border fw-normal fs-8">
                        {tech}
                      </Badge>
                    ))}
                    {company.techStack.length > 4 && (
                      <Badge bg="white" text="muted" className="border fs-8">
                        +{company.techStack.length - 4} more
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="outline-primary"
                    className="w-100 fw-semibold"
                    onClick={() => setSelectedCompany(company)}
                  >
                    View Company Details
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <div className="text-center py-5 bg-white rounded shadow-sm">
              <i className="bi bi-search display-4 text-muted d-block mb-3"></i>
              <h5 className="fw-bold text-dark">No Companies Found</h5>
              <p className="text-muted mb-0">Try clearing or adjusting your search filters.</p>
            </div>
          </Col>
        )}
      </Row>
    </Container>
  );
};
