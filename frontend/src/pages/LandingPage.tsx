import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { motion, useReducedMotion } from 'framer-motion';
import './LandingPage.css';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

const features = [
  { icon: 'bi-bullseye', title: 'Targeted practice', text: 'Practice the aptitude, coding, and communication skills employers look for.' },
  { icon: 'bi-chat-square-text', title: 'Mock interviews', text: 'Build interview confidence with guided AI feedback after every session.' },
  { icon: 'bi-bar-chart-line', title: 'Clear progress', text: 'See exactly where you stand and what to work on next.' },
];

const steps = ['Set your goal', 'Practice your skills', 'Take a simulation', 'Review your insights'];

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

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const reduceMotion = useReducedMotion();
  const heroItem = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.55, delay, ease: 'easeOut' as const },
  });
  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.55, delay, ease: 'easeOut' as const },
  });

  return (
  <main className="minimal-landing">
    <nav className="minimal-nav">
      <Container className="d-flex align-items-center justify-content-between">
        <button className="minimal-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="minimal-brand-icon"><i className="bi bi-briefcase-fill" /></span>
          PlacementPro
        </button>
        <div className="d-flex align-items-center gap-3">
          <button className="minimal-text-button d-none d-sm-block" onClick={() => onNavigate('login')}>Log in</button>
          <button className="minimal-button minimal-button-primary minimal-button-small" onClick={() => onNavigate('register')}>Get started</button>
        </div>
      </Container>
    </nav>

    <section className="minimal-hero minimal-hero-centered">
      <Container>
        <div className="minimal-hero-copy">
          <motion.p className="minimal-kicker" {...heroItem(0)}>AI-powered placement preparation</motion.p>
          <motion.h1 {...heroItem(.1)}>Prepare with clarity.<br /><span>Perform with confidence.</span></motion.h1>
          <motion.p className="minimal-lead" {...heroItem(.2)}>PlacementPro brings practice, mock interviews, and progress insights together in one focused space.</motion.p>
          <motion.div className="minimal-hero-actions" {...heroItem(.3)}>
            <button className="minimal-button minimal-button-primary" onClick={() => onNavigate('register')}>Start preparing <i className="bi bi-arrow-right" /></button>
            <button className="minimal-button minimal-button-secondary" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>See how it works</button>
          </motion.div>
          <motion.p className="minimal-note" {...heroItem(.4)}><i className="bi bi-check2-circle" /> Free to start. Built for campus placements.</motion.p>
        </div>
      </Container>
    </section>

    <motion.section className="minimal-section" id="features" {...reveal()}>
      <Container>
        <motion.div className="minimal-section-heading" {...reveal()}><p className="minimal-kicker">Everything you need</p><h2>A simple system for better preparation.</h2><p>Stay focused on the work that moves you closer to your next opportunity.</p></motion.div>
        <Row className="g-4">
          {features.map((feature, index) => <Col md={4} key={feature.title}><motion.article className="minimal-feature" {...reveal(.1 + index * .1)}><span className="minimal-feature-icon"><i className={`bi ${feature.icon}`} /></span><h3>{feature.title}</h3><p>{feature.text}</p><a href="#features" onClick={(event) => event.preventDefault()}>Learn more <i className="bi bi-arrow-up-right" /></a></motion.article></Col>)}
        </Row>
      </Container>
    </motion.section>

    <motion.section className="minimal-section minimal-process" id="how-it-works" {...reveal()}>
      <Container>
        <Row className="align-items-end mb-4"><Col md={7}><motion.div className="minimal-section-heading mb-0" {...reveal()}><p className="minimal-kicker">How it works</p><h2>Your preparation, in four clear steps.</h2></motion.div></Col><Col md={5}><motion.p className="minimal-process-intro" {...reveal(.1)}>A repeatable process to help you practice deliberately, measure progress, and improve.</motion.p></Col></Row>
        <Row className="g-3">{steps.map((step, index) => <Col sm={6} lg={3} key={step}><motion.div className="minimal-step" {...reveal(.1 + index * .1)}><span>0{index + 1}</span><h3>{step}</h3><p>{index === 0 ? 'Tell us what role and companies you are aiming for.' : index === 1 ? 'Use structured practice built around placement rounds.' : index === 2 ? 'Put it together in a realistic, timed environment.' : 'Use focused feedback to decide what comes next.'}</p></motion.div></Col>)}</Row>
      </Container>
    </motion.section>

    <motion.section className="minimal-cta" {...reveal()}><Container><motion.div {...reveal()}><p className="minimal-kicker">Start today</p><h2>Ready to prepare with purpose?</h2><p>Take your next placement round with a clearer plan and more confidence.</p><button className="minimal-button minimal-button-primary" onClick={() => onNavigate('register')}>Create your free account <i className="bi bi-arrow-right" /></button></motion.div></Container></motion.section>

    <footer style={{ backgroundColor: '#0B1220' }} className="text-white pt-5 pb-4">
      <Container>
        <Row className="g-4 g-lg-5">
          <Col lg={3} md={6}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <div
                className="bg-white rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px' }}
              >
                <i className="bi bi-briefcase-fill fs-5" style={{ color: '#2563EB' }}></i>
              </div>
              <span className="fw-extrabold fs-4 tracking-tight">Placement<span className="fw-light">Pro</span></span>
            </div>
            <p className="mb-0 fs-7" style={{ color: '#CBD5E1', maxWidth: '260px' }}>
              Your complete platform for placement preparation.
            </p>
          </Col>

          {footerSections.map((section) => (
            <Col key={section.title} lg={section.title === 'Social Links' ? 2 : 3} md={4} sm={6}>
              <h6 className="fw-bold text-white mb-3">{section.title}</h6>
              <ul className="list-unstyled d-grid gap-2 mb-0">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href={link === 'Terms & Conditions' ? '#terms' : link === 'Privacy Policy' ? '#privacy' : '#'}
                      onClick={(event) => {
                        if (link === 'Terms & Conditions') {
                          event.preventDefault();
                          onNavigate('terms');
                          return;
                        }
                        if (link === 'Privacy Policy') {
                          event.preventDefault();
                          onNavigate('privacy');
                          return;
                        }
                        event.preventDefault();
                      }}
                      className="text-decoration-none fs-7"
                      style={{ color: '#CBD5E1' }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </Col>
          ))}
        </Row>

        <div className="border-top mt-5 pt-4 text-center fs-7" style={{ borderColor: 'rgba(203, 213, 225, 0.18)' }}>
          <span style={{ color: '#CBD5E1' }}>&copy; 2026 PlacementPro. All rights reserved.</span>
        </div>
      </Container>
    </footer>
  </main>
  );
};
