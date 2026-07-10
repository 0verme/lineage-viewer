# lineage-viewer

一个轻量、框架无关、可嵌入的血缘图查看器。

## 当前状态

项目仍处于早期开发阶段。仓库目前只建立了 TypeScript 构建、测试、格式化、代码检查、打包检查和持续集成基线，尚未实现图渲染和公开查看器 API。

## 计划能力

- 基于 SVG 和 Shadow DOM 的原生 Web Component
- 带版本的通用血缘 JSON Schema
- 结果稳定的图布局和键盘无障碍交互
- 通过 CSS Custom Properties 定制主题
- 安全的 iframe 嵌入
- 浏览器端 SVG 和 PNG 导出
- 可选的旧格式 JSON Adapter

以上内容是开发路线，不代表当前版本已经实现。

## 技术原则

- TypeScript strict 模式
- 原生浏览器 API 和 ESM
- 框架无关，并尽可能保持零运行时依赖
- 分离 Schema、图处理、布局、渲染、交互和导出职责
- 所有公开示例和测试只使用虚构数据
- 显式注册自定义元素，导入主包时不修改浏览器全局状态

## 本地开发

需要 Node.js 22.12 或更高版本。

```sh
npm ci
npm run check
```

常用命令：

```sh
npm run dev          # 启动 Vite 开发服务器
npm run typecheck    # 检查 TypeScript 类型
npm run lint         # 运行 ESLint
npm run format:check # 检查代码格式
npm test             # 运行单元测试
npm run test:e2e     # 运行浏览器冒烟测试
npm run build        # 构建 ESM 和类型声明到 dist
npm run pack:check   # 验证 npm 包文件白名单
```

Playwright 需要兼容的浏览器。新环境在运行 E2E 测试前，可通过 `npx playwright install chromium` 安装 Chromium。

## 许可证

本项目使用 Apache License 2.0，详见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。
