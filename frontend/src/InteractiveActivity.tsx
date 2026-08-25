import { useMemo, useState } from 'react';

type Scenario = {
  title: string;
  icon: string;
  observation: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

const scenarios: Scenario[] = [
  {
    title: 'Dead Lamp — Find the Fault',
    icon: '💡',
    observation: 'The 12V lamp does not turn ON. The battery is healthy and the switch is ON. The fuse looks open.',
    question: 'What should the technician do first?',
    options: ['Replace the fuse with a higher rating', 'Replace the blown fuse with the correct rated fuse', 'Short the fuse temporarily', 'Increase the battery voltage'],
    answer: 1,
    explanation: 'A blown fuse indicates overcurrent protection has operated. Replace it only with the correct rated fuse after checking the cause.'
  },
  {
    title: 'Meter Challenge — Choose the Right Mode',
    icon: '🔧',
    observation: 'You need to measure the voltage directly across a powered 12V battery.',
    question: 'Which meter setup is correct?',
    options: ['DC voltage mode, probes across + and −', 'Current mode, probes across + and −', 'Resistance mode across a powered battery', 'AC voltage mode across + and −'],
    answer: 0,
    explanation: 'A battery provides DC voltage. Voltage is measured across the source, with the meter in DC voltage mode.'
  },
  {
    title: 'Safety Challenge — Before Energising',
    icon: '⚠️',
    observation: 'You have assembled a circuit but the wire colours and terminals have not been checked yet.',
    question: 'What is the safest next action?',
    options: ['Energise it immediately', 'Touch the terminals to test them', 'Verify connections, polarity and protection before energising', 'Remove the fuse and energise the circuit'],
    answer: 2,
    explanation: 'A competent technician verifies polarity, connections and protection before applying power.'
  }
];

export default function InteractiveActivity({ onFinish }: { onFinish: (score: number) => void }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const scenario = scenarios[round];
  const correct = selected === scenario.answer;
  const progress = useMemo(() => Math.round((round / scenarios.length) * 100), [round]);

  const choose = (index: number) => {
    if (checked) return;
    setSelected(index);
    setChecked(true);
    if (index === scenario.answer) setScore((value) => value + 5);
  };

  const next = () => {
    if (round === scenarios.length - 1) {
      onFinish(score);
      return;
    }
    setRound((value) => value + 1);
    setSelected(null);
    setChecked(false);
  };

  return (
    <div className="activityPage">
      <style>{activityCss}</style>

      <header className="activityHeader">
        <div>
          <div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div>
          <strong>Technical Activity</strong>
        </div>
        <div className="activityScore">⚡ {score}/15</div>
      </header>

      <main className="activityMain">
        <div className="activityIntro">
          <div className="introCopy">
            <div className="eyebrow">STAGE 2 • INTERACTIVE VALIDATION</div>
            <h1>Electrical <span>Troubleshooting Lab</span></h1>
            <p>Inspect each field situation, choose the safest technical action, and validate your decision.</p>
          </div>
          <div className="activityProgress">
            <b>{round + 1}/3</b>
            <small>challenges</small>
          </div>
        </div>

        <div className="activityTrack" aria-label="Activity progress">
          <i style={{ width: `${Math.max(progress, 33.33)}%` }} />
        </div>

        <section className="activityGrid">
          <aside className="activityCard activityScenario">
            <div className="scenarioIcon">{scenario.icon}</div>
            <div className="eyebrow">FIELD SCENARIO</div>
            <h2>{scenario.title}</h2>
            <p>{scenario.observation}</p>
            <div className="scenarioRule">
              <b>Technician rule</b>
              <span>Think → inspect → verify → act</span>
            </div>
          </aside>

          <section className="activityCard activityQuestion">
            <div className="questionMeta">
              <span>Challenge {round + 1} of {scenarios.length}</span>
              <span>5 points</span>
            </div>
            <h2>{scenario.question}</h2>

            <div className="activityOptions">
              {scenario.options.map((option, index) => {
                const state = !checked ? '' : index === scenario.answer ? 'correct' : index === selected ? 'wrong' : '';
                return (
                  <button key={option} className={state} onClick={() => choose(index)} disabled={checked}>
                    <b>{String.fromCharCode(65 + index)}</b>
                    <span>{option}</span>
                    {checked && index === scenario.answer && <em>✓</em>}
                    {checked && index === selected && index !== scenario.answer && <em>×</em>}
                  </button>
                );
              })}
            </div>

            {checked && (
              <div className={`activityFeedback ${correct ? 'good' : 'bad'}`}>
                <b>{correct ? 'Correct decision' : 'Review this decision'}</b>
                <p>{scenario.explanation}</p>
              </div>
            )}

            <div className="activityActions">
              <span>{checked ? (correct ? '+5 points' : '0 points') : 'Select one answer to validate'}</span>
              {checked && (
                <button className="activityPrimary" onClick={next}>
                  {round === scenarios.length - 1 ? 'Continue to circuit →' : 'Next challenge →'}
                </button>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

const activityCss = `
*{box-sizing:border-box}
.activityPage{
  min-height:100vh;
  width:100%;
  padding:0 28px 60px;
  background:radial-gradient(circle at 50% 0,#fff 0,#f3f6fb 65%);
  color:#172033;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
}
.activityHeader{
  width:100%;
  max-width:1240px;
  margin:0 auto;
  padding:22px 0;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
}
.activityHeader strong{display:block;font-size:20px;margin-top:3px}
.eyebrow{font-size:10px;font-weight:900;letter-spacing:2px;color:#71809a;text-transform:uppercase}
.activityScore{
  min-width:92px;
  padding:11px 16px;
  border-radius:14px;
  background:#141c2e;
  color:#fff;
  text-align:center;
  font-weight:800;
  box-shadow:0 8px 20px rgba(20,28,46,.12)
}
.activityMain{width:100%;max-width:1120px;margin:22px auto 0}
.activityIntro{display:flex;align-items:flex-end;justify-content:space-between;gap:30px}
.introCopy{min-width:0}
.activityIntro h1{
  margin:12px 0 10px;
  color:#151d2f;
  font-size:46px;
  line-height:1.08;
  letter-spacing:-1.2px;
}
.activityIntro h1 span{color:#3863ed}
.activityIntro p{margin:0;max-width:780px;color:#68758b;font-size:16px;line-height:1.65}
.activityProgress{
  flex:0 0 92px;
  padding:14px 12px;
  border-radius:15px;
  background:#141c2e;
  color:#fff;
  text-align:center;
}
.activityProgress b,.activityProgress small{display:block}
.activityProgress b{font-size:21px}
.activityProgress small{margin-top:3px;font-size:9px;color:#b9c1d1}
.activityTrack{height:7px;margin:24px 0 20px;background:#e5e9f0;border-radius:99px;overflow:hidden}
.activityTrack i{display:block;height:100%;min-width:0;background:#3863ed;border-radius:99px;transition:width .25s ease}
.activityGrid{display:grid;grid-template-columns:360px minmax(0,1fr);gap:20px;align-items:start}
.activityCard{
  min-width:0;
  background:#fff;
  border:1px solid #e1e6ee;
  border-radius:20px;
  box-shadow:0 14px 35px rgba(23,32,51,.07)
}
.activityScenario{padding:28px}
.scenarioIcon{
  width:64px;height:64px;
  display:grid;place-items:center;
  margin-bottom:22px;
  border-radius:18px;
  background:#eef4ff;
  font-size:34px
}
.activityScenario h2,.activityQuestion h2{margin:10px 0 14px;font-size:25px;line-height:1.25;letter-spacing:-.3px}
.activityScenario>p{margin:0;color:#68758b;font-size:14px;line-height:1.7}
.scenarioRule{margin-top:25px;padding:14px;border:1px solid #e4e9f1;border-radius:13px;background:#f7f9fd}
.scenarioRule b,.scenarioRule span{display:block}
.scenarioRule b{font-size:11px;color:#3863ed}
.scenarioRule span{margin-top:5px;font-size:12px;color:#69768a}
.activityQuestion{padding:28px}
.questionMeta{display:flex;align-items:center;justify-content:space-between;gap:15px;color:#6b778d;font-size:12px;font-weight:800}
.questionMeta span:last-child{color:#3863ed}
.activityQuestion h2{margin-top:30px;font-size:27px}
.activityOptions{display:grid;gap:11px;margin-top:24px}
.activityOptions button{
  width:100%;
  display:flex;
  align-items:center;
  gap:14px;
  padding:14px 15px;
  border:1px solid #dfe5ee;
  border-radius:13px;
  background:#fff;
  color:#172033;
  font:inherit;
  font-size:14px;
  line-height:1.4;
  text-align:left;
  cursor:pointer;
  transition:border-color .18s,background .18s,transform .18s
}
.activityOptions button:hover:not(:disabled){border-color:#3863ed;background:#f5f8ff;transform:translateY(-1px)}
.activityOptions button:disabled{cursor:default}
.activityOptions button b{
  flex:0 0 34px;
  width:34px;height:34px;
  display:grid;place-items:center;
  border-radius:9px;
  background:#eef2f7;
  font-size:13px
}
.activityOptions button span{flex:1}
.activityOptions button em{margin-left:auto;font-style:normal;font-size:18px;font-weight:900}
.activityOptions button.correct{border-color:#9ad9b4;background:#f0fbf4}
.activityOptions button.correct b{background:#dff7e8;color:#16824b}
.activityOptions button.wrong{border-color:#f0a4a4;background:#fff5f5}
.activityOptions button.wrong b{background:#fee2e2;color:#b91c1c}
.activityFeedback{margin-top:16px;padding:14px;border-radius:13px}
.activityFeedback.good{background:#eefbf2;border:1px solid #b8e6c7}
.activityFeedback.bad{background:#fff5f5;border:1px solid #f1c2c2}
.activityFeedback b{font-size:12px}
.activityFeedback p{margin:5px 0 0;color:#68758b;font-size:11px;line-height:1.55}
.activityActions{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:20px;color:#7a8799;font-size:11px;font-weight:700}
.activityPrimary{
  border:0;
  border-radius:12px;
  padding:13px 18px;
  background:#3863ed;
  color:#fff;
  font:inherit;
  font-size:13px;
  font-weight:800;
  box-shadow:0 8px 20px rgba(56,99,237,.18);
  cursor:pointer
}
@media(max-width:850px){
  .activityPage{padding:0 16px 40px}
  .activityMain{margin-top:10px}
  .activityIntro{align-items:flex-start}
  .activityGrid{grid-template-columns:1fr}
  .activityIntro h1{font-size:38px}
}
@media(max-width:600px){
  .activityHeader{padding:16px 0}
  .activityHeader strong{font-size:17px}
  .activityScore{min-width:78px;padding:10px 12px;font-size:12px}
  .activityIntro{display:block}
  .activityProgress{display:inline-block;margin-top:16px}
  .activityIntro h1{font-size:32px}
  .activityScenario,.activityQuestion{padding:20px}
  .activityActions{align-items:stretch;flex-direction:column}
  .activityPrimary{width:100%}
}
`;
