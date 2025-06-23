import React, { useState, useRef } from 'react';
import { usePosterCreation } from '../hooks/usePosterCreation';
import PosterStyleSelector from './PosterStyleSelector';
import ErrorDisplay from './ErrorDisplay';
import FileUploader from './FileUploader';

const PosterCreator = () => {
  const { uploadedImage, selectedStyle, generatedPoster, loading, error, handleImageUpload, handleStyleSelect, generatePoster, downloadPoster } =
    usePosterCreation();

  return (
    <div className='poster-creator'>
      <ErrorDisplay error={error} />

      <div className='mb-6'>
        <h2 className='text-xl font-bold mb-2'>上传产品图片</h2>
        <p className='text-gray-600 mb-4'>上传高质量的产品图片以创建专业海报</p>
        <FileUploader onUpload={handleImageUpload} loading={loading} accept='image/*' />
      </div>

      {uploadedImage && (
        <>
          <div className='mb-6'>
            <h2 className='text-xl font-bold mb-2'>选择海报样式</h2>
            <PosterStyleSelector onStyleSelect={handleStyleSelect} selectedStyle={selectedStyle} />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <div>
              <h3 className='text-lg font-semibold mb-2'>原始图片</h3>
              <div className='border border-gray-300 rounded-lg overflow-hidden bg-white p-2'>
                <img src={uploadedImage} alt='Original' className='w-full h-auto' />
              </div>
            </div>

            <div>
              <h3 className='text-lg font-semibold mb-2'>预览效果</h3>
              <div className='border border-gray-300 rounded-lg overflow-hidden bg-white p-2 min-h-[300px] flex items-center justify-center'>
                {generatedPoster ? (
                  <img src={generatedPoster} alt='Generated Poster' className='w-full h-auto' />
                ) : (
                  <div className='text-gray-400'>选择样式后生成预览</div>
                )}
              </div>
            </div>
          </div>

          <div className='flex justify-center space-x-4 mb-6'>
            <button
              onClick={generatePoster}
              disabled={!selectedStyle || loading}
              className={`px-6 py-3 rounded-lg font-medium ${
                !selectedStyle || loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? '生成中...' : '生成海报'}
            </button>

            {generatedPoster && (
              <button onClick={downloadPoster} className='bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg'>
                下载海报
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PosterCreator;
