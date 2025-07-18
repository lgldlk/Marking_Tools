import React, { useState } from 'react';

const BatchTools = ({ onBatchUpdate }) => {
  const [action, setAction] = useState('add');
  const [content, setContent] = useState('');
  const [position, setPosition] = useState('end');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (action === 'add' && !content) {
      alert('请输入要添加的内容');
      return;
    }

    if (action === 'replace' && (!findText || !replaceText)) {
      alert('请输入查找和替换的内容');
      return;
    }

    onBatchUpdate(action, content, position, findText, replaceText);
  };

  const handleTranslateAll = () => {
    onBatchUpdate('translate-all');
  };

  return (
    <div>
      <h2 className='text-xl font-bold mb-4'>批量操作</h2>

      <div className='mb-6'>
        <button
          onClick={handleTranslateAll}
          className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-200 mr-4'
        >
          全部自动翻译
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label className='block text-gray-700 mb-2'>操作类型:</label>
          <div className='flex space-x-4'>
            <div className='flex items-center'>
              <input type='radio' id='add' name='action' value='add' checked={action === 'add'} onChange={() => setAction('add')} className='mr-2' />
              <label htmlFor='add'>添加内容</label>
            </div>

            <div className='flex items-center'>
              <input
                type='radio'
                id='replace'
                name='action'
                value='replace'
                checked={action === 'replace'}
                onChange={() => setAction('replace')}
                className='mr-2'
              />
              <label htmlFor='replace'>替换内容</label>
            </div>
          </div>
        </div>

        {action === 'add' && (
          <>
            <div className='mb-4'>
              <label className='block text-gray-700 mb-2'>添加位置:</label>
              <div className='flex space-x-4'>
                <div className='flex items-center'>
                  <input
                    type='radio'
                    id='start'
                    name='position'
                    value='start'
                    checked={position === 'start'}
                    onChange={() => setPosition('start')}
                    className='mr-2'
                  />
                  <label htmlFor='start'>文本开头</label>
                </div>

                <div className='flex items-center'>
                  <input
                    type='radio'
                    id='end'
                    name='position'
                    value='end'
                    checked={position === 'end'}
                    onChange={() => setPosition('end')}
                    className='mr-2'
                  />
                  <label htmlFor='end'>文本结尾</label>
                </div>
              </div>
            </div>

            <div className='mb-4'>
              <label htmlFor='content' className='block text-gray-700 mb-2'>
                添加内容:
              </label>
              <textarea
                id='content'
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                rows='3'
                placeholder='请输入要添加的内容'
              />
            </div>
          </>
        )}

        {action === 'replace' && (
          <>
            <div className='mb-4'>
              <label htmlFor='findText' className='block text-gray-700 mb-2'>
                查找内容:
              </label>
              <textarea
                id='findText'
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                rows='2'
                placeholder='请输入要查找的内容'
              />
            </div>

            <div className='mb-4'>
              <label htmlFor='replaceText' className='block text-gray-700 mb-2'>
                替换为:
              </label>
              <textarea
                id='replaceText'
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                rows='2'
                placeholder='请输入替换的内容'
              />
            </div>
          </>
        )}

        <div className='mt-4'>
          <button type='submit' className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-200'>
            应用更改
          </button>
        </div>
      </form>
    </div>
  );
};

export default BatchTools;
