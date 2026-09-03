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

export function t(language: Language, text: string): string {
  return dictionaries[language][text] || text;
}
