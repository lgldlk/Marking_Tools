import { useState } from 'react';
import { getStyleById } from '../data/posterStyles';
import { generatePosterImage } from '../services/posterService';

export const usePosterCreation = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedPoster, setGeneratedPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      setError('请上传图片文件');
      return;
    }

    const file = acceptedFiles[0];
    if (!file.type.startsWith('image/')) {
      setError('请上传有效的图片文件');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Create a URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      setImageFile(file);

      // Reset other states when a new image is uploaded
      setSelectedStyle(null);
      setGeneratedPoster(null);
    } catch (err) {
      setError('处理图片时出错: ' + err.message);
      console.error('Image processing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStyleSelect = (styleId) => {
    setSelectedStyle(styleId);
    // Reset the generated poster when style changes
    setGeneratedPoster(null);
  };

  const generatePoster = async () => {
    if (!uploadedImage || !selectedStyle) {
      setError('请上传图片并选择海报样式');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, we would send the image to the backend
      // and get back a generated poster. For now, we'll just simulate this
      // by using the original image with a delay.

      // Simulate API call with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For demonstration purposes, we're just using the original image
      // In a real app, you would call your backend API to generate the poster
      /*
      const result = await generatePosterImage(imageFile, selectedStyle);
      setGeneratedPoster(result.posterUrl);
      */

      // For demo, just use the original image
      setGeneratedPoster(uploadedImage);
    } catch (err) {
      setError('生成海报时出错: ' + err.message);
      console.error('Poster generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPoster = () => {
    if (!generatedPoster) {
      setError('没有可下载的海报');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = generatedPoster;
      link.download = `poster-${selectedStyle}-${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('下载海报时出错: ' + err.message);
      console.error('Poster download error:', err);
    }
  };

  return {
    uploadedImage,
    selectedStyle,
    generatedPoster,
    loading,
    error,
    handleImageUpload,
    handleStyleSelect,
    generatePoster,
    downloadPoster,
  };
};
