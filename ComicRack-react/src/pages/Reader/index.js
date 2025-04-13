import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button, Slider, Select, message, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
  VerticalAlignTopOutlined,
  ColumnWidthOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  HomeOutlined,
  CloseOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CompressOutlined
} from '@ant-design/icons';
import { getComics } from '../../utils/api';
import { debounce } from '../../utils/helpers';
import ImageWithFallback from '../../components/ImageWithFallback';
import './style.scss';

/**
 * 漫画阅读页面组件
 * 提供漫画阅读和翻页控制功能
 * @returns {React.ReactElement} 漫画阅读页面组件
 */
const Reader = () => {
  const { comicName, chapter } = useParams();
  const navigate = useNavigate();
  
  // 状态
  const [comic, setComic] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true); // 默认显示控制栏
  const [readingMode, setReadingMode] = useState('vertical'); // 'vertical' | 'horizontal'
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(2); // 自动翻页间隔，单位秒
  const [availableChapters, setAvailableChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(chapter || 'main');
  const [fitMode, setFitMode] = useState('height'); // 'height' or 'width' or 'cover'
  const [isUserScrolling, setIsUserScrolling] = useState(false); // 用户是否正在手动滚动
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 自动播放定时器引用
  const autoPlayTimerRef = useRef(null);
  // 控制栏自动隐藏定时器引用
  const controlsTimerRef = useRef(null);
  // 容器引用
  const containerRef = useRef(null);
  // 可视区域内的图片元素索引
  const visibleImagesRef = useRef(new Set());
  // 图片状态（是否已加载）
  const [imageStatus, setImageStatus] = useState({});
  // 用户滚动状态计时器引用
  const userScrollTimerRef = useRef(null);
  
  // 滚动时自动隐藏控制栏
  const hideControlsOnScroll = useCallback(() => {
    setShowControls(false);
  }, []);

  // 获取漫画数据
  useEffect(() => {
    const fetchComicData = async () => {
      setLoading(true);
      try {
        const response = await getComics();
        if (response.success) {
          // 查找匹配的漫画
          const foundComic = response.data.find(c => c.name === comicName);
          
          if (foundComic) {
            setComic(foundComic);
            
            // 设置可用章节
            const chapters = [];
            for (const key in foundComic.structure) {
              chapters.push(key);
            }
            
            // 按章节名称排序
            chapters.sort((a, b) => {
              // 特殊处理'main'章节，始终排在最前
              if (a === 'main') return -1;
              if (b === 'main') return 1;
              
              // 检查是否为番外篇或特殊章节
              const isExtraA = /番外|特别|附录|番番|外传|后记|设定|角色|访谈|卷末/i.test(a);
              const isExtraB = /番外|特别|附录|番番|外传|后记|设定|角色|访谈|卷末/i.test(b);
              
              // 如果一个是番外一个是正常章节，番外排后面
              if (isExtraA && !isExtraB) return 1;
              if (!isExtraA && isExtraB) return -1;
              
              // 提取中文数字或阿拉伯数字
              const chineseNumMap = {
                '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
                '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
                '百': 100, '千': 1000, '万': 10000,
                '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
                '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
                '三十': 30, '四十': 40, '五十': 50, '六十': 60, '七十': 70,
                '八十': 80, '九十': 90, '一百': 100
              };
              
              // 从章节名中提取数字（阿拉伯数字或中文数字）
              const extractNumber = (chapterName) => {
                // 先尝试提取阿拉伯数字
                const arabicMatch = chapterName.match(/\d+/);
                if (arabicMatch) {
                  return parseInt(arabicMatch[0]);
                }
                
                // 尝试提取中文数字
                for (const [cnNum, num] of Object.entries(chineseNumMap)) {
                  if (chapterName.includes(cnNum)) {
                    return num;
                  }
                }
                
                return null;
              };
              
              const numA = extractNumber(a);
              const numB = extractNumber(b);
              
              if (numA !== null && numB !== null) {
                return numA - numB;
              }
              
              // 如果都没有数字，按字符串排序
              return a.localeCompare(b, 'zh-CN');
            });
            
            setAvailableChapters(chapters);
            
            // 设置当前章节
            const targetChapter = chapter || (foundComic.hasChapters ? chapters[0] : 'main');
            setCurrentChapter(targetChapter);
            
            // 设置图片
            if (foundComic.structure[targetChapter]) {
              setImages(foundComic.structure[targetChapter]);
            } else {
              message.error('章节不存在');
              navigate(`/comic/${encodeURIComponent(comicName)}`);
            }
          } else {
            message.error('未找到漫画');
            navigate('/');
          }
        }
      } catch (error) {
        message.error('获取漫画信息失败');
        console.error(error);
      }
      setLoading(false);
    };
    
    fetchComicData();
  }, [comicName, chapter, navigate]);

  // 当章节变化时，重置页码和加载图片
  useEffect(() => {
    if (comic && comic.structure && comic.structure[currentChapter]) {
      setImages(comic.structure[currentChapter]);
      setCurrentPage(0);
      setImageStatus({});
    }
  }, [comic, currentChapter]);

  // 自动播放控制
  useEffect(() => {
    // 清除现有定时器
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    
    // 设置新定时器
    if (autoPlay && images.length > 0) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentPage(prevPage => {
          if (prevPage < images.length - 1) {
            return prevPage + 1;
          } else {
            // 最后一页停止自动播放
            setAutoPlay(false);
            return prevPage;
          }
        });
      }, autoPlayInterval * 1000);
    }
    
    // 组件卸载时清除定时器
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, images.length]);

  // 滚动到指定页码(重写为更简单直接的实现)
  const scrollToPage = useCallback((pageIndex) => {
    if (!containerRef.current || readingMode !== 'vertical') return;
    
    try {
      // 直接获取要滚动到的元素
      const imgElements = containerRef.current.querySelectorAll('.comic-page-wrapper');
      if (!imgElements[pageIndex]) return;
      
      // 获取页面位置
      const targetElement = imgElements[pageIndex];
      
      // 暂时阻止滚动事件处理
      setIsUserScrolling(true);
      
      // 立即滚动到目标位置
      containerRef.current.scrollTop = targetElement.offsetTop;
      
      // 延迟重置滚动状态
      setTimeout(() => {
        setIsUserScrolling(false);
      }, 500);
    } catch (err) {
      console.error('滚动到页面失败:', err);
      setIsUserScrolling(false);
    }
  }, [readingMode]);

  // 页面滚动时检测可视区域内的图片
  useEffect(() => {
    let scrollTimer = null;
    
    const handleScroll = debounce(() => {
      if (readingMode !== 'vertical' || !containerRef.current) return;
      
      // 如果是正在编程方式滚动，不触发页码更新
      if (isUserScrolling) return;
      
      // 寻找当前在视口中最可见的图片
      const imgElements = containerRef.current.querySelectorAll('.comic-page-wrapper');
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.clientHeight;
      
      let mostVisibleIndex = currentPage;
      let maxVisibleArea = 0;
      const visibleImages = new Set();
      
      Array.from(imgElements).forEach((img, index) => {
        const rect = img.getBoundingClientRect();
        
        // 计算图片在视口中的可见部分
        const visibleTop = Math.max(0, rect.top - containerRect.top);
        const visibleBottom = Math.min(containerHeight, rect.bottom - containerRect.top);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        
        if (visibleHeight > 0) {
          visibleImages.add(index);
          
          // 如果这张图片比之前找到的更可见，更新最可见图片索引
          if (visibleHeight > maxVisibleArea) {
            maxVisibleArea = visibleHeight;
            mostVisibleIndex = index;
          }
        }
      });
      
      // 更新可见图片加载状态和预加载
      if (visibleImages.size > 0) {
        setImageStatus(prev => {
          const updated = { ...prev };
          
          // 更新当前可见图片
          visibleImages.forEach(index => {
            if (!updated[index]) {
              updated[index] = true;
            }
          });
          
          // 预加载前后更多页
          for (let i = -10; i <= 10; i++) {
            const preloadIndex = mostVisibleIndex + i;
            if (preloadIndex >= 0 && preloadIndex < images.length) {
              updated[preloadIndex] = true;
            }
          }
          
          return updated;
        });
      }
      
      // 更新当前页码
      if (mostVisibleIndex !== currentPage) {
        setCurrentPage(mostVisibleIndex);
      }
    }, 100);
    
    // 添加滚动事件监听
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      container.addEventListener('scroll', hideControlsOnScroll, { passive: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('scroll', hideControlsOnScroll);
      }
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [readingMode, images.length, currentPage, hideControlsOnScroll, isUserScrolling]);

  // 处理进度条和页码按钮的手动翻页
  const handleManualPageChange = useCallback((newPage) => {
    // 先设置页码
    setCurrentPage(newPage);
    
    // 在垂直模式下触发滚动
    if (readingMode === 'vertical') {
      // 确保DOM更新后再滚动
      setTimeout(() => {
        scrollToPage(newPage);
      }, 50);
    }
  }, [readingMode, scrollToPage]);

  // 在水平模式下，监听键盘事件用于翻页
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevPage();
          break;
        case 'ArrowRight':
          handleNextPage();
          break;
        case 'Escape':
          setShowControls(true);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, images.length]);

  // 设置控制栏自动隐藏
  useEffect(() => {
    // 如果控制栏显示，设置自动隐藏计时器
    if (showControls) {
      // 清除之前的计时器
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
      
      // 设置新的计时器，5秒后自动隐藏
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
    
    // 组件卸载时清除计时器
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [showControls]);

  // 点击页面控制区域交互（横向模式：左区域上一页，中区域显示控制栏，右区域下一页；竖向模式：只有中间区域控制显示/隐藏控制栏）
  const handleContainerClick = (e) => {
    // 如果点击的是控制栏内部元素，不处理
    const isControlElement = 
      e.target.closest('.reader-controls') || 
      e.target.closest('.bottom-controls');
    
    if (isControlElement) {
      return;
    }
    
    // 获取点击位置与容器的相对宽度百分比
    const containerWidth = e.currentTarget.clientWidth;
    const clickX = e.clientX;
    const clickXPercent = (clickX / containerWidth) * 100;
    
    // 横向阅读模式：区域点击功能
    if (readingMode === 'horizontal') {
      // 左侧区域（30%）- 上一页
      if (clickXPercent < 30) {
        handlePrevPage();
      } 
      // 右侧区域（30%）- 下一页 
      else if (clickXPercent > 70) {
        handleNextPage();
      } 
      // 中间区域（40%）- 显示/隐藏控制栏
      else {
        setShowControls(prev => !prev);
      }
    } else {
      // 竖向阅读模式：只有中间区域点击才切换控制栏显示状态
      if (clickXPercent >= 30 && clickXPercent <= 70) {
        setShowControls(prev => !prev);
      }
    }
  };

  // 上一页
  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    } else if (availableChapters.length > 1) {
      // 如果是第一页，尝试跳转到上一个章节的最后一页
      const currentChapterIndex = availableChapters.indexOf(currentChapter);
      if (currentChapterIndex > 0) {
        const prevChapter = availableChapters[currentChapterIndex - 1];
        setCurrentChapter(prevChapter);
        // 获取上一章的最后一页索引
        if (comic.structure[prevChapter]) {
          setCurrentPage(comic.structure[prevChapter].length - 1);
        }
      }
    }
  }, [currentPage, availableChapters, currentChapter, comic]);

  // 下一页
  const handleNextPage = useCallback(() => {
    if (currentPage < images.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (availableChapters.length > 1) {
      // 如果是最后一页，尝试跳转到下一个章节的第一页
      const currentChapterIndex = availableChapters.indexOf(currentChapter);
      if (currentChapterIndex < availableChapters.length - 1) {
        const nextChapter = availableChapters[currentChapterIndex + 1];
        setCurrentChapter(nextChapter);
        setCurrentPage(0);
      }
    }
  }, [currentPage, images.length, availableChapters, currentChapter]);

  // 处理章节变化
  const handleChapterChange = (value) => {
    setCurrentChapter(value);
    setCurrentPage(0);
    // 更新URL
    navigate(`/read/${encodeURIComponent(comicName)}/${encodeURIComponent(value)}`);
  };

  // 处理阅读模式变化
  const handleReadingModeChange = () => {
    setReadingMode(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
    setCurrentPage(0);
  };

  // 处理自动播放间隔变化
  const handleIntervalChange = (value) => {
    setAutoPlayInterval(value);
  };

  // 返回章节列表或首页
  const handleBack = () => {
    if (comic && comic.hasChapters) {
      navigate(`/comic/${encodeURIComponent(comicName)}`);
    } else {
      navigate('/');
    }
  };

  // 返回首页
  const handleHome = () => {
    navigate('/');
  };

  // 只在初始加载和切换章节时自动滚动到第一页
  useEffect(() => {
    if (readingMode === 'vertical' && images.length > 0 && currentPage === 0) {
      // 短暂延迟，确保DOM已更新
      const timer = setTimeout(() => {
        scrollToPage(0);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [images, readingMode, scrollToPage]);
  
  // 图片加载完成处理
  const handleImageLoad = (index) => {
    setImageStatus(prev => ({
      ...prev,
      [index]: true
    }));
  };

  // 处理图片适应模式变更
  const handleFitModeChange = () => {
    // 在三种模式之间循环：高度适应 -> 宽度适应 -> 填满
    setFitMode(prev => {
      if (prev === 'height') return 'width';
      if (prev === 'width') return 'cover';
      return 'height';
    });
  };

  // 添加全屏功能
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // 进入全屏
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`全屏错误: ${err.message}`);
      });
    } else {
      // 退出全屏
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error(`退出全屏错误: ${err.message}`);
      });
    }
  }, []);
  
  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 渲染垂直阅读模式的内容
  const renderVerticalMode = () => (
    <div className="vertical-container" ref={containerRef}>
      {images.map((imgSrc, index) => (
        <div 
          key={imgSrc} 
          className="comic-page-wrapper"
          style={{ display: imageStatus[index] || index < 10 ? 'block' : 'none' }} // 增加初始显示图片数量到10张
        >
          {/* 使用div占位，避免布局跳动 */}
          <div 
            className="comic-page-placeholder"
            style={{ 
              paddingBottom: '150%', // 默认宽高比
              background: '#f0f0f0',
              display: imageStatus[index] ? 'none' : 'block'
            }}
          />
          
          <ImageWithFallback
            className="comic-page"
            src={imgSrc}
            alt={`第${index + 1}页`}
            useBaseUrl={true}
            onLoad={() => handleImageLoad(index)}
            style={{ display: imageStatus[index] ? 'block' : 'none' }}
          />
        </div>
      ))}
    </div>
  );

  // 渲染水平阅读模式的内容
  const renderHorizontalMode = () => (
    <div className="horizontal-container">
      <div className="page-container">
        <div className="current-page">
          <ImageWithFallback
            src={images[currentPage]}
            alt={`第${currentPage + 1}页`}
            useBaseUrl={true}
            className={`fit-${fitMode}`}
            style={{ objectFit: fitMode === 'cover' ? 'cover' : 'contain' }}
          />
        </div>
      </div>
    </div>
  );

  // 格式化章节名称
  const formatChapterName = (name) => {
    if (name === 'main') return '单章节';
    return name;
  };

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 清理定时器
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
      if (userScrollTimerRef.current) {
        clearTimeout(userScrollTimerRef.current);
      }
    };
  }, []);

  return (
    <div 
      className={`reader-container ${readingMode === 'vertical' ? 'vertical-mode' : 'horizontal-mode'}`}
      onClick={handleContainerClick}
    >
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p>加载漫画中...</p>
        </div>
      ) : (
        <>
          {readingMode === 'vertical' ? renderVerticalMode() : renderHorizontalMode()}
          
          <div className={`reader-controls ${showControls ? 'visible' : ''}`}>
            <div className="top-controls">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={handleBack}
              >
                返回
              </Button>
              
              <h1>{comicName} - {formatChapterName(currentChapter)}</h1>
              
              <Button 
                type="text" 
                icon={<HomeOutlined />} 
                onClick={handleHome}
              >
                首页
              </Button>
            </div>
          </div>
          
          <div className={`bottom-controls ${showControls ? 'visible' : ''}`}>
            <div className="slider-container">
              <Slider
                className="page-slider"
                min={0}
                max={images.length - 1}
                value={currentPage}
                onChange={handleManualPageChange}
                onAfterChange={(value) => {
                  // Slider完成拖动后再次确保滚动到正确位置
                  if (readingMode === 'vertical') {
                    setTimeout(() => scrollToPage(value), 100);
                  }
                }}
                tooltip={{
                  formatter: value => `${value + 1}/${images.length}`
                }}
              />
            </div>
            
            <div className="control-buttons">
              <div className="page-info">
                {currentPage + 1}/{images.length}
              </div>
              
              {availableChapters.length > 1 && (
                <div className="chapter-select">
                  <span>章节:</span>
                  <Select
                    value={currentChapter}
                    onChange={handleChapterChange}
                    style={{ width: 120 }}
                  >
                    {availableChapters.map(chap => (
                      <Select.Option key={chap} value={chap}>
                        {formatChapterName(chap)}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}
              
              <Tooltip title="阅读模式切换">
                <Button
                  icon={readingMode === 'vertical' ? <ColumnWidthOutlined /> : <VerticalAlignTopOutlined />}
                  onClick={handleReadingModeChange}
                />
              </Tooltip>
              
              {readingMode === 'horizontal' && (
                <Tooltip title={
                  fitMode === 'height' ? '适应高度 (当前)' : 
                  fitMode === 'width' ? '适应宽度' : '填满模式'
                }>
                  <Button
                    icon={
                      fitMode === 'height' ? <CompressOutlined /> : 
                      fitMode === 'width' ? <ColumnWidthOutlined /> : <FullscreenOutlined />
                    }
                    onClick={handleFitModeChange}
                  />
                </Tooltip>
              )}
              
              <Tooltip title={autoPlay ? '停止自动翻页' : '开始自动翻页'}>
                <Button
                  icon={autoPlay ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={() => setAutoPlay(!autoPlay)}
                />
              </Tooltip>
              
              {autoPlay && (
                <div className="interval-select">
                  <span>间隔:</span>
                  <Select
                    value={autoPlayInterval}
                    onChange={handleIntervalChange}
                    style={{ width: 80 }}
                  >
                    <Select.Option value={1}>1秒</Select.Option>
                    <Select.Option value={2}>2秒</Select.Option>
                    <Select.Option value={3}>3秒</Select.Option>
                    <Select.Option value={5}>5秒</Select.Option>
                    <Select.Option value={8}>8秒</Select.Option>
                    <Select.Option value={10}>10秒</Select.Option>
                  </Select>
                </div>
              )}
              
              <Tooltip title={isFullscreen ? '退出全屏' : '全屏阅读'}>
                <Button
                  icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  onClick={toggleFullscreen}
                />
              </Tooltip>
              
              <Tooltip title="隐藏控制栏">
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => setShowControls(false)}
                />
              </Tooltip>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reader;