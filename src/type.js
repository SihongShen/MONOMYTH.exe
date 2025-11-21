// 1. GameStage: 定义游戏的各个阶段
// 作用：相当于状态机的“状态”，用来告诉前端现在该显示哪个界面。
export const GameStage = {
  INTRO: 'INTRO',             // 开场/欢迎页
  INPUT: 'INPUT',             // 玩家输入关键词
  GENERATING_STORY: 'GENERATING_STORY', // 正在请求 AI 生成中 (Loading)
  NARRATIVE: 'NARRATIVE',     // 显示故事卡片和选项
  CONCLUSION: 'CONCLUSION',   // 结局页
  ERROR: 'ERROR'              // 出错页
};

// 2. 下面这些 Interface 在 JS 中不存在，
// 但我们可以定义一个 "initialGameState" 来展示数据的样子：

export const initialGameState = {
  stage: GameStage.INTRO,     // 当前处于哪个阶段
  userTopic: "",              // 玩家输入的 "Seed" 词
  history: [],                // 存储之前走过的所有 StoryNode (剧情回顾)
  currentNode: null,          // 当前这一页的故事数据 (StoryNode)
  currentImage: null          // 当前显示的背景图 URL
};

// 3. 手势状态初始值
export const initialGestureState = {
  detected: false,            // 摄像头是否检测到了手
  selection: null,            // 当前选中了哪个 ('A' 或 'B')
  progress: 0                 // 确认进度的百分比 (0-100)，比如悬停多久触发
};