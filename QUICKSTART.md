# 快速启动指南 ⚡

## 5 分钟快速开始

### 前置条件

确保已安装：
- ✅ Python 3.8+ 
- ✅ Node.js 16+
- ✅ DeepSeek API Key（[免费注册](https://platform.deepseek.com/)）

### Step 1: 下载项目

```bash
git clone <repository-url>
cd long_context
```

或直接下载 ZIP 解压。

### Step 2: 配置 API Key

**选项 A - 设置环境变量（推荐）**

Windows PowerShell:
```powershell
$env:DEEPSEEK_API_KEY="sk-your-api-key-here"
```

Windows CMD:
```cmd
set DEEPSEEK_API_KEY=sk-your-api-key-here
```

Linux/Mac:
```bash
export DEEPSEEK_API_KEY=sk-your-api-key-here
```

**选项 B - 直接修改代码**

编辑 `backend/app.py`，第 17 行：
```python
DEEPSEEK_API_KEY = "sk-your-api-key-here"  # 替换为你的 API Key
```

### Step 3: 启动后端

**Windows 用户：**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Linux/Mac 用户：**
```bash
cd backend
pip3 install -r requirements.txt
python3 app.py
```

看到这个输出表示成功：
```
* Running on http://0.0.0.0:5000
```

### Step 4: 启动前端

打开**新的**终端窗口：

```bash
cd frontend
npm install
npm start
```

浏览器会自动打开 `http://localhost:3000`

## 开始使用 🎉

1. **输入主题**：例如"人工智能的发展历程"
2. **点击"生成大纲"**：等待 3-8 秒
3. **查看并编辑大纲**（右侧编辑器）
4. **选择生成模式**：
   - 依次生成：逐段生成，需要手动确认
   - 一次性生成：自动全部生成
5. **点击"开始生成内容"**：观看 AI 写作
6. **导出内容**：点击下载或复制按钮

## 快速问题排查

### ❌ 问题：后端启动失败

```bash
# 重新安装依赖
cd backend
pip install -r requirements.txt --upgrade
```

### ❌ 问题：前端启动失败

```bash
# 清理缓存并重新安装
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### ❌ 问题：API 调用失败

1. 检查 API Key 是否正确
2. 访问 http://localhost:5000/api/health 应该返回 `{"status":"ok"}`
3. 检查 DeepSeek 账户余额

### ❌ 问题：前端连接不上后端

1. 确保后端在运行（访问 http://localhost:5000/api/health）
2. 检查防火墙是否阻止了连接
3. 确认端口 5000 和 3000 没被占用

## Windows 一键启动（可选）

如果您是 Windows 用户，可以使用提供的批处理文件：

1. 双击 `install_backend.bat` - 安装后端依赖
2. 双击 `install_frontend.bat` - 安装前端依赖
3. 双击 `start_backend.bat` - 启动后端
4. 双击 `start_frontend.bat` - 启动前端

## 下一步

- 📖 阅读 [完整文档](README.md)
- 💡 查看 [使用示例](USAGE_EXAMPLES.md)
- 🔧 了解 [详细配置](SETUP.md)
- 📊 查看 [项目总结](PROJECT_SUMMARY.md)

## 需要帮助？

- 🐛 [提交 Issue](https://github.com/your-repo/issues)
- 💬 [社区讨论](https://github.com/your-repo/discussions)
- 📧 发送邮件：your-email@example.com

---

**祝您使用愉快！** 🚀

