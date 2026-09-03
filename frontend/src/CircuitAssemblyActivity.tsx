import { useMemo, useState } from 'react';

type Part = 'battery' | 'ammeter' | 'lamp' | 'variableResistor';
type Terminal = 'bp' | 'bm' | 'ai' | 'ao' | 'lp' | 'lm' | 'rp' | 'rm';
type Connection = [Terminal, Terminal];

const parts: Record<Part, { name: string; symbol: string }> = {
  battery: { name: 'Battery', symbol: '🔋' },
  ammeter: { name: 'Ammeter', symbol: 'A' },
  lamp: { name: 'Bulb', symbol: '💡' },
  variableResistor: { name: 'Variable resistor', symbol: '▱' },
};

const labels: Record<Terminal, string> = {
  bp: 'BAT +',
  bm: 'BAT −',
  ai: 'A IN',
  ao: 'A OUT',
  lp: 'LAMP +',
  lm: 'LAMP −',
  rp: 'R IN',
  rm: 'R OUT',
};

const target: Connection[] = [
  ['bp', 'ai'],
  ['ao', 'lp'],
  ['lm', 'rp'],
  ['rm', 'bm'],
];

const wireColor = '#172033';

export default function CircuitAssemblyActivity({ onFinish }: { onFinish: (score: number) => void }) {
  const [placed, setPlaced] = useState<Record<Part, boolean>>({ battery: false, ammeter: false, lamp: false, variableResistor: false });
  const [dragged, setDragged] = useState<Part | null>(null);
  const [selected, setSelected] = useState<Terminal | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [errors, setErrors] = useState(0);
  const [message, setMessage] = useState('');

  const allPlaced = Object.values(placed).every(Boolean);
  const complete = connections.length === target.length;
  const score = Math.max(0, Math.round(100 - errors * 8 - (5 - connections.length) * 4));
  const connected = useMemo(() => new Set(connections.flat()), [connections]);

  const place = (part: Part) => {
    setPlaced(v => ({ ...v, [part]: true }));
    setMessage('');
  };

  const connect = (terminal: Terminal) => {
    if (!allPlaced) return;
    if (!selected) {
      setSelected(terminal);
      return;
    }
    if (selected === terminal) {
      setSelected(null);
      return;
    }
    const correct = target.some(([a, b]) => (a === selected && b === terminal) || (a === terminal && b === selected));
    if (!correct) {
      setErrors(v => v + 1);
      setSelected(null);
      setMessage('Connection incorrect. Try another terminal.');
      return;
    }
    const exists = connections.some(([a, b]) => (a === selected && b === terminal) || (a === terminal && b === selected));
    if (!exists) setConnections(v => [...v, [selected, terminal]]);
    setSelected(null);
  };

  const resetPart = (part: Part) => {
    setPlaced(v => ({ ...v, [part]: false }));
    const terminals: Record<Part, Terminal[]> = {
      battery: ['bp', 'bm'], ammeter: ['ai', 'ao'], lamp: ['lp', 'lm'], variableResistor: ['rp', 'rm']
    };
    setConnections(v => v.filter(([a, b]) => !terminals[part].includes(a) && !terminals[part].includes(b)));
    setSelected(null);
  };

  const terminal = (t: Terminal) => (
    <button
      key={t}
      className={`circuit-port ${selected === t ? 'selected' : ''} ${connected.has(t) ? 'connected' : ''}`}
      onClick={() => connect(t)}
      aria-label={`Terminal ${labels[t]}`}
      title={labels[t]}
    >
      <span />
      <strong>{labels[t]}</strong>
    </button>
  );

  return <div className="page circuitPage"><style>{styles}</style>
    <header className="header"><div><div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div><strong>Practical Circuit Assembly</strong></div><div className="circuitBadge">04</div></header>
    <main className="circuitWrap">
      <div className="circuitIntro"><div><div className="eyebrow">ACTIVITY 4 • CIRCUIT ASSEMBLY</div><h1>Assemble the <span>circuit</span></h1></div><div className="circuitScore"><b>{connections.length}/4</b><small>connections</small></div></div>
      <div className="circuitLayout">
        <aside className="circuitTray">
          <h3>Materials</h3>
          {(Object.keys(parts) as Part[]).map(part => <div key={part} className={`circuitMaterial ${placed[part] ? 'used' : ''}`} draggable={!placed[part]} onDragStart={() => setDragged(part)} onClick={() => place(part)}><span className={`materialSymbol ${part}`}>{parts[part].symbol}</span><b>{parts[part].name}</b>{placed[part] && <em>✓</em>}</div>)}
          {message && <div className="circuitMessage">{message}</div>}
          {complete && <button className="primary circuitFinish" onClick={() => onFinish(score)}>Complete activity →</button>}
        </aside>
        <section className="circuitBoard" onDragOver={e => e.preventDefault()} onDrop={() => { if (dragged) { place(dragged); setDragged(null); } }}>
          <div className="blankBoard">
            {(Object.keys(parts) as Part[]).map((part, i) => {
              const slot = ['battery','ammeter','lamp','variableResistor'][i] as Part;
              return <div key={part} className={`dropSlot ${placed[part] ? 'filled' : ''} ${slot}`} onDragOver={e => e.preventDefault()} onDrop={() => { place(part); setDragged(null); }}>
                {placed[part] ? <div className={`drawPart ${part}`}>
                  {part === 'battery' && <><i className="batterySymbol">+ −</i><b>BATTERY</b></>}
                  {part === 'ammeter' && <><i>A</i><b>AMMETER</b></>}
                  {part === 'lamp' && <><i className="bulb">💡</i><b>BULB</b></>}
                  {part === 'variableResistor' && <><i className="resistorSymbol">▱</i><b>VARIABLE RESISTOR</b></>}
                  <button className="removeCircuitPart" onClick={() => resetPart(part)}>×</button>
                </div> : <><span className="dropPlus">+</span><small>Drop component</small></>}
              </div>;
            })}
            <svg className="circuitWires" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
              {connections.map(([a,b], i) => { const pos: Record<Terminal,[number,number]> = {
                bp:[105,304], bm:[155,304],
                ai:[335,304], ao:[385,304],
                lp:[575,304], lm:[625,304],
                rp:[805,454], rm:[855,454]
              }; const [x1,y1]=pos[a], [x2,y2]=pos[b]; const mx=(x1+x2)/2; return <path key={i} d={`M ${x1} ${y1} C ${mx} ${y1-35}, ${mx} ${y2+35}, ${x2} ${y2}`} stroke={wireColor} strokeWidth="6" fill="none" strokeLinecap="round"/>; })}
            </svg>
            {allPlaced && <div className="portsLayer">
              <div className="portPosition bp">{terminal('bp')}</div><div className="portPosition bm">{terminal('bm')}</div>
              <div className="portPosition ai">{terminal('ai')}</div><div className="portPosition ao">{terminal('ao')}</div>
              <div className="portPosition lp">{terminal('lp')}</div><div className="portPosition lm">{terminal('lm')}</div>
              <div className="portPosition rp">{terminal('rp')}</div><div className="portPosition rm">{terminal('rm')}</div>
            </div>}
          </div>
          {complete && <div className="circuitComplete">● Circuit assembled correctly</div>}
        </section>
      </div>
    </main>
  </div>;
}

const styles = `
.circuitPage{min-height:100vh}.circuitBadge{background:#141c2e;color:#fff;border-radius:12px;padding:10px 15px;font-weight:900}.circuitWrap{max-width:1240px;margin:10px auto}.circuitIntro{display:flex;justify-content:space-between;align-items:flex-end;margin:25px 0}.circuitIntro h1{font-size:46px;margin:12px 0;color:#151d2f}.circuitIntro h1 span{color:#3863ed}.circuitScore{background:#141c2e;color:#fff;border-radius:15px;padding:12px 18px;text-align:center}.circuitScore b,.circuitScore small{display:block}.circuitScore small{font-size:9px;color:#b9c1d1}.circuitLayout{display:grid;grid-template-columns:270px 1fr;gap:20px}.circuitTray,.circuitBoard{background:#fff;border:1px solid #e1e6ee;border-radius:20px;box-shadow:0 12px 35px #1720330b}.circuitTray{padding:22px;height:max-content}.circuitTray h3{margin:0 0 12px}.circuitMaterial{display:flex;align-items:center;gap:10px;border:1px solid #dfe5ee;background:#fff;border-radius:13px;padding:12px;margin:9px 0;cursor:grab}.circuitMaterial:hover{border-color:#3863ed}.circuitMaterial.used{opacity:.55;cursor:default}.circuitMaterial em{margin-left:auto;color:#16824b;font-style:normal}.materialSymbol{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:#f2f5fa;font-size:22px;font-weight:900}.materialSymbol.ammeter{font-family:serif;border:2px solid #172033;border-radius:50%;background:#fff}.circuitMessage{margin-top:12px;padding:10px;border-radius:10px;background:#fff5f5;color:#a12d2d;font-size:10px}.circuitFinish{width:100%;margin-top:14px}.circuitBoard{padding:18px}.blankBoard{height:620px;position:relative;overflow:hidden;border-radius:16px;background:#fbfcfe;border:2px solid #dfe5ee;background-image:radial-gradient(#dce3ec 1px,transparent 1px);background-size:22px 22px}.dropSlot{position:absolute;width:18%;height:150px;border:2px dashed #b9c4d3;border-radius:16px;background:rgba(255,255,255,.88);display:grid;place-items:center;color:#8793a5;text-align:center}.dropSlot.battery{left:4%;top:29%}.dropSlot.ammeter{left:27%;top:29%}.dropSlot.lamp{left:51%;top:29%}.dropSlot.variableResistor{left:74%;top:56%}.dropSlot.filled{border-style:solid;border-color:#aab6c7;background:#fff}.dropPlus{width:42px;height:42px;border:2px dashed #aab6c7;border-radius:11px;display:grid;place-items:center;font-size:25px}.drawPart{width:100%;height:100%;display:grid;place-items:center;position:relative}.drawPart i{font-style:normal}.drawPart>b{font-size:9px;letter-spacing:1px;color:#69768a}.drawPart.ammeter i{width:62px;height:62px;border:4px solid #172033;border-radius:50%;display:grid;place-items:center;font:700 34px Georgia;background:#fff}.drawPart.battery .batterySymbol{width:90px;height:58px;border:3px solid #172033;border-radius:9px;display:grid;place-items:center;font-weight:900;background:#f8fafc}.drawPart.lamp .bulb{font-size:55px;filter:grayscale(1)}.drawPart.variableResistor .resistorSymbol{width:90px;height:58px;border:3px solid #172033;border-radius:9px;display:grid;place-items:center;font-size:35px;background:#f8fafc}.removeCircuitPart{position:absolute;right:8px;top:8px;border:0;background:#f0f2f6;border-radius:50%;width:25px;height:25px}.circuitWires{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.portsLayer{position:absolute;inset:0;z-index:8}.portPosition{position:absolute;transform:translateX(-50%)}.portPosition.bp{left:10.5%;top:54%}.portPosition.bm{left:15.5%;top:54%}.portPosition.ai{left:33.5%;top:54%}.portPosition.ao{left:38.5%;top:54%}.portPosition.lp{left:57.5%;top:54%}.portPosition.lm{left:62.5%;top:54%}.portPosition.rp{left:80.5%;top:81%}.portPosition.rm{left:85.5%;top:81%}.circuit-port{border:0;background:transparent;font-weight:900;color:#172033;min-width:46px;padding:0 2px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer}.circuit-port span{display:block;width:24px;height:24px;border:4px solid #172033;border-radius:50%;background:#fff;margin:auto}.circuit-port strong{display:block;white-space:nowrap;font-size:9px;line-height:1;letter-spacing:.35px;color:#172033}.circuit-port.selected span{border-color:#3863ed;background:#dbe8ff;box-shadow:0 0 0 5px #bfdbfe}.circuit-port.connected span{border-color:#16a34a}.circuit-port:hover span{border-color:#3863ed}.circuitComplete{text-align:center;color:#16824b;font-weight:900;padding:12px}.circuitComplete::first-letter{color:#16a34a}@media(max-width:900px){.circuitLayout{grid-template-columns:1fr}.circuitIntro h1{font-size:36px}.blankBoard{height:520px}.dropSlot{height:125px}}@media(max-width:600px){.circuitIntro{display:block}.circuitScore{display:inline-block;margin-top:10px}.blankBoard{height:450px}.dropSlot{width:21%;height:110px}.drawPart.ammeter i{width:48px;height:48px;font-size:25px}.drawPart.battery .batterySymbol{width:65px;height:45px}.drawPart.lamp .bulb{font-size:40px}.portPosition.rp{left:48%}.portPosition.rm{left:68%}}
`;
