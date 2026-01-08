# Cloudflare Pages + D1 部署指南

本指南将帮助你将 KanTV 部署到 Cloudflare Pages，并使用 D1 数据库存储数据。

## 前置要求

1. Cloudflare 账号
2. 安装 Wrangler CLI: `npm install -g wrangler`
3. 登录 Cloudflare: `wrangler login`

## 步骤 1: 创建 D1 数据库

```bash
# 创建 D1 数据库
wrangler d1 create kantv-db

# 命令会返回数据库 ID，类似:
# ✅ Successfully created DB 'kantv-db'
#
# [[d1_databases]]
# binding = "DB"
# database_name = "kantv-db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**重要**: 将返回的 `database_id` 复制并填入 `wrangler.toml` 文件中。

## 步骤 2: 初始化数据库表结构

D1 数据库会在首次使用时自动创建表结构，无需手动初始化。

如果需要手动初始化，可以创建 SQL 文件并执行：

```bash
# 创建初始化脚本 schema.sql（可选）
wrangler d1 execute decotv-db --file=./schema.sql
```

## 步骤 3: 配置环境变量

### 3.1 更新 wrangler.toml

确保 `wrangler.toml` 中的 `database_id` 已正确填写。

### 3.2 在 Cloudflare Dashboard 设置 Secrets

前往 Cloudflare Dashboard > Pages > 你的项目 > Settings > Environment variables

添加以下环境变量：

**必填变量：**
- `USERNAME` (Secret): 管理员用户名
- `PASSWORD` (Secret): 管理员密码
- `NEXT_PUBLIC_STORAGE_TYPE`: `d1`

**可选变量：**
- `NEXT_PUBLIC_SITE_NAME`: 站点名称（默认: KanTV）
- `NEXT_PUBLIC_ENABLE_REGISTRATION`: 是否启用用户注册（true/false）
- `NEXT_PUBLIC_SEARCH_MAX_PAGE`: 搜索最大页数（默认: 5）
- `NEXT_PUBLIC_DISABLE_YELLOW_FILTER`: 是否禁用成人内容过滤（true/false）
- `NEXT_PUBLIC_FLUID_SEARCH`: 是否启用流式搜索（true/false）

## 步骤 4: 部署到 Cloudflare Pages

### 方法 1: 通过 Git 自动部署（推荐）

1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Dashboard 创建 Pages 项目
3. 连接你的 Git 仓库
4. 配置构建设置：
   - **Framework preset**: Next.js
   - **Build command**: `pnpm build` 或 `npm run build`
   - **Build output directory**: `.next`
   - **Node version**: 20

5. 在 Settings > Functions 中绑定 D1 数据库：
   - Variable name: `DB`
   - D1 database: 选择你创建的 `kantv-db`

6. 点击 "Save and Deploy"

### 方法 2: 使用 Wrangler CLI 部署

```bash
# 构建项目
pnpm build

# 部署到 Cloudflare Pages
wrangler pages deploy .next --project-name=kantv

# 绑定 D1 数据库
wrangler pages deployment create --project-name=kantv --branch=main --binding DB=kantv-db
```

## 步骤 5: 配置自定义域名（可选）

1. 前往 Cloudflare Dashboard > Pages > 你的项目 > Custom domains
2. 添加你的域名
3. 按照提示配置 DNS 记录

## 本地开发

使用 Cloudflare Pages 本地开发环境：

```bash
# 1. 创建 .dev.vars 文件（从 .dev.vars.example 复制）
cp .dev.vars.example .dev.vars

# 2. 编辑 .dev.vars，填入你的配置

# 3. 使用 Wrangler 启动本地开发服务器
wrangler pages dev -- pnpm dev

# 或者使用标准 Next.js 开发服务器（不支持 D1，需使用其他存储）
pnpm dev
```

## 数据库管理

### 查看数据库信息

```bash
wrangler d1 info decotv-db
```

### 执行 SQL 查询

```bash
# 查看所有表
wrangler d1 execute decotv-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# 查看用户列表
wrangler d1 execute decotv-db --command="SELECT username FROM users"

# 导出数据
wrangler d1 export decotv-db --output=backup.sql
```

### 数据备份与恢复

```bash
# 备份数据库
wrangler d1 export decotv-db --output=backup.sql

# 恢复数据库
wrangler d1 execute decotv-db --file=backup.sql
```

## 故障排查

### D1 数据库连接失败

1. 检查 `wrangler.toml` 中的 `database_id` 是否正确
2. 确保在 Cloudflare Dashboard 中正确绑定了 D1 数据库
3. 检查环境变量 `NEXT_PUBLIC_STORAGE_TYPE` 是否设置为 `d1`

### 表不存在错误

D1 数据库会在首次使用时自动创建表结构。如果遇到表不存在的错误：

1. 检查应用日志，确认初始化是否成功
2. 手动执行初始化脚本（如果有）

### 构建失败

1. 确保 Node.js 版本为 20 或更高
2. 检查依赖是否正确安装：`pnpm install`
3. 本地测试构建：`pnpm build`

## 性能优化

1. **启用缓存**: Cloudflare Pages 自动缓存静态资源
2. **使用 CDN**: Cloudflare 全球 CDN 加速内容分发
3. **D1 查询优化**:
   - 使用索引加速查询
   - 批量操作使用 `batch()` 方法
   - 避免频繁的小查询

## 费用说明

- **Cloudflare Pages**: 免费套餐提供 500 次构建/月，无限请求
- **D1 数据库**:
  - 免费套餐: 5GB 存储，100,000 次读取/天，50,000 次写入/天
  - 超出部分按使用量计费

详细定价: https://developers.cloudflare.com/pages/pricing/

## 相关文档

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

## 需要帮助？

如果遇到问题，请访问：
- [项目 GitHub Issues](https://github.com/your-repo/issues)
- [Cloudflare 社区论坛](https://community.cloudflare.com/)
