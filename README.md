# nemuran.me

空气喵的个人主页

## 功能

### 前台
- 实时时钟与日期显示
- 音乐播放器（歌词同步、进度拖拽、自动下一首）
- 底栏工具导航（自定义添加）
- 毛玻璃卡片 + 响应式布局

### 后台管理
- 歌曲管理（上传/编辑/删除）
- 图片管理（上传/删除/预览放大/滚轮缩放/拖拽移动）
- 底栏工具管理（增删改/排序）
- 站点设置（标题/昵称/毛玻璃/底栏开关）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JS（零框架） |
| 后端 | Node.js + Express |
| 数据库 | sql.js（纯 JS SQLite） |
| 认证 | JWT |
| 上传 | Multer（图片/音频类型校验，500MB 限制） |

## 项目结构

```
nemuran.me/
├── index.html                        # 前台主页面
├── background.webp                   # 默认背景
├── package.json
├── server/
│   ├── index.js                      # Express 入口
│   ├── middleware.js                  # JWT 中间件
│   ├── db/
│   │   ├── database.js               # 数据库初始化 + 自动扫描导入
│   │   └── nemuran.db                # SQLite（gitignore）
│   └── routes/
│       ├── auth.js                   # 登录/注册/改密
│       ├── settings.js               # 站点设置
│       ├── music.js                  # 歌曲 CRUD
│       ├── picture.js                # 图片管理
│       ├── dock.js                   # 底栏工具
│       └── upload.js                 # 文件上传
├── admin/index.html                  # 后台管理（SPA）
├── user/index.html                   # 用户中心
├── login/index.html                  # 登录页
├── src/
│   ├── configuration/config.json     # 默认配置
│   ├── dock tool/                    # 底栏组件
│   ├── music card/                   # 播放器组件
│   ├── setting/                      # 设置面板
│   ├── imgs/favicon_io/              # 图标
│   └── js/jsmediatags.min.js         # MP3 元数据读取
└── file/                             # 上传目录（gitignore）
    ├── music/
    └── picture/
```

## 快速开始

```bash
npm install
npm start
```

- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin
- 默认账号：`admin` / `123456`

## API

### 认证 /api/auth

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /login | 登录 | ✗ |
| POST | /register | 注册 | ✗ |
| GET | /me | 获取用户 | ✓ |
| PUT | /me | 更新用户 | ✓ |
| POST | /change-password | 修改密码 | ✓ |

### 站点设置 /api/settings

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | / | 获取设置 | ✗ |
| PUT | / | 更新设置 | ✓ |

### 歌曲 /api/music

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | / | 歌曲列表 | ✗ |
| POST | / | 添加歌曲 | ✓ |
| GET | /:id | 歌曲详情 | ✗ |
| PUT | /:id | 编辑歌曲 | ✓ |
| DELETE | /:id | 删除歌曲 | ✓ |
| GET | /:id/lyrics | 获取歌词 | ✗ |
| PUT | /:id/lyrics | 更新歌词 | ✓ |
| POST | /reorder | 排序 | ✓ |

### 图片 /api/picture

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | / | 图片列表 | ✗ |
| POST | / | 注册图片 | ✓ |
| PUT | /:id | 更新图片 | ✓ |
| DELETE | /:id | 删除图片 | ✓ |

### 底栏工具 /api/dock

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | / | 工具列表 | ✗ |
| POST | / | 添加工具 | ✓ |
| PUT | /:id | 编辑工具 | ✓ |
| DELETE | /:id | 删除工具 | ✓ |
| POST | /reorder | 排序 | ✓ |

### 文件上传 /api/upload

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /music | 上传音乐（多文件） | ✓ |
| POST | /picture | 上传图片 | ✓ |

## 数据库

| 表名 | 说明 |
|------|------|
| users | 用户账号 |
| settings | 站点设置（key-value） |
| music | 歌曲信息 |
| picture | 图片列表 |
| dock_tools | 底栏工具 |

## 部署

```bash
# PM2
pm2 start server/index.js --name nemuran

# Docker
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server/index.js"]
```

## 许可

MIT
