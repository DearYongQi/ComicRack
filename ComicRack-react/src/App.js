import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { getThemeMode, initThemeMode } from './utils/helpers';

// 导入页面组件
import Home from './pages/Home';
import Reader from './pages/Reader';
import ChapterList from './pages/ChapterList';
import NotFound from './pages/NotFound';

// 导入样式
import './App.scss';

/**
 * 应用主组件
 * 负责路由配置和主题设置
 * @returns {React.ReactElement} 应用根组件
 */
function App() {
  // 初始化主题
  useEffect(() => {
    initThemeMode();
  }, []);

  // 获取当前主题模式
  const currentTheme = getThemeMode();
  const isDarkMode = currentTheme === 'dark';

  // 配置antd主题
  const antdTheme = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#ff9966',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#f5222d',
      colorInfo: '#1677ff',
      borderRadius: 6,
    },
  };

  return (
    <ConfigProvider theme={antdTheme}>
      <div className="app-container" data-theme={currentTheme}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/comic/:comicName" element={<ChapterList />} />
          <Route path="/read/:comicName/:chapter?" element={<Reader />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </ConfigProvider>
  );
}

export default App; 