import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto border-top border-secondary">
      <Container>
        <Row className="align-items-center gy-3">
          <Col md={6} className="text-center text-md-start">
            <span className="fw-bold text-primary">PlacementPro</span> &copy; {new Date().getFullYear()} Campus Placement Management System. All rights reserved.
          </Col>
          <Col md={6} className="text-center text-md-end">
            <small className="text-muted">
              Built with React + Bootstrap | Campus Recruitment Engine
            </small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};
