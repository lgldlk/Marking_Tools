import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/index';

const FileList = ({ files, onTextUpdate, targetLang, sourceLang, translationService }) => {
  const [editingOriginal, setEditingOriginal] = useState(null);
  const [editingTranslation, setEditingTranslation] = useState(null);
  const [editText, setEditText] = useState('');
  const [translationText, setTranslationText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEditOriginal = (file) => {
    if (loading) return; // Prevent editing during translation
    setEditingOriginal(file.originalName);
    setEditText(file.textContent);
    setEditingTranslation(null);
  };

  const handleEditTranslation = (file) => {
    if (loading) return; // Prevent editing during translation
    setEditingTranslation(file.originalName);
    setTranslationText(file.translatedContent);
    setEditingOriginal(null);
  };

  const handleSaveOriginal = async (file) => {
    if (editText === file.textContent) {
      setEditingOriginal(null);
      return;
    }

    setLoading(true);
    try {
      await onTextUpdate(file.originalName, editText);
    } catch (err) {
      console.error('Update error:', err);
      alert('更新原文时出错: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      setEditingOriginal(null);
    }
  };

  const handleSaveTranslation = async (file) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/translate`, {
        text: translationText,
        source_lang: targetLang, // The current translation is in the target language
        target_lang: sourceLang, // We want to translate back to the source language
        service: translationService,
      });

      const newOriginalText = response.data.translatedText;

      await onTextUpdate(file.originalName, newOriginalText);
    } catch (err) {
      console.error('Translation update error:', err);
      alert('更新翻译时出错: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
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
      <h2 className='text-xl font-bold mb-4'>文件列表</h2>
      <p className='mb-4 text-gray-600'>共有 {files.length} 个文件</p>
      <p className='mb-4 text-sm text-gray-500'>
        提示: 点击文本区域可以编辑，编辑后点击"保存并翻译"按钮进行翻译。
        {loading && <span className='text-blue-500 ml-2'>翻译处理中，请稍候...</span>}
      </p>

      <div className='space-y-8'>
        {files.map((file) => (
          <div key={file.originalName} className='border rounded-lg overflow-hidden shadow-sm'>
            <div className='flex flex-col md:flex-row'>
              <div className='md:w-1/3 p-4 bg-gray-50'>
                <h3 className='font-semibold text-lg mb-2'>{file.originalName}</h3>
                <div className='aspect-w-3 aspect-h-2 mb-4'>
                  <img src={file.imageUrl} alt={file.originalName} className='object-contain w-full h-full rounded border' />
                </div>
              </div>

              <div className='md:w-2/3 p-4'>
                <div className='mb-4'>
                  <h4 className='font-medium text-gray-700 mb-2'>原始内容:</h4>
                  {editingOriginal === file.originalName ? (
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
                        loading ? 'cursor-not-allowed opacity-70' : 'cursor-text hover:bg-gray-100'
                      } transition-colors`}
                      onClick={() => handleEditOriginal(file)}
                    >
                      {file.textContent || <span className='text-gray-400 italic'>无内容</span>}
                    </div>
                  )}
                </div>

                <div className='mb-4'>
                  <h4 className='font-medium text-gray-700 mb-2'>翻译内容:</h4>
                  {editingTranslation === file.originalName ? (
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
                        loading ? 'cursor-not-allowed opacity-70' : 'cursor-text hover:bg-blue-100'
                      } transition-colors`}
                      onClick={() => handleEditTranslation(file)}
                    >
                      {file.translatedContent || <span className='text-gray-400 italic'>无翻译</span>}
                    </div>
                  )}
                </div>

                {(editingOriginal === file.originalName || editingTranslation === file.originalName) && (
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => (editingOriginal === file.originalName ? handleSaveOriginal(file) : handleSaveTranslation(file))}
                      disabled={loading}
                      className='bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400'
                    >
                      {loading ? '处理中...' : '保存并翻译'}
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
