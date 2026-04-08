# Mystic Tarot | 神秘塔罗

![License](https://img.shields.io/badge/license-MIT-blue.svg)

一个基于 Web 的 3D 沉浸式塔罗牌体验，融合了 MediaPipe 手势控制与 DeepSeek AI 解读。

## ✨ 特性

- **🔮 3D 沉浸式视觉**：基于 CSS 3D 构建的立体牌阵与粒子特效。
- **✋ 手势交互控制**：完全脱离鼠标点击，通过摄像头手势进行游戏。
  - **区域滚动**：手掌移动到屏幕两侧控制牌阵滚动。
  - **握拳选牌**：在屏幕中央握拳蓄力选中卡牌。
  - **张手解读**：张开五指召唤命运解读。
- **🤖 AI 智能解读**：集成 DeepSeek API，提供流式输出的心理学与灵性解读。
- **📱 响应式设计**：适配各种屏幕尺寸，自动调整牌阵布局。
- **🔒 隐私安全**：摄像头数据仅在本地处理，API Key 存储于本地，不经过第三方服务器。

## 🚀 快速开始

### 前置要求
- 一个现代浏览器（Chrome, Edge, Firefox 等）。
- 摄像头权限（用于手势控制）。
- [DeepSeek API Key](https://platform.deepseek.com/api_keys)（用于获取 AI 解读，可选）。

### 运行方式

本项目为单文件 HTML 应用，无需复杂的构建流程。

1. **克隆项目**
   ```bash
   git clone https://gitee.com/rickif/tarot.git
   ```

2. **启动**
   直接在浏览器中打开 `index.html` 文件即可。
   或者使用 Python 快速启动本地服务器：
   ```bash
   python3 -m http.server 8000
   ```
   访问 `http://localhost:8000`。

## 🎮 操作指南

1. **启动游戏**：允许摄像头权限后，对着摄像头**张开五指并保持 3 秒**。
2. **洗牌与选牌**：
   - 将手移动到屏幕**左侧或右侧**区域，牌阵会相应滚动。
   - 当心仪的牌位于屏幕正中央时，**握拳并保持 1 秒**，看到白色光效蓄力完成后即选中。
   - 重复此步骤抽取 3 张牌（分别代表过去、现在、未来）。
3. **AI 解读**：
   - 选牌完成后，点击右上角齿轮图标⚙️配置您的 DeepSeek API Key。
   - 对着摄像头**张开五指并保持 3 秒**，AI 将开始为您解读牌面。

## 📚 资源致谢

本项目中使用的 Rider-Waite-Smith 塔罗牌图像资源来源于：
**[Sacred-Texts.com](https://sacred-texts.com/tarot/pkt/index.htm)**
*The Pictorial Key to the Tarot by A.E. Waite, images by Pamela Colman Smith [1911]*

感谢 Sacred Texts 对公共领域资源的整理与贡献。

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。
您可以免费使用、修改和分发本项目，但请保留原始版权声明。
