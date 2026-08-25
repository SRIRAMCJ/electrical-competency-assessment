import { useEffect, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

type Question = { q: string; options: string[]; answer: string };
type Color = 'Red' | 'Blue' | 'Black';
type Part = 'battery' | 'fuse' | 'switch' | 'lamp';
type Terminal = 'bp' | 'bm' | 'fi' | 'fo' | 'si' | 'so' | 'lp' | 'lm';
type Connection = { a: Terminal; b: Terminal; color: Color };

const questions: Question[] = [
  { q: 'What is the SI unit of electrical current?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], answer: 'Ampere' },
  { q: 'Which instrument measures electrical current?', options: ['Voltmeter', 'Ammeter', 'Ohmmeter', 'Wattmeter'], answer: 'Ammeter' },
  { q: "Which equation represents Ohm's law?", options: ['V = I × R', 'P = V × I', 'R = V × I', 'I = V × R'], answer: 'V = I × R' },
  { q: 'What is the SI unit of resistance?', options: ['Ampere', 'Volt', 'Ohm', 'Watt'], answer: 'Ohm' },
  { q: 'What is the primary purpose of a fuse?', options: ['Increase voltage', 'Protect against excessive current', 'Store energy', 'Measure current'], answer: 'Protect against excessive current' },
  { q: 'In a series circuit, total resistance is:', options: ['The sum of resistances', 'Always zero', 'The smallest resistance', 'The largest resistance'], answer: 'The sum of resistances' },
  { q: 'Which current periodically changes direction?', options: ['DC', 'AC', 'Static current', 'Leakage current'], answer: 'AC' },
  { q: 'What is the SI unit of electrical power?', options: ['Watt', 'Ohm', 'Coulomb', 'Ampere'], answer: 'Watt' },
  { q: 'In an ideal parallel circuit, what is common across each branch?', options: ['Voltage', 'Resistance', 'Power', 'Energy'], answer: 'Voltage' },
  { q: 'Which device opens or closes an electrical circuit?', options: ['Transformer', 'Switch', 'Resistor', 'Capacitor'], answer: 'Switch' }
];

const parts: Record<Part, { name: string; icon: string; sub: string }> = {
  battery: { name: '12V Battery', icon: '🔋', sub: 'DC source' },
  fuse: { name: 'Fuse', icon: '🛡️', sub: 'Protection' },
  switch: { name: 'Switch', icon: '⏻', sub: 'Control' },
  lamp: { name: 'Lamp', icon: '💡', sub: 'Load' }
};

const labels: Record<Terminal, string> = {
  bp: 'BAT +', bm: 'BAT −', fi: 'FUSE IN', fo: 'FUSE OUT',
  si: 'SW IN', so: 'SW OUT', lp: 'LAMP +', lm: 'LAMP −'
};

const expected: Connection[] = [
  { a: 'bp', b: 'fi', color: 'Red' },
  { a: 'fo', b: 'si', color: 'Red' },
  { a: 'so', b: 'lp', color: 'Blue' },
  { a: 'lm', b: 'bm', color: 'Black' }
];

const wire: Record<Color, string> = { Red: '#e53935', Blue: '#2563eb', Black: '#111827' };
const terminalPos: Record<Terminal, [number, number]> = {
  bp: [100, 300], bm: [100, 505], fi: [330, 300], fo: [470, 300],
  si: [610, 300], so: [750, 300], lp: [960, 300], lm: [960, 505]
};

export default function App() {
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState<'quiz' | 'practical' | 'result'>('quiz');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [time, setTime] = useState(600);
  const [placed, setPlaced] = useState<Record<Part, boolean>>({ battery: false, fuse: false, switch: false, lamp: false });
  const [connections, setConnections] = useState<Connection[]>([]);
  const [color, setColor] = useState<Color>('Red');
  const [selected, setSelected] = useState<Terminal | null>(null);
  const [errors, setErrors] = useState(0);
  const [switchOn, setSwitchOn] = useState(false);
  const [notice, setNotice] = useState('Place all four materials on the board to begin.');

  useEffect(() => {
    if (!started || stage !== 'quiz') return;
    const timer = window.setInterval(() => {
      setTime((current) => {
        if (current <= 1) {
          setStage('practical');
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, stage]);

  const knowledge = questions.reduce((score, question, index) => score + (answers[index] === question.answer ? 1 : 0), 0);
  const allPlaced = Object.values(placed).every(Boolean);
  const complete = connections.length === expected.length;
  const lampOn = complete && switchOn;
  const practical = Math.max(0, Math.min(60, connections.length * 10 + (complete ? 20 : 0) - errors * 2));
  const total = knowledge + practical;
  const percentage = Math.round((total / 70) * 100);

  const reset = () => {
    setStarted(false);
    setStage('quiz');
    setQuestionIndex(0);
    setAnswers({});
    setTime(600);
    setPlaced({ battery: false, fuse: false, switch: false, lamp: false });
    setConnections([]);
    setColor('Red');
    setSelected(null);
    setErrors(0);
    setSwitchOn(false);
    setNotice('Place all four materials on the board to begin.');
  };

  if (!started) return <Start onStart={() => setStarted(true)} />;
  if (stage === 'quiz') {
    return <Quiz index={questionIndex} setIndex={setQuestionIndex} answers={answers} setAnswers={setAnswers} time={time} onDone={() => setStage('practical')} />;
  }
  if (stage === 'result') {
    return <Result knowledge={knowledge} practical={practical} total={total} percentage={percentage} onReset={reset} />;
  }
  return (
    <Practical
      placed={placed}
      setPlaced={setPlaced}
      connections={connections}
      setConnections={setConnections}
      color={color}
      setColor={setColor}
      selected={selected}
      setSelected={setSelected}
      errors={errors}
      setErrors={setErrors}
      switchOn={switchOn}
      setSwitchOn={setSwitchOn}
      notice={notice}
      setNotice={setNotice}
      allPlaced={allPlaced}
      complete={complete}
      lampOn={lampOn}
      onFinish={() => setStage('result')}
    />
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="page"><style>{css}</style>{children}</div>;
}

function Start({ onStart }: { onStart: () => void }) {
  return (
    <Shell>
      <div className="start">
        <div className="eyebrow">ELECTRICAL • NEW ENTRY WORKER</div>
        <h1>Electrical Competency<br /><span>Assessment</span></h1>
        <p>Test fundamentals, then validate practical wiring skills on an interactive low-voltage training board.</p>
        <div className="stats">
          <b>10<small>MCQ questions</small></b>
          <b>4<small>materials</small></b>
          <b>4<small>connections</small></b>
          <b>12V<small>simulation</small></b>
        </div>
        <button className="primary big" onClick={onStart}>Start assessment →</button>
        <small className="offline">● Browser-local simulation • no API required</small>
      </div>
    </Shell>
  );
}

function Header({ title, timer }: { title: string; timer?: string }) {
  return (
    <header className="header">
      <div><div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div><strong>{title}</strong></div>
      {timer && <div className="timer">⏱ {timer}</div>}
    </header>
  );
}

function Quiz({
  index, setIndex, answers, setAnswers, time, onDone
}: {
  index: number;
  setIndex: (n: number) => void;
  answers: Record<number, string>;
  setAnswers: Dispatch<SetStateAction<Record<number, string>>>;
  time: number;
  onDone: () => void;
}) {
  const question = questions[index];
  const minutes = String(Math.floor(time / 60)).padStart(2, '0');
  const seconds = String(time % 60).padStart(2, '0');
  return (
    <Shell>
      <Header title="Electrical Fundamentals" timer={`${minutes}:${seconds}`} />
      <div className="progress"><i style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
      <main className="quiz">
        <section className="card questionCard">
          <div className="meta">Question {index + 1} / {questions.length}<span>MCQ • 1 point</span></div>
          <h2>{question.q}</h2>
          <div className="options">
            {question.options.map((option, optionIndex) => (
              <button key={option} className={answers[index] === option ? 'selected' : ''} onClick={() => setAnswers((old) => ({ ...old, [index]: option }))}>
                <b>{String.fromCharCode(65 + optionIndex)}</b>{option}
              </button>
            ))}
          </div>
          <div className="nav">
            <button disabled={index === 0} onClick={() => setIndex(index - 1)}>← Previous</button>
            <button className="primary" disabled={!answers[index]} onClick={() => index === questions.length - 1 ? onDone() : setIndex(index + 1)}>
              {index === questions.length - 1 ? 'Continue to practical →' : 'Next →'}
            </button>
          </div>
        </section>
        <aside className="card stages"><b>Assessment</b><p>01 <strong>Fundamentals</strong><small>10 electrical MCQs</small></p><p>02 <strong>Practical wiring</strong><small>Pick, place & connect</small></p><p>03 <strong>Performance report</strong><small>Score & competency</small></p></aside>
      </main>
    </Shell>
  );
}

function Practical({
  placed, setPlaced, connections, setConnections, color, setColor, selected, setSelected,
  errors, setErrors, switchOn, setSwitchOn, notice, setNotice, allPlaced, complete, lampOn, onFinish
}: {
  placed: Record<Part, boolean>;
  setPlaced: Dispatch<SetStateAction<Record<Part, boolean>>>;
  connections: Connection[];
  setConnections: Dispatch<SetStateAction<Connection[]>>;
  color: Color;
  setColor: (value: Color) => void;
  selected: Terminal | null;
  setSelected: (value: Terminal | null) => void;
  errors: number;
  setErrors: (value: number) => void;
  switchOn: boolean;
  setSwitchOn: (value: boolean) => void;
  notice: string;
  setNotice: (value: string) => void;
  allPlaced: boolean;
  complete: boolean;
  lampOn: boolean;
  onFinish: () => void;
}) {
  const [dragged, setDragged] = useState<Part | null>(null);

  const place = (part: Part) => {
    if (placed[part]) return;
    setPlaced((old) => ({ ...old, [part]: true }));
    setNotice(`${parts[part].name} placed. Continue with the remaining materials.`);
  };

  const connect = (terminal: Terminal) => {
    if (!allPlaced) {
      setNotice('⚠️ Place all four materials on the board first.');
      return;
    }
    if (!selected) {
      setSelected(terminal);
      setNotice(`${labels[terminal]} selected — choose the second terminal.`);
      return;
    }
    if (selected === terminal) {
      setSelected(null);
      setNotice('Choose two different terminals.');
      return;
    }

    const expectedConnection = expected.find((item) =>
      (item.a === selected && item.b === terminal) || (item.a === terminal && item.b === selected)
    );

    if (!expectedConnection) {
      setErrors(errors + 1);
      setSelected(null);
      setNotice('❌ Incorrect terminal pair. Follow the connection objective.');
      return;
    }

    const duplicate = connections.some((item) =>
      (item.a === expectedConnection.a && item.b === expectedConnection.b) ||
      (item.a === expectedConnection.b && item.b === expectedConnection.a)
    );
    if (duplicate) {
      setSelected(null);
      return;
    }

    if (color !== expectedConnection.color) {
      setErrors(errors + 1);
      setSelected(null);
      setNotice(`❌ Wrong colour. This connection requires ${expectedConnection.color}.`);
      return;
    }

    const next = [...connections, expectedConnection];
    setConnections(next);
    setSelected(null);
    setNotice(next.length === expected.length ? '🟢 Wiring complete. Turn the switch ON to test the lamp.' : '✓ Correct connection. Continue wiring.');
  };

  const renderWire = (connection: Connection, index: number) => {
    const [x1, y1] = terminalPos[connection.a];
    const [x2, y2] = terminalPos[connection.b];
    return (
      <g key={`${connection.a}-${connection.b}-${index}`}>
        <path d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`} stroke="#ffffff" strokeWidth="15" fill="none" strokeLinecap="round" />
        <path d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`} stroke={wire[connection.color]} strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>
    );
  };

  return (
    <Shell>
      <Header title="Practical Validation" />
      <div className="practicalHead">
        <div><div className="eyebrow">STAGE 2 • PICK & PLACE + WIRING</div><h1>Build the <span>12V Lamp Circuit</span></h1><p>Pick the components, place them on the illustrated board, select the required wire colour, and connect the correct terminals.</p></div>
        <div className="counter"><b>{connections.length}/4</b><small>connections</small></div>
      </div>

      <div className="work">
        <aside className="card tray">
          <h3>Material Tray</h3>
          <p>Drag a material onto the board, or click it to place it.</p>
          {(Object.keys(parts) as Part[]).map((part) => (
            <div key={part} className={`material ${placed[part] ? 'used' : ''}`} draggable={!placed[part]} onDragStart={() => setDragged(part)} onClick={() => place(part)}>
              <span>{parts[part].icon}</span><div><b>{parts[part].name}</b><small>{parts[part].sub}</small></div><em>{placed[part] ? '✓' : '↕'}</em>
            </div>
          ))}
          <hr />
          <h3>Select wire colour</h3>
          {(['Red', 'Blue', 'Black'] as Color[]).map((item) => (
            <button key={item} className={`colorChoice ${color === item ? 'active' : ''}`} onClick={() => { setColor(item); setNotice(`${item} wire selected.`); }}>
              <i style={{ background: wire[item] }} /><b>{item}</b><small>{item === 'Red' ? 'Supply / positive' : item === 'Blue' ? 'Control / load' : 'Return / negative'}</small>
            </button>
          ))}
          <div className="notice">{notice}</div>
        </aside>

        <section className="card board">
          <div className="boardTop"><div><b>Illustrated Virtual Control Board</b><small>Low-voltage training simulation</small></div><span>{allPlaced ? '✓ All materials placed' : `${4 - Object.values(placed).filter(Boolean).length} materials left`}</span></div>
          <div className="scene" onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragged) { place(dragged); setDragged(null); } }}>
            <div className="illustrationSlot slotBattery">{placed.battery ? <><strong>🔋</strong><b>12V BATTERY</b></> : <><span>＋</span><small>Place battery</small></>}</div>
            <div className="illustrationSlot slotFuse">{placed.fuse ? <><strong>🛡️</strong><b>FUSE</b></> : <><span>＋</span><small>Place fuse</small></>}</div>
            <div className="illustrationSlot slotSwitch">{placed.switch ? <><strong>⏻</strong><b>SWITCH</b></> : <><span>＋</span><small>Place switch</small></>}</div>
            <div className="illustrationSlot slotLamp">{placed.lamp ? <><strong className={lampOn ? 'lampGlow' : ''}>💡</strong><b>LAMP</b></> : <><span>＋</span><small>Place lamp</small></>}</div>

            <svg className="circuit" viewBox="0 0 1060 570" aria-label="Interactive 12V training circuit">
              <rect x="24" y="25" width="1012" height="520" rx="28" fill="#f8fafc" stroke="#d8dee9" strokeWidth="3" />
              <path d="M80 185 H980" stroke="#e7ebf2" strokeWidth="2" strokeDasharray="7 9" />
              {connections.map(renderWire)}
              {(Object.keys(labels) as Terminal[]).map((terminal) => {
                const [x, y] = terminalPos[terminal];
                return <g key={terminal} className="terminal" onClick={() => connect(terminal)}>
                  <circle cx={x} cy={y} r={selected === terminal ? 17 : 12} fill={selected === terminal ? '#2563eb' : '#ffffff'} stroke={selected === terminal ? '#1d4ed8' : '#344054'} strokeWidth="4" />
                  <text x={x} y={y - 22} textAnchor="middle">{labels[terminal]}</text>
                </g>;
              })}
            </svg>

            <div className="toon batteryArt"><div className="batteryCap positive">+</div><div className="batteryCap negative">−</div><div className="batteryBody"><strong>12V</strong><small>BATTERY</small></div></div>
            <div className="toon fuseArt"><div className="fuseBody"><span>────</span></div><small>FUSE</small></div>
            <div className="toon switchArt"><div className={`switchLever ${switchOn ? 'on' : ''}`} /><div className="switchBase" /><small>{switchOn ? 'ON' : 'OFF'}</small></div>
            <div className={`toon lampArt ${lampOn ? 'powered' : ''}`}><div className="bulb">💡</div><small>{lampOn ? 'LAMP ON' : 'LAMP OFF'}</small></div>
          </div>

          <div className="objective"><b>Connection Objective</b><span>Battery + → Fuse → Switch → Lamp → Battery −</span></div>
          <div className="checks">
            {expected.map((item, index) => {
              const connected = connections.some((connection) => connection.a === item.a && connection.b === item.b);
              return <div key={`${item.a}-${item.b}`} className={connected ? 'check ok' : 'check'}><b>{index + 1}</b><span>{labels[item.a]} → {labels[item.b]}</span><small>Use <strong style={{ color: wire[item.color] }}>{item.color}</strong></small><em>{connected ? '✓ Connected' : 'Not connected'}</em></div>;
            })}
          </div>
          <div className="actions"><span>{complete ? '🟢 Circuit complete. Test the switch.' : 'Complete every connection with the required colour.'}</span><button className="switchButton" disabled={!complete} onClick={() => { const next = !switchOn; setSwitchOn(next); setNotice(next ? '🟢 Switch ON — the lamp is powered.' : 'Switch OFF.'); }}>{switchOn ? '⏻ Switch OFF' : '⏻ Switch ON'}</button>{lampOn && <button className="primary" onClick={onFinish}>Finish practical →</button>}</div>
        </section>
      </div>
    </Shell>
  );
}

function Result({ knowledge, practical, total, percentage, onReset }: { knowledge: number; practical: number; total: number; percentage: number; onReset: () => void }) {
  const level = percentage >= 85 ? 'Advanced' : percentage >= 70 ? 'Proficient' : percentage >= 50 ? 'Developing' : 'Needs Training';
  return <Shell><div className="result"><div className="eyebrow">ASSESSMENT COMPLETE</div><h1>Electrical Competency<br /><span>Performance Report</span></h1><div className="scoreCircle"><b>{percentage}%</b><small>{level}</small></div><div className="resultGrid"><div><small>Knowledge</small><b>{knowledge}/10</b></div><div><small>Practical</small><b>{practical}/60</b></div><div><small>Total</small><b>{total}/70</b></div></div><p>{level === 'Advanced' ? 'Strong electrical fundamentals and practical validation performance.' : 'Use the breakdown to identify areas for further technical training.'}</p><button className="primary big" onClick={onReset}>Retake assessment ↻</button></div></Shell>;
}

const css = `
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f4f7fb;color:#172033}.page{min-height:100vh;padding:0 28px 50px;background:radial-gradient(circle at 50% 0,#fff 0,#f4f7fb 55%)}button{font:inherit;cursor:pointer}.header{max-width:1180px;margin:0 auto;padding:26px 0;display:flex;justify-content:space-between;align-items:center}.header strong{font-size:20px}.eyebrow{font-size:10px;font-weight:800;letter-spacing:2.2px;color:#53627a;text-transform:uppercase}.timer,.counter{background:#151d2f;color:#fff;border-radius:16px;padding:12px 18px;font-weight:800}.counter{text-align:center;min-width:82px}.counter b{display:block;font-size:21px}.counter small{font-size:9px;color:#aeb8ca}.start{max-width:850px;margin:0 auto;padding:16vh 0 8vh;text-align:center}.start h1,.practicalHead h1,.result h1{font-size:58px;line-height:1.02;margin:18px 0;color:#151d2f}.start h1 span,.practicalHead h1 span,.result h1 span{color:#3e63e8}.start p,.practicalHead p{max-width:700px;margin:0 auto 28px;color:#69768b;font-size:17px;line-height:1.7}.stats{display:flex;justify-content:center;gap:14px;margin:32px 0}.stats b{min-width:130px;background:#fff;border:1px solid #e4e8ef;border-radius:16px;padding:17px;font-size:25px}.stats small{display:block;font-size:11px;color:#7b8799;font-weight:600;margin-top:5px}.primary{border:0;border-radius:12px;background:#3863ed;color:#fff;padding:13px 19px;font-weight:800;box-shadow:0 8px 20px #3863ed2a}.primary:disabled{opacity:.4;cursor:not-allowed}.big{padding:16px 28px;font-size:16px}.offline{display:block;margin-top:18px;color:#718096}.progress{max-width:1180px;height:6px;background:#e5e9f0;margin:0 auto 30px;border-radius:10px}.progress i{display:block;height:100%;background:#3863ed;border-radius:10px}.quiz{max-width:1050px;margin:0 auto;display:grid;grid-template-columns:1fr 280px;gap:20px}.card{background:#fff;border:1px solid #e2e7ef;border-radius:20px;box-shadow:0 12px 35px #1a2a4a0c}.questionCard{padding:34px}.meta{color:#647187;font-size:12px;font-weight:800}.meta span{float:right}.questionCard h2{font-size:28px;margin:30px 0}.options{display:grid;gap:12px}.options button{display:flex;align-items:center;gap:15px;text-align:left;border:1px solid #dce2eb;background:#fff;padding:16px;border-radius:13px}.options button:hover,.options button.selected{border-color:#3863ed;background:#f4f7ff}.options b{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:#eef2f8}.nav{display:flex;justify-content:space-between;margin-top:28px}.nav>button:first-child{border:1px solid #dce2eb;background:#fff;border-radius:12px;padding:12px 16px}.stages{padding:26px;height:max-content}.stages p{padding:17px 0;border-bottom:1px solid #edf0f4;color:#6c7890}.stages strong,.stages small{display:block;margin-top:4px}.stages small{font-size:11px}.practicalHead{max-width:1180px;margin:20px auto 28px;display:flex;justify-content:space-between;align-items:end}.practicalHead h1{font-size:43px;margin:12px 0}.practicalHead p{margin:0;max-width:780px}.work{max-width:1180px;margin:auto;display:grid;grid-template-columns:275px 1fr;gap:18px}.tray{padding:22px}.tray h3{margin:0 0 8px}.tray p{font-size:12px;color:#778399;line-height:1.5}.material{display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #e2e7ef;border-radius:12px;margin:9px 0;background:#fff}.material span{font-size:23px}.material div{flex:1}.material b,.material small{display:block}.material small{font-size:10px;color:#7b8799;margin-top:2px}.material em{font-style:normal;color:#3863ed}.material.used{opacity:.55;background:#f6f8fb}.tray hr{border:0;border-top:1px solid #e8ebf1;margin:20px 0}.colorChoice{width:100%;display:grid;grid-template-columns:16px 1fr;grid-template-rows:auto auto;text-align:left;column-gap:9px;padding:10px;border:1px solid #e0e5ed;background:#fff;border-radius:11px;margin:7px 0}.colorChoice i{grid-row:1/3;width:12px;height:12px;border-radius:50%;margin-top:4px}.colorChoice small{grid-column:2;color:#7b8799;font-size:9px}.colorChoice.active{border-color:#3863ed;box-shadow:0 0 0 2px #3863ed17}.notice{margin-top:14px;background:#f2f5fa;border-radius:12px;padding:12px;font-size:11px;line-height:1.5;color:#59667c}.board{padding:18px;overflow:hidden}.boardTop{display:flex;justify-content:space-between;align-items:center;padding:5px 6px 14px}.boardTop b,.boardTop small{display:block}.boardTop small{font-size:10px;color:#7c879a;margin-top:3px}.boardTop span{font-size:11px;color:#228b55;font-weight:800}.scene{position:relative;min-height:550px;border-radius:18px;background:#e9eef5;overflow:hidden}.illustrationSlot{position:absolute;z-index:3;top:24px;width:130px;height:76px;border:2px dashed #aab5c7;background:#ffffffc9;border-radius:13px;display:grid;place-items:center;text-align:center}.illustrationSlot strong{font-size:23px}.illustrationSlot b,.illustrationSlot small{display:block;font-size:9px}.slotBattery{left:5%}.slotFuse{left:29%}.slotSwitch{left:53%}.slotLamp{left:77%}.circuit{position:absolute;inset:0;width:100%;height:100%;z-index:1}.terminal{cursor:pointer}.terminal text{font-size:12px;font-weight:800;fill:#344054}.toon{position:absolute;z-index:2;text-align:center;font-weight:800}.batteryArt{left:8%;top:48%;width:115px}.batteryBody{height:105px;background:linear-gradient(90deg,#38445b,#66758f);border-radius:10px;padding:25px 8px;color:#fff;box-shadow:inset 0 0 0 4px #252f43,0 8px 18px #25344a25}.batteryBody strong{font-size:25px;display:block}.batteryBody small{font-size:8px}.batteryCap{position:absolute;top:-13px;width:30px;height:24px;border-radius:4px;color:#fff}.positive{left:12px;background:#e53935}.negative{right:12px;background:#111827}.fuseArt{left:36%;top:48%;width:100px}.fuseBody{height:45px;border:4px solid #c5ceda;border-radius:30px;background:#f8fafc;display:grid;place-items:center;color:#c99725}.fuseArt small,.switchArt small,.lampArt small{font-size:9px;display:block;margin-top:8px}.switchArt{left:59%;top:47%;width:90px}.switchBase{height:17px;background:#27344a;border-radius:10px}.switchLever{height:8px;width:55px;background:#e53935;transform:rotate(-32deg);transform-origin:left center;margin:0 auto 12px;border-radius:8px;transition:.2s}.switchLever.on{transform:rotate(0deg);background:#27a55b}.lampArt{right:7%;top:44%;width:110px}.bulb{font-size:66px;filter:grayscale(1);transition:.25s}.lampArt.powered .bulb{filter:none;transform:scale(1.08);text-shadow:0 0 30px #ffd34e}.objective{display:flex;gap:12px;align-items:center;padding:14px 4px;border-bottom:1px solid #e9edf2}.objective b{font-size:12px}.objective span{font-size:11px;color:#68758a}.checks{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:14px 0}.check{border:1px solid #e3e7ee;border-radius:11px;padding:10px}.check b{font-size:11px}.check span{display:block;font-size:10px;font-weight:800;margin:6px 0}.check small,.check em{font-size:9px;color:#778399;font-style:normal}.check em{float:right}.check.ok{border-color:#a9dfc1;background:#f4fcf7}.check.ok em{color:#198754;font-weight:800}.actions{display:flex;align-items:center;gap:10px;padding-top:10px}.actions>span{flex:1;font-size:11px;color:#68758a}.switchButton{border:1px solid #dce2eb;background:#fff;border-radius:10px;padding:11px 14px;font-weight:800}.switchButton:disabled{opacity:.45;cursor:not-allowed}.result{max-width:800px;margin:0 auto;text-align:center;padding:12vh 0}.scoreCircle{width:180px;height:180px;border-radius:50%;background:#151d2f;color:#fff;display:grid;place-items:center;margin:35px auto}.scoreCircle b{font-size:44px}.scoreCircle small{margin-top:-55px;color:#b8c2d2}.resultGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.resultGrid div{background:#fff;border:1px solid #e1e6ee;border-radius:14px;padding:18px}.resultGrid small,.resultGrid b{display:block}.resultGrid b{font-size:24px;margin-top:6px}.result p{color:#6e7a8e;margin:25px}.lampGlow{filter:none!important}
@media(max-width:850px){.quiz,.work{grid-template-columns:1fr}.stages{display:none}.practicalHead{align-items:start;gap:15px}.practicalHead h1,.start h1,.result h1{font-size:38px}.checks{grid-template-columns:1fr 1fr}.stats{flex-wrap:wrap}.scene{min-height:470px}.objective{flex-direction:column;align-items:start}.actions{flex-wrap:wrap}.actions>span{flex-basis:100%}}
`;
