const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/db');

const companies = [
  {
    name: 'TCS',
    short_name: 'TCS',
    overview: 'TCS is a global IT services and consulting leader focused on digital transformation, enterprise modernization, and client-first delivery.',
    eligibility_rules: { minCgpa: 6.5, maxBacklogs: 1, branches: ['CSE','IT','CSBS','ECE','EEE','MECH'] },
    rounds: ['Aptitude','Technical','Managerial','HR'],
    resources: ['DSA','DBMS','Logical Reasoning','Communication']
  },
  {
    name: 'Infosys',
    short_name: 'Infosys',
    overview: 'Infosys is a major software services company known for training, engineering excellence, and digital transformation programs.',
    eligibility_rules: { minCgpa: 6.0, maxBacklogs: 1, branches: ['CSE','IT','CSBS','ECE','EEE'] },
    rounds: ['Aptitude','Coding','Technical','HR'],
    resources: ['Java','SQL','OOP','Aptitude']
  },
  {
    name: 'Wipro',
    short_name: 'Wipro',
    overview: 'Wipro focuses on consulting, system integration, and digital business operations across business and technology domains.',
    eligibility_rules: { minCgpa: 6.0, maxBacklogs: 2, branches: ['CSE','IT','CSBS','ECE'] },
    rounds: ['Aptitude','Technical','Technical Interview'],
    resources: ['Operating Systems','DBMS','Networking','Verbal']
  },
  {
    name: 'Accenture',
    short_name: 'Accenture',
    overview: 'Accenture delivers strategy, consulting, technology, and operations services with strong emphasis on problem solving and communication.',
    eligibility_rules: { minCgpa: 6.5, maxBacklogs: 0, branches: ['CSE','IT','CSBS','ECE','EEE','MECH'] },
    rounds: ['Reasoning','Technical','Communication','HR'],
    resources: ['Logical Ability','Projects','Communication','Leadership']
  },
  {
    name: 'Google',
    short_name: 'Google',
    overview: 'Google seeks top engineering talent with strong problem solving, system design, and product thinking capabilities.',
    eligibility_rules: { minCgpa: 8.0, maxBacklogs: 0, branches: ['CSE','IT','CSBS'] },
    rounds: ['Aptitude','DSA','System Design','Leadership'],
    resources: ['DSA','System Design','Operating Systems','Projects']
  },
  {
    name: 'Amazon',
    short_name: 'Amazon',
    overview: 'Amazon is a global technology leader focusing on e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence.',
    eligibility_rules: { minCgpa: 7.0, maxBacklogs: 0, branches: ['CSE','IT','CSBS','ECE'] },
    rounds: ['Online Assessment','Technical Coding','System Design & Problem Solving','Leadership Principles & Bar Raiser'],
    resources: ['Data Structures & Algorithms','Leadership Principles','OOP & Java','System Design']
  },
  {
    name: 'Microsoft',
    short_name: 'Microsoft',
    overview: 'Microsoft looks for developers who show strong fundamentals, product thinking, communication, and engineering ownership.',
    eligibility_rules: { minCgpa: 7.5, maxBacklogs: 0, branches: ['CSE','IT','CSBS','ECE'] },
    rounds: ['Aptitude','Coding','Technical','Managerial'],
    resources: ['Algorithms','DBMS','OOP','System Design']
  },
  {
    name: 'Adobe',
    short_name: 'Adobe',
    overview: 'Adobe is a creative technology company with hiring focus on problem solving, design sense, and software engineering excellence.',
    eligibility_rules: { minCgpa: 7.0, maxBacklogs: 1, branches: ['CSE','IT','CSBS','ECE'] },
    rounds: ['Coding','Technical','Product','HR'],
    resources: ['Data Structures','DBMS','OOP','Communication']
  }
];

const questions = [
  { topic: 'quant', question_text: 'If 20% of a number is 40, what is the number?', options: ['100','200','400','800'], correct_option: 1 },
  { topic: 'quant', question_text: 'The average of 5, 10, 15, and 20 is:', options: ['10','12.5','15','20'], correct_option: 1 },
  { topic: 'logical', question_text: 'If all engineers are coders and some coders are testers, which statement is definitely true?', options: ['All testers are engineers','Some engineers are testers','Some coders are engineers','No coders are engineers'], correct_option: 2 },
  { topic: 'verbal', question_text: 'Choose the synonym of CANDID:', options: ['Angry','Honest','Various','Formal'], correct_option: 1 },
  { topic: 'os', question_text: 'Which scheduling algorithm is preemptive?', options: ['FCFS','SJF','Round Robin','None'], correct_option: 2 },
  { topic: 'dbms', question_text: 'Which SQL keyword removes duplicate rows from results?', options: ['DISTINCT','UNIQUE','FILTER','REMOVE'], correct_option: 0 },
  { topic: 'cn', question_text: 'Which layer is responsible for end-to-end delivery?', options: ['Transport','Network','Application','Data Link'], correct_option: 0 },
  { topic: 'oop', question_text: 'Which principle hides implementation details?', options: ['Inheritance','Abstraction','Polymorphism','Encapsulation'], correct_option: 1 }
];

async function seed() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const adminId = crypto.randomUUID();
    const adminPass = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'pproadmin@123', 10);

    const [[existingAdmin]] = await connection.execute('SELECT id FROM users WHERE email = ?', [process.env.ADMIN_EMAIL || 'pproadmin@gmail.com']);
    if (!existingAdmin) {
      await connection.execute(
        'INSERT INTO users (id, fullName, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [adminId, 'Placement Officer', process.env.ADMIN_EMAIL || 'pproadmin@gmail.com', adminPass, 'admin']
      );
      await connection.execute('INSERT INTO admins (adm_id, designation, department) VALUES (?, ?, ?)', [adminId, 'Placement Officer', 'Training & Placement']);
    }

    for (const company of companies) {
      const id = crypto.randomUUID();
      const exists = await connection.execute('SELECT id FROM companies WHERE name = ?', [company.name]);
      if (exists[0].length === 0) {
        await connection.execute(
          'INSERT INTO companies (id, name, short_name, overview, eligibility_rules, rounds, resources) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, company.name, company.short_name, company.overview, JSON.stringify(company.eligibility_rules), JSON.stringify(company.rounds), JSON.stringify(company.resources)]
        );
      }
    }

    const [companyRows] = await connection.execute('SELECT id, name FROM companies');
    for (const row of companyRows) {
      const resourceCount = await connection.execute('SELECT COUNT(*) AS cnt FROM company_resources WHERE company_id = ?', [row.id]);
      if (resourceCount[0][0].cnt === 0) {
        await connection.execute(
          'INSERT INTO company_resources (id, company_id, title, type, content) VALUES (?, ?, ?, ?, ?)',
          [crypto.randomUUID(), row.id, `${row.name} Focus Areas`, 'topics', `Prepare ${row.name} aptitude, coding fundamentals, communication and resume readiness.`]
        );
      }
    }

    const [questionCount] = await connection.execute('SELECT COUNT(*) AS cnt FROM questions');
    if (questionCount[0].cnt === 0) {
      for (const q of questions) {
        await connection.execute(
          'INSERT INTO questions (id, exam_id, topic, question_text, options, correct_option, difficulty, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [crypto.randomUUID(), null, q.topic, q.question_text, JSON.stringify(q.options), q.correct_option, 'medium', 1]
        );
      }
    }

    await connection.commit();
    console.log('Seed completed successfully.');
  } catch (error) {
    await connection.rollback();
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    connection.release();
    await db.end();
  }
}

seed();
