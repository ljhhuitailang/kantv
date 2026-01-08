# KanTV 更新说明 - v1.2.0

本次更新增加了三项重要功能改进：

## 1. Cloudflare Pages + D1 数据库支持

### 新增功能
- ✅ 支持 Cloudflare D1 数据库存储
- ✅ 完整的 Cloudflare Pages 部署配置
- ✅ 自动初始化数据库表结构
- ✅ 支持所有核心功能（用户、播放记录、收藏、搜索历史等）

### 部署指南
详细部署步骤请参考：[CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)

### 配置方法
1. 创建 D1 数据库：`wrangler d1 create kantv-db`
2. 更新 `wrangler.toml` 中的 `database_id`
3. 设置环境变量：`NEXT_PUBLIC_STORAGE_TYPE=d1`
4. 在 Cloudflare Dashboard 绑定 D1 数据库

### 优势
- **免费额度**：5GB 存储，100,000 次读取/天，50,000 次写入/天
- **全球加速**：Cloudflare CDN 全球分发
- **零运维**：无需管理服务器和数据库
- **高可用**：Cloudflare 基础设施保障

---

## 2. 用户级别成人内容过滤控制

### 新增功能
- ✅ 站长可为每个用户单独配置成人内容过滤
- ✅ 支持三级优先级：URL 参数 > 用户设置 > 全局设置
- ✅ 管理后台新增"成人内容过滤"列和控制开关
- ✅ 实时生效，无需重新登录

### 使用方法

#### 管理后台配置
1. 登录管理后台
2. 进入"用户管理"页面
3. 在用户列表中找到"成人内容过滤"列
4. 点击开关进行控制：
   - **已开启**（绿色）：对该用户启用过滤（使用全局设置）
   - **已关闭**（红色）：对该用户禁用过滤（允许查看成人内容）

#### 权限说明
- **站长**：可以配置所有用户的成人内容过滤设置
- **管理员**：可以配置普通用户的成人内容过滤设置
- **普通用户**：无法修改设置

#### 优先级规则
1. **URL 参数**（最高优先级）
   - `?adult=1` 或 `?adult=true` - 不过滤
   - `?adult=0` 或 `?adult=false` - 过滤
   - `?filter=off` 或 `?filter=disable` - 不过滤
   - `?filter=on` 或 `?filter=enable` - 过滤

2. **用户级别设置**（中优先级）
   - 在管理后台为用户单独配置
   - 仅在未指定 URL 参数时生效

3. **全局设置**（最低优先级）
   - 环境变量 `NEXT_PUBLIC_DISABLE_YELLOW_FILTER`
   - 站点配置中的"启用成人内容过滤"开关

### 技术实现
- 修改了 `src/lib/admin.types.ts` 添加 `disableAdultFilter` 字段
- 更新了 `src/lib/adult-filter.ts` 支持用户级别控制
- 新增 API 操作：`toggleAdultFilter`
- 管理后台新增控制界面

### 向后兼容
- 现有用户默认使用全局设置
- 旧版 API 调用保持兼容

---

## 3. Docker 部署优化

### 新增文件
- ✅ `docker-compose.yml` - 一键部署配置
- ✅ 支持 Kvrocks 和 Redis 两种数据库
- ✅ 完整的环境变量配置示例

### 使用方法

#### 快速启动
```bash
# 1. 克隆项目
git clone <your-repo-url>
cd kantv

# 2. 创建环境变量文件
cp .env.example .env
# 编辑 .env 文件，设置 USERNAME 和 PASSWORD

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 访问应用
# 打开浏览器访问 http://localhost:3000
```

#### 停止服务
```bash
docker-compose down
```

#### 重启服务
```bash
docker-compose restart
```

#### 查看状态
```bash
docker-compose ps
```

### 配置选项
- **Kvrocks**（默认，推荐）：高性能 Redis 兼容存储
- **Redis**：标准 Redis 服务器

### 数据持久化
- Kvrocks 数据：`kvrocks-data` volume
- Redis 数据（可选）：`redis-data` volume

---

## 环境变量更新

### 新增变量
```bash
# D1 数据库支持
NEXT_PUBLIC_STORAGE_TYPE=d1  # 新增 'd1' 选项

# 用户级别成人内容过滤
# 注意：全局设置仍然可用，但可以为每个用户单独配置
NEXT_PUBLIC_DISABLE_YELLOW_FILTER=false

# 管理员账号（统一命名）
USERNAME=admin
PASSWORD=your_password
```

### 更新的变量
```bash
# 存储类型现在支持 5 种选项
NEXT_PUBLIC_STORAGE_TYPE=localstorage|redis|upstash|kvrocks|d1
```

---

## 文件变更清单

### 新增文件
- `src/lib/d1.db.ts` - Cloudflare D1 数据库适配器
- `wrangler.toml` - Cloudflare Workers 配置
- `.dev.vars.example` - Cloudflare 本地开发环境变量
- `CLOUDFLARE_DEPLOYMENT.md` - Cloudflare Pages 部署指南
- `docker-compose.yml` - Docker Compose 配置文件

### 修改文件
- `src/lib/db.ts` - 添加 D1 存储类型支持
- `src/lib/admin.types.ts` - 添加用户级别成人内容过滤字段
- `src/lib/adult-filter.ts` - 支持用户级别过滤控制
- `src/app/api/admin/user/route.ts` - 添加 toggleAdultFilter 操作
- `src/app/admin/page.tsx` - 管理后台添加成人内容过滤控制界面
- `.env.example` - 更新环境变量说明

### 备份文件
所有修改的文件都已备份到 `beifen/` 目录：
- `beifen/db.ts.bak`
- `beifen/admin.types.ts.bak`
- `beifen/adult-filter.ts.bak`
- `beifen/admin-user-route.ts.bak`
- `beifen/admin-page.tsx.bak`
- `beifen/.env.example.bak`

---

## 升级指南

### 从旧版本升级

1. **拉取最新代码**
   ```bash
   git pull origin main
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **更新环境变量**
   - 检查 `.env.example` 文件中的新变量
   - 更新你的 `.env` 或 `.env.local` 文件

4. **重新构建**
   ```bash
   pnpm build
   ```

5. **重启服务**
   - Docker 部署：`docker-compose restart`
   - 手动部署：重启你的 Node.js 进程

### 数据迁移

- ✅ 无需数据迁移
- ✅ 现有用户配置自动兼容
- ✅ 用户级别过滤默认使用全局设置

---

## 已知问题

1. **Cloudflare D1 限制**
   - 免费版有读写次数限制
   - 不支持某些高级 SQL 功能
   - 建议中小型站点使用

2. **成人内容过滤**
   - URL 参数可以绕过用户级别设置
   - 建议配合网络防火墙使用

---

## 反馈与支持

如遇到问题，请：
1. 查看相关文档：`CLOUDFLARE_DEPLOYMENT.md`
2. 提交 Issue：[GitHub Issues](https://github.com/your-repo/issues)
3. 加入讨论：[GitHub Discussions](https://github.com/your-repo/discussions)

---

## 致谢

感谢所有贡献者和用户的支持！

---

**更新日期**：2026-01-07
**版本号**：v1.2.0
