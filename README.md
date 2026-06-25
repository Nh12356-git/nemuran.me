# nemuran.me

空气喵的个人主页

## 功能

- 实时时钟与日期显示（年月日 + 星期）
- 音乐播放器
  - LRC 歌词同步滚动
  - 进度条拖拽
  - 自动读取 MP3 内嵌封面
  - 支持跳转网易云/QQ音乐/Bilibili
- 自适应底栏工具导航
  - 支持自定义添加快捷工具(默认有百度，360搜索，bing,bilbil,steam++)
  - 自动获取网站图标
  - 悬浮移除
- 页面设置面板
  - 站点信息（昵称、标题）
  - 显示效果（毛玻璃开关、底栏开关）
  - 壁纸切换（默认背景 + file/picture 目录下的图片）
- 高级设置
  - 播放源链接配置
  - 导入/导出配置（JSON）
  - 重置所有设置
- 毛玻璃卡片设计 + 流畅动画
- 响应式布局（桌面/平板/手机）
- 用户配置持久化存储（localStorage）

## 技术栈

- HTML5
- CSS3（毛玻璃、动画、响应式）
- Vanilla JavaScript（零框架依赖）
- jsmediatags（读取 MP3 内嵌元数据）

## 项目结构

```
nemuran.me/
├── index.html                  # 主页面
├── background.webp             # 背景图片
├── src/
│   ├── configuration/
│   │   ├── config.json         # 默认配置（站点/音乐/显示/底栏）
│   │   └── user.json           # 用户配置模板
│   ├── dock tool/
│   │   ├── dock.js             # 底栏管理器
│   │   └── dock.css            # 底栏样式
│   ├── music card/
│   │   ├── music.js            # 音乐播放器逻辑
│   │   └── music.css           # 音乐播放器样式
│   ├── setting/
│   │   ├── setting.js          # 页面设置面板逻辑
│   │   └── setting.css         # 页面设置面板样式
│   ├── imgs/
│   │   └── favicon_io/
│   │       └── favicon.svg
│   └── js/
│       └── jsmediatags.min.js  # MP3 元数据读取库
└── file/
    ├── music/
    │   ├── music.mp3           # 本地音乐文件
    │   └── lyrics.lrc          # 歌词文件
    └── picture/                # 壁纸图片目录
        └── *.webp              # 可切换的壁纸
```

## 配置说明

### 添加在线音乐

编辑 `src/configuration/config.json`，在 `music.playlist` 数组中添加：

```json
{
    "name": "歌曲名称",
    "artist": "歌手",
    "url": "https://example.com/music.mp3",
    "cover": "https://example.com/cover.jpg",
    "lrc": "https://example.com/lyrics.lrc"
}
```

### 底栏工具

在 `src/configuration/config.json` 的 `dockTools` 数组中预设：

```json
[
    { "name": "工具名", "url": "https://example.com", "icon": "https://example.com/favicon.ico" }
]
```

也可通过页面底部的「+」按钮动态添加。

### 添加壁纸

将图片文件放入 `file/picture/` 目录，然后在 `index.html` 的 `WallpaperManager.scanWallpapers` 方法中添加文件名：

```js
const pictureFiles = [
    '5fszgXeOxmL3Wdv.webp',
    'your-new-wallpaper.webp'
];
```

在页面设置面板中即可选择切换。

### 数据存储

- 所有用户设置保存在浏览器 `localStorage`（key: `nemuran_settings`）
- 支持导出为 JSON 文件备份，导入即可恢复

## 本地运行

```bash
npx serve .
```

访问 `http://localhost:3000`

## 许可

MIT
