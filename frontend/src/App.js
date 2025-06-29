import React, { useState } from 'react';
import axios from 'axios';
import FileUploader from './components/FileUploader';
import FileList from './components/FileList';
import BatchTools from './components/BatchTools';
import LanguageSelector from './components/LanguageSelector';
import TranslationServiceSelector from './components/TranslationServiceSelector';
import ImageBatchEditor from './components/ImageBatchEditor';
import { API_BASE_URL } from './config/index';

axios.defaults.headers.common['Content-Type'] = 'application/json';

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('zh-CN');
  const [translationService, setTranslationService] = useState('google');
  const [activeTab, setActiveTab] = useState('translation');

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
        setLoading(false);
        return;
      }

      if (imageFiles[0].type === 'application/zip') {
        setError('前端处理模式下暂不支持ZIP文件，请直接上传图片和对应的TXT文件');
        setLoading(false);
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
          if (sourceLang !== 'auto' && sourceLang === targetLang) {
            setError('源语言和目标语言不能相同');
            throw new Error('源语言和目标语言不能相同');
          }

          const response = await axios.post(`${API_BASE_URL}/translate`, {
            text: textContent,
            source_lang: sourceLang,
            target_lang: targetLang,
            service: translationService,
          });
          translatedContent = response.data.translatedText;
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

  const readTextFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  };

  const handleTextUpdate = async (imageName, newContent) => {
    try {
      if (sourceLang !== 'auto' && sourceLang === targetLang) {
        setError('源语言和目标语言不能相同');
        throw new Error('源语言和目标语言不能相同');
      }

      const response = await axios.post(`${API_BASE_URL}/translate`, {
        text: newContent,
        source_lang: sourceLang,
        target_lang: targetLang,
        service: translationService,
      });

      const translatedContent = response.data.translatedText;

      setFiles((prevFiles) =>
        prevFiles.map((file) => (file.originalName === imageName ? { ...file, textContent: newContent, translatedContent } : file))
      );
    } catch (err) {
      setError('更新文本时出错: ' + err.message);
      console.error('Update error:', err);
      throw err; // Rethrow to be caught by the component
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
          if (sourceLang !== 'auto' && sourceLang === targetLang) {
            setError('源语言和目标语言不能相同');
            throw new Error('源语言和目标语言不能相同');
          }

          const response = await axios.post(`${API_BASE_URL}/translate`, {
            text: newContent,
            source_lang: sourceLang,
            target_lang: targetLang,
            service: translationService,
          });

          updatedFiles[i] = {
            ...file,
            textContent: newContent,
            translatedContent: response.data.translatedText,
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

  const handleSourceLanguageChange = (newLang) => {
    if (newLang === targetLang && newLang !== 'auto') {
      setError('源语言和目标语言不能相同');
      return;
    }

    setError(null);
    setSourceLang(newLang);
  };

  const handleTargetLanguageChange = async (newLang) => {
    if (newLang === sourceLang && sourceLang !== 'auto') {
      setError('源语言和目标语言不能相同');
      return;
    }

    setError(null);
    setTargetLang(newLang);

    if (files.length > 0) {
      setLoading(true);

      try {
        const updatedFiles = [...files];

        for (let i = 0; i < updatedFiles.length; i++) {
          const file = updatedFiles[i];

          const response = await axios.post(`${API_BASE_URL}/translate`, {
            text: file.textContent,
            source_lang: sourceLang,
            target_lang: newLang,
            service: translationService,
          });

          updatedFiles[i] = {
            ...file,
            translatedContent: response.data.translatedText,
          };
        }

        setFiles(updatedFiles);
      } catch (err) {
        setError('更改语言时出错: ' + err.message);
        console.error('Language change error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleServiceChange = async (newService) => {
    if (newService === translationService) return;

    setTranslationService(newService);

    if (files.length > 0) {
      setLoading(true);

      try {
        const updatedFiles = [...files];

        for (let i = 0; i < updatedFiles.length; i++) {
          const file = updatedFiles[i];

          const response = await axios.post(`${API_BASE_URL}/translate`, {
            text: file.textContent,
            source_lang: sourceLang,
            target_lang: targetLang,
            service: newService,
          });

          updatedFiles[i] = {
            ...file,
            translatedContent: response.data.translatedText,
          };
        }

        setFiles(updatedFiles);
      } catch (err) {
        setError('更改翻译服务时出错: ' + err.message);
        console.error('Translation service change error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = () => {
    if (files.length === 0) {
      setError('没有可下载的文件');
      return;
    }

    import('jszip')
      .then(({ default: JSZip }) => {
        const zip = new JSZip();

        files.forEach((file) => {
          zip.file(file.originalName, file.imageFile);

          const baseName = file.originalName.substring(0, file.originalName.lastIndexOf('.'));
          const txtFileName = `${baseName}.txt`;
          zip.file(txtFileName, file.textContent);
        });

        zip
          .generateAsync({ type: 'blob' })
          .then((content) => {
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'marked_files.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          })
          .catch((err) => {
            setError('创建ZIP文件时出错: ' + err.message);
            console.error('Zip creation error:', err);
          });
      })
      .catch((err) => {
        setError('加载JSZip库时出错: ' + err.message);
        console.error('JSZip loading error:', err);
      });
  };

  return (
    <div className='min-h-screen bg-gray-100'>
      <header className='bg-blue-600 text-white p-4 shadow-md'>
        <div className='container mx-auto'>
          <h1 className='text-3xl font-bold'>打标对照器</h1>
          <p className='mt-2'>用于进行图片训练集打标集更改</p>
        </div>
      </header>

      <main className='container mx-auto py-6 px-4'>
        <h1 className='text-2xl font-bold mb-6'>Marking Tools</h1>

        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
            <strong>错误：</strong> {error}
          </div>
        )}

        <div className='border-b border-gray-200 mb-6'>
          <nav className='-mb-px flex'>
            <button
              onClick={() => setActiveTab('translation')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'translation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              图文翻译
            </button>
            <button
              onClick={() => setActiveTab('image-editor')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'image-editor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              图片批量裁剪
            </button>
          </nav>
        </div>

        {activeTab === 'translation' ? (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
              <div>
                <h2 className='text-xl font-bold mb-2'>源语言</h2>
                <LanguageSelector value={sourceLang} onChange={handleSourceLanguageChange} includeAuto={true} />
              </div>
              <div>
                <h2 className='text-xl font-bold mb-2'>目标语言</h2>
                <LanguageSelector value={targetLang} onChange={handleTargetLanguageChange} includeAuto={false} />
              </div>
            </div>

            <div className='mb-6'>
              <h2 className='text-xl font-bold mb-2'>翻译服务</h2>
              <TranslationServiceSelector onServiceChange={handleServiceChange} currentService={translationService} />
            </div>

            <div className='mb-6'>
              <FileUploader onUpload={processFiles} loading={loading} />
            </div>

            {files.length > 0 && (
              <>
                <div className='mb-6'>
                  <h2 className='text-xl font-bold mb-2'>批量工具</h2>
                  <BatchTools onBatchUpdate={handleBatchUpdate} />
                </div>

                <div className='mb-6'>
                  <h2 className='text-xl font-bold mb-2'>文件列表</h2>
                  <FileList files={files} onTextUpdate={handleTextUpdate} onDownload={handleDownload} loading={loading} />
                </div>

                <div className='flex justify-center mb-6'>
                  <button
                    onClick={handleDownload}
                    className='bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200'
                  >
                    下载标记文件
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <ImageBatchEditor />
        )}
      </main>

      <footer className='bg-gray-800 text-white p-4 mt-12'>
        <div className='container mx-auto text-center'>
          <p>打标对照器 © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
