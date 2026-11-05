# 个人作业

# 音乐播放器与歌单展示

一个基于 HTML、CSS 和原生 JavaScript/jQuery 制作的静态音乐播放器练习项目。页面提供本地歌曲推荐、播放控制、同步歌词和歌单展示，界面使用 Tailwind CSS 样式。

## 功能

- 在首页浏览推荐歌曲，点击歌曲卡片即可切换并播放本地音频。
- 使用底部播放栏播放或暂停歌曲，并调整音量。
- 对带有 LRC 文件的歌曲显示随播放进度更新的歌词；LRC 行尾括号中的内容会作为翻译显示。
- 浏览歌单推荐页，并通过侧边栏在页面间导航。
- 使用本地字体、专辑封面和背景图呈现页面样式。

> 当前是纯前端静态演示，没有后端或用户账号。歌单推荐使用页面内的示例数据；“我的喜欢”、列表页内容以及播放栏的上一首/下一首按钮尚未实现。

## 快速开始

### 浏览项目

使用 Python 启动本地 HTTP 服务，或使用 VS Code 的 Live Server，从项目根目录提供服务：

```bash
python -m http.server 8000
```

然后在浏览器打开 <http://localhost:8000/>。重新生成 Tailwind 样式时才需要安装 [Node.js](https://nodejs.org/) 和 npm。

建议通过本地 HTTP 服务访问，而不是直接双击 `index.html`：歌词由浏览器通过 HTTP 请求读取，部分浏览器在 `file://` 模式下会限制此操作。

### 监听 Tailwind CSS 样式

如果修改了 HTML 中使用的 Tailwind class 或 `tailwind_package/src/input.css`，可另开终端运行：

```bash
cd tailwind_package
npm install
npm run watch
```

CLI 会将样式输出到 `tailwind_package/src/output.css`。项目页面引用的正是这个文件。只浏览现有页面时无需运行 Tailwind 构建。

## 项目结构

```text
.
├── index.html                 # 音乐播放器首页
├── other_pages/
│   ├── songlist.html          # 歌单推荐页
│   └── list.html              # 列表页（页面内容尚未完成）
├── js/
│   ├── index.js               # 歌曲数据、卡片渲染、播放和歌词逻辑
│   ├── songlist.js            # 歌单推荐数据和渲染逻辑
│   └── layout.js              # 共用侧边栏交互
├── audio/                     # 本地音频
├── LRC/                       # 歌词文件
├── Album_Cover/               # 专辑封面
├── img/                       # 背景和头像图片
├── icon/                      # 图标
├── front/                     # 项目使用的字体
└── tailwind_package/
    ├── package.json           # Tailwind CLI 脚本和依赖
    └── src/
        ├── input.css          # Tailwind 输入样式和自定义字体
        └── output.css         # 页面引用的生成样式
```

## 添加歌曲

1. 将音频文件放入 `audio/`，封面放入 `Album_Cover/`。
2. 在 `js/index.js` 的 `songs` 数组中添加歌曲信息，填写歌曲名、歌手、封面相对路径和音频相对路径。
3. 如有歌词，将 `.lrc` 文件放入 `LRC/`，并在歌曲数据中填写 `lrcUrl`。路径以项目根目录为基准。
4. 刷新首页验证卡片、音频和歌词。没有 LRC 文件的歌曲会显示“纯音乐，请欣赏”。

歌单推荐卡片的数据维护在 `js/songlist.js` 的 `playlistData` 数组中。

## 技术栈

- HTML5、CSS、JavaScript
- jQuery（项目本地引用）
- Tailwind CSS 4 和 `@tailwindcss/cli`
