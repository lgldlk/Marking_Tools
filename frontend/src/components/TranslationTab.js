import React from 'react';
import FileUploader from './FileUploader';
import FileList from './FileList';
import BatchTools from './BatchTools';
import LanguageSelector from './LanguageSelector';
import TranslationServiceSelector from './TranslationServiceSelector';
import ErrorDisplay from './ErrorDisplay';
import { useTranslation } from '../hooks/useTranslation';
import { useFileProcessing } from '../hooks/useFileProcessing';

const TranslationTab = () => {
  const {
    sourceLang,
    targetLang,
    translationService,
    error: translationError,
    setError,
    handleSourceLanguageChange,
    handleTargetLanguageChange,
    handleServiceChange,
    translateContent,
  } = useTranslation();

  const { files, loading, error: fileError, processFiles, handleTextUpdate, handleBatchUpdate, handleDownload } = useFileProcessing(translateContent);

  // Combine errors from both hooks
  const error = translationError || fileError;

  return (
    <>
      <ErrorDisplay error={error} />

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
  );
};

export default TranslationTab;
