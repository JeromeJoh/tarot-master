# 实现计划：Tarot App 升级

## 概述

按照"Toast 组件 → 语言包 → 语言切换 → 摄像头检测 → 提示迁移"的顺序逐步实现，每个模块完成后立即集成，确保无孤立代码。

## 任务

- [x] 1. 实现 Toast 通知组件（`src/toast.js`）
  - [x] 1.1 创建 `src/toast.js`，实现 `showToast(message, type, duration)` 和 `dismissToast(id)`
    - 懒创建 `#toast-container`（若 HTML 未预置则动态插入 `document.body`）
    - 每个 Toast 元素携带唯一 `data-toast-id`（使用 `crypto.randomUUID()` 或时间戳）
    - `persistent` 类型不设定时器，显示关闭按钮（×）
    - 重复 `persistent` Toast（相同 message）不新建，改为短暂添加 `flash` CSS 类
    - `message` 为空字符串时静默返回 `null`
    - CSS 动画：`@keyframes slideIn` / `slideOut`，通过 `classList` 切换触发
    - _需求：4.1、4.2、4.3、4.4、4.5、4.6、4.7、4.8、4.9、4.10_

  - [ ]* 1.2 为 `showToast` 编写属性测试
    - **属性 1：空消息幂等性** — 任意调用 `showToast('', type)` 均返回 `null` 且不修改 DOM
    - **验证：需求 4.10**

  - [ ]* 1.3 为重复 `persistent` Toast 编写属性测试
    - **属性 2：持久 Toast 去重** — 对相同 message 多次调用 `showToast(msg, 'persistent')` 后，DOM 中该 message 的 Toast 元素数量始终为 1
    - **验证：需求 4.8**

  - [ ]* 1.4 为 `dismissToast` 编写单元测试
    - 测试通过有效 ID 关闭 Toast 后元素从 DOM 移除
    - 测试传入无效 ID 时静默忽略不抛出异常
    - _需求：4.9_

- [x] 2. 在 `index.html` 中新增 Toast 容器与语言切换按钮
  - 在 `<body>` 中添加 `<div id="toast-container"></div>`
  - 在 `#header` 中添加 `<button id="locale-switcher" aria-label="Switch language">EN</button>`
  - _需求：2.1、4.2_

- [x] 3. 新增中文语言包并扩展英文语言包
  - [x] 3.1 在 `src/locales/en.js` 中新增所有缺失键
    - 新增 Toast 相关键：`toast.noCameraFallback`、`toast.mediaApiUnavailable`、`toast.localeSwitched`、`toast.noApiKey`、`toast.settingsSaved`
    - 新增 AI 提示词键：`ai.systemPrompt`、`ai.userPrompt`（含 `{cards}` 占位符）
    - 新增语言控件键：`locale.en`、`locale.zh`
    - _需求：1.1、1.4_

  - [x] 3.2 创建 `src/locales/zh.js`，覆盖 `en.js` 全部字符串键
    - 提供所有 UI 文字的中文翻译
    - `ai.systemPrompt` 和 `ai.userPrompt` 使用中文提示词，使 AI 以中文返回解读内容
    - _需求：1.1、1.4_

  - [ ]* 3.3 为语言包键完整性编写属性测试
    - **属性 3：zh 键集合是 en 键集合的超集** — `Object.keys(zh)` 包含 `Object.keys(en)` 的全部键
    - **验证：需求 1.1**

- [x] 4. 实现运行时语言切换（`main.js`）
  - [x] 4.1 在 `main.js` 中实现 `localizeUI()` 函数
    - 重新渲染所有静态 UI 文字：状态文字、按钮标签、模态框标题、手势引导标签
    - _需求：2.3_

  - [x] 4.2 在 `main.js` 中实现 `initLocaleSwitcher()` 函数
    - 读取 `localStorage.getItem('preferred_locale')` 初始化按钮文字
    - 点击时切换 `en` ↔ `zh`，依次调用 `setLocale()`、`localizeUI()`、`showToast(t('toast.localeSwitched'), 'success', 2000)`
    - 将新语言写入 `localStorage('preferred_locale')`
    - 若 `localStorage` 中存储的值不在已注册语言列表中，回退到 `'en'`
    - _需求：2.1、2.2、2.3、2.4、2.5、2.6_

  - [x] 4.3 在 `DOMContentLoaded` 中注册 zh 语言包并初始化语言切换器
    - 调用 `registerLocale('zh', zhStrings)`
    - 调用 `setLocale(localStorage.getItem('preferred_locale') || 'en')`
    - 调用 `localizeUI()`，调用 `initLocaleSwitcher()`
    - _需求：1.2、2.1、2.5_

  - [ ]* 4.4 为语言偏好持久化编写属性测试
    - **属性 4：localStorage 往返一致性** — 切换到任意有效 locale 后，`localStorage.getItem('preferred_locale')` 返回值与切换目标一致
    - **验证：需求 2.5**

  - [ ]* 4.5 为无效 locale 回退编写单元测试
    - 测试 `localStorage` 中存储无效值时，应用回退到 `'en'` 且不抛出异常
    - _需求：2.6_

- [ ] 5. 检查点 — 确保所有测试通过，如有疑问请告知用户

- [x] 6. 实现摄像头检测与降级（`main.js`）
  - [x] 6.1 在 `main.js` 中实现 `async function detectCamera()` 函数
    - 调用 `navigator.mediaDevices?.enumerateDevices()`
    - 若 API 不可用：`showToast(t('toast.mediaApiUnavailable'), 'warning')` → 返回 `false`
    - 若无 `videoinput`：`showToast(t('toast.noCameraFallback'), 'persistent')` → 返回 `false`
    - 若有 `videoinput`：返回 `true`
    - _需求：3.1、3.2、3.5、3.6_

  - [x] 6.2 在 `DOMContentLoaded` 中集成 `detectCamera()` 调用
    - 若返回 `false`：隐藏 `#gesture-guide`，跳过 `initGestures()`，调用 `setState(IDLE)` 和 `initKeyboard()`
    - 若返回 `true`：正常执行 `initGestures()`
    - _需求：3.3、3.4、3.6_

  - [ ]* 6.3 为 `detectCamera` 编写单元测试
    - Mock `navigator.mediaDevices` 为 `undefined`，验证返回 `false` 并触发 `warning` Toast
    - Mock `enumerateDevices` 返回空数组，验证返回 `false` 并触发 `persistent` Toast
    - Mock `enumerateDevices` 返回含 `videoinput` 的数组，验证返回 `true` 且不触发 Toast
    - _需求：3.1、3.2、3.5、3.6_

- [x] 7. 迁移 `src/ai.js` 中的硬编码提示词
  - 修改 `buildPrompt()` 函数，将硬编码英文提示词替换为 `t('ai.systemPrompt')` 和 `t('ai.userPrompt')`
  - `t('ai.userPrompt')` 中的 `{cards}` 占位符替换为实际卡牌数据
  - _需求：1.4_

- [x] 8. 将现有散落提示迁移至 Toast（`main.js`、`src/ai.js`）
  - [x] 8.1 摄像头权限被拒绝时改用 `showToast(message, 'error')`，保留 Status_Text 状态描述
    - _需求：5.1、5.5_

  - [x] 8.2 API 调用失败时改用 `showToast(message, 'error')`，替代仅在解读模态框内显示错误
    - _需求：5.2_

  - [x] 8.3 设置保存成功时改用 `showToast(t('toast.settingsSaved'), 'success', 2000)`
    - _需求：5.3_

  - [x] 8.4 无 API Key 时尝试触发解读改用 `showToast(t('toast.noApiKey'), 'warning')`
    - _需求：5.4_

- [ ] 9. 最终检查点 — 确保所有测试通过，如有疑问请告知用户

## 备注

- 标有 `*` 的子任务为可选项，可跳过以加快 MVP 进度
- 每个任务均引用具体需求条款以保证可追溯性
- 检查点确保增量验证，避免集成时出现大量问题
- 属性测试验证普遍正确性，单元测试验证具体边界条件
