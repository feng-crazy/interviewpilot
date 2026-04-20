# InterviewPilot

企业AI面试智能体，适用于初面场景。基于面试官的需求、岗位JD、公司信息等配置，自动对候选人进行面试提问，最终生成人才画像、分析报告和录用建议。

## 核心功能

- **岗位模板管理**: 创建可复用的岗位配置模板，包含JD、公司信息、面试偏好、流程要求
- **AI配置优化**: 一键优化岗位JD、公司介绍、面试偏好等内容
- **简历解析**: 支持PDF/DOCX上传或手动输入，自动提取简历文本
- **AI面试提问**: 根据岗位要求和简历内容，自动生成针对性面试问题
- **实时语音识别**: 候选人可通过语音回答，实时转写为文字
- **双端同步**: 面试官端和候选人端实时同步，面试官可监控和控制面试进程
- **智能报告生成**: 面试结束后自动生成6维度分析报告（聊天总结、能力评估、匹配分析、优缺点、录用建议、追问方向）

## 技术架构

- **后端**: FastAPI + SQLAlchemy (Python 3.10+)
- **前端**: React 18 + Vite + TypeScript
- **LLM**: 阿里云 DashScope (Qwen系列模型)
- **语音识别**: 阿里云 Paraformer 实时语音转写
- **实时通信**: SSE (AI流式响应) + WebSocket (双端同步/语音)

## 快速开始

### 1. 环境准备

```bash
# 安装依赖
make install

# 配置环境变量
cp backend/.env.example backend/.env
# 编辑 .env 设置 DASHSCOPE_API_KEY 和 PARAFORMER_API_KEY
```

### 2. 启动服务

```bash
# 同时启动前后端
make dev

# 或分别启动
make backend  # 后端: http://localhost:8000
make frontend # 前端: http://localhost:5173
```

### 3. 使用流程

1. **创建岗位模板**: 在「岗位库」创建岗位，填写JD、公司信息、面试偏好等配置
2. **开始面试**: 从岗位详情页点击「开始面试」，上传候选人简历
3. **面试进行**: 候选人端回答问题（文字/语音），面试官端实时监控
4. **生成报告**: 面试结束后，点击「生成报告」获取分析结果

## 项目结构

```
interviewpilot/
├── backend/app/           # FastAPI后端
│   ├── api/routes/        # REST/WebSocket路由
│   ├── services/          # 业务逻辑层
│   ├── models/            # Pydantic模型
│   ├── database/          # ORM模型
│   └── config/prompts/    # LLM提示词模板
├── frontend/src/          # React前端
│   ├── pages/             # 路由页面
│   ├── components/        # 共享组件
│   ├── hooks/             # 自定义hooks
│   └── services/          # API封装
└── Makefile               # 开发命令
```

## 开发命令

| 命令 | 说明 |
|------|------|
| `make install` | 安装前后端依赖 |
| `make dev` | 启动前后端服务 |
| `make backend` | 仅启动后端 |
| `make frontend` | 仅启动前端 |
| `make stop` | 停止所有服务 |
| `make clean` | 清理数据库和构建产物 |

## API密钥配置

| 环境变量 | 用途 | 获取方式 |
|----------|------|----------|
| `DASHSCOPE_API_KEY` | LLM调用（必需） | [阿里云DashScope](https://dashscope.console.aliyun.com/) |
| `PARAFORMER_API_KEY` | 语音识别（可选） | 同上 |

## License

MIT