# 部署说明

## 问题解决：模块加载失败

如果遇到以下错误：
```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"
```

## 解决方案

### 1. 重新构建项目

Vite 已配置为每次构建时自动清空 `dist` 目录：

```bash
# 标准构建（自动清空dist）
npm run build

# 带提示的清空构建
npm run build:clean
```

**配置说明**：
- `emptyOutDir: true` - 每次构建前自动清空输出目录
- 保留 `public` 目录中的文件（如 `.htaccess`、`favicon.ico`）

### 2. 服务器配置

#### Apache 服务器
- 确保 `public/.htaccess` 文件被正确复制到服务器
- 确保 Apache 启用了 `mod_rewrite` 模块

#### Nginx 服务器
- 使用 `nginx.conf.example` 中的配置
- 修改 `root` 路径指向你的 `dist` 目录
- 重启 Nginx 服务

### 3. 检查事项

#### 文件路径
- 确保所有静态资源文件都在正确的位置
- 检查 `dist/assets/` 目录下是否有对应的 JS 文件

#### MIME 类型
- 确保服务器正确设置了 JavaScript 文件的 MIME 类型
- `.js` 文件应该返回 `application/javascript`

#### 网络请求
- 打开浏览器开发者工具的 Network 标签
- 检查失败的 JS 文件请求返回的是什么内容
- 如果返回 HTML 页面，说明服务器配置有问题

### 4. 常见问题

#### 相对路径问题
如果部署在子目录下，修改 `vite.config.ts`：
```typescript
export default defineConfig({
  base: '/your-subdirectory/',
  // ... 其他配置
})
```

#### 缓存问题
清除浏览器缓存或使用硬刷新（Ctrl+F5）

#### 权限问题
确保服务器有读取 `dist` 目录及其子目录的权限

## 测试部署

1. 构建项目：`npm run build`
2. 在本地测试：`npx serve dist`
3. 访问 `http://localhost:3000` 检查是否正常工作
4. 检查所有路由是否可以正常访问

## 生产环境检查清单

- [ ] 静态资源加载正常
- [ ] 路由跳转正常
- [ ] API 请求正常
- [ ] 浏览器控制台无错误
- [ ] 页面刷新后路由正常 