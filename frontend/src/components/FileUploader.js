import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUploader = ({ onUpload, loading }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onUpload(acceptedFiles);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'text/plain': ['.txt'],
      'text/html': ['.html', '.htm'],
      'text/markdown': ['.md'],
      'application/json': ['.json'],
      'text/javascript': ['.js'],
      'text/css': ['.css'],
    },
    multiple: true,
  });

  return (
    <div className='mb-6'>
      <h2 className='text-xl font-bold mb-4'>上传文件</h2>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} 
                  rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition duration-200`}
      >
        <input {...getInputProps()} />

        {loading ? (
          <div className='flex flex-col items-center justify-center'>
            <div className='loading-spinner mb-4'></div>
            <p>处理中，请稍候...</p>
          </div>
        ) : (
          <div>
            {isDragActive ? (
              <p className='text-blue-500'>将文件拖放到这里 ...</p>
            ) : (
              <div>
                <p className='mb-2'>将文件拖到此处，或点击上传</p>
                <p className='text-sm text-gray-500'>支持多种文件格式，包括图片、文本和其他常见文件</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className='mt-4 text-sm text-gray-600'>
        <p>支持的文件格式: 图片(.jpg, .png, .jpeg, .gif, .webp), 文本文件(.txt, .md, .html), 以及其他常见文件(.js, .css, .json)</p>
      </div>
    </div>
  );
};

export default FileUploader;
