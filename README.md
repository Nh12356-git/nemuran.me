# nemuran.me

空气喵的个人主页

## 功能

- 实时时钟与日期显示（年月日 + 星期）
- 音乐播放器
  - 歌单列表弹窗，点击切换歌曲
  - 每次刷新自动从 MP3 内嵌标签读取标题、歌手、封面
  - LRC 歌词同步滚动 / MP3 内嵌歌词自动识别
  - 进度条拖拽
  - 歌名/歌手鼠标悬停从左向右滚动显示完整名称
  - 播放结束自动下一首
- 自适应底栏工具导航
  - 支持自定义添加快捷工具
  - 自动获取网站图标
  - 悬浮移除
- 页面设置面板（毛玻璃侧栏）
  - 站点信息（昵称可选，默认「默认用户」）
  - 显示效果（毛玻璃开关、底栏开关）
  - 壁纸切换（默认背景 + 自定义上传）
- 高级设置
  - 播放源链接配置
  - 导入/导出配置（JSON，以昵称命名）
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
├── index.html                      # 主页面
├── background.webp                 # 默认背景图片
├── src/
│   ├── configuration/
│   │   ├── config.json             # 默认配置
│   │   └── user.json               # 用户配置模板
│   ├── dock tool/
│   │   ├── dock.js                 # 底栏管理器
│   │   └── dock.css                # 底栏样式
│   ├── music card/
│   │   ├── music.js                # 音乐播放器逻辑
│   │   └── music.css               # 音乐播放器样式
│   ├── setting/
│   │   ├── setting.js              # 页面设置面板逻辑
│   │   └── setting.css             # 页面设置面板样式
│   ├── imgs/favicon_io/            # 网站图标（ICO/PNG/WEBMANIFEST）
│   └── js/
│       └── jsmediatags.min.js      # MP3 元数据读取库
└── file/
    ├── music/
    │   ├── list.json               # 歌曲索引（ID → 文件夹映射）
    │   ├── カンザキイオリ - 命に嫌われている/
    │   │   ├── music.mp3
    │   │   └── lyrics.lrc
    │   ├── 兰音Reine - 生きる/
    │   │   ├── 兰音Reine - 生きる.mp3
    │   │   └── lyrics.lrc
    │   └── ...                     # 每首歌曲独立文件夹
    └── picture/                    # 壁纸图片目录
```

## 添加新歌曲

1. 在 `file/music/` 下创建新文件夹，命名为 `歌手名 - 歌曲名`
2. 将 MP3 文件和 lyrics.lrc 放入文件夹
3. 在 `file/music/list.json` 中添加一条记录：

```json
{
    "id": 6,
    "folder": "歌手名 - 歌曲名",
    "file": "歌手名 - 歌曲名.mp3",
    "title": "歌曲名",
    "artist": "歌手名"
}
```

> 歌曲标题、歌手、封面每次刷新会从 MP3 内嵌标签自动读取，list.json 中的 title/artist 仅作备用。

## 底栏工具

在 `src/configuration/config.json` 的 `dockTools` 数组中预设：

```json
[
    { "name": "工具名", "url": "https://example.com", "icon": "https://example.com/favicon.ico" }
]
```

也可通过页面底部的「+」按钮动态添加。

## 添加壁纸

将图片文件放入 `file/picture/` 目录，然后在 `src/setting/setting.js` 的 `WallpaperManager.getBuiltinFiles` 方法中添加文件名：

```js
getBuiltinFiles() {
    return ['existing.webp', 'your-new-wallpaper.webp'];
}
```

在页面设置面板中即可选择切换。

## 数据存储

- 所有用户设置保存在浏览器 `localStorage`（key: `nemuran_settings`）
- 支持导出为 JSON 文件备份（以昵称命名），导入即可恢复

## 本地运行

```bash
npx serve .
```

访问 `http://localhost:3000`

## 许可

MIT
