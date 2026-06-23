# nemuran.me

空气喵的个人网站

## 功能

- 实时时钟显示
- 日期显示（年月日 + 星期）
- 音乐播放器
  - 自动读取 MP3 内嵌封面
  - 滚动同步歌词
  - 多平台跳转（网易云、QQ音乐、Bilibili、本地）
- 毛玻璃卡片设计
- 响应式布局
- 流畅动画效果

## 技术栈

- HTML5
- CSS3（毛玻璃效果、动画、响应式设计）
- JavaScript
- jsmediatags（读取音频元数据）

## 预览

直接打开 `index.html` 即可（音乐功能需启动本地服务器）

```bash
npx serve .
```

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

## 歌词文件格式

在 `file/music/lyrics.lrc` 中添加 LRC 格式歌词：

```
[00:15.50]歌词内容
[00:22.00]下一句歌词
```

## 许可

MIT
