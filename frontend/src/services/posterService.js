import axios from 'axios';
import { API_BASE_URL } from '../config';

export const generatePosterImage = async (imageFile, styleId) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('styleId', styleId);

    const response = await axios.post(`${API_BASE_URL}/generate-poster`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Poster generation error:', error);
    throw error;
  }
};

// This function would be used to fetch available poster templates from the backend
export const fetchPosterTemplates = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/poster-templates`);
    return response.data;
  } catch (error) {
    console.error('Fetch templates error:', error);
    throw error;
  }
};
