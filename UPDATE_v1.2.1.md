# KanTV v1.2.1 更新说明

**更新日期**：2026-01-08

## 🎯 本次更新重点

### 1. 成人内容过滤配置优化

**问题**：之前的环境变量 `NEXT_PUBLIC_DISABLE_YELLOW_FILTER` 是构建时变量，部署后修改不生效。

**改进**：
- ✅ 改用运行时环境变量 `DISABLE_YELLOW_FILTER`（去掉 `NEXT_PUBLIC_` 前缀）
- ✅ 部署后可以随时通过修改环境变量动态调整默认过滤行为
- ✅ 无需重新构建，修改后重启应用即可生效

**配置优先级**（从高到低）：
1. **URL 参数** - `?adult=1` 临时查看成人内容
2. **用户级别设置** - 管理后台为每个用户单独配置
3. **管理后台全局设置** - 管理后台站点设置（实时生效）
4. **环境变量** - `DISABLE_YELLOW_FILTER`（部署时设置，运行时可修改）

**使用示例**：

```bash
# Docker 部署
docker run -e DISABLE_YELLOW_FILTER=false kantv  # 启用过滤（默认）
docker run -e DISABLE_YELLOW_FILTER=true kantv   # 禁用过滤（允许成人内容）

# Cloudflare Pages 部署
# 在 Dashboard > Settings > Environment variables 中设置
DISABLE_YELLOW_FILTER=false
```

### 2. Cloudflare Pages 部署修复

**问题**：部署时提示 "Output directory not found" 错误。

**改进**：
- ✅ 添加 `@cloudflare/next-on-pages` 依赖
- ✅ 新增 `pages:build` 构建命令
- ✅ 更新 wrangler.toml 配置
- ✅ 更新部署文档说明

**正确的 Cloudflare Pages 部署配置**：

```json
{
  "Build command": "npm run pages:build",
  "Build output directory": ".vercel/output/static"
}
```

## 📝 配置文件变更

### .env.example

```diff
- # NEXT_PUBLIC_DISABLE_YELLOW_FILTER=false
+ # DISABLE_YELLOW_FILTER=false
```

### package.json

```diff
  "scripts": {
+   "pages:build": "pnpm gen:manifest && pnpm copy:version && npx @cloudflare/next-on-pages",
+   "pages:preview": "pnpm pages:build && wrangler pages dev",
+   "pages:deploy": "pnpm pages:build && wrangler pages deploy"
  },
  "devDependencies": {
+   "@cloudflare/next-on-pages": "^1"
  }
```

### wrangler.toml

```diff
+ # 注意：Cloudflare Pages 会自动从 wrangler.toml 读取配置
+ # 如果使用 Git 集成部署（推荐），请在 Cloudflare Dashboard 中设置：
+ # - Build command: npm run pages:build
+ # - Build output directory: .vercel/output/static
```

## 🔄 迁移指南

### 从 v1.2.0 升级

1. **更新环境变量名称**：
   ```bash
   # 旧的环境变量（v1.2.0）
   NEXT_PUBLIC_DISABLE_YELLOW_FILTER=false

   # 新的环境变量（v1.2.1）
   DISABLE_YELLOW_FILTER=false
   ```

2. **Docker 部署用户**：
   - 修改 docker-compose.yml 或启动命令中的环境变量名称
   - 重新启动容器即可

3. **Cloudflare Pages 部署用户**：
   - 进入 Dashboard > Settings > Environment variables
   - 删除旧变量 `NEXT_PUBLIC_DISABLE_YELLOW_FILTER`
   - 添加新变量 `DISABLE_YELLOW_FILTER=false`
   - 修改 Build command 为 `npm run pages:build`
   - 重新部署

4. **Vercel 部署用户**：
   - 进入 Settings > Environment Variables
   - 修改变量名称
   - 重新部署

## 💡 使用建议

### 推荐配置（安全模式）

适合公共部署、多用户环境：

```bash
# 全局默认启用过滤
DISABLE_YELLOW_FILTER=false

# 在管理后台为特定用户单独开启权限
# 管理后台 > 用户管理 > 编辑用户 > 禁用成人内容过滤
```

### 推荐配置（自由模式）

适合私人部署、单用户环境：

```bash
# 全局默认禁用过滤
DISABLE_YELLOW_FILTER=true

# 如需临时启用过滤，访问时添加参数：
# https://your-domain.com/search?filter=on
```

### 动态调整（无需重建）

1. **通过管理后台调整**（推荐）：
   - 登录管理后台 > 站点设置
   - 切换"启用成人内容过滤"开关
   - 立即生效，无需重启

2. **通过环境变量调整**：
   - 修改环境变量 `DISABLE_YELLOW_FILTER`
   - Docker: 重启容器
   - Cloudflare/Vercel: 修改环境变量后会自动重新部署

## 📚 相关文档

- [成人内容过滤使用指南](./docs/成人内容过滤使用指南.md)
- [成人内容过滤配置说明](./docs/成人内容过滤配置说明.md)
- [Cloudflare Pages 部署指南](./CLOUDFLARE_DEPLOYMENT.md)

## 🐛 已知问题

无

## 🆙 下一步计划

- [ ] 添加更多过滤规则自定义选项
- [ ] 支持标签组批量管理用户权限
- [ ] 优化搜索性能

---

**完整更新日志**：[CHANGELOG.md](./CHANGELOG.md)
