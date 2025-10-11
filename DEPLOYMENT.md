# 🚀 部署指南

本指南将帮助你把 AI 写作助手部署到公网，让其他人也能访问使用。

## 📋 目录

1. [部署准备](#部署准备)
2. [方案一：使用 Vercel + Railway（推荐）](#方案一使用-vercel--railway推荐)
3. [方案二：使用 Railway（全栈）](#方案二使用-railway全栈)
4. [方案三：使用云服务器（VPS）](#方案三使用云服务器vps)
5. [方案四：使用 Docker](#方案四使用-docker)
6. [环境变量配置](#环境变量配置)
7. [域名配置](#域名配置)
8. [安全建议](#安全建议)

---

## 部署准备

### 必需准备

1. **DeepSeek API Key**
   - 访问 [DeepSeek Platform](https://platform.deepseek.com/)
   - 注册账号并获取 API Key
   - 确保账户有足够的额度

2. **Git 仓库**（推荐）
   - 将项目推送到 GitHub/GitLab
   - 方便持续部署和更新

3. **域名**（可选）
   - 如果想要自定义域名，需要提前购买

---

## 方案一：使用 Vercel + Railway（推荐）

这是最简单、快速且免费的部署方案。

### 优点
- ✅ 免费额度充足
- ✅ 部署简单，几分钟完成
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 自动化部署

### 步骤

#### 1. 部署后端到 Railway

1. 访问 [Railway](https://railway.app/)
2. 使用 GitHub 账号登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择你的项目仓库
5. Railway 会自动检测到 Python 项目，配置如下：
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
6. 添加环境变量：
   - `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key
   - `PORT`: `8000`
   - `DEBUG`: `False`
7. 部署完成后，会得到一个后端 URL，例如：`https://your-app.up.railway.app`

#### 2. 配置前端环境变量

在项目根目录创建 `frontend/.env.production` 文件：

```env
REACT_APP_API_URL=https://your-app.up.railway.app
```

#### 3. 部署前端到 Vercel

1. 访问 [Vercel](https://vercel.com/)
2. 使用 GitHub 账号登录
3. 点击 "Add New" → "Project"
4. 选择你的项目仓库
5. 配置部署设置：
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. 添加环境变量：
   - `REACT_APP_API_URL`: Railway 的后端 URL
7. 点击 "Deploy"
8. 部署完成后，会得到一个前端 URL，例如：`https://your-app.vercel.app`

#### 4. 配置 CORS

修改 Railway 的环境变量，添加允许的前端域名：
- `ALLOWED_ORIGINS`: `https://your-app.vercel.app`

或者修改 `backend/app.py` 中的 CORS 配置：

```python
CORS(app, origins=[
    "https://your-app.vercel.app",
    "http://localhost:3000"  # 本地开发
])
```

---

## 方案二：使用 Railway（全栈）

将前后端都部署在 Railway 上。

### 步骤

#### 1. 准备项目

在项目根目录创建 `railway.json`：

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && python app.py & cd frontend && npm start",
    "healthcheckPath": "/api/health"
  }
}
```

#### 2. 创建启动脚本

在项目根目录创建 `start.sh`：

```bash
#!/bin/bash

# 启动后端
cd backend
python app.py &

# 构建并启动前端
cd ../frontend
npm install
npm run build
npx serve -s build -l 3000
```

赋予执行权限：
```bash
chmod +x start.sh
```

#### 3. 部署到 Railway

按照方案一中的 Railway 步骤部署，但使用整个项目作为根目录。

---

## 方案三：使用云服务器（VPS）

适合有一定运维经验的用户，提供完全的控制权。

### 推荐服务商

- 国外：AWS, DigitalOcean, Linode, Vultr
- 国内：阿里云, 腾讯云, 华为云

### 步骤

#### 1. 购买并连接服务器

```bash
ssh root@your-server-ip
```

#### 2. 安装依赖

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Python 3.8+
apt install python3 python3-pip -y

# 安装 Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install nodejs -y

# 安装 Nginx
apt install nginx -y

# 安装 Git
apt install git -y
```

#### 3. 克隆项目

```bash
cd /var/www
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

#### 4. 配置后端

```bash
cd backend

# 安装 Python 依赖
pip3 install -r requirements.txt

# 安装 Gunicorn（生产级 WSGI 服务器）
pip3 install gunicorn

# 创建环境变量文件
cat > .env << EOF
DEEPSEEK_API_KEY=your-deepseek-api-key-here
PORT=8000
DEBUG=False
EOF

# 创建 systemd 服务
cat > /etc/systemd/system/ai-writing-backend.service << EOF
[Unit]
Description=AI Writing Assistant Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/your-repo/backend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=/var/www/your-repo/backend/.env
ExecStart=/usr/local/bin/gunicorn -w 4 -b 0.0.0.0:8000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
systemctl daemon-reload
systemctl start ai-writing-backend
systemctl enable ai-writing-backend
```

#### 5. 构建前端

```bash
cd /var/www/your-repo/frontend

# 安装依赖
npm install

# 创建生产环境配置
echo "REACT_APP_API_URL=https://your-domain.com" > .env.production

# 构建
npm run build
```

#### 6. 配置 Nginx

```bash
cat > /etc/nginx/sites-available/ai-writing << EOF
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/your-repo/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 启用站点
ln -s /etc/nginx/sites-available/ai-writing /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 7. 配置 SSL（HTTPS）

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 获取证书
certbot --nginx -d your-domain.com

# 自动续期
systemctl enable certbot.timer
```

---

## 方案四：使用 Docker

适合熟悉容器技术的用户。

### 步骤

#### 1. 创建 Dockerfile（后端）

在 `backend` 目录下创建 `Dockerfile`：

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
```

#### 2. 创建 Dockerfile（前端）

在 `frontend` 目录下创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3. 创建 Nginx 配置

在 `frontend` 目录下创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. 创建 docker-compose.yml

在项目根目录创建：

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: ai-writing-backend
    environment:
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - PORT=8000
      - DEBUG=False
    ports:
      - "8000:8000"
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: ai-writing-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

#### 5. 部署

```bash
# 创建 .env 文件
echo "DEEPSEEK_API_KEY=your-api-key-here" > .env

# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

---

## 环境变量配置

### 后端环境变量

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | ✅ | - |
| `PORT` | 后端端口 | ❌ | 8000 |
| `DEBUG` | 调试模式 | ❌ | False |
| `ALLOWED_ORIGINS` | 允许的前端域名（CORS） | ❌ | * |

### 前端环境变量

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `REACT_APP_API_URL` | 后端 API 地址 | ✅ | http://localhost:8000 |

---

## 域名配置

### 使用 Cloudflare（推荐）

1. 在 Cloudflare 添加你的域名
2. 添加 A 记录或 CNAME 记录指向你的服务器/平台
3. 开启 SSL/TLS（Full 模式）
4. 可选：开启 WAF、DDoS 防护等

### DNS 记录示例

```
A     @       your-server-ip
A     www     your-server-ip
CNAME api     your-backend.railway.app
```

---

## 安全建议

### 1. API Key 保护

- ❌ **永远不要**在代码中硬编码 API Key
- ✅ 使用环境变量
- ✅ 使用密钥管理服务（如 AWS Secrets Manager）

### 2. 访问控制

考虑添加以下功能：

- 用户认证（登录系统）
- API 速率限制
- IP 白名单
- 使用配额管理

在 `backend/app.py` 中添加速率限制：

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/generate-outline', methods=['POST'])
@limiter.limit("10 per hour")
def generate_outline():
    # ... 现有代码
```

### 3. HTTPS

- ✅ 强制使用 HTTPS
- ✅ 使用 Let's Encrypt 免费证书
- ✅ 配置 HSTS

### 4. 监控与日志

- 设置错误监控（如 Sentry）
- 记录 API 调用日志
- 监控 API 使用量和成本

### 5. 更新依赖

定期更新依赖以修复安全漏洞：

```bash
# Python
pip list --outdated
pip install --upgrade package-name

# Node.js
npm outdated
npm update
```

---

## 成本估算

### 免费方案（适合个人/小型项目）

- **Vercel**: 前端托管（免费）
- **Railway**: 后端托管（每月 $5 免费额度）
- **Cloudflare**: CDN + DNS（免费）
- **DeepSeek API**: 按使用量计费

**预计月成本**: $0-10

### 付费方案（适合商业项目）

- **AWS/阿里云**: 服务器（$10-50/月）
- **域名**: $10-15/年
- **CDN**: 按流量计费
- **DeepSeek API**: 按使用量计费

**预计月成本**: $20-100+

---

## 故障排查

### 后端无法启动

1. 检查 API Key 是否正确配置
2. 检查端口是否被占用
3. 查看日志：`journalctl -u ai-writing-backend -f`

### 前端无法连接后端

1. 检查 CORS 配置
2. 检查 API URL 是否正确
3. 检查网络防火墙设置

### API 调用失败

1. 检查 DeepSeek API 额度
2. 检查网络连接
3. 查看后端日志

---

## 后续优化

部署完成后，可以考虑：

1. ✅ 添加用户系统
2. ✅ 添加内容保存功能（数据库）
3. ✅ 添加导出为 Word/PDF 功能
4. ✅ 添加多语言支持
5. ✅ 添加使用统计和分析
6. ✅ 优化 UI/UX
7. ✅ 添加移动端适配

---

## 需要帮助？

如果在部署过程中遇到问题，可以：

1. 查看项目的 GitHub Issues
2. 查看各平台的官方文档
3. 在社区寻求帮助

祝部署顺利！🎉

