# AI 写作助手 - 后端服务 🚀

基于 DeepSeek API 的智能写作工具后端服务

![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![Flask](https://img.shields.io/badge/flask-3.0+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ 功能特点

- 🎯 **智能大纲生成** - 根据主题自动生成结构化文章大纲
- 📝 **流式内容生成** - 使用 SSE 实现实时内容生成
- 🧠 **上下文感知** - 基于已生成内容智能续写
- 🔄 **长文本处理** - 自动摘要长内容，避免 token 溢出
- 🌐 **CORS 支持** - 完善的跨域配置
- 🐳 **Docker 支持** - 一键部署

## 🛠 技术栈

- **Flask 3.0+** - 轻量级 Web 框架
- **OpenAI SDK** - 调用 DeepSeek API
- **Flask-CORS** - 跨域资源共享
- **python-dotenv** - 环境变量管理

## 📦 安装

### 前置要求

- Python 3.8 或更高版本
- DeepSeek API Key（[获取地址](https://platform.deepseek.com/)）

### 快速开始

1. **克隆仓库**
```bash
git clone https://github.com/thunderderder/writing_backend.git
cd writing_backend
```

2. **创建虚拟环境**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **安装依赖**
```bash
pip install -r requirements.txt
```

4. **配置 API Key**

创建 `.env` 文件：
```bash
DEEPSEEK_API_KEY=your-deepseek-api-key-here
```

或者设置环境变量：
```bash
# Windows
set DEEPSEEK_API_KEY=your-deepseek-api-key-here

# Linux/Mac
export DEEPSEEK_API_KEY=your-deepseek-api-key-here
```

5. **启动服务**
```bash
python app.py
```

服务将在 `http://localhost:5000` 启动 🎉

## 📡 API 接口

### 1. 健康检查
```http
GET /api/health
```

**响应**
```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

### 2. 生成大纲
```http
POST /api/generate-outline
Content-Type: application/json

{
  "topic": "文章主题"
}
```

**响应**
```json
{
  "outline": "生成的大纲内容"
}
```

### 3. 生成章节内容
```http
POST /api/generate-section
Content-Type: application/json

{
  "topic": "文章主题",
  "outline": "完整大纲",
  "current_section": "当前章节",
  "previous_content": "已生成的内容"
}
```

**响应** - Server-Sent Events (SSE) 流式响应
```
data: {"content": "生成的内容片段"}
data: {"done": true}
```

### 4. 一次性生成所有内容
```http
POST /api/generate-all-content
Content-Type: application/json

{
  "topic": "文章主题",
  "outline": "完整大纲"
}
```

**响应** - SSE 流式响应

### 5. 批量生成章节
```http
POST /api/generate-sections-batch
Content-Type: application/json

{
  "topic": "文章主题",
  "outline": "完整大纲",
  "sections": ["章节1", "章节2"]
}
```

**响应** - SSE 流式响应

## 🐳 Docker 部署

### 构建镜像
```bash
docker build -t writing-backend .
```

### 运行容器
```bash
docker run -p 5000:5000 -e DEEPSEEK_API_KEY=your-key writing-backend
```

## 🚀 云平台部署

### Railway
1. 在 [Railway](https://railway.app) 创建新项目
2. 连接 GitHub 仓库
3. 添加环境变量 `DEEPSEEK_API_KEY`
4. Railway 会自动检测并部署

### Render
1. 在 [Render](https://render.com) 创建 Web Service
2. 连接 GitHub 仓库
3. 设置构建命令：`pip install -r requirements.txt`
4. 设置启动命令：`python app.py`
5. 添加环境变量 `DEEPSEEK_API_KEY`

### Heroku
```bash
heroku create your-app-name
heroku config:set DEEPSEEK_API_KEY=your-key
git push heroku main
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 是 | - |
| `PORT` | 服务端口 | 否 | 5000 |

### API 配置

在 `app.py` 中可以修改：
- `DEEPSEEK_BASE_URL` - API 基础 URL
- `DEEPSEEK_MODEL` - 使用的模型（默认：deepseek-chat）

## 📝 开发说明

### 项目结构
```
writing_backend/
├── app.py              # Flask 应用主文件
├── requirements.txt    # Python 依赖
├── Dockerfile         # Docker 配置
├── .env               # 环境变量（需自行创建）
└── README.md          # 项目说明
```

### 长文本处理策略

当已生成内容超过 3000 字符时，系统会：
1. 自动对之前的内容进行摘要
2. 保留最相关的上下文信息
3. 确保不超过 API token 限制

### CORS 配置

已配置允许所有来源访问，生产环境建议修改为：
```python
CORS(app, resources={r"/api/*": {"origins": "https://your-frontend-domain.com"}})
```

## 🤝 前端配套

本后端服务配套的前端项目：[writing_frontend](https://github.com/thunderderder/writing_frontend)

## 📄 许可证

MIT License

## 🙏 致谢

- [DeepSeek API](https://platform.deepseek.com/) - 提供 AI 能力
- [Flask](https://flask.palletsprojects.com/) - Web 框架

## 📮 联系方式

如有问题或建议，欢迎提 [Issue](https://github.com/thunderderder/writing_backend/issues)

