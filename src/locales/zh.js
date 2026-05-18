export default {
  // 状态消息
  'status.starting': '启动中...',
  'status.openPalmToStart': '张开手掌 · 按 Enter 键 · 或点击按钮开始',
  'status.clickToStart': '按 Enter 键或点击按钮开始',
  'status.spinning': '命运之轮开始转动...',
  'status.pickCard': '握拳以选择你的牌',
  'status.cardsPicked': '已选牌数：{n}/3',
  'status.fateRevealed': '你的命运已揭晓',
  'status.openPalmToRead': '张开手掌 · 按 Enter 键 · 或点击按钮解读命运',
  'status.noToken': '请配置 API 密钥以启用 AI 解读',
  'status.readingComplete': '你的命运已揭示',
  'status.cameraPermission': '手势控制需要摄像头权限',
  'status.cameraNotFound': '未检测到摄像头，请连接摄像头后刷新页面。',

  // 手势引导
  'guide.swipeRight': '向右滑动 ➡',
  'guide.swipeLeft': '⬅ 向左滑动',
  'guide.fistSelect': '握拳以选择',

  // 牌位
  'position.past': '过去',
  'position.present': '现在',
  'position.future': '未来',

  // 解读模态框
  'modal.interpretation.title': '天机揭示',
  'modal.close': '关闭',

  // 设置模态框
  'settings.title': 'API 密钥配置（本地存储）',
  'settings.description': '输入你的 DeepSeek API 密钥以启用 AI 解读。',
  'settings.hint': '还没有密钥？访问 <a href="https://platform.deepseek.com/api_keys" target="_blank">DeepSeek 平台</a> 获取。',
  'settings.inputLabel': 'API 密钥',
  'settings.save': '保存',
  'settings.close': '关闭',
  'settings.saved': '设置已保存',

  // 按钮
  'btn.allowCamera': '允许摄像头',
  'btn.interpret': '🔮 解读命运',
  'btn.startReading': '✨ 开始抽牌',
  'btn.interpretReading': '🔮 解读命运',

  // 错误
  'error.apiFailure': '神谕连接失败：{message}',
  'error.streamInterrupted': '连接中断：{message}',

  // Toast 通知
  'toast.noCameraFallback': '未检测到摄像头，你可以使用鼠标或键盘进行操作。',
  'toast.mediaApiUnavailable': '摄像头 API 不可用，请使用 HTTPS 或尝试其他浏览器。',
  'toast.localeSwitched': '语言切换成功。',
  'toast.noApiKey': '未配置 API 密钥，请前往设置添加你的 DeepSeek API 密钥。',
  'toast.settingsSaved': '设置已保存。',

  // AI 提示词（中文，使 AI 以中文返回解读内容）
  'ai.systemPrompt': '你是一位睿智而富有洞察力的塔罗牌占卜师，请用中文提供深刻、细腻的解读。',
  'ai.userPrompt': '请解读以下三张塔罗牌的牌阵：\n\n{cards}\n\n请用中文以 Markdown 格式提供深思熟虑、富有洞见的解读。',

  // 语言切换控件
  'locale.en': 'EN',
  'locale.zh': '中文',

  // 操作说明弹窗
  'instructions.title': '操作说明',
  'instructions.close': '知道了',
  'instructions.steps': [
    {
      icon: '✦',
      heading: '开始占卜',
      body: '点击 <strong>✨ 开始抽牌</strong>，或向摄像头展开手掌，即可洗牌并开始。',
    },
    {
      icon: '👁',
      heading: '启用手势控制（可选）',
      body: '点击右上角摄像头图标授予摄像头权限，启用后可全程免触控操作。',
    },
    {
      icon: '🃏',
      heading: '浏览牌组',
      body: '将手移至屏幕<strong>左侧或右侧边缘</strong>即可滚动牌组，也可使用方向键操作。',
    },
    {
      icon: '✊',
      heading: '选择一张牌',
      body: '将手移至屏幕中央，对准目标牌<strong>握拳并保持</strong>，充能环填满后即完成选择。重复操作直至选出 3 张牌。',
    },
    {
      icon: '🔮',
      heading: '揭示命运',
      body: '选出 3 张牌后自动翻牌。点击 <strong>🔮 解读命运</strong>（或展开手掌）即可获得 AI 解读。',
    },
    {
      icon: '🔑',
      heading: 'AI 解读需要 API 密钥',
      body: '点击右上角齿轮图标打开<strong>设置</strong>，粘贴你的 <a href="https://platform.deepseek.com/api_keys" target="_blank">DeepSeek API 密钥</a>。密钥仅存储在本地，不会上传至任何服务器。',
    },
  ],
}
