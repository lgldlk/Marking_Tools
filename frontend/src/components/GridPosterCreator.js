import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableGridItem, PosterEditor } from './DraggablePosterElements';
import ErrorDisplay from './ErrorDisplay';

const GridPosterCreator = () => {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('VISION');
  const [subtitle, setSubtitle] = useState('视觉大模型');
  const [headerBgColor, setHeaderBgColor] = useState('#000000');
  const [footerBgColor, setFooterBgColor] = useState('#FF5722');
  const [footerText, setFooterText] = useState('HUI MENG DESIGN');
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [generatedPoster, setGeneratedPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [secondTitle, setSecondTitle] = useState('电商产品 FLUX');

  // 背景渐变色相关状态
  const [useGradientBg, setUseGradientBg] = useState(false);
  const [gradientStartColor, setGradientStartColor] = useState('#FF5722');
  const [gradientEndColor, setGradientEndColor] = useState('#2196F3');
  const [gradientDirection, setGradientDirection] = useState('to bottom'); // 默认从上到下渐变
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF'); // 纯色背景

  // New states for draggable elements
  const [posterElements, setPosterElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newElementType, setNewElementType] = useState('text');
  const [newElementContent, setNewElementContent] = useState('');
  const [editElementContent, setEditElementContent] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const canvasRef = useRef(null);

  // 页眉页脚位置调整
  const [headerTopMargin, setHeaderTopMargin] = useState(15);
  const [footerBottomMargin, setFooterBottomMargin] = useState(15);

  // Initialize poster elements with default positions
  useEffect(() => {
    if (editMode && posterElements.length === 0) {
      setPosterElements([
        { id: 'title', type: 'title', content: title, position: { x: 50, y: 45 } },
        { id: 'subtitle', type: 'subtitle', content: subtitle, position: { x: 50, y: 95 } },
        { id: 'secondTitle', type: 'subtitle', content: secondTitle, position: { x: 320, y: 55 } },
        { id: 'footerText', type: 'text', content: footerText, position: { x: 240, y: 805 } },
      ]);

      if (logoUrl) {
        setPosterElements((prev) => [...prev, { id: 'logo', type: 'logo', content: logoUrl, position: { x: 290, y: 25 } }]);
      }
    }
  }, [editMode, title, subtitle, secondTitle, footerText, logoUrl]);

  // Update element content when text inputs change
  useEffect(() => {
    if (posterElements.length > 0) {
      setPosterElements((prev) =>
        prev.map((el) => {
          if (el.id === 'title') return { ...el, content: title };
          if (el.id === 'subtitle') return { ...el, content: subtitle };
          if (el.id === 'secondTitle') return { ...el, content: secondTitle };
          if (el.id === 'footerText') return { ...el, content: footerText };
          if (el.id === 'logo' && logoUrl) return { ...el, content: logoUrl };
          return el;
        })
      );
    }
  }, [title, subtitle, secondTitle, footerText, logoUrl]);

  const handleElementMove = (id, newPosition) => {
    setPosterElements((prev) => prev.map((el) => (el.id === id ? { ...el, position: newPosition } : el)));
  };

  const handleElementSelect = (id) => {
    setSelectedElementId(id);
    const selectedElement = posterElements.find((el) => el.id === id);
    if (selectedElement) {
      setEditElementContent(selectedElement.content);
    }
  };

  const handleElementDelete = (id) => {
    setPosterElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedElementId(null);
    setEditElementContent('');
  };

  const updateSelectedElementContent = () => {
    if (selectedElementId && editElementContent.trim()) {
      setPosterElements((prev) => prev.map((el) => (el.id === selectedElementId ? { ...el, content: editElementContent } : el)));
    }
  };

  const addNewElement = () => {
    if (!newElementContent.trim()) {
      setError('请输入元素内容');
      return;
    }

    const newId = `element-${Date.now()}`;
    const newElement = {
      id: newId,
      type: newElementType,
      content: newElementContent,
      position: { x: 100, y: 200 },
    };

    setPosterElements((prev) => [...prev, newElement]);
    setNewElementContent('');
    setSelectedElementId(newId);
    setEditElementContent(newElementContent);
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
    },
    onDrop: (acceptedFiles) => {
      const newImages = [...images];

      acceptedFiles.forEach((file) => {
        if (newImages.length < 9) {
          newImages.push({
            file,
            preview: URL.createObjectURL(file),
          });
        }
      });

      setImages(newImages);
    },
  });

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);

      const img = new Image();
      img.src = url;
      img.onload = () => {
        setLogoImage(img);
      };
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const moveImage = (fromIndex, toIndex) => {
    if (toIndex >= 0 && toIndex < images.length) {
      const newImages = [...images];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      setImages(newImages);
    }
  };

  const generatePoster = async () => {
    if (images.length === 0) {
      setError('请上传至少一张图片');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a canvas to generate the poster
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions to 640x854 as specified
      const width = 640;
      const height = 854;
      canvas.width = width;
      canvas.height = height;

      // Draw background for the entire poster
      if (useGradientBg) {
        // 创建渐变背景
        let gradient;

        switch (gradientDirection) {
          case 'to right':
            gradient = ctx.createLinearGradient(0, 0, width, 0);
            break;
          case 'to bottom right':
            gradient = ctx.createLinearGradient(0, 0, width, height);
            break;
          case 'to bottom left':
            gradient = ctx.createLinearGradient(width, 0, 0, height);
            break;
          default: // to bottom (默认)
            gradient = ctx.createLinearGradient(0, 0, 0, height);
        }

        gradient.addColorStop(0, gradientStartColor);
        gradient.addColorStop(1, gradientEndColor);

        ctx.fillStyle = gradient;
      } else {
        // 使用纯色背景
        ctx.fillStyle = backgroundColor;
      }

      ctx.fillRect(0, 0, width, height);

      // 增加页眉与顶部的距离
      const headerHeight = 110; // 原来是100
      ctx.fillStyle = headerBgColor;
      roundRect(ctx, 0, headerTopMargin, width, headerHeight, 15, true, false);

      // 增加页脚与底部的距离
      const footerHeight = 60; // 原来是50
      ctx.fillStyle = footerBgColor;
      roundRect(ctx, 0, height - footerHeight - footerBottomMargin, width, footerHeight, 15, true, false);

      // Draw images in a grid with gaps
      const gridSize = 3;
      const gridPadding = 20; // 增加左右边距
      const gridGap = 12; // 增加图片之间的间隙
      const gridAreaWidth = width - gridPadding * 2; // 九宫格区域宽度
      const cellWidth = (gridAreaWidth - gridGap * (gridSize - 1)) / gridSize; // 单元格宽度
      const cellHeight = cellWidth; // 单元格高度
      const gridStartY = headerHeight + headerTopMargin + 20; // 九宫格顶部位置，增加与页眉的间距
      const gridHeight = cellHeight * gridSize + gridGap * (gridSize - 1); // 九宫格高度
      const bottomMargin = 30; // 九宫格与页脚的距离

      // 确保九宫格高度合适，避免与页脚重叠
      const availableHeight =
        height - headerHeight - headerTopMargin - footerHeight - footerBottomMargin - gridStartY + headerHeight + headerTopMargin - bottomMargin;
      const adjustedCellHeight = Math.min(cellHeight, availableHeight / (gridSize + (gridSize - 1) * (gridGap / cellHeight)));

      // Draw images with gaps
      for (let i = 0; i < Math.min(images.length, 9); i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;

        const x = gridPadding + col * (cellWidth + gridGap);
        const y = gridStartY + row * (adjustedCellHeight + gridGap);

        const img = new Image();
        img.src = images[i].preview;

        // Wait for the image to load before drawing it
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Draw the image to fill the cell completely (may crop the image)
        ctx.drawImage(img, x, y, cellWidth, adjustedCellHeight);
      }

      // If in edit mode, use custom element positions
      if (editMode && posterElements.length > 0) {
        // Reset text alignment for custom positioned elements
        ctx.textAlign = 'left';

        // Draw custom positioned elements
        for (const element of posterElements) {
          const { type, content, position } = element;

          ctx.save();

          switch (type) {
            case 'title':
              ctx.fillStyle = element.color || '#FFFFFF';
              ctx.font = `bold ${element.fontSize || 48}px Arial, sans-serif`;
              ctx.fillText(content, position.x, position.y + (element.fontSize || 48)); // Add font size to y position for baseline
              break;
            case 'subtitle':
              ctx.fillStyle = element.color || '#FFFFFF';
              ctx.font = `bold ${element.fontSize || 24}px Arial, sans-serif`;
              ctx.fillText(content, position.x, position.y + (element.fontSize || 24)); // Add font size to y position for baseline
              break;
            case 'text':
              ctx.fillStyle = element.color || '#FFFFFF';
              ctx.font = `bold ${element.fontSize || 18}px Arial, sans-serif`;
              ctx.fillText(content, position.x, position.y + (element.fontSize || 18)); // Add font size to y position for baseline
              break;
            case 'logo':
              if (logoImage) {
                const logoSize = 60;
                ctx.drawImage(logoImage, position.x, position.y, logoSize, logoSize);
              }
              break;
            case 'color-block':
              ctx.fillStyle = element.backgroundColor || '#FF5722';
              ctx.fillRect(position.x, position.y, element.width || 100, element.height || 100);
              break;
            case 'image':
              if (content) {
                const img = new Image();
                img.src = content;

                // Wait for the image to load before drawing it
                await new Promise((resolve) => {
                  img.onload = resolve;
                });

                ctx.drawImage(img, position.x, position.y, element.width || 150, element.height || 150);
              }
              break;
            default:
              break;
          }

          ctx.restore();
        }
      } else {
        // Use the original layout for logo, title and footer text

        // Draw logo if available
        if (logoImage) {
          const logoSize = 60;
          const logoX = width / 2 - logoSize / 2;
          const logoY = headerTopMargin - 10; // Position logo at the top, partially outside the header
          ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
        }

        // Draw title - make it centered
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 90px Arial, sans-serif';
        ctx.textAlign = 'center'; // Changed from 'left' to 'center'
        ctx.fillText(title, width / 2 - 100, headerTopMargin + 75); // Centered horizontally

        // Draw second title line (电商产品 FLUX)
        ctx.font = 'bold 30px Arial, sans-serif';
        ctx.textAlign = 'center'; // Changed from 'left' to 'center'
        ctx.fillText(secondTitle, width / 2 + 100, headerTopMargin + 75); // Positioned next to the main title

        // Draw footer text - make it more prominent
        const footerY = height - footerHeight - footerBottomMargin;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(footerText, width / 2, footerY + 38); // 调整垂直位置，使其在页脚中居中
      }

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setGeneratedPoster(dataUrl);
    } catch (err) {
      setError('生成海报时出错: ' + err.message);
      console.error('Poster generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to draw rounded rectangles
  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }

  const downloadPoster = () => {
    if (!generatedPoster) {
      setError('没有可下载的海报');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = generatedPoster;
      link.download = `grid-poster-${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('下载海报时出错: ' + err.message);
      console.error('Poster download error:', err);
    }
  };

  // 添加预览功能
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      // 进入预览模式时，取消选中的元素
      setSelectedElementId(null);
    }
  };

  // 处理元素属性变更
  const handleElementPropertyChange = (id, property, value) => {
    setPosterElements((prev) => prev.map((el) => (el.id === id ? { ...el, [property]: value } : el)));
  };

  // 添加色块元素
  const addColorBlock = () => {
    const newId = `color-block-${Date.now()}`;
    const newElement = {
      id: newId,
      type: 'color-block',
      content: '',
      position: { x: 100, y: 200 },
      backgroundColor: '#FF5722',
      width: 100,
      height: 100,
    };

    setPosterElements((prev) => [...prev, newElement]);
    setSelectedElementId(newId);
  };

  // 添加自定义图片元素
  const addImageElement = (file) => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    const newId = `image-${Date.now()}`;
    const newElement = {
      id: newId,
      type: 'image',
      content: url,
      position: { x: 100, y: 200 },
      width: 150,
      height: 150,
    };

    setPosterElements((prev) => [...prev, newElement]);
    setSelectedElementId(newId);
  };

  const handleImageElementUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      addImageElement(file);
    }
  };

  // 处理页眉位置变化
  const handleHeaderPositionChange = (newTop) => {
    setHeaderTopMargin(newTop);
  };

  // 处理页脚位置变化
  const handleFooterPositionChange = (newBottom) => {
    setFooterBottomMargin(newBottom);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className='grid-poster-creator'>
        <ErrorDisplay error={error} />

        <div className='mb-6'>
          <h2 className='text-xl font-bold mb-2'>上传图片（最多9张）</h2>
          <p className='text-gray-600 mb-4'>上传产品图片以创建九宫格海报</p>

          <div
            {...getRootProps({
              className:
                'dropzone border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors',
            })}
          >
            <input {...getInputProps()} />
            <p>拖放图片到此处，或点击上传</p>
            <p className='text-sm text-gray-500 mt-2'>已上传 {images.length}/9 张图片</p>
          </div>
        </div>

        {images.length > 0 && (
          <div className='mb-6'>
            <h2 className='text-xl font-bold mb-2'>图片排序</h2>
            <p className='text-gray-600 mb-4'>拖动调整顺序，点击删除图片</p>

            <div className='grid grid-cols-3 gap-4'>
              {images.map((image, index) => (
                <DraggableGridItem key={index} image={image} index={index} moveImage={moveImage} removeImage={removeImage} />
              ))}

              {Array.from({ length: 9 - images.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className='border border-gray-300 border-dashed rounded-lg aspect-square flex items-center justify-center text-gray-400'
                >
                  空
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='mb-6'>
          <h2 className='text-xl font-bold mb-2'>海报设置</h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Toggle for edit mode */}
            <div className='col-span-1 md:col-span-2 mb-4'>
              <div className='flex items-center'>
                <input type='checkbox' id='editMode' checked={editMode} onChange={(e) => setEditMode(e.target.checked)} className='mr-2 h-4 w-4' />
                <label htmlFor='editMode' className='font-medium'>
                  启用高级编辑模式（可拖拽调整元素位置）
                </label>
              </div>
            </div>

            {/* Show editor UI when edit mode is enabled */}
            {editMode && (
              <div className='col-span-1 md:col-span-2 mb-6'>
                <h3 className='text-lg font-bold mb-3'>海报编辑器</h3>
                <p className='text-gray-600 mb-4'>拖动元素调整位置，点击元素进行编辑</p>

                <div className='flex justify-end mb-2'>
                  <button
                    onClick={togglePreviewMode}
                    className={`px-3 py-1 rounded-md text-sm ${previewMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {previewMode ? '退出预览' : '预览模式'}
                  </button>
                </div>

                <div className='flex justify-center mb-4'>
                  <PosterEditor
                    elements={posterElements}
                    onElementMove={handleElementMove}
                    onElementSelect={previewMode ? () => {} : handleElementSelect}
                    onElementDelete={handleElementDelete}
                    onElementPropertyChange={handleElementPropertyChange}
                    selectedElementId={previewMode ? null : selectedElementId}
                    headerBgColor={headerBgColor}
                    footerBgColor={footerBgColor}
                    useGradientBg={useGradientBg}
                    gradientStartColor={gradientStartColor}
                    gradientEndColor={gradientEndColor}
                    gradientDirection={gradientDirection}
                    backgroundColor={backgroundColor}
                    previewMode={previewMode}
                    images={previewMode ? images : []}
                    headerTopMargin={headerTopMargin}
                    footerBottomMargin={footerBottomMargin}
                    onHeaderPositionChange={handleHeaderPositionChange}
                    onFooterPositionChange={handleFooterPositionChange}
                  />
                </div>

                {/* 在预览模式下隐藏编辑控件 */}
                {!previewMode && (
                  <>
                    {/* Add new element controls */}
                    <div className='mt-4 p-4 border border-gray-300 rounded-lg'>
                      <h4 className='font-medium mb-2'>添加新元素</h4>
                      <div className='flex flex-wrap gap-3'>
                        <div className='w-full md:w-1/3'>
                          <label className='block mb-1 text-sm'>元素类型</label>
                          <select
                            value={newElementType}
                            onChange={(e) => setNewElementType(e.target.value)}
                            className='w-full px-3 py-2 border border-gray-300 rounded-md'
                          >
                            <option value='text'>文本</option>
                            <option value='title'>标题</option>
                            <option value='subtitle'>副标题</option>
                          </select>
                        </div>

                        <div className='w-full md:w-1/2'>
                          <label className='block mb-1 text-sm'>元素内容</label>
                          <input
                            type='text'
                            value={newElementContent}
                            onChange={(e) => setNewElementContent(e.target.value)}
                            className='w-full px-3 py-2 border border-gray-300 rounded-md'
                            placeholder='输入元素内容'
                          />
                        </div>

                        <div className='flex items-end'>
                          <button onClick={addNewElement} className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
                            添加
                          </button>
                        </div>
                      </div>

                      <div className='mt-4 flex flex-wrap gap-3'>
                        <div>
                          <button
                            onClick={addColorBlock}
                            className='px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center'
                          >
                            <span className='mr-1'>添加色块</span>
                            <div className='w-4 h-4 bg-white'></div>
                          </button>
                        </div>

                        <div>
                          <label className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer flex items-center'>
                            <span className='mr-1'>添加图片</span>
                            <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' viewBox='0 0 16 16'>
                              <path d='M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z' />
                              <path d='M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z' />
                            </svg>
                            <input type='file' accept='image/*' onChange={handleImageElementUpload} className='hidden' />
                          </label>
                        </div>
                      </div>
                    </div>

                    {selectedElementId && (
                      <div className='mt-4 p-4 border border-gray-300 rounded-lg'>
                        <h4 className='font-medium mb-2'>编辑选中元素</h4>
                        <div className='text-sm text-gray-600 mb-2'>
                          当前选中: {posterElements.find((el) => el.id === selectedElementId)?.type} -
                          {posterElements.find((el) => el.id === selectedElementId)?.content}
                        </div>

                        <div className='flex flex-wrap gap-3 mb-3'>
                          <div className='w-full md:w-2/3'>
                            <label className='block mb-1 text-sm'>修改内容</label>
                            <input
                              type='text'
                              value={editElementContent}
                              onChange={(e) => setEditElementContent(e.target.value)}
                              className='w-full px-3 py-2 border border-gray-300 rounded-md'
                            />
                          </div>

                          <div className='flex items-end'>
                            <button
                              onClick={updateSelectedElementContent}
                              className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
                            >
                              更新内容
                            </button>
                          </div>
                        </div>

                        <div className='flex justify-between'>
                          <button
                            onClick={() => handleElementDelete(selectedElementId)}
                            className='px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm'
                          >
                            删除元素
                          </button>

                          <button
                            onClick={() => setSelectedElementId(null)}
                            className='px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm'
                          >
                            取消选择
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div>
              <label className='block mb-2 font-medium'>主标题</label>
              <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='输入主标题'
              />
            </div>

            <div>
              <label className='block mb-2 font-medium'>副标题</label>
              <input
                type='text'
                value={secondTitle}
                onChange={(e) => setSecondTitle(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='输入副标题'
              />
            </div>

            {/* 背景设置区域 */}
            <div className='col-span-1 md:col-span-2 border-t pt-4 mt-2'>
              <h3 className='text-lg font-bold mb-3'>背景设置</h3>

              <div className='flex items-center mb-4'>
                <input
                  type='checkbox'
                  id='useGradient'
                  checked={useGradientBg}
                  onChange={(e) => setUseGradientBg(e.target.checked)}
                  className='mr-2 h-4 w-4'
                />
                <label htmlFor='useGradient' className='font-medium'>
                  使用渐变背景
                </label>
              </div>

              {useGradientBg ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                  <div>
                    <label className='block mb-2 font-medium'>渐变起始颜色</label>
                    <div className='flex items-center'>
                      <input
                        type='color'
                        value={gradientStartColor}
                        onChange={(e) => setGradientStartColor(e.target.value)}
                        className='w-10 h-10 border-0'
                      />
                      <input
                        type='text'
                        value={gradientStartColor}
                        onChange={(e) => setGradientStartColor(e.target.value)}
                        className='ml-2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block mb-2 font-medium'>渐变结束颜色</label>
                    <div className='flex items-center'>
                      <input
                        type='color'
                        value={gradientEndColor}
                        onChange={(e) => setGradientEndColor(e.target.value)}
                        className='w-10 h-10 border-0'
                      />
                      <input
                        type='text'
                        value={gradientEndColor}
                        onChange={(e) => setGradientEndColor(e.target.value)}
                        className='ml-2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  </div>

                  <div className='col-span-1 md:col-span-2'>
                    <label className='block mb-2 font-medium'>渐变方向</label>
                    <select
                      value={gradientDirection}
                      onChange={(e) => setGradientDirection(e.target.value)}
                      className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='to bottom'>从上到下</option>
                      <option value='to right'>从左到右</option>
                      <option value='to bottom right'>左上到右下</option>
                      <option value='to bottom left'>右上到左下</option>
                    </select>
                  </div>

                  <div className='col-span-1 md:col-span-2'>
                    <div
                      className='h-12 w-full rounded-md border border-gray-300'
                      style={{
                        background: `linear-gradient(${gradientDirection}, ${gradientStartColor}, ${gradientEndColor})`,
                      }}
                    >
                      <div className='h-full w-full flex items-center justify-center text-white text-shadow'>渐变预览</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='mb-4'>
                  <label className='block mb-2 font-medium'>背景颜色</label>
                  <div className='flex items-center'>
                    <input type='color' value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className='w-10 h-10 border-0' />
                    <input
                      type='text'
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className='ml-2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className='block mb-2 font-medium'>页眉背景色</label>
              <div className='flex items-center'>
                <input type='color' value={headerBgColor} onChange={(e) => setHeaderBgColor(e.target.value)} className='w-10 h-10 border-0' />
                <input
                  type='text'
                  value={headerBgColor}
                  onChange={(e) => setHeaderBgColor(e.target.value)}
                  className='ml-2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            <div>
              <label className='block mb-2 font-medium'>页眉位置调整</label>
              <div className='flex items-center'>
                <input
                  type='range'
                  min='0'
                  max='50'
                  value={headerTopMargin}
                  onChange={(e) => setHeaderTopMargin(parseInt(e.target.value))}
                  className='w-full'
                />
                <span className='ml-2 text-sm'>{headerTopMargin}px</span>
              </div>
            </div>

            <div>
              <label className='block mb-2 font-medium'>页脚背景色</label>
              <div className='flex items-center'>
                <input type='color' value={footerBgColor} onChange={(e) => setFooterBgColor(e.target.value)} className='w-10 h-10 border-0' />
                <input
                  type='text'
                  value={footerBgColor}
                  onChange={(e) => setFooterBgColor(e.target.value)}
                  className='ml-2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            <div>
              <label className='block mb-2 font-medium'>页脚位置调整</label>
              <div className='flex items-center'>
                <input
                  type='range'
                  min='0'
                  max='50'
                  value={footerBottomMargin}
                  onChange={(e) => setFooterBottomMargin(parseInt(e.target.value))}
                  className='w-full'
                />
                <span className='ml-2 text-sm'>{footerBottomMargin}px</span>
              </div>
            </div>

            <div>
              <label className='block mb-2 font-medium'>页脚文字</label>
              <input
                type='text'
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='输入页脚文字'
              />
            </div>

            <div>
              <label className='block mb-2 font-medium'>Logo上传（可选）</label>
              <input type='file' accept='image/*' onChange={handleLogoUpload} className='w-full' />
              {logoUrl && (
                <div className='mt-2 border border-gray-300 rounded-lg p-2 w-20 h-20'>
                  <img src={logoUrl} alt='Logo' className='w-full h-full object-contain' />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='flex justify-center space-x-4 mb-6'>
          <button
            onClick={generatePoster}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium ${
              loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? '生成中...' : '生成海报'}
          </button>
        </div>

        {generatedPoster && (
          <div className='mb-6'>
            <h2 className='text-xl font-bold mb-2'>生成结果</h2>
            <div className='border border-gray-300 rounded-lg overflow-hidden bg-white p-4 flex justify-center'>
              <img src={generatedPoster} alt='Generated Poster' className='max-w-full h-auto shadow-lg' style={{ maxHeight: '80vh' }} />
            </div>

            <div className='flex justify-center mt-4'>
              <button onClick={downloadPoster} className='bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg'>
                下载海报
              </button>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default GridPosterCreator;
