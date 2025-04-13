/**
 * ComicRack 后端主入口文件
 * 提供漫画文件读取和收藏管理API
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const Datastore = require('nedb');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(express.json());

// 漫画文件夹路径 - 改为应用根目录下
const COMICS_DIR = path.join(__dirname, 'manhua');
// 确保漫画目录存在
fs.ensureDirSync(COMICS_DIR);

// 初始化NeDB数据库
const dbPath = path.join(__dirname, 'data');
fs.ensureDirSync(dbPath);
const db = new Datastore({
  filename: path.join(dbPath, 'favorites.db'),
  autoload: true
});

// 提供静态文件访问 - 直接映射为/manhua路径
app.use('/manhua', express.static(COMICS_DIR));

/**
 * 获取所有漫画列表
 * 返回所有漫画目录及其结构
 */
app.get('/api/comics', async (req, res) => {
  try {
    const comics = [];
    
    // 确保漫画文件夹存在
    if (!fs.existsSync(COMICS_DIR)) {
      return res.json({ success: true, data: [] });
    }

    // 读取漫画根目录
    const comicFolders = await fs.readdir(COMICS_DIR);
    
    // 遍历每个漫画文件夹
    for (const comicFolder of comicFolders) {
      const comicPath = path.join(COMICS_DIR, comicFolder);
      const stat = await fs.stat(comicPath);
      
      // 跳过非文件夹
      if (!stat.isDirectory()) continue;
      
      // 读取漫画文件夹内容
      const contents = await fs.readdir(comicPath);
      
      // 检查是否有子文件夹(章节)
      const hasChapters = contents.some(item => {
        try {
          const itemPath = path.join(comicPath, item);
          return fs.statSync(itemPath).isDirectory();
        } catch (err) {
          return false;
        }
      });
      
      // 查找封面图片 - 优先使用标准命名的文件
      let coverImage = null;
      
      // 定义标准封面文件名
      const standardCoverNames = ['00001.webp', '00001.jpg', '00001.jpeg', '00001.png'];
      
      if (hasChapters) {
        // 1. 首先在漫画根目录查找标准命名的封面
        for (const coverName of standardCoverNames) {
          if (contents.includes(coverName)) {
            coverImage = `/manhua/${encodeURIComponent(comicFolder)}/${encodeURIComponent(coverName)}`;
            break;
          }
        }
        
        // 2. 优先使用第一话的第一张图片作为封面
        if (!coverImage) {
          // 获取所有章节目录并排序
          const chapterDirs = [];
          for (const item of contents) {
            const itemPath = path.join(comicPath, item);
            try {
              if (fs.statSync(itemPath).isDirectory()) {
                chapterDirs.push(item);
              }
            } catch (err) {
              // 忽略读取错误
            }
          }
          
          // 排序章节，确保"第一话"等排在前面
          chapterDirs.sort((a, b) => {
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
          
          // 找出正常章节（非番外篇）
          const normalChapters = chapterDirs.filter(
            dir => !/番外|特别|附录|番番|外传|后记|设定|角色|访谈|卷末/i.test(dir)
          );
          
          // 优先选择正常章节的第一话，如果没有正常章节，则使用排序后的第一个章节
          const firstChapter = normalChapters.length > 0 ? normalChapters[0] : (chapterDirs.length > 0 ? chapterDirs[0] : null);
          
          if (firstChapter) {
            const chapterPath = path.join(comicPath, firstChapter);
            
            try {
              const chapterFiles = await fs.readdir(chapterPath);
              
              // 先查找标准命名的图片
              for (const coverName of standardCoverNames) {
                if (chapterFiles.includes(coverName)) {
                  coverImage = `/manhua/${encodeURIComponent(comicFolder)}/${encodeURIComponent(firstChapter)}/${encodeURIComponent(coverName)}`;
                  break;
                }
              }
              
              // 如果还没找到，使用章节中第一张排序后的图片
              if (!coverImage) {
                const images = chapterFiles
                  .filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
                  .sort();
                
                if (images.length > 0) {
                  coverImage = `/manhua/${encodeURIComponent(comicFolder)}/${encodeURIComponent(firstChapter)}/${encodeURIComponent(images[0])}`;
                }
              }
            } catch (err) {
              console.error(`读取章节失败: ${firstChapter}`, err);
            }
          }
        }
      } else {
        // 如果没有章节，直接在漫画目录查找标准命名的封面
        for (const coverName of standardCoverNames) {
          if (contents.includes(coverName)) {
            coverImage = `/manhua/${encodeURIComponent(comicFolder)}/${encodeURIComponent(coverName)}`;
            break;
          }
        }
        
        // 如果没找到标准命名的封面，使用第一张排序后的图片
        if (!coverImage) {
          const images = contents
            .filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
            .sort();
          
          if (images.length > 0) {
            coverImage = `/manhua/${encodeURIComponent(comicFolder)}/${encodeURIComponent(images[0])}`;
          }
        }
      }
      
      // 不设置默认占位图，让前端处理找不到封面的情况
      
      // 解析漫画结构
      const structure = {};
      
      for (const item of contents) {
        const itemPath = path.join(comicPath, item);
        try {
          const itemStat = await fs.stat(itemPath);
          
          if (itemStat.isDirectory()) {
            // 章节文件夹
            const chapterImages = await fs.readdir(itemPath);
            // 过滤图片文件并排序
            const images = chapterImages
              .filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
              .sort();
            
            structure[item] = images.map(img => `/manhua/${encodeURIComponent(comicFolder)}/${encodeURIComponent(item)}/${encodeURIComponent(img)}`);
          } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(item)) {
            // 如果是直接放在根目录的图片，添加到 'main' 属性
            if (!structure.main) {
              structure.main = [];
            }
            structure.main.push(`/manhua/${encodeURIComponent(comicFolder)}/${encodeURIComponent(item)}`);
          }
        } catch (err) {
          console.error(`处理文件失败: ${item}`, err);
          continue;
        }
      }
      
      // 如果有 'main' 属性，确保它是排序的
      if (structure.main) {
        structure.main.sort();
      }
      
      comics.push({
        name: comicFolder,
        hasChapters,
        coverImage,
        structure
      });
    }
    
    res.json({ success: true, data: comics });
  } catch (error) {
    console.error('获取漫画列表失败:', error);
    res.status(500).json({ success: false, message: '获取漫画列表失败' });
  }
});

/**
 * 获取收藏的漫画列表
 */
app.get('/api/favorites', (req, res) => {
  db.find({}, (err, docs) => {
    if (err) {
      console.error('获取收藏列表失败:', err);
      return res.status(500).json({ success: false, message: '获取收藏列表失败' });
    }
    
    // 从结果中提取名称
    const favorites = docs.map(doc => doc.name);
    res.json({ success: true, data: favorites });
  });
});

/**
 * 添加漫画到收藏
 * @param {string} name - 漫画名称
 */
app.post('/api/favorites', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: '漫画名称不能为空' });
  }
  
  // 先检查是否已存在
  db.findOne({ name }, (err, doc) => {
    if (err) {
      console.error('添加收藏失败:', err);
      return res.status(500).json({ success: false, message: '添加收藏失败' });
    }
    
    // 如果不存在，则添加
    if (!doc) {
      db.insert({ name, createdAt: new Date() }, (err) => {
        if (err) {
          console.error('添加收藏失败:', err);
          return res.status(500).json({ success: false, message: '添加收藏失败' });
        }
        
        // 添加成功后，返回最新的收藏列表
        db.find({}, (err, docs) => {
          if (err) {
            console.error('获取收藏列表失败:', err);
            return res.status(500).json({ success: false, message: '获取收藏列表失败' });
          }
          
          const favorites = docs.map(doc => doc.name);
          res.json({ success: true, data: favorites });
        });
      });
    } else {
      // 已存在则直接返回当前列表
      db.find({}, (err, docs) => {
        if (err) {
          console.error('获取收藏列表失败:', err);
          return res.status(500).json({ success: false, message: '获取收藏列表失败' });
        }
        
        const favorites = docs.map(doc => doc.name);
        res.json({ success: true, data: favorites });
      });
    }
  });
});

/**
 * 从收藏中移除漫画
 * @param {string} name - 漫画名称
 */
app.delete('/api/favorites', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: '漫画名称不能为空' });
  }
  
  // 从数据库中移除
  db.remove({ name }, {}, (err) => {
    if (err) {
      console.error('移除收藏失败:', err);
      return res.status(500).json({ success: false, message: '移除收藏失败' });
    }
    
    // 移除成功后，返回最新的收藏列表
    db.find({}, (err, docs) => {
      if (err) {
        console.error('获取收藏列表失败:', err);
        return res.status(500).json({ success: false, message: '获取收藏列表失败' });
      }
      
      const favorites = docs.map(doc => doc.name);
      res.json({ success: true, data: favorites });
    });
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，监听端口: ${PORT}`);
  console.log(`漫画文件夹路径: ${COMICS_DIR}`);
  console.log(`静态文件访问地址: http://localhost:${PORT}/manhua/`);
}); 