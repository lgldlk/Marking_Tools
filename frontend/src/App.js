import React, { useState, useCallback } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import TranslationTab from './components/TranslationTab';
import ImageBatchEditor from './components/ImageBatchEditor';
import GridPosterTab from './components/GridPosterTab';
import KontextLabeler, { TranslationContext } from './components/KontextLabeler';
import TabNavigation from './components/TabNavigation';
import { API_BASE_URL } from './config';

// Set default headers for axios
axios.defaults.headers.common['Content-Type'] = 'application/json';

function App() {
  const [activeTab, setActiveTab] = useState('translation');
  const [translationText, setTranslationText] = useState('');

  // 使用useCallback包装setTranslationText和setActiveTab，避免不必要的重新渲染
  const handleSetTranslationText = useCallback((text) => {
    setTranslationText(text);
  }, []);

  const handleSetActiveTab = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'translation':
        return <TranslationTab initialText={translationText} />;
      case 'image-editor':
        return <ImageBatchEditor />;
      case 'grid-poster':
        return <GridPosterTab />;
      case 'kontext-labeler':
        return <KontextLabeler />;
      default:
        return <TranslationTab initialText={translationText} />;
    }
  };

  return (
    <TranslationContext.Provider value={{ setTranslationText: handleSetTranslationText, setActiveTab: handleSetActiveTab }}>
      <Layout>
        <h1 className='text-2xl font-bold mb-6'>Marking Tools</h1>

        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {renderActiveTab()}
      </Layout>
    </TranslationContext.Provider>
  );
}

export default App;
