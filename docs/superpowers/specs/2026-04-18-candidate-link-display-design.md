# 面试官页面显示候选人链接

**日期**: 2026-04-18
**状态**: 待实现

## 背景

面试官创建面试后，后端生成 `candidate_url` 供候选人进入面试页面，但当前前端未显示此链接，面试官无法邀请候选人。

## 目标

在面试官页面顶部显示候选人面试链接，面试官可以复制链接分享给候选人。

## 设计

### UI 设计

在 `InterviewerPage` 顶部状态栏右侧新增链接显示区域：

```
面试监控 - 前端工程师...
已连接 | AI托管 | 候选人链接: http://localhost:5173/interview/xxx/candidate  [复制]
```

**组件**：
- 文本显示完整URL
- "复制"按钮，点击后：
  1. 复制链接到剪贴板
  2. 按钮文字临时变为"已复制"（2秒后恢复）

### 技术修改

#### 后端

**文件**: `backend/app/models/interview.py`
- `InterviewConfig` 类添加 `candidate_url: str` 字段

**文件**: `backend/app/api/routes/interview.py`
- `get_interview_config()` 返回时从数据库读取 `candidate_url`

#### 前端

**文件**: `frontend/src/types/interview.ts`
- `InterviewConfig` 接口添加 `candidate_url: string`

**文件**: `frontend/src/pages/InterviewerPage.tsx`
- 顶部区域新增链接显示
- 复制按钮使用 `navigator.clipboard.writeText()`

## 实现计划

1. 后端：修改 InterviewConfig 模型添加字段
2. 后端：修改 get_interview_config 路由返回字段
3. 前端：更新 TypeScript 类型定义
4. 前端：InterviewerPage 添加链接显示和复制功能

## 验证

- 创建面试后进入面试官页面，顶部能看到候选人链接
- 点击复制按钮，链接成功复制到剪贴板
- 使用复制的链接，候选人能进入面试页面