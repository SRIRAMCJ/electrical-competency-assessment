import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { t, useLanguage } from './i18n';

const CIRCUIT_ASSET_URL = 'https://cdn.jsdelivr.net/gh/SRIRAMCJ/electrical-competency-assessment@main/circuit/circuit.glb';

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
    title: 'Scenario Challenge — Why Is the Bulb Dead?',
    symptom: 'The technician reports that the bulb is not illuminating even though the circuit contains the battery, switch, wiring and bulb. Inspect the supplied 3D circuit carefully before diagnosing the fault.',
    question: 'What most likely happened to the circuit and is causing the bulb to remain off?',
    correct: 'switch-wire-disconnected',
    explanation: 'The wire is disconnected near the switch, leaving the circuit open. Current cannot complete its path from the battery through the switch and bulb and back to the battery, so the bulb remains off.',
    options: [
      { id: 'switch-wire-disconnected', text: 'The wire is disconnected near the switch, creating an open circuit.' },
      { id: 'battery-reversed', text: 'The battery polarity is reversed, so the bulb cannot receive power.' },
      { id: 'bulb-short', text: 'The bulb is short-circuited by another wire, bypassing the lamp.' },
      { id: 'high-resistance', text: 'The bulb has too much resistance for the battery to supply current.' }
    ],
    assets: [{ key: 'circuit', x: 0, y: 0, z: 0, size: 5.8 }]
  },
  {
    title: 'Scenario Challenge — Identify the Fault Type',
    symptom: 'The same 3D circuit shows a visible gap in the conductor near the switch. The bulb remains off because the current path is interrupted.',
    question: 'How should the visible fault in this circuit be classified?',
    correct: 'open-circuit',
    explanation: 'A break or disconnection in the conducting path is an open circuit. With the path open, current cannot complete the loop and the lamp cannot operate.',
    options: [
      { id: 'open-circuit', text: 'It is an open-circuit fault caused by a broken or disconnected conductor.' },
      { id: 'short-circuit', text: 'It is a short circuit that bypasses the bulb.' },
      { id: 'overload', text: 'It is an overload caused by excessive current through the bulb.' },
      { id: 'polarity', text: 'It is a polarity fault caused by reversing the battery terminals.' }
    ],
    assets: [{ key: 'circuit', x: 0, y: 0, z: 0, size: 5.8 }]
  },
  {
    title: 'Scenario Challenge — Safe First Action',
    symptom: 'The technician has identified the visible open circuit and is preparing to inspect the wiring around the switch before any repair is attempted.',
    question: 'What is the appropriate first action before working on the electrical circuit?',
    correct: 'deenergize-verify',
    explanation: 'Before working on an electrical circuit, isolate/de-energize it and verify the de-energized condition with appropriate test equipment. This reduces the risk of electrical shock during inspection or repair.',
    options: [
      { id: 'deenergize-verify', text: 'De-energize the circuit and verify that it is safely de-energized before working on it.' },
      { id: 'replace-bulb', text: 'Replace the bulb immediately without checking the circuit.' },
      { id: 'bypass-switch', text: 'Bypass the switch with another wire while the circuit is energized.' },
      { id: 'increase-voltage', text: 'Increase the battery voltage to force current through the circuit.' }
    ],
    assets: [{ key: 'circuit', x: 0, y: 0, z: 0, size: 5.8 }]
  }
]

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

async function loadGLB(url: string) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  return gltf.scene;
}

function fitObject(object: THREE.Object3D, targetSize: number) {
  // Normalize the authored model, then place its footprint at the exact
  // center of the workbench plane. This keeps the supplied circuit centered
  // regardless of the GLB's original scene origin.
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const largest = Math.max(size.x, size.y, size.z) || 1;
  object.scale.setScalar(targetSize / largest);

  const fitted = new THREE.Box3().setFromObject(object);
  const center = fitted.getCenter(new THREE.Vector3());

  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= fitted.min.y;
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

type ScenarioResult = { challenge: number; selected: string | null; correct: boolean };

export default function InteractiveActivity({ onFinish }: { onFinish: (score: number, results: ScenarioResult[]) => void }) {
  const lang = useLanguage();
  const mount = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);
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

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9e0e8, 2.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    // No synthetic base/floor: the scenario must display only the authored
    // circuit.glb and its own geometry.

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

      // The workbench plane is centered at world (0, 0, 0). Keep the
      // inspection camera centered on that same point so the complete
      // authored circuit appears in the middle of the plane.
      const bounds = new THREE.Box3();
      visible.forEach(o => bounds.expandByObject(o));
      const size = bounds.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, size.y, size.z, 3.8);

      controls.target.set(0, 0.05, 0);
      camera.position.set(radius * 0.95, radius * 0.62, radius * 1.15);
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
              object = await loadGLB(CIRCUIT_ASSET_URL);
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
            components[item.key + '_' + Object.keys(components).length] = object;
          } catch (assetError) {
            failedAssets.push(`${item.key}: ${assetError instanceof Error ? assetError.message : 'request failed'}`);
          }
        }

        const list = Object.values(components);
        if (failedAssets.length) {
          setNotice(`Some repository 3D elements could not be loaded — ${failedAssets.join(' | ')}`);
        }

        const circuit = list.find(o => o.userData.assetKey === 'circuit');
        if (circuit) {
          circuit.userData.role = 'faulty-authored-circuit';
          circuit.userData.fault = 'wire-disconnected-near-switch';
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
    }
    setNotice('Diagnosis recorded. The answer will be revealed in the final result.');
  };

  const next = () => {
    const nextScore = score + (selected === challenge.correct ? 5 : 0);
    const result: ScenarioResult = {
      challenge: round + 1,
      selected,
      correct: selected === challenge.correct
    };
    if (round === challenges.length - 1) {
      onFinish(nextScore, [...scenarioResults, result]);
      return;
    }
    setScore(nextScore);
    setScenarioResults(current => [...current, result]);
    setRound(current => current + 1);
  };

  const correct = selected === challenge.correct;

  return (
    <div className="activityPage threeLab">
      <style>{css}</style>
      <header className="activityHeader">
        <div>
          <div className="eyebrow">{t(lang,'Electrical Competency Assessment')}</div>
          <strong>{t(lang,'Technical Activity')}</strong>
        </div>
        <div className="activityScore">⚡ {score}/5</div>
      </header>

      <main className="activityMain">
        <div className="activityIntro">
          <div>
            <div className="eyebrow">STAGE 2 • 3D INTERACTIVE VALIDATION</div>
            <h1>{lang==='en'?'Electrical':lang==='hi'?'इलेक्ट्रिकल':'ଇଲେକ୍ଟ୍ରିକାଲ୍'} <span>{t(lang,'Electrical Troubleshooting Lab')}</span></h1>
            <p>{t(lang,'Inspect the complete authored 3D circuit by rotating the whole view, then diagnose what happened to the circuit. This scenario uses the authored circuit.glb from the repository circuit folder. Inspect the actual physical arrangement and find the visible open-circuit fault.')}</p>
          </div>
          <div className="activityProgress"><b>{round + 1}/{challenges.length}</b><small>challenge</small></div>
        </div>

        <div className="activityTrack"><i style={{ width: `${((round + 1) / challenges.length) * 100}%` }} /></div>

        <section className="labGrid">
          <section className="labSceneCard">
            <div className="sceneToolbar">
              <div>
                <b>{t(lang,'3D Interactive Workbench')}</b>
                <small>{t(lang,'Drag = rotate entire circuit • wheel = zoom • right-drag = pan • individual components are fixed')}</small>
              </div>
              <span className="modePill">{t(lang,'REPOSITORY 3D ELEMENTS')}</span>
            </div>

            <div className="threeViewport" ref={mount}>
              {loading && <div className="assetLoading">Loading 3D elements…</div>}
            </div>

            <div className="sceneHint">
              <span>🖱️ {t(lang,'Drag = rotate view')}</span>
              <span>◉ {t(lang,'Wheel = zoom')}</span>
              <span>⇧ {t(lang,'Right-drag = pan')}</span>
              <span>🔒 {t(lang,'Circuit is fixed — rotate only')}</span>
            </div>

            {notice && <div className="labNotice">{notice}</div>}
          </section>

          <section className="activityCard activityQuestion labQuestion">
            <div className="questionMeta"><span>Challenge {round + 1} of {challenges.length}</span><span>5 points</span></div>
            <div className="fieldBadge">{t(lang,'FIELD DIAGNOSIS')}</div>
            <h2>{t(lang,challenge.title)}</h2>
            <p className="symptom">{t(lang,challenge.symptom)}</p>

            <div className="labRule">
              <b>{t(lang,'Technician rule')}</b>
              <span>{t(lang,'Inspect the physical circuit before choosing a diagnosis.')}</span>
            </div>

            <h3>{t(lang,challenge.question)}</h3>

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
                  <span>{t(lang,option.text)}</span>
                </button>
              ))}
            </div>

            {!checked && (
              <button className="activityPrimary full" onClick={validate}>{t(lang,'Record diagnosis')}</button>
            )}

            {checked && (
              <div className="activityRecorded">
                <b>{t(lang,'Diagnosis recorded')}</b>
                <p>{t(lang,'Your answer has been saved. The correct diagnosis and explanation will be revealed in the final result.')}</p>
              </div>
            )}

            <div className="activityActions">
              <span>{checked ? (lang==='en'?'+5 points available in the final report':lang==='hi'?'+5 अंक अंतिम रिपोर्ट में उपलब्ध हैं':'+5 ପଏଣ୍ଟ ଅନ୍ତିମ ରିପୋର୍ଟରେ ଉପଲବ୍ଧ') : t(lang,'Choose the diagnosis that best matches the 3D evidence.')}</span>
              {checked && <button className="activityPrimary" onClick={next}>{round === challenges.length - 1 ? t(lang,'Continue →') : (lang==='en'?'Next challenge →':lang==='hi'?'अगली चुनौती →':'ପରବର୍ତ୍ତୀ ଚ୍ୟାଲେଞ୍ଜ →')}</button>}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

const css = `*{box-sizing:border-box}.threeLab{min-height:100vh;width:100%;padding:0 28px 60px;background:radial-gradient(circle at 50% 0,#fff 0,#f3f6fb 65%);color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.activityHeader{width:100%;max-width:1240px;margin:0 auto;padding:22px 0;display:flex;align-items:center;justify-content:space-between;gap:20px}.activityHeader strong{display:block;font-size:20px;margin-top:3px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:2px;color:#71809a;text-transform:uppercase}.activityScore{min-width:92px;padding:11px 16px;border-radius:14px;background:#141c2e;color:#fff;text-align:center;font-weight:800}.activityMain{width:100%;max-width:1240px;margin:22px auto 0}.activityIntro{display:flex;align-items:flex-end;justify-content:space-between;gap:30px}.activityIntro h1{margin:12px 0 10px;color:#151d2f;font-size:46px;line-height:1.08}.activityIntro h1 span{color:#3863ed}.activityIntro p{margin:0;max-width:820px;color:#68758b;font-size:16px;line-height:1.65}.activityProgress{padding:14px 18px;border-radius:15px;background:#141c2e;color:#fff;text-align:center}.activityProgress b,.activityProgress small{display:block}.activityProgress small{margin-top:3px;font-size:9px;color:#b9c1d1}.activityTrack{height:7px;margin:24px 0 20px;background:#e5e9f0;border-radius:99px;overflow:hidden}.activityTrack i{display:block;height:100%;background:#3863ed;border-radius:99px;transition:.25s}.labGrid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(350px,.85fr);gap:20px;align-items:stretch}.labSceneCard{background:#fff;border:1px solid #e1e6ee;border-radius:20px;box-shadow:0 14px 35px rgba(23,32,51,.07);padding:18px;min-width:0}.sceneToolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.sceneToolbar b,.sceneToolbar small{display:block}.sceneToolbar small{font-size:10px;color:#8290a4;margin-top:3px}.modePill{padding:8px 10px;border-radius:10px;background:#eef4ff;color:#3863ed;font-size:9px;font-weight:900;letter-spacing:.7px}.threeViewport{height:560px;min-height:460px;border-radius:15px;overflow:hidden;background:linear-gradient(180deg,#f4f7fb 0%,#eef2f7 100%);cursor:grab;position:relative}.threeViewport:active{cursor:grabbing}.threeViewport canvas{display:block;width:100%;height:100%}.assetLoading{position:absolute;z-index:2;inset:0;display:grid;place-items:center;color:#68758b;font-size:12px;font-weight:800;background:rgba(247,249,252,.72);pointer-events:none}.sceneHint{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.sceneHint span{font-size:9px;font-weight:800;color:#68758b;background:#f4f6f9;border:1px solid #e3e7ed;border-radius:99px;padding:7px 9px}.labNotice{margin-top:10px;padding:10px 12px;border:1px solid #dbe5f4;border-radius:11px;background:#f5f8fe;color:#4e5f78;font-size:11px}.labQuestion{padding:25px}.fieldBadge{display:inline-block;margin-top:24px;padding:6px 9px;border-radius:8px;background:#eef4ff;color:#3863ed;font-size:9px;font-weight:900;letter-spacing:1px}.labQuestion h2{margin:10px 0 8px;font-size:24px;line-height:1.2}.symptom{margin:0;color:#68758b;font-size:13px;line-height:1.65}.labRule{margin:18px 0;padding:12px;border:1px solid #e4e9f1;border-radius:12px;background:#f7f9fd}.labRule b,.labRule span{display:block}.labRule b{font-size:10px;color:#3863ed}.labRule span{font-size:11px;color:#69768a;margin-top:4px}.labQuestion h3{font-size:16px;line-height:1.35;margin:20px 0 12px}.scenarioOptions{display:grid;gap:9px}.scenarioOption{width:100%;display:flex;align-items:flex-start;gap:11px;text-align:left;padding:12px;border:1px solid #e1e6ee;border-radius:12px;background:#fff;color:#172033;font:inherit;font-size:11px;line-height:1.45;cursor:pointer;transition:.16s}.scenarioOption:hover:not(:disabled){border-color:#9db3f5;transform:translateY(-1px)}.scenarioOption.selected{border-color:#3863ed;background:#f0f4ff;box-shadow:0 0 0 2px rgba(56,99,237,.08)}.scenarioOption:disabled{cursor:default}.optionLetter{flex:0 0 25px;width:25px;height:25px;display:grid;place-items:center;border-radius:8px;background:#eef1f5;font-size:10px;font-weight:900}.scenarioOption.selected .optionLetter{background:#3863ed;color:#fff}.activityPrimary{border:0;border-radius:11px;padding:12px 15px;background:#3863ed;color:#fff;font:inherit;font-size:11px;font-weight:800;cursor:pointer}.activityPrimary.full{width:100%;margin-top:12px}.activityActions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px;color:#7a8799;font-size:10px;font-weight:700}@media(max-width:1050px){.labGrid{grid-template-columns:1fr}.threeViewport{height:500px}.activityIntro{align-items:flex-start}}@media(max-width:600px){.threeLab{padding:0 12px 40px}.activityIntro{display:block}.activityIntro h1{font-size:32px}.activityProgress{display:inline-block;margin-top:16px}.labSceneCard{padding:12px}.threeViewport{height:400px;min-height:350px}.sceneToolbar{align-items:flex-start;flex-direction:column}.labQuestion{padding:20px}.activityActions{align-items:stretch;flex-direction:column}.activityPrimary{width:100%}.sceneHint span{font-size:8px}}`;
