import { useContext } from 'react';
import { LanguageContext } from './LanguageContextDefinition';
import type { LanguageContextType } from './LanguageContextDefinition';

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
