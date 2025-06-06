import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/index';

const TranslationServiceSelector = ({ onServiceChange, currentService }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/services`);
        setServices(response.data.services);
      } catch (err) {
        console.error('Error fetching translation services:', err);
        setError('无法获取翻译服务列表');

        setServices(['google', 'bing', 'baidu', 'youdao', 'tencent', 'alibaba', 'deepl']);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleChange = (e) => {
    onServiceChange(e.target.value);
  };

  const serviceDisplayNames = {
    google: '谷歌翻译 (Google)',
    bing: '必应翻译 (Bing)',
    baidu: '百度翻译 (Baidu)',
    youdao: '有道翻译 (Youdao)',
    tencent: '腾讯翻译 (Tencent)',
    alibaba: '阿里翻译 (Alibaba)',
    deepl: 'DeepL 翻译',
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className='flex items-center'>
      <label htmlFor='service-select' className='mr-2 text-gray-700'>
        翻译服务:
      </label>
      <select
        id='service-select'
        value={currentService}
        onChange={handleChange}
        className='px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
      >
        {services.map((service) => (
          <option key={service} value={service}>
            {serviceDisplayNames[service] || service}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TranslationServiceSelector;
