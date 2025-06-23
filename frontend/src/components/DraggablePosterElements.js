import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';

// Draggable poster element component
export const DraggablePosterElement = ({
  id,
  type,
  content,
  position,
  onMove,
  onSelect,
  isSelected,
  onDelete,
  previewMode,
  fontSize,
  color,
  backgroundColor,
  width,
  height,
  onPropertyChange,
}) => {
  const ref = useRef(null);
  // 添加鼠标事件状态
  const [isDraggingManual, setIsDraggingManual] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  // 添加调整大小状态
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartDimensions, setResizeStartDimensions] = useState({ width: 0, height: 0 });

  const [{ isDragging }, drag] = useDrag({
    type: 'POSTER_ELEMENT',
    item: () => ({ id, type, initialPosition: position }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !previewMode,
    options: {
      // 将拖拽检测阈值设置为最小值，确保任何移动都能被检测到
      dragDistance: 0,
    },
    end: (item, monitor) => {
      // 如果在预览模式，则不处理
      if (previewMode) {
        return;
      }

      // 获取拖拽距离
      const delta = monitor.getDifferenceFromInitialOffset();

      // 无论移动距离多小，都应该处理位置变化
      if (delta) {
        const newX = Math.round(position.x + delta.x);
        const newY = Math.round(position.y + delta.y);

        // 使用requestAnimationFrame确保位置更新在下一帧执行，避免与其他UI更新冲突
        requestAnimationFrame(() => {
          onMove(id, { x: newX, y: newY });
        });
      }
    },
  });

  // 处理属性变更
  const handlePropertyChange = (property, value) => {
    if (onPropertyChange) {
      onPropertyChange(id, property, value);
    }
  };

  // 处理调整大小的鼠标事件
  const handleResizeStart = useCallback(
    (e) => {
      if (previewMode) return;

      e.stopPropagation();
      e.preventDefault();

      setIsResizing(true);
      setResizeStartPos({ x: e.clientX, y: e.clientY });
      setResizeStartDimensions({ width: width || 100, height: height || 100 });

      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    },
    [previewMode, width, height]
  );

  const handleResizeMove = useCallback(
    (e) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStartPos.x;
      const deltaY = e.clientY - resizeStartPos.y;

      const newWidth = Math.max(20, resizeStartDimensions.width + deltaX);
      const newHeight = Math.max(20, resizeStartDimensions.height + deltaY);

      if (ref.current) {
        if (type === 'color-block' || type === 'image') {
          ref.current.style.width = `${newWidth}px`;
          ref.current.style.height = `${newHeight}px`;
        }
      }

      handlePropertyChange('width', newWidth);
      handlePropertyChange('height', newHeight);
    },
    [isResizing, resizeStartPos, resizeStartDimensions, type, handlePropertyChange]
  );

  const handleResizeEnd = useCallback(
    (e) => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    },
    [handleResizeMove]
  );

  // 使用useCallback包装事件处理函数，确保它们不会随渲染改变
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDraggingManual) return;

      // 计算移动距离
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      // 实时更新元素位置
      if (ref.current) {
        ref.current.style.transform = `translate(${position.x + deltaX}px, ${position.y + deltaY}px)`;
      }

      // 更新当前位置状态
      setCurrentPos({
        x: position.x + deltaX,
        y: position.y + deltaY,
      });
    },
    [isDraggingManual, startPos, position]
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (!isDraggingManual) return;

      // 移除事件监听
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // 计算最终位置
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      // 即使是非常小的移动也应该被处理
      // 这里我们不设置阈值，任何移动都会触发更新
      onMove(id, {
        x: position.x + deltaX,
        y: position.y + deltaY,
      });

      setIsDraggingManual(false);
    },
    [isDraggingManual, startPos, position, onMove, id, handleMouseMove]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (previewMode) return;

      // 阻止事件冒泡，避免触发其他事件
      e.stopPropagation();

      // 如果点击了元素但没有选中，先选中它
      if (!isSelected) {
        onSelect(id);
        return;
      }

      // 记录起始位置
      setIsDraggingManual(true);
      setStartPos({
        x: e.clientX,
        y: e.clientY,
      });

      // 添加全局鼠标事件监听
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [previewMode, isSelected, handleMouseMove, handleMouseUp, onSelect, id]
  );

  // 添加直接拖拽功能
  const handleDirectDrag = useCallback(
    (e) => {
      // 如果不是选中状态或在预览模式，则不处理
      if (!isSelected || previewMode) return;

      // 阻止默认行为和事件冒泡
      e.preventDefault();
      e.stopPropagation();

      // 记录起始位置
      const startX = e.clientX;
      const startY = e.clientY;
      const originalX = position.x;
      const originalY = position.y;

      // 创建临时的移动和释放事件处理函数
      const handleTempMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        // 实时更新元素位置
        if (ref.current) {
          ref.current.style.transform = `translate(${originalX + deltaX}px, ${originalY + deltaY}px)`;
        }
      };

      const handleTempUp = (upEvent) => {
        // 移除临时事件监听
        document.removeEventListener('mousemove', handleTempMove);
        document.removeEventListener('mouseup', handleTempUp);

        // 计算最终位置
        const deltaX = upEvent.clientX - startX;
        const deltaY = upEvent.clientY - startY;

        // 无论移动距离多小，都更新位置
        onMove(id, {
          x: originalX + deltaX,
          y: originalY + deltaY,
        });
      };

      // 添加临时事件监听
      document.addEventListener('mousemove', handleTempMove);
      document.addEventListener('mouseup', handleTempUp);
    },
    [isSelected, previewMode, position, onMove, id]
  );

  const [{ isOver }, drop] = useDrop({
    accept: 'POSTER_ELEMENT',
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
    canDrop: () => !previewMode,
    hover(item, monitor) {
      if (item.id === id || previewMode) {
        return;
      }

      // Calculate position
      const draggedOffset = monitor.getClientOffset();
      if (draggedOffset && ref.current) {
        const targetRect = ref.current.getBoundingClientRect();
        const targetCenter = {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top + targetRect.height / 2,
        };

        // If we're hovering close to this element, we can implement
        // snapping or other positioning logic here
      }
    },
  });

  // Initialize drag and drop refs
  const dragDropRef = previewMode ? ref : drag(drop(ref));

  useEffect(() => {
    // 确保元素位置更新更加精确
    if (ref.current) {
      ref.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, [position.x, position.y]);

  // 清理事件监听器
  useEffect(() => {
    // 不需要在这里清理事件监听器，因为它们在handleUp函数中已经被清理
    return () => {};
  }, []);

  // 更新位置
  useEffect(() => {
    if (ref.current) {
      ref.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, [position.x, position.y]);

  // 添加键盘方向键控制
  useEffect(() => {
    if (!isSelected || previewMode) return;

    const handleKeyDown = (e) => {
      // 只有当元素被选中时才处理键盘事件
      if (!isSelected) return;

      // 阻止默认行为，避免页面滚动
      e.preventDefault();

      let deltaX = 0;
      let deltaY = 0;

      // 根据按键调整位置
      switch (e.key) {
        case 'ArrowUp':
          deltaY = -1;
          break;
        case 'ArrowDown':
          deltaY = 1;
          break;
        case 'ArrowLeft':
          deltaX = -1;
          break;
        case 'ArrowRight':
          deltaX = 1;
          break;
        default:
          return; // 如果不是方向键，不处理
      }

      // 如果按住Shift键，增加移动距离
      if (e.shiftKey) {
        deltaX *= 10;
        deltaY *= 10;
      }

      // 更新元素位置
      onMove(id, {
        x: position.x + deltaX,
        y: position.y + deltaY,
      });
    };

    // 添加键盘事件监听
    window.addEventListener('keydown', handleKeyDown);

    // 清理事件监听
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelected, previewMode, position, onMove, id]);

  // 设置不同类型元素的样式，与生成的海报一致
  let elementStyle = {};
  let elementContent;

  switch (type) {
    case 'title':
      elementStyle = {
        color: color || '#FFFFFF',
        fontSize: `${fontSize || 48}px`,
        lineHeight: '1.2',
      };
      elementContent = (
        <h2 className='font-bold' style={elementStyle}>
          {content}
        </h2>
      );
      break;
    case 'subtitle':
      elementStyle = {
        color: color || '#FFFFFF',
        fontSize: `${fontSize || 24}px`,
        lineHeight: '1.2',
      };
      elementContent = <h3 style={elementStyle}>{content}</h3>;
      break;
    case 'text':
      elementStyle = {
        color: color || '#FFFFFF',
        fontSize: `${fontSize || 18}px`,
        lineHeight: '1.2',
      };
      elementContent = <p style={elementStyle}>{content}</p>;
      break;
    case 'logo':
      elementContent = <img src={content} alt='Logo' className='w-[60px] h-[60px] object-contain' />;
      break;
    case 'color-block':
      elementStyle = {
        backgroundColor: backgroundColor || '#FF5722',
        width: `${width || 100}px`,
        height: `${height || 100}px`,
      };
      elementContent = <div style={elementStyle}></div>;
      break;
    case 'image':
      elementStyle = {
        width: `${width || 100}px`,
        height: `${height || 100}px`,
      };
      elementContent = (
        <img
          src={content}
          alt='Custom Image'
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      );
      break;
    default:
      elementContent = <span className='text-white'>{content}</span>;
  }

  return (
    <div
      ref={dragDropRef}
      className={`absolute ${!previewMode ? 'cursor-move' : ''} ${isDragging || isDraggingManual ? 'opacity-50' : ''} ${
        isSelected && !previewMode ? 'ring-2 ring-blue-500' : ''
      } ${isOver ? 'z-20' : ''}`}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: isSelected && !previewMode ? 10 : 3,
        padding: previewMode ? '0px' : '2px',
        borderRadius: '4px',
        backgroundColor: isSelected && !previewMode ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        ...elementStyle,
        touchAction: 'none', // 防止触摸事件被浏览器处理
        userSelect: 'none', // 防止文本选择
      }}
      onClick={(e) => {
        if (!previewMode) {
          e.stopPropagation();
          onSelect(id);
        }
      }}
      onMouseDown={handleMouseDown}
      onDragStart={(e) => {
        // 阻止默认拖拽行为
        e.preventDefault();
        e.stopPropagation();
        handleDirectDrag(e);
      }}
      draggable={isSelected && !previewMode}
    >
      {/* 添加一个拖拽手柄，使拖拽更直观 */}
      {isSelected && !previewMode && (
        <div
          className='absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-500 rounded-full cursor-move flex items-center justify-center'
          onMouseDown={handleDirectDrag}
        >
          <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2'>
            <path d='M7 10l5 5 5-5'></path>
          </svg>
        </div>
      )}

      {elementContent}

      {/* 添加调整大小的控制点 */}
      {isSelected && !previewMode && (type === 'color-block' || type === 'image') && (
        <div className='absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize' onMouseDown={handleResizeStart}></div>
      )}

      {/* 控制面板 */}
      {isSelected && !previewMode && (
        <>
          <div className='absolute -top-6 right-0 flex space-x-1'>
            <button
              className='bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center'
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(id);
              }}
            >
              ×
            </button>
          </div>

          {/* 属性控制面板 */}
          <div className='absolute -bottom-20 left-0 bg-white shadow-lg rounded p-2 z-20 flex flex-wrap gap-2 w-64'>
            {/* 文字元素控制 */}
            {(type === 'title' || type === 'subtitle' || type === 'text') && (
              <>
                <div className='flex items-center'>
                  <label className='text-xs mr-1'>字号:</label>
                  <input
                    type='number'
                    className='w-12 p-0.5 border border-gray-300 rounded text-xs'
                    value={fontSize || (type === 'title' ? 48 : type === 'subtitle' ? 24 : 18)}
                    onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value, 10))}
                    min={8}
                    max={120}
                  />
                </div>
                <div className='flex items-center'>
                  <label className='text-xs mr-1'>颜色:</label>
                  <input
                    type='color'
                    className='w-6 h-6 p-0 border-0'
                    value={color || '#FFFFFF'}
                    onChange={(e) => handlePropertyChange('color', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* 色块控制 */}
            {type === 'color-block' && (
              <>
                <div className='flex items-center'>
                  <label className='text-xs mr-1'>颜色:</label>
                  <input
                    type='color'
                    className='w-6 h-6 p-0 border-0'
                    value={backgroundColor || '#FF5722'}
                    onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                  />
                </div>
                <div className='flex items-center'>
                  <label className='text-xs mr-1'>宽度:</label>
                  <input
                    type='number'
                    className='w-12 p-0.5 border border-gray-300 rounded text-xs'
                    value={width || 100}
                    onChange={(e) => handlePropertyChange('width', parseInt(e.target.value, 10))}
                    min={10}
                    max={600}
                  />
                </div>
                <div className='flex items-center'>
                  <label className='text-xs mr-1'>高度:</label>
                  <input
                    type='number'
                    className='w-12 p-0.5 border border-gray-300 rounded text-xs'
                    value={height || 100}
                    onChange={(e) => handlePropertyChange('height', parseInt(e.target.value, 10))}
                    min={10}
                    max={800}
                  />
                </div>
              </>
            )}

            {/* 图片控制 */}
            {type === 'image' && (
              <>
                <div className='flex items-center'>
                  <label className='text-xs mr-1'>宽度:</label>
                  <input
                    type='number'
                    className='w-12 p-0.5 border border-gray-300 rounded text-xs'
                    value={width || 100}
                    onChange={(e) => handlePropertyChange('width', parseInt(e.target.value, 10))}
                    min={10}
                    max={600}
                  />
                </div>
                <div className='flex items-center'>
                  <label className='text-xs mr-1'>高度:</label>
                  <input
                    type='number'
                    className='w-12 p-0.5 border border-gray-300 rounded text-xs'
                    value={height || 100}
                    onChange={(e) => handlePropertyChange('height', parseInt(e.target.value, 10))}
                    min={10}
                    max={800}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Draggable grid item component
export const DraggableGridItem = ({ image, index, moveImage, removeImage }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'GRID_ITEM',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'GRID_ITEM',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveImage(draggedItem.index, index);
        // Update the index of the dragged item to avoid flickering
        draggedItem.index = index;
      }
    },
  });

  // Initialize drag and drop refs
  drag(drop(ref));

  return (
    <div ref={ref} className={`relative border border-gray-300 rounded-lg overflow-hidden aspect-square ${isDragging ? 'opacity-50' : ''}`}>
      <img src={image.preview} alt={`Grid image ${index + 1}`} className='w-full h-full object-cover' />

      <div className='absolute inset-0 opacity-0 hover:opacity-100 bg-black bg-opacity-50 transition-opacity flex flex-col justify-between p-2'>
        <div className='flex justify-between'>
          <button
            onClick={() => moveImage(index, index - 1)}
            disabled={index === 0}
            className={`p-1 rounded-full bg-white ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
          >
            ←
          </button>
          <button
            onClick={() => moveImage(index, index + 1)}
            disabled={index === 9 - 1}
            className={`p-1 rounded-full bg-white ${index === 9 - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
          >
            →
          </button>
        </div>
        <button onClick={() => removeImage(index)} className='p-1 rounded-full bg-red-500 text-white hover:bg-red-600 self-center'>
          ×
        </button>
      </div>

      <div className='absolute top-0 left-0 bg-black bg-opacity-50 text-white px-2 py-1 text-sm'>{index + 1}</div>
    </div>
  );
};

// Poster Editor component
export const PosterEditor = ({
  elements,
  onElementMove,
  onElementSelect,
  selectedElementId,
  onElementDelete,
  onElementPropertyChange,
  images,
  headerBgColor,
  footerBgColor,
  useGradientBg,
  gradientStartColor,
  gradientEndColor,
  gradientDirection,
  backgroundColor,
  previewMode = false,
  headerTopMargin = 15,
  footerBottomMargin = 15,
  onHeaderPositionChange,
  onFooterPositionChange,
}) => {
  const editorRef = useRef(null);
  const headerRef = useRef(null);
  const footerRef = useRef(null);

  // 页眉拖拽状态
  const [isDraggingHeader, setIsDraggingHeader] = useState(false);
  const [headerDragStart, setHeaderDragStart] = useState(0);
  const [currentHeaderTop, setCurrentHeaderTop] = useState(headerTopMargin);

  // 页脚拖拽状态
  const [isDraggingFooter, setIsDraggingFooter] = useState(false);
  const [footerDragStart, setFooterDragStart] = useState(0);
  const [currentFooterBottom, setCurrentFooterBottom] = useState(footerBottomMargin);

  // 处理页眉拖拽 - 使用直接DOM操作确保拖拽正常工作
  const handleHeaderDragStart = useCallback(
    (e) => {
      if (previewMode) return;

      e.stopPropagation();
      e.preventDefault();
      console.log('Header drag start');

      const startY = e.clientY;
      const startTop = headerTopMargin;

      const handleMove = (moveEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const newTop = Math.max(0, Math.min(100, startTop + deltaY));

        if (headerRef.current) {
          headerRef.current.style.top = `${newTop}px`;
        }
        console.log('Header moving to:', newTop);
      };

      const handleUp = (upEvent) => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);

        const deltaY = upEvent.clientY - startY;
        const newTop = Math.max(0, Math.min(100, startTop + deltaY));
        console.log('Header drag end, new position:', newTop);

        if (onHeaderPositionChange) {
          onHeaderPositionChange(newTop);
        }
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [previewMode, headerTopMargin, onHeaderPositionChange]
  );

  // 处理页脚拖拽 - 使用直接DOM操作确保拖拽正常工作
  const handleFooterDragStart = useCallback(
    (e) => {
      if (previewMode) return;

      e.stopPropagation();
      e.preventDefault();
      console.log('Footer drag start');

      const startY = e.clientY;
      const startBottom = footerBottomMargin;

      const handleMove = (moveEvent) => {
        const deltaY = startY - moveEvent.clientY; // 注意这里是反向的
        const newBottom = Math.max(0, Math.min(100, startBottom + deltaY));

        if (footerRef.current) {
          footerRef.current.style.bottom = `${newBottom}px`;
        }
        console.log('Footer moving to:', newBottom);
      };

      const handleUp = (upEvent) => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);

        const deltaY = startY - upEvent.clientY; // 注意这里是反向的
        const newBottom = Math.max(0, Math.min(100, startBottom + deltaY));
        console.log('Footer drag end, new position:', newBottom);

        if (onFooterPositionChange) {
          onFooterPositionChange(newBottom);
        }
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [previewMode, footerBottomMargin, onFooterPositionChange]
  );

  // 清理事件监听器
  useEffect(() => {
    // 不需要在这里清理事件监听器，因为它们在handleUp函数中已经被清理
    return () => {};
  }, []);

  // 更新位置
  useEffect(() => {
    if (headerRef.current) {
      headerRef.current.style.top = `${headerTopMargin}px`;
    }
    if (footerRef.current) {
      footerRef.current.style.bottom = `${footerBottomMargin}px`;
    }
  }, [headerTopMargin, footerBottomMargin]);

  const [, drop] = useDrop({
    accept: 'POSTER_ELEMENT',
    drop: (item, monitor) => {
      if (!editorRef.current || previewMode) {
        return;
      }

      const editorBounds = editorRef.current.getBoundingClientRect();
      const delta = monitor.getDifferenceFromInitialOffset();

      // 处理任何移动，无论距离多小
      if (delta) {
        const newX = Math.round(item.initialPosition.x + delta.x);
        const newY = Math.round(item.initialPosition.y + delta.y);

        // Ensure the element stays within the editor bounds
        const boundedX = Math.max(0, Math.min(newX, editorBounds.width - 50));
        const boundedY = Math.max(0, Math.min(newY, editorBounds.height - 50));

        // 使用requestAnimationFrame确保位置更新在下一帧执行
        requestAnimationFrame(() => {
          onElementMove(item.id, { x: boundedX, y: boundedY });
        });

        return { moved: true, position: { x: boundedX, y: boundedY } };
      }

      return undefined;
    },
  });

  drop(editorRef);

  // 处理编辑器背景点击事件，取消选中元素
  const handleEditorClick = useCallback(
    (e) => {
      // 只有当点击的是编辑器背景时，才取消选中
      if (e.target === editorRef.current || e.target.classList.contains('editor-background') || e.target.classList.contains('grid-cell')) {
        if (selectedElementId) {
          onElementSelect(null);
        }
      }
    },
    [selectedElementId, onElementSelect]
  );

  // 设置背景样式
  let backgroundStyle = {};
  if (useGradientBg) {
    backgroundStyle = {
      background: `linear-gradient(${gradientDirection}, ${gradientStartColor}, ${gradientEndColor})`,
    };
  } else {
    backgroundStyle = {
      backgroundColor: backgroundColor,
    };
  }

  // 显示九宫格图片
  const renderGridImages = () => {
    if (!images || images.length === 0) return null;

    // 定义九宫格布局参数
    const gridSize = 3;
    const gridGap = 12; // 与generatePoster函数中保持一致
    const gridPadding = 20; // 与generatePoster函数中保持一致
    const headerHeight = 110;
    const gridStartY = headerHeight + headerTopMargin + 20;
    const footerHeight = 60;

    // 计算单元格尺寸
    const gridAreaWidth = 640 - gridPadding * 2;
    const cellWidth = (gridAreaWidth - gridGap * (gridSize - 1)) / gridSize;
    const cellHeight = cellWidth;

    return (
      <div className='absolute' style={{ top: `${gridStartY}px`, left: `${gridPadding}px` }}>
        <div className='grid grid-cols-3 gap-3'>
          {images.slice(0, 9).map((image, i) => {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;

            return (
              <div
                key={i}
                className='overflow-hidden'
                style={{
                  width: `${cellWidth}px`,
                  height: `${cellHeight}px`,
                }}
              >
                <img src={image.preview} alt={`Grid image ${i + 1}`} className='w-full h-full object-cover' />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={editorRef}
      className='relative border border-gray-300 rounded-lg overflow-hidden editor-background'
      style={{
        width: '640px',
        height: '854px',
        ...backgroundStyle,
      }}
      onClick={!previewMode ? handleEditorClick : undefined}
    >
      {/* 页眉区域 - 降低z-index，不遮挡文字元素 */}
      <div
        ref={headerRef}
        className='absolute left-0 right-0 h-[110px] rounded-lg editor-background'
        style={{
          backgroundColor: headerBgColor,
          top: `${headerTopMargin}px`,
          zIndex: 1,
        }}
      >
        {/* 只在非预览模式下显示拖拽手柄 */}
        {!previewMode && (
          <div
            className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-blue-500 rounded-full cursor-move flex items-center justify-center z-10 hover:bg-blue-600'
            onMouseDown={handleHeaderDragStart}
            style={{ marginBottom: '-6px' }}
          >
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2'>
              <path d='M7 14l5-5 5 5'></path>
            </svg>
          </div>
        )}
      </div>

      {/* 页脚区域 - 降低z-index，不遮挡文字元素 */}
      <div
        ref={footerRef}
        className='absolute left-0 right-0 h-[60px] rounded-lg editor-background'
        style={{
          backgroundColor: footerBgColor,
          bottom: `${footerBottomMargin}px`,
          zIndex: 1,
        }}
      >
        {/* 只在非预览模式下显示拖拽手柄 */}
        {!previewMode && (
          <div
            className='absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-blue-500 rounded-full cursor-move flex items-center justify-center z-10 hover:bg-blue-600'
            onMouseDown={handleFooterDragStart}
            style={{ marginTop: '-6px' }}
          >
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2'>
              <path d='M7 10l5 5 5-5'></path>
            </svg>
          </div>
        )}
      </div>

      {/* 显示九宫格图片 */}
      {renderGridImages()}

      {/* Grid area - 在预览模式下隐藏，添加间隙，调整位置 */}
      {!previewMode && !images?.length && (
        <div
          className='absolute left-5 right-5 grid grid-cols-3 gap-3'
          style={{
            top: `${headerTopMargin + 110 + 20}px`,
            bottom: `${footerBottomMargin + 60 + 20}px`,
            zIndex: 2,
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className='border border-gray-300 bg-gray-200 opacity-30 grid-cell'></div>
          ))}
        </div>
      )}

      {/* Draggable elements - 提高z-index，确保在页眉页脚之上 */}
      {elements.map((element) => (
        <DraggablePosterElement
          key={element.id}
          id={element.id}
          type={element.type}
          content={element.content}
          position={element.position}
          onMove={onElementMove}
          onSelect={onElementSelect}
          onDelete={onElementDelete}
          isSelected={selectedElementId === element.id}
          previewMode={previewMode}
          fontSize={element.fontSize}
          color={element.color}
          backgroundColor={element.backgroundColor}
          width={element.width}
          height={element.height}
          onPropertyChange={onElementPropertyChange}
        />
      ))}

      {/* Helper text - 在预览模式下隐藏 */}
      {!previewMode && elements.length === 0 && !images?.length && (
        <div className='absolute inset-0 flex items-center justify-center text-gray-400 editor-background'>添加元素或拖拽现有元素到此处</div>
      )}

      {/* Position indicator for selected element - 在预览模式下隐藏 */}
      {!previewMode && selectedElementId && (
        <div className='absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-20'>
          {(() => {
            const el = elements.find((e) => e.id === selectedElementId);
            return el ? `位置: x=${el.position.x}, y=${el.position.y}` : '';
          })()}
        </div>
      )}

      {/* Grid lines for better positioning - 在预览模式下隐藏 */}
      {!previewMode && (
        <div className='absolute inset-0 pointer-events-none'>
          <div className='absolute left-1/2 top-0 bottom-0 border-l border-white border-opacity-20'></div>
          <div className='absolute top-1/2 left-0 right-0 border-t border-white border-opacity-20'></div>
        </div>
      )}
    </div>
  );
};
