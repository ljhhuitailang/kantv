# DecoTV 功能改进 - 快速入门

本次更新添加了三项重要功能，下面是快速使用指南。

## ✅ 功能 1: Cloudflare Pages + D1 数据库部署

### 快速部署步骤
```bash
# 1. 创建 D1 数据库
wrangler d1 create decotv-db

# 2. 复制返回的 database_id，填入 wrangler.toml

# 3. 设置环境变量（在 Cloudflare Dashboard）
NEXT_PUBLIC_STORAGE_TYPE=d1
USERNAME=admin
PASSWORD=your_password

# 4. 部署到 Cloudflare Pages
# 方法 A: 通过 Git 自动部署（推荐）
# 方法 B: 使用 wrangler CLI 部署
```

📖 **详细文档**: [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)

---

## ✅ 功能 2: 用户级别成人内容过滤

### 管理后台操作
1. 登录管理后台
2. 进入"用户管理"页面
3. 在用户列表找到"成人内容过滤"列
4. 点击开关控制：
   - 🟢 **已开启** = 过滤成人内容
   - 🔴 **已关闭** = 不过滤（该用户可查看成人内容）

### 优先级说明
```
URL 参数（?adult=1） > 用户设置 > 全局设置
```

### 权限
- **站长**：可配置所有用户
- **管理员**：可配置普通用户
- **普通用户**：无权修改

---

## ✅ 功能 3: Docker Compose 一键部署

### 快速启动
```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 编辑 .env，设置管理员账号
nano .env

# 3. 启动服务
docker-compose up -d

# 4. 访问应用
# 打开浏览器访问 http://localhost:3000
```

### 常用命令
```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps
```

---

## 📋 文件清单

### 新增文件
- `src/lib/d1.db.ts` - D1 数据库适配器
- `wrangler.toml` - Cloudflare 配置
- `CLOUDFLARE_DEPLOYMENT.md` - 部署指南
- `docker-compose.yml` - Docker 配置
- `UPDATE_NOTES.md` - 详细更新说明

### 备份文件
所有修改的原始文件已备份到 `beifen/` 目录

---

## 🚀 立即开始

### 选择部署方式

#### 🌐 Cloudflare Pages（推荐）
- ✅ 免费额度充足
- ✅ 全球 CDN 加速
- ✅ 零运维成本

👉 [查看部署指南](./CLOUDFLARE_DEPLOYMENT.md)

#### 🐳 Docker 部署
- ✅ 本地部署
- ✅ 完全控制
- ✅ 一键启动

👉 运行: `docker-compose up -d`

---

## ❓ 常见问题

### Q1: 如何切换数据库类型？
修改环境变量 `NEXT_PUBLIC_STORAGE_TYPE`：
- `localstorage` - 浏览器本地存储（无需数据库）
- `redis` - Redis 数据库
- `upstash` - Upstash Redis
- `kvrocks` - Kvrocks（推荐）
- `d1` - Cloudflare D1（Cloudflare Pages 部署）

### Q2: 如何为用户配置成人内容过滤？
1. 登录管理后台
2. 用户管理 → 找到用户
3. 点击"成人内容过滤"列的开关

### Q3: Docker 部署数据保存在哪里？
数据保存在 Docker volume：
- Kvrocks: `kvrocks-data`
- Redis: `redis-data`（如果启用）

### Q4: 如何查看 Docker 日志？
```bash
docker-compose logs -f
```

---

## 📞 获取帮助

- 📖 完整文档: [UPDATE_NOTES.md](./UPDATE_NOTES.md)
- 🌐 Cloudflare 部署: [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)
- 🐛 提交问题: [GitHub Issues](https://github.com/your-repo/issues)

---

**祝使用愉快！**
