# IRScope

IRScope 是一个 Rust/Tauri 桌面应用，用于打开带私有红外 payload 的 JPG 文件，查看温度矩阵、元数据和基础区域统计。

当前桌面版包含：

- Rust 解析器和 Tauri 桌面 UI
- 打开 IR JPG 并显示原始 JPEG 图像
- 展示全图统计、关键 metadata、中心点温度
- 点、线、矩形分析
- 点温度标签，线/框 Max、Min、Avg 图上标注，最高温位置高亮
- 温度矩阵 CSV 导出
- 原始 Windows 程序、DLL、样例图和逆向分析资料作为参考证据

## 快速运行

安装 Node.js、npm 和 Rust 后：

```bash
npm install
npm run tauri dev
```

打开内置样例：

```text
reference/original-program/samples/1.jpg
```

## 构建

本机 release 包：

```bash
npm run tauri build
```

本机 debug 包：

```bash
npm run tauri build -- --debug
```

debug app 输出在：

```text
src-tauri/target/debug/bundle/macos/IRScope.app
```

## 跨平台打包

跨平台包通过 GitHub Actions 构建，工作流文件：

```text
.github/workflows/cross-platform-build.yml
```

手动运行 `cross-platform-build` 后下载 artifacts：

```text
IRScope-windows-x64-portable-and-installer  Windows x64 portable exe 和 NSIS 安装包
IRScope-linux-x64                           Linux x64 AppImage 和 deb
IRScope-macos-arm64                         macOS arm64 .app
```

本机一般只构建当前平台；Windows/Linux/macOS 产物用对应 CI runner 生成。
Windows portable exe 依赖系统 WebView2 Runtime，Windows 10/11 通常已内置或自动安装。

## 验证

```bash
cargo test --manifest-path src-tauri/Cargo.toml
npm run build
npm run tauri build -- --debug
```

## 目录结构

```text
src/App.tsx                            桌面主界面和画布交互
src/components/                        右侧信息/分析面板等 React 组件
src/lib/                               前端格式化和坐标转换工具
src/types.ts                           前后端共享 DTO 的 TypeScript 类型
src-tauri/src/ir.rs                    Rust IR parser、metadata、区域统计
src-tauri/src/commands.rs              Tauri command 边界：解析、分析、CSV 导出
src-tauri/capabilities/                Tauri v2 权限配置
src-tauri/icons/                       App 图标源文件和 macOS 图标
src-tauri/tauri.conf.json              桌面窗口、打包和安全配置
docs/ir-image-format-generic.md       语言无关通用解析方法和伪代码
docs/metadata-structure.md            可变长 metadata 结构说明
docs/temperature-parsing.md           样例证据链和区域统计说明
docs/project-history.md               项目历史和关键改动
docs/history/                         Trellis 历史任务文档
reference/original-program/           原程序附件：exe、dll、样例图、日志
reference/reverse-engineering/        逆向清单、接口草稿、反汇编参考
```

## 核心格式结论

样例 JPG 文件是：

```text
标准 JPEG 数据 + EOI(FF D9) + 私有 IR payload
```

IR payload：

```text
uint16_le  version_or_magic = 256
uint16_le  width
uint16_le  height
char[14]   timestamp = YYYYMMDDhhmmss
float32_le temperatures[width * height]
byte[]     variable metadata tail
```

温度索引：

```text
temperature(x, y) = temperatures[y * width + x]
```

## 重要说明

- 原始程序和 DLL 只作为附件/参考资料，不参与运行时。
- MVP 只提供桌面应用，不提供 CLI。
- 热力图、调色板、直方图、椭圆/多边形/多段线分析放后续迭代。
- 未确认字段会明确以 `unknown*` 或低可信度标注，不硬编码成已确认业务含义。
