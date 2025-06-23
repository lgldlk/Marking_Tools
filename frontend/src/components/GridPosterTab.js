import React from 'react';
import GridPosterCreator from './GridPosterCreator';

const GridPosterTab = () => {
  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>九宫格电商海报制作</h2>
      <p className='text-gray-600 mb-6'>上传产品图片，一键生成九宫格电商产品展示海报，适合电商产品展示、品牌推广等场景</p>

      <GridPosterCreator />
    </div>
  );
};

export default GridPosterTab;
