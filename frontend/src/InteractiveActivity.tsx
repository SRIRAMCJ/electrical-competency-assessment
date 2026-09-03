import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';

const CIRCUIT_ASSET_URL = 'https://cdn.jsdelivr.net/gh/SRIRAMCJ/electrical-competency-assessment@main/circuit/CIRCUIT.fbx';

type Option = { id: string; text: string };
type Challenge = {
  title: string;
  symptom: string;
  question: string;
  correct: string;
  explanation: string;
  options: Option[];
  assets: Array<{ key: 'battery' | 'bulb' | 'variableResistor' | 'circuit'; x: number; y?: number; z?: number; size?: number }>;
};

const challenges: Challenge[] = [
  {
    title: 'Fault 1 — Open Circuit',
    symptom: 'The 12V bulb is connected to the battery, but it is not illuminating.',
    question: 'What most likely happened to this circuit?',
    correct: 'open',
    explanation: 'The return path is intentionally broken. Current cannot complete the loop from the bulb back to the battery.',
    options: [
      { id: 'open', text: 'The return wire is disconnected, creating an open circuit.' },
      { id: 'reverse', text: 'The battery polarity is reversed, so the bulb cannot work.' },
      { id: 'short', text: 'The bulb is short-circuited by a second parallel path.' },
      { id: 'high', text: 'The battery voltage is too high for the circuit.' }
    ],
    assets: [
      { key: 'battery', x: -2.6, size: 1.7 },
      { key: 'bulb', x: 2.5, size: 1.9 }
    ]
  },
  {
    title: 'Fault 2 — Excessive Resistance',
    symptom: 'The 12V bulb is connected to the battery, but it is glowing much dimmer than expected.',
    question: 'What is the most likely cause shown by the circuit?',
    correct: 'resistance',
    explanation: 'The variable resistor is in series with the lamp. Excessive resistance limits current and makes the bulb dim.',
    options: [
      { id: 'resistance', text: 'The variable resistor is set too high, restricting the current.' },
      { id: 'open', text: 'The battery is completely disconnected from the circuit.' },
      { id: 'short', text: 'The bulb is directly shorted across the battery.' },
      { id: 'voltage', text: 'The voltmeter is increasing the circuit voltage.' }
    ],
    assets: [
      { key: 'battery', x: -3.0, size: 1.55 },
      { key: 'variableResistor', x: 0, size: 2.0 },
      { key: 'bulb', x: 3.0, size: 1.8 }
    ]
  },
  {
    title: 'Fault 3 — Complete Circuit Inspection',
    symptom: 'A technician must diagnose the supplied physical circuit and determine the correct measurement method.',
    question: 'Which situation correctly explains what should happen during the measurement?',
    correct: 'ammeter',
    explanation: 'Inspect the complete authored circuit first. An ammeter measures current and is connected in series; a voltmeter measures voltage across a component.',
    options: [
      { id: 'ammeter', text: 'Use the ammeter in series to check the current flowing through the lamp.' },
      { id: 'voltmeter', text: 'Connect the voltmeter in series and use it as the current meter.' },
      { id: 'resistor', text: 'Replace the measurement instrument with the variable resistor.' },
      { id: 'battery', text: 'Use the battery itself as the current-measuring instrument.' }
    ],
    assets: [
      { key: 'circuit', x: 0, y: 0, z: 0, size: 5.8 }
    ]
  }
];

function material(color: number, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...options });
}

function wire(a: THREE.Vector3, b: THREE.Vector3, color: number) {
  const g = new THREE.Group();
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, direction.length(), 10),
    material(color, { roughness: 0.6 })
  );
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  g.add(mesh);
  return g;
}

function setShadows(object: THREE.Object3D) {
  object.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.visible = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((m: any) => {
        if (m) {
          m.side = THREE.DoubleSide;
          m.transparent = false;
          m.opacity = 1;
        }
      });
    }
  });
}

async function loadFBX(url: string) {
  const mod = await import('three/examples/jsm/loaders/FBXLoader.js');
  const loader = new mod.FBXLoader();
  return loader.loadAsync(url);
}

function fitObject(object: THREE.Object3D, targetSize: number) {
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const largest = Math.max(size.x, size.y, size.z) || 1;
  object.scale.setScalar(targetSize / largest);
  const fitted = new THREE.Box3().setFromObject(object);
  const center = fitted.getCenter(new THREE.Vector3());
  object.position.sub(new THREE.Vector3(center.x, fitted.min.y, center.z));
}

function getAnchor(object: THREE.Object3D, side: 'left' | 'right') {
  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  return new THREE.Vector3(
    side === 'left' ? bounds.min.x : bounds.max.x,
    center.y + 0.15,
    center.z
  );
}

function createProceduralComponent(key: 'battery' | 'bulb' | 'variableResistor'): THREE.Group {
  const group = new THREE.Group();

  if (key === 'battery') {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 1.6, 32),
      material(0x242424, { metalness: 0.25, roughness: 0.38 })
    );
    body.rotation.z = Math.PI / 2;
    group.add(body);

    const positive = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.12, 24),
      material(0xb7791f, { metalness: 0.65, roughness: 0.28 })
    );
    positive.rotation.z = Math.PI / 2;
    positive.position.x = 0.86;
    group.add(positive);

    const negative = positive.clone();
    negative.material = material(0x7b8794, { metalness: 0.55, roughness: 0.32 });
    negative.position.x = -0.86;
    group.add(negative);
  }

  if (key === 'bulb') {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.45, 0.45, 32),
      material(0x4b5563, { metalness: 0.55, roughness: 0.3 })
    );
    base.position.y = -0.25;
    group.add(base);

    const glass = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 40, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0xf8fafc,
        transmission: 0.35,
        transparent: true,
        opacity: 0.88,
        roughness: 0.08,
        metalness: 0.02
      })
    );
    glass.position.y = 0.3;
    group.add(glass);

    const filament = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.025, 10, 28, Math.PI),
      material(0xd97706, { emissive: 0x7c2d12, emissiveIntensity: 0.35 })
    );
    filament.rotation.x = Math.PI / 2;
    filament.position.y = 0.28;
    group.add(filament);
  }

  if (key === 'variableResistor') {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.55, 0.7),
      material(0x1f2937, { metalness: 0.25, roughness: 0.42 })
    );
    group.add(body);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.28, 24),
      material(0x9ca3af, { metalness: 0.75, roughness: 0.25 })
    );
    shaft.rotation.z = Math.PI / 2;
    shaft.position.y = 0.42;
    group.add(shaft);
  }

  return group;
}

export default function InteractiveActivity({ onFinish }: { onFinish: (score: number) => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const challenge = challenges[round];

  useEffect(() => {
    if (!mount.current) return;
    const host = mount.current;
    let disposed = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f9fc);

    const camera = new THREE.PerspectiveCamera(
      42,
      host.clientWidth / Math.max(host.clientHeight, 1),
      0.05,
      100
    );
    camera.position.set(6.8, 4.4, 8.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.05, 0);
    controls.minDistance = 3.5;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minPolarAngle = 0.18;

    const draggables: THREE.Object3D[] = [];
    const dragControls = new DragControls(draggables, camera, renderer.domElement);
    dragControls.transformGroup = false;
    dragControls.addEventListener('dragstart', () => { controls.enabled = false; });
    dragControls.addEventListener('dragend', () => { controls.enabled = true; });

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9e0e8, 2.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.18, 7),
      material(0xe7ebf0, { roughness: 0.9 })
    );
    floor.position.y = -1.0;
    floor.receiveShadow = true;
    scene.add(floor);

    const components: Record<string, THREE.Object3D> = {};
    const wireGroups: THREE.Group[] = [];

    const addWire = (a: () => THREE.Vector3, b: () => THREE.Vector3, color: number, visible = true) => {
      const group = new THREE.Group();
      group.visible = visible;
      scene.add(group);
      wireGroups.push(group);
      (group.userData as any).endpoints = { a, b, color };
    };

    const updateWires = () => {
      wireGroups.forEach(group => {
        const endpoints = (group.userData as any).endpoints;
        group.clear();
        group.visible = true;
        group.add(wire(endpoints.a(), endpoints.b(), endpoints.color));
      });
    };

    const frameCircuit = () => {
      const visible = Object.values(components).filter(o => o.visible);
      if (!visible.length) return;
      const bounds = new THREE.Box3();
      visible.forEach(o => bounds.expandByObject(o));
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, size.y, size.z, 3.8);
      controls.target.set(center.x, Math.max(center.y - 0.1, 0), center.z);
      camera.position.set(center.x + radius * 0.95, center.y + radius * 0.62, center.z + radius * 1.15);
      camera.near = Math.max(0.03, radius / 200);
      camera.far = Math.max(60, radius * 8);
      camera.updateProjectionMatrix();
    };

    const load = async () => {
      setLoading(true);
      setNotice('');
      setSelected(null);
      setChecked(false);

      try {
        const failedAssets: string[] = [];
        for (const item of challenge.assets) {
          try {
            let object: THREE.Object3D;

            if (item.key === 'circuit') {
              object = await loadFBX(CIRCUIT_ASSET_URL);
            } else {
              object = createProceduralComponent(item.key);
            }

            setShadows(object);
            fitObject(object, item.size ?? 1.8);
            object.position.x += item.x;
            object.position.y = item.y ?? 0;
            object.position.z = item.z ?? 0;
            object.userData.assetKey = item.key;
            scene.add(object);
            draggables.push(object);
            components[item.key + '_' + draggables.length] = object;
          } catch (assetError) {
            failedAssets.push(`${item.key}: ${assetError instanceof Error ? assetError.message : 'request failed'}`);
          }
        }

        const list = Object.values(components);
        if (failedAssets.length) {
          setNotice(`Some repository 3D elements could not be loaded — ${failedAssets.join(' | ')}`);
        }

        if (round === 0) {
          const battery = list.find(o => o.userData.assetKey === 'battery');
          const bulb = list.find(o => o.userData.assetKey === 'bulb');
          if (battery && bulb) {
            addWire(() => getAnchor(battery, 'right'), () => getAnchor(bulb, 'left'), 0xdc2626);
            // Deliberate open return path: the visible break is the fault to diagnose.
            const gapPoint = getAnchor(battery, 'left');
            const bulbReturn = getAnchor(bulb, 'right');
            const gap = new THREE.Vector3(-0.35, (gapPoint.y + bulbReturn.y) / 2, 0);
            addWire(() => bulbReturn, () => gap, 0x111827);
            addWire(() => gap.clone().add(new THREE.Vector3(-0.55, 0, 0)), () => gapPoint, 0x111827);
          }
        }

        if (round === 1) {
          const battery = list.find(o => o.userData.assetKey === 'battery');
          const resistor = list.find(o => o.userData.assetKey === 'variableResistor');
          const bulb = list.find(o => o.userData.assetKey === 'bulb');
          if (battery && resistor && bulb) {
            addWire(() => getAnchor(battery, 'right'), () => getAnchor(resistor, 'left'), 0xdc2626);
            addWire(() => getAnchor(resistor, 'right'), () => getAnchor(bulb, 'left'), 0xdc2626);
            addWire(() => getAnchor(bulb, 'right'), () => getAnchor(battery, 'left'), 0x111827);
          }
        }

        if (round === 2) {
          const circuit = list.find(o => o.userData.assetKey === 'circuit');
          if (circuit) {
            circuit.userData.role = 'complete-authored-circuit';
            circuit.userData.draggableAsAssembly = true;
          }
        }

        updateWires();
        frameCircuit();
      } catch (error) {
        setNotice(error instanceof Error ? `Unable to load one of the authored 3D assets: ${error.message}` : 'Unable to load one of the authored 3D assets.');
      } finally {
        setLoading(false);
      }
    };

    load();

    let frame = 0;
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      controls.update();
      updateWires();
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener('resize', resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      dragControls.dispose();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [round]);

  const validate = () => {
    if (!selected) {
      setNotice('Choose one of the four scenario diagnoses first.');
      return;
    }
    setChecked(true);
    if (selected === challenge.correct) {
      setScore(current => current + 5);
      setNotice('Correct diagnosis.');
    } else {
      setNotice('Not quite. Review the 3D circuit and the four possible explanations.');
    }
  };

  const next = () => {
    if (round === challenges.length - 1) {
      onFinish(score);
      return;
    }
    setRound(current => current + 1);
  };

  const correct = selected === challenge.correct;

  return (
    <div className="activityPage threeLab">
      <style>{css}</style>
      <header className="activityHeader">
        <div>
          <div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div>
          <strong>Technical Activity</strong>
        </div>
        <div className="activityScore">⚡ {score}/15</div>
      </header>

      <main className="activityMain">
        <div className="activityIntro">
          <div>
            <div className="eyebrow">STAGE 2 • 3D INTERACTIVE VALIDATION</div>
            <h1>Electrical <span>Troubleshooting Lab</span></h1>
            <p>Inspect the authored 3D equipment, rotate and move each component independently, then diagnose what happened to the circuit. The third challenge uses the complete authored circuit from the repository <b>circuit</b> folder; legacy component FBX files remain archived in GitHub only.</p>
          </div>
          <div className="activityProgress"><b>{round + 1}/3</b><small>challenges</small></div>
        </div>

        <div className="activityTrack"><i style={{ width: `${((round + 1) / challenges.length) * 100}%` }} /></div>

        <section className="labGrid">
          <section className="labSceneCard">
            <div className="sceneToolbar">
              <div>
                <b>3D Interactive Workbench</b>
                <small>Drag = rotate • wheel = zoom • right-drag = pan • drag a component = move it separately</small>
              </div>
              <span className="modePill">REPOSITORY 3D ELEMENTS</span>
            </div>

            <div className="threeViewport" ref={mount}>
              {loading && <div className="assetLoading">Loading 3D elements…</div>}
            </div>

            <div className="sceneHint">
              <span>🖱️ Drag = rotate view</span>
              <span>◉ Wheel = zoom</span>
              <span>⇧ Right-drag = pan</span>
              <span>✋ Drag model = move separately</span>
            </div>

            {notice && <div className="labNotice">{notice}</div>}
          </section>

          <section className="activityCard activityQuestion labQuestion">
            <div className="questionMeta"><span>Challenge {round + 1} of {challenges.length}</span><span>5 points</span></div>
            <div className="fieldBadge">FIELD DIAGNOSIS</div>
            <h2>{challenge.title}</h2>
            <p className="symptom">{challenge.symptom}</p>

            <div className="labRule">
              <b>Technician rule</b>
              <span>Inspect the physical circuit before choosing a diagnosis.</span>
            </div>

            <h3>{challenge.question}</h3>

            <div className="scenarioOptions">
              {challenge.options.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  className={`scenarioOption ${selected === option.id ? 'selected' : ''}`}
                  onClick={() => !checked && setSelected(option.id)}
                  disabled={checked}
                >
                  <span className="optionLetter">{String.fromCharCode(65 + index)}</span>
                  <span>{option.text}</span>
                </button>
              ))}
            </div>

            {!checked && (
              <button className="activityPrimary full" onClick={validate}>Validate diagnosis</button>
            )}

            {checked && (
              <div className={`activityFeedback ${correct ? 'good' : 'bad'}`}>
                <b>{correct ? 'Correct' : 'Incorrect'}</b>
                <p>{correct ? challenge.explanation : `Correct diagnosis: ${challenge.options.find(option => option.id === challenge.correct)?.text}`}</p>
              </div>
            )}

            <div className="activityActions">
              <span>{checked ? (correct ? '+5 points' : '0 points') : 'Choose the diagnosis that best matches the 3D evidence.'}</span>
              {checked && <button className="activityPrimary" onClick={next}>{round === challenges.length - 1 ? 'Finish practical →' : 'Next challenge →'}</button>}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

const css = `*{box-sizing:border-box}.threeLab{min-height:100vh;width:100%;padding:0 28px 60px;background:radial-gradient(circle at 50% 0,#fff 0,#f3f6fb 65%);color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.activityHeader{width:100%;max-width:1240px;margin:0 auto;padding:22px 0;display:flex;align-items:center;justify-content:space-between;gap:20px}.activityHeader strong{display:block;font-size:20px;margin-top:3px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:2px;color:#71809a;text-transform:uppercase}.activityScore{min-width:92px;padding:11px 16px;border-radius:14px;background:#141c2e;color:#fff;text-align:center;font-weight:800}.activityMain{width:100%;max-width:1240px;margin:22px auto 0}.activityIntro{display:flex;align-items:flex-end;justify-content:space-between;gap:30px}.activityIntro h1{margin:12px 0 10px;color:#151d2f;font-size:46px;line-height:1.08}.activityIntro h1 span{color:#3863ed}.activityIntro p{margin:0;max-width:820px;color:#68758b;font-size:16px;line-height:1.65}.activityProgress{padding:14px 18px;border-radius:15px;background:#141c2e;color:#fff;text-align:center}.activityProgress b,.activityProgress small{display:block}.activityProgress small{margin-top:3px;font-size:9px;color:#b9c1d1}.activityTrack{height:7px;margin:24px 0 20px;background:#e5e9f0;border-radius:99px;overflow:hidden}.activityTrack i{display:block;height:100%;background:#3863ed;border-radius:99px;transition:.25s}.labGrid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(350px,.85fr);gap:20px;align-items:stretch}.labSceneCard{background:#fff;border:1px solid #e1e6ee;border-radius:20px;box-shadow:0 14px 35px rgba(23,32,51,.07);padding:18px;min-width:0}.sceneToolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.sceneToolbar b,.sceneToolbar small{display:block}.sceneToolbar small{font-size:10px;color:#8290a4;margin-top:3px}.modePill{padding:8px 10px;border-radius:10px;background:#eef4ff;color:#3863ed;font-size:9px;font-weight:900;letter-spacing:.7px}.threeViewport{height:560px;min-height:460px;border-radius:15px;overflow:hidden;background:linear-gradient(180deg,#f4f7fb 0%,#eef2f7 100%);cursor:grab;position:relative}.threeViewport:active{cursor:grabbing}.threeViewport canvas{display:block;width:100%;height:100%}.assetLoading{position:absolute;z-index:2;inset:0;display:grid;place-items:center;color:#68758b;font-size:12px;font-weight:800;background:rgba(247,249,252,.72);pointer-events:none}.sceneHint{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.sceneHint span{font-size:9px;font-weight:800;color:#68758b;background:#f4f6f9;border:1px solid #e3e7ed;border-radius:99px;padding:7px 9px}.labNotice{margin-top:10px;padding:10px 12px;border:1px solid #dbe5f4;border-radius:11px;background:#f5f8fe;color:#4e5f78;font-size:11px}.labQuestion{padding:25px}.fieldBadge{display:inline-block;margin-top:24px;padding:6px 9px;border-radius:8px;background:#eef4ff;color:#3863ed;font-size:9px;font-weight:900;letter-spacing:1px}.labQuestion h2{margin:10px 0 8px;font-size:24px;line-height:1.2}.symptom{margin:0;color:#68758b;font-size:13px;line-height:1.65}.labRule{margin:18px 0;padding:12px;border:1px solid #e4e9f1;border-radius:12px;background:#f7f9fd}.labRule b,.labRule span{display:block}.labRule b{font-size:10px;color:#3863ed}.labRule span{font-size:11px;color:#69768a;margin-top:4px}.labQuestion h3{font-size:16px;line-height:1.35;margin:20px 0 12px}.scenarioOptions{display:grid;gap:9px}.scenarioOption{width:100%;display:flex;align-items:flex-start;gap:11px;text-align:left;padding:12px;border:1px solid #e1e6ee;border-radius:12px;background:#fff;color:#172033;font:inherit;font-size:11px;line-height:1.45;cursor:pointer;transition:.16s}.scenarioOption:hover:not(:disabled){border-color:#9db3f5;transform:translateY(-1px)}.scenarioOption.selected{border-color:#3863ed;background:#f0f4ff;box-shadow:0 0 0 2px rgba(56,99,237,.08)}.scenarioOption:disabled{cursor:default}.optionLetter{flex:0 0 25px;width:25px;height:25px;display:grid;place-items:center;border-radius:8px;background:#eef1f5;font-size:10px;font-weight:900}.scenarioOption.selected .optionLetter{background:#3863ed;color:#fff}.activityPrimary{border:0;border-radius:11px;padding:12px 15px;background:#3863ed;color:#fff;font:inherit;font-size:11px;font-weight:800;cursor:pointer}.activityPrimary.full{width:100%;margin-top:12px}.activityFeedback{margin-top:13px;padding:12px;border-radius:12px}.activityFeedback.good{background:#eefbf2;border:1px solid #b8e6c7}.activityFeedback.bad{background:#fff5f5;border:1px solid #f1c2c2}.activityFeedback p{font-size:10px;color:#68758b;line-height:1.55;margin:5px 0 0}.activityActions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px;color:#7a8799;font-size:10px;font-weight:700}@media(max-width:1050px){.labGrid{grid-template-columns:1fr}.threeViewport{height:500px}.activityIntro{align-items:flex-start}}@media(max-width:600px){.threeLab{padding:0 12px 40px}.activityIntro{display:block}.activityIntro h1{font-size:32px}.activityProgress{display:inline-block;margin-top:16px}.labSceneCard{padding:12px}.threeViewport{height:400px;min-height:350px}.sceneToolbar{align-items:flex-start;flex-direction:column}.labQuestion{padding:20px}.activityActions{align-items:stretch;flex-direction:column}.activityPrimary{width:100%}.sceneHint span{font-size:8px}}`;
