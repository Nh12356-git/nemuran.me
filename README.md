# nemuran.me

空气喵的个人网站

## 功能

- 实时时钟显示
- 日期显示（年月日 + 星期）
- Aplayer 音乐播放器
  - 支持在线音乐源
  - 歌词同步显示
  - 播放列表管理
- 自适应底栏（快捷工具导航，支持自定义添加）
- 页面设置
  - 站点信息（昵称、标题）
  - 显示效果（毛玻璃、底栏）
- 高级设置
  - 播放源链接配置
  - 导入/导出配置
  - 重置所有设置
- 毛玻璃卡片设计
- 响应式布局
- 流畅动画效果

## 技术栈

- HTML5
- CSS3（毛玻璃效果、动画、响应式设计）
- Vanilla JavaScript（零框架依赖）
- Aplayer（开源网页音乐播放器）

## 项目结构

```
nemuran.me/
├── index.html              # 主页面
├── background.webp         # 背景图片
├── imgs/                   # 图片资源
├── file/
│   ├── music/
│   │   ├── music.mp3       # 音乐文件
│   │   ├── lyrics.lrc      # 歌词文件
│   │   └── cover.jpg       # 封面图片（可选，自动读取内嵌封面）
│   └── js/
│       └── jsmediatags.min.js
└── README.md
```

## 使用方法

### 本地预览

```bash
npx serve .
```

访问 `http://localhost:3000`

### 配置在线音乐

在 `file/configuration/config.json` 的 `playlist` 数组中添加歌曲：

```json
{
    "name": "歌曲名称",
    "artist": "歌手",
    "url": "https://example.com/music.mp3",
    "cover": "https://example.com/cover.jpg",
    "lrc": "https://example.com/lyrics.lrc"
}
```

### 数据存储

- 用户配置保存在浏览器 localStorage 中
- 点击「导出配置」可下载配置文件备份
- 导入配置文件可恢复所有设置

## 许可

MIT
