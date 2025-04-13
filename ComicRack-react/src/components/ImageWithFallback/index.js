import React, { useState } from 'react';
import { BASE_URL } from '../../utils/api';
import './style.scss';

/**
 * 带错误处理的图片组件
 * 自动处理图片路径并在加载失败时显示占位图
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.src - 图片源路径
 * @param {string} props.alt - 图片替代文本
 * @param {string} props.className - 自定义类名
 * @param {Object} props.style - 自定义样式
 * @param {boolean} props.useBaseUrl - 是否使用BASE_URL前缀，默认为true
 * @returns {React.ReactElement} 图片组件
 */
const ImageWithFallback = ({ 
  src, 
  alt = '', 
  className = '', 
  style = {}, 
  useBaseUrl = true,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  
  // 处理图片路径
  const processedSrc = (() => {
    // 如果路径为空或已经是完整URL，则不处理
    if (!src || src.startsWith('http') || src.startsWith('data:') || !useBaseUrl) {
      return src;
    }
    
    // 确保路径以/开头
    const path = src.startsWith('/') ? src : `/${src}`;
    return `${BASE_URL}${path}`;
  })();
  
  if (hasError) {
    return (
      <div 
        className={`image-error-placeholder ${className}`}
        style={{ ...style }}
        title={alt || '图片加载失败'}
      />
    );
  }

  return (
    <img
      src={processedSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => setHasError(true)}
      loading="lazy"
      {...props}
    />
  );
};

export default ImageWithFallback; 