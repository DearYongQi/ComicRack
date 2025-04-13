import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { List, Card, Button, Spin, Empty, message } from 'antd';
import { ArrowLeftOutlined, ReadOutlined } from '@ant-design/icons';
import { getComics } from '../../utils/api';
import ImageWithFallback from '../../components/ImageWithFallback';
import './style.scss';

/**
 * 章节列表页面组件
 * 展示选中漫画的所有章节
 * @returns {React.ReactElement} 章节列表页面组件
 */
const ChapterList = () => {
  const { comicName } = useParams();
  const navigate = useNavigate();
  const [comic, setComic] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // 获取漫画信息和章节列表
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
            
            // 处理章节信息
            const chaptersList = [];
            for (const key in foundComic.structure) {
              if (key !== 'main') {
                chaptersList.push({
                  name: key,
                  images: foundComic.structure[key]
                });
              }
            }
            
            // 按章节名称排序
            chaptersList.sort((a, b) => {
              // 检查是否为番外篇或特殊章节
              const isExtraA = /番外|特别|附录|番番|外传|后记|设定|角色|访谈|卷末/i.test(a.name);
              const isExtraB = /番外|特别|附录|番番|外传|后记|设定|角色|访谈|卷末/i.test(b.name);
              
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
              
              const numA = extractNumber(a.name);
              const numB = extractNumber(b.name);
              
              if (numA !== null && numB !== null) {
                return numA - numB;
              }
              
              // 如果都没有数字，按字符串排序
              return a.name.localeCompare(b.name, 'zh-CN');
            });
            
            setChapters(chaptersList);
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
  }, [comicName, navigate]);

  // 返回首页
  const handleBack = () => {
    navigate('/');
  };

  // 进入阅读页
  const handleRead = (chapterName) => {
    navigate(`/read/${encodeURIComponent(comicName)}/${encodeURIComponent(chapterName)}`);
  };

  return (
    <div className="chapter-list-container">
      <div className="chapter-list-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          className="back-button"
        >
          返回
        </Button>
        <h1>{comicName}</h1>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p>加载章节中...</p>
        </div>
      ) : chapters.length > 0 ? (
        <div className="chapter-content">
          {comic && comic.coverImage && (
            <div className="comic-banner">
              <ImageWithFallback 
                src={comic.coverImage} 
                alt={comicName} 
                useBaseUrl={true}
                className="comic-cover-image"
              />
            </div>
          )}
          
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 4,
              xxl: 6,
            }}
            dataSource={chapters}
            renderItem={(item) => (
              <List.Item>
                <Card 
                  className="chapter-card"
                  hoverable 
                  onClick={() => handleRead(item.name)}
                >
                  <div className="chapter-card-content">
                    <ReadOutlined className="chapter-icon" />
                    <div className="chapter-info">
                      <div className="chapter-name">{item.name}</div>
                      <div className="chapter-pages">{item.images.length} 页</div>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </div>
      ) : (
        <Empty description="没有找到章节" />
      )}
    </div>
  );
};

export default ChapterList; 