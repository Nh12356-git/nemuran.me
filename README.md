# nemuran.me

空气喵的个人主页

## 功能

### 前台
- 实时时钟与日期显示（年月日 + 星期）
- 音乐播放器
  - 歌单列表弹窗，点击切换歌曲
  - 每次刷新自动从 MP3 内嵌标签读取标题、歌手、封面
  - LRC 歌词同步滚动 / MP3 内嵌歌词自动识别
  - 进度条点击 + 拖拽
  - 歌名/歌手鼠标悬停从左向右滚动显示完整名称
  - 播放结束自动下一首
  - 键盘快捷键（空格=播放暂停，←→=快进快退5秒）
- 自适应底栏工具导航（自定义添加/悬浮移除）
- 毛玻璃卡片设计 + 流畅动画
- 响应式布局（桌面/平板/手机）

### 后台管理系统
- 歌曲管理（添加/编辑/删除，含文件删除）
- 壁纸管理（上传/删除/设置默认）
- 底栏工具管理（添加/编辑/删除/排序）
- 站点设置（标题/昵称/毛玻璃/底栏开关）

## 技术栈

### 前端
- HTML5
- CSS3（毛玻璃、动画、响应式）
- Vanilla JavaScript（零框架依赖）
- jsmediatags（读取 MP3 内嵌元数据）

### 后端
- Node.js + Express
- sql.js（纯 JS SQLite 数据库，无需编译）
- JWT 认证
- Multer（文件上传）

## 项目结构

```
nemuran.me/
├── index.html                          # 前台主页面
├── background.webp                     # 默认背景图片
├── package.json                        # Node.js 依赖配置
├── server/
│   ├── index.js                        # Express 服务入口
│   ├── middleware.js                    # JWT 认证中间件
│   ├── db/
│   │   ├── database.js                 # 数据库初始化（sql.js）
│   │   └── nemuran.db                  # SQLite 数据库文件
│   └── routes/
│       ├── auth.js                     # 登录/改密接口
│       ├── settings.js                 # 站点设置 API
│       ├── songs.js                    # 歌曲 CRUD API
│       ├── wallpapers.js               # 壁纸管理 API
│       ├── dock.js                     # 底栏工具 API
│       └── upload.js                   # 文件上传 API
├── admin/
│   └── index.html                      # 后台管理页面（SPA）
├── src/
│   ├── dock tool/                      # 底栏组件
│   ├── music card/                     # 音乐播放器组件
│   ├── setting/                        # 设置面板组件
│   ├── imgs/favicon_io/                # 网站图标
│   └── js/jsmediatags.min.js           # MP3 元数据读取库
└── file/
    ├── music/                          # 音乐文件目录
    │   └── 歌手名 - 歌曲名/
    │       ├── *.mp3
    │       └── lyrics.lrc
    └── picture/                        # 壁纸图片目录
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm start
```

### 访问

- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin
- 默认账号：`admin` / `admin123`

## API 接口

| 方法 | 路径 | 说明 | 需认证 |
|------|------|------|--------|
| POST | /api/login | 登录 | ❌ |
| GET | /api/settings | 获取站点设置 | ❌ |
| PUT | /api/settings | 更新站点设置 | ✅ |
| GET | /api/songs | 获取歌曲列表 | ❌ |
| POST | /api/songs | 添加歌曲 | ✅ |
| PUT | /api/songs/:id | 编辑歌曲 | ✅ |
| DELETE | /api/songs/:id | 删除歌曲 | ✅ |
| GET | /api/songs/:id/lyrics | 获取歌词 | ❌ |
| PUT | /api/songs/:id/lyrics | 更新歌词 | ✅ |
| GET | /api/wallpapers | 获取壁纸列表 | ❌ |
| POST | /api/wallpapers | 添加壁纸 | ✅ |
| DELETE | /api/wallpapers/:id | 删除壁纸 | ✅ |
| GET | /api/dock | 获取底栏工具 | ❌ |
| POST | /api/dock | 添加工具 | ✅ |
| PUT | /api/dock/:id | 编辑工具 | ✅ |
| DELETE | /api/dock/:id | 删除工具 | ✅ |
| POST | /api/upload/music | 上传音乐文件 | ✅ |
| POST | /api/upload/wallpaper | 上传壁纸 | ✅ |

## 数据库表

| 表名 | 说明 |
|------|------|
| users | 管理员账号 |
| settings | 站点设置（key-value） |
| songs | 歌曲信息 |
| wallpapers | 壁纸列表 |
| dock_tools | 底栏工具 |

## 部署

### PM2 部署

```bash
npm install -g pm2
pm2 start server/index.js --name nemuran
pm2 save
pm2 startup
```

### Docker 部署

```dockerfile
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
