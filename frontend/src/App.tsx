import { useEffect, useState } from 'react';

type Question = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  points: number;
};

type Terminal = 'batteryPlus' | 'switchIn' | 'switchOut' | 'lampPlus' | 'lampMinus' | 'batteryMinus';
type WireColor = 'Red' | 'Blue' | 'Black';
type Connection = { from: Terminal; to: Terminal; color: WireColor };

const questions: Question[] = [
  { id: 'EL-MCQ-001', question: 'What is the SI unit of electrical current?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], answer: 'Ampere', explanation: 'Ampere (A) is the SI unit of electric current.', points: 1 },
  { id: 'EL-MCQ-002', question: 'Which instrument is used to measure electrical current?', options: ['Voltmeter', 'Ammeter', 'Ohmmeter', 'Wattmeter'], answer: 'Ammeter', explanation: 'An ammeter is used to measure electrical current.', points: 1 },
  { id: 'EL-MCQ-003', question: 'According to Ohm’s law, which equation is correct?', options: ['V = I × R', 'P = V × I', 'R = V × I', 'I = V × R'], answer: 'V = I × R', explanation: 'Ohm’s law states that voltage equals current multiplied by resistance.', points: 1 },
  { id: 'EL-MCQ-004', question: 'What is the SI unit of electrical resistance?', options: ['Ampere', 'Volt', 'Ohm', 'Watt'], answer: 'Ohm', explanation: 'Ohm (Ω) is the SI unit of electrical resistance.', points: 1 },
  { id: 'EL-MCQ-005', question: 'What is the primary purpose of a fuse?', options: ['Increase voltage', 'Protect against excessive current', 'Store electrical energy', 'Measure current'], answer: 'Protect against excessive current', explanation: 'A fuse protects a circuit by opening the circuit when excessive current flows.', points: 1 },
  { id: 'EL-MCQ-006', question: 'What happens to total resistance when resistors are connected in series?', options: ['It is the sum of the resistances', 'It becomes zero', 'It equals the smallest resistor', 'It equals the largest resistor'], answer: 'It is the sum of the resistances', explanation: 'For series resistors, total resistance is R₁ + R₂ + R₃ and so on.', points: 1 },
  { id: 'EL-MCQ-007', question: 'Which type of current periodically changes direction?', options: ['Direct current', 'Alternating current', 'Static current', 'Leakage current'], answer: 'Alternating current', explanation: 'Alternating current (AC) periodically reverses direction.', points: 1 },
  { id: 'EL-MCQ-008', question: 'What is the SI unit of electrical power?', options: ['Watt', 'Ohm', 'Coulomb', 'Ampere'], answer: 'Watt', explanation: 'Watt (W) is the SI unit of power.', points: 1 },
  { id: 'EL-MCQ-009', question: 'In an ideal parallel circuit, what is common across each branch?', options: ['Voltage', 'Resistance', 'Power', 'Energy'], answer: 'Voltage', explanation: 'Parallel branches are connected across the same two nodes, so their voltage is the same.', points: 1 },
  { id: 'EL-MCQ-010', question: 'Which device is commonly used to open or close an electrical circuit?', options: ['Transformer', 'Switch', 'Resistor', 'Capacitor'], answer: 'Switch', explanation: 'A switch is designed to open or close an electrical circuit.', points: 1 },
];

const expectedConnections: Connection[] = [
  { from: 'batteryPlus', to: 'switchIn', color: 'Red' },
  { from: 'switchOut', to: 'lampPlus', color: 'Blue' },
  { from: 'lampMinus', to: 'batteryMinus', color: 'Black' },
];

const terminalLabels: Record<Terminal, string> = {
  batteryPlus: 'Battery +', switchIn: 'Switch IN', switchOut: 'Switch OUT', lampPlus: 'Lamp +', lampMinus: 'Lamp −', batteryMinus: 'Battery −',
};

const wireHex: Record<WireColor, string> = { Red: '#ef4444', Blue: '#2563eb', Black: '#111827' };

export default function App() {
  const [started, setStarted] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(10 * 60);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedColor, setSelectedColor] = useState<WireColor>('Red');
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  const [activityMessage, setActivityMessage] = useState('Select a wire colour, then connect two terminals.');

  useEffect(() => {
    if (!started || showActivity || finished) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setShowActivity(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, showActivity, finished]);

  const question = questions[index];
  const quizScore = questions.reduce((total, item) => total + (answers[item.id] === item.answer ? item.points : 0), 0);
  const quizMaxScore = questions.reduce((total, item) => total + item.points, 0);

  const selectAnswer = (answer: string) => setAnswers((current) => ({ ...current, [question.id]: answer }));

  const submitQuiz = () => setShowActivity(true);

  const reset = () => {
    setStarted(false); setShowActivity(false); setFinished(false); setIndex(0); setAnswers({}); setRemaining(10 * 60);
    setConnections([]); setSelectedColor('Red'); setSelectedTerminal(null); setActivityMessage('Select a wire colour, then connect two terminals.');
  };

  const completeActivity = () => {
    setFinished(true);
  };

  if (!started) return <Start onStart={() => setStarted(true)} />;
  if (showActivity && !finished) return <TechnicalActivity connections={connections} setConnections={setConnections} selectedColor={selectedColor} setSelectedColor={setSelectedColor} selectedTerminal={selectedTerminal} setSelectedTerminal={setSelectedTerminal} message={activityMessage} setMessage={setActivityMessage} onComplete={completeActivity} />;
  if (finished) return <Result score={quizScore} maxScore={quizMaxScore} technicalScore={connections.length} reset={reset} />;

  const answered = Boolean(answers[question.id]);
  const progress = ((index + 1) / questions.length) * 100;
  const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
  const seconds = (remaining % 60).toString().padStart(2, '0');

  return (
    <div className="app">
      <header className="top">
        <div><div className="eyebrow">ELECTRICAL • NEW ENTRY WORKER</div><h2>Electrical Competency Quiz</h2></div>
        <div className="timer"><small>TIME REMAINING</small><b>{minutes}:{seconds}</b></div>
      </header>
      <div className="progress"><span style={{ width: `${progress}%` }} /></div>
      <main className="layout">
        <section className="question">
          <div className="qmeta"><span>Question {index + 1} / {questions.length}</span><span>MCQ</span><strong>{question.points} point</strong></div>
          <h1>{question.question}</h1>
          <div className="options">
            {question.options.map((option, optionIndex) => (
              <button key={option} className={answers[question.id] === option ? 'selected' : ''} onClick={() => selectAnswer(option)}>
                <i>{String.fromCharCode(65 + optionIndex)}</i>{option}
              </button>
            ))}
          </div>
          <div className="nav">
            <button disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>← Previous</button>
            <button className="primary" disabled={!answered} onClick={() => index === questions.length - 1 ? submitQuiz() : setIndex((value) => value + 1)}>{index === questions.length - 1 ? 'Continue to technical activity →' : 'Next question →'}</button>
          </div>
        </section>
        <aside>
          <div className="sidecard"><b>Quiz Questions</b>{questions.map((item, itemIndex) => <button key={item.id} className={itemIndex === index ? 'active' : ''} onClick={() => setIndex(itemIndex)}><span>{itemIndex + 1}</span>Electrical MCQ<em>{answers[item.id] ? '✓' : ''}</em></button>)}</div>
          <div className="sidecard tip"><b>Assessment stages</b><p>Stage 1 — Electrical fundamentals MCQ</p><p>Stage 2 — Practical circuit validation</p></div>
        </aside>
      </main>
    </div>
  );
}

function Start({ onStart }: { onStart: () => void }) {
  return <div className="start"><div className="startcard"><div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div><h1>Electrical Fundamentals<br /><span>Competency Assessment</span></h1><p>Test electrical knowledge and validate practical circuit-building skills through an interactive browser simulation.</p><div className="stats"><div><b>10</b><small>MCQ questions</small></div><div><b>3</b><small>circuit connections</small></div><div><b>10:00</b><small>MCQ time limit</small></div></div><button className="primary big" onClick={onStart}>Start assessment →</button><small className="offline">● Runs locally in the browser • no API required</small></div></div>;
}

function TechnicalActivity({ connections, setConnections, selectedColor, setSelectedColor, selectedTerminal, setSelectedTerminal, message, setMessage, onComplete }: { connections: Connection[]; setConnections: React.Dispatch<React.SetStateAction<Connection[]>>; selectedColor: WireColor; setSelectedColor: (value: WireColor) => void; selectedTerminal: Terminal | null; setSelectedTerminal: (value: Terminal | null) => void; message: string; setMessage: (value: string) => void; onComplete: () => void }) {
  const handleTerminal = (terminal: Terminal) => {
    if (!selectedTerminal) {
      setSelectedTerminal(terminal);
      setMessage(`${terminalLabels[terminal]} selected. Now select the other terminal.`);
      return;
    }
    if (selectedTerminal === terminal) {
      setSelectedTerminal(null);
      setMessage('Choose two different terminals.');
      return;
    }
    const match = expectedConnections.find((item) => (item.from === selectedTerminal && item.to === terminal) || (item.from === terminal && item.to === selectedTerminal));
    if (!match) {
      setSelectedTerminal(null);
      setMessage('❌ Incorrect connection. Check the circuit path and try again.');
      return;
    }
    if (connections.some((item) => (item.from === match.from && item.to === match.to) || (item.from === match.to && item.to === match.from))) {
      setSelectedTerminal(null);
      setMessage('This connection is already completed.');
      return;
    }
    if (selectedColor !== match.color) {
      setSelectedTerminal(null);
      setMessage(`❌ Wrong wire colour. ${terminalLabels[match.from]} → ${terminalLabels[match.to]} requires ${match.color}.`);
      return;
    }
    const next = [...connections, match];
    setConnections(next);
    setSelectedTerminal(null);
    setMessage(next.length === expectedConnections.length ? '🟢 Circuit complete! All connections and wire colours are correct.' : '✓ Correct connection. Continue with the remaining terminals.');
  };

  const isComplete = connections.length === expectedConnections.length;
  const connectionLine = (connection: Connection) => {
    const positions: Record<Terminal, [number, number]> = { batteryPlus: [90, 110], switchIn: [250, 110], switchOut: [370, 110], lampPlus: [530, 110], lampMinus: [530, 250], batteryMinus: [90, 250] };
    const [x1, y1] = positions[connection.from]; const [x2, y2] = positions[connection.to];
    return <line key={`${connection.from}-${connection.to}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={wireHex[connection.color]} strokeWidth="8" strokeLinecap="round" />;
  };

  return <div style={{ minHeight: '100vh', background: '#f7f8fa', padding: '40px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}><div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>STAGE 2 • PRACTICAL VALIDATION</div><h1 style={{ fontSize: 40, margin: '8px 0' }}>Build the <span style={{ color: '#2563eb' }}>Circuit</span></h1><p style={{ color: '#667085', fontSize: 17 }}>Select a wire colour and connect the correct terminals. The system validates both the connection and the wire colour.</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <section style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 20, padding: 24, boxShadow: '0 8px 30px rgba(16,24,40,.06)' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>{(['Red','Blue','Black'] as WireColor[]).map((color) => <button key={color} onClick={() => { setSelectedColor(color); setMessage(`${color} wire selected.`); }} style={{ border: selectedColor === color ? `3px solid ${wireHex[color]}` : '1px solid #d0d5dd', borderRadius: 12, padding: '10px 18px', background: '#fff', fontWeight: 700, cursor: 'pointer' }}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: wireHex[color], marginRight: 8 }} />{color} wire</button>)}</div>
          <div style={{ background: '#f9fafb', borderRadius: 16, padding: 16, overflowX: 'auto' }}>
            <svg viewBox="0 0 620 360" width="100%" style={{ minWidth: 620, display: 'block' }}>
              {connections.map(connectionLine)}
              <rect x="35" y="70" width="110" height="220" rx="18" fill="#fff" stroke="#98a2b3" strokeWidth="2"/><text x="90" y="165" textAnchor="middle" fontSize="18" fontWeight="700">BATTERY</text><text x="90" y="190" textAnchor="middle" fontSize="14">DC source</text>
              <rect x="215" y="75" width="170" height="70" rx="16" fill="#fff" stroke="#98a2b3" strokeWidth="2"/><text x="300" y="117" textAnchor="middle" fontSize="18" fontWeight="700">SWITCH</text>
              <rect x="485" y="75" width="90" height="70" rx="16" fill="#fff" stroke="#98a2b3" strokeWidth="2"/><text x="530" y="117" textAnchor="middle" fontSize="18" fontWeight="700">LAMP</text>
              {(['batteryPlus','switchIn','switchOut','lampPlus','lampMinus','batteryMinus'] as Terminal[]).map((terminal) => { const positions: Record<Terminal,[number,number]> = { batteryPlus:[90,110], switchIn:[250,110], switchOut:[370,110], lampPlus:[530,110], lampMinus:[530,250], batteryMinus:[90,250] }; const [cx,cy]=positions[terminal]; const active=selectedTerminal===terminal; return <g key={terminal} onClick={() => handleTerminal(terminal)} style={{ cursor:'pointer' }}><circle cx={cx} cy={cy} r={active?13:10} fill={active?'#2563eb':'#fff'} stroke={active?'#2563eb':'#667085'} strokeWidth="4"/><text x={cx} y={cy-20} textAnchor="middle" fontSize="12" fontWeight="700">{terminalLabels[terminal]}</text></g>; })}
            </svg>
          </div>
          <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: isComplete ? '#ecfdf3' : '#f2f4f7', color: isComplete ? '#027a48' : '#344054', fontWeight: 700 }}>{message}</div>
          {isComplete && <button className="primary big" style={{ marginTop: 18 }} onClick={onComplete}>Finish technical activity →</button>}
        </section>
        <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div style={{ background:'#fff', border:'1px solid #e4e7ec', borderRadius:16, padding:20 }}><b>Required connections</b>{expectedConnections.map((item, i) => { const done=connections.some((c)=>(c.from===item.from&&c.to===item.to)||(c.from===item.to&&c.to===item.from)); return <div key={i} style={{ padding:'14px 0', borderBottom:'1px solid #eaecf0', fontSize:13 }}><strong>{i+1}. {terminalLabels[item.from]} → {terminalLabels[item.to]}</strong><div style={{ marginTop:5, color:wireHex[item.color], fontWeight:700 }}>{item.color} wire {done ? '✓' : '• pending'}</div></div>; })}</div>
          <div style={{ background:'#fff', border:'1px solid #e4e7ec', borderRadius:16, padding:20 }}><b>Validation</b><p style={{ color:'#667085', lineHeight:1.6 }}>Each connection must match the required terminals and the correct wire colour. Incorrect attempts do not add to the score.</p><strong>{connections.length} / {expectedConnections.length} connections correct</strong></div>
        </aside>
      </div>
    </div>
  </div>;
}

function Result({ score, maxScore, technicalScore, reset }: { score: number; maxScore: number; technicalScore: number; reset: () => void }) {
  const total = score + technicalScore;
  const max = maxScore + expectedConnections.length;
  const percentage = Math.round((total / max) * 100);
  const level = percentage >= 85 ? 'Advanced' : percentage >= 70 ? 'Proficient' : percentage >= 50 ? 'Developing' : 'Needs Training';
  return <div className="resultpage"><div className="resultcard"><div className="eyebrow">ASSESSMENT COMPLETE</div><h1>Your Electrical<br /><span>Competency Result</span></h1><div className="score"><b>{percentage}%</b><small>{total} / {max} points</small></div><div className="resultgrid"><div><b>MCQ score</b><strong>{score} / {maxScore}</strong></div><div><b>Technical activity</b><strong>{technicalScore} / {expectedConnections.length}</strong></div><div><b>Competency level</b><strong>{level}</strong></div></div><div className="summary"><h3>Performance summary</h3><p>{percentage >= 85 ? 'Excellent electrical foundation and practical circuit validation. The candidate is ready for more advanced technical assessment.' : percentage >= 70 ? 'Good electrical foundation with practical skills demonstrated. Continue with equipment-specific assessment.' : percentage >= 50 ? 'Developing electrical foundation. Additional fundamentals and practical circuit training are recommended.' : 'Additional electrical fundamentals and practical training are recommended before progressing.'}</p><div className="chips"><span>Electrical fundamentals</span><span>Practical circuit validation</span><span>Automatic scoring</span></div></div><button className="primary big" onClick={reset}>Retake assessment</button></div></div>;
}
