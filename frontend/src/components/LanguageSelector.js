import React from 'react';

const LanguageSelector = ({ onLanguageChange, currentLang, isSourceLang = false }) => {
  const languages = [
    { code: 'en', name: '英语 (English)' },
    { code: 'zh-CN', name: '中文 (Chinese)' },
    { code: 'ja', name: '日语 (Japanese)' },
    { code: 'ko', name: '韩语 (Korean)' },
    { code: 'fr', name: '法语 (French)' },
    { code: 'de', name: '德语 (German)' },
    { code: 'es', name: '西班牙语 (Spanish)' },
    { code: 'ru', name: '俄语 (Russian)' },
  ];

  const handleChange = (e) => {
    onLanguageChange(e.target.value);
  };

  const filteredLanguages = languages.filter((lang) => !lang.onlyForSource || isSourceLang);

  return (
    <div className='flex items-center'>
      <label htmlFor='language-select' className='mr-2 text-gray-700'>
        {isSourceLang ? '源语言:' : '目标语言:'}
      </label>
      <select
        id='language-select'
        value={currentLang}
        onChange={handleChange}
        className='px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
      >
        {filteredLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
