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
    <div className="page">
      <header className="header">
        <div><div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div><strong>Technical Activity</strong></div>
        <div className="timer">⚡ {score}/15</div>
      </header>
      <main className="activityPage">
        <div className="activityIntro">
          <div>
            <div className="eyebrow">STAGE 2 • INTERACTIVE VALIDATION</div>
            <h1>Electrical <span>Troubleshooting Lab</span></h1>
            <p>Inspect each field situation, choose the safest technical action, and validate your decision.</p>
          </div>
          <div className="activityProgress"><b>{round + 1}/3</b><small>challenges</small></div>
        </div>
        <div className="activityTrack"><i style={{ width: `${progress}%` }} /></div>
        <section className="activityGrid">
          <aside className="card activityScenario">
            <div className="scenarioIcon">{scenario.icon}</div>
            <div className="eyebrow">FIELD SCENARIO</div>
            <h2>{scenario.title}</h2>
            <p>{scenario.observation}</p>
            <div className="scenarioRule"><b>Technician rule</b><span>Think → inspect → verify → act</span></div>
          </aside>
          <section className="card activityQuestion">
            <div className="meta"><span>Challenge {round + 1} of {scenarios.length}</span><span>5 points</span></div>
            <h2>{scenario.question}</h2>
            <div className="activityOptions">
              {scenario.options.map((option, index) => {
                const state = !checked ? '' : index === scenario.answer ? 'correct' : index === selected ? 'wrong' : '';
                return <button key={option} className={state} onClick={() => choose(index)} disabled={checked}>
                  <b>{String.fromCharCode(65 + index)}</b><span>{option}</span>
                  {checked && index === scenario.answer && <em>✓</em>}
                  {checked && index === selected && index !== scenario.answer && <em>×</em>}
                </button>;
              })}
            </div>
            {checked && <div className={`activityFeedback ${correct ? 'good' : 'bad'}`}><b>{correct ? 'Correct decision' : 'Review this decision'}</b><p>{scenario.explanation}</p></div>}
            <div className="activityActions">
              <span>{checked ? (correct ? '+5 points' : '0 points') : 'Select one answer to validate'}</span>
              {checked && <button className="primary" onClick={next}>{round === scenarios.length - 1 ? 'Continue to circuit →' : 'Next challenge →'}</button>}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
