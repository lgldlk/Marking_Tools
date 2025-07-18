import { useState } from 'react';
import { translateText } from '../services/translationService';

export const useTranslation = () => {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('zh-CN');
  const [translationService, setTranslationService] = useState('google');
  const [error, setError] = useState(null);

  const validateLanguages = (source, target) => {
    if (source !== 'auto' && source === target) {
      setError('源语言和目标语言不能相同');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSourceLanguageChange = (newLang) => {
    if (!validateLanguages(newLang, targetLang)) {
      return false;
    }
    setSourceLang(newLang);
    return true;
  };

  const handleTargetLanguageChange = (newLang) => {
    if (!validateLanguages(sourceLang, newLang)) {
      return false;
    }
    setTargetLang(newLang);
    return true;
  };

  const handleServiceChange = (newService) => {
    if (newService === translationService) return false;
    setTranslationService(newService);
    return true;
  };

  const translateContent = async (text) => {
    if (!validateLanguages(sourceLang, targetLang)) {
      throw new Error('源语言和目标语言不能相同');
    }

    try {
      return await translateText(text, sourceLang, targetLang, translationService);
    } catch (err) {
      setError('翻译时出错: ' + err.message);
      throw err;
    }
  };

  return {
    sourceLang,
    targetLang,
    translationService,
    error,
    setError,
    handleSourceLanguageChange,
    handleTargetLanguageChange,
    handleServiceChange,
    translateContent,
  };
};
