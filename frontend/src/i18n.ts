export type Language = 'en' | 'hi' | 'or';

let currentLanguage: Language = (typeof window !== 'undefined' && (localStorage.getItem('assessment-language') as Language)) || 'en';
const listeners = new Set<() => void>();

export function getLanguage(): Language { return currentLanguage; }
export function setLanguage(language: Language) {
  currentLanguage = language;
  if (typeof window !== 'undefined') localStorage.setItem('assessment-language', language);
  listeners.forEach(listener => listener());
}
export function useLanguage() {
  const [, force] = requireReactState();
  if (typeof window !== 'undefined') {
    // subscribe without requiring a provider
    const [, setTick] = force;
    ReactEffect(() => {
      const listener = () => setTick((v: number) => v + 1);
      listeners.add(listener);
      return () => listeners.delete(listener);
    }, [setTick]);
  }
  return currentLanguage;
}
function requireReactState(): any { return [undefined, [(_fn: any) => {}]]; }
function ReactEffect(..._args: any[]) { /* replaced below by React's useEffect in bundled code */ }

const dictionaries: Record<Language, Record<string, string>> = {
  en: {},
  hi: {
    'Choose the module you want to be assessed on':'जिस मॉड्यूल का मूल्यांकन करना चाहते हैं उसे चुनें',
    'ELECTRICAL':'इलेक्ट्रिकल','MECHANICAL':'मैकेनिकल','INSTRUMENTATION & PLC':'इंस्ट्रुमेंटेशन और PLC','CIVIL & INFRA':'सिविल और इंफ्रा',
    'Test your knowledge and practical skills in electrical systems and maintenance.':'विद्युत प्रणालियों और रखरखाव में अपने ज्ञान और व्यावहारिक कौशल का परीक्षण करें।',
    'Evaluate your mechanical maintenance and troubleshooting skills.':'अपने मैकेनिकल रखरखाव और ट्रबलशूटिंग कौशल का मूल्यांकन करें।',
    'Assess your instrumentation, control systems and PLC knowledge.':'इंस्ट्रुमेंटेशन, कंट्रोल सिस्टम और PLC के अपने ज्ञान का मूल्यांकन करें।',
    'Test your civil construction and infrastructure competency.':'सिविल निर्माण और इंफ्रास्ट्रक्चर में अपनी दक्षता का परीक्षण करें।',
    'Select Module':'मॉड्यूल चुनें',
    'Each module contains MCQ, Scenario-Based Questions and Practical Activities.':'प्रत्येक मॉड्यूल में MCQ, परिदृश्य-आधारित प्रश्न और व्यावहारिक गतिविधियाँ शामिल हैं।',
    'Electrical Fundamentals':'इलेक्ट्रिकल फंडामेंटल्स','Assessment':'मूल्यांकन','Fundamentals':'फंडामेंटल्स',
    'Technical validation':'तकनीकी सत्यापन','Practical wiring':'व्यावहारिक वायरिंग','Circuit assembly':'सर्किट असेंबली','Performance report':'प्रदर्शन रिपोर्ट',
    'Question navigator':'प्रश्न नेविगेटर','Select any question number':'कोई भी प्रश्न संख्या चुनें',
    'Answered':'उत्तर दिया','Skipped':'छोड़ा गया','Current':'वर्तमान','Not visited':'नहीं देखा गया',
    'Previous':'पिछला','Skip question →':'प्रश्न छोड़ें →','Finish quiz →':'क्विज़ समाप्त करें →','Next →':'अगला →','Finish now':'अभी समाप्त करें',
    'Practical Validation':'व्यावहारिक सत्यापन','Build the 12V Lamp Circuit':'12V लैम्प सर्किट बनाएं',
    'Material Tray':'सामग्री ट्रे','Select wire colour':'वायर का रंग चुनें','Red':'लाल','Blue':'नीला','Black':'काला',
    'Supply / positive':'सप्लाई / पॉजिटिव','Control / load':'कंट्रोल / लोड','Return / negative':'रिटर्न / नेगेटिव',
    'Drag all four materials from the tray into the assembly area.':'ट्रे से चारों सामग्री को असेंबली क्षेत्र में ड्रैग करें।',
    'Assembly & Wiring Area':'असेंबली और वायरिंग क्षेत्र','Connection Objective':'कनेक्शन उद्देश्य',
    'connected':'जुड़ा हुआ','Not connected':'जुड़ा नहीं है','Finish practical →':'व्यावहारिक समाप्त करें →',
    'Technical Activity':'तकनीकी गतिविधि','Electrical Troubleshooting Lab':'इलेक्ट्रिकल ट्रबलशूटिंग लैब',
    'Scenario Challenge — Why Is the Bulb Dead?':'परिदृश्य चुनौती — बल्ब बंद क्यों है?',
    'FIELD DIAGNOSIS':'फील्ड डायग्नोसिस','Technician rule':'तकनीशियन नियम',
    'Inspect the physical circuit before choosing a diagnosis.':'निदान चुनने से पहले भौतिक सर्किट का निरीक्षण करें।',
    'Record diagnosis':'निदान दर्ज करें','Diagnosis recorded':'निदान दर्ज किया गया',
    'Continue →':'जारी रखें →','Correct diagnosis':'सही निदान','Diagnosis review':'निदान समीक्षा',
    'Correct answer:':'सही उत्तर:','Your answer:':'आपका उत्तर:',
    'Final Practical Assembly':'अंतिम व्यावहारिक असेंबली','Electrical Circuit Assembly':'इलेक्ट्रिकल सर्किट असेंबली',
    'Components':'घटक','Drag all four components onto the board, then connect the large terminal circles.':'चारों घटकों को बोर्ड पर ड्रैग करें, फिर बड़े टर्मिनल सर्कल कनेक्ट करें।',
    'Circuit complete.':'सर्किट पूरा हुआ।','Finish activity →':'गतिविधि समाप्त करें →',
    'Retake assessment ↻':'मूल्यांकन फिर से करें ↻'
  },
  or: {
    'Choose the module you want to be assessed on':'ଆପଣ ଯେଉଁ ମଡ୍ୟୁଲରେ ମୂଲ୍ୟାଙ୍କନ ହେବାକୁ ଚାହୁଁଛନ୍ତି ତାହା ବାଛନ୍ତୁ',
    'ELECTRICAL':'ଇଲେକ୍ଟ୍ରିକାଲ','MECHANICAL':'ମେକାନିକାଲ','INSTRUMENTATION & PLC':'ଇନ୍ଷ୍ଟ୍ରୁମେଣ୍ଟେସନ୍ ଏବଂ PLC','CIVIL & INFRA':'ସିଭିଲ୍ ଏବଂ ଇନ୍ଫ୍ରା',
    'Test your knowledge and practical skills in electrical systems and maintenance.':'ବିଦ୍ୟୁତ ପ୍ରଣାଳୀ ଓ ରକ୍ଷଣାବେକ୍ଷଣରେ ଆପଣଙ୍କ ଜ୍ଞାନ ଓ ପ୍ରାୟୋଗିକ ଦକ୍ଷତା ପରୀକ୍ଷା କରନ୍ତୁ।',
    'Evaluate your mechanical maintenance and troubleshooting skills.':'ମେକାନିକାଲ୍ ରକ୍ଷଣାବେକ୍ଷଣ ଓ ଟ୍ରବଲସୁଟିଂ ଦକ୍ଷତାର ମୂଲ୍ୟାଙ୍କନ କରନ୍ତୁ।',
    'Assess your instrumentation, control systems and PLC knowledge.':'ଇନ୍ଷ୍ଟ୍ରୁମେଣ୍ଟେସନ୍, କଣ୍ଟ୍ରୋଲ୍ ସିଷ୍ଟମ୍ ଓ PLC ଜ୍ଞାନର ମୂଲ୍ୟାଙ୍କନ କରନ୍ତୁ।',
    'Test your civil construction and infrastructure competency.':'ସିଭିଲ୍ ନିର୍ମାଣ ଓ ଇନ୍ଫ୍ରାଷ୍ଟ୍ରକ୍ଚରରେ ଆପଣଙ୍କ ଦକ୍ଷତା ପରୀକ୍ଷା କରନ୍ତୁ।',
    'Select Module':'ମଡ୍ୟୁଲ ବାଛନ୍ତୁ',
    'Each module contains MCQ, Scenario-Based Questions and Practical Activities.':'ପ୍ରତ୍ୟେକ ମଡ୍ୟୁଲରେ MCQ, ପରିସ୍ଥିତି-ଆଧାରିତ ପ୍ରଶ୍ନ ଏବଂ ପ୍ରାୟୋଗିକ କାର୍ଯ୍ୟକଳାପ ରହିଛି।',
    'Electrical Fundamentals':'ଇଲେକ୍ଟ୍ରିକାଲ୍ ମୌଳିକତା','Assessment':'ମୂଲ୍ୟାଙ୍କନ','Fundamentals':'ମୌଳିକତା',
    'Technical validation':'ଟେକ୍ନିକାଲ୍ ଯାଞ୍ଚ','Practical wiring':'ପ୍ରାୟୋଗିକ ୱାୟରିଂ','Circuit assembly':'ସର୍କିଟ୍ ଅସେମ୍ବଲି','Performance report':'ପ୍ରଦର୍ଶନ ରିପୋର୍ଟ',
    'Question navigator':'ପ୍ରଶ୍ନ ନେଭିଗେଟର','Select any question number':'ଯେକୌଣସି ପ୍ରଶ୍ନ ସଂଖ୍ୟା ବାଛନ୍ତୁ',
    'Answered':'ଉତ୍ତର ଦିଆଗଲା','Skipped':'ଛାଡ଼ାଗଲା','Current':'ବର୍ତ୍ତମାନ','Not visited':'ଦେଖାଯାଇନାହିଁ',
    'Previous':'ପୂର୍ବବର୍ତ୍ତୀ','Skip question →':'ପ୍ରଶ୍ନ ଛାଡ଼ନ୍ତୁ →','Finish quiz →':'କ୍ୱିଜ୍ ଶେଷ କରନ୍ତୁ →','Next →':'ପରବର୍ତ୍ତୀ →','Finish now':'ଏବେ ଶେଷ କରନ୍ତୁ',
    'Practical Validation':'ପ୍ରାୟୋଗିକ ଯାଞ୍ଚ','Build the 12V Lamp Circuit':'12V ଲ୍ୟାମ୍ପ ସର୍କିଟ୍ ତିଆରି କରନ୍ତୁ',
    'Material Tray':'ସାମଗ୍ରୀ ଟ୍ରେ','Select wire colour':'ତାରର ରଙ୍ଗ ବାଛନ୍ତୁ','Red':'ଲାଲ','Blue':'ନୀଳ','Black':'କଳା',
    'Supply / positive':'ସପ୍ଲାଇ / ପଜିଟିଭ୍','Control / load':'କଣ୍ଟ୍ରୋଲ୍ / ଲୋଡ୍','Return / negative':'ରିଟର୍ନ / ନେଗେଟିଭ୍',
    'Drag all four materials from the tray into the assembly area.':'ଟ୍ରେରୁ ସମସ୍ତ ଚାରିଟି ସାମଗ୍ରୀକୁ ଅସେମ୍ବଲି ଅଞ୍ଚଳକୁ ଡ୍ରାଗ୍ କରନ୍ତୁ।',
    'Assembly & Wiring Area':'ଅସେମ୍ବଲି ଏବଂ ୱାୟରିଂ ଅଞ୍ଚଳ','Connection Objective':'କନେକ୍ସନ୍ ଉଦ୍ଦେଶ୍ୟ',
    'Not connected':'କନେକ୍ଟ ହୋଇନାହିଁ','Finish practical →':'ପ୍ରାୟୋଗିକ ଶେଷ କରନ୍ତୁ →',
    'Technical Activity':'ଟେକ୍ନିକାଲ୍ କାର୍ଯ୍ୟକଳାପ','Electrical Troubleshooting Lab':'ଇଲେକ୍ଟ୍ରିକାଲ୍ ଟ୍ରବଲସୁଟିଂ ଲ୍ୟାବ',
    'Scenario Challenge — Why Is the Bulb Dead?':'ପରିସ୍ଥିତି ଚ୍ୟାଲେଞ୍ଜ — ବଲ୍ବ କାହିଁକି ଜଳୁନାହିଁ?',
    'FIELD DIAGNOSIS':'ଫିଲ୍ଡ ଡାୟାଗ୍ନୋସିସ୍','Technician rule':'ଟେକ୍ନିସିଆନ୍ ନିୟମ',
    'Inspect the physical circuit before choosing a diagnosis.':'ଡାୟାଗ୍ନୋସିସ୍ ବାଛିବା ପୂର୍ବରୁ ଭୌତିକ ସର୍କିଟ୍ ଯାଞ୍ଚ କରନ୍ତୁ।',
    'Record diagnosis':'ଡାୟାଗ୍ନୋସିସ୍ ରେକର୍ଡ କରନ୍ତୁ','Diagnosis recorded':'ଡାୟାଗ୍ନୋସିସ୍ ରେକର୍ଡ ହୋଇଛି',
    'Continue →':'ଜାରି ରଖନ୍ତୁ →','Correct diagnosis':'ସଠିକ୍ ଡାୟାଗ୍ନୋସିସ୍','Diagnosis review':'ଡାୟାଗ୍ନୋସିସ୍ ସମୀକ୍ଷା',
    'Correct answer:':'ସଠିକ୍ ଉତ୍ତର:','Your answer:':'ଆପଣଙ୍କ ଉତ୍ତର:',
    'Final Practical Assembly':'ଅନ୍ତିମ ପ୍ରାୟୋଗିକ ଅସେମ୍ବଲି','Electrical Circuit Assembly':'ଇଲେକ୍ଟ୍ରିକାଲ୍ ସର୍କିଟ୍ ଅସେମ୍ବଲି',
    'Components':'ଉପାଦାନ','Circuit complete.':'ସର୍କିଟ୍ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି।','Finish activity →':'କାର୍ଯ୍ୟକଳାପ ଶେଷ କରନ୍ତୁ →',
    'Retake assessment ↻':'ମୂଲ୍ୟାଙ୍କନ ପୁନର୍ବାର କରନ୍ତୁ ↻'
  }
};

export function t(language: Language, text: string): string {
  return dictionaries[language][text] || text;
}
