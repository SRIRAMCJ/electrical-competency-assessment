import { useEffect, useMemo, useState } from 'react';

type Question = { id: string; question: string; options: string[]; answer: string; explanation: string; points: number };
type WireColor = 'Red' | 'Blue' | 'Black';
type MaterialId = 'battery' | 'fuse' | 'switch' | 'lamp';
type TerminalId = 'batteryPlus' | 'batteryMinus' | 'fuseIn' | 'fuseOut' | 'switchIn' | 'switchOut' | 'lampPlus' | 'lampMinus';
type Placed = Record<MaterialId, boolean>;
type Connection = { from: TerminalId; to: TerminalId; color: WireColor };

const questions: Question[] = [
  { id: 'EL-MCQ-001', question: 'What is the SI unit of electrical current?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], answer: 'Ampere', explanation: 'Ampere (A) is the SI unit of electric current.', points: 1 },
  { id: 'EL-MCQ-002', question: 'Which instrument is used to measure electrical current?', options: ['Voltmeter', 'Ammeter', 'Ohmmeter', 'Wattmeter'], answer: 'Ammeter', explanation: 'An ammeter measures electrical current.', points: 1 },
  { id: 'EL-MCQ-003', question: 'According to Ohm’s law, which equation is correct?', options: ['V = I × R', 'P = V × I', 'R = V × I', 'I = V × R'], answer: 'V = I × R', explanation: 'Ohm’s law states V = I × R.', points: 1 },
  { id: 'EL-MCQ-004', question: 'What is the SI unit of electrical resistance?', options: ['Ampere', 'Volt', 'Ohm', 'Watt'], answer: 'Ohm', explanation: 'Ohm (Ω) is the SI unit of resistance.', points: 1 },
  { id: 'EL-MCQ-005', question: 'What is the primary purpose of a fuse?', options: ['Increase voltage', 'Protect against excessive current', 'Store electrical energy', 'Measure current'], answer: 'Protect against excessive current', explanation: 'A fuse protects a circuit by opening it during excessive current.', points: 1 },
  { id: 'EL-MCQ-006', question: 'What happens to total resistance when resistors are connected in series?', options: ['It is the sum of the resistances', 'It becomes zero', 'It equals the smallest resistor', 'It equals the largest resistor'], answer: 'It is the sum of the resistances', explanation: 'Series resistances add together.', points: 1 },
  { id: 'EL-MCQ-007', question: 'Which type of current periodically changes direction?', options: ['Direct current', 'Alternating current', 'Static current', 'Leakage current'], answer: 'Alternating current', explanation: 'AC periodically reverses direction.', points: 1 },
  { id: 'EL-MCQ-008', question: 'What is the SI unit of electrical power?', options: ['Watt', 'Ohm', 'Coulomb', 'Ampere'], answer: 'Watt', explanation: 'Watt (W) is the SI unit of power.', points: 1 },
  { id: 'EL-MCQ-009', question: 'In an ideal parallel circuit, what is common across each branch?', options: ['Voltage', 'Resistance', 'Power', 'Energy'], answer: 'Voltage', explanation: 'Parallel branches share the same voltage.', points: 1 },
  { id: 'EL-MCQ-010', question: 'Which device is commonly used to open or close an electrical circuit?', options: ['Transformer', 'Switch', 'Resistor', 'Capacitor'], answer: 'Switch', explanation: 'A switch opens or closes a circuit.', points: 1 },
];

const materialMeta: Record<MaterialId, { name: string; icon: string; description: string }> = {
  battery: { name: '12V Battery', icon: '🔋', description: 'DC source' },
  fuse: { name: 'Fuse', icon: '🛡️', description: 'Protection' },
  switch: { name: 'Switch', icon: '⏻', description: 'Control' },
  lamp: { name: 'Lamp', icon: '💡', description: 'Load' },
};

const terminalLabels: Record<TerminalId, string> = {
  batteryPlus: 'Battery +', batteryMinus: 'Battery −', fuseIn: 'Fuse IN', fuseOut: 'Fuse OUT',
  switchIn: 'Switch IN', switchOut: 'Switch OUT', lampPlus: 'Lamp +', lampMinus: 'Lamp −',
};

const terminalMaterial: Record<TerminalId, MaterialId> = {
  batteryPlus: 'battery', batteryMinus: 'battery', fuseIn: 'fuse', fuseOut: 'fuse',
  switchIn: 'switch', switchOut: 'switch', lampPlus: 'lamp', lampMinus: 'lamp',
};

const expectedConnections: Connection[] = [
  { from: 'batteryPlus', to: 'fuseIn', color: 'Red' },
  { from: 'fuseOut', to: 'switchIn', color: 'Red' },
  { from: 'switchOut', to: 'lampPlus', color: 'Blue' },
  { from: 'lampMinus', to: 'batteryMinus', color: 'Black' },
];

const wireHex: Record<WireColor, string> = { Red: '#ef4444', Blue: '#2563eb', Black: '#111827' };
const materialIds: MaterialId[] = ['battery', 'fuse', 'switch', 'lamp'];

export default function App() {
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState<'quiz' | 'practical' | 'result'>('quiz');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(10 * 60);
  const [placed, setPlaced] = useState<Placed>({ battery: false, fuse: false, switch: false, lamp: false });
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedColor, setSelectedColor] = useState<WireColor>('Red');
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalId | null>(null);
  const [message, setMessage] = useState('Drag all four materials onto the board to begin.');
  const [practicalErrors, setPracticalErrors] = useState(0);

  useEffect(() => {
    if (!started || stage !== 'quiz') return;
    const timer = window.setInterval(() => setRemaining((value) => {
      if (value <= 1) { setStage('practical'); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [started, stage]);

  const quizScore = useMemo(() => questions.reduce((sum, q) => sum + (answers[q.id] === q.answer ? q.points : 0), 0), [answers]);
  const quizMax = questions.length;
  const practicalScore = connections.length * 10 + (connections.length === expectedConnections.length ? 20 : 0) - practicalErrors * 2;
  const totalMax = quizMax + 60;
  const totalScore = Math.max(0, quizScore + Math.min(60, practicalScore));
  const percentage = Math.round((totalScore / totalMax) * 100);

  const reset = () => {
    setStarted(false); setStage('quiz'); setIndex(0); setAnswers({}); setRemaining(600);
    setPlaced({ battery: false, fuse: false, switch: false, lamp: false }); setConnections([]); setSelectedColor('Red');
    setSelectedTerminal(null); setMessage('Drag all four materials onto the board to begin.'); setPracticalErrors(0);
  };

  if (!started) return <Start onStart={() => setStarted(true)} />;
  if (stage === 'quiz') return <Quiz index={index} setIndex={setIndex} answers={answers} setAnswers={setAnswers} remaining={remaining} onContinue={() => setStage('practical')} />;
  if (stage === 'practical') return <Practical placed={placed} setPlaced={setPlaced} connections={connections} setConnections={setConnections} selectedColor={selectedColor} setSelectedColor={setSelectedColor} selectedTerminal={selectedTerminal} setSelectedTerminal={setSelectedTerminal} message={message} setMessage={setMessage} errors={practicalErrors} setErrors={setPracticalErrors} onFinish={() => setStage('result')} />;
  return <Result quizScore={quizScore} quizMax={quizMax} practicalScore={Math.max(0, Math.min(60, practicalScore))} totalScore={totalScore} totalMax={totalMax} percentage={percentage} reset={reset} />;
}

function Start({ onStart }: { onStart: () => void }) {
  return <Page><div className="heroCard"><div className="eyebrow">ELECTRICAL • NEW ENTRY WORKER</div><h1>Electrical Competency<br /><span>Assessment</span></h1><p>Start with electrical fundamentals, then prove your practical understanding by building a low-voltage control circuit.</p><div className="stats"><Stat value="10" label="MCQ questions" /><Stat value="4" label="materials to place" /><Stat value="4" label="wire connections" /><Stat value="10:00" label="quiz timer" /></div><button className="primary big" onClick={onStart}>Start assessment →</button><small className="offline">● Runs locally in your browser • no API required</small></div></Page>;
}

function Quiz({ index, setIndex, answers, setAnswers, remaining, onContinue }: { index: number; setIndex: (v: number) => void; answers: Record<string, string>; setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>; remaining: number; onContinue: () => void }) {
  const q = questions[index];
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0'); const secs = (remaining % 60).toString().padStart(2, '0');
  return <Page><Header title="Electrical Fundamentals" timer={`${mins}:${secs}`} /><div className="progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div><main className="quizLayout"><section className="panel"><div className="qmeta"><span>Question {index + 1} / {questions.length}</span><span>MCQ • 1 point</span></div><h2>{q.question}</h2><div className="options">{q.options.map((option, i) => <button key={option} className={answers[q.id] === option ? 'selected' : ''} onClick={() => setAnswers(current => ({ ...current, [q.id]: option }))}><b>{String.fromCharCode(65 + i)}</b>{option}</button>)}</div><div className="nav"><button disabled={index === 0} onClick={() => setIndex(index - 1)}>← Previous</button><button className="primary" disabled={!answers[q.id]} onClick={() => index === questions.length - 1 ? onContinue() : setIndex(index + 1)}>{index === questions.length - 1 ? 'Continue to practical →' : 'Next question →'}</button></div></section><aside className="panel"><b>Assessment stages</b><div className="stageItem active"><span>01</span><div><strong>Fundamentals</strong><small>10 MCQ questions</small></div></div><div className="stageItem"><span>02</span><div><strong>Practical circuit</strong><small>Pick, place & connect</small></div></div><div className="stageItem"><span>03</span><div><strong>Performance</strong><small>Score & competency level</small></div></div></aside></main></Page>;
}

function Practical({ placed, setPlaced, connections, setConnections, selectedColor, setSelectedColor, selectedTerminal, setSelectedTerminal, message, setMessage, errors, setErrors, onFinish }: { placed: Placed; setPlaced: React.Dispatch<React.SetStateAction<Placed>>; connections: Connection[]; setConnections: React.Dispatch<React.SetStateAction<Connection[]>>; selectedColor: WireColor; setSelectedColor: (v: WireColor) => void; selectedTerminal: TerminalId | null; setSelectedTerminal: (v: TerminalId | null) => void; message: string; setMessage: (v: string) => void; errors: number; setErrors: (v: number) => void; onFinish: () => void }) {
  const allPlaced = materialIds.every(id => placed[id]);
  const complete = connections.length === expectedConnections.length;
  const [dragging, setDragging] = useState<MaterialId | null>(null);
  const [switchOn, setSwitchOn] = useState(false);

  const dropMaterial = (id: MaterialId) => {
    if (placed[id]) return;
    setPlaced(current => ({ ...current, [id]: true }));
    setMessage(`${materialMeta[id].name} placed correctly. ${materialIds.filter(x => !placed[x] && x !== id).length} material(s) remaining.`);
  };

  const connectTerminal = (terminal: TerminalId) => {
    if (!allPlaced) { setMessage('⚠️ Place all four materials on the board first.'); return; }
    if (!selectedTerminal) { setSelectedTerminal(terminal); setMessage(`${terminalLabels[terminal]} selected. Now choose the second terminal.`); return; }
    if (selectedTerminal === terminal) { setSelectedTerminal(null); setMessage('Choose two different terminals.'); return; }
    const expected = expectedConnections.find(c => (c.from === selectedTerminal && c.to === terminal) || (c.from === terminal && c.to === selectedTerminal));
    if (!expected) { setErrors(errors + 1); setSelectedTerminal(null); setMessage('❌ Incorrect terminal pair. Trace the circuit path from the battery through protection, control and load.'); return; }
    const exists = connections.some(c => (c.from === expected.from && c.to === expected.to) || (c.from === expected.to && c.to === expected.from));
    if (exists) { setSelectedTerminal(null); setMessage('That connection is already completed.'); return; }
    if (selectedColor !== expected.color) { setErrors(errors + 1); setSelectedTerminal(null); setMessage(`❌ Wrong wire colour. This connection requires the ${expected.color} wire.`); return; }
    const next = [...connections, expected]; setConnections(next); setSelectedTerminal(null);
    setMessage(next.length === expectedConnections.length ? '🟢 Circuit wired correctly. Turn the switch ON to test it.' : '✓ Correct connection. Continue tracing the circuit.');
  };

  const positions: Record<TerminalId, [number, number]> = { batteryPlus: [70, 120], batteryMinus: [70, 390], fuseIn: [265, 105], fuseOut: [345, 105], switchIn: [475, 105], switchOut: [555, 105], lampPlus: [720, 105], lampMinus: [720, 390] };
  const lines = connections.map((c, i) => { const [x1, y1] = positions[c.from]; const [x2, y2] = positions[c.to]; return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={wireHex[c.color]} strokeWidth="9" strokeLinecap="round" />; });
  const lampOn = complete && switchOn;

  return <Page><Header title="Practical Validation" /><div className="practicalIntro"><div><div className="eyebrow">STAGE 2 • PICK & PLACE + WIRING</div><h1>Build the <span>12V Lamp Circuit</span></h1><p>Drag the correct materials onto the board. Then select a wire colour and connect the terminals in the correct electrical path.</p></div><div className="scoreBadge">{connections.length} / 4<br /><small>connections</small></div></div><div className="practicalGrid"><aside className="materialPanel panel"><h3>Material tray</h3><p className="muted">Pick each material and place it in its highlighted slot.</p><div className="materials">{materialIds.map(id => <div key={id} draggable={!placed[id]} onDragStart={() => setDragging(id)} onDragEnd={() => setDragging(null)} onClick={() => dropMaterial(id)} className={`material ${placed[id] ? 'used' : ''}`}><span>{materialMeta[id].icon}</span><div><b>{materialMeta[id].name}</b><small>{materialMeta[id].description}</small></div>{placed[id] ? <em>✓</em> : <em>↕</em>}</div>)}</div><div className="wirePicker"><h3>Choose wire colour</h3>{(['Red','Blue','Black'] as WireColor[]).map(c => <button key={c} className={selectedColor === c ? 'wireChoice selected' : 'wireChoice'} onClick={() => { setSelectedColor(c); setMessage(`${c} wire selected.`); }}><i style={{ background: wireHex[c] }} />{c}<small>{c === 'Red' ? 'Supply / protection' : c === 'Blue' ? 'Control / load path' : 'Return / negative'}</small></button>)}</div><div className={`feedback ${message.startsWith('❌') ? 'bad' : message.startsWith('🟢') ? 'good' : ''}`}>{message}</div></aside><section className="panel boardPanel"><div className="boardHeader"><div><b>Virtual control board</b><small>Low-voltage training simulation</small></div><span>{allPlaced ? 'All materials placed ✓' : `${materialIds.filter(id => !placed[id]).length} materials left`}</span></div><div className="dropBoard">{materialIds.map((id, i) => <div key={id} className={`slot slot${i + 1} ${placed[id] ? 'filled' : ''}`} onDragOver={e => e.preventDefault()} onDrop={() => dragging && dropMaterial(dragging)} onClick={() => !placed[id] && dropMaterial(id)}>{placed[id] ? <><span className="bigIcon">{materialMeta[id].icon}</span><b>{materialMeta[id].name}</b></> : <><span>+</span><small>Place {materialMeta[id].name}</small></>}</div>)}<svg className="circuitSvg" viewBox="0 0 790 470">{lines}<g className="terminalLayer">{(Object.keys(terminalLabels) as TerminalId[]).map(t => { const [x, y] = positions[t]; const active = selectedTerminal === t; return <g key={t} onClick={() => connectTerminal(t)} className="terminal"><circle cx={x} cy={y} r={active ? 13 : 10} fill={active ? '#2563eb' : '#fff'} stroke="#344054" strokeWidth="4"/><text x={x} y={y - 20} textAnchor="middle">{terminalLabels[t]}</text></g>; })}</g></svg><div className={`lamp ${lampOn ? 'on' : ''}`}><span>💡</span><b>{lampOn ? 'ON' : 'OFF'}</b></div></div><div className="boardActions"><div><b>{complete ? 'Circuit connections complete' : 'Connection objective'}</b><p>{complete ? 'All four wire connections are correct. Turn the switch ON to prove the circuit works.' : 'Battery + → Fuse → Switch → Lamp → Battery −'}</p></div><button className="switchButton" disabled={!complete} onClick={() => { setSwitchOn(!switchOn); setMessage(!switchOn ? '🟢 Switch ON — the lamp is now powered.' : 'Switch OFF. Turn it ON to complete the functional test.'); }}>{switchOn ? '⏻ Switch OFF' : '⏻ Switch ON'}</button>{complete && switchOn && <button className="primary" onClick={onFinish}>Finish practical →</button>}</div></section></div></Page>;
}

function Result({ quizScore, quizMax, practicalScore, totalScore, totalMax, percentage, reset }: { quizScore: number; quizMax: number; practicalScore: number; totalScore: number; totalMax: number; percentage: number; reset: () => void }) {
  const level = percentage >= 85 ? 'Advanced' : percentage >= 70 ? 'Proficient' : percentage >= 50 ? 'Developing' : 'Needs Training';
  return <Page><div className="resultCard"><div className="eyebrow">ASSESSMENT COMPLETE</div><h1>Electrical Competency<br /><span>Performance Report</span></h1><div className="scoreCircle"><b>{percentage}%</b><small>{level}</small></div><div className="resultGrid"><div><small>Knowledge</small><strong>{quizScore} / {quizMax}</strong></div><div><small>Practical</small><strong>{practicalScore} / 60</strong></div><div><small>Total</small><strong>{totalScore} / {totalMax}</strong></div></div><div className="summary"><h3>Performance summary</h3><p>{percentage >= 85 ? 'Strong electrical fundamentals and practical circuit validation. Ready for the next technical competency level.' : percentage >= 70 ? 'Good foundation. Continue with equipment-specific practical assessments.' : percentage >= 50 ? 'Developing competency. Additional fundamentals and supervised practical training are recommended.' : 'Needs additional electrical fundamentals and practical training before progressing.'}</p><div className="chips"><span>MCQ knowledge</span><span>Pick & place</span><span>Wire identification</span><span>Circuit validation</span></div></div><button className="primary big" onClick={reset}>Retake assessment</button></div></Page>;
}

function Page({ children }: { children: React.ReactNode }) {
  return <div className="page"><style>{styles}</style>{children}</div>;
}
function Header({ title, timer }: { title: string; timer?: string }) { return <header className="header"><div><div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div><h2>{title}</h2></div>{timer && <div className="timer"><small>TIME</small><b>{timer}</b></div>}</header>; }
function Stat({ value, label }: { value: string; label: string }) { return <div><b>{value}</b><small>{label}</small></div>; }

const styles = `
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#101828;background:#f7f8fa}.page{min-height:100vh;background:linear-gradient(135deg,#f8fafc 0%,#eef4ff 100%);padding:34px 28px}.heroCard,.resultCard{max-width:900px;margin:7vh auto;background:#fff;border:1px solid #e4e7ec;border-radius:28px;padding:56px;box-shadow:0 24px 70px rgba(16,24,40,.10)}.eyebrow{font-size:11px;font-weight:800;letter-spacing:2px;color:#475467}.heroCard h1,.resultCard h1{font-size:56px;line-height:1.02;margin:16px 0}.heroCard h1 span,.resultCard h1 span,.practicalIntro h1 span{color:#2563eb}.heroCard p{max-width:680px;color:#667085;font-size:18px;line-height:1.7}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:32px 0}.stats div,.resultGrid div{background:#f8fafc;border:1px solid #eaecf0;border-radius:16px;padding:18px}.stats b{display:block;font-size:24px}.stats small,.stageItem small,.material small,.wireChoice small{display:block;color:#667085;margin-top:4px}.primary{border:0;border-radius:12px;background:#175cd3;color:white;padding:12px 20px;font-weight:800;cursor:pointer}.primary:disabled{opacity:.45;cursor:not-allowed}.big{font-size:16px;padding:16px 24px}.offline{display:block;color:#667085;margin-top:18px}.header{max-width:1180px;margin:0 auto 20px;display:flex;justify-content:space-between;align-items:center}.header h2{margin:5px 0;font-size:24px}.timer{background:#101828;color:white;border-radius:12px;padding:10px 16px;text-align:center}.timer small{display:block;font-size:9px;letter-spacing:1px;opacity:.65}.timer b{font-size:20px}.progress{max-width:1180px;height:6px;background:#e4e7ec;border-radius:99px;margin:0 auto 24px;overflow:hidden}.progress span{display:block;height:100%;background:#2563eb}.quizLayout{max-width:1180px;margin:auto;display:grid;grid-template-columns:1fr 300px;gap:20px}.panel{background:#fff;border:1px solid #e4e7ec;border-radius:20px;padding:28px;box-shadow:0 10px 35px rgba(16,24,40,.06)}.qmeta{display:flex;gap:10px;color:#667085;font-size:12px;font-weight:700}.qmeta span:last-of-type{margin-left:auto}.panel h2{font-size:32px;line-height:1.25;margin:28px 0}.options{display:grid;gap:12px}.options button{display:flex;align-items:center;gap:14px;text-align:left;padding:17px;border:1px solid #d0d5dd;border-radius:14px;background:#fff;font-size:16px;cursor:pointer}.options button:hover,.options button.selected{border-color:#2563eb;background:#eff6ff}.options b{display:grid;place-items:center;width:32px;height:32px;border-radius:9px;background:#f2f4f7}.nav{display:flex;justify-content:space-between;margin-top:28px}.nav button:not(.primary){border:1px solid #d0d5dd;background:white;border-radius:12px;padding:12px 18px}.stageItem{display:flex;gap:12px;padding:16px 0;border-bottom:1px solid #eaecf0}.stageItem span{width:34px;height:34px;display:grid;place-items:center;background:#f2f4f7;border-radius:10px;font-weight:800}.stageItem.active span{background:#dbeafe;color:#175cd3}.stageItem strong{display:block}.practicalIntro{max-width:1180px;margin:0 auto 20px;display:flex;justify-content:space-between;align-items:center}.practicalIntro h1{font-size:42px;margin:10px 0}.practicalIntro p{color:#667085;max-width:760px}.scoreBadge{background:#101828;color:white;padding:14px 22px;border-radius:16px;text-align:center;font-size:20px;font-weight:800}.scoreBadge small{font-size:10px;opacity:.7}.practicalGrid{max-width:1180px;margin:auto;display:grid;grid-template-columns:300px 1fr;gap:20px}.materialPanel h3{margin:0 0 6px}.muted{color:#667085;font-size:13px}.material{display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #d0d5dd;border-radius:14px;margin-top:10px;background:white;cursor:grab}.material:hover{border-color:#2563eb;transform:translateY(-1px)}.material.used{opacity:.55;cursor:default;background:#f8fafc}.material>span{font-size:28px}.material em{margin-left:auto;color:#98a2b3}.wirePicker{border-top:1px solid #eaecf0;margin-top:20px;padding-top:18px}.wireChoice{width:100%;display:grid;grid-template-columns:18px 1fr;grid-template-rows:auto auto;column-gap:10px;text-align:left;border:1px solid #d0d5dd;background:white;border-radius:12px;padding:10px;margin-top:8px;cursor:pointer}.wireChoice i{grid-row:1/3;width:14px;height:14px;border-radius:50%;margin-top:3px}.wireChoice small{grid-column:2}.wireChoice.selected{border:2px solid #2563eb}.feedback{margin-top:18px;padding:13px;border-radius:12px;background:#f2f4f7;font-size:13px}.feedback.bad{background:#fef3f2;color:#b42318}.feedback.good{background:#ecfdf3;color:#027a48}.boardPanel{overflow:hidden}.boardHeader{display:flex;justify-content:space-between;margin-bottom:16px}.boardHeader small{display:block;color:#667085;margin-top:4px}.boardHeader>span{font-size:12px;font-weight:800;color:#027a48}.dropBoard{position:relative;min-height:520px;background:linear-gradient(145deg,#eef2f6,#dfe5ec);border-radius:18px;padding:24px;overflow:hidden}.dropBoard:before{content:"";position:absolute;inset:0;background-image:radial-gradient(#b8c0ca 1px,transparent 1px);background-size:18px 18px;opacity:.5}.slot{position:absolute;z-index:3;width:135px;height:105px;border:2px dashed #98a2b3;border-radius:14px;background:rgba(255,255,255,.8);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#667085}.slot span{font-size:26px}.slot small{margin-top:5px}.slot.filled{border-style:solid;border-color:#98a2b3;background:#fff;color:#101828}.slot1{left:6%;top:55px}.slot2{left:30%;top:55px}.slot3{left:54%;top:55px}.slot4{left:78%;top:55px}.bigIcon{font-size:30px!important}.circuitSvg{position:absolute;left:0;top:165px;width:100%;height:300px;z-index:4;overflow:visible}.terminal{cursor:pointer}.terminal text{font-size:10px;fill:#344054;font-weight:700}.terminal:hover circle{stroke:#2563eb}.lamp{position:absolute;right:8%;bottom:35px;z-index:6;display:flex;align-items:center;gap:8px;background:#fff;border-radius:12px;padding:8px 12px;box-shadow:0 5px 15px rgba(0,0,0,.08)}.lamp span{font-size:25px;filter:grayscale(1)}.lamp.on{background:#fffbeb;border:1px solid #f59e0b}.lamp.on span{filter:none;filter:drop-shadow(0 0 8px #fbbf24)}.lamp b{font-size:11px}.boardActions{display:flex;align-items:center;gap:12px;border-top:1px solid #eaecf0;margin-top:16px;padding-top:16px}.boardActions>div{flex:1}.boardActions p{margin:5px 0;color:#667085;font-size:13px}.switchButton{border:1px solid #d0d5dd;background:#fff;border-radius:12px;padding:12px 16px;font-weight:800;cursor:pointer}.switchButton:disabled{opacity:.45}.resultCard{text-align:center}.scoreCircle{width:160px;height:160px;margin:30px auto;border-radius:50%;background:#eff6ff;border:10px solid #bfdbfe;display:grid;place-content:center}.scoreCircle b{font-size:38px}.scoreCircle small{color:#175cd3;font-weight:800}.resultGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:left}.resultGrid small{display:block;color:#667085}.resultGrid strong{display:block;font-size:22px;margin-top:5px}.summary{text-align:left;background:#f8fafc;border-radius:16px;padding:20px;margin:18px 0}.summary p{color:#667085;line-height:1.6}.chips{display:flex;flex-wrap:wrap;gap:7px}.chips span{background:#e0eaff;color:#175cd3;border-radius:99px;padding:6px 10px;font-size:11px;font-weight:700}@media(max-width:900px){.quizLayout,.practicalGrid{grid-template-columns:1fr}.stats,.resultGrid{grid-template-columns:repeat(2,1fr)}.heroCard,.resultCard{padding:30px}.heroCard h1,.resultCard h1{font-size:40px}.slot{position:relative;left:auto!important;top:auto!important;width:100%;margin:8px 0}.dropBoard{display:grid;grid-template-columns:1fr 1fr;gap:8px}.circuitSvg{top:300px}.lamp{bottom:15px}.dropBoard{min-height:700px}.practicalIntro{display:block}.scoreBadge{display:inline-block;margin-top:10px}}
`;
