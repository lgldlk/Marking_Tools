import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ImageCropEditor from './ImageCropEditor';

const ImageBatchEditor = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [outputFormat, setOutputFormat] = useState('jpeg');
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const imageFiles = acceptedFiles.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('请上传图片文件');
      return;
    }

    // 处理文件夹上传的情况
    const processFiles = (files) => {
      return files.map((file) => {
        // 生成唯一ID
        const id = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

        return {
          id: id,
          name: file.name,
          originalFile: file,
          previewUrl: URL.createObjectURL(file),
          editedBlob: null,
          croppedData: null,
          path: file.path || file.webkitRelativePath || file.name,
        };
      });
    };

    const newImages = processFiles(imageFiles);
    setImages((prevImages) => [...prevImages, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    // 允许文件夹上传
    directory: true,
    multiple: true,
  });

  const handleEditImage = (image) => {
    setSelectedImage(image);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedImage(null);
  };

  const handleSaveEdit = (editedBlob, croppedData) => {
    // 释放之前的对象URL，避免内存泄漏
    if (selectedImage && selectedImage.editedBlob) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }

    // 创建新的预览URL
    const newPreviewUrl = URL.createObjectURL(editedBlob);

    setImages((prevImages) =>
      prevImages.map((img) =>
        img.id === selectedImage.id
          ? {
              ...img,
              editedBlob,
              croppedData,
              previewUrl: newPreviewUrl,
            }
          : img
      )
    );

    setIsEditorOpen(false);
    setSelectedImage(null);
  };

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
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) {
      alert('没有可下载的图片');
      return;
    }

    setLoading(true);
    try {
      const zip = new JSZip();
      const promises = [];

      // 处理每个图片
      for (const image of images) {
        const blob = image.editedBlob || image.originalFile;
        const fileExtension = outputFormat === 'original' ? image.name.split('.').pop() : outputFormat;

        const fileName = image.name.split('.')[0] + '.' + fileExtension;

        if (outputFormat === 'original' || (blob === image.originalFile && !image.croppedData)) {
          // 直接使用原始文件
          zip.file(fileName, blob);
        } else {
          // 转换为选定格式并压缩
          const promise = new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
              // 设置画布尺寸
              canvas.width = img.width;
              canvas.height = img.height;

              // 绘制图像
              ctx.drawImage(img, 0, 0);

              // 转换为blob
              canvas.toBlob(
                (convertedBlob) => {
                  zip.file(fileName, convertedBlob);
                  resolve();
                },
                `image/${outputFormat}`,
                compressionQuality
              );
            };

            img.src = URL.createObjectURL(blob);
          });

          promises.push(promise);
        }
      }

      // 等待所有图片处理完成
      await Promise.all(promises);

      // 生成并下载zip文件
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      saveAs(zipBlob, `images-${timestamp}.zip`);
    } catch (error) {
      console.error('下载过程中出错:', error);
      alert('下载过程中出错，请重试');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className='p-4'>
      <h2 className='text-xl font-bold mb-4'>图片批量裁剪编辑</h2>

      <div
        {...getRootProps()}
        className='border-2 border-dashed border-gray-300 rounded-md p-6 mb-4 text-center cursor-pointer hover:border-blue-500'
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>拖放图片文件或文件夹到这里...</p>
        ) : (
          <div>
            <p className='mb-2'>点击或拖放图片文件到这里上传</p>
            <p className='text-sm text-gray-500'>支持批量上传和文件夹上传</p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className='mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold'>已上传图片 ({images.length})</h3>
            <div className='flex items-center gap-4 flex-wrap'>
              <div>
                <label htmlFor='format' className='mr-2 text-sm'>
                  输出格式:
                </label>
                <select
                  id='format'
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className='border rounded px-2 py-1 text-sm'
                >
                  <option value='original'>原始格式</option>
                  <option value='jpeg'>JPEG</option>
                  <option value='png'>PNG</option>
                  <option value='webp'>WebP</option>
                </select>
              </div>

              {outputFormat !== 'original' && outputFormat !== 'png' && (
                <div>
                  <label htmlFor='quality' className='mr-2 text-sm'>
                    压缩质量:
                  </label>
                  <select
                    id='quality'
                    value={compressionQuality}
                    onChange={(e) => setCompressionQuality(parseFloat(e.target.value))}
                    className='border rounded px-2 py-1 text-sm'
                  >
                    <option value='1'>100%</option>
                    <option value='0.9'>90%</option>
                    <option value='0.8'>80%</option>
                    <option value='0.7'>70%</option>
                    <option value='0.6'>60%</option>
                    <option value='0.5'>50%</option>
                  </select>
                </div>
              )}

              <div className='flex gap-2'>
                <button
                  onClick={handleDownloadAll}
                  disabled={loading}
                  className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400'
                >
                  {loading ? '处理中...' : '下载所有图片'}
                </button>

                <button onClick={handleRemoveAll} className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded'>
                  清空
                </button>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
            {images.map((image) => (
              <div key={image.id} className='border rounded-md overflow-hidden'>
                <div className='relative h-40'>
                  <img src={image.previewUrl} alt={image.name} className='w-full h-full object-contain' />
                  {image.editedBlob && <div className='absolute top-2 right-2 bg-green-500 text-white text-xs px-1 py-0.5 rounded'>已编辑</div>}
                </div>
                <div className='p-2'>
                  <p className='text-sm truncate' title={image.name}>
                    {image.name}
                  </p>
                  <div className='flex justify-between mt-2'>
                    <button onClick={() => handleEditImage(image)} className='text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded'>
                      编辑
                    </button>
                    <button onClick={() => handleRemoveImage(image.id)} className='text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded'>
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEditorOpen && selectedImage && <ImageCropEditor image={selectedImage} onClose={handleCloseEditor} onSave={handleSaveEdit} />}
    </div>
  );
};

export default ImageBatchEditor;
