import { useEffect, useState } from 'react';

type Question = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  points: number;
};

const questions: Question[] = [
  { id: 'EL-MCQ-001', question: 'What is the SI unit of electrical current?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], answer: 'Ampere', explanation: 'Ampere (A) is the SI unit of electric current.', points: 1 },
  { id: 'EL-MCQ-002', question: 'Which instrument is used to measure electrical current?', options: ['Voltmeter', 'Ammeter', 'Ohmmeter', 'Wattmeter'], answer: 'Ammeter', explanation: 'An ammeter is used to measure electrical current.', points: 1 },
  { id: 'EL-MCQ-003', question: 'According to Ohm’s law, which equation is correct?', options: ['V = I × R', 'P = V × I', 'R = V × I', 'I = V × R'], answer: 'V = I × R', explanation: 'Ohm’s law states that voltage equals current multiplied by resistance.', points: 1 },
  { id: 'EL-MCQ-004', question: 'What is the SI unit of electrical resistance?', options: ['Ampere', 'Volt', 'Ohm', 'Watt'], answer: 'Ohm', explanation: 'Ohm (Ω) is the SI unit of electrical resistance.', points: 1 },
  { id: 'EL-MCQ-005', question: 'What is the primary purpose of a fuse?', options: ['Increase voltage', 'Protect against excessive current', 'Store electrical energy', 'Measure current'], answer: 'Protect against excessive current', explanation: 'A fuse protects a circuit by opening the circuit when excessive current flows.', points: 1 },
  { id: 'EL-MCQ-006', question: 'What happens to total resistance when resistors are connected in series?', options: ['It is the sum of the resistances', 'It becomes zero', 'It equals the smallest resistor', 'It equals the largest resistor'], answer: 'It is the sum of the resistances', explanation: 'For series resistors, total resistance is R₁ + R₂ + R₃ and so on.', points: 1 },
  { id: 'EL-MCQ-007', question: 'Which type of current periodically changes direction?', options: ['Direct current', 'Alternating current', 'Static current', 'Leakage current'], answer: 'Alternating current', explanation: 'Alternating current (AC) periodically reverses direction.', points: 1 },
  { id: 'EL-MCQ-008', question: 'What is the SI unit of electrical power?', options: ['Watt', 'Ohm', 'Coulomb', 'Ampere'], answer: 'Watt', explanation: 'Watt (W) is the SI unit of power.', points: 1 },
  { id: 'EL-MCQ-009', question: 'In an ideal parallel circuit, what is common across each branch?', options: ['Voltage', 'Resistance', 'Power', 'Energy'], answer: 'Voltage', explanation: 'Parallel branches are connected across the same two nodes, so their voltage is the same.', points: 1 },
  { id: 'EL-MCQ-010', question: 'Which device is commonly used to open or close an electrical circuit?', options: ['Transformer', 'Switch', 'Resistor', 'Capacitor'], answer: 'Switch', explanation: 'A switch is designed to open or close an electrical circuit.', points: 1 },
];

export default function App() {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(10 * 60);

  useEffect(() => {
    if (!started || finished) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setFinished(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, finished]);

  const question = questions[index];
  const score = questions.reduce((total, item) => total + (answers[item.id] === item.answer ? item.points : 0), 0);
  const maxScore = questions.reduce((total, item) => total + item.points, 0);
  const percentage = Math.round((score / maxScore) * 100);

  const selectAnswer = (answer: string) => {
    setAnswers((current) => ({ ...current, [question.id]: answer }));
  };

  const reset = () => {
    setStarted(false);
    setFinished(false);
    setIndex(0);
    setAnswers({});
    setRemaining(10 * 60);
  };

  if (!started) return <Start onStart={() => setStarted(true)} />;
  if (finished) return <Result score={score} maxScore={maxScore} percentage={percentage} answers={answers} reset={reset} />;

  const answered = Boolean(answers[question.id]);
  const progress = ((index + 1) / questions.length) * 100;
  const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
  const seconds = (remaining % 60).toString().padStart(2, '0');

  return (
    <div className="app">
      <header className="top">
        <div>
          <div className="eyebrow">ELECTRICAL • NEW ENTRY WORKER</div>
          <h2>Electrical Competency Quiz</h2>
        </div>
        <div className="timer">
          <small>TIME REMAINING</small>
          <b>{minutes}:{seconds}</b>
        </div>
      </header>

      <div className="progress"><span style={{ width: `${progress}%` }} /></div>

      <main className="layout">
        <section className="question">
          <div className="qmeta">
            <span>Question {index + 1} / {questions.length}</span>
            <span>MCQ</span>
            <strong>{question.points} point</strong>
          </div>

          <h1>{question.question}</h1>

          <div className="options">
            {question.options.map((option, optionIndex) => (
              <button
                key={option}
                className={answers[question.id] === option ? 'selected' : ''}
                onClick={() => selectAnswer(option)}
              >
                <i>{String.fromCharCode(65 + optionIndex)}</i>
                {option}
              </button>
            ))}
          </div>

          <div className="nav">
            <button disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>← Previous</button>
            <button
              className="primary"
              disabled={!answered}
              onClick={() => index === questions.length - 1 ? setFinished(true) : setIndex((value) => value + 1)}
            >
              {index === questions.length - 1 ? 'Submit quiz' : 'Next question →'}
            </button>
          </div>
        </section>

        <aside>
          <div className="sidecard">
            <b>Quiz Questions</b>
            {questions.map((item, itemIndex) => (
              <button key={item.id} className={itemIndex === index ? 'active' : ''} onClick={() => setIndex(itemIndex)}>
                <span>{itemIndex + 1}</span>
                Electrical MCQ
                <em>{answers[item.id] ? '✓' : ''}</em>
              </button>
            ))}
          </div>
          <div className="sidecard tip">
            <b>Assessment rules</b>
            <p>Select one answer for each question. Your score and performance summary are calculated automatically when you submit.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Start({ onStart }: { onStart: () => void }) {
  return (
    <div className="start">
      <div className="startcard">
        <div className="eyebrow">ELECTRICAL COMPETENCY ASSESSMENT</div>
        <h1>Electrical Fundamentals<br /><span>MCQ Quiz</span></h1>
        <p>Test your basic electrical knowledge with a focused multiple-choice assessment for new entry workers.</p>
        <div className="stats">
          <div><b>10</b><small>questions</small></div>
          <div><b>10</b><small>points</small></div>
          <div><b>10:00</b><small>time limit</small></div>
        </div>
        <button className="primary big" onClick={onStart}>Start quiz →</button>
        <small className="offline">● Runs locally in the browser • no API required</small>
      </div>
    </div>
  );
}

function Result({ score, maxScore, percentage, answers, reset }: { score: number; maxScore: number; percentage: number; answers: Record<string, string>; reset: () => void }) {
  const level = percentage >= 85 ? 'Advanced' : percentage >= 70 ? 'Proficient' : percentage >= 50 ? 'Developing' : 'Needs Training';
  const attempted = Object.keys(answers).length;

  return (
    <div className="resultpage">
      <div className="resultcard">
        <div className="eyebrow">QUIZ COMPLETE</div>
        <h1>Your Electrical<br /><span>Quiz Result</span></h1>
        <div className="score"><b>{percentage}%</b><small>{score} / {maxScore} points</small></div>
        <div className="resultgrid">
          <div><b>Correct answers</b><strong>{score} / {maxScore}</strong></div>
          <div><b>Attempted</b><strong>{attempted} / 10</strong></div>
          <div><b>Competency level</b><strong>{level}</strong></div>
        </div>
        <div className="summary">
          <h3>Performance summary</h3>
          <p>{percentage >= 85 ? 'Excellent foundation in electrical fundamentals. The candidate is ready for more advanced technical assessment.' : percentage >= 70 ? 'Good electrical foundation. Continue with practical and equipment-specific assessment.' : percentage >= 50 ? 'Developing foundation. Additional electrical fundamentals training is recommended.' : 'The candidate needs additional electrical fundamentals training before progressing to advanced assessment.'}</p>
          <div className="chips"><span>Electrical fundamentals</span><span>MCQ knowledge</span><span>Automatic scoring</span></div>
        </div>
        <button className="primary big" onClick={reset}>Retake quiz</button>
      </div>
    </div>
  );
}
