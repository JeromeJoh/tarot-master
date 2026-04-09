# 需求文档

## 简介

本次升级在已完成重构的塔罗牌 Web 应用基础上，新增三项功能：

1. **中英文切换**：在现有 i18n 框架（`t(key)` / `setLocale()`）之上，增加运行时语言切换 UI，并补充完整的中文语言包。
2. **摄像头检测与降级提示**：页面加载后立即检测摄像头设备是否存在，若不存在则通过 Toast 组件提示用户改用鼠标/键盘操作，并隐藏手势引导区域。
3. **Toast 通知组件**：将散落在各处的状态提示、错误提示、操作引导统一封装为一个可复用的 Toast 组件，支持多种场景（信息、成功、警告、错误、持久引导）。

## 词汇表

- **App**：本塔罗牌 Web 应用。
- **i18n_Hook**：已有的国际化模块（`src/i18n.js`），导出 `t(key)`、`setLocale(locale)`、`registerLocale(locale, strings)` 函数。
- **Locale_Switcher**：新增的语言切换 UI 控件（按钮或下拉菜单），允许用户在运行时切换语言。
- **zh 语言包**：新增的中文翻译文件（`src/locales/zh.js`），覆盖 `en.js` 中的全部字符串键。
- **Camera_Detector**：负责在页面加载时检测摄像头设备可用性的逻辑单元。
- **Toast**：轻量级通知组件（`src/toast.js`），在页面顶部或底部短暂显示消息，支持自动消失和手动关闭。
- **Toast_Type**：Toast 的显示类型，包括 `info`（信息）、`success`（成功）、`warning`（警告）、`error`（错误）、`persistent`（持久，不自动消失）。
- **Gesture_Guide**：页面底部的手势操作引导区域（`#gesture-guide`）。
- **Status_Text**：页面顶部的状态文字区域（`#status-text`）。
- **Keyboard_Fallback**：无摄像头时的鼠标/键盘操作模式，已有基础实现（`initKeyboard()`）。

---

## 需求

### 需求 1：中文语言包

**用户故事：** 作为中文用户，我希望应用界面显示中文，以便我能更自然地理解操作提示和解读内容。

#### 验收标准

1. THE App SHALL 在 `src/locales/zh.js` 中提供完整的中文翻译，覆盖 `en.js` 中的全部字符串键。
2. THE zh 语言包 SHALL 在应用启动时通过 `registerLocale('zh', zhStrings)` 注册到 i18n_Hook。
3. WHEN zh 语言包中某个键缺失时，THE i18n_Hook SHALL 回退到英文并在控制台输出警告（已有行为，无需修改）。
4. THE zh 语言包 SHALL 为 AI 解读功能提供中文提示词相关的字符串键（`ai.systemPrompt`、`ai.userPrompt`），使 AI 以中文返回解读内容。

---

### 需求 2：运行时语言切换

**用户故事：** 作为用户，我希望能在页面上直接切换中英文，以便随时选择自己偏好的语言。

#### 验收标准

1. THE App SHALL 在页面上渲染一个 Locale_Switcher 控件，默认显示当前语言（英文 `EN` / 中文 `中文`）。
2. WHEN 用户点击 Locale_Switcher 时，THE App SHALL 调用 `setLocale(locale)` 切换语言。
3. WHEN 语言切换完成后，THE App SHALL 重新渲染所有静态 UI 文字（状态文字、按钮标签、模态框标题、手势引导标签），使其立即反映新语言。
4. WHEN 语言切换完成后，THE App SHALL 通过 Toast 组件显示一条 `success` 类型的切换成功提示，持续 2 000 ms 后自动消失。
5. THE App SHALL 将用户选择的语言偏好持久化到 `localStorage`（键名 `preferred_locale`），并在下次加载时自动应用。
6. IF `localStorage` 中存储的语言标识符不在已注册的语言列表中，THEN THE App SHALL 回退到英文并忽略该无效值。

---

### 需求 3：摄像头检测与降级提示

**用户故事：** 作为没有摄像头的用户，我希望应用在加载后立即告知我可以用鼠标/键盘操作，以便我不会因为手势功能不可用而感到困惑。

#### 验收标准

1. WHEN 页面 DOM 加载完成后，THE Camera_Detector SHALL 调用 `navigator.mediaDevices.enumerateDevices()` 检测是否存在 `videoinput` 类型的设备。
2. IF 未检测到任何 `videoinput` 设备，THEN THE App SHALL 通过 Toast 组件显示一条 `persistent` 类型的提示，告知用户当前无摄像头，可使用鼠标/键盘操作（对应 i18n 键 `toast.noCameraFallback`）。
3. IF 未检测到任何 `videoinput` 设备，THEN THE App SHALL 隐藏 Gesture_Guide 区域。
4. IF 未检测到任何 `videoinput` 设备，THEN THE App SHALL 跳过摄像头初始化流程，直接进入 IDLE 状态并激活 Keyboard_Fallback 模式。
5. IF `navigator.mediaDevices` API 不可用（如非 HTTPS 环境），THEN THE Camera_Detector SHALL 将该情况视同无摄像头处理，并额外通过 Toast 显示 `warning` 类型提示（对应 i18n 键 `toast.mediaApiUnavailable`）。
6. WHEN 摄像头检测完成且设备存在时，THE App SHALL 正常执行摄像头初始化流程，不显示降级提示。

---

### 需求 4：Toast 通知组件

**用户故事：** 作为用户，我希望操作反馈和系统提示以统一、清晰的方式呈现，以便我能快速感知应用状态而不被打断操作流程。

#### 验收标准

1. THE Toast SHALL 作为独立模块（`src/toast.js`）导出 `showToast(message, type, duration)` 函数，其中 `type` 为 Toast_Type，`duration` 为毫秒数（`persistent` 类型时忽略此参数）。
2. THE Toast SHALL 在 DOM 中维护一个容器元素（`#toast-container`），所有 Toast 实例在该容器内堆叠显示。
3. WHEN `showToast` 被调用时，THE Toast SHALL 创建一个新的 Toast 元素并以动画方式滑入视图。
4. WHEN `duration` 到期后，THE Toast SHALL 以动画方式滑出并从 DOM 中移除（`persistent` 类型除外）。
5. THE Toast SHALL 为每种 Toast_Type 应用不同的视觉样式（颜色、图标），以便用户快速区分消息类型。
6. WHEN Toast 为 `persistent` 类型时，THE Toast SHALL 在消息右侧显示一个关闭按钮，用户点击后 Toast 以动画方式消失。
7. THE Toast SHALL 支持同时显示多条消息，多条消息在容器内垂直排列，互不遮挡。
8. WHEN 同一条 `persistent` Toast 已存在时，THE Toast SHALL 不重复创建相同内容的 Toast，而是使其短暂闪烁以提示用户注意。
9. THE Toast 模块 SHALL 导出 `dismissToast(id)` 函数，允许外部代码通过 ID 主动关闭指定 Toast。
10. IF `showToast` 的 `message` 参数为空字符串，THEN THE Toast SHALL 不创建任何 DOM 元素并静默返回。

---

### 需求 5：现有提示迁移至 Toast

**用户故事：** 作为开发者，我希望将现有散落的状态提示统一迁移到 Toast 组件，以便代码更易维护，用户体验更一致。

#### 验收标准

1. WHEN 摄像头权限被拒绝时，THE App SHALL 通过 Toast 显示 `error` 类型提示（替代直接写入 Status_Text），同时保留 Status_Text 的状态描述。
2. WHEN API 调用失败时，THE App SHALL 通过 Toast 显示 `error` 类型提示（替代仅在解读模态框内显示错误）。
3. WHEN 设置保存成功时，THE App SHALL 通过 Toast 显示 `success` 类型提示（持续 2 000 ms），替代当前无任何反馈的行为。
4. WHEN 用户在无 API Key 的情况下尝试触发解读时，THE App SHALL 通过 Toast 显示 `warning` 类型提示，引导用户前往设置（对应 i18n 键 `toast.noApiKey`）。
5. THE App SHALL 保留 Status_Text 用于显示游戏流程状态（IDLE / PICKING / INTERPRETING 等），Toast 仅用于一次性通知和操作反馈，两者职责不重叠。
