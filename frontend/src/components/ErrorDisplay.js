import React from 'react';

const ErrorDisplay = ({ error }) => {
  if (!error) return null;

  return (
    <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
      <strong>错误：</strong> {error}
    </div>
  );
};

export default ErrorDisplay;
