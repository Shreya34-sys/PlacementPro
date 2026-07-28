import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Modal, Button, Badge } from 'react-bootstrap';
import { mockUsers } from '../data/mockData';
import { UserProfile } from '../types';
import { StudentProfileCard } from '../components/student/StudentProfileCard';

export const StudentsPage: React.FC = () => {
  const students = mockUsers.filter((u) => u.role === 'student');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [minCgpa, setMinCgpa] = useState<number>(0);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || s.department === deptFilter;
    const matchesCgpa = (s.cgpa || 0) >= minCgpa;
    return matchesSearch && matchesDept && matchesCgpa;
  });

  return (
    <Container fluid className="px-0">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Student Placement Directory</h3>
        <p className="text-muted mb-0">Search and evaluate batch candidates by CGPA, branch, and profile.</p>
      </div>

      <Row className="g-3 mb-4">
        <Col md={5}>
          <InputGroup>
            <InputGroup.Text className="bg-white text-muted">
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search student by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="All">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics">Electronics</option>
            <option value="Electrical">Electrical</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select value={minCgpa} onChange={(e) => setMinCgpa(parseFloat(e.target.value))}>
            <option value="0">All CGPA Scores</option>
            <option value="7.0">Min 7.0 CGPA</option>
            <option value="8.0">Min 8.0 CGPA</option>
            <option value="8.5">Min 8.5 CGPA</option>
            <option value="9.0">Min 9.0 CGPA</option>
          </Form.Select>
        </Col>
      </Row>

      <Row className="g-4">
        {filteredStudents.length === 0 ? (
          <Col md={12}>
            <Card className="shadow-sm border-0 text-center py-5">
              <Card.Body>
                <i className="bi bi-people text-muted fs-1 d-block mb-2"></i>
                <h5 className="fw-bold">No students match your search criteria</h5>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          filteredStudents.map((student) => (
            <Col key={student.id} sm={6} md={4} xl={3}>
              <Card className="shadow-sm border-0 h-100 hover-shadow transition-all text-center p-3">
                <Card.Body>
                  <img
                    src={student.avatarUrl || 'https://via.placeholder.com/80'}
                    alt={student.name}
                    className="rounded-circle mb-3 border border-2 border-primary"
                    width="80"
                    height="80"
                  />
                  <h6 className="fw-bold mb-1 text-dark">{student.name}</h6>
                  <p className="text-muted fs-7 mb-2">{student.email}</p>
                  <div className="mb-3">
                    <Badge bg="primary" className="me-1">{student.department || 'Computer Science'}</Badge>
                    <Badge bg="success">{student.cgpa || 8.8} CGPA</Badge>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-100"
                    onClick={() => setSelectedStudent(student)}
                  >
                    View Candidate Details
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Student Details Modal */}
      <Modal show={selectedStudent !== null} onHide={() => setSelectedStudent(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Candidate Academic Record</Modal.Title>
        </Modal.Header>
        {selectedStudent && (
          <Modal.Body className="p-4 text-center">
            <img
              src={selectedStudent.avatarUrl || 'https://via.placeholder.com/100'}
              alt={selectedStudent.name}
              className="rounded-circle mb-3 border border-3 border-primary"
              width="100"
              height="100"
            />
            <h5 className="fw-bold mb-1">{selectedStudent.name}</h5>
            <p className="text-muted mb-3">{selectedStudent.email} &bull; {selectedStudent.phone || 'N/A'}</p>

            <div className="bg-light p-3 rounded mb-3 text-start fs-7">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Department:</span>
                <span className="fw-bold">{selectedStudent.department}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Batch Year:</span>
                <span className="fw-bold">{selectedStudent.batchYear}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">CGPA Grade:</span>
                <span className="fw-bold text-success">{selectedStudent.cgpa} / 10.0</span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-100"
              href="https://placementpro.edu/resumes/sample.pdf"
              target="_blank"
            >
              <i className="bi bi-file-earmark-pdf me-2"></i> Download Verified Resume
            </Button>
          </Modal.Body>
        )}
      </Modal>
    </Container>
  );
};
