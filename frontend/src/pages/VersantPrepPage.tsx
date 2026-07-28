import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Tabs, Tab, Form, Accordion, Alert, Modal } from 'react-bootstrap';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface VocabularyCard {
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
  synonyms: string[];
}

const mockVocabulary: VocabularyCard[] = [
  {
    word: 'Consensus',
    pronunciation: '/kənˈsɛnsəs/',
    definition: 'A general agreement reached among members of a group.',
    example: 'The board reached a consensus on the new quarterly budget allocation.',
    synonyms: ['Agreement', 'Accord', 'Harmony', 'Unanimity']
  },
  {
    word: 'Mitigate',
    pronunciation: '/ˈmɪtɪɡeɪt/',
    definition: 'Make less severe, serious, or painful; diminish risk.',
    example: 'We implemented redundant backups to mitigate potential data loss risks.',
    synonyms: ['Alleviate', 'Reduce', 'Lessen', 'Softened']
  },
  {
    word: 'Benchmark',
    pronunciation: '/ˈbɛnʃmɑːk/',
    definition: 'A standard or point of reference against which things may be measured.',
    example: 'Our software performance passed the industry benchmark for throughput.',
    synonyms: ['Standard', 'Criterion', 'Yardstick', 'Gauge']
  },
  {
    word: 'Synergy',
    pronunciation: '/ˈsɪnədʒi/',
    definition: 'Combined action of group working together for greater total effect.',
    example: 'The merger created strong synergy between marketing and engineering teams.',
    synonyms: ['Teamwork', 'Collaboration', 'Union', 'Cooperation']
  }
];

export const VersantPrepPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Speaking & Audio States
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [speechScore, setSpeechScore] = useState<number | null>(null);

  // Repeat Sentence State
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const sentences = [
    'The project deadline has been extended to next Friday afternoon.',
    'Customer satisfaction metrics increased significantly over the fourth quarter.',
    'Please send the revised proposal to the financial director before five oclock.'
  ];

  // Listen & Answer State
  const [qIndex, setQIndex] = useState(0);
  const listenQuestions = [
    { question: 'What tool do we use to write on a white board?', answer: 'Marker' },
    { question: 'If a meeting starts at 2:00 PM and lasts 45 minutes, what time does it end?', answer: '2:45 PM' },
    { question: 'Which department handles hiring and employee onboarding?', answer: 'Human Resources' }
  ];
  const [userAnswerText, setUserAnswerText] = useState('');
  const [answerResult, setAnswerResult] = useState<'correct' | 'incorrect' | null>(null);

  // Vocabulary Index
  const [vocabIndex, setVocabIndex] = useState(0);

  // Grammar Exercise State
  const [grammarAnswers, setGrammarAnswers] = useState<Record<number, string>>({});
  const [grammarSubmitted, setGrammarSubmitted] = useState(false);

  // Mock Test State
  const [isMockRunning, setIsMockRunning] = useState(false);
  const [mockTimeLeft, setMockTimeLeft] = useState(600); // 10 mins
  const [mockCompleted, setMockCompleted] = useState(false);

  // Radar Data for AI Communication Score
  const radarData = [
    { subject: 'Pronunciation', score: 82, fullMark: 100 },
    { subject: 'Fluency', score: 78, fullMark: 100 },
    { subject: 'Vocabulary', score: 85, fullMark: 100 },
    { subject: 'Grammar', score: 88, fullMark: 100 },
    { subject: 'Listening Comp', score: 90, fullMark: 100 }
  ];

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis is not supported in your browser.');
    }
  };

  const handleSimulateRecording = () => {
    setIsRecording(true);
    setSpeechScore(null);
    setRecordedText('Listening to your spoken response...');

    setTimeout(() => {
      setIsRecording(false);
      setRecordedText('Response recorded: "The project deadline has been extended to next Friday afternoon."');
      setSpeechScore(88); // Calculated score
    }, 3000);
  };

  const handleCheckListenAnswer = () => {
    const currentAns = listenQuestions[qIndex].answer.toLowerCase();
    if (userAnswerText.trim().toLowerCase().includes(currentAns)) {
      setAnswerResult('correct');
    } else {
      setAnswerResult('incorrect');
    }
  };

  // Mock Timer
  useEffect(() => {
    let timer: any;
    if (isMockRunning && mockTimeLeft > 0) {
      timer = setInterval(() => {
        setMockTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (mockTimeLeft === 0 && isMockRunning) {
      setIsMockRunning(false);
      setMockCompleted(true);
    }
    return () => clearInterval(timer);
  }, [isMockRunning, mockTimeLeft]);

  return (
    <Container fluid className="px-0">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-mic-fill text-primary"></i> Versant English Speaking & Communication Portal
          </h3>
          <p className="text-muted mb-0 fs-7">
            Prepare for MNC Versant spoken English tests with AI phonetics, speech fluency analysis, and full mock simulations.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Badge bg="success-subtle" text="success" className="px-3 py-2 fs-7 fw-semibold border border-success-subtle">
            <i className="bi bi-shield-check me-1"></i> Versant Grade: 78 / 80 (C1 Advanced)
          </Badge>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'overview')}
        className="mb-4 nav-tabs-custom"
      >
        <Tab eventKey="overview" title="AI Communication Dashboard" />
        <Tab eventKey="speaking" title="Versant Speaking Modules" />
        <Tab eventKey="fluency" title="Fluency & Pronunciation" />
        <Tab eventKey="language" title="Vocabulary & Grammar" />
        <Tab eventKey="mock-test" title="Full Mock Versant Test" />
      </Tabs>

      {/* TAB 1: OVERVIEW & AI COMMUNICATION SCORE */}
      {activeTab === 'overview' && (
        <Row className="g-4">
          <Col lg={5}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3 fw-bold fs-6 border-bottom d-flex justify-content-between align-items-center">
                <span><i className="bi bi-radar text-primary me-2"></i>AI Versant Skill Assessment</span>
                <Badge bg="primary">CEFR Level C1</Badge>
              </Card.Header>
              <Card.Body className="p-4 d-flex flex-column align-items-center justify-content-center">
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#4b5563' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Student" dataKey="score" stroke="#0d6efd" fill="#0d6efd" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-light rounded p-3 w-100 border text-center mt-2">
                  <div className="row g-2">
                    <div className="col-6 border-end">
                      <small className="text-muted d-block fs-8">Overall Versant Score</small>
                      <strong className="fs-5 text-primary">78 / 80</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block fs-8">Pronunciation Accuracy</small>
                      <strong className="fs-5 text-success">82%</strong>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={7}>
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Card className="shadow-sm border-0 h-100 border-start border-4 border-primary">
                  <Card.Body className="p-3.5">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted fs-8 fw-bold text-uppercase">Reading Aloud Pace</span>
                      <Badge bg="primary-subtle" text="primary">145 WPM</Badge>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Optimal Speech Rate</h5>
                    <p className="text-muted fs-8 mb-2">Your cadence matches international corporate standards without unnatural pauses.</p>
                    <ProgressBar now={85} variant="primary" style={{ height: '6px' }} />
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="shadow-sm border-0 h-100 border-start border-4 border-success">
                  <Card.Body className="p-3.5">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted fs-8 fw-bold text-uppercase">Grammar Accuracy</span>
                      <Badge bg="success-subtle" text="success">88% Correct</Badge>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Strong Tense Consistency</h5>
                    <p className="text-muted fs-8 mb-2">Minimal subject-verb agreement errors in spontaneous speech responses.</p>
                    <ProgressBar now={88} variant="success" style={{ height: '6px' }} />
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white py-3 fw-bold fs-6">
                <i className="bi bi-lightbulb text-warning me-2"></i> Targeted Improvement Suggestions
              </Card.Header>
              <Card.Body className="p-4">
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                  <li className="d-flex gap-3 align-items-start">
                    <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-2 fs-6">
                      <i className="bi bi-mic"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-1">Reduce Filler Words in Story Retelling</h6>
                      <p className="text-muted fs-8 mb-0">
                        You used "um" 4 times during the 45-second story summary. Practice silent pauses instead of verbal fillers.
                      </p>
                    </div>
                  </li>

                  <li className="d-flex gap-3 align-items-start border-top pt-3">
                    <div className="bg-info bg-opacity-10 text-info rounded-circle p-2 fs-6">
                      <i className="bi bi-spellcheck"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-1">Stress Patterns in Polysyllabic Corporate Terms</h6>
                      <p className="text-muted fs-8 mb-0">
                        Focus on stress syllables for words like "<em>CON-sen-sus</em>" and "<em>MI-ti-gate</em>".
                      </p>
                    </div>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* TAB 2: SPEAKING MODULES (Reading Aloud, Repeat Sentence, Listen & Answer, Story Retelling) */}
      {activeTab === 'speaking' && (
        <Row className="g-4">
          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3 fw-bold fs-6 border-bottom d-flex justify-content-between align-items-center">
                <span><i className="bi bi-book-half text-primary me-2"></i>Part A: Reading Aloud</span>
                <Badge bg="secondary">10 Prompt Cards</Badge>
              </Card.Header>
              <Card.Body className="p-4 d-flex flex-column">
                <p className="text-muted fs-8">
                  Read the paragraph displayed below clearly into your microphone when the prompt turns green. Maintain natural intonation.
                </p>

                <div className="bg-light p-4 rounded border mb-4 text-dark fs-7 lh-lg fw-medium">
                  "Effective corporate communication relies on clarity, active listening, and concise phrasing. When presenting project updates to stakeholders, focus on key milestones and actionable outcomes."
                </div>

                <div className="mt-auto d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    className="fw-bold fs-8 w-100 py-2"
                    onClick={() => handleTextToSpeech("Effective corporate communication relies on clarity, active listening, and concise phrasing.")}
                    disabled={isPlayingAudio}
                  >
                    <i className="bi bi-volume-up-fill me-1"></i> {isPlayingAudio ? 'Playing Sample...' : 'Listen Sample Voice'}
                  </Button>

                  <Button
                    variant={isRecording ? 'danger' : 'success'}
                    className="fw-bold fs-8 w-100 py-2"
                    onClick={handleSimulateRecording}
                  >
                    <i className={`bi ${isRecording ? 'bi-stop-fill' : 'bi-mic-fill'} me-1`}></i>
                    {isRecording ? 'Recording (Speaking)...' : 'Start Reading Aloud'}
                  </Button>
                </div>

                {recordedText && (
                  <Alert variant="info" className="mt-3 mb-0 fs-8 p-2.5">
                    <strong>AI Speech Engine:</strong> {recordedText}
                    {speechScore !== null && (
                      <div className="mt-1 fw-bold text-success">
                        Pronunciation Score: {speechScore}% | Intonation: Excellent
                      </div>
                    )}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3 fw-bold fs-6 border-bottom d-flex justify-content-between align-items-center">
                <span><i className="bi bi-arrow-repeat text-info me-2"></i>Part B: Repeat Sentence</span>
                <Badge bg="info-subtle" text="info">Sentence {sentenceIndex + 1} of {sentences.length}</Badge>
              </Card.Header>
              <Card.Body className="p-4 d-flex flex-column">
                <p className="text-muted fs-8">
                  Listen to the audio sentence, then repeat it verbatim into your mic. Do not alter words or sequence.
                </p>

                <div className="bg-info bg-opacity-10 p-4 rounded border border-info-subtle text-center mb-4">
                  <i className="bi bi-soundwave display-4 text-info d-block mb-2"></i>
                  <p className="fw-semibold text-dark fs-7 mb-3">"{sentences[sentenceIndex]}"</p>
                  <Button
                    variant="info"
                    size="sm"
                    className="fw-bold px-3 py-1.5 text-white"
                    onClick={() => handleTextToSpeech(sentences[sentenceIndex])}
                  >
                    <i className="bi bi-play-fill me-1"></i> Play Audio Sentence
                  </Button>
                </div>

                <div className="mt-auto d-flex justify-content-between align-items-center gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={sentenceIndex === 0}
                    onClick={() => setSentenceIndex((prev) => prev - 1)}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    className="fw-bold px-4"
                    onClick={handleSimulateRecording}
                  >
                    <i className="bi bi-mic-fill me-1"></i> Repeat Sentence
                  </Button>

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={sentenceIndex === sentences.length - 1}
                    onClick={() => setSentenceIndex((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={12}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white py-3 fw-bold fs-6 border-bottom">
                <i className="bi bi-chat-quote text-success me-2"></i>Part C & D: Listen & Answer + Story Retelling
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-4">
                  <Col md={6} className="border-end">
                    <h6 className="fw-bold text-dark mb-2">Listen & Answer Question</h6>
                    <p className="text-muted fs-8 mb-3">
                      Listen to the simple question and type or state the answer concisely.
                    </p>

                    <div className="bg-light p-3 rounded border mb-3">
                      <div className="fw-semibold text-dark mb-2">
                        <i className="bi bi-question-circle text-primary me-2"></i>
                        {listenQuestions[qIndex].question}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder="Type answer or speak..."
                        value={userAnswerText}
                        onChange={(e) => {
                          setUserAnswerText(e.target.value);
                          setAnswerResult(null);
                        }}
                      />
                    </div>

                    <div className="d-flex gap-2">
                      <Button variant="success" size="sm" className="fw-bold px-3" onClick={handleCheckListenAnswer}>
                        Submit Answer
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setQIndex((prev) => (prev + 1) % listenQuestions.length);
                          setUserAnswerText('');
                          setAnswerResult(null);
                        }}
                      >
                        Next Question
                      </Button>
                    </div>

                    {answerResult && (
                      <Alert variant={answerResult === 'correct' ? 'success' : 'danger'} className="mt-3 mb-0 fs-8 p-2">
                        {answerResult === 'correct' ? '✓ Correct Answer!' : `✗ Incorrect. Expected: ${listenQuestions[qIndex].answer}`}
                      </Alert>
                    )}
                  </Col>

                  <Col md={6}>
                    <h6 className="fw-bold text-dark mb-2">Story Retelling Practice</h6>
                    <p className="text-muted fs-8 mb-2">
                      Listen to a 30-second audio story, then summarize key characters, problem, and outcome in 45 seconds.
                    </p>

                    <Alert variant="warning" className="fs-8 mb-3">
                      <strong>Sample Story:</strong> "Sarah leads a software development team that was behind schedule due to server outages. She reorganized priorities, conducted daily standups, and successfully delivered the project on time."
                    </Alert>

                    <Button variant="outline-dark" size="sm" className="fw-bold w-100" onClick={handleSimulateRecording}>
                      <i className="bi bi-mic-fill text-danger me-1"></i> Record 45s Story Retelling
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* TAB 3: FLUENCY & PRONUNCIATION */}
      {activeTab === 'fluency' && (
        <Row className="g-4">
          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3 fw-bold fs-6">
                <i className="bi bi-translate text-primary me-2"></i> Phonetic Pronunciation Practice
              </Card.Header>
              <Card.Body className="p-4">
                <p className="text-muted fs-8">
                  Practice tricky corporate vocabulary and check your phonetic stress accuracy.
                </p>

                <div className="list-group list-group-flush">
                  {[
                    { word: 'Hierarchy', phonetic: '/ˈhaɪərɑːki/', difficulty: 'Hard' },
                    { word: 'Entrepreneur', phonetic: '/ˌɒntrəprəˈnɜː/', difficulty: 'Hard' },
                    { word: 'Subtle', phonetic: '/ˈsʌt.əl/', difficulty: 'Medium' },
                    { word: 'Anonymity', phonetic: '/ˌæn.əˈnɪm.ə.ti/', difficulty: 'Medium' }
                  ].map((item, idx) => (
                    <div key={idx} className="list-group-item d-flex align-items-center justify-content-between px-0 py-3">
                      <div>
                        <h6 className="fw-bold text-dark mb-0">{item.word}</h6>
                        <small className="text-primary font-monospace">{item.phonetic}</small>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={item.difficulty === 'Hard' ? 'danger-subtle' : 'warning-subtle'} text={item.difficulty === 'Hard' ? 'danger' : 'warning'}>
                          {item.difficulty}
                        </Badge>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-circle p-1"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => handleTextToSpeech(item.word)}
                        >
                          <i className="bi bi-volume-up-fill"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3 fw-bold fs-6">
                <i className="bi bi-speedometer2 text-success me-2"></i> Real-time Speech Cadence & Pause Monitor
              </Card.Header>
              <Card.Body className="p-4">
                <p className="text-muted fs-8">
                  Fluency is evaluated by continuous speech without frequent filler words or long silence gaps.
                </p>

                <div className="bg-light p-3.5 rounded border mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold fs-8">Words Per Minute (WPM) Target</span>
                    <span className="fw-extrabold text-success fs-7">135-150 WPM</span>
                  </div>
                  <ProgressBar now={75} variant="success" style={{ height: '8px' }} className="mb-3" />

                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold fs-8">Filler Words ("Um", "Uh", "Like")</span>
                    <span className="fw-extrabold text-warning fs-7">2 detected (Low)</span>
                  </div>
                  <ProgressBar now={25} variant="warning" style={{ height: '8px' }} />
                </div>

                <div className="p-3 border rounded bg-white">
                  <h6 className="fw-bold text-dark fs-8 mb-2">Pro Tip for Versant Speaking</h6>
                  <p className="text-muted fs-8 mb-0">
                    Never rush your words to sound faster. Versant speech recognition engines score clear articulation and steady rhythm higher than hasty speech.
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* TAB 4: VOCABULARY & GRAMMAR */}
      {activeTab === 'language' && (
        <Row className="g-4">
          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3 fw-bold fs-6 d-flex justify-content-between align-items-center">
                <span><i className="bi bi-journal-bookmark text-primary me-2"></i>Corporate Vocabulary Builder</span>
                <Badge bg="primary">{vocabIndex + 1} of {mockVocabulary.length}</Badge>
              </Card.Header>
              <Card.Body className="p-4 d-flex flex-column">
                <div className="bg-light p-4 rounded border mb-4 text-center">
                  <h3 className="fw-extrabold text-primary mb-1">{mockVocabulary[vocabIndex].word}</h3>
                  <small className="text-muted font-monospace d-block mb-3">{mockVocabulary[vocabIndex].pronunciation}</small>
                  
                  <p className="fw-semibold text-dark fs-7 mb-2">{mockVocabulary[vocabIndex].definition}</p>
                  <p className="text-secondary fs-8 italic mb-3">"{mockVocabulary[vocabIndex].example}"</p>

                  <div className="d-flex flex-wrap justify-content-center gap-1.5">
                    {mockVocabulary[vocabIndex].synonyms.map((s, i) => (
                      <Badge key={i} bg="secondary" className="px-2 py-1 fs-8">{s}</Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={vocabIndex === 0}
                    onClick={() => setVocabIndex((prev) => prev - 1)}
                  >
                    Previous Word
                  </Button>

                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleTextToSpeech(mockVocabulary[vocabIndex].word)}
                  >
                    <i className="bi bi-volume-up-fill me-1"></i> Pronounce
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={vocabIndex === mockVocabulary.length - 1}
                    onClick={() => setVocabIndex((prev) => prev + 1)}
                  >
                    Next Word
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white py-3 fw-bold fs-6">
                <i className="bi bi-pencil-square text-success me-2"></i> Versant Grammar & Error Spotting
              </Card.Header>
              <Card.Body className="p-4">
                <p className="text-muted fs-8 mb-3">
                  Identify the grammatical error in the corporate scenarios below:
                </p>

                <Accordion defaultActiveKey="0" className="fs-8">
                  <Accordion.Item eventKey="0" className="mb-2 border rounded">
                    <Accordion.Header>1. Subject-Verb Agreement in Reports</Accordion.Header>
                    <Accordion.Body>
                      <p className="fw-semibold text-dark mb-2">"The summary of quarterly financial results <u>were</u> submitted to the board yesterday."</p>
                      <Alert variant="danger" className="py-1.5 px-2 mb-0 fs-8">
                        <strong>Correction:</strong> Change 'were' to <strong>'was'</strong> because the subject is 'summary' (singular).
                      </Alert>
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey="1" className="mb-2 border rounded">
                    <Accordion.Header>2. Tense Parallelism in Presentations</Accordion.Header>
                    <Accordion.Body>
                      <p className="fw-semibold text-dark mb-2">"She analyzed the client data, prepared the slides, and <u>presents</u> the findings."</p>
                      <Alert variant="danger" className="py-1.5 px-2 mb-0 fs-8">
                        <strong>Correction:</strong> Change 'presents' to <strong>'presented'</strong> to maintain past tense consistency.
                      </Alert>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* TAB 5: FULL MOCK VERSANT TEST */}
      {activeTab === 'mock-test' && (
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-dark text-white py-3 d-flex justify-content-between align-items-center">
            <span className="fw-bold fs-6"><i className="bi bi-clock-history me-2 text-warning"></i>Proctored Versant Full Test Simulation</span>
            <Badge bg="warning" text="dark" className="fs-7">Timed Assessment</Badge>
          </Card.Header>
          <Card.Body className="p-4 text-center">
            {!isMockRunning && !mockCompleted ? (
              <div className="max-w-2xl mx-auto py-4">
                <i className="bi bi-mic-fill display-1 text-primary d-block mb-3"></i>
                <h4 className="fw-bold text-dark mb-2">Ready to Start Mock Versant Test?</h4>
                <p className="text-muted fs-7 mb-4">
                  This 10-minute simulation includes Reading Aloud, Sentence Repeat, Conversational Answers, and Passage Summarization. Ensure your microphone is working and you are in a quiet room.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  className="fw-bold px-5 py-2.5 shadow"
                  onClick={() => setIsMockRunning(true)}
                >
                  <i className="bi bi-play-circle-fill me-2"></i> Start Versant Test Simulation
                </Button>
              </div>
            ) : isMockRunning ? (
              <div className="max-w-2xl mx-auto py-3">
                <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded mb-4 border">
                  <span className="fw-bold text-dark">Part A: Reading Aloud Prompt 1/4</span>
                  <span className="fw-extrabold text-danger font-monospace fs-5">
                    {Math.floor(mockTimeLeft / 60)}:{(mockTimeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="bg-white p-4 rounded border shadow-sm mb-4 text-start">
                  <h6 className="fw-bold text-dark mb-2">Read the text aloud:</h6>
                  <p className="fs-6 text-dark lh-base">
                    "Innovation in software engineering requires standardizing test automation frameworks while maintaining high velocity in continuous deployment pipelines."
                  </p>
                </div>

                <Button variant="danger" size="lg" className="fw-bold px-4" onClick={handleSimulateRecording}>
                  <i className="bi bi-record-circle me-2"></i> Recording Spoken Answer...
                </Button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto py-4 text-center">
                <i className="bi bi-trophy-fill display-2 text-warning d-block mb-3"></i>
                <h3 className="fw-extrabold text-dark mb-2">Mock Test Completed!</h3>
                <h2 className="fw-extrabold text-primary mb-3">Versant Grade: 78 / 80</h2>
                <Alert variant="success" className="fs-7 max-w-lg mx-auto mb-4">
                  Outstanding performance! Your pronunciation score is in the 90th percentile for campus hiring.
                </Alert>
                <Button variant="outline-primary" className="fw-bold px-4" onClick={() => { setMockCompleted(false); setMockTimeLeft(600); }}>
                  Retake Mock Test
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};
