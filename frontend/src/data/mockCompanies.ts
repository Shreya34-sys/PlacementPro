export interface CompanyDetail {
  id: string;
  name: string;
  logo: string;
  bannerUrl: string;
  tier: 'Super Dream' | 'Dream' | 'Standard';
  industry: 'Tech & Software' | 'Data & Analytics' | 'Cloud Infrastructure' | 'Fintech & Banking' | 'Core Engineering';
  location: string;
  website: string;
  packageRange: string;
  avgCtc: string;
  minCgpa: number;
  alumniPlaced: number;
  hiringStatus: 'Active Drive' | 'Visiting Soon' | 'Drive Completed';
  description: string;
  techStack: string[];
  cultureHighlights: string[];
  roundsBreakdown: {
    roundNumber: number;
    title: string;
    description: string;
  }[];
  interviewTips: string[];
  openDrivesCount: number;
}

export const mockCompanies: CompanyDetail[] = [
  {
    id: 'comp-1',
    name: 'TechCorp Solutions',
    logo: 'https://cdn.simpleicons.org/googlecloud',
    bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000',
    tier: 'Super Dream',
    industry: 'Tech & Software',
    location: 'San Francisco, CA / Hybrid',
    website: 'https://techcorp.example.com',
    packageRange: '$110,000 - $140,000 / yr',
    avgCtc: '$125,000 / yr',
    minCgpa: 7.5,
    alumniPlaced: 42,
    hiringStatus: 'Active Drive',
    description: 'TechCorp Solutions is a global leader in cloud computing and enterprise SaaS architectures, powering over 10,000 enterprise applications worldwide.',
    techStack: ['React', 'TypeScript', 'Node.js', 'Go', 'GraphQL', 'AWS'],
    cultureHighlights: [
      'Unlimited Learning Stipend & Certifications',
      'Flexible Hybrid Work Policy',
      'Hackathons & Innovation Fridays',
      'Comprehensive Health & Equity Grants'
    ],
    roundsBreakdown: [
      { roundNumber: 1, title: 'Online Aptitude & Coding Round', description: '90-min assessment containing 20 Aptitude MCQs and 2 Medium DSA coding problems.' },
      { roundNumber: 2, title: 'Technical Interview I (DSA & OOP)', description: '45-min live coding session on tree/graph traversals, system design basics, and OOP concepts.' },
      { roundNumber: 3, title: 'Technical Interview II (System Architecture)', description: '45-min discussion on API design, DB indexing, microservices, and past project architecture.' },
      { roundNumber: 4, title: 'HR & Cultural Alignment', description: '30-min conversation on team fit, relocation, compensation structure, and career trajectory.' },
    ],
    interviewTips: [
      'Focus heavily on time and space complexity optimizations in DSA coding problems.',
      'Be prepared to explain past project architecture on a whiteboard/shared canvas.',
      'Review React virtual DOM mechanics and Node.js asynchronous event loop fundamentals.'
    ],
    openDrivesCount: 2,
  },
  {
    id: 'comp-2',
    name: 'DataPulse Analytics',
    logo: 'https://cdn.simpleicons.org/databricks',
    bannerUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1000',
    tier: 'Dream',
    industry: 'Data & Analytics',
    location: 'New York, NY / Remote',
    website: 'https://datapulse.example.com',
    packageRange: '$85,000 - $105,000 / yr',
    avgCtc: '$95,000 / yr',
    minCgpa: 7.0,
    alumniPlaced: 28,
    hiringStatus: 'Active Drive',
    description: 'DataPulse provides AI-driven predictive market insights and real-time business intelligence telemetry for Fortune 500 financial institutions.',
    techStack: ['Python', 'SQL', 'PySpark', 'Tableau', 'Scikit-learn', 'Snowflake'],
    cultureHighlights: [
      'Data Science Research Labs & Publications',
      'Mentorship from Senior Data Architects',
      'Competitive Bonus & Stock Options'
    ],
    roundsBreakdown: [
      { roundNumber: 1, title: 'Aptitude & SQL Assessment', description: '60-min test on quantitative reasoning, probability, statistics, and complex SQL join queries.' },
      { roundNumber: 2, title: 'Data Analytics Live Case Study', description: '60-min dataset analysis challenge where candidates formulate data insights and present findings.' },
      { roundNumber: 3, title: 'Behavioral & Leadership Round', description: '30-min discussion with Analytics Lead regarding team communication and stakeholder management.' },
    ],
    interviewTips: [
      'Brush up on advanced SQL window functions (ROW_NUMBER, DENSE_RANK, LAG/LEAD).',
      'Revise probability distributions, hypothesis testing, and A/B test metric design.',
      'Practice explaining complex analytical findings in clear business language.'
    ],
    openDrivesCount: 1,
  },
  {
    id: 'comp-3',
    name: 'CloudScale Dynamics',
    logo: 'https://cdn.simpleicons.org/kubernetes',
    bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000',
    tier: 'Dream',
    industry: 'Cloud Infrastructure',
    location: 'Austin, TX',
    website: 'https://cloudscale.example.com',
    packageRange: '$100,000 - $120,000 / yr',
    avgCtc: '$115,000 / yr',
    minCgpa: 8.0,
    alumniPlaced: 19,
    hiringStatus: 'Visiting Soon',
    description: 'CloudScale Dynamics specializes in next-generation Kubernetes automation, zero-trust cloud network security, and infrastructure as code.',
    techStack: ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'Linux', 'Python'],
    cultureHighlights: [
      'Cloud Certification Expense Reimbursement',
      'High Impact Infrastructure Engineering',
      'Generous PTO & Wellness Allowances'
    ],
    roundsBreakdown: [
      { roundNumber: 1, title: 'DevOps & Systems Quiz', description: '45-min online test covering Linux shell commands, Networking (TCP/IP), and Docker basics.' },
      { roundNumber: 2, title: 'Hands-on Scripting & Linux Debugging', description: '60-min live troubleshooting exercise on Linux server environments.' },
      { roundNumber: 3, title: 'HR & Management Round', description: '30-min fitment check and campus hire onboarding outline.' }
    ],
    interviewTips: [
      'Know essential Linux commands (grep, awk, sed, netstat, systemctl) thoroughly.',
      'Understand container networking and Dockerfile layer optimization techniques.'
    ],
    openDrivesCount: 1,
  },
  {
    id: 'comp-4',
    name: 'Quantum Financial Technologies',
    logo: 'https://cdn.simpleicons.org/bloomberg',
    bannerUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1000',
    tier: 'Super Dream',
    industry: 'Fintech & Banking',
    location: 'Chicago, IL / Boston, MA',
    website: 'https://quantumfintech.example.com',
    packageRange: '$130,000 - $160,000 / yr',
    avgCtc: '$145,000 / yr',
    minCgpa: 8.5,
    alumniPlaced: 15,
    hiringStatus: 'Visiting Soon',
    description: 'High-frequency algorithmic trading firm and quantitative financial research platform utilizing low-latency C++ engines and distributed consensus models.',
    techStack: ['C++', 'Rust', 'Python', 'Kafka', 'PostgreSQL'],
    cultureHighlights: [
      'Industry-leading compensation & performance bonuses',
      'Onsite gourmet dining & gym facilities',
      'Direct exposure to financial markets and quant trading algorithms'
    ],
    roundsBreakdown: [
      { roundNumber: 1, title: 'Aptitude, Math & Low-Level CS Assessment', description: '75-min test on advanced probability, combinatorics, memory management, and pointers.' },
      { roundNumber: 2, title: 'Algorithm Optimization Round', description: '60-min interview focusing on cache locality, time efficiency, and concurrency.' },
      { roundNumber: 3, title: 'System Design & Final Interview', description: '60-min architectural session with Senior Quantitative Partner.' }
    ],
    interviewTips: [
      'Master C++ memory management, smart pointers, and standard template library (STL).',
      'Practice fast mental math, expected value calculations, and brain teasers.'
    ],
    openDrivesCount: 1,
  },
  {
    id: 'comp-5',
    name: 'Apex Robotics & Industrial AI',
    logo: 'https://cdn.simpleicons.org/siemens',
    bannerUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1000',
    tier: 'Standard',
    industry: 'Core Engineering',
    location: 'Detroit, MI / San Jose, CA',
    website: 'https://apexrobotics.example.com',
    packageRange: '$75,000 - $90,000 / yr',
    avgCtc: '$82,000 / yr',
    minCgpa: 6.8,
    alumniPlaced: 35,
    hiringStatus: 'Drive Completed',
    description: 'Pioneering autonomous industrial robotics, embedded computer vision, and IoT smart factory automation systems for automotive gigafactories.',
    techStack: ['Embedded C', 'ROS 2', 'Python', 'OpenCV', 'MATLAB'],
    cultureHighlights: [
      'Hardware Prototype Testing Facilities',
      'Patents & Research Grant Incentives',
      'Solid Career Progression Pathway'
    ],
    roundsBreakdown: [
      { roundNumber: 1, title: 'Core Engineering Aptitude', description: '60-min test on mechanics, electronics, microcontrollers, and logic.' },
      { roundNumber: 2, title: 'Technical Interview', description: '45-min discussion on microcontrollers, sensor integration, and signal processing.' }
    ],
    interviewTips: [
      'Review fundamental circuit design, microcontrollers (ARM / AVR), and control system theory.'
    ],
    openDrivesCount: 0,
  }
];
