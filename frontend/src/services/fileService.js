export const readTextFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
};

export const createAndDownloadZip = (files) => {
  return new Promise(async (resolve, reject) => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      files.forEach((file) => {
        zip.file(file.originalName, file.imageFile);

        const baseName = file.originalName.substring(0, file.originalName.lastIndexOf('.'));
        const txtFileName = `${baseName}.txt`;
        zip.file(txtFileName, file.textContent);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'marked_files.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve();
    } catch (err) {
      console.error('Zip creation error:', err);
      reject(err);
    }
  });
};
