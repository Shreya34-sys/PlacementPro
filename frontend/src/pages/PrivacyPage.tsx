import React from 'react';
import { Button, Card, Container } from 'react-bootstrap';
import { Footer } from '../components/layout/Footer';

interface PrivacyPageProps {
  onBack: () => void;
}

type PolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const privacySections: PolicySection[] = [
  {
    title: '1. Information We Collect',
    paragraphs: ['Depending on how you use PlacementPro, we may collect several categories of information.', 'Account Information may include:'],
    bullets: [
      'Full name',
      'Email address',
      'College email address',
      'Password-related authentication information',
      'College name',
      'Branch or course',
      'Academic year',
      'Student identifier',
      'Profile information',
    ],
  },
  {
    title: '2. Google Authentication Information',
    paragraphs: ['If you select "Continue with Google", Google may provide certain account information to PlacementPro.', 'This may include:'],
    bullets: [
      'Name',
      'Email address',
      'Google account identifier',
      'Profile information made available through the authentication process',
      'PlacementPro does not receive your Google password.',
    ],
  },
  {
    title: '3. Academic and Eligibility Information',
    paragraphs: ['To support placement preparation and eligibility checking, PlacementPro may collect:'],
    bullets: [
      'CGPA',
      'Academic branch',
      'Year of study',
      'Backlog information',
      'College information',
      'Eligibility-related information',
      'This information may be used to determine whether a student meets configured eligibility criteria.',
    ],
  },
  {
    title: '4. Resume Information',
    paragraphs: ['If you use the Resume Screening or ATS feature, PlacementPro may process information contained in your uploaded or submitted resume.', 'This may include:'],
    bullets: [
      'Name',
      'Contact information',
      'Education',
      'Skills',
      'Projects',
      'Experience',
      'Certifications',
      'Keywords',
      'Other resume content',
      'The system may analyze formatting, keywords, and relevance and generate ATS-related feedback.',
    ],
  },
  {
    title: '5. Assessment Data',
    paragraphs: ['PlacementPro may collect information generated through assessments, including:'],
    bullets: [
      'Questions attempted',
      'Answers submitted',
      'Scores',
      'Test duration',
      'Completion status',
      'Coding submissions',
      'Test-case results',
      'Aptitude performance',
      'Technical MCQ performance',
      'Communication assessment results',
      'Cognitive assessment results',
      'This information may be used to display results, identify weaknesses, and generate personalized recommendations.',
    ],
  },
  {
    title: '6. Coding Data',
    paragraphs: ['When you participate in coding assessments, PlacementPro may process:'],
    bullets: [
      'Code submitted',
      'Programming language',
      'Test-case results',
      'Execution results',
      'Performance information',
      'Complexity-related analysis',
      'Code-review feedback',
    ],
  },
  {
    title: '7. Speech and Communication Data',
    paragraphs: ['If you participate in spoken-English, Versant-style, phone/video, or communication assessments, PlacementPro may process:'],
    bullets: [
      'Audio input',
      'Speech-to-text transcription',
      'Written responses',
      'Communication scores',
      'Grammar-related feedback',
      'Tone or pace-related feedback',
      'Interview or GD transcripts',
      'The exact information retained depends on the assessment and implementation.',
    ],
  },
  {
    title: '8. Group Discussion Data',
    paragraphs: ['If PlacementPro provides a Group Discussion simulation, the Platform may process:'],
    bullets: [
      'Participant information',
      'Audio/video communication',
      'Speech-to-text transcripts',
      'Participation information',
      'AI-generated feedback',
      'Assessment scores',
    ],
  },
  {
    title: '9. AI Interview Data',
    paragraphs: ['When you use the AI Interview Simulator, PlacementPro may process:'],
    bullets: [
      'Interview questions',
      'Your responses',
      'Conversation history',
      'Interview performance',
      'AI-generated feedback',
      'Scores',
      'Recommendations',
      'This information may be used to provide interview practice and personalized preparation.',
    ],
  },
  {
    title: '10. AI Proctoring Information',
    paragraphs: ['Certain assessments may use AI-powered proctoring.', 'Depending on the assessment, PlacementPro may process signals relating to:'],
    bullets: [
      'Face presence',
      'Multiple-face detection',
      'Facial movement',
      'Gaze-related signals',
      'Tab switching',
      'Window or browser focus changes',
      'Fullscreen exit',
      'Other configured integrity events',
      "Where technically feasible, face detection may be performed directly in the user's browser.",
    ],
  },
  {
    title: '11. Proctoring Logs',
    paragraphs: ['When a proctoring violation occurs, PlacementPro may create an audit record.', 'A proctoring log may contain:'],
    bullets: [
      'Student ID',
      'Exam ID',
      'Violation type',
      'Timestamp',
      'Severity',
      'Action taken',
      'Possible violation types may include tab switch, no face detected, multiple faces detected, and fullscreen exit.',
      'These records may be used to maintain assessment integrity and allow authorized faculty or administrators to review relevant assessment events.',
    ],
  },
  {
    title: '12. Proctoring Limitations',
    paragraphs: ['AI proctoring is an automated assistance mechanism.', 'It may occasionally produce inaccurate results because of:'],
    bullets: [
      'Lighting conditions',
      'Camera quality',
      'Device limitations',
      'Browser behavior',
      'Facial position',
      'Multiple people appearing accidentally',
      'Technical issues',
      'A proctoring event should therefore be understood as an automated integrity signal and not necessarily definitive proof of misconduct.',
    ],
  },
  {
    title: '13. Learning Activity',
    paragraphs: ['PlacementPro may collect information about how you use learning features.', 'This may include:'],
    bullets: [
      'Topics studied',
      'Resources opened',
      'Questions attempted',
      'Practice history',
      'Test performance',
      'Weak areas',
      'Progress',
      'Recommended resources',
      'Company preparation activity',
      'This information supports personalized learning and analytics.',
    ],
  },
  {
    title: '14. Company Preparation Activity',
    paragraphs: ['If you use Company-Wise Preparation, PlacementPro may record:'],
    bullets: [
      'Companies viewed',
      'Rounds viewed',
      'Resources accessed',
      'Practice questions attempted',
      'Questions asked to the AI assistant',
      'Preparation progress',
      'This information may be used to provide personalized company-specific preparation.',
    ],
  },
  {
    title: '15. RAG Assistant Information',
    paragraphs: [
      'When you use the "Ask About Any Company" assistant, your questions may be processed by the AI system.',
      "The system may use your query to retrieve relevant information from PlacementPro's curated preparation knowledge base and generate an answer.",
    ],
  },
  {
    title: '16. AI Agents',
    paragraphs: ['PlacementPro may use specialized AI agents for:'],
    bullets: [
      'Interview assistance',
      'Resume analysis',
      'Communication coaching',
      'Code review',
      'Preparation recommendations',
      'Analytics',
      'These systems may process information relevant to the feature being used.',
      'Interview Agent: interview conversation and responses.',
      'Resume Agent: resume content.',
      'Communication Coach: writing, speech, or transcript information.',
      'Code Review Agent: submitted code and execution-related information.',
      'Prep Recommender: weak-topic and learning information.',
      'Analytics Agent: assessment and readiness information.',
    ],
  },
  {
    title: '17. Placement Readiness Data',
    paragraphs: ['PlacementPro may combine information from multiple preparation modules to generate a Placement Readiness Score.', 'This may include:'],
    bullets: [
      'Aptitude scores',
      'Coding performance',
      'Technical scores',
      'Communication performance',
      'Interview performance',
      'Other available assessment metrics',
      'The readiness score is an internal preparation indicator and is not an official employer assessment.',
    ],
  },
  {
    title: '18. Technical Information',
    paragraphs: ['When you access PlacementPro, we may automatically collect technical information such as:'],
    bullets: [
      'IP address',
      'Browser type',
      'Device type',
      'Operating system',
      'Approximate location information where technically available',
      'Access timestamps',
      'Pages visited',
      'Error information',
      'Performance information',
      'Session information',
      'This information may be used for security, troubleshooting, analytics, performance improvements, and fraud prevention.',
    ],
  },
  {
    title: '19. Cookies and Browser Storage',
    paragraphs: ['PlacementPro may use:', 'These technologies may be used to:'],
    bullets: [
      'Cookies',
      'Local storage',
      'Session storage',
      'Authentication/session tokens',
      'Similar technologies',
      'Maintain login sessions',
      'Remember preferences',
      'Maintain assessment state',
      'Improve security',
      'Improve Platform functionality',
      'Disabling certain browser storage or cookies may affect Platform functionality.',
    ],
  },
  {
    title: '20. How We Use Your Information',
    paragraphs: ['We may use your information for account management, learning, assessments, AI features, security, and platform improvement.'],
    bullets: [
      'Create your account.',
      'Authenticate you.',
      'Maintain your profile.',
      'Manage sessions.',
      'Track learning progress.',
      'Provide personalized resources.',
      'Display performance information.',
      'Recommend preparation materials.',
      'Conduct tests.',
      'Calculate scores.',
      'Maintain assessment records.',
      'Provide performance insights.',
      'Conduct AI interviews.',
      'Analyze resumes.',
      'Review code.',
      'Provide communication feedback.',
      'Answer preparation questions.',
      'Detect suspicious activity.',
      'Prevent unauthorized access.',
      'Maintain audit logs.',
      'Protect Platform infrastructure.',
      'Understand feature usage.',
      'Fix technical issues.',
      'Improve performance.',
      'Develop new features.',
    ],
  },
  {
    title: '21. Who May Access Your Information?',
    paragraphs: ['Access depends on your account type and Platform configuration.'],
    bullets: [
      'Students may access their own profile, results, progress, preparation information, and readiness information.',
      'Authorized faculty or administrators may access relevant information required for managing assessments and student preparation.',
      'Faculty/admin access may include assessment results, rankings, proctoring logs, and student performance.',
      "Where recruiter functionality is enabled, authorized recruiters may access information relevant to recruitment activities, depending on Platform configuration and the student's participation.",
    ],
  },
  {
    title: '22. Third-Party Service Providers',
    paragraphs: ['PlacementPro may use third-party services for:'],
    bullets: [
      'Authentication',
      'Database hosting',
      'AI/LLM processing',
      'Speech-to-text',
      'Cloud infrastructure',
      'Email',
      'Analytics',
      'Security',
      'Code execution',
      'These providers may process information according to their applicable terms and privacy policies.',
    ],
  },
  {
    title: '23. AI Data Processing',
    paragraphs: ['When you use AI-powered features, relevant information may be processed by AI systems to generate the requested output.'],
    bullets: [
      'Resume Analysis: your resume may be analyzed to generate ATS-related feedback.',
      'AI Interview: your responses may be processed to generate interview questions and feedback.',
      'Code Review: your submitted code may be analyzed for complexity, style, edge cases, and other factors.',
      'Company Assistant: your question may be processed to retrieve and generate company-specific preparation information.',
    ],
  },
  {
    title: '24. Data Sharing',
    paragraphs: ['PlacementPro does not sell personal information.', 'Information may be shared when necessary for:'],
    bullets: [
      'Platform operation',
      'Authentication',
      'Cloud infrastructure',
      'AI processing',
      'Assessment functionality',
      'Institutional services',
      'Recruitment functionality',
      'Security',
      'Legal compliance',
      'Where possible, access is limited to information necessary for the relevant purpose.',
    ],
  },
  {
    title: '25. College and Institutional Access',
    paragraphs: ['If your college uses PlacementPro, authorized institutional users may receive access to relevant student information.', 'Depending on the Platform configuration, this may include:'],
    bullets: [
      'Student profile',
      'Assessment scores',
      'Test participation',
      'Rankings',
      'Learning progress',
      'Proctoring events',
      'The exact information available depends on the features enabled by the institution.',
    ],
  },
  {
    title: '26. Recruiter Access',
    paragraphs: ['If you participate in a recruitment drive through PlacementPro, relevant information may be made available to the participating recruiter.', 'Depending on the feature, this may include:'],
    bullets: [
      'Name',
      'Email',
      'Academic information',
      'Skills',
      'Resume',
      'Assessment results',
      'Relevant preparation information',
      'Where appropriate, users will be informed about recruitment-related data sharing.',
    ],
  },
  {
    title: '27. Data Security',
    paragraphs: ['We use reasonable technical and organizational measures designed to protect information against unauthorized access, alteration, disclosure, or destruction.', 'These measures may include:'],
    bullets: [
      'Authentication controls',
      'Role-based access',
      'Secure APIs',
      'Database access controls',
      'Encryption where appropriate',
      'Security monitoring',
      'Restricted administrative access',
      'However, no online system can guarantee absolute security.',
    ],
  },
  {
    title: '28. Data Retention',
    paragraphs: ['We may retain information for as long as reasonably necessary for:'],
    bullets: [
      'Providing Platform services',
      'Maintaining assessment records',
      'Providing progress history',
      'Security',
      'Analytics',
      'Legal compliance',
      'Resolving disputes',
      'Preventing fraud',
      'Retention periods may vary depending on the type of information.',
    ],
  },
  {
    title: '29. Account Deletion',
    paragraphs: ['You may request deletion of your PlacementPro account by contacting placementpro01@gmail.com.', 'Account deletion may result in loss of:'],
    bullets: [
      'Profile',
      'Learning progress',
      'Assessment history',
      'Readiness scores',
      'Saved preparation data',
      'Certain information may be retained where required for legal, security, institutional, or legitimate operational purposes.',
    ],
  },
  {
    title: '30. Your Privacy Rights',
    paragraphs: ['Depending on applicable law, you may have rights to:'],
    bullets: [
      'Request access to your personal information.',
      'Request correction of inaccurate information.',
      'Request deletion where applicable.',
      'Ask how your information is processed.',
      'Withdraw consent where applicable.',
      'Raise privacy concerns.',
      'Request information about data sharing.',
      'For privacy-related requests, contact placementpro01@gmail.com.',
      'We may need to verify your identity before processing certain requests.',
    ],
  },
  {
    title: "31. Children's Privacy",
    paragraphs: [
      'PlacementPro is designed primarily for students and individuals preparing for higher education and employment opportunities.',
      'We do not knowingly seek to collect personal information from children in violation of applicable law.',
      'If you believe that a child has provided information to PlacementPro improperly, contact placementpro01@gmail.com.',
    ],
  },
  {
    title: '32. Third-Party Websites',
    paragraphs: [
      'PlacementPro may contain links to external websites, including company career pages, learning resources, coding platforms, and recruitment websites.',
      "When you leave PlacementPro, the third party's privacy policy applies.",
      'PlacementPro is not responsible for the privacy practices of external websites.',
    ],
  },
  {
    title: '33. Changes to This Privacy Policy',
    paragraphs: ['We may update this Privacy Policy when:'],
    bullets: [
      'New features are introduced.',
      'Data practices change.',
      'AI functionality changes.',
      'Proctoring functionality changes.',
      'Legal requirements change.',
      'Security improvements are introduced.',
      'The Last Updated date will be changed when the policy is revised.',
    ],
  },
  {
    title: '34. Contact Us',
    paragraphs: ['For privacy questions, requests, or concerns:', 'PlacementPro', 'Email: placementpro01@gmail.com'],
  },
];

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => (
  <div className="d-flex flex-column" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
    <Container className="py-4 py-lg-5 flex-grow-1">
      <Card className="border-0 shadow-sm mx-auto p-4 p-md-5" style={{ borderRadius: '16px', maxWidth: '900px' }}>
        <Button variant="link" className="p-0 mb-4 text-decoration-none fw-semibold align-self-start" onClick={onBack}>
          <i className="bi bi-arrow-left me-2" /> Back
        </Button>

        <h1 className="h2 fw-bold mb-2">Privacy Policy</h1>
        <p className="text-secondary mb-4">Last Updated: August 15, 2026</p>
        <p className="text-secondary">
          PlacementPro respects the privacy of its users.
        </p>
        <p className="text-secondary">
          This Privacy Policy explains how PlacementPro collects, uses, stores, protects, and may share information when you use our website,
          web application, assessments, AI features, authentication systems, and related services.
        </p>
        <p className="text-secondary mb-5">
          By using PlacementPro, you acknowledge that you have read and understood this Privacy Policy.
        </p>

        {privacySections.map((section) => (
          <section className="mb-4" key={section.title}>
            <h2 className="h5 fw-bold">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p className="text-secondary mb-2" key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets && (
              <ul className="text-secondary ps-4 mb-0">
                {section.bullets.map((bullet) => (
                  <li className="mb-1" key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </Card>
    </Container>
    <Footer />
  </div>
);
