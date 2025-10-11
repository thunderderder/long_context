# ⚡ 快速部署指南

本指南将帮助你在 5 分钟内完成部署！

## 🎯 选择你的部署方式

### 方式 1️⃣: Docker 部署（最简单，推荐新手）

**适用于**: 本地测试、小型团队内部使用

```bash
# Windows
deploy_docker.bat

# Linux/Mac
chmod +x deploy_docker.sh
./deploy_docker.sh
```

完成后访问: http://localhost

---

### 方式 2️⃣: 免费云平台（Vercel + Railway）

**适用于**: 公网访问、个人项目

**步骤**:

1. **部署后端到 Railway** (2分钟)
   - 访问 https://railway.app
   - 用 GitHub 登录
   - 点击 "New Project" → "Deploy from GitHub repo"
   - 选择此仓库
   - 设置 Root Directory 为 `backend`
   - 添加环境变量 `DEEPSEEK_API_KEY`
   - 复制生成的 URL（如 `https://xxx.up.railway.app`）

2. **部署前端到 Vercel** (2分钟)
   - 访问 https://vercel.com
   - 用 GitHub 登录
   - 点击 "Add New" → "Project"
   - 选择此仓库
   - 设置 Root Directory 为 `frontend`
   - 添加环境变量:
     - `REACT_APP_API_URL` = Railway 的 URL
   - 点击 "Deploy"

3. **完成！** 🎉
   - 访问 Vercel 提供的 URL

**成本**: 免费（每月有额度限制）

---

### 方式 3️⃣: 云服务器（完全控制）

**适用于**: 商业项目、高流量应用

**推荐服务商**:
- 国外: DigitalOcean, Vultr, Linode
- 国内: 阿里云, 腾讯云

**快速步骤**:

```bash
# 1. 连接服务器
ssh root@your-server-ip

# 2. 一键安装脚本
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. 克隆项目
git clone https://github.com/your-username/your-repo.git
cd your-repo

# 4. 配置环境变量
cp .env.example .env
nano .env  # 编辑并保存

# 5. 启动
docker-compose up -d

# 6. 配置域名和 SSL（可选）
# 参考 DEPLOYMENT.md 的详细步骤
```

完成后访问: http://your-server-ip

---

## 🔑 必需配置

无论哪种方式，你都需要：

### 1. DeepSeek API Key

```bash
# 获取步骤:
1. 访问 https://platform.deepseek.com/
2. 注册/登录
3. 创建 API Key
4. 复制 key（格式: sk-xxxxxx）
```

### 2. 环境变量

创建并编辑相应的环境变量文件:

**Docker 方式**: 编辑 `.env`
```env
DEEPSEEK_API_KEY=sk-your-key-here
```

**云平台方式**: 在平台控制台设置
- Railway: 在 Variables 选项卡添加
- Vercel: 在 Environment Variables 添加

---

## ✅ 验证部署

### 检查后端

访问健康检查接口:
```
http://your-backend-url/api/health
```

应该返回:
```json
{"status": "ok"}
```

### 检查前端

打开浏览器访问前端 URL，你应该看到:
- 左侧有"主题输入"框
- 右侧有编辑器
- 界面正常显示

### 测试功能

1. 输入一个主题（如"人工智能的发展"）
2. 点击"生成大纲"
3. 等待几秒，应该看到生成的大纲
4. 点击"开始生成内容"
5. 查看内容逐步生成

---

## ⚠️ 常见问题

### 问题 1: API Key 无效

**症状**: 点击生成后报错 "Incorrect API key"

**解决**:
- 检查 API Key 是否正确复制（注意空格）
- 确认 API Key 在 DeepSeek 平台是激活状态
- 重新启动服务

### 问题 2: 前端无法连接后端

**症状**: 点击生成没反应，或显示网络错误

**解决**:
- 检查后端是否正常运行
- 检查 `REACT_APP_API_URL` 是否正确
- 检查 CORS 设置（后端是否允许前端域名）
- 打开浏览器控制台查看错误

### 问题 3: Docker 启动失败

**症状**: `docker-compose up` 报错

**解决**:
- 确认 Docker 正在运行
- 确认 .env 文件存在且配置正确
- 检查端口 80 和 8000 是否被占用
- 运行 `docker-compose logs` 查看详细错误

### 问题 4: Railway/Vercel 部署失败

**症状**: 部署过程中出错

**解决**:
- 检查是否正确设置了 Root Directory
- 确认环境变量已添加
- 查看平台的构建日志
- 确认项目结构完整（package.json, requirements.txt 等）

---

## 📊 性能优化

部署成功后，可以考虑以下优化:

### 1. 使用 CDN

推荐使用 Cloudflare:
- 免费
- 自动 HTTPS
- DDoS 防护
- 全球加速

### 2. 添加缓存

修改 Nginx 配置，添加静态文件缓存。

### 3. 监控

设置以下监控:
- 服务器状态监控（CPU、内存、磁盘）
- API 调用监控
- 错误日志监控

推荐工具:
- UptimeRobot（免费）
- Sentry（错误追踪）
- Google Analytics（访问统计）

---

## 🔒 安全检查清单

在公开部署前，确认以下事项:

- [ ] API Key 不在代码中硬编码
- [ ] 使用环境变量管理敏感信息
- [ ] 启用 HTTPS（使用 SSL 证书）
- [ ] 配置适当的 CORS 策略
- [ ] 考虑添加用户认证
- [ ] 考虑添加 API 速率限制
- [ ] 设置防火墙规则
- [ ] 定期更新依赖包
- [ ] 设置自动备份
- [ ] 监控 API 使用量和成本

---

## 📚 下一步

部署完成后，你可能想要:

1. **自定义域名**: 参考 DEPLOYMENT.md 的域名配置章节
2. **添加功能**: 
   - 用户登录系统
   - 保存历史记录
   - 导出为 PDF/Word
   - 多语言支持
3. **优化体验**:
   - 改进 UI 设计
   - 添加移动端支持
   - 提高生成速度
4. **商业化**:
   - 添加付费功能
   - 集成支付系统
   - 设置使用配额

---

## 🆘 需要帮助？

如果遇到问题:

1. 查看完整部署文档: [DEPLOYMENT.md](DEPLOYMENT.md)
2. 查看项目 README: [README.md](README.md)
3. 查看错误日志
4. 在 GitHub Issues 提问

---

## 🎉 部署成功！

恭喜你完成部署！现在你可以:

- ✅ 开始使用 AI 写作助手
- ✅ 分享给朋友和同事
- ✅ 收集用户反馈
- ✅ 持续改进和优化

祝使用愉快！✨

