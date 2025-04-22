/**
 * API接口封装
 * 提供与后端交互的方法
 */
import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 获取所有漫画列表
 * @returns {Promise} 包含漫画列表的Promise对象
 */
export const getComics = async () => {
  try {
    const response = await apiClient.get('/api/comics');
    return response.data;
  } catch (error) {
    console.error('获取漫画列表失败', error);
    throw error;
  }
};

/**
 * 获取收藏列表
 * @returns {Promise} 包含收藏列表的Promise对象
 */
export const getFavorites = async () => {
  try {
    const response = await apiClient.get('/api/favorites');
    return response.data;
  } catch (error) {
    console.error('获取收藏列表失败', error);
    throw error;
  }
};

/**
 * 添加漫画到收藏
 * @param {string} comicName - 漫画名称
 * @returns {Promise} 操作结果的Promise对象
 */
export const addFavorite = async (comicName) => {
  try {
    const response = await apiClient.post('/api/favorites', { name: comicName });
    return response.data;
  } catch (error) {
    console.error('添加收藏失败', error);
    throw error;
  }
};

/**
 * 取消收藏漫画
 * @param {string} comicName - 漫画名称
 * @returns {Promise} 操作结果的Promise对象
 */
export const removeFavorite = async (comicName) => {
  try {
    const response = await apiClient.delete('/api/favorites', { 
      data: { name: comicName } 
    });
    return response.data;
  } catch (error) {
    console.error('取消收藏失败', error);
    throw error;
  }
}; 