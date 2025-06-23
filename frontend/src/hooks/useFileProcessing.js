import { useState } from 'react';
import { readTextFile, createAndDownloadZip } from '../services/fileService';

export const useFileProcessing = (translateContent) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processFiles = async (acceptedFiles) => {
    setLoading(true);
    setError(null);

    try {
      const processedFiles = [];
      const imageFiles = acceptedFiles.filter(
        (file) => file.type.startsWith('image/') || (file.name.endsWith('.zip') && file.type === 'application/zip')
      );

      if (imageFiles.length === 0) {
        setError('请上传图片文件或ZIP压缩包');
        return;
      }

      if (imageFiles[0].type === 'application/zip') {
        setError('前端处理模式下暂不支持ZIP文件，请直接上传图片和对应的TXT文件');
        return;
      }

      for (const imageFile of imageFiles) {
        const imageUrl = URL.createObjectURL(imageFile);
        const baseName = imageFile.name.substring(0, imageFile.name.lastIndexOf('.'));

        const txtFile = acceptedFiles.find((file) => file.name === `${baseName}.txt` || file.name === `${baseName}.TXT`);

        let textContent = '';
        if (txtFile) {
          textContent = await readTextFile(txtFile);
        }

        let translatedContent = '';
        try {
          translatedContent = await translateContent(textContent);
        } catch (err) {
          console.error('Translation error:', err);
          translatedContent = `Translation failed: ${err.message}`;
        }

        processedFiles.push({
          originalName: imageFile.name,
          imageUrl: imageUrl,
          textContent: textContent,
          translatedContent: translatedContent,
          imageFile: imageFile,
          txtFile: txtFile || null,
        });
      }

      setFiles(processedFiles);
    } catch (err) {
      setError('处理文件时出错: ' + err.message);
      console.error('File processing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextUpdate = async (imageName, newContent) => {
    try {
      const translatedContent = await translateContent(newContent);

      setFiles((prevFiles) =>
        prevFiles.map((file) => (file.originalName === imageName ? { ...file, textContent: newContent, translatedContent } : file))
      );
    } catch (err) {
      setError('更新文本时出错: ' + err.message);
      console.error('Update error:', err);
      throw err;
    }
  };

  const handleBatchUpdate = async (action, content, position, findText, replaceText) => {
    setLoading(true);
    try {
      const updatedFiles = [...files];

      for (let i = 0; i < updatedFiles.length; i++) {
        const file = updatedFiles[i];
        let newContent = file.textContent;

        if (action === 'add') {
          if (position === 'start') {
            newContent = content + newContent;
          } else {
            newContent = newContent + content;
          }
        } else if (action === 'replace') {
          newContent = newContent.replace(new RegExp(findText, 'g'), replaceText);
        }

        if (newContent !== file.textContent) {
          const translatedContent = await translateContent(newContent);
          updatedFiles[i] = {
            ...file,
            textContent: newContent,
            translatedContent: translatedContent,
          };
        }
      }

      setFiles(updatedFiles);
    } catch (err) {
      setError('批量更新时出错: ' + err.message);
      console.error('Batch update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (files.length === 0) {
      setError('没有可下载的文件');
      return;
    }

    try {
      await createAndDownloadZip(files);
    } catch (err) {
      setError('下载文件时出错: ' + err.message);
    }
  };

  return {
    files,
    loading,
    error,
    setError,
    processFiles,
    handleTextUpdate,
    handleBatchUpdate,
    handleDownload,
  };
};
