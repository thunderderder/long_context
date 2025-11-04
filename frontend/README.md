# AI 写作助手 - 前端应用 ✨

基于 React + TypeScript 的智能写作工具前端界面

![React](https://img.shields.io/badge/react-18+-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ 功能特点

- 🎯 **智能大纲生成** - 输入主题，AI 自动生成结构化文章大纲
- ✏️ **可编辑大纲** - 支持对生成的大纲进行自由编辑和修改
- 📝 **分段写作** - 根据大纲的每个章节自动生成内容
- 🔄 **两种生成模式**：
  - **依次生成模式** - 每生成一段后需要用户确认再继续
  - **一次性生成模式** - 自动连续生成所有内容
- 🧠 **上下文感知** - 生成时考虑已生成的内容，保持文章连贯性
- 👁️ **实时预览** - 支持 Markdown 格式的实时预览
- 💾 **导出功能** - 支持复制到剪贴板和下载为 Markdown/Word 文件
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🎨 **现代化 UI** - 清爽美观的用户界面

## 🛠 技术栈

- **React 18** - UI 框架
- **TypeScript 5** - 类型安全
- **React Markdown** - Markdown 渲染
- **Remark/Rehype** - Markdown 处理
- **HTML-Docx-JS** - Word 文档导出

## 📦 安装

### 前置要求

- Node.js 16 或更高版本
- npm 或 yarn

### 快速开始

1. **克隆仓库**
```bash
git clone https://github.com/thunderderder/writing_frontend.git
cd writing_frontend
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **配置后端 API 地址**

在 `src/App.tsx` 中修改 API 地址：
```typescript
const API_BASE_URL = 'http://localhost:5000'; // 修改为你的后端地址
```

4. **启动开发服务器**
```bash
npm start
# 或
yarn start
```

应用将在 `http://localhost:3000` 启动并自动打开浏览器 🎉

## 🏗️ 构建

### 开发构建
```bash
npm run build
```

构建产物将输出到 `build/` 目录。

## 🐳 Docker 部署

### 构建镜像
```bash
docker build -t writing-frontend .
```

### 运行容器
```bash
docker run -p 3000:80 writing-frontend
```

## 🚀 云平台部署

### Vercel（推荐）
1. 在 [Vercel](https://vercel.com) 导入 GitHub 仓库
2. Vercel 会自动检测 React 应用
3. 设置环境变量（如需要）
4. 点击部署，几分钟内完成

### Netlify
1. 在 [Netlify](https://netlify.com) 导入仓库
2. 构建命令：`npm run build`
3. 发布目录：`build`
4. 点击部署

### GitHub Pages
```bash
npm install --save-dev gh-pages
```

在 `package.json` 中添加：
```json
{
  "homepage": "https://yourusername.github.io/writing_frontend",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

部署：
```bash
npm run deploy
```

## 📂 项目结构

```
writing_frontend/
├── public/
│   └── index.html          # HTML 模板
├── src/
│   ├── components/         # React 组件
│   │   ├── LeftPanel.tsx   # 左侧控制面板
│   │   ├── RightPanel.tsx  # 右侧内容面板
│   │   ├── SectionManager.tsx          # 章节管理
│   │   ├── CompactSectionManager.tsx   # 紧凑章节管理
│   │   ├── EditSectionDialog.tsx       # 编辑对话框
│   │   ├── RegenerateDialog.tsx        # 重新生成对话框
│   │   ├── EditableMarkdownPanel.tsx   # 可编辑 Markdown 面板
│   │   └── PreviewPanel.tsx            # 预览面板
│   ├── utils/
│   │   └── wordExporter.ts # Word 导出工具
│   ├── App.tsx             # 主应用组件
│   ├── App.css             # 应用样式
│   ├── index.tsx           # 入口文件
│   └── index.css           # 全局样式
├── package.json            # 依赖配置
├── tsconfig.json           # TypeScript 配置
└── README.md              # 项目说明
```

## 🎨 组件说明

### LeftPanel（左侧面板）
- 主题输入
- 大纲生成
- 生成模式选择
- 内容生成控制

### RightPanel（右侧面板）
- 标签页切换（大纲/内容/预览）
- 可编辑 Markdown 编辑器
- 实时 Markdown 预览
- 导出功能（复制/下载）

### SectionManager（章节管理器）
- 显示所有章节
- 单独生成/重新生成章节
- 章节状态管理

### EditableMarkdownPanel（可编辑面板）
- Markdown 编辑
- 实时预览
- 复制/下载功能

## 🔧 配置说明

### API 配置

在 `src/App.tsx` 中修改后端 API 地址：
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

或通过环境变量配置：
```bash
# .env
REACT_APP_API_URL=https://your-backend-api.com
```

### 样式定制

主要样式文件：
- `src/App.css` - 应用主样式
- `src/index.css` - 全局样式
- `src/components/*.css` - 组件样式

## 🎯 使用方法

1. **输入主题** - 在左侧输入框输入想要写作的主题
2. **生成大纲** - 点击"生成大纲"按钮，AI 创建文章大纲
3. **编辑大纲** - 在"大纲"标签页查看和修改生成的大纲
4. **选择模式** - 选择"依次生成"或"一次性生成"
5. **开始生成** - 点击"开始生成内容"，AI 根据大纲创作文章
6. **查看预览** - 在"预览"标签页查看渲染后的效果
7. **导出内容** - 使用工具栏按钮复制或下载内容

## 🤝 后端配套

本前端应用配套的后端服务：[writing_backend](https://github.com/thunderderder/writing_backend)

## 📝 开发指南

### 本地开发
```bash
npm start
```

### 代码检查
```bash
npm run lint
```

### 类型检查
```bash
npm run type-check
```

### 构建生产版本
```bash
npm run build
```

## 🌟 特性亮点

### 流式渲染
使用 Server-Sent Events (SSE) 实现内容的实时流式显示，提供流畅的用户体验。

### Markdown 支持
完整支持 Markdown 语法，包括：
- 标题、列表、引用
- 代码块（带语法高亮）
- 表格、链接、图片
- 更多...

### 导出功能
- **复制到剪贴板** - 一键复制 Markdown 内容
- **下载 Markdown** - 保存为 .md 文件
- **导出 Word** - 转换为 .docx 格式

## 📄 许可证

MIT License

## 🙏 致谢

- [React](https://reactjs.org/) - UI 框架
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown 渲染
- [DeepSeek API](https://platform.deepseek.com/) - AI 能力支持

## 📮 联系方式

如有问题或建议，欢迎提 [Issue](https://github.com/thunderderder/writing_frontend/issues)

