# 安装和配置指南

## 快速开始

### 1. 获取 DeepSeek API Key

1. 访问 [DeepSeek Platform](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在控制台中创建 API Key
4. 复制 API Key 备用

### 2. 安装后端

#### Windows 用户

双击运行 `install_backend.bat`，或者在命令行执行：

```bash
cd backend
pip install -r requirements.txt
```

#### Linux/Mac 用户

```bash
cd backend
pip install -r requirements.txt
```

### 3. 配置 API Key

有两种方式配置 API Key：

#### 方式 1：设置环境变量（推荐）

**Windows (PowerShell):**
```powershell
$env:DEEPSEEK_API_KEY="your-api-key-here"
```

**Windows (CMD):**
```cmd
set DEEPSEEK_API_KEY=your-api-key-here
```

**Linux/Mac:**
```bash
export DEEPSEEK_API_KEY=your-api-key-here
```

为了持久化，可以将环境变量添加到：
- Windows: 系统环境变量设置
- Linux/Mac: `~/.bashrc` 或 `~/.zshrc`

#### 方式 2：直接修改代码

编辑 `backend/app.py` 文件，找到这一行：

```python
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', 'your-deepseek-api-key-here')
```

将 `'your-deepseek-api-key-here'` 替换为你的实际 API Key。

### 4. 启动后端服务

#### Windows 用户

双击运行 `start_backend.bat`，或者：

```bash
cd backend
python app.py
```

#### Linux/Mac 用户

```bash
cd backend
python app.py
```

后端服务将在 `http://localhost:5000` 启动。

### 5. 安装前端

#### Windows 用户

双击运行 `install_frontend.bat`，或者：

```bash
cd frontend
npm install
```

#### Linux/Mac 用户

```bash
cd frontend
npm install
```

### 6. 启动前端服务

#### Windows 用户

双击运行 `start_frontend.bat`，或者：

```bash
cd frontend
npm start
```

#### Linux/Mac 用户

```bash
cd frontend
npm start
```

前端应用将在 `http://localhost:3000` 启动并自动打开浏览器。

## 故障排除

### 问题 1：后端启动失败

**错误信息：** `ModuleNotFoundError: No module named 'flask'`

**解决方案：** 确保已经安装了所有依赖：
```bash
cd backend
pip install -r requirements.txt
```

### 问题 2：API 调用失败

**错误信息：** `API Key 无效` 或 `401 Unauthorized`

**解决方案：** 
1. 检查 API Key 是否正确
2. 确认 API Key 已正确设置（环境变量或代码中）
3. 检查 DeepSeek 账户是否有足够的配额

### 问题 3：前端无法连接后端

**错误信息：** `Failed to fetch` 或 `Network Error`

**解决方案：**
1. 确保后端服务已启动（访问 http://localhost:5000/api/health 应该返回 `{"status":"ok"}`）
2. 检查防火墙设置
3. 确认前端配置的 API_BASE_URL 正确

### 问题 4：生成速度慢

**可能原因：**
1. 网络连接不稳定
2. DeepSeek API 响应较慢
3. 生成的内容较长

**解决方案：**
1. 检查网络连接
2. 尝试使用更简洁的主题描述
3. 使用"依次生成"模式，分段生成内容

### 问题 5：生成的内容质量不佳

**解决方案：**
1. 提供更详细、明确的主题描述
2. 生成大纲后，手动编辑优化大纲结构
3. 调整后端代码中的 temperature 参数（在 `backend/app.py` 中）

## 高级配置

### 修改模型参数

编辑 `backend/app.py`，找到 `query_deepseek` 函数：

```python
response = client.chat.completions.create(
    model=DEEPSEEK_MODEL,
    messages=messages,
    stream=stream,
    max_tokens=4000,      # 最大生成长度
    temperature=0.7       # 创造性（0-1，越高越有创造性）
)
```

可以调整：
- `max_tokens`: 控制生成内容的最大长度
- `temperature`: 控制生成内容的随机性和创造性

### 修改 API 端口

**后端端口：** 编辑 `backend/app.py`，最后一行：
```python
app.run(host='0.0.0.0', port=5000, debug=True)  # 修改 port 参数
```

**前端 API 地址：** 编辑 `frontend/src/App.tsx`：
```typescript
const API_BASE_URL = 'http://localhost:5000/api';  // 修改端口号
```

### 使用其他模型

DeepSeek 提供多个模型，可以在 `backend/app.py` 中修改：

```python
DEEPSEEK_MODEL = "deepseek-chat"  # 或其他可用模型
```

## 生产部署

### 后端部署

1. 使用生产级 WSGI 服务器（如 Gunicorn）：
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

2. 设置反向代理（Nginx）
3. 配置 HTTPS
4. 使用环境变量管理敏感信息

### 前端部署

1. 构建生产版本：
```bash
cd frontend
npm run build
```

2. 部署 build 目录到静态文件服务器（如 Nginx、Apache、或 Vercel）

3. 更新 API_BASE_URL 为生产环境的后端地址

## 开发建议

1. **代码修改后自动重载：** 后端使用 `debug=True` 模式，前端使用 `npm start` 都支持热重载
2. **日志查看：** 后端日志会在终端显示，前端日志在浏览器开发者工具中查看
3. **API 测试：** 可以使用 Postman 或 curl 测试后端 API

## 系统要求

- **Python:** 3.8 或更高版本
- **Node.js:** 16 或更高版本
- **npm:** 7 或更高版本
- **浏览器:** Chrome、Firefox、Safari、Edge（最新版本）
- **网络:** 能够访问 DeepSeek API（需要稳定的互联网连接）

## 许可证

本项目采用 MIT 许可证。

