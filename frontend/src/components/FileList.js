import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/index';

const FileList = ({ files, onTextUpdate, targetLang, sourceLang, translationService, loading, onDownload }) => {
  const [editingOriginal, setEditingOriginal] = useState(null);
  const [editingTranslation, setEditingTranslation] = useState(null);
  const [editText, setEditText] = useState('');
  const [translationText, setTranslationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEditOriginal = (file) => {
    if (loading || isLoading) return; // Prevent editing during translation
    setEditingOriginal(file.id);
    setEditText(file.originalText || '');
    setEditingTranslation(null);
  };

  const handleEditTranslation = (file) => {
    if (loading || isLoading) return; // Prevent editing during translation
    setEditingTranslation(file.id);
    setTranslationText(file.translatedText || '');
    setEditingOriginal(null);
  };

  const handleSaveOriginal = async (file) => {
    if (editText === file.originalText) {
      setEditingOriginal(null);
      return;
    }

    setIsLoading(true);
    try {
      await onTextUpdate(file.id, editText);
    } catch (err) {
      console.error('Update error:', err);
      alert('更新原文时出错: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
      setEditingOriginal(null);
    }
  };

  const handleSaveTranslation = async (file) => {
    setIsLoading(true);
    try {
      // 直接更新翻译内容
      await onTextUpdate(file.id, translationText, true);

      // 如果需要反向翻译（启用反向翻译功能）
      const response = await axios.post(`${API_BASE_URL}/translate`, {
        text: translationText,
        source_lang: targetLang, // 当前翻译内容使用的是目标语言
        target_lang: sourceLang, // 我们需要将其翻译回源语言
        service: translationService,
      });

      const newOriginalText = response.data.translatedText;
      await onTextUpdate(file.id, newOriginalText, false); // 更新原始内容
    } catch (err) {
      console.error('Translation update error:', err);
      alert('更新翻译时出错: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
      setEditingTranslation(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingOriginal(null);
    setEditingTranslation(null);
  };

  const handleKeyDown = (e, file, isOriginal) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div>
      <p className='mb-4 text-gray-600'>共有 {files.length} 个文件</p>
      <p className='mb-4 text-sm text-gray-500'>
        提示: 点击文本区域可以编辑，编辑后点击"保存并翻译"按钮进行翻译。
        {(loading || isLoading) && <span className='text-blue-500 ml-2'>翻译处理中，请稍候...</span>}
      </p>

      <div className='space-y-8'>
        {files.map((file) => (
          <div key={file.id} className='border rounded-lg overflow-hidden shadow-sm'>
            <div className='flex flex-col md:flex-row'>
              <div className='md:w-1/3 p-4 bg-gray-50'>
                <h3 className='font-semibold text-lg mb-2'>{file.name}</h3>
                {file.imageUrl && (
                  <div className='aspect-w-3 aspect-h-2 mb-4'>
                    <img
                      src={file.imageUrl}
                      alt={file.originalImageName || file.name}
                      className='object-contain w-full h-full rounded border'
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {file.originalImageName && <p className='text-sm text-gray-500'>关联图片: {file.originalImageName}</p>}
              </div>

              <div className='md:w-2/3 p-4'>
                <div className='mb-4'>
                  <h4 className='font-medium text-gray-700 mb-2'>原始内容:</h4>
                  {editingOriginal === file.id ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, file, true)}
                      className='w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      rows='4'
                      autoFocus
                    />
                  ) : (
                    <div
                      className={`bg-gray-50 p-3 rounded border whitespace-pre-wrap min-h-[100px] ${
                        loading || isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-text hover:bg-gray-100'
                      } transition-colors`}
                      onClick={() => handleEditOriginal(file)}
                    >
                      {file.originalText || <span className='text-gray-400 italic'>无内容</span>}
                    </div>
                  )}
                </div>

                <div className='mb-4'>
                  <h4 className='font-medium text-gray-700 mb-2'>翻译内容:</h4>
                  {editingTranslation === file.id ? (
                    <textarea
                      value={translationText}
                      onChange={(e) => setTranslationText(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, file, false)}
                      className='w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                      rows='4'
                      autoFocus
                    />
                  ) : (
                    <div
                      className={`bg-blue-50 p-3 rounded border whitespace-pre-wrap min-h-[100px] ${
                        loading || isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-text hover:bg-blue-100'
                      } transition-colors`}
                      onClick={() => handleEditTranslation(file)}
                    >
                      {file.translatedText || <span className='text-gray-400 italic'>无翻译</span>}
                    </div>
                  )}
                </div>

                {(editingOriginal === file.id || editingTranslation === file.id) && (
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => (editingOriginal === file.id ? handleSaveOriginal(file) : handleSaveTranslation(file))}
                      disabled={loading || isLoading}
                      className='bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400'
                    >
                      {loading || isLoading ? '处理中...' : '保存并翻译'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className='bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200'
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
