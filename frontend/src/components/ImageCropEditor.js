import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ImageCropEditor = ({ image, onClose, onSave }) => {
  const [crop, setCrop] = useState();
  const [aspect, setAspect] = useState(undefined);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    if (!crop) {
      setCrop(centerAspectCrop(width, height, aspect));
    }
  };

  const handleToggleAspect = () => {
    if (aspect) {
      setAspect(undefined);
    } else {
      setAspect(1);
    }
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspect));
    } else {
      setCrop(undefined);
    }
    setRotation(0);
    setScale(1);
  };

  const generateCroppedImage = () => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    if (rotation % 180 === 0) {
      canvas.width = cropWidth;
      canvas.height = cropHeight;
    } else {
      canvas.width = cropHeight;
      canvas.height = cropWidth;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    let drawX, drawY;
    if (rotation % 180 === 0) {
      drawX = -cropWidth / 2;
      drawY = -cropHeight / 2;
    } else {
      drawX = -cropHeight / 2;
      drawY = -cropWidth / 2;
    }

    ctx.drawImage(imgRef.current, completedCrop.x * scaleX, completedCrop.y * scaleY, cropWidth, cropHeight, drawX, drawY, cropWidth, cropHeight);

    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }

        onSave(blob, {
          crop: completedCrop,
          rotation,
          scale,
        });
      },
      'image/jpeg',
      1
    );
  };

  const handleSave = () => {
    generateCroppedImage();
  };

  useEffect(() => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const image = imgRef.current;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      if (rotation % 180 === 0) {
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
      } else {
        canvas.width = completedCrop.height;
        canvas.height = completedCrop.width;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      let drawX, drawY;
      if (rotation % 180 === 0) {
        drawX = -completedCrop.width / 2;
        drawY = -completedCrop.height / 2;
      } else {
        drawX = -completedCrop.height / 2;
        drawY = -completedCrop.width / 2;
      }

      ctx.drawImage(
        image,
        completedCrop.x,
        completedCrop.y,
        completedCrop.width,
        completedCrop.height,
        drawX,
        drawY,
        completedCrop.width,
        completedCrop.height
      );

      ctx.restore();
    }
  }, [completedCrop, rotation, scale]);

  return (
    <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-xl font-bold'>编辑图片: {image.name}</h3>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
            ✕
          </button>
        </div>

        <div className='flex flex-col md:flex-row gap-6'>
          <div className='flex-1 overflow-auto'>
            <div className='mb-4 flex flex-wrap gap-2'>
              <button onClick={handleToggleAspect} className={`px-3 py-1 text-sm rounded ${aspect ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                {aspect ? '自由比例' : '1:1 比例'}
              </button>
              <button onClick={handleRotateLeft} className='px-3 py-1 text-sm bg-gray-200 rounded'>
                向左旋转
              </button>
              <button onClick={handleRotateRight} className='px-3 py-1 text-sm bg-gray-200 rounded'>
                向右旋转
              </button>
              <div className='flex items-center'>
                <span className='text-sm mr-2'>缩放:</span>
                <input type='range' min='0.5' max='2' step='0.1' value={scale} onChange={(e) => setScale(Number(e.target.value))} className='w-24' />
                <span className='text-sm ml-1'>{scale.toFixed(1)}x</span>
              </div>
              <button onClick={handleReset} className='px-3 py-1 text-sm bg-gray-200 rounded'>
                重置
              </button>
            </div>

            <div className='relative border overflow-hidden'>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                minWidth={20}
                minHeight={20}
                circularCrop={false}
              >
                <img
                  ref={imgRef}
                  alt={image.name}
                  src={image.previewUrl}
                  onLoad={onImageLoad}
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    maxWidth: '100%',
                    maxHeight: '70vh',
                  }}
                />
              </ReactCrop>
            </div>
          </div>

          {completedCrop && (
            <div className='w-full md:w-64'>
              <h4 className='text-sm font-medium mb-2'>预览</h4>
              <div className='border p-2'>
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className='mt-6 flex justify-end gap-2'>
          <button onClick={onClose} className='px-4 py-2 border rounded hover:bg-gray-100'>
            取消
          </button>
          <button onClick={handleSave} className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600' disabled={!completedCrop}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropEditor;
