import { useMemo, useState } from 'react';

type Item = 'battery' | 'ammeter' | 'lamp' | 'voltmeter' | 'rheostat';
type Pos = { x: number; y: number };
type Edge = [Item, Item];

const items: Record<Item, { name: string; symbol: string }> = {
  battery: { name: 'Battery', symbol: '🔋' },
  ammeter: { name: 'Ammeter', symbol: 'A' },
  lamp: { name: 'Bulb', symbol: '💡' },
  voltmeter: { name: 'Voltmeter', symbol: 'V' },
  rheostat: { name: 'Variable resistor', symbol: '▱' },
};

const correctEdges: Edge[] = [
  ['battery', 'rheostat'],
  ['rheostat', 'ammeter'],
  ['ammeter', 'lamp'],
  ['lamp', 'battery'],
  ['voltmeter', 'lamp'],
];

const snap: Record<Item, Pos> = {
  battery: { x: 17, y: 23 },
  rheostat: { x: 78, y: 23 },
  ammeter: { x: 28, y: 62 },
  lamp: { x: 54, y: 62 },
  voltmeter: { x: 54, y: 82 },
};

const isPair = (a: Item, b: Item, edge: Edge) =>
  (edge[0] === a && edge[1] === b) || (edge[0] === b && edge[1] === a);

export default function CircuitDrawingActivity({ onFinish }: { onFinish: (score: number) => void }) {
  const [placed, setPlaced] = useState<Partial<Record<Item, Pos>>>({});
  const [selected, setSelected] = useState<Item | null>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [drag, setDrag] = useState<Item | null>(null);

  const correctCount = useMemo(
    () => correctEdges.filter((target) => edges.some((edge) => isPair(edge[0], edge[1], target))).length,
    [edges],
  );
  const complete = (Object.keys(items) as Item[]).every((item) => placed[item]) && edges.length === correctEdges.length && correctCount === correctEdges.length;

  const place = (item: Item, event?: any) => {
    if (event) {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      setPlaced((current) => ({
        ...current,
        [item]: {
          x: Math.max(6, Math.min(94, ((event.clientX - rect.left) / rect.width) * 100)),
          y: Math.max(10, Math.min(90, ((event.clientY - rect.top) / rect.height) * 100)),
        },
      }));
    } else {
      setPlaced((current) => ({ ...current, [item]: snap[item] }));
    }
  };

  const connect = (item: Item) => {
    if (!placed[item]) return;
    if (!selected) {
      setSelected(item);
      return;
    }
    if (selected === item) {
      setSelected(null);
      return;
    }
    if (edges.some((edge) => isPair(selected, item, edge))) {
      setSelected(null);
      return;
    }
    setEdges((current) => [...current, [selected, item]]);
    setSelected(null);
  };

  const remove = (item: Item) => {
    setPlaced((current) => {
      const next = { ...current };
      delete next[item];
      return next;
    });
    setEdges((current) => current.filter((edge) => edge[0] !== item && edge[1] !== item));
    setSelected(null);
  };

  return (
    <div className="drawActivity">
      <style>{`
        .drawActivity{max-width:1220px;margin:0 auto;padding:20px 0 50px;color:#172033}
        .drawHead{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px}.drawHead h1{font-size:40px;line-height:1.05;margin:8px 0}.drawHead h1 span{color:#3863ed}.drawHead p{margin:0;color:#7a879a;font-size:13px}.drawCounter{background:#141c2e;color:#fff;border-radius:14px;padding:11px 17px;text-align:center}.drawCounter b,.drawCounter small{display:block}.drawCounter small{font-size:9px;color:#b9c1d1;margin-top:3px}
        .drawBody{display:grid;grid-template-columns:245px 1fr;gap:18px}.drawTray,.drawBoard{background:#fff;border:1px solid #e0e6ee;border-radius:20px}.drawTray{padding:17px}.drawTray h3{margin:0 0 12px}.drawItem{display:flex;align-items:center;gap:10px;width:100%;margin:8px 0;padding:11px;border:1px solid #dfe5ee;background:#fff;border-radius:12px;text-align:left;font-weight:800}.drawItem:hover{border-color:#3863ed;background:#f8faff}.drawItem span{width:36px;height:36px;border-radius:10px;background:#f3f5f8;display:grid;place-items:center;font-size:20px}.drawItem small{display:block;color:#8793a5;font-weight:500;font-size:10px;margin-top:3px}.drawHint{margin-top:14px;padding:10px;border-radius:10px;background:#f7f9fc;color:#7b8799;font-size:10px;line-height:1.5}
        .drawBoard{padding:16px}.drawCanvas{position:relative;min-height:620px;border:1px solid #cfd5df;border-radius:16px;background:#fff;overflow:hidden}.drawGrid{position:absolute;inset:0;background-image:radial-gradient(#dce1e8 1px,transparent 1px);background-size:22px 22px}.reference{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.13}.reference path,.reference line{stroke:#20242b;stroke-width:1.8;fill:none}.reference circle{fill:#fff;stroke:#20242b;stroke-width:1.8}.wireLayer{position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none}.wireLine{stroke:#20242b;stroke-width:1.8;fill:none;stroke-linecap:round}
        .part{position:absolute;transform:translate(-50%,-50%);z-index:6;width:92px;height:64px;border:2px solid #242a33;border-radius:12px;background:#fff;display:grid;place-items:center;font-weight:900;box-shadow:0 5px 12px #17203316;color:#172033}.part small{display:block;font-size:8px;color:#7c8797;font-weight:700}.part.lamp{width:80px;height:80px;border-radius:50%}.part.meter{border-radius:50%;width:78px;height:78px}.part.battery{width:102px}.part.selectedPart{border-color:#3863ed;box-shadow:0 0 0 4px #dbe7ff}.removePart{position:absolute;right:-8px;top:-8px;width:22px;height:22px;border:0;border-radius:50%;background:#f1f3f6;color:#667085;font-weight:900}.removePart:hover{background:#fee2e2;color:#b91c1c}.drawFooter{display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:12px}.drawStatus{font-size:11px;color:#718096}.drawFinish{border:0;border-radius:11px;padding:12px 18px;background:#3863ed;color:#fff;font-weight:900}.drawFinish:disabled{opacity:.4;cursor:not-allowed}@media(max-width:800px){.drawBody{grid-template-columns:1fr}.drawCanvas{min-height:520px}.drawHead{align-items:flex-start}.drawHead h1{font-size:32px}}
      `}</style>
      <div className="drawHead"><div><div className="eyebrow">STAGE 4 • CIRCUIT ASSEMBLY</div><h1>Electrical <span>Circuit Assembly</span></h1><p>Build the circuit on the board.</p></div><div className="drawCounter"><b>{correctCount}/5</b><small>validated connections</small></div></div>
      <div className="drawBody"><aside className="drawTray"><h3>Components</h3>{(Object.keys(items) as Item[]).map((item)=><button key={item} className="drawItem" draggable onDragStart={()=>setDrag(item)} onClick={()=>place(item)}><span>{items[item].symbol}</span><div>{items[item].name}<small>{placed[item]?'Placed':'Pick & place'}</small></div></button>)}<div className="drawHint">Place the components and connect them.</div></aside><section className="drawBoard"><div className="drawCanvas" onDragOver={(event)=>event.preventDefault()} onDrop={(event)=>{if(drag){place(drag,event);setDrag(null)}}}><div className="drawGrid"/><svg className="reference" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M 17 23 L 78 23 L 78 62 L 54 62 L 28 62 L 17 23"/><path d="M 28 62 L 54 62"/><path d="M 54 62 L 54 82 L 28 62"/><circle cx="17" cy="23" r="2.5"/><circle cx="78" cy="23" r="2.5"/><circle cx="28" cy="62" r="2.5"/><circle cx="54" cy="62" r="2.5"/><circle cx="54" cy="82" r="2.5"/></svg>{edges.map(([a,b],index)=>{const p=placed[a],q=placed[b];return p&&q?<svg key={index} className="wireLayer" viewBox="0 0 100 100" preserveAspectRatio="none"><line className="wireLine" x1={p.x} y1={p.y} x2={q.x} y2={q.y}/></svg>:null})}{(Object.keys(items) as Item[]).map((item)=>{const p=placed[item];if(!p)return null;return <button key={item} className={`part ${item==='lamp'?'lamp':''} ${item==='ammeter'||item==='voltmeter'?'meter':''} ${item==='battery'?'battery':''} ${selected===item?'selectedPart':''}`} style={{left:`${p.x}%`,top:`${p.y}%`}} onClick={()=>connect(item)}>{items[item].symbol}<small>{items[item].name}</small><span className="removePart" onClick={(event)=>{event.stopPropagation();remove(item);}}>×</span></button>})}</div><div className="drawFooter"><span className="drawStatus">{complete?'Circuit validated.':`${Object.keys(placed).length}/5 components placed`}</span><button className="drawFinish" disabled={!complete} onClick={()=>onFinish(20)}>Finish activity →</button></div></section></div>
    </div>
  );
}
