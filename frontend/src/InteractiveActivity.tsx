import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Challenge = {
  title: string;
  symptom: string;
  question: string;
  explanation: string;
};

const challenges: Challenge[] = [
  {
    title: 'Simple Circuit — Trace the Path',
    symptom: 'A 12V bulb should illuminate when the switch is closed.',
    question: 'Inspect the circuit. What must be true for the bulb to receive power?',
    explanation: 'The first task is deliberately simple: trace the complete path from the battery through the switch and back to the battery. There is no fuse or meter in this challenge.'
  },
  {
    title: 'Fuse Inspection — Open the Shield',
    symptom: 'The lamp circuit has stopped working. Inspect the protective device before changing anything.',
    question: 'After opening the fuse shield, what do you find inside?',
    explanation: 'Open the fuse cover and inspect the element. A melted/broken element means the fuse has operated and must be replaced with the correct rated fuse after the cause is checked.'
  },
  {
    title: 'Tool Identification — Pick the Ammeter',
    symptom: 'Select the correct instrument for measuring electrical current.',
    question: 'Pick the AMMETER from the unlabelled tools.',
    explanation: 'An ammeter measures electrical current. The assessment intentionally removes labels so the learner must identify the instrument from its physical appearance.'
  }
];

function mat(color:number, opts:THREE.MeshStandardMaterialParameters={}) {
  return new THREE.MeshStandardMaterial({color, roughness:.45, ...opts});
}
function box(w:number,h:number,d:number,m:THREE.Material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
}
function terminal(color:number) {
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.08,24),mat(color,{metalness:.55,roughness:.25}));
  m.rotation.z=Math.PI/2;
  return m;
}
function wire(a:THREE.Vector3,b:THREE.Vector3,color:number,broken=false) {
  const g=new THREE.Group(), m=mat(color,{roughness:.5});
  const draw=(p1:THREE.Vector3,p2:THREE.Vector3)=>{
    const v=p2.clone().sub(p1), len=v.length();
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,len,10),m);
    mesh.position.copy(p1).add(p2).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());
    g.add(mesh);
  };
  if(!broken) draw(a,b);
  else {
    const mid=a.clone().lerp(b,.5), gap=.24;
    draw(a,mid.clone().add(new THREE.Vector3(-gap,0,0)));
    draw(mid.clone().add(new THREE.Vector3(gap,0,0)),b);
  }
  return g;
}
function createBattery() {
  const g=new THREE.Group(); g.name='battery';
  g.add(box(1.5,1.9,.9,mat(0x202938)));
  const top=box(1.55,.18,.94,mat(0x3c4656,{metalness:.2})); top.position.y=1.04; g.add(top);
  const p=terminal(0xdc2626); p.position.set(-.42,1.18,0); g.add(p);
  const n=terminal(0x111827); n.position.set(.42,1.18,0); g.add(n);
  return g;
}
function createSwitch() {
  const g=new THREE.Group(); g.name='switch';
  g.add(box(1.45,.3,.7,mat(0x303846)));
  const a=terminal(0xdc2626); a.position.set(-.55,.35,0); g.add(a);
  const b=terminal(0x2563eb); b.position.set(.55,.35,0); g.add(b);
  const lever=box(.9,.1,.12,mat(0xcbd5e1,{metalness:.45})); lever.position.set(0,.62,0); lever.rotation.z=-.32; g.add(lever);
  return g;
}
function createLamp() {
  const g=new THREE.Group(); g.name='lamp';
  g.add(box(1.1,.45,.7,mat(0x303846)));
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.35,20),mat(0xc0c6d0,{metalness:.65})); neck.position.y=.3; g.add(neck);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.48,32,20),mat(0xf4f6f8,{roughness:.18,emissive:0x111111})); bulb.position.y=.7; g.add(bulb);
  return g;
}
function createFuse() {
  const g=new THREE.Group(); g.name='fuse';
  g.add(box(1.55,.35,.65,mat(0x303846)));
  const shield=new THREE.Mesh(new THREE.BoxGeometry(1.2,.5,.5),new THREE.MeshPhysicalMaterial({color:0xcfd7e3,transparent:true,opacity:.7,roughness:.08,metalness:.15}));
  shield.position.y=.42; shield.name='shield'; g.add(shield);
  const filament=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.82,12),mat(0xf59e0b,{metalness:.5})); filament.rotation.z=Math.PI/2; filament.position.y=.42; filament.name='filament'; g.add(filament);
  const caps=[-.52,.52].map(x=>{const c=terminal(0xf0b84b); c.position.set(x,.42,0); return c;}); caps.forEach(c=>g.add(c));
  return g;
}
function createMeter(kind:'voltmeter'|'ammeter') {
  const g=new THREE.Group(); g.name=kind;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.72,.72,.3,32),mat(0x1f2937,{roughness:.4})); body.rotation.x=Math.PI/2; g.add(body);
  const face=new THREE.Mesh(new THREE.CircleGeometry(.6,32),mat(0xf8fafc)); face.position.z=.17; g.add(face);
  const needle=box(.05,.48,.03,mat(0xdc2626)); needle.position.set(0,.08,.2); needle.rotation.z=.25; g.add(needle);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.61,.045,12,32),mat(0x374151,{metalness:.45})); ring.position.z=.2; g.add(ring);
  return g;
}
function createSoldering() {
  const g=new THREE.Group(); g.name='soldering';
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,1.35,20),mat(0x374151)); handle.rotation.z=Math.PI/2; g.add(handle);
  const tip=new THREE.Mesh(new THREE.CylinderGeometry(.045,.08,.7,16),mat(0xcbd5e1,{metalness:.7})); tip.rotation.z=Math.PI/2; tip.position.x=.95; g.add(tip);
  return g;
}
function createDrill() {
  const g=new THREE.Group(); g.name='drill';
  const body=box(1.15,.55,.55,mat(0x475569)); g.add(body);
  const grip=box(.28,.85,.35,mat(0x334155)); grip.position.set(-.15,-.45,0); grip.rotation.z=-.12; g.add(grip);
  const chuck=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.35,18),mat(0x94a3b8,{metalness:.7})); chuck.rotation.z=Math.PI/2; chuck.position.x=.75; g.add(chuck);
  return g;
}

export default function InteractiveActivity({onFinish}:{onFinish:(score:number)=>void}) {
  const mount=useRef<HTMLDivElement>(null);
  const [round,setRound]=useState(0);
  const [selected,setSelected]=useState<string|null>(null);
  const [checked,setChecked]=useState(false);
  const [score,setScore]=useState(0);
  const [fuseOpen,setFuseOpen]=useState(false);
  const [notice,setNotice]=useState('');
  const challenge=challenges[round];

  useEffect(()=>{
    if(!mount.current) return;
    const host=mount.current;
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0xf7f9fc);
    const camera=new THREE.PerspectiveCamera(40,host.clientWidth/Math.max(host.clientHeight,1),.1,100);
    camera.position.set(7,6,9);
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.8));
    renderer.setSize(host.clientWidth,host.clientHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.shadowMap.enabled=true;
    host.appendChild(renderer.domElement);

    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;
    controls.target.set(0,.2,0);
    controls.minDistance=4.5;
    controls.maxDistance=15;
    controls.maxPolarAngle=Math.PI*.49;

    scene.add(new THREE.HemisphereLight(0xffffff,0xcbd5e1,2.1));
    const light=new THREE.DirectionalLight(0xffffff,2.8); light.position.set(5,9,6); light.castShadow=true; scene.add(light);
    const floor=new THREE.Mesh(new THREE.BoxGeometry(16,.22,10),mat(0xe9edf2,{roughness:.9})); floor.position.y=-1.1; floor.receiveShadow=true; scene.add(floor);

    const battery=createBattery(), sw=createSwitch(), lamp=createLamp();
    battery.position.set(-3.6,0,0); sw.position.set(0,0,0); lamp.position.set(3.3,0,0);
    const groups:THREE.Group[]=[battery,sw,lamp];
    groups.forEach(g=>{g.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);});

    if(round===0) {
      const bPlus=new THREE.Vector3(-2.85,.9,0), sIn=new THREE.Vector3(-.55,.35,0), sOut=new THREE.Vector3(.55,.35,0), lPlus=new THREE.Vector3(2.8,.65,0), lMinus=new THREE.Vector3(2.8,-.15,0), bMinus=new THREE.Vector3(-2.85,.55,0);
      scene.add(wire(bPlus,sIn,0xdc2626),wire(sOut,lPlus,0xdc2626),wire(lMinus,bMinus,0x111827));
    }
    if(round===1) {
      const fuse=createFuse(); fuse.position.set(-1.85,0,0); groups.push(fuse);
      fuse.children.find(c=>c.name==='shield')!.visible=!fuseOpen;
      const filament=fuse.children.find(c=>c.name==='filament') as THREE.Mesh;
      filament.visible=fuseOpen;
      if(fuseOpen) filament.scale.x=.55;
      groups.forEach(g=>{g.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});});
      const bp=new THREE.Vector3(-2.85,.9,0), fi=new THREE.Vector3(-2.58,.42,0), fo=new THREE.Vector3(-1.12,.42,0), si=new THREE.Vector3(-.55,.35,0), so=new THREE.Vector3(.55,.35,0), lp=new THREE.Vector3(2.8,.65,0), lm=new THREE.Vector3(2.8,-.15,0), bm=new THREE.Vector3(-2.85,.55,0);
      scene.add(wire(bp,fi,0xdc2626),wire(fo,si,0xdc2626),wire(so,lp,0xdc2626),wire(lm,bm,0x111827));
      scene.add(fuse);
      const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
      const onClick=(e:MouseEvent)=>{
        const r=renderer.domElement.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width)*2-1; pointer.y=-((e.clientY-r.top)/r.height)*2+1;
        ray.setFromCamera(pointer,camera);
        if(ray.intersectObjects([fuse],true).length){ setFuseOpen(v=>!v); setNotice(!fuseOpen?'Fuse shield opened — inspect the element.':'Fuse shield closed. Open it again to inspect.'); }
      };
      renderer.domElement.addEventListener('click',onClick);
      let frame=0; const animate=()=>{frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}; animate();
      const resize=()=>{camera.aspect=host.clientWidth/Math.max(host.clientHeight,1);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);};
      window.addEventListener('resize',resize);
      return ()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('click',onClick);controls.dispose();renderer.dispose();host.removeChild(renderer.domElement);window.removeEventListener('resize',resize);};
    }

    if(round===2) {
      scene.clear();
      scene.add(new THREE.HemisphereLight(0xffffff,0xcbd5e1,2.1),light,floor);
      const items=[
        {g:createMeter('voltmeter'),key:'voltmeter',pos:new THREE.Vector3(-3.5,0,0)},
        {g:createMeter('ammeter'),key:'ammeter',pos:new THREE.Vector3(-1.15,0,0)},
        {g:createSoldering(),key:'soldering',pos:new THREE.Vector3(1.4,.15,0)},
        {g:createDrill(),key:'drill',pos:new THREE.Vector3(3.8,.15,0)}
      ];
      items.forEach(({g,pos})=>{g.position.copy(pos);g.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);});
      const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
      const onClick=(e:MouseEvent)=>{
        if(checked)return;
        const r=renderer.domElement.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width)*2-1; pointer.y=-((e.clientY-r.top)/r.height)*2+1; ray.setFromCamera(pointer,camera);
        const hit=ray.intersectObjects(items.map(x=>x.g),true)[0];
        if(hit){let obj=hit.object as THREE.Object3D; while(obj.parent && !items.some(x=>x.g===obj)) obj=obj.parent; const item=items.find(x=>x.g===obj); if(item)setSelected(item.key);}
      };
      renderer.domElement.addEventListener('click',onClick);
      let frame=0; const animate=()=>{frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}; animate();
      const resize=()=>{camera.aspect=host.clientWidth/Math.max(host.clientHeight,1);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);};
      window.addEventListener('resize',resize);
      return ()=>{cancelAnimationFrame(frame);renderer.domElement.removeEventListener('click',onClick);controls.dispose();renderer.dispose();host.removeChild(renderer.domElement);window.removeEventListener('resize',resize);};
    }

    let frame=0; const animate=()=>{frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}; animate();
    const resize=()=>{camera.aspect=host.clientWidth/Math.max(host.clientHeight,1);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);};
    window.addEventListener('resize',resize);
    return ()=>{cancelAnimationFrame(frame);controls.dispose();renderer.dispose();host.removeChild(renderer.domElement);window.removeEventListener('resize',resize);};
  },[round,fuseOpen,checked]);

  const check=()=>{
    if(round===0) { setSelected('complete-circuit'); setChecked(true); setScore(s=>s+5); }
    else if(round===1) { if(!fuseOpen){setNotice('Open the fuse shield first, then inspect the fuse element.');return;} setSelected('melted'); setChecked(true); setScore(s=>s+5); }
    else { if(!selected){setNotice('Pick one of the four unlabelled tools.');return;} setChecked(true); if(selected==='ammeter')setScore(s=>s+5); }
  };
  const next=()=>{
    if(round===2){onFinish(score);return;}
    setRound(r=>r+1);setSelected(null);setChecked(false);setFuseOpen(false);setNotice('');
  };

  const answerText=round===0?'Complete path: battery → switch → bulb → battery return':round===1?'The fuse element is melted/open. It has operated and should be replaced with the correct rated fuse after the cause is checked.':selected==='ammeter'?'Correct — you identified the ammeter.':'Not quite — the selected tool is not an ammeter.';
  const correct=round<2||selected==='ammeter';

  return <div className="activityPage threeLab">
    <style>{css}</style>
    <header className="activityHeader"><div><div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div><strong>Technical Activity</strong></div><div className="activityScore">⚡ {score}/15</div></header>
    <main className="activityMain">
      <div className="activityIntro"><div><div className="eyebrow">STAGE 2 • 3D INTERACTIVE VALIDATION</div><h1>Electrical <span>Troubleshooting Lab</span></h1><p>Inspect, rotate and zoom the 3D equipment. Each challenge asks you to discover something physically rather than read it from the screen.</p></div><div className="activityProgress"><b>{round+1}/3</b><small>challenges</small></div></div>
      <div className="activityTrack"><i style={{width:`${((round+1)/3)*100}%`}}/></div>
      <section className="labGrid">
        <section className="labSceneCard">
          <div className="sceneToolbar"><div><b>Interactive 3D Workbench</b><small>Drag to rotate • wheel to zoom • right-drag to pan</small></div><div className="modeButtons"><span className="modePill">3D INSPECTION</span></div></div>
          <div className="threeViewport" ref={mount}/>
          <div className="sceneHint"><span>🖱️ Drag = rotate</span><span>◉ Wheel = zoom</span><span>⇧ Right-drag = pan</span>{round===1&&<span>🔎 Click fuse shield = open / close</span>}{round===2&&<span>🎯 Click a tool = select</span>}</div>
          {notice&&<div className="labNotice">{notice}</div>}
        </section>
        <section className="activityCard activityQuestion labQuestion">
          <div className="questionMeta"><span>Challenge {round+1} of 3</span><span>5 points</span></div>
          <div className="fieldBadge">FIELD TASK</div><h2>{challenge.title}</h2><p className="symptom">{challenge.symptom}</p>
          <div className="labRule"><b>Technician rule</b><span>Think → inspect → verify → act</span></div>
          <h3>{challenge.question}</h3>
          {round===0&&<div className="taskInstruction">No answer choices here. Trace the simple circuit and confirm when you have inspected it.</div>}
          {round===1&&<div className="taskInstruction">Click the transparent fuse shield in the 3D model to open it. Inspect the element inside, then validate your finding.</div>}
          {round===2&&<div className="selectedTool">{selected?<><b>Selected:</b> {selected==='ammeter'?'Tool 2':selected==='voltmeter'?'Tool 1':selected==='soldering'?'Tool 3':'Tool 4'}</>:<span>No tool selected</span>}</div>}
          {!checked&&<button className="activityPrimary full" onClick={check}>{round===2?'Validate selected tool':'Validate inspection'}</button>}
          {checked&&<div className={`activityFeedback ${correct?'good':'bad'}`}><b>{correct?'Correct':'Review your selection'}</b><p>{answerText}</p></div>}
          <div className="activityActions"><span>{checked?(correct?'+5 points':'0 points'):'Complete the physical inspection before validating.'}</span>{checked&&<button className="activityPrimary" onClick={next}>{round===2?'Continue to practical →':'Next challenge →'}</button>}</div>
        </section>
      </section>
    </main>
  </div>;
}


const css=`*{box-sizing:border-box}.threeLab{min-height:100vh;width:100%;padding:0 28px 60px;background:radial-gradient(circle at 50% 0,#fff 0,#f3f6fb 65%);color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.activityHeader{width:100%;max-width:1240px;margin:0 auto;padding:22px 0;display:flex;align-items:center;justify-content:space-between;gap:20px}.activityHeader strong{display:block;font-size:20px;margin-top:3px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:2px;color:#71809a;text-transform:uppercase}.activityScore{min-width:92px;padding:11px 16px;border-radius:14px;background:#141c2e;color:#fff;text-align:center;font-weight:800}.activityMain{width:100%;max-width:1240px;margin:22px auto 0}.activityIntro{display:flex;align-items:flex-end;justify-content:space-between;gap:30px}.activityIntro h1{margin:12px 0 10px;color:#151d2f;font-size:46px;line-height:1.08}.activityIntro h1 span{color:#3863ed}.activityIntro p{margin:0;max-width:820px;color:#68758b;font-size:16px;line-height:1.65}.activityProgress{padding:14px 18px;border-radius:15px;background:#141c2e;color:#fff;text-align:center}.activityProgress b,.activityProgress small{display:block}.activityProgress small{margin-top:3px;font-size:9px;color:#b9c1d1}.activityTrack{height:7px;margin:24px 0 20px;background:#e5e9f0;border-radius:99px;overflow:hidden}.activityTrack i{display:block;height:100%;background:#3863ed;border-radius:99px;transition:.25s}.labGrid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(350px,.85fr);gap:20px;align-items:stretch}.labSceneCard{background:#fff;border:1px solid #e1e6ee;border-radius:20px;box-shadow:0 14px 35px rgba(23,32,51,.07);padding:18px;min-width:0}.sceneToolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.sceneToolbar b,.sceneToolbar small{display:block}.sceneToolbar small{font-size:10px;color:#8290a4;margin-top:3px}.modeButtons{display:flex;gap:7px}.modeButtons button{border:1px solid #dfe5ee;background:#fff;border-radius:10px;padding:9px 12px;font-size:11px;font-weight:800;color:#56647b}.modeButtons button.active{background:#3863ed;border-color:#3863ed;color:#fff}.threeViewport{height:520px;min-height:420px;border-radius:15px;overflow:hidden;background:#f7f9fc;cursor:grab}.threeViewport:active{cursor:grabbing}.threeViewport canvas{display:block;width:100%;height:100%}.sceneHint{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.sceneHint span{font-size:9px;font-weight:800;color:#68758b;background:#f4f6f9;border:1px solid #e3e7ed;border-radius:99px;padding:7px 9px}.labQuestion{padding:25px}.fieldBadge{display:inline-block;margin-top:24px;padding:6px 9px;border-radius:8px;background:#eef4ff;color:#3863ed;font-size:9px;font-weight:900;letter-spacing:1px}.labQuestion h2{margin:10px 0 8px;font-size:24px;line-height:1.2}.symptom{margin:0;color:#68758b;font-size:13px;line-height:1.65}.labRule{margin:18px 0;padding:12px;border:1px solid #e4e9f1;border-radius:12px;background:#f7f9fd}.labRule b,.labRule span{display:block}.labRule b{font-size:10px;color:#3863ed}.labRule span{font-size:11px;color:#69768a;margin-top:4px}.labQuestion h3{font-size:16px;line-height:1.35;margin:20px 0 12px}.activityOptions{display:grid;gap:9px}.activityOptions button{width:100%;display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #dfe5ee;border-radius:12px;background:#fff;color:#172033;font:inherit;font-size:12px;text-align:left}.activityOptions button b{flex:0 0 30px;width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:#eef2f7}.activityOptions button span{flex:1}.activityOptions button em{margin-left:auto;font-style:normal;font-size:17px;font-weight:900}.activityOptions button.correct{border-color:#9ad9b4;background:#f0fbf4}.activityOptions button.wrong{border-color:#f0a4a4;background:#fff5f5}.activityFeedback{margin-top:13px;padding:12px;border-radius:12px}.activityFeedback.good{background:#eefbf2;border:1px solid #b8e6c7}.activityFeedback.bad{background:#fff5f5;border:1px solid #f1c2c2}.activityFeedback p{font-size:10px;color:#68758b;line-height:1.55;margin:5px 0 0}.activityActions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px;color:#7a8799;font-size:10px;font-weight:700}.activityPrimary{border:0;border-radius:11px;padding:12px 15px;background:#3863ed;color:#fff;font:inherit;font-size:11px;font-weight:800;cursor:pointer}@media(max-width:1050px){.labGrid{grid-template-columns:1fr}.threeViewport{height:500px}.activityIntro{align-items:flex-start}}@media(max-width:600px){.threeLab{padding:0 12px 40px}.activityIntro{display:block}.activityIntro h1{font-size:32px}.activityProgress{display:inline-block;margin-top:16px}.labSceneCard{padding:12px}.threeViewport{height:400px;min-height:350px}.sceneToolbar{align-items:flex-start;flex-direction:column}.labQuestion{padding:20px}.activityActions{align-items:stretch;flex-direction:column}.activityPrimary{width:100%}.sceneHint span{font-size:8px}}`;
