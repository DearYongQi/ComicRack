import React, { useState } from 'react';
import { Card, Tooltip, message } from 'antd';
import { StarOutlined, StarFilled, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { addFavorite, removeFavorite } from '../../utils/api';
import ImageWithFallback from '../ImageWithFallback';
import './style.scss';

/**
 * 漫画卡片组件
 * 展示单个漫画封面和信息
 * @param {Object} props - 组件属性
 * @param {Object} props.comic - 漫画数据对象
 * @param {string} props.comic.name - 漫画名称
 * @param {string} props.comic.coverImage - 封面图片URL
 * @param {boolean} props.comic.hasChapters - 是否包含章节
 * @param {boolean} props.isFavorite - 是否已收藏
 * @param {Function} props.onRefresh - 刷新回调函数
 * @returns {React.ReactElement} 漫画卡片组件
 */
const ComicCard = ({ comic, isFavorite, onRefresh }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [favorited, setFavorited] = useState(isFavorite);
  
  // 处理漫画卡片点击
  const handleCardClick = () => {
    if (comic.hasChapters) {
      navigate(`/comic/${encodeURIComponent(comic.name)}`);
    } else {
      navigate(`/read/${encodeURIComponent(comic.name)}`);
    }
  };
  
  // 处理收藏点击
  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
   
    if (loading) return;
    
    setLoading(true);
    
    try {
      if (favorited) {
        // 取消收藏
        const response = await removeFavorite(comic.name);
        if (response.success) {
          setFavorited(false);
          message.success('已取消收藏');
        }
      } else {
        // 添加收藏
        const response = await addFavorite(comic.name);
        if (response.success) {
          setFavorited(true);
          message.success('已添加到收藏');
        }
      }
      
      // 刷新列表
      if (onRefresh) onRefresh();
    } catch (error) {
      message.error(favorited ? '取消收藏失败' : '添加收藏失败');
    }
    
    setLoading(false);
  };
  
  // 收藏按钮渲染
  const favoriteButton = (
    <div className="favorite-button" onClick={handleFavoriteClick}>
      {loading ? (
        <LoadingOutlined />
      ) : favorited ? (
        <StarFilled className="filled" />
      ) : (
        <StarOutlined />
      )}
    </div>
  );
  
  return (
    <Card
      hoverable
      className="comic-card"
      cover={
        <div className="comic-cover">
          <ImageWithFallback 
            src={comic.coverImage} 
            alt={comic.name}
            useBaseUrl={true}
            className="comic-image"
          />
          <Tooltip title={favorited ? '取消收藏' : '添加到收藏'}>
            {favoriteButton}
          </Tooltip>
        </div>
      }
      onClick={handleCardClick}
    >
      <Card.Meta 
        title={
          <Tooltip title={comic.name}>
            <div className="comic-title">{comic.name}</div>
          </Tooltip>
        }
        description={comic.hasChapters ? '多章节漫画' : '单章节漫画'}
      />
    </Card>
  );
};

export default ComicCard; 