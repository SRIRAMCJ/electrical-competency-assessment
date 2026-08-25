import { useMemo, useState } from 'react';

type Item = 'battery' | 'ammeter' | 'lamp' | 'voltmeter' | 'rheostat';
type Pos = { x: number; y: number };
type Terminal = 'bp' | 'bm' | 'ri' | 'ro' | 'ai' | 'ao' | 'li' | 'lo' | 'vp' | 'vm';
type Connection = [Terminal, Terminal];

const items: Record<Item, { name: string; symbol: string }> = {
  battery: { name: 'Battery', symbol: '▮' },
  ammeter: { name: 'Ammeter', symbol: 'A' },
  lamp: { name: 'Bulb', symbol: '✕' },
  voltmeter: { name: 'Voltmeter', symbol: 'V' },
  rheostat: { name: 'Variable resistor', symbol: '▱' },
};

const terminals: Record<Item, Terminal[]> = {
  battery: ['bp', 'bm'],
  rheostat: ['ri', 'ro'],
  ammeter: ['ai', 'ao'],
  lamp: ['li', 'lo'],
  voltmeter: ['vp', 'vm'],
};

const terminalLabel: Record<Terminal, string> = {
  bp: '+', bm: '−', ri: '', ro: '', ai: '', ao: '', li: '', lo: '', vp: '+', vm: '−',
};

// Series path: Battery + -> Rheostat -> Ammeter -> Bulb -> Battery -.
// Voltmeter is connected in parallel across the bulb.
const correctConnections: Connection[] = [
  ['bp', 'ri'],
  ['ro', 'ai'],
  ['ao', 'li'],
  ['lo', 'bm'],
  ['vp', 'li'],
  ['vm', 'lo'],
];

const terminalOwner = (terminal: Terminal): Item => {
  if (terminal === 'bp' || terminal === 'bm') return 'battery';
  if (terminal === 'ri' || terminal === 'ro') return 'rheostat';
  if (terminal === 'ai' || terminal === 'ao') return 'ammeter';
  if (terminal === 'li' || terminal === 'lo') return 'lamp';
  return 'voltmeter';
};

const terminalOffset: Record<Terminal, [number, number]> = {
  bp: [7, 0],
  bm: [-7, 0],
  ri: [-7, 0],
  ro: [7, 0],
  ai: [-6, 0],
  ao: [6, 0],
  li: [-6, 0],
  lo: [6, 0],
  vp: [0, -7],
  vm: [0, 7],
};

const samePair = (a: Terminal, b: Terminal, pair: Connection) =>
  (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a);

const pairAlreadyConnected = (a: Terminal, b: Terminal, connections: Connection[]) =>
  connections.some((connection) => samePair(a, b, connection));

export default function CircuitDrawingActivity({ onFinish }: { onFinish: (score: number) => void }) {
  const [placed, setPlaced] = useState<Partial<Record<Item, Pos>>>({});
  const [selected, setSelected] = useState<Terminal | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [drag, setDrag] = useState<Item | null>(null);
  const [message, setMessage] = useState('');

  const allPlaced = (Object.keys(items) as Item[]).every((item) => Boolean(placed[item]));
  const correctCount = useMemo(
    () => connections.filter((connection) => correctConnections.some((target) => samePair(connection[0], connection[1], target))).length,
    [connections],
  );
  const complete = allPlaced && correctCount === correctConnections.length && connections.length === correctConnections.length;

  const place = (item: Item, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(9, Math.min(91, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(12, Math.min(88, ((event.clientY - rect.top) / rect.height) * 100));
    setPlaced((current) => ({ ...current, [item]: { x, y } }));
    setMessage('');
  };

  const remove = (item: Item) => {
    const owned = new Set(terminals[item]);
    setPlaced((current) => {
      const next = { ...current };
      delete next[item];
      return next;
    });
    setConnections((current) => current.filter(([a, b]) => !owned.has(a) && !owned.has(b)));
    setSelected(null);
    setMessage('');
  };

  const connect = (terminal: Terminal) => {
    if (!selected) {
      setSelected(terminal);
      setMessage('Terminal selected — now click the terminal you want to connect to.');
      return;
    }

    if (selected === terminal) {
      setSelected(null);
      setMessage('');
      return;
    }

    if (terminalOwner(selected) === terminalOwner(terminal)) {
      setSelected(null);
      setMessage('A component cannot be connected to itself.');
      return;
    }

    if (pairAlreadyConnected(selected, terminal, connections)) {
      setSelected(null);
      setMessage('Those terminals are already connected.');
      return;
    }

    if (!correctConnections.some((target) => samePair(selected, terminal, target))) {
      setSelected(null);
      setMessage('Incorrect connection. Try another terminal.');
      return;
    }

    setConnections((current) => [...current, [selected, terminal]]);
    setSelected(null);
    setMessage('Connection accepted.');
  };

  const positionOf = (terminal: Terminal) => {
    const owner = terminalOwner(terminal);
    const p = placed[owner];
    if (!p) return null;
    const [dx, dy] = terminalOffset[terminal];
    return { x: p.x + dx, y: p.y + dy };
  };

  return (
    <div className="drawActivity">
      <style>{`
        .drawActivity{max-width:1220px;margin:0 auto;padding:20px 0 50px;color:#172033}
        .drawHead{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px}
        .drawHead h1{font-size:40px;line-height:1.05;margin:8px 0}.drawHead h1 span{color:#3863ed}.drawHead p{margin:0;color:#7a879a;font-size:13px}
        .drawCounter{background:#141c2e;color:#fff;border-radius:14px;padding:11px 17px;text-align:center}.drawCounter b,.drawCounter small{display:block}.drawCounter small{font-size:9px;color:#b9c1d1;margin-top:3px}
        .drawBody{display:grid;grid-template-columns:245px 1fr;gap:18px}.drawTray,.drawBoard{background:#fff;border:1px solid #e0e6ee;border-radius:20px}.drawTray{padding:17px}.drawTray h3{margin:0 0 12px}
        .drawItem{display:flex;align-items:center;gap:10px;width:100%;margin:8px 0;padding:11px;border:1px solid #dfe5ee;background:#fff;border-radius:12px;text-align:left;font-weight:800;cursor:grab}.drawItem:active{cursor:grabbing}.drawItem:hover{border-color:#3863ed;background:#f8faff}
        .drawItem span{width:36px;height:36px;border-radius:10px;background:#f3f5f8;display:grid;place-items:center;font-size:20px}.drawItem small{display:block;color:#8793a5;font-weight:500;font-size:10px;margin-top:3px}
        .statusMessage{min-height:34px;margin-top:12px;padding:9px 10px;border-radius:10px;background:#f7f9fc;color:#5f6b7c;font-size:10px;line-height:1.4}.statusMessage.error{color:#b91c1c;background:#fff1f2}.statusMessage.ok{color:#15803d;background:#f0fdf4}
        .drawBoard{padding:16px}.drawCanvas{position:relative;min-height:620px;border:1px solid #cfd5df;border-radius:16px;background:#fff;overflow:hidden}.drawGrid{position:absolute;inset:0;background-image:radial-gradient(#dce1e8 1px,transparent 1px);background-size:22px 22px}
        .wireLayer{position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none}.wireGlow{stroke:#fff;stroke-width:3.8;fill:none;stroke-linecap:round;stroke-linejoin:round}.wireLine{stroke:#20242b;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round}
        .part{position:absolute;transform:translate(-50%,-50%);z-index:8;border:2px solid #242a33;background:#fff;display:grid;place-items:center;font-weight:900;box-shadow:0 5px 12px #17203316;color:#172033;pointer-events:none}
        .part small{display:block;font-size:8px;color:#7c8797;font-weight:700}.part.battery{width:92px;height:62px;border-radius:11px}.part.rheostat{width:108px;height:56px;border-radius:10px}.part.meter{width:78px;height:78px;border-radius:50%}.part.lamp{width:80px;height:80px;border-radius:50%}
        .part .symbol{font-size:25px;line-height:1}.part.battery .symbol{font-size:20px}.part.lamp .symbol{font-size:36px}
        .removePart{position:absolute;right:-8px;top:-8px;width:22px;height:22px;border:0;border-radius:50%;background:#f1f3f6;color:#667085;font-weight:900;z-index:20;pointer-events:auto}.removePart:hover{background:#fee2e2;color:#b91c1c}
        .terminal{position:absolute;z-index:25;width:30px;height:30px;border:4px solid #20242b;border-radius:50%;background:#fff;transform:translate(-50%,-50%);padding:0;cursor:pointer;box-shadow:0 0 0 4px #fff;display:grid;place-items:center}.terminal::after{content:'';width:8px;height:8px;border-radius:50%;background:#20242b}.terminal:hover{border-color:#3863ed;box-shadow:0 0 0 5px #dbe7ff}.terminal.selected{background:#3863ed;border-color:#1d4ed8}.terminal.selected::after{background:#fff}.terminal.connected{background:#dcfce7;border-color:#16a34a}.terminal.connected::after{background:#15803d}
        .terminalLabel{position:absolute;font-size:9px;font-weight:900;pointer-events:none;white-space:nowrap;color:#172033}.drawFooter{display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:12px}.drawStatus{font-size:11px;color:#718096}.drawFinish{border:0;border-radius:11px;padding:12px 18px;background:#3863ed;color:#fff;font-weight:900}.drawFinish:disabled{opacity:.4;cursor:not-allowed}
        @media(max-width:800px){.drawBody{grid-template-columns:1fr}.drawCanvas{min-height:520px}.drawHead{align-items:flex-start}.drawHead h1{font-size:32px}}
      `}</style>

      <div className="drawHead">
        <div><div className="eyebrow">STAGE 4 • CIRCUIT ASSEMBLY</div><h1>Electrical <span>Circuit Assembly</span></h1><p>Assemble the circuit.</p></div>
        <div className="drawCounter"><b>{correctCount}/{correctConnections.length}</b><small>connections</small></div>
      </div>

      <div className="drawBody">
        <aside className="drawTray">
          <h3>Components</h3>
          {(Object.keys(items) as Item[]).map((item) => (
            <div key={item} className="drawItem" draggable onDragStart={() => setDrag(item)}>
              <span>{items[item].symbol}</span><div>{items[item].name}<small>{placed[item] ? 'Placed' : 'Drag to board'}</small></div>
            </div>
          ))}
          <div className={`statusMessage ${message.startsWith('Incorrect') ? 'error' : message === 'Connection accepted.' ? 'ok' : ''}`}>
            {message || 'Drag all five components onto the board, then connect the large terminal circles.'}
          </div>
        </aside>

        <section className="drawBoard">
          <div className="drawCanvas" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { if (drag) { place(drag, event); setDrag(null); } }}>
            <div className="drawGrid" />

            {connections.map(([a, b], index) => {
              const p1 = positionOf(a), p2 = positionOf(b);
              if (!p1 || !p2) return null;
              const mx = (p1.x + p2.x) / 2;
              const path = `M ${p1.x} ${p1.y} L ${mx} ${p1.y} L ${mx} ${p2.y} L ${p2.x} ${p2.y}`;
              return <svg key={index} className="wireLayer" viewBox="0 0 100 100" preserveAspectRatio="none"><path className="wireGlow" d={path} /><path className="wireLine" d={path} /></svg>;
            })}

            {(Object.keys(items) as Item[]).map((item) => {
              const p = placed[item]; if (!p) return null;
              return <div key={item} className={`part ${item === 'battery' ? 'battery' : ''} ${item === 'rheostat' ? 'rheostat' : ''} ${item === 'ammeter' || item === 'voltmeter' ? 'meter' : ''} ${item === 'lamp' ? 'lamp' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <div className="symbol">{items[item].symbol}</div><small>{items[item].name}</small>
                <button className="removePart" onClick={(event) => { event.stopPropagation(); remove(item); }}>×</button>
              </div>;
            })}

            {(Object.keys(items) as Item[]).flatMap((item) => {
              if (!placed[item]) return [];
              return terminals[item].map((terminal) => {
                const pos = positionOf(terminal); if (!pos) return null;
                const connected = connections.some(([a, b]) => a === terminal || b === terminal);
                return <button key={terminal} type="button" className={`terminal ${selected === terminal ? 'selected' : ''} ${connected ? 'connected' : ''}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }} onClick={(event) => { event.stopPropagation(); connect(terminal); }} aria-label={`Connect terminal ${terminal}`}>
                  {terminalLabel[terminal] && <span className="terminalLabel" style={{ left: '50%', top: terminal === 'vp' ? '180%' : '-90%', transform: 'translate(-50%,-50%)' }}>{terminalLabel[terminal]}</span>}
                </button>;
              });
            })}
          </div>

          <div className="drawFooter">
            <span className="drawStatus">{complete ? '✓ Circuit complete.' : `${Object.keys(placed).length}/5 components placed • ${correctCount}/${correctConnections.length} connections`}</span>
            <button className="drawFinish" disabled={!complete} onClick={() => onFinish(20)}>Finish activity →</button>
          </div>
        </section>
      </div>
    </div>
  );
}
