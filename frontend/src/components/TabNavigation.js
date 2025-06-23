import React from 'react';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className='border-b border-gray-200 mb-6'>
      <nav className='-mb-px flex flex-wrap'>
        <button
          onClick={() => setActiveTab('translation')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            activeTab === 'translation'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          图文翻译
        </button>
        <button
          onClick={() => setActiveTab('image-editor')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            activeTab === 'image-editor'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          图片批量裁剪
        </button>
        <button
          onClick={() => setActiveTab('grid-poster')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            activeTab === 'grid-poster'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          九宫格海报
        </button>
      </nav>
    </div>
  );
};

export default TabNavigation;
