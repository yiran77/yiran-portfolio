# 罗伊然的作品集

个人影像、视觉设计、摄影与内容研究作品集。网页代码与媒体文件分离管理：代码保存在 GitHub，图片和视频由 Cloudflare R2 提供。

## 本地运行

需要 Node.js 22、pnpm，以及项目根目录中的 `.env.local`：

```bash
NEXT_PUBLIC_MEDIA_BASE_URL=https://pub-32146805d38d4e4c8130abf9a4c7ae79.r2.dev
```

```bash
pnpm install
pnpm dev
```

本地地址为 `http://localhost:3000/`。

## 检查与构建

```bash
pnpm lint
pnpm build
```

## Cloudflare Workers 部署

项目使用 Vinext 构建，可部署到 Cloudflare Workers：

```bash
pnpm deploy
```

如果使用 Cloudflare Workers Builds 连接 GitHub，请设置：

- Production branch：`main`
- Build command：`pnpm build`
- Deploy command：`pnpm deploy:upload`
- Build variable：`NEXT_PUBLIC_MEDIA_BASE_URL=https://pub-32146805d38d4e4c8130abf9a4c7ae79.r2.dev`

`public/media/` 和 `.env.local` 不进入 Git 仓库；线上媒体始终从 R2 加载。
