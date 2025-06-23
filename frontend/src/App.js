import React, { useState } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import TranslationTab from './components/TranslationTab';
import ImageBatchEditor from './components/ImageBatchEditor';
import GridPosterTab from './components/GridPosterTab';
import TabNavigation from './components/TabNavigation';
import { API_BASE_URL } from './config';

// Set default headers for axios
axios.defaults.headers.common['Content-Type'] = 'application/json';

function App() {
  const [activeTab, setActiveTab] = useState('translation');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'translation':
        return <TranslationTab />;
      case 'image-editor':
        return <ImageBatchEditor />;
      case 'grid-poster':
        return <GridPosterTab />;
      default:
        return <TranslationTab />;
    }
  };

  return (
    <Layout>
      <h1 className='text-2xl font-bold mb-6'>Marking Tools</h1>

      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {renderActiveTab()}
    </Layout>
  );
}

export default App;
