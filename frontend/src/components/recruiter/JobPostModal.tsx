import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { JobDrive } from '../../types';

interface JobPostModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (job: Omit<JobDrive, 'id' | 'applicantsCount'>) => void;
}

export const JobPostModal: React.FC<JobPostModalProps> = ({ show, onHide, onSubmit }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    title: '',
    category: 'Full Time' as 'Full Time' | 'Internship' | 'PPO',
    location: '',
    ctc: '',
    eligibilityCgpa: 7.0,
    allowedBranches: 'Computer Science, Information Technology',
    deadline: '',
    description: '',
    requirements: 'React, Node.js, SQL',
    status: 'Active' as const,
    driveDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      allowedBranches: formData.allowedBranches.split(',').map((s) => s.trim()),
      requirements: formData.requirements.split(',').map((s) => s.trim()),
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold fs-5">
          <i className="bi bi-plus-circle text-primary me-2"></i> Post New Placement Job Drive
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Company Name</Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="e.g. TechCorp Solutions"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Job Title / Role</Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="e.g. Software Engineer I"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Type</Form.Label>
                <Form.Select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as 'Full Time' | 'Internship' | 'PPO' })
                  }
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Internship">Internship</option>
                  <option value="PPO">PPO</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Package / CTC</Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="e.g. $120,000 / yr"
                  value={formData.ctc}
                  onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Min CGPA Cutoff</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.eligibilityCgpa}
                  onChange={(e) => setFormData({ ...formData, eligibilityCgpa: parseFloat(e.target.value) })}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Location</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Application Deadline</Form.Label>
                <Form.Control
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Job Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  required
                  placeholder="Key responsibilities and expectations..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Publish Job Drive
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
