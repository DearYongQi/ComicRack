# ComicRack 后端

这是ComicRack漫画阅读器的后端服务，基于NodeJS和Express开发。

## 功能
- 提供漫画文件的访问接口
- 管理漫画收藏列表（使用NeDB数据库）
- 静态文件服务

## 安装

```bash
# 安装依赖
npm install
```

## 目录说明

- `manhua/` - 漫画目录（需要自行创建）
- `data/` - 数据存储目录，包含NeDB数据库文件

## 启动

```bash
# 开发模式启动
npm run dev

# 生产模式启动
npm start
```

## 漫画文件夹

将漫画文件放在项目根目录的`manhua`文件夹中，支持以下两种结构：

1. 单章节漫画：
```
manhua/漫画标题/00001.jpg, 00002.jpg, 等
```

2. 多章节漫画：
```
manhua/漫画标题/第一话/00001.jpg, 00002.jpg, 等
manhua/漫画标题/第二话/00001.jpg, 00002.jpg, 等
```

## API接口

### 获取所有漫画
```
GET /api/comics
```
返回漫画根目录下所有漫画的结构数据，包括封面图片路径和章节信息。

### 获取收藏列表
```
GET /api/favorites
```
返回用户收藏的漫画列表。

### 添加收藏
```
POST /api/favorites
```
请求体：
```json
{
  "name": "漫画名称"
}
```

### 取消收藏
```
DELETE /api/favorites
```
请求体：
```json
{
  "name": "漫画名称"
}
```

### 静态文件访问
```
GET /comics/[漫画名称]/[章节名称]/[图片名称]
```
直接访问漫画图片资源。 