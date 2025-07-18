import React from 'react';
import { posterStyles } from '../data/posterStyles';

const PosterStyleSelector = ({ onStyleSelect, selectedStyle }) => {
  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
      {posterStyles.map((style) => (
        <div
          key={style.id}
          className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
            selectedStyle === style.id ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200 hover:border-blue-300'
          }`}
          onClick={() => onStyleSelect(style.id)}
        >
          <div className='relative pb-[100%]'>
            <img src={style.thumbnail} alt={style.name} className='absolute top-0 left-0 w-full h-full object-cover' />
          </div>
          <div className='p-2 bg-white text-center'>
            <h4 className='text-sm font-medium text-gray-800'>{style.name}</h4>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PosterStyleSelector;
