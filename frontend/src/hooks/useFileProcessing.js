import { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const useFileProcessing = (translateContent) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 检查文件是否为图片
  const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerFilename = filename.toLowerCase();
    return imageExtensions.some((ext) => lowerFilename.endsWith(ext));
  };

  // 获取不带扩展名的文件名
  const getBaseFileName = (filename) => {
    return filename.substring(0, filename.lastIndexOf('.')) || filename;
  };

  // 获取文件扩展名
  const getFileExtension = (filename) => {
    return filename.substring(filename.lastIndexOf('.')) || '';
  };

  const processFiles = async (uploadedFiles) => {
    setLoading(true);
    setError(null);

    try {
      // 首先处理所有文件
      const processedFiles = await Promise.all(
        uploadedFiles.map(async (file) => {
          let text = '';
          let imageUrl = null;

          // 如果是图片文件，创建一个URL
          if (isImageFile(file.name)) {
            imageUrl = URL.createObjectURL(file);
          }

          try {
            // 尝试读取文本内容，图片文件可能会失败
            text = await file.text();
          } catch (err) {
            console.error(`Error reading file ${file.name}:`, err);
            // 如果是图片文件，文本读取失败是正常的
            if (isImageFile(file.name)) {
              text = ''; // 图片文件不需要文本内容
            }
          }

          return {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            baseName: getBaseFileName(file.name),
            extension: getFileExtension(file.name),
            originalText: text,
            translatedText: '',
            translating: false,
            translated: false,
            error: null,
            imageUrl: imageUrl,
            isImage: isImageFile(file.name),
            originalFile: isImageFile(file.name) ? file : null, // 保存原始文件对象
          };
        })
      );

      // 然后将文件进行配对处理
      const fileMap = {};
      const newFiles = [];

      // 首先按基本文件名分组
      processedFiles.forEach((file) => {
        const baseName = file.baseName;
        if (!fileMap[baseName]) {
          fileMap[baseName] = [];
        }
        fileMap[baseName].push(file);
      });

      // 然后处理每个组
      Object.keys(fileMap).forEach((baseName) => {
        const group = fileMap[baseName];

        // 找出图片和文本文件
        const imageFile = group.find((f) => f.isImage);
        const textFile = group.find((f) => !f.isImage);

        if (imageFile && textFile) {
          // 如果有配对，创建一个合并的文件
          newFiles.push({
            ...textFile,
            imageUrl: imageFile.imageUrl,
            originalImageName: imageFile.name,
            originalImageFile: imageFile.originalFile, // 保存原始图片文件
          });
        } else {
          // 否则添加单独的文件
          group.forEach((file) => newFiles.push(file));
        }
      });

      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    } catch (err) {
      setError('处理文件时出错');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 添加文本文件方法 - 使用useCallback包装以避免无限循环
  const addTextFile = useCallback((fileName, content) => {
    const newFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: fileName,
      baseName: getBaseFileName(fileName),
      extension: getFileExtension(fileName),
      originalText: content,
      translatedText: '',
      translating: false,
      translated: false,
      error: null,
      imageUrl: null,
      isImage: false,
      originalFile: null,
    };

    setFiles((prevFiles) => {
      // 检查是否已经有同名文件
      const existingIndex = prevFiles.findIndex((file) => file.name === fileName);
      if (existingIndex >= 0) {
        // 替换已有文件
        const updatedFiles = [...prevFiles];
        updatedFiles[existingIndex] = newFile;
        return updatedFiles;
      } else {
        // 添加新文件
        return [...prevFiles, newFile];
      }
    });
  }, []);

  const handleTextUpdate = async (id, text, isTranslated = false) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) => {
        if (file.id === id) {
          if (isTranslated) {
            return { ...file, translatedText: text, translated: true };
          } else {
            return { ...file, originalText: text };
          }
        }
        return file;
      })
    );
  };

  const translateFile = async (file) => {
    if (file.translating || file.translated) return file;

    try {
      const updatedFile = { ...file, translating: true, error: null };

      // Check if translateContent is available
      if (typeof translateContent !== 'function') {
        throw new Error('翻译服务不可用');
      }

      const translatedText = await translateContent(file.originalText);
      return { ...updatedFile, translatedText, translating: false, translated: true };
    } catch (err) {
      console.error(`Error translating file ${file.name}:`, err);
      return { ...file, translating: false, error: err.message || '翻译失败' };
    }
  };

  const handleBatchUpdate = async (action, content, position, findText, replaceText) => {
    if (action === 'translate-all') {
      setLoading(true);
      try {
        const updatedFiles = [...files];
        for (let i = 0; i < updatedFiles.length; i++) {
          if (!updatedFiles[i].translated && !updatedFiles[i].translating) {
            updatedFiles[i] = await translateFile(updatedFiles[i]);
            setFiles([...updatedFiles]); // Update UI after each file
          }
        }
      } catch (err) {
        setError('批量翻译时出错');
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else if (action === 'add') {
      // 添加内容到所有文件
      setLoading(true);
      try {
        const updatedFiles = files.map((file) => {
          if (file.isImage) return file; // 跳过图片文件

          let newText = file.originalText || '';
          if (position === 'start') {
            newText = content + newText;
          } else {
            newText = newText + content;
          }

          return {
            ...file,
            originalText: newText,
          };
        });

        setFiles(updatedFiles);
      } catch (err) {
        setError('批量添加内容时出错');
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else if (action === 'replace') {
      // 替换所有文件中的内容
      setLoading(true);
      try {
        const updatedFiles = files.map((file) => {
          if (file.isImage) return file; // 跳过图片文件

          let newText = file.originalText || '';
          newText = newText.replace(new RegExp(findText, 'g'), replaceText);

          return {
            ...file,
            originalText: newText,
          };
        });

        setFiles(updatedFiles);
      } catch (err) {
        setError('批量替换内容时出错');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const zip = new JSZip();

      // 创建一个记录已添加图片的集合
      const addedImages = new Set();

      // 首先添加所有文本文件
      files.forEach((file) => {
        // 添加文本内容
        if (!file.isImage) {
          const content = file.translatedText || file.originalText;
          zip.file(file.name, content);
        }
      });

      // 处理所有文件中的图片
      for (const file of files) {
        // 如果有关联图片，添加图片
        if (file.originalImageName && !addedImages.has(file.originalImageName)) {
          if (file.originalImageFile) {
            // 如果有原始文件对象，直接使用
            zip.file(file.originalImageName, file.originalImageFile);
            addedImages.add(file.originalImageName);
            console.log(`成功添加图片(使用原始文件): ${file.originalImageName}`);
          }
        }

        // 如果是独立图片文件，也添加
        if (file.isImage && !addedImages.has(file.name) && file.originalFile) {
          zip.file(file.name, file.originalFile);
          addedImages.add(file.name);
          console.log(`成功添加图片(使用原始文件): ${file.name}`);
        }
      }

      // 生成并下载zip文件
      const content = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      saveAs(content, `translated-files-${timestamp}.zip`);
    } catch (err) {
      setError('下载文件时出错');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 组件卸载时清理所有对象URL
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.imageUrl) {
          URL.revokeObjectURL(file.imageUrl);
        }
      });
    };
  }, [files]);

  return { files, loading, error, processFiles, handleTextUpdate, handleBatchUpdate, handleDownload, addTextFile };
};
