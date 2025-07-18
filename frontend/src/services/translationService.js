import axios from 'axios';
import { API_BASE_URL } from '../config';

export const translateText = async (text, sourceLang, targetLang, service) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/translate`, {
      text,
      source_lang: sourceLang,
      target_lang: targetLang,
      service,
    });
    return response.data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};
