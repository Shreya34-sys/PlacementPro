export interface AptitudeQuestion {
  id: number;
  section: 'Quantitative' | 'Logical Reasoning' | 'Verbal & Data' | 'CS Fundamentals';
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation: string;
  marks: number;
}

export const mockAptitudeTest = {
  id: 'apt-test-1',
  title: 'Comprehensive Campus Recruitment Aptitude Test',
  description: 'Full-length diagnostic assessment modeled after tier-1 tech company recruitment screening rounds.',
  totalTimeMinutes: 20,
  passingScore: 60,
  questions: [
    {
      id: 1,
      section: 'Quantitative',
      question: 'A train 240 meters long passes a telegraph pole in 24 seconds. What is the speed of the train in km/hr?',
      options: ['30 km/hr', '36 km/hr', '40 km/hr', '45 km/hr'],
      correctAnswer: 1,
      explanation: 'Speed = Distance / Time = 240 / 24 = 10 m/s. To convert m/s to km/hr, multiply by 18/5: 10 * (18/5) = 36 km/hr.',
      marks: 4,
    },
    {
      id: 2,
      section: 'Quantitative',
      question: 'Two pipes A and B can fill a tank in 20 minutes and 30 minutes respectively. If both pipes are opened together, how long will it take to fill the tank?',
      options: ['10 minutes', '12 minutes', '15 minutes', '18 minutes'],
      correctAnswer: 1,
      explanation: 'Work done by A in 1 min = 1/20. Work done by B in 1 min = 1/30. Combined work = 1/20 + 1/30 = 5/60 = 1/12. Therefore, tank fills in 12 minutes.',
      marks: 4,
    },
    {
      id: 3,
      section: 'Quantitative',
      question: 'A person invests $5,000 at a simple interest rate of 8% per annum. How much interest will accumulate after 3.5 years?',
      options: ['1,200', '1,400', '1,600', '1,750'],
      correctAnswer: 1,
      explanation: 'Simple Interest = (P * R * T) / 100 = (5000 * 8 * 3.5) / 100 = 1,400.',
      marks: 4,
    },
    {
      id: 4,
      section: 'Logical Reasoning',
      question: 'In a certain code language, "COMPUTER" is written as "RFUVQNPC". How is "MEDICINE" written in that same code language?',
      options: ['EOJDJEFM', 'EOJDEJFM', 'MFEJDJOE', 'MFEDJJEO'],
      correctAnswer: 0,
      explanation: 'Reverse the word letters and add 1 to each character position: MEDICINE -> ENICIDEM -> E(+0), N(+1=O), I(+1=J), C(+1=D), I(+1=J), D(+1=E), E(+1=F), M(+0=M) => EOJDJEFM.',
      marks: 4,
    },
    {
      id: 5,
      section: 'Logical Reasoning',
      question: 'Pointing to a photograph, a man said, "I have no brother or sister, but that man\'s father is my father\'s son." Whose photograph was it?',
      options: ['His own', 'His son\'s', 'His father\'s', 'His nephew\'s'],
      correctAnswer: 1,
      explanation: '"My father\'s son" = the man himself (since he has no siblings). So "that man\'s father" = the man himself. Thus, the photograph is of his son.',
      marks: 4,
    },
    {
      id: 6,
      section: 'Verbal & Data',
      question: 'Choose the word that is most nearly OPPOSITE in meaning to the word: "EPHEMERAL".',
      options: ['Transient', 'Eternal', 'Fleeting', 'Delicate'],
      correctAnswer: 1,
      explanation: 'Ephemeral means lasting for a very short time. The antonym is Eternal, meaning lasting forever.',
      marks: 4,
    },
    {
      id: 7,
      section: 'CS Fundamentals',
      question: 'Which of the following data structures operates on a Last In, First Out (LIFO) order?',
      options: ['Queue', 'Stack', 'Array', 'Linked List'],
      correctAnswer: 1,
      explanation: 'A Stack is a LIFO (Last In First Out) structure where elements added last are removed first.',
      marks: 4,
    },
    {
      id: 8,
      section: 'CS Fundamentals',
      question: 'What is the worst-case time complexity of QuickSort when bad pivot selection occurs?',
      options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
      correctAnswer: 3,
      explanation: 'In worst-case pivot scenarios (e.g. sorted input with last element chosen as pivot), QuickSort degrades to O(n²).',
      marks: 4,
    },
    {
      id: 9,
      section: 'Quantitative',
      question: 'If 15 men can complete a project in 20 days, how many days will 25 men take to complete the same project working at the same pace?',
      options: ['10 days', '12 days', '14 days', '16 days'],
      correctAnswer: 1,
      explanation: 'Total Man-Days = 15 * 20 = 300. Days required for 25 men = 300 / 25 = 12 days.',
      marks: 4,
    },
    {
      id: 10,
      section: 'Logical Reasoning',
      question: 'Find the next number in the series: 3, 7, 15, 31, 63, ?',
      options: ['95', '112', '127', '144'],
      correctAnswer: 2,
      explanation: 'Pattern: Each term = (Previous term * 2) + 1. 63 * 2 + 1 = 127.',
      marks: 4,
    }
  ] as AptitudeQuestion[]
};
