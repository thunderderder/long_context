# 📦 Git 仓库设置指南

如果你还没有将项目推送到 Git，按照以下步骤操作。

## 🎯 为什么需要 Git？

- ✅ 版本控制
- ✅ 团队协作
- ✅ 自动部署（Vercel、Railway 等需要）
- ✅ 备份代码

## 📝 步骤

### 1. 初始化 Git 仓库

在项目根目录运行：

```bash
git init
```

### 2. 添加所有文件

```bash
git add .
```

### 3. 创建首次提交

```bash
git commit -m "Initial commit: AI Writing Assistant"
```

### 4. 在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 仓库名称：`ai-writing-assistant`（或你喜欢的名字）
3. 选择 **Public** 或 **Private**
4. **不要**勾选 "Initialize with README"
5. 点击 "Create repository"

### 5. 推送到 GitHub

复制 GitHub 提供的命令，类似：

```bash
git remote add origin https://github.com/your-username/ai-writing-assistant.git
git branch -M main
git push -u origin main
```

### 6. 验证

访问你的 GitHub 仓库页面，应该看到所有文件。

## 🔐 注意事项

### ⚠️ 确保敏感信息不被提交

在提交前，确认：

```bash
# 检查 .gitignore 是否生效
git status

# 不应该看到这些文件：
# .env
# backend/.env
# frontend/.env
# node_modules/
```

如果看到了敏感文件，运行：

```bash
git rm --cached .env
git rm --cached backend/.env
git rm --cached frontend/.env
```

## 📤 后续更新

每次修改代码后：

```bash
# 1. 查看修改
git status

# 2. 添加修改
git add .

# 3. 提交
git commit -m "描述你的修改"

# 4. 推送
git push
```

## 🚀 连接部署平台

### Vercel

1. 访问 https://vercel.com
2. 点击 "New Project"
3. 选择你的 GitHub 仓库
4. Vercel 会自动检测并部署

### Railway

1. 访问 https://railway.app
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的仓库
5. Railway 会自动部署

## 💡 常用 Git 命令

```bash
# 查看状态
git status

# 查看提交历史
git log --oneline

# 创建新分支
git checkout -b feature-name

# 切换分支
git checkout main

# 合并分支
git merge feature-name

# 拉取远程更新
git pull

# 撤销修改
git checkout -- filename

# 查看远程仓库
git remote -v
```

## 🔄 CI/CD 自动部署

一旦连接 GitHub：

1. **Vercel**：推送到 main 分支自动部署前端
2. **Railway**：推送到 main 分支自动部署后端
3. **GitHub Actions**：自动运行测试和构建

查看 `.github/workflows/` 目录了解详情。

## ❓ 常见问题

### Q: 如何撤销最后一次提交？

```bash
# 保留修改
git reset --soft HEAD~1

# 丢弃修改
git reset --hard HEAD~1
```

### Q: 如何修改最后一次提交信息？

```bash
git commit --amend -m "新的提交信息"
```

### Q: 如何删除远程分支？

```bash
git push origin --delete branch-name
```

### Q: 如何解决冲突？

1. 拉取最新代码：`git pull`
2. 打开冲突文件，手动解决
3. 标记为已解决：`git add .`
4. 提交：`git commit -m "解决冲突"`
5. 推送：`git push`

## 📚 学习资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 指南](https://guides.github.com/)
- [廖雪峰 Git 教程](https://www.liaoxuefeng.com/wiki/896043488029600)

---

完成 Git 设置后，就可以使用云平台的自动部署功能了！🎉

