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
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt'],
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
                <p className='text-sm text-gray-500'>请同时选择图片文件和对应的TXT文件</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className='mt-4 text-sm text-gray-600'>
        <p>请上传图片文件(.jpg, .png, .jpeg)和对应的同名TXT文件。例如: image1.jpg 和 image1.txt</p>
      </div>
    </div>
  );
};

export default FileUploader;
