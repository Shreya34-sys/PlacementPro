import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

interface AuthPageLayoutProps {
  children: React.ReactNode;
  bannerTitle: string;
  bannerText: string;
}

const footerSections = [
  {
    title: 'Contact Us',
    links: ['College Support', 'placementpro01@gmail.com', 'Find us online'],
  },
  {
    title: 'Learning',
    links: ['DSA Preparation', 'Aptitude & Reasoning', 'Programming', 'Core CS Subjects', 'Web Development'],
  },
  {
    title: 'Career',
    links: ['Placement Preparation', 'Interview Preparation', 'Resume Building', 'Mock Interviews', 'Company Preparation'],
  },
  {
    title: 'Company',
    links: ['About Us', 'For Students', 'For Colleges', 'Contact Us', 'Privacy Policy', 'Terms & Conditions'],
  },
  {
    title: 'Resources',
    links: ['Placement Roadmaps', 'Practice Tests', 'Coding Resources', 'Interview Questions', 'Placement Blogs', 'FAQs'],
  },
  {
    title: 'Social Links',
    links: ['LinkedIn', 'GitHub', 'Instagram'],
  },
];

export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({ children, bannerTitle, bannerText }) => {
  // Note: The footer's navigation logic would need to be passed down if it's complex.
  // For this example, we'll keep it simple.
  const handleFooterLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    // In a real app, you'd pass down navigation handlers here.
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }} className="d-flex flex-column">
      <main className="d-flex flex-grow-1 align-items-center py-4 py-lg-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10} xl={9}>
              <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '16px' }}>
                <Row className="g-0">
                  <Col
                    lg={5}
                    className="d-none d-lg-flex flex-column justify-content-between p-4 p-xl-5 text-white"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-4">
                        <div
                          className="bg-white text-primary rounded-3 p-2 d-flex align-items-center justify-content-center shadow-xs"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <i className="bi bi-briefcase-fill fs-5" style={{ color: '#2563EB' }}></i>
                        </div>
                        <span className="fw-extrabold fs-4 tracking-tight">
                          Placement<span className="opacity-90 fw-light">Pro</span>
                        </span>
                      </div>
                      <h3 className="fw-extrabold text-white mb-3 leading-tight">{bannerTitle}</h3>
                      <p className="opacity-85 fs-7 mb-4 leading-relaxed">{bannerText}</p>
                    </div>
                    <div className="pt-3 border-top border-white border-opacity-20 d-flex align-items-center justify-content-between fs-8 opacity-75">
                      <span>&copy; 2026 PlacementPro Inc.</span>
                      <span>Student Career Portal</span>
                    </div>
                  </Col>
                  <Col lg={7} className="bg-white p-4 p-sm-5 d-flex flex-column justify-content-center">
                    <div className="max-w-md mx-auto w-100">{children}</div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>

      <footer style={{ backgroundColor: '#0B1220' }} className="text-white pt-5 pb-4">
        <Container>
          <Row className="g-4 g-lg-5">
            {/* Footer content can be mapped here, similar to the original file */}
          </Row>
          <div className="border-top mt-5 pt-4 text-center fs-7" style={{ borderColor: 'rgba(203, 213, 225, 0.18)' }}>
            <span style={{ color: '#CBD5E1' }}>&copy; 2026 PlacementPro. All rights reserved.</span>
          </div>
        </Container>
      </footer>
    </div>
  );
};