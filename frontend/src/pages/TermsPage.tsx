import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';

interface TermsPageProps {
  onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => (
  <div className="py-4 py-lg-5" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
    <Container>
      <Card className="border-0 shadow-sm mx-auto p-4 p-md-5" style={{ borderRadius: '16px', maxWidth: '850px' }}>
        <Button variant="link" className="p-0 mb-4 text-decoration-none fw-semibold" onClick={onBack}>
          <i className="bi bi-arrow-left me-2" /> Back to registration
        </Button>
        <h1 className="h2 fw-bold mb-2">Terms &amp; Conditions</h1>
        <p className="text-secondary mb-4">Last updated: August 15, 2026</p>

        <section className="mb-4">
          <h2 className="h5 fw-bold">1. Acceptance of terms</h2>
          <p className="text-secondary mb-0">By creating a PlacementPro account, you agree to these Terms &amp; Conditions and to use the platform responsibly.</p>
        </section>
        <section className="mb-4">
          <h2 className="h5 fw-bold">2. Your account</h2>
          <p className="text-secondary mb-0">Keep your account information accurate and protect your password. You are responsible for activity performed through your account.</p>
        </section>
        <section className="mb-4">
          <h2 className="h5 fw-bold">3. Appropriate use</h2>
          <p className="text-secondary mb-0">Use PlacementPro for placement preparation, career development, and related activities. Do not misuse the service, interfere with other users, or submit false information.</p>
        </section>
        <section className="mb-4">
          <h2 className="h5 fw-bold">4. Content and opportunities</h2>
          <p className="text-secondary mb-0">Placement information and preparation content are provided for guidance. Eligibility, hiring decisions, and job offers remain with the relevant institutions and employers.</p>
        </section>
        <section>
          <h2 className="h5 fw-bold">5. Changes to these terms</h2>
          <p className="text-secondary mb-0">We may update these terms as PlacementPro evolves. Continued use after an update means you accept the revised terms.</p>
        </section>
      </Card>
    </Container>
  </div>
);
