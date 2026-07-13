# Rust Implementation Plan

- [x] 提取单个 Rust header candidate validator，footer 优先且失败回退 scan。
- [x] 用 `descriptionLength` 解析动态 metadata footer，并扩展 158/195 合成测试。
- [x] 从 JPEG `naturalWidth/naturalHeight` 建立独立预览尺寸状态。
- [x] canvas、窗口和 Inspector 使用 JPEG 尺寸，图片区分“图像尺寸”和“热图尺寸”。
- [x] 点击、标记和区域最值使用共享的 JPEG/温点矩阵双向比例映射。
- [x] 同步语言无关格式、metadata、移植、验证文档和后端规范。
- [x] 运行 Rust fmt/test、TypeScript build、坐标函数检查、真实样本和 diff 检查。

```bash
rtk cargo fmt --manifest-path src-tauri/Cargo.toml --check
rtk cargo test --manifest-path src-tauri/Cargo.toml
rtk npm run build
rtk git diff --check
```

下载样本只用于本机验证，不进入仓库。
