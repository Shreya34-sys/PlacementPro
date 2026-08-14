import React from 'react';
import { Button, Card, Container } from 'react-bootstrap';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => (
  <div className="py-4 py-lg-5" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
    <Container>
      <Card className="border-0 shadow-sm mx-auto p-4 p-md-5" style={{ borderRadius: '16px', maxWidth: '850px' }}>
        <Button variant="link" className="p-0 mb-4 text-decoration-none fw-semibold" onClick={onBack}>
          <i className="bi bi-arrow-left me-2" /> Back to registration
        </Button>
        <h1 className="h2 fw-bold mb-2">Privacy Policy</h1>
        <p className="text-secondary mb-4">Last updated: August 15, 2026</p>

        <section className="mb-4">
          <h2 className="h5 fw-bold">1. Information we collect</h2>
          <p className="text-secondary mb-0">We collect the account details you provide, such as your name and email address, to create and support your PlacementPro student account.</p>
        </section>
        <section className="mb-4">
          <h2 className="h5 fw-bold">2. How we use your information</h2>
          <p className="text-secondary mb-0">Your information helps us provide placement preparation tools, personalize your dashboard, and communicate important account updates.</p>
        </section>
        <section className="mb-4">
          <h2 className="h5 fw-bold">3. Your choices</h2>
          <p className="text-secondary mb-0">You can review or update your profile information from your account settings. Contact College Support if you need help with your account data.</p>
        </section>
        <section>
          <h2 className="h5 fw-bold">4. Questions</h2>
          <p className="text-secondary mb-0">For privacy questions, contact placementpro01@gmail.com.</p>
        </section>
      </Card>
    </Container>
  </div>
);
