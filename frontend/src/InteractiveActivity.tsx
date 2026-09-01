import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ASSET_BASE = 'https://raw.githubusercontent.com/SRIRAMCJ/electrical-competency-assessment/main/';
const ASSETS = {
  bulb: ASSET_BASE + 'BULB.fbx',
  battery: ASSET_BASE + 'battery.fbx',
  ammeter: ASSET_BASE + 'ampermeter.fbx',
  voltmeter: ASSET_BASE + 'voltmeter.fbx',
  variableResistor: ASSET_BASE + 'variable%20resistor.fbx'
} as const;

type Challenge = { title: string; symptom: string; question: string; explanation: string };
const challenges: Challenge[] = [
  { title: 'Simple Circuit — Trace the Path', symptom: 'A 12V bulb should illuminate when the switch is closed.', question: 'Inspect the circuit. What must be true for the bulb to receive power?', explanation: 'Trace the complete path from the battery through the switch, into the bulb, and back to the battery.' },
  { title: 'Fuse Inspection — Open the Shield', symptom: 'The lamp circuit has stopped working. Inspect the protective device before changing anything.', question: 'After opening the fuse shield, what do you find inside?', explanation: 'The fuse element is intentionally shown melted/open after the shield is opened. Inspect before deciding on replacement.' },
  { title: 'Tool Identification — Pick the Ammeter', symptom: 'Select the correct instrument for measuring electrical current.', question: 'Pick the AMMETER from the unlabelled tools.', explanation: 'The ammeter is the current-measuring instrument. The tools are intentionally unlabelled so the learner must identify it visually.' }
];

function mat(color: number, opts: THREE.MeshStandardMaterialParameters = {}) { return new THREE.MeshStandardMaterial({ color, roughness: .48, ...opts }); }
function box(w: number, h: number, d: number, m: THREE.Material) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function terminal(color: number) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .08, 24), mat(color, { metalness: .55, roughness: .25 })); m.rotation.z = Math.PI / 2; return m; }
function wire(a: THREE.Vector3, b: THREE.Vector3, color: number) {
  const g = new THREE.Group(); const m = mat(color, { roughness: .5 });
  const v = b.clone().sub(a); const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, v.length(), 10), m);
  mesh.position.copy(a).add(b).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); g.add(mesh); return g;
}
function setShadows(g: THREE.Object3D) { g.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } }); }

function createSwitch() {
  const g = new THREE.Group(); g.name = 'switch';
  g.add(box(1.45, .3, .7, mat(0x303846)));
  const a = terminal(0xdc2626); a.position.set(-.55, .35, 0); g.add(a);
  const b = terminal(0x2563eb); b.position.set(.55, .35, 0); g.add(b);
  const lever = box(.9, .1, .12, mat(0xcbd5e1, { metalness: .45 })); lever.position.set(0, .62, 0); lever.rotation.z = -.32; g.add(lever);
  return g;
}
function createFuse() {
  const g = new THREE.Group(); g.name = 'fuse';
  g.add(box(1.65, .35, .7, mat(0x303846)));
  const shield = new THREE.Mesh(new THREE.BoxGeometry(1.25, .55, .55), new THREE.MeshPhysicalMaterial({ color: 0xd7dee8, transparent: true, opacity: .74, roughness: .08, metalness: .1 }));
  shield.position.y = .44; shield.name = 'shield'; g.add(shield);
  const filament = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .82, 12), mat(0xf59e0b, { metalness: .5 }));
  filament.rotation.z = Math.PI / 2; filament.position.y = .44; filament.name = 'filament'; filament.visible = false; g.add(filament);
  const breakL = box(.28, .07, .07, mat(0xf59e0b)); breakL.position.set(-.38, .44, 0); breakL.name = 'meltA'; breakL.visible = false; g.add(breakL);
  const breakR = box(.28, .07, .07, mat(0xf59e0b)); breakR.position.set(.38, .44, 0); breakR.name = 'meltB'; breakR.visible = false; g.add(breakR);
  [-.52, .52].forEach(x => { const c = terminal(0xf0b84b); c.position.set(x, .42, 0); g.add(c); });
  return g;
}

async function loadFBX(url: string): Promise<THREE.Group> {
  const mod = await import('three/examples/jsm/loaders/FBXLoader.js');
  const loader = new mod.FBXLoader();
  const loaded = await loader.loadAsync(url);
  loaded.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
  return loaded;
}
function fitObject(g: THREE.Object3D, maxSize = 2.2) {
  const box3 = new THREE.Box3().setFromObject(g); const size = box3.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.y, size.z) || 1; const s = maxSize / max; g.scale.setScalar(s);
  const b2 = new THREE.Box3().setFromObject(g); const c = b2.getCenter(new THREE.Vector3()); g.position.sub(new THREE.Vector3(c.x, b2.min.y, c.z));
}

export default function InteractiveActivity({ onFinish }: { onFinish: (score: number) => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [fuseOpen, setFuseOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const challenge = challenges[round];

  useEffect(() => {
    if (!mount.current) return;
    const host = mount.current;
    let disposed = false;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf7f9fc);
    const camera = new THREE.PerspectiveCamera(38, host.clientWidth / Math.max(host.clientHeight, 1), .05, 100); camera.position.set(6.8, 5.2, 8.2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6)); renderer.setSize(host.clientWidth, host.clientHeight); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.target.set(0, .25, 0); controls.minDistance = 3.5; controls.maxDistance = 14; controls.maxPolarAngle = Math.PI * .49;
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 2)); const sun = new THREE.DirectionalLight(0xffffff, 2.8); sun.position.set(5, 9, 6); sun.castShadow = true; scene.add(sun);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(16, .2, 10), mat(0xe7ebf0, { roughness: .9 })); floor.position.y = -1.05; floor.receiveShadow = true; scene.add(floor);

    let frame = 0; const animate = () => { if (disposed) return; frame = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }; animate();
    const resize = () => { camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1); camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); }; window.addEventListener('resize', resize);

    const load = async () => {
      setLoading(true);
      setNotice('');
      if (round === 2) {
        const items = [
          { url: ASSETS.voltmeter, key: 'voltmeter', x: -3.4 },
          { url: ASSETS.ammeter, key: 'ammeter', x: -1.15 },
          { url: null, key: 'soldering', x: 1.25 },
          { url: null, key: 'drill', x: 3.6 }
        ];
        for (const item of items) {
          if (item.url) {
            try { const g = await loadFBX(item.url); fitObject(g, 2.1); g.position.x += item.x; g.position.y = 0; g.userData.toolKey = item.key; scene.add(g); }
            catch (err) { setNotice(`Unable to load ${item.key}. The 3D asset request failed.`); }
          } else {
            const g = item.key === 'soldering' ? (() => { const s = new THREE.Group(); const h = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, 1.35, 20), mat(0x374151)); h.rotation.z = Math.PI / 2; s.add(h); const tip = new THREE.Mesh(new THREE.CylinderGeometry(.045, .08, .7, 16), mat(0xcbd5e1, { metalness: .7 })); tip.rotation.z = Math.PI / 2; tip.position.x = .95; s.add(tip); return s; })() : (() => { const d = new THREE.Group(); d.add(box(1.15, .55, .55, mat(0x475569))); const grip = box(.28, .85, .35, mat(0x334155)); grip.position.set(-.15, -.45, 0); grip.rotation.z = -.12; d.add(grip); const ch = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .35, 18), mat(0x94a3b8, { metalness: .7 })); ch.rotation.z = Math.PI / 2; ch.position.x = .75; d.add(ch); return d; })();
            g.position.set(item.x, 0, 0); g.userData.toolKey = item.key; setShadows(g); scene.add(g);
          }
        }
      } else {
        const battery = await loadFBX(ASSETS.battery); fitObject(battery, 2.2); battery.position.set(-3.6, 0, 0); scene.add(battery);
        const bulb = await loadFBX(ASSETS.bulb); fitObject(bulb, 2.15); bulb.position.set(3.2, 0, 0); scene.add(bulb);
        const sw = createSwitch(); sw.position.set(-.25, 0, 0); setShadows(sw); scene.add(sw);
        if (round === 1) {
          const fuse = createFuse(); fuse.position.set(-2.05, 0, .05); setShadows(fuse); scene.add(fuse);
          const shield = fuse.getObjectByName('shield'); if (shield) shield.visible = !fuseOpen;
          const filament = fuse.getObjectByName('filament'); const a = fuse.getObjectByName('meltA'); const b = fuse.getObjectByName('meltB');
          if (filament) filament.visible = fuseOpen; if (a) a.visible = fuseOpen; if (b) b.visible = fuseOpen;
          if (filament) filament.scale.x = .5;
          fuse.userData.isFuse = true;
          const ray = new THREE.Raycaster(); const pointer = new THREE.Vector2();
          const onClick = (e: MouseEvent) => { const r = renderer.domElement.getBoundingClientRect(); pointer.x = ((e.clientX-r.left)/r.width)*2-1; pointer.y = -((e.clientY-r.top)/r.height)*2+1; ray.setFromCamera(pointer, camera); const hit = ray.intersectObject(fuse, true)[0]; if (hit) { setFuseOpen(v => !v); setNotice(fuseOpen ? 'Fuse shield closed.' : 'Fuse shield opened — inspect the fuse element inside.'); } };
          renderer.domElement.addEventListener('click', onClick);
          const oldDispose = () => renderer.domElement.removeEventListener('click', onClick); window.addEventListener('beforeunload', oldDispose);
          (host as any).__cleanup = () => { oldDispose(); window.removeEventListener('beforeunload', oldDispose); };
        }
        if (round === 0) {
          const bp = new THREE.Vector3(-2.55, .65, 0), si = new THREE.Vector3(-.8, .35, 0), so = new THREE.Vector3(.3, .35, 0), lp = new THREE.Vector3(2.75, .65, 0), lm = new THREE.Vector3(2.75, -.15, 0), bm = new THREE.Vector3(-2.55, .45, 0);
          scene.add(wire(bp, si, 0xdc2626), wire(so, lp, 0xdc2626), wire(lm, bm, 0x111827));
        } else {
          const bp = new THREE.Vector3(-2.55, .65, 0), fi = new THREE.Vector3(-2.65, .42, 0), fo = new THREE.Vector3(-1.35, .42, 0), si = new THREE.Vector3(-.8, .35, 0), so = new THREE.Vector3(.3, .35, 0), lp = new THREE.Vector3(2.75, .65, 0), lm = new THREE.Vector3(2.75, -.15, 0), bm = new THREE.Vector3(-2.55, .45, 0);
          scene.add(wire(bp, fi, 0xdc2626), wire(fo, si, 0xdc2626), wire(so, lp, 0xdc2626), wire(lm, bm, 0x111827));
        }
      }
      if (disposed) return;
      const ray = new THREE.Raycaster(); const pointer = new THREE.Vector2();
      const onToolClick = (e: MouseEvent) => {
        if (round !== 2 || checked) return;
        const r = renderer.domElement.getBoundingClientRect(); pointer.x = ((e.clientX-r.left)/r.width)*2-1; pointer.y = -((e.clientY-r.top)/r.height)*2+1; ray.setFromCamera(pointer, camera);
        const hit = ray.intersectObjects(scene.children, true).find(h => h.object.userData.toolKey || h.object.parent?.userData.toolKey);
        if (hit) { let o: THREE.Object3D | null = hit.object; while (o && !o.userData.toolKey) o = o.parent; if (o?.userData.toolKey) setSelected(o.userData.toolKey); }
      };
      renderer.domElement.addEventListener('click', onToolClick);
      (host as any).__toolClick = onToolClick;
    };
    load().catch((err) => setNotice(err instanceof Error ? `3D asset loading failed: ${err.message}` : '3D asset loading failed.')).finally(() => setLoading(false));
    return () => { disposed = true; cancelAnimationFrame(frame); window.removeEventListener('resize', resize); (host as any).__cleanup?.(); if ((host as any).__toolClick) renderer.domElement.removeEventListener('click', (host as any).__toolClick); controls.dispose(); renderer.dispose(); if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement); };
  }, [round, fuseOpen, checked]);

  const check = () => {
    if (round === 0) { setChecked(true); setSelected('complete'); setScore(s => s + 5); setNotice('Correct. You traced the complete battery → switch → bulb → return path.'); }
    else if (round === 1) { if (!fuseOpen) { setNotice('Open the fuse shield first and inspect the element inside.'); return; } setChecked(true); setSelected('melted'); setScore(s => s + 5); setNotice('Correct. The fuse element is visibly melted/open.'); }
    else { if (!selected) { setNotice('Click one of the four unlabelled tools first.'); return; } setChecked(true); if (selected === 'ammeter') { setScore(s => s + 5); setNotice('Correct. You identified the ammeter.'); } else setNotice('Incorrect selection. The correct tool is the ammeter.'); }
  };
  const next = () => { if (round === 2) { onFinish(score); return; } setRound(r => r + 1); setSelected(null); setChecked(false); setFuseOpen(false); setNotice(''); };
  const selectedLabel = round === 2 ? (selected ? ({ ammeter: 'Selected tool', voltmeter: 'Selected tool', soldering: 'Selected tool', drill: 'Selected tool' } as Record<string,string>)[selected] : 'No tool selected') : '';
  const correct = round < 2 || selected === 'ammeter';

  return <div className="activityPage threeLab"><style>{css}</style>
    <header className="activityHeader"><div><div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div><strong>Technical Activity</strong></div><div className="activityScore">⚡ {score}/15</div></header>
    <main className="activityMain"><div className="activityIntro"><div><div className="eyebrow">STAGE 2 • 3D INTERACTIVE VALIDATION</div><h1>Electrical <span>Troubleshooting Lab</span></h1><p>Inspect the real authored 3D assets, rotate and zoom the equipment, then complete the task without relying on labels.</p></div><div className="activityProgress"><b>{round+1}/3</b><small>challenges</small></div></div>
      <div className="activityTrack"><i style={{ width: `${((round+1)/3)*100}%` }} /></div>
      <section className="labGrid"><section className="labSceneCard"><div className="sceneToolbar"><div><b>3D Interactive Workbench</b><small>Drag to rotate • wheel to zoom • right-drag to pan</small></div><span className="modePill">AUTHORED 3D ASSETS</span></div><div className="threeViewport" ref={mount}>{loading&&<div className="assetLoading">Loading authored 3D models…</div>}</div><div className="sceneHint"><span>🖱️ Drag = rotate</span><span>◉ Wheel = zoom</span><span>⇧ Right-drag = pan</span>{round===1&&<span>🔎 Click fuse shield = open / close</span>}{round===2&&<span>🎯 Click a tool = select</span>}</div>{notice&&<div className="labNotice">{notice}</div>}</section>
        <section className="activityCard activityQuestion labQuestion"><div className="questionMeta"><span>Challenge {round+1} of 3</span><span>5 points</span></div><div className="fieldBadge">FIELD TASK</div><h2>{challenge.title}</h2><p className="symptom">{challenge.symptom}</p><div className="labRule"><b>Technician rule</b><span>Think → inspect → verify → act</span></div><h3>{challenge.question}</h3>
          {round===0&&<div className="taskInstruction">Trace the actual circuit visually. The first challenge intentionally contains only the battery, switch and bulb.</div>}
          {round===1&&<div className="taskInstruction">Open the transparent shield on the fuse and inspect the internal element. Do not rely on a text description.</div>}
          {round===2&&<div className="selectedTool">{selected?<>Selected: <b>{selected}</b></>:<span>No tool selected</span>}</div>}
          {!checked&&<button className="activityPrimary full" onClick={check}>{round===2?'Validate selected tool':'Validate inspection'}</button>}
          {checked&&<div className={`activityFeedback ${correct?'good':'bad'}`}><b>{correct?'Correct':'Review your selection'}</b><p>{round===0?'You identified the complete battery → switch → bulb → return circuit.':round===1?'The fuse element is melted/open after the shield is opened.':correct?'The selected instrument is the ammeter.':'That tool is not an ammeter. Choose the current-measuring instrument.'}</p></div>}
          <div className="activityActions"><span>{checked?(correct?'+5 points':'0 points'):'Complete the physical inspection before validating.'}</span>{checked&&<button className="activityPrimary" onClick={next}>{round===2?'Continue to practical →':'Next challenge →'}</button>}</div>
        </section></section></main></div>;
}

const css = `*{box-sizing:border-box}.threeLab{min-height:100vh;width:100%;padding:0 28px 60px;background:radial-gradient(circle at 50% 0,#fff 0,#f3f6fb 65%);color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.activityHeader{width:100%;max-width:1240px;margin:0 auto;padding:22px 0;display:flex;align-items:center;justify-content:space-between;gap:20px}.activityHeader strong{display:block;font-size:20px;margin-top:3px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:2px;color:#71809a;text-transform:uppercase}.activityScore{min-width:92px;padding:11px 16px;border-radius:14px;background:#141c2e;color:#fff;text-align:center;font-weight:800}.activityMain{width:100%;max-width:1240px;margin:22px auto 0}.activityIntro{display:flex;align-items:flex-end;justify-content:space-between;gap:30px}.activityIntro h1{margin:12px 0 10px;color:#151d2f;font-size:46px;line-height:1.08}.activityIntro h1 span{color:#3863ed}.activityIntro p{margin:0;max-width:820px;color:#68758b;font-size:16px;line-height:1.65}.activityProgress{padding:14px 18px;border-radius:15px;background:#141c2e;color:#fff;text-align:center}.activityProgress b,.activityProgress small{display:block}.activityProgress small{margin-top:3px;font-size:9px;color:#b9c1d1}.activityTrack{height:7px;margin:24px 0 20px;background:#e5e9f0;border-radius:99px;overflow:hidden}.activityTrack i{display:block;height:100%;background:#3863ed;border-radius:99px;transition:.25s}.labGrid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(350px,.85fr);gap:20px;align-items:stretch}.labSceneCard{background:#fff;border:1px solid #e1e6ee;border-radius:20px;box-shadow:0 14px 35px rgba(23,32,51,.07);padding:18px;min-width:0}.sceneToolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.sceneToolbar b,.sceneToolbar small{display:block}.sceneToolbar small{font-size:10px;color:#8290a4;margin-top:3px}.modePill{padding:8px 10px;border-radius:10px;background:#eef4ff;color:#3863ed;font-size:9px;font-weight:900;letter-spacing:.7px}.threeViewport{height:520px;min-height:420px;border-radius:15px;overflow:hidden;background:#f7f9fc;cursor:grab}.threeViewport:active{cursor:grabbing}.threeViewport{position:relative}.threeViewport canvas{display:block;width:100%;height:100%}.assetLoading{position:absolute;z-index:2;inset:0;display:grid;place-items:center;color:#68758b;font-size:12px;font-weight:800;background:rgba(247,249,252,.72);pointer-events:none}.sceneHint{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.sceneHint span{font-size:9px;font-weight:800;color:#68758b;background:#f4f6f9;border:1px solid #e3e7ed;border-radius:99px;padding:7px 9px}.labNotice{margin-top:10px;padding:10px 12px;border:1px solid #dbe5f4;border-radius:11px;background:#f5f8fe;color:#4e5f78;font-size:11px}.labQuestion{padding:25px}.fieldBadge{display:inline-block;margin-top:24px;padding:6px 9px;border-radius:8px;background:#eef4ff;color:#3863ed;font-size:9px;font-weight:900;letter-spacing:1px}.labQuestion h2{margin:10px 0 8px;font-size:24px;line-height:1.2}.symptom{margin:0;color:#68758b;font-size:13px;line-height:1.65}.labRule{margin:18px 0;padding:12px;border:1px solid #e4e9f1;border-radius:12px;background:#f7f9fd}.labRule b,.labRule span{display:block}.labRule b{font-size:10px;color:#3863ed}.labRule span{font-size:11px;color:#69768a;margin-top:4px}.labQuestion h3{font-size:16px;line-height:1.35;margin:20px 0 12px}.taskInstruction,.selectedTool{padding:12px;border:1px dashed #cfd8e5;border-radius:11px;background:#fafbfd;color:#65738a;font-size:11px;line-height:1.5}.selectedTool{margin-bottom:10px}.activityPrimary{border:0;border-radius:11px;padding:12px 15px;background:#3863ed;color:#fff;font:inherit;font-size:11px;font-weight:800;cursor:pointer}.activityPrimary.full{width:100%;margin-top:12px}.activityFeedback{margin-top:13px;padding:12px;border-radius:12px}.activityFeedback.good{background:#eefbf2;border:1px solid #b8e6c7}.activityFeedback.bad{background:#fff5f5;border:1px solid #f1c2c2}.activityFeedback p{font-size:10px;color:#68758b;line-height:1.55;margin:5px 0 0}.activityActions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px;color:#7a8799;font-size:10px;font-weight:700}@media(max-width:1050px){.labGrid{grid-template-columns:1fr}.threeViewport{height:500px}.activityIntro{align-items:flex-start}}@media(max-width:600px){.threeLab{padding:0 12px 40px}.activityIntro{display:block}.activityIntro h1{font-size:32px}.activityProgress{display:inline-block;margin-top:16px}.labSceneCard{padding:12px}.threeViewport{height:400px;min-height:350px}.sceneToolbar{align-items:flex-start;flex-direction:column}.labQuestion{padding:20px}.activityActions{align-items:stretch;flex-direction:column}.activityPrimary{width:100%}.sceneHint span{font-size:8px}}`;