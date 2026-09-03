import { useSyncExternalStore } from 'react';

export type Language = 'en' | 'hi' | 'or';

let currentLanguage: Language = (typeof window !== 'undefined' && (localStorage.getItem('assessment-language') as Language)) || 'en';
const listeners = new Set<() => void>();

export function getLanguage(): Language { return currentLanguage; }
export function setLanguage(language: Language) {
  currentLanguage = language;
  if (typeof window !== 'undefined') localStorage.setItem('assessment-language', language);
  listeners.forEach(listener => listener());
}
export function useLanguage(): Language {
  useSyncExternalStore((onChange) => { listeners.add(onChange); return () => listeners.delete(onChange); }, () => currentLanguage, () => currentLanguage);
  return currentLanguage;
};

Object.assign(dictionaries.hi, {
'The technician reports that the bulb is not illuminating even though the circuit contains the battery, switch, wiring and bulb. Inspect the supplied 3D circuit carefully before diagnosing the fault.':'तकनीशियन के अनुसार बल्ब नहीं जल रहा है, जबकि सर्किट में बैटरी, स्विच, वायरिंग और बल्ब मौजूद हैं। खराबी का निदान करने से पहले दिए गए 3D सर्किट का ध्यानपूर्वक निरीक्षण करें।',
'What most likely happened to the circuit and is causing the bulb to remain off?':'सर्किट में सबसे संभावित रूप से क्या हुआ है जिसके कारण बल्ब बंद है?',
'The wire is disconnected near the switch, creating an open circuit.':'स्विच के पास तार डिस्कनेक्ट है, जिससे ओपन सर्किट बन गया है।',
'The battery polarity is reversed, so the bulb cannot receive power.':'बैटरी की ध्रुवीयता उलटी है, इसलिए बल्ब को बिजली नहीं मिल सकती।',
'The bulb is short-circuited by another wire, bypassing the lamp.':'एक अन्य तार ने बल्ब को बायपास करते हुए शॉर्ट सर्किट बना दिया है।',
'The bulb has too much resistance for the battery to supply current.':'बल्ब का प्रतिरोध इतना अधिक है कि बैटरी पर्याप्त धारा नहीं दे सकती।',
'Electrical Competency Assessment':'इलेक्ट्रिकल दक्षता मूल्यांकन','Technical Activity':'तकनीकी गतिविधि','Electrical Troubleshooting Lab':'इलेक्ट्रिकल ट्रबलशूटिंग लैब',
'3D Interactive Workbench':'3D इंटरैक्टिव वर्कबेंच','Drag = rotate entire circuit • wheel = zoom • right-drag = pan • individual components are fixed':'ड्रैग = पूरा सर्किट घुमाएँ • व्हील = ज़ूम • राइट-ड्रैग = पैन • सभी घटक स्थिर हैं',
'REPOSITORY 3D ELEMENTS':'रिपॉजिटरी 3D एलिमेंट्स','Drag = rotate view':'ड्रैग = दृश्य घुमाएँ','Wheel = zoom':'व्हील = ज़ूम','Right-drag = pan':'राइट-ड्रैग = पैन','Circuit is fixed — rotate only':'सर्किट स्थिर है — केवल घुमाएँ',
'Choose one of the four scenario diagnoses first.':'पहले चार परिदृश्य निदानों में से एक चुनें।','Diagnosis recorded. The answer will be revealed in the final result.':'निदान दर्ज किया गया। उत्तर अंतिम परिणाम में दिखाया जाएगा।','Your answer has been saved. The correct diagnosis and explanation will be revealed in the final result.':'आपका उत्तर सहेज लिया गया है। सही निदान और व्याख्या अंतिम परिणाम में दिखाई जाएगी।',
'Choose the diagnosis that best matches the 3D evidence.':'वह निदान चुनें जो 3D साक्ष्य से सबसे अधिक मेल खाता हो।'
});
Object.assign(dictionaries.or, {
'The technician reports that the bulb is not illuminating even though the circuit contains the battery, switch, wiring and bulb. Inspect the supplied 3D circuit carefully before diagnosing the fault.':'ଟେକ୍ନିସିଆନ୍ କହୁଛନ୍ତି ଯେ ବ୍ୟାଟେରୀ, ସ୍ୱିଚ୍, ୱାୟରିଂ ଓ ବଲ୍ବ ଥିଲେ ମଧ୍ୟ ବଲ୍ବ ଜଳୁନାହିଁ। ତ୍ରୁଟି ନିର୍ଣ୍ଣୟ ପୂର୍ବରୁ ଦିଆଯାଇଥିବା 3D ସର୍କିଟ୍‌କୁ ଭଲଭାବେ ଯାଞ୍ଚ କରନ୍ତୁ।',
'What most likely happened to the circuit and is causing the bulb to remain off?':'ସର୍କିଟ୍‌ରେ ସମ୍ଭାବ୍ୟ କଣ ଘଟିଛି ଯାହା ଫଳରେ ବଲ୍ବ ବନ୍ଦ ରହିଛି?',
'The wire is disconnected near the switch, creating an open circuit.':'ସ୍ୱିଚ୍ ନିକଟରେ ତାର ବିଚ୍ଛିନ୍ନ ହୋଇ ଓପନ୍ ସର୍କିଟ୍ ସୃଷ୍ଟି ହୋଇଛି।',
'The battery polarity is reversed, so the bulb cannot receive power.':'ବ୍ୟାଟେରୀର ପୋଲାରିଟି ଓଲଟା ଅଛି, ତେଣୁ ବଲ୍ବକୁ ବିଦ୍ୟୁତ୍ ମିଳିପାରୁନାହିଁ।',
'The bulb is short-circuited by another wire, bypassing the lamp.':'ଅନ୍ୟ ଏକ ତାର ବଲ୍ବକୁ ବାଇପାସ୍ କରି ଶର୍ଟ ସର୍କିଟ୍ କରିଛି।',
'The bulb has too much resistance for the battery to supply current.':'ବଲ୍ବର ପ୍ରତିରୋଧ ଅତ୍ୟଧିକ ଥିବାରୁ ବ୍ୟାଟେରୀ ଆବଶ୍ୟକ ଧାରା ଯୋଗାଇପାରୁନାହିଁ।',
'Electrical Competency Assessment':'ଇଲେକ୍ଟ୍ରିକାଲ୍ ଦକ୍ଷତା ମୂଲ୍ୟାଙ୍କନ','Technical Activity':'ଟେକ୍ନିକାଲ୍ କାର୍ଯ୍ୟକଳାପ','Electrical Troubleshooting Lab':'ଇଲେକ୍ଟ୍ରିକାଲ୍ ଟ୍ରବଲସୁଟିଂ ଲ୍ୟାବ',
'3D Interactive Workbench':'3D ଇଣ୍ଟରାକ୍ଟିଭ୍ ୱର୍କବେଞ୍ଚ','Drag = rotate entire circuit • wheel = zoom • right-drag = pan • individual components are fixed':'ଡ୍ରାଗ୍ = ସମ୍ପୂର୍ଣ୍ଣ ସର୍କିଟ୍ ଘୁରାନ୍ତୁ • ହ୍ୱିଲ୍ = ଜୁମ୍ • ରାଇଟ୍-ଡ୍ରାଗ୍ = ପ୍ୟାନ୍ • ସମସ୍ତ ଉପାଦାନ ସ୍ଥିର',
'REPOSITORY 3D ELEMENTS':'ରିପୋଜିଟୋରୀ 3D ଏଲିମେଣ୍ଟସ୍','Drag = rotate view':'ଡ୍ରାଗ୍ = ଦୃଶ୍ୟ ଘୁରାନ୍ତୁ','Wheel = zoom':'ହ୍ୱିଲ୍ = ଜୁମ୍','Right-drag = pan':'ରାଇଟ୍-ଡ୍ରାଗ୍ = ପ୍ୟାନ୍','Circuit is fixed — rotate only':'ସର୍କିଟ୍ ସ୍ଥିର — କେବଳ ଘୁରାନ୍ତୁ',
'Choose one of the four scenario diagnoses first.':'ପ୍ରଥମେ ଚାରିଟି ପରିସ୍ଥିତି ଡାୟାଗ୍ନୋସିସ୍ ମଧ୍ୟରୁ ଗୋଟିଏ ବାଛନ୍ତୁ।','Diagnosis recorded. The answer will be revealed in the final result.':'ଡାୟାଗ୍ନୋସିସ୍ ରେକର୍ଡ ହୋଇଛି। ଉତ୍ତର ଅନ୍ତିମ ଫଳାଫଳରେ ଦେଖାଯିବ।','Your answer has been saved. The correct diagnosis and explanation will be revealed in the final result.':'ଆପଣଙ୍କ ଉତ୍ତର ସେଭ୍ ହୋଇଛି। ସଠିକ୍ ଡାୟାଗ୍ନୋସିସ୍ ଓ ବ୍ୟାଖ୍ୟା ଅନ୍ତିମ ଫଳାଫଳରେ ଦେଖାଯିବ।','Choose the diagnosis that best matches the 3D evidence.':'3D ପ୍ରମାଣ ସହ ସବୁଠାରୁ ଭଲ ମେଳ ଖାଉଥିବା ଡାୟାଗ୍ନୋସିସ୍ ବାଛନ୍ତୁ।'
});

export function t(language: Language, text: string): string {
  return dictionaries[language][text] || text;
}
