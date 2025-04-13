import React, { useState, useEffect, useCallback } from 'react';
import { Input, Space, Switch, Spin, Empty, Pagination, message } from 'antd';
import { SearchOutlined, BulbOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getComics, getFavorites } from '../../utils/api';
import { setDarkMode, getThemeMode, debounce } from '../../utils/helpers';
import ComicCard from '../../components/ComicCard';
import './style.scss';

/**
 * 主页组件
 * 展示漫画列表和搜索功能
 * @returns {React.ReactElement} 主页组件
 */
const Home = () => {
  const navigate = useNavigate();
  const [comics, setComics] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filteredComics, setFilteredComics] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [isDarkMode, setIsDarkMode] = useState(getThemeMode() === 'dark');

  // 计算页面尺寸
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 576) {
        setPageSize(6);
      } else if (width <= 992) {
        setPageSize(8);
      } else if (width <= 1200) {
        setPageSize(12);
      } else {
        setPageSize(16);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 获取漫画列表和收藏列表
  const fetchComics = useCallback(async () => {
    setLoading(true);
    try {
      const [comicsResponse, favoritesResponse] = await Promise.all([
        getComics(),
        getFavorites()
      ]);
      
      if (comicsResponse.success && favoritesResponse.success) {
        const comicsList = comicsResponse.data;
        const favoritesList = favoritesResponse.data;
        
        // 标记收藏的漫画
        const markedComics = comicsList.map(comic => ({
          ...comic,
          isFavorite: favoritesList.includes(comic.name)
        }));
        
        // 首先显示收藏的漫画
        const sortedComics = [...markedComics].sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setComics(sortedComics);
        setFilteredComics(sortedComics);
        setFavorites(favoritesList);
      }
    } catch (error) {
      message.error('获取漫画列表失败');
      console.error(error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchComics();
  }, [fetchComics]);

  // 搜索处理
  const handleSearch = useCallback(
    debounce((value) => {
      if (!value.trim()) {
        setFilteredComics(comics);
        return;
      }
      
      const filtered = comics.filter((comic) =>
        comic.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredComics(filtered);
      setCurrentPage(1);
    }, 300),
    [comics]
  );

  // 输入框变化处理
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    handleSearch(value);
  };

  // 切换主题模式
  const toggleTheme = (checked) => {
    setIsDarkMode(checked);
    setDarkMode(checked);
  };

  // 分页处理
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 当前页的漫画
  const currentComics = filteredComics.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="logo">ComicRack</h1>
        <Space className="header-controls">
          <Input
            placeholder="搜索漫画..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={handleInputChange}
            className="search-input"
          />
          <Switch
            checked={isDarkMode}
            onChange={toggleTheme}
            checkedChildren={<BulbOutlined />}
            unCheckedChildren={<BulbOutlined />}
            className="theme-switch"
          />
        </Space>
      </header>

      <main className="comics-grid-container">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>加载漫画中...</p>
          </div>
        ) : currentComics.length > 0 ? (
          <div className="comics-grid">
            {currentComics.map((comic) => (
              <ComicCard
                key={comic.name}
                comic={comic}
                onRefresh={fetchComics}
                isFavorite={comic.isFavorite}
              />
            ))}
          </div>
        ) : (
          <Empty description="没有找到漫画" />
        )}
      </main>

      {filteredComics.length > pageSize && (
        <div className="pagination-container">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredComics.length}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}

      <footer className="home-footer">
        <p>© 2023 ComicRack - 本地漫画阅读器</p>
      </footer>
    </div>
  );
};

export default Home; 