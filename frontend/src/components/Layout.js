import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className='min-h-screen bg-gray-100'>
      <header className='bg-blue-600 text-white p-4 shadow-md'>
        <div className='container mx-auto'>
          <h1 className='text-3xl font-bold'>打标对照器</h1>
          <p className='mt-2'>用于进行图片训练集打标集更改</p>
        </div>
      </header>

      <main className='container mx-auto py-6 px-4'>{children}</main>

      <footer className='bg-gray-800 text-white p-4 mt-12'>
        <div className='container mx-auto text-center'>
          <p>打标对照器 © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
