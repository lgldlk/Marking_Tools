import React, { useState, useCallback, useContext, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { API_BASE_URL } from '../config';

// 创建一个上下文来在组件之间共享数据
export const TranslationContext = React.createContext({
  setTranslationText: () => {},
  setActiveTab: () => {},
});

// localStorage的键名
const STORAGE_KEY = 'kontext_labeler_settings';

const KontextLabeler = () => {
  const [images, setImages] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gpt-4-vision-preview');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are an assistant that describes the differences between two images. Focus on what objects have been removed or changed in the second image compared to the first one.'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 获取上下文，用于跳转到翻译模块
  const { setTranslationText, setActiveTab } = useContext(TranslationContext);

  // 初始化时只读取，不保存
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.apiKey) setApiKey(settings.apiKey);
        if (settings.baseUrl) setBaseUrl(settings.baseUrl);
        if (settings.model) setModel(settings.model);
        if (settings.systemPrompt) setSystemPrompt(settings.systemPrompt);
        console.log('已从localStorage加载设置');
      } catch (err) {
        console.error('解析localStorage数据时出错:', err);
      }
    }
    setIsInitialized(true); // 标记初始化完成
  }, []);

  // 只有初始化完成后才保存
  useEffect(() => {
    if (!isInitialized) return;
    const settings = { apiKey, baseUrl, model, systemPrompt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    console.log('设置已保存到localStorage');
  }, [apiKey, baseUrl, model, systemPrompt, isInitialized]);

  const onDrop = useCallback((acceptedFiles) => {
    const imageFiles = acceptedFiles.filter((file) => file.type.startsWith('image/') && (file.name.includes('_R.') || file.name.includes('_T.')));

    if (imageFiles.length === 0) {
      setError('请上传带有_R或_T后缀的图片文件');
      return;
    }

    // 处理文件
    const processFiles = (files) => {
      return files.map((file) => {
        // 获取基本名称和后缀
        const fullName = file.name;
        const baseName = fullName.split(/_(R|T)\./)[0];
        const suffix = fullName.includes('_R.') ? 'R' : fullName.includes('_T.') ? 'T' : 'unknown';

        return {
          id: `${baseName}_${suffix}`,
          baseName: baseName,
          suffix: suffix,
          name: file.name,
          file: file,
          previewUrl: URL.createObjectURL(file),
        };
      });
    };

    const newImages = processFiles(imageFiles);
    setImages((prevImages) => {
      // 合并图片，避免重复
      const merged = [...prevImages];

      newImages.forEach((newImg) => {
        const existingIndex = merged.findIndex((img) => img.id === newImg.id);
        if (existingIndex >= 0) {
          // 释放旧的URL
          URL.revokeObjectURL(merged[existingIndex].previewUrl);
          // 替换为新图片
          merged[existingIndex] = newImg;
        } else {
          merged.push(newImg);
        }
      });

      return merged;
    });

    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    multiple: true,
  });

  const handleRemoveImage = (id) => {
    setImages((prevImages) => {
      // 释放被删除图片的对象URL
      const imageToRemove = prevImages.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return prevImages.filter((img) => img.id !== id);
    });
  };

  const handleRemoveAll = () => {
    // 释放所有图片的对象URL
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
    setResults([]);
    setShowResults(false);
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      setError('请先上传图片');
      return;
    }

    if (!apiKey) {
      setError('请输入OpenAI API Key');
      return;
    }

    if (!model) {
      setError('请输入模型名称');
      return;
    }

    // 检查是否有完整的图片对
    const baseNames = new Set();
    const suffixes = new Map();

    images.forEach((img) => {
      baseNames.add(img.baseName);
      if (!suffixes.has(img.baseName)) {
        suffixes.set(img.baseName, new Set());
      }
      suffixes.get(img.baseName).add(img.suffix);
    });

    let hasCompletePair = false;
    for (const baseName of baseNames) {
      const suffixSet = suffixes.get(baseName);
      if (suffixSet.has('R') && suffixSet.has('T')) {
        hasCompletePair = true;
        break;
      }
    }

    if (!hasCompletePair) {
      setError('请确保至少有一组完整的_R和_T后缀图片对');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('api_key', apiKey);
      formData.append('base_url', baseUrl);
      formData.append('system_prompt', systemPrompt);
      formData.append('model', model);

      // 添加所有图片
      images.forEach((img) => {
        formData.append('images', img.file);
      });

      // 发送请求
      const response = await axios.post(`${API_BASE_URL}/kontext/label`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 处理返回的JSON结果
      if (response.data && response.data.success) {
        setResults(response.data.results);
        setShowResults(true);
      } else {
        setError('处理过程中出错');
      }
    } catch (err) {
      console.error('Error during labeling:', err);

      // 尝试从错误响应中提取信息
      if (err.response && err.response.data) {
        setError(err.response.data.error || '处理过程中出错');
      } else {
        setError(err.message || '处理过程中出错');
      }
    } finally {
      setLoading(false);
    }
  };

  // 处理跳转到翻译模块
  const handleGoToTranslation = (description) => {
    if (setTranslationText && setActiveTab) {
      setTranslationText(description);
      setActiveTab('translation');
    }
  };

  // 下载所有结果为TXT文件和图片
  const handleDownloadAll = () => {
    if (results.length === 0) return;

    const zip = new JSZip();

    // 添加文本描述
    results.forEach((result) => {
      if (result.description) {
        const fileName = `${result.base_name}_T.txt`;
        zip.file(fileName, result.description);
      }

      // 添加R图片 - 直接使用完整数据
      if (result.r_image && result.r_image.preview) {
        try {
          // 获取原始文件扩展名
          const originalFileName = result.r_image.name;

          // 将base64转换为二进制数据
          const binaryString = atob(result.r_image.preview);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // 创建Blob并添加到zip
          const blob = new Blob([bytes.buffer]);
          zip.file(originalFileName, blob);
          console.log(`添加R图片: ${originalFileName}`);
        } catch (err) {
          console.error(`Error adding R image ${result.r_image.name}:`, err);
        }
      }

      // 添加T图片 - 直接使用完整数据
      if (result.t_image && result.t_image.preview) {
        try {
          // 获取原始文件扩展名
          const originalFileName = result.t_image.name;

          // 将base64转换为二进制数据
          const binaryString = atob(result.t_image.preview);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // 创建Blob并添加到zip
          const blob = new Blob([bytes.buffer]);
          zip.file(originalFileName, blob);
          console.log(`添加T图片: ${originalFileName}`);
        } catch (err) {
          console.error(`Error adding T image ${result.t_image.name}:`, err);
        }
      }
    });

    // 生成并下载zip文件
    zip.generateAsync({ type: 'blob' }).then((content) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      saveAs(content, `kontext_results_${timestamp}.zip`);
    });
  };

  // 组件卸载时清理所有对象URL
  React.useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, []);

  // 按基本名称对图片进行分组
  const groupedImages = images.reduce((acc, img) => {
    if (!acc[img.baseName]) {
      acc[img.baseName] = [];
    }
    acc[img.baseName].push(img);
    return acc;
  }, {});

  return (
    <div className='p-4'>
      <h2 className='text-xl font-bold mb-4'>Kontext训练集图片标注</h2>

      {!showResults ? (
        <div className='mb-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <div
              {...getRootProps()}
              className='border-2 border-dashed border-gray-300 rounded-md p-6 mb-4 text-center cursor-pointer hover:border-blue-500'
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>拖放图片文件到这里...</p>
              ) : (
                <div>
                  <p className='mb-2'>点击或拖放图片文件到这里上传</p>
                  <p className='text-sm text-gray-500'>请上传带有_R和_T后缀的图片对</p>
                </div>
              )}
            </div>

            {error && <div className='text-red-500 mb-4'>{error}</div>}

            <div className='mb-4'>
              <label htmlFor='apiKey' className='block text-sm font-medium text-gray-700 mb-1'>
                OpenAI API Key
              </label>
              <input
                type='password'
                id='apiKey'
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className='w-full p-2 border border-gray-300 rounded-md'
                placeholder='sk-...'
              />
            </div>

            <div className='mb-4'>
              <label htmlFor='baseUrl' className='block text-sm font-medium text-gray-700 mb-1'>
                API Base URL (可选)
              </label>
              <input
                type='text'
                id='baseUrl'
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className='w-full p-2 border border-gray-300 rounded-md'
                placeholder='https://api.openai.com/v1'
              />
            </div>

            <div className='mb-4'>
              <label htmlFor='model' className='block text-sm font-medium text-gray-700 mb-1'>
                模型名称
              </label>
              <input
                type='text'
                id='model'
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className='w-full p-2 border border-gray-300 rounded-md'
                placeholder='gpt-4-vision-preview'
              />
              <p className='text-xs text-gray-500 mt-1'>常用模型: gpt-4-vision-preview, gpt-4o, gpt-4o-mini, claude-3-opus, claude-3-sonnet</p>
            </div>

            <div className='mb-4'>
              <label htmlFor='systemPrompt' className='block text-sm font-medium text-gray-700 mb-1'>
                系统提示词
              </label>
              <textarea
                id='systemPrompt'
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className='w-full p-2 border border-gray-300 rounded-md'
                rows={3}
              />
            </div>

            <div className='flex gap-2'>
              <button
                onClick={handleSubmit}
                disabled={loading || images.length === 0}
                className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400'
              >
                {loading ? '处理中...' : '开始标注'}
              </button>

              <button
                onClick={handleRemoveAll}
                disabled={loading || images.length === 0}
                className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:bg-gray-400'
              >
                清空
              </button>
            </div>
          </div>

          <div>
            <h3 className='text-lg font-semibold mb-4'>已上传图片 ({images.length})</h3>

            {Object.keys(groupedImages).length > 0 ? (
              <div className='space-y-6'>
                {Object.entries(groupedImages).map(([baseName, imgs]) => (
                  <div key={baseName} className='border rounded-md p-3'>
                    <h4 className='font-medium mb-2'>基本名称: {baseName}</h4>
                    <div className='grid grid-cols-2 gap-3'>
                      {imgs.map((img) => (
                        <div key={img.id} className='border rounded-md overflow-hidden'>
                          <div className='relative h-40'>
                            <img src={img.previewUrl} alt={img.name} className='w-full h-full object-contain' />
                            <div className='absolute top-2 right-2 bg-blue-500 text-white text-xs px-1 py-0.5 rounded'>{img.suffix}</div>
                          </div>
                          <div className='p-2'>
                            <p className='text-sm truncate' title={img.name}>
                              {img.name}
                            </p>
                            <div className='flex justify-end mt-2'>
                              <button
                                onClick={() => handleRemoveImage(img.id)}
                                className='text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded'
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className='mt-2 text-sm'>
                      状态:{' '}
                      {imgs.some((img) => img.suffix === 'R') && imgs.some((img) => img.suffix === 'T') ? (
                        <span className='text-green-500'>完整图片对</span>
                      ) : (
                        <span className='text-red-500'>不完整图片对</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-gray-500 text-center p-6 border border-gray-200 rounded-md'>暂无上传的图片</div>
            )}
          </div>
        </div>
      ) : (
        <div className='mb-6'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold'>标注结果 ({results.length})</h3>
            <div className='flex gap-2'>
              <button onClick={handleDownloadAll} className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'>
                下载所有结果
              </button>
              <button onClick={() => setShowResults(false)} className='bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded'>
                返回上传界面
              </button>
            </div>
          </div>

          <div className='space-y-8'>
            {results.map((result, index) => (
              <div key={index} className='border rounded-md p-4 bg-white shadow-sm'>
                <h4 className='font-medium text-lg mb-3'>图片组: {result.base_name}</h4>

                {result.error ? (
                  <div className='text-red-500 mb-4'>错误: {result.error}</div>
                ) : (
                  <>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                      {result.r_image && (
                        <div className='border rounded p-2'>
                          <div className='h-48 flex items-center justify-center bg-gray-100'>
                            <img
                              src={`data:image/${result.r_image.format};base64,${result.r_image.preview}`}
                              alt={`${result.base_name}_R`}
                              className='max-h-full max-w-full object-contain'
                            />
                          </div>
                          <p className='text-sm text-center mt-2'>{result.r_image.name}</p>
                        </div>
                      )}

                      {result.t_image && (
                        <div className='border rounded p-2'>
                          <div className='h-48 flex items-center justify-center bg-gray-100'>
                            <img
                              src={`data:image/${result.t_image.format};base64,${result.t_image.preview}`}
                              alt={`${result.base_name}_T`}
                              className='max-h-full max-w-full object-contain'
                            />
                          </div>
                          <p className='text-sm text-center mt-2'>{result.t_image.name}</p>
                        </div>
                      )}
                    </div>

                    <div className='bg-gray-50 p-3 rounded border'>
                      <h5 className='font-medium mb-2'>描述:</h5>
                      <p className='whitespace-pre-line'>{result.description}</p>
                    </div>

                    {/* <div className='mt-4 flex justify-end'>
                      <button
                        onClick={() => handleGoToTranslation(result.description)}
                        className='bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm'
                      >
                        跳转到翻译模块
                      </button>
                    </div> */}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KontextLabeler;
