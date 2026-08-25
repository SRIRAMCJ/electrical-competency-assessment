import { useEffect, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

type Question = { q: string; options: string[]; answer: string };
type Color = 'Red' | 'Blue' | 'Black';
type Part = 'battery' | 'fuse' | 'switch' | 'lamp';
type Terminal = 'bp' | 'bm' | 'fi' | 'fo' | 'si' | 'so' | 'lp' | 'lm';
type Connection = { a: Terminal; b: Terminal; color: Color };

type QuizProps = {
  qi: number;
  setQi: (value: number) => void;
  answers: Record<number, string>;
  setAnswers: Dispatch<SetStateAction<Record<number, string>>>;
  time: number;
  onDone: () => void;
};

type PracticalProps = {
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
};

const questions: Question[] = [
  { q: 'What is the SI unit of electrical current?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], answer: 'Ampere' },
  { q: 'Which instrument measures electrical current?', options: ['Voltmeter', 'Ammeter', 'Ohmmeter', 'Wattmeter'], answer: 'Ammeter' },
  { q: 'Which equation represents Ohm’s law?', options: ['V = I × R', 'P = V × I', 'R = V × I', 'I = V × R'], answer: 'V = I × R' },
  { q: 'What is the SI unit of resistance?', options: ['Ampere', 'Volt', 'Ohm', 'Watt'], answer: 'Ohm' },
  { q: 'What is the primary purpose of a fuse?', options: ['Increase voltage', 'Protect against excessive current', 'Store energy', 'Measure current'], answer: 'Protect against excessive current' },
  { q: 'In a series circuit, total resistance is:', options: ['The sum of resistances', 'Always zero', 'The smallest resistance', 'The largest resistance'], answer: 'The sum of resistances' },
  { q: 'Which current periodically changes direction?', options: ['DC', 'AC', 'Static current', 'Leakage current'], answer: 'AC' },
  { q: 'What is the SI unit of electrical power?', options: ['Watt', 'Ohm', 'Coulomb', 'Ampere'], answer: 'Watt' },
  { q: 'In an ideal parallel circuit, what is common across each branch?', options: ['Voltage', 'Resistance', 'Power', 'Energy'], answer: 'Voltage' },
  { q: 'Which device opens or closes an electrical circuit?', options: ['Transformer', 'Switch', 'Resistor', 'Capacitor'], answer: 'Switch' },
];

const parts: Record<Part, { name: string; icon: string; sub: string }> = {
  battery: { name: '12V Battery', icon: '🔋', sub: 'DC source' },
  fuse: { name: 'Fuse', icon: '🛡️', sub: 'Protection' },
  switch: { name: 'Switch', icon: '⏻', sub: 'Control' },
  lamp: { name: 'Lamp', icon: '💡', sub: 'Load' },
};

const labels: Record<Terminal, string> = {
  bp: 'BAT +', bm: 'BAT −', fi: 'FUSE IN', fo: 'FUSE OUT',
  si: 'SW IN', so: 'SW OUT', lp: 'LAMP +', lm: 'LAMP −',
};

const expected: Connection[] = [
  { a: 'bp', b: 'fi', color: 'Red' },
  { a: 'fo', b: 'si', color: 'Red' },
  { a: 'so', b: 'lp', color: 'Blue' },
  { a: 'lm', b: 'bm', color: 'Black' },
];

const wire: Record<Color, string> = {
  Red: '#e53935', Blue: '#2563eb', Black: '#111827',
};

const terminalPos: Record<Terminal, [number, number]> = {
  bp: [95, 270], bm: [95, 500], fi: [315, 270], fo: [455, 270],
  si: [595, 270], so: [715, 270], lp: [925, 270], lm: [925, 500],
};

export default function App() {
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState<'quiz' | 'practical' | 'result'>('quiz');
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [time, setTime] = useState(600);
  const [placed, setPlaced] = useState<Record<Part, boolean>>({ battery: false, fuse: false, switch: false, lamp: false });
  const [connections, setConnections] = useState<Connection[]>([]);
  const [color, setColor] = useState<Color>('Red');
  const [selected, setSelected] = useState<Terminal | null>(null);
  const [errors, setErrors] = useState(0);
  const [switchOn, setSwitchOn] = useState(false);
  const [notice, setNotice] = useState('Pick every material from the tray and place it on the board.');

  useEffect(() => {
    if (!started || stage !== 'quiz') return;
    const id = window.setInterval(() => {
      setTime((value) => {
        if (value <= 1) {
          setStage('practical');
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [started, stage]);

  const knowledge = questions.reduce((score, question, index) => score + (answers[index] === question.answer ? 1 : 0), 0);
  const complete = connections.length === expected.length;
  const allPlaced = Object.values(placed).every(Boolean);
  const lampOn = complete && switchOn;
  const practical = Math.max(0, Math.min(60, connections.length * 10 + (complete ? 20 : 0) - errors * 2));
  const total = knowledge + practical;
  const percentage = Math.round((total / 70) * 100);

  const reset = () => {
    setStarted(false);
    setStage('quiz');
    setQi(0);
    setAnswers({});
    setTime(600);
    setPlaced({ battery: false, fuse: false, switch: false, lamp: false });
    setConnections([]);
    setColor('Red');
    setSelected(null);
    setErrors(0);
    setSwitchOn(false);
    setNotice('Pick every material from the tray and place it on the board.');
  };

  if (!started) return <Start onStart={() => setStarted(true)} />;
  if (stage === 'quiz') return <Quiz qi={qi} setQi={setQi} answers={answers} setAnswers={setAnswers} time={time} onDone={() => setStage('practical')} />;
  if (stage === 'result') return <Result knowledge={knowledge} practical={practical} total={total} percentage={percentage} reset={reset} />;

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

function Quiz({ qi, setQi, answers, setAnswers, time, onDone }: QuizProps) {
  const q = questions[qi];
  const mm = String(Math.floor(time / 60)).padStart(2, '0');
  const ss = String(time % 60).padStart(2, '0');

  return (
    <Shell>
      <Header title="Electrical Fundamentals" timer={`${mm}:${ss}`} />
      <div className="bar"><i style={{ width: `${(qi + 1) * 10}%` }} /></div>
      <main className="quiz">
        <section className="card">
          <div className="meta">Question {qi + 1} / 10 <span>MCQ • 1 point</span></div>
          <h2>{q.q}</h2>
          <div className="opts">
            {q.options.map((option, index) => (
              <button key={option} className={answers[qi] === option ? 'sel' : ''} onClick={() => setAnswers((current) => ({ ...current, [qi]: option }))}>
                <b>{String.fromCharCode(65 + index)}</b>{option}
              </button>
            ))}
          </div>
          <div className="nav">
            <button disabled={!qi} onClick={() => setQi(qi - 1)}>← Previous</button>
            <button className="primary" disabled={!answers[qi]} onClick={() => qi === 9 ? onDone() : setQi(qi + 1)}>
              {qi === 9 ? 'Continue to practical →' : 'Next →'}
            </button>
          </div>
        </section>
        <aside className="card stages">
          <b>Assessment</b>
          <p>01 <strong>Fundamentals</strong><small>10 electrical MCQs</small></p>
          <p>02 <strong>Practical wiring</strong><small>Pick, place & connect</small></p>
          <p>03 <strong>Performance report</strong><small>Score & competency</small></p>
        </aside>
      </main>
    </Shell>
  );
}

function Practical({
  placed, setPlaced, connections, setConnections, color, setColor, selected, setSelected,
  errors, setErrors, switchOn, setSwitchOn, notice, setNotice, allPlaced, complete, lampOn, onFinish,
}: PracticalProps) {
  const [drag, setDrag] = useState<Part | null>(null);

  const place = (part: Part) => {
    if (placed[part]) return;
    setPlaced((current) => ({ ...current, [part]: true }));
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
      (item.a === selected && item.b === terminal) || (item.a === terminal && item.b === selected),
    );

    if (!expectedConnection) {
      setErrors(errors + 1);
      setSelected(null);
      setNotice('❌ Incorrect terminal pair. Follow the connection objective.');
      return;
    }

    const alreadyConnected = connections.some((item) =>
      (item.a === expectedConnection.a && item.b === expectedConnection.b) ||
      (item.a === expectedConnection.b && item.b === expectedConnection.a),
    );

    if (alreadyConnected) {
      setSelected(null);
      setNotice('That connection is already completed.');
      return;
    }

    if (color !== expectedConnection.color) {
      setErrors(errors + 1);
      setSelected(null);
      setNotice(`❌ Wrong colour. ${labels[expectedConnection.a]} → ${labels[expectedConnection.b]} requires ${expectedConnection.color}.`);
      return;
    }

    const next = [...connections, expectedConnection];
    setConnections(next);
    setSelected(null);
    setNotice(next.length === expected.length ? '🟢 Wiring complete. Turn the switch ON to test the lamp.' : '✓ Correct connection. Continue wiring the circuit.');
  };

  const renderWire = (connection: Connection, index: number) => {
    const [x1, y1] = terminalPos[connection.a];
    const [x2, y2] = terminalPos[connection.b];
    return (
      <g key={index}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="14" strokeLinecap="round" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={wire[connection.color]} strokeWidth="9" strokeLinecap="round" />
      </g>
    );
  };

  return (
    <Shell>
      <Header title="Practical Validation" />
      <div className="prHead">
        <div>
          <div className="eyebrow">STAGE 2 • PICK & PLACE + WIRING</div>
          <h1>Build the <span>12V Control Circuit</span></h1>
          <p>Use the illustrated components below. Place every material, select the required wire colour, then connect the terminals.</p>
        </div>
        <div className="counter"><b>{connections.length}/4</b><small>connections</small></div>
      </div>

      <div className="work">
        <aside className="card tray">
          <h3>Material Tray</h3>
          <p>Drag a component to the board, or click it to place it.</p>
          {(Object.keys(parts) as Part[]).map((id) => (
            <div
              key={id}
              className={`part ${placed[id] ? 'used' : ''}`}
              draggable={!placed[id]}
              onDragStart={() => setDrag(id)}
              onDragEnd={() => setDrag(null)}
              onClick={() => place(id)}
            >
              <span>{parts[id].icon}</span>
              <div><b>{parts[id].name}</b><small>{parts[id].sub}</small></div>
              <em>{placed[id] ? '✓' : '↕'}</em>
            </div>
          ))}

          <hr />
          <h3>Wire colour</h3>
          {(['Red', 'Blue', 'Black'] as Color[]).map((wireColor) => (
            <button
              key={wireColor}
              className={`color ${color === wireColor ? 'active' : ''}`}
              onClick={() => { setColor(wireColor); setNotice(`${wireColor} wire selected.`); }}
            >
              <i style={{ background: wire[wireColor] }} />
              <b>{wireColor}</b>
              <small>{wireColor === 'Red' ? 'Supply / positive' : wireColor === 'Blue' ? 'Control / load' : 'Return / negative'}</small>
            </button>
          ))}
          <div className="notice">{notice}</div>
        </aside>

        <section className="card board">
          <div className="boardTop">
            <div><b>Illustrated Virtual Control Board</b><small>12V DC training simulation</small></div>
            <span>{allPlaced ? 'All materials placed ✓' : `${4 - Object.values(placed).filter(Boolean).length} materials left`}</span>
          </div>

          <div
            className="scene"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => { if (drag) place(drag); setDrag(null); }}
          >
            {(['battery', 'fuse', 'switch', 'lamp'] as Part[]).map((id, index) => (
              <div
                key={id}
                className={`slot s${index + 1}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.stopPropagation(); if (drag) place(drag); setDrag(null); }}
                onClick={() => !placed[id] && place(id)}
              >
                {placed[id] ? <><strong>{parts[id].icon}</strong><b>{parts[id].name.toUpperCase()}</b></> : <>＋<small>Place {parts[id].name}</small></>}
              </div>
            ))}

            <svg className="circuit" viewBox="0 0 1020 590" aria-label="Interactive 12V circuit board">
              {connections.map(renderWire)}
              {(Object.keys(labels) as Terminal[]).map((terminal) => {
                const [x, y] = terminalPos[terminal];
                const active = selected === terminal;
                return (
                  <g className="term" onClick={() => connect(terminal)} key={terminal}>
                    <circle cx={x} cy={y} r={active ? 15 : 11} fill={active ? '#2563eb' : '#fff'} stroke={active ? '#1d4ed8' : '#344054'} strokeWidth="4" />
                    <text x={x} y={y - 22} textAnchor="middle">{labels[terminal]}</text>
                  </g>
                );
              })}
            </svg>

            <div className="component batteryVisual">
              <div className="cap red">+</div><div className="cap black">−</div>
              <div className="batteryBody"><b>12V</b><small>DC BATTERY</small></div>
            </div>
            <div className="component fuseVisual"><div className="glass">────</div><small>FUSE</small></div>
            <div className="component switchVisual"><div className={`lever ${switchOn ? 'on' : ''}`}>╱</div><small>{switchOn ? 'ON' : 'OFF'}</small></div>
            <div className={`component lampVisual ${lampOn ? 'glow' : ''}`}><div className="bulb">💡</div><small>{lampOn ? 'ON' : 'OFF'}</small></div>
          </div>

          <div className="objective"><b>Connection Objective</b><span>Battery + → Fuse → Switch → Lamp → Battery −</span></div>

          <div className="checks">
            {expected.map((item, index) => {
              const ok = connections.some((connection) => connection.a === item.a && connection.b === item.b);
              return (
                <div key={index} className={ok ? 'ok' : ''}>
                  <b>{index + 1}</b><span>{labels[item.a]} → {labels[item.b]}</span>
                  <small>Use <strong style={{ color: wire[item.color] }}>{item.color}</strong></small>
                  <em>{ok ? '✓ Connected' : 'Not connected'}</em>
                </div>
              );
            })}
          </div>

          <div className="actions">
            <span>{complete ? '🟢 All connections correct — test the circuit.' : 'Complete all connections with the required colours.'}</span>
            <button className="switchBtn" disabled={!complete} onClick={() => { setSwitchOn(!switchOn); setNotice(!switchOn ? '🟢 Switch ON — lamp powered.' : 'Switch OFF.'); }}>
              {switchOn ? '⏻ Switch OFF' : '⏻ Switch ON'}
            </button>
            {lampOn && <button className="primary" onClick={onFinish}>Finish practical →</button>}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Result({ knowledge, practical, total, percentage, reset }: { knowledge: number; practical: number; total: number; percentage: number; reset: () => void }) {
  const level = percentage >= 85 ? 'Advanced' : percentage >= 70 ? 'Proficient' : percentage >= 50 ? 'Developing' : 'Needs Training';
  return (
    <Shell>
      <div className="result">
        <div className="eyebrow">ASSESSMENT COMPLETE</div>
        <h1>Electrical Competency<br /><span>Performance Report</span></h1>
        <div className="circle"><b>{percentage}%</b><small>{level}</small></div>
        <div className="resultGrid">
          <div><small>Knowledge</small><b>{knowledge}/10</b></div>
          <div><small>Practical</small><b>{practical}/60</b></div>
          <div><small>Total</small><b>{total}/70</b></div>
        </div>
        <p>{percentage >= 85 ? 'Strong fundamentals and practical validation.' : percentage >= 70 ? 'Good foundation; continue equipment-specific training.' : 'Additional electrical fundamentals and supervised practical training are recommended.'}</p>
        <button className="primary big" onClick={reset}>Retake assessment</button>
      </div>
    </Shell>
  );
}

function Header({ title, timer }: { title: string; timer?: string }) {
  return <header><div><div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div><h2>{title}</h2></div>{timer && <div className="timer">TIME <b>{timer}</b></div>}</header>;
}

const css = `
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;color:#172033;background:#f4f7fb}.page{min-height:100vh;padding:32px 28px;background:radial-gradient(circle at 80% 10%,#edf3ff,transparent 35%),#f7f9fc}header{max-width:1180px;margin:0 auto 20px;display:flex;justify-content:space-between;align-items:center}header h2{margin:5px 0;font-size:25px}.timer{background:#101828;color:#fff;padding:10px 15px;border-radius:12px;font-size:9px}.timer b{display:block;font-size:20px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:2px;color:#475467}.start,.result{max-width:900px;margin:8vh auto;background:#fff;padding:55px;border:1px solid #e3e8ef;border-radius:28px;box-shadow:0 25px 70px #17203314}.start h1,.result h1{font-size:54px;line-height:1.03;margin:15px 0}.start h1 span,.result h1 span,.prHead h1 span{color:#3567e8}.start p{font-size:18px;color:#667085;line-height:1.7}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:30px 0}.stats b{padding:18px;background:#f8fafc;border:1px solid #eaecf0;border-radius:14px;font-size:24px}.stats small{display:block;font-size:11px;color:#667085;margin-top:5px}.primary{border:0;background:#175cd3;color:#fff;border-radius:11px;padding:12px 18px;font-weight:800;cursor:pointer}.primary:disabled{opacity:.45}.big{padding:15px 24px;font-size:16px}.offline{display:block;color:#667085;margin-top:15px}.bar{height:6px;max-width:1180px;margin:0 auto 22px;background:#e4e7ec;border-radius:9px;overflow:hidden}.bar i{display:block;height:100%;background:#3567e8}.quiz{max-width:1180px;margin:auto;display:grid;grid-template-columns:1fr 300px;gap:20px}.card{background:#fff;border:1px solid #e3e8ef;border-radius:20px;padding:26px;box-shadow:0 12px 35px #1720330b}.meta{font-size:12px;color:#667085;font-weight:800}.meta span{float:right}.card h2{font-size:31px;margin:28px 0}.opts{display:grid;gap:11px}.opts button{display:flex;gap:14px;align-items:center;text-align:left;background:#fff;border:1px solid #d0d5dd;border-radius:13px;padding:16px;font-size:16px;cursor:pointer}.opts button.sel,.opts button:hover{border-color:#3567e8;background:#eff6ff}.opts b{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:#f2f4f7}.nav{display:flex;justify-content:space-between;margin-top:25px}.nav button:not(.primary){border:1px solid #d0d5dd;background:#fff;border-radius:11px;padding:11px 16px}.stages p{padding:14px 0;border-bottom:1px solid #eaecf0}.stages strong,.stages small{display:block;margin-left:20px}.stages small{color:#667085;margin-top:3px}.prHead{max-width:1180px;margin:0 auto 18px;display:flex;justify-content:space-between;align-items:center}.prHead h1{font-size:42px;margin:10px 0}.prHead p{color:#667085}.counter{background:#101828;color:#fff;border-radius:16px;padding:14px 24px;text-align:center}.counter b{font-size:22px;display:block}.counter small{font-size:9px}.work{max-width:1180px;margin:auto;display:grid;grid-template-columns:280px 1fr;gap:18px}.tray h3{margin:0 0 5px}.tray>p{font-size:12px;color:#667085}.part{display:flex;align-items:center;gap:10px;border:1px solid #d0d5dd;border-radius:12px;padding:11px;margin:9px 0;cursor:grab}.part>span{font-size:25px}.part small{display:block;color:#667085}.part em{margin-left:auto;color:#98a2b3}.part.used{opacity:.55;background:#f8fafc}.tray hr{border:0;border-top:1px solid #eaecf0;margin:18px 0}.color{width:100%;display:grid;grid-template-columns:18px 1fr;text-align:left;column-gap:9px;border:1px solid #d0d5dd;background:#fff;border-radius:11px;padding:10px;margin:7px 0;cursor:pointer}.color i{width:14px;height:14px;border-radius:50%;grid-row:1/3}.color small{grid-column:2;color:#667085}.color.active{border:2px solid #3567e8}.notice{margin-top:14px;background:#f2f4f7;border-radius:11px;padding:12px;font-size:12px}.board{padding:18px}.boardTop{display:flex;justify-content:space-between;margin:5px 4px 12px}.boardTop small{display:block;color:#667085;margin-top:4px}.boardTop span{font-size:11px;color:#027a48;font-weight:800}.scene{height:540px;position:relative;overflow:hidden;border-radius:16px;border:1px solid #d7dde6;background:linear-gradient(145deg,#fff9e9,#f4ead0)}.scene:before{content:'';position:absolute;inset:0;background-image:radial-gradient(#c6bda8 1px,transparent 1px);background-size:18px 18px;opacity:.35}.slot{position:absolute;z-index:5;top:22px;width:18%;height:82px;border:2px dashed #9aa4b2;border-radius:14px;background:#ffffffcc;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#667085}.slot strong{font-size:27px}.slot small{font-size:10px}.s1{left:3%}.s2{left:27%}.s3{left:51%}.s4{left:75%}.circuit{position:absolute;inset:110px 0 0;width:100%;height:430px;z-index:6}.term{cursor:pointer}.term text{font-size:10px;font-weight:800;fill:#344054}.component{position:absolute;z-index:4;text-align:center}.component small{display:block;font-weight:900;font-size:10px;color:#344054}.batteryVisual{left:7%;top:255px;width:90px}.cap{position:absolute;top:-12px;width:22px;height:22px;border-radius:50%;color:#fff;font-weight:900}.cap.red{left:14px;background:#e53935}.cap.black{right:14px;background:#111827}.batteryBody{height:80px;border-radius:12px;background:linear-gradient(#4b5563,#111827);color:#fff;display:grid;place-content:center;border:4px solid #9ca3af;box-shadow:0 8px 15px #0002}.batteryBody b{font-size:25px}.batteryBody small{color:#fff}.fuseVisual{left:35%;top:260px}.glass{width:85px;height:35px;border-radius:9px;border:5px solid #475467;background:linear-gradient(90deg,#dbeafe,#fff,#dbeafe);display:grid;place-items:center;color:#475467;font-weight:900}.switchVisual{left:56%;top:250px;width:80px}.lever{margin:auto;width:60px;height:60px;border-radius:12px;background:#303b4f;color:#fff;font-size:45px;line-height:60px;transition:.2s}.lever.on{background:#027a48;transform:rotate(-12deg)}.lampVisual{left:82%;top:238px;width:70px}.bulb{font-size:55px;filter:grayscale(1)}.lampVisual.glow .bulb{filter:drop-shadow(0 0 16px #fbbf24)}.objective{display:flex;justify-content:space-between;background:#fff3b8;border:1px solid #edc84a;border-radius:10px;padding:12px 16px;margin-top:10px;font-size:12px}.objective span{font-weight:800}.checks{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.checks div{border:1px solid #e4e7ec;border-radius:10px;padding:10px;font-size:11px}.checks div.ok{border-color:#86efac;background:#f0fdf4}.checks b{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#f2f4f7;margin-right:5px}.checks span{font-weight:800}.checks small,.checks em{display:block;color:#667085;margin-top:6px;font-style:normal}.checks em{color:#b42318}.checks .ok em{color:#027a48}.actions{display:flex;align-items:center;gap:9px;padding-top:13px}.actions>span{flex:1;font-size:12px;color:#667085}.switchBtn{border:1px solid #d0d5dd;background:#fff;border-radius:10px;padding:11px 14px;font-weight:800;cursor:pointer}.switchBtn:disabled{opacity:.45}.result{text-align:center}.circle{width:160px;height:160px;margin:28px auto;border-radius:50%;display:grid;place-content:center;background:#eff6ff;border:10px solid #bfdbfe}.circle b{font-size:38px}.circle small{color:#175cd3;font-weight:900}.resultGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.resultGrid div{background:#f8fafc;padding:18px;border-radius:12px;text-align:left}.resultGrid small{display:block;color:#667085}.resultGrid b{font-size:22px}@media(max-width:900px){.quiz,.work{grid-template-columns:1fr}.stats,.resultGrid,.checks{grid-template-columns:repeat(2,1fr)}.start,.result{padding:30px}.start h1,.result h1{font-size:40px}.prHead{display:block}.scene{height:700px}.slot{position:relative;left:auto;top:auto;width:45%;display:inline-flex;margin:8px 2%;height:70px}.circuit{top:170px}.actions,.objective{flex-wrap:wrap}.actions>span{flex-basis:100%}}
`;
