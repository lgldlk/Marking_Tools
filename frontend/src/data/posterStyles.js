// Import poster style thumbnails
// In a real project, you'd have actual image files for these thumbnails
// For now, we'll use placeholders

// Since we don't have actual image files for thumbnails,
// we'll use color backgrounds as placeholders

export const posterStyles = [
  {
    id: 'ecommerce-grid',
    name: '电商网格',
    thumbnail: 'https://via.placeholder.com/200x200/FF5722/FFFFFF?text=电商网格',
    template: {
      type: 'grid',
      layout: '3x3',
      background: '#FF5722',
      textPosition: 'bottom',
    },
  },
  {
    id: 'jewelry-elegant',
    name: '珠宝优雅',
    thumbnail: 'https://via.placeholder.com/200x200/F8F3E9/000000?text=珠宝优雅',
    template: {
      type: 'single',
      background: '#F8F3E9',
      textPosition: 'right',
      effects: ['shadow', 'reflection'],
    },
  },
  {
    id: 'tech-modern',
    name: '科技现代',
    thumbnail: 'https://via.placeholder.com/200x200/1A1A2E/FFFFFF?text=科技现代',
    template: {
      type: 'single',
      background: '#1A1A2E',
      textPosition: 'left',
      effects: ['glow', 'particles'],
    },
  },
  {
    id: 'fashion-minimal',
    name: '时尚简约',
    thumbnail: 'https://via.placeholder.com/200x200/FFFFFF/000000?text=时尚简约',
    template: {
      type: 'single',
      background: '#FFFFFF',
      textPosition: 'bottom',
      effects: ['clean'],
    },
  },
  {
    id: 'cosmetic-luxury',
    name: '化妆品奢华',
    thumbnail: 'https://via.placeholder.com/200x200/E0C9A6/000000?text=化妆品奢华',
    template: {
      type: 'single',
      background: '#E0C9A6',
      textPosition: 'center',
      effects: ['gold', 'shine'],
    },
  },
  {
    id: 'food-vibrant',
    name: '食品鲜明',
    thumbnail: 'https://via.placeholder.com/200x200/4CAF50/FFFFFF?text=食品鲜明',
    template: {
      type: 'single',
      background: '#4CAF50',
      textPosition: 'bottom',
      effects: ['fresh'],
    },
  },
  {
    id: 'electronics-dynamic',
    name: '电子动感',
    thumbnail: 'https://via.placeholder.com/200x200/212121/FFFFFF?text=电子动感',
    template: {
      type: 'single',
      background: '#212121',
      textPosition: 'right',
      effects: ['circuit', 'glow'],
    },
  },
  {
    id: 'perfume-elegant',
    name: '香水典雅',
    thumbnail: 'https://via.placeholder.com/200x200/FFA500/FFFFFF?text=香水典雅',
    template: {
      type: 'single',
      background: 'linear-gradient(to right, #FFD700, #FFA500)',
      textPosition: 'left',
      effects: ['mist', 'glow'],
    },
  },
];

// Function to get style by ID
export const getStyleById = (styleId) => {
  return posterStyles.find((style) => style.id === styleId) || null;
};
