# ComicRack 本地漫画阅读器

ComicRack是一个本地漫画阅读应用，通过Web界面提供对存储在计算机上的漫画的访问和阅读。支持多种阅读模式，收藏功能，并且对不同设备提供响应式设计。

## 项目结构

```
ComicRack/
├── ComicRack-nodejs/       # 后端代码
│   ├── index.js            # 主服务器文件
│   ├── package.json        # 后端依赖
│   ├── data/               # 数据存储(NeDB数据库)
│   └── manhua/             # 漫画文件目录
│       ├── 漫画标题1/
│       │   ├── 第一话/
│       │   │   ├── 00001.jpg
│       │   │   ├── 00002.jpg
│       │   │   └── ...
│       │   └── 第二话/
│       └── 漫画标题2/
│           ├── 00001.jpg
│           ├── 00002.jpg
│           └── ...
│
└── ComicRack-react/        # 前端代码
    ├── public/             # 静态资源
    └── src/                # React源代码
        ├── components/     # 可复用组件
        ├── pages/          # 页面组件
        └── utils/          # 工具函数
```

## 功能特性

- 响应式网格布局浏览漫画
- 搜索和筛选漫画
- 收藏喜爱的漫画
- 支持垂直或水平阅读模式
- 自动播放模式，可定制时间间隔
- 支持章节导航
- 明暗主题切换
- 漫画图片懒加载
- 适配桌面、平板和移动设备的响应式设计

## 安装和设置

### 后端设置

1. 进入后端目录：
   ```
   cd ComicRack-nodejs
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 在后端目录下创建漫画文件夹：
   ```
   mkdir manhua
   ```

4. 启动服务器：
   ```
   npm run dev
   ```
   服务器将在 http://localhost:3001 启动。

### 前端设置

1. 进入前端目录：
   ```
   cd ComicRack-react
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 启动开发服务器：
   ```
   npm start
   ```
   应用将在 http://localhost:3000 可用。

## 漫画目录结构

将您的漫画放在后端目录下的 `manhua` 文件夹中。应用支持两种文件夹结构：

1. 单章节漫画：
   ```
   ComicRack-nodejs/manhua/漫画标题/00001.jpg, 00002.jpg, 等
   ```

2. 多章节漫画：
   ```
   ComicRack-nodejs/manhua/漫画标题/第一话/00001.jpg, 00002.jpg, 等
   ComicRack-nodejs/manhua/漫画标题/第二话/00001.jpg, 00002.jpg, 等
   ```

应用将自动检测结构并相应调整。

## API接口

### 后端API

| 接口 | 方法 | 描述 | 请求体 | 响应 |
|----------|--------|-------------|-------------|----------|
| `/api/comics` | GET | 获取所有漫画 | - | `{success: true, data: [comics]}` |
| `/api/favorites` | GET | 获取收藏漫画 | - | `{success: true, data: [names]}` |
| `/api/favorites` | POST | 添加漫画到收藏 | `{name: "漫画名称"}` | `{success: true, data: [updated_favorites]}` |
| `/api/favorites` | DELETE | 从收藏中移除漫画 | `{name: "漫画名称"}` | `{success: true, data: [updated_favorites]}` |
| `/comics/**` | GET | 静态文件访问 | - | 漫画图片文件 |

## 前端依赖

- React & React DOM (^18.2.0)
- React Router DOM (^6.15.0)
- Ant Design (^5.9.0)
- Axios (^1.5.0)
- Sass (^1.66.1)

## 后端依赖

- Express (^4.18.2)
- CORS (^2.8.5)
- fs-extra (^11.1.1)
- NeDB (^1.8.0)
- Path (^0.12.7)
- Nodemon (^3.0.1) - 开发依赖

## 注意事项

1. 确保在启动服务器前，在后端目录下创建 `manhua` 目录。
2. 为了更好的性能，使用优化的图片格式，如WebP或JPEG。
3. 应用会自动选择文件夹中的第一张图片作为封面图。
4. 对于多章节漫画，点击漫画时应用将显示章节选择界面。
5. 适配各种设备需确保在不同宽度的设备上进行测试。
6. 黑夜模式切换功能会保存到本地存储，下次访问时会记住您的偏好。
7. 后端使用NeDB作为数据库，它是一个轻量级的JavaScript数据库，不需要额外安装和配置。 