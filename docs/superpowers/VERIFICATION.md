# InterviewPilot 自动化验证指南

> **For autonomous agents:** 本文档提供完整的自动化验证流程，让 agent 可以自主验证实现是否100%满足需求规格。

**验证时机**: 在实现计划所有 Task 完成后执行本验证流程。

---

## 1. 验证前置条件

### 1.1 必须具备的环境

- Python 3.10+ 已安装
- Node.js 18+ 已安装
- DASHSCOPE_API_KEY 已配置（环境变量或 `.env` 文件）

### 1.2 验证启动流程

**Step 1: 启动后端服务**

```bash
cd /Users/hedengfeng/workspace/interviewpilot/backend

# 检查是否存在 .env 文件，如果不存在则创建
if [ ! -f .env ]; then
  echo "请确保 DASHSCOPE_API_KEY 已设置"
fi

# 安装依赖
pip install -r requirements.txt

# 启动后端服务（后台运行）
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

**Step 2: 启动前端服务**

```bash
cd /Users/hedengfeng/workspace/interviewpilot/frontend

# 安装依赖
npm install

# 启动前端服务（后台运行）
npm run dev &
```

**Step 3: 等待服务就绪**

```bash
# 等待后端启动
sleep 5
curl -s http://localhost:8000/health | grep "healthy" || echo "Backend not ready"

# 等待前端启动
sleep 3
curl -s http://localhost:5173 | head -5 || echo "Frontend not ready"
```

---

## 2. 浏览器自动化验证

### 2.1 使用 Playwright 自动化验证

Agent 可以使用 `/playwright` skill 进行浏览器自动化验证：

```typescript
// 验证脚本示例
// 使用 Playwright MCP 进行自动化验证

// 1. 打开首页
await page.goto('http://localhost:5173');
await page.screenshot({ path: 'verification/screenshots/01-homepage.png' });

// 2. 点击创建面试
await page.click('text=创建面试');
await page.screenshot({ path: 'verification/screenshots/02-config-page.png' });

// 3. 填写配置表单
await page.fill('[placeholder*="岗位"]', '高级Java开发工程师');
await page.fill('[placeholder*="公司"]', '阿里巴巴');
await page.fill('[placeholder*="面试官"]', '张三，技术总监');
await page.fill('[placeholder*="流程"]', '初面，重点考察技术能力和项目经验');
await page.fill('input[type="number"]', '5'); // 最大问题数
await page.fill('input[type="number"]', '15'); // 最大时长
await page.click('text=开始面试');
await page.screenshot({ path: 'verification/screenshots/03-interviewer-page.png' });

// 4. 获取面试者链接，打开新页面
const candidateUrl = await page.evaluate(() => {
  // 从页面获取面试者链接
  return document.querySelector('a[href*="candidate"]')?.href;
});

// 5. 打开面试者页面
const candidatePage = await browser.newPage();
await candidatePage.goto(candidateUrl);
await candidatePage.screenshot({ path: 'verification/screenshots/04-candidate-page.png' });

// 6. 点击准备好了按钮
await candidatePage.click('text=准备好了');
await candidatePage.waitForTimeout(3000); // 等待AI生成问题
await candidatePage.screenshot({ path: 'verification/screenshots/05-first-question.png' });

// 7. 输入回答
await candidatePage.fill('[placeholder*="回答"]', '我有5年Java开发经验，专注于后端服务开发...');
await candidatePage.click('text=发送');
await candidatePage.waitForTimeout(3000);
await candidatePage.screenshot({ path: 'verification/screenshots/06-ai-response.png' });

// 8. 回到面试官页面，验证实时同步
await page.screenshot({ path: 'verification/screenshots/07-interviewer-sync.png' });

// 9. 点击结束面试
await page.click('text=结束面试');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'verification/screenshots/08-interview-ended.png' });

// 10. 点击总结面试
await page.click('text=总结面试');
await page.waitForTimeout(30000); // 等待报告生成（最多30秒）
await page.screenshot({ path: 'verification/screenshots/09-report-generated.png' });

// 11. 访问面试记录页
await page.goto('http://localhost:5173/history');
await page.screenshot({ path: 'verification/screenshots/10-history-page.png' });

// 12. 点击查看详情
await page.click('text=查看详情');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'verification/screenshots/11-detail-page-config.png' });
await page.click('text=聊天记录');
await page.screenshot({ path: 'verification/screenshots/12-detail-page-chat.png' });
await page.click('text=面试报告');
await page.screenshot({ path: 'verification/screenshots/13-detail-page-report.png' });
```

### 2.2 验证目录结构

创建验证截图目录：

```bash
mkdir -p /Users/hedengfeng/workspace/interviewpilot/verification/screenshots
```

---

## 3. 验证清单（对照需求文档逐项验证）

### 3.1 P0 功能验证清单

| # | 功能点 | 验证方法 | 验证标准 |
|---|--------|---------|---------|
| 1 | **首页 - 创建面试入口** | 打开 http://localhost:5173，截图 | 页面显示 "InterviewPilot" 标题，有"创建面试"按钮 |
| 2 | **首页 - 面试记录入口** | 检查首页是否有"面试记录"按钮 | 按钮存在且可点击 |
| 3 | **配置页 - 岗位 JD 输入** | 打开 /config，检查文本输入框 | 存在多行文本输入框，placeholder提示"岗位JD" |
| 4 | **配置页 - 公司信息输入** | 检查配置页公司信息输入框 | 存在多行文本输入框 |
| 5 | **配置页 - 面试偏好信息输入** | 检查配置页面试偏好信息输入框 | 存在多行文本输入框 |
| 6 | **配置页 - 面试方案输入** | 检查配置页面试方案输入框 | 存在多行文本输入框 |
| 7 | **配置页 - 约束信息输入** | 检查最大问题数和最大时长数字输入框 | 存在两个数字输入框 |
| 8 | **配置页 - 开始面试按钮** | 填写完配置后点击"开始面试" | 点击后跳转到面试官页面，生成面试ID |
| 9 | **面试者页面 - 聊天框流式输出** | 点击"准备好了"，观察AI输出 | AI问题以流式方式输出，有光标动画 |
| 10 | **面试者页面 - 文字输入** | 在输入框输入回答并发送 | 输入框可输入，发送按钮可点击 |
| 11 | **面试者页面 - 准备好了按钮** | 检查初始状态 | 页面显示"准备好了"按钮，点击后触发AI提问 |
| 12 | **面试者页面 - 面试结束提示** | 结束面试后观察面试者页面 | 显示"面试已结束，感谢您的参与" |
| 13 | **面试官页面 - 实时聊天同步** | 面试者发送回答后观察面试官页面 | 面试官页面实时显示面试者的回答 |
| 14 | **面试官页面 - 取消AI托管** | 点击"取消AI托管"按钮 | 按钮变为"继续AI托管"，手动提问输入框启用 |
| 15 | **面试官页面 - 手动提问输入框** | 取消托管后输入问题并发送 | 输入框可用，问题发送到面试者页面 |
| 16 | **面试官页面 - 继续AI托管** | 点击"继续AI托管"按钮 | 按钮变为"取消AI托管"，手动输入框禁用 |
| 17 | **面试官页面 - 结束面试按钮** | 点击"结束面试"按钮 | 面试者页面显示结束提示，面试官页面报告按钮激活 |
| 18 | **面试官页面 - 总结面试按钮** | 点击"总结面试"按钮 | 生成面试报告（等待最多30秒） |
| 19 | **面试报告 - 聊天记录整理** | 查看报告的聊天记录整理部分 | 有结构化的问答记录（Q1/A1格式） |
| 20 | **面试报告 - 能力评估** | 查看报告的能力评估部分 | 有各维度评分（技术能力、沟通能力等） |
| 21 | **面试报告 - 岗位匹配度** | 查看报告的匹配度部分 | 有匹配度分析，包含百分比 |
| 22 | **面试报告 - 优缺点总结** | 查看报告的优缺点部分 | 有亮点列表和不足列表 |
| 23 | **面试报告 - 录用建议** | 查看报告的录用建议部分 | 有录用结论（推荐/不推荐/待定）和理由 |
| 24 | **面试记录页 - 历史面试列表** | 打开 /history 页面 | 显示面试记录列表，有查看详情按钮 |
| 25 | **面试详情页 - 面试配置Tab** | 点击查看详情，检查配置Tab | 显示完整的面试配置信息 |
| 26 | **面试详情页 - 聊天记录Tab** | 点击聊天记录Tab | 显示完整聊天记录 |
| 27 | **面试详情页 - 面试报告Tab** | 点击面试报告Tab | 显示完整面试报告 |

### 3.2 API 功能验证清单

| # | API | 验证方法 | 验证标准 |
|---|-----|---------|---------|
| 1 | `/api/interview/create` | POST 创建面试 | 返回 interview_id, interviewer_url, candidate_url |
| 2 | `/api/interview/{id}` | GET 获取面试配置 | 返回完整配置信息 |
| 3 | `/api/interview/history` | GET 面试记录列表 | 返回面试记录数组 |
| 4 | `/api/interview/{id}/detail` | GET 面试详情 | 返回 config + messages + report |
| 5 | `/api/chat/stream/{id}` | SSE 流式输出 | 返回 SSE 事件流 |
| 6 | `/ws/interview/{id}` | WebSocket 连接 | 双向实时通信正常 |
| 7 | `/api/control/toggle/{id}` | POST 切换托管 | 状态正确切换 |
| 8 | `/api/control/end/{id}` | POST 结束面试 | 面试状态变为 ended |
| 9 | `/api/report/generate/{id}` | POST 生成报告 | 返回报告生成结果 |
| 10 | `/api/report/{id}` | GET 获取报告 | 返回完整报告内容 |

### 3.3 数据库验证清单

| # | 数据表 | 验证方法 | 验证标准 |
|---|--------|---------|---------|
| 1 | `interviews` 表 | 检查表结构和数据 | 有配置字段、状态字段、链接字段 |
| 2 | `chat_messages` 表 | 检查聊天消息数据 | 有 role, content, sequence, created_at |
| 3 | `interview_reports` 表 | 检查报告数据 | 有6个模板输出字段，final_decision |

---

## 4. 自动化验证脚本

### 4.1 使用 Playwright Skill 执行验证

Agent 可以调用 `/playwright` skill 执行完整的自动化验证流程：

**调用方式**:

```
/playwright

然后在对话中描述验证任务：
"执行 InterviewPilot 的自动化验证流程：
1. 启动前后端服务
2. 打开浏览器访问 http://localhost:5173
3. 按照验证清单逐项验证
4. 对每个验证点截图保存到 verification/screenshots/
5. 对照需求文档检查是否100%满足
6. 输出验证报告"
```

### 4.2 API 自动化验证脚本

使用 curl 或 Python requests 验证 API：

```python
import requests
import json

BASE_URL = "http://localhost:8000/api"

def verify_api():
    results = []
    
    # 1. 创建面试
    response = requests.post(f"{BASE_URL}/interview/create", json={
        "jd_text": "高级Java开发工程师",
        "company_info": "阿里巴巴",
        "interviewer_info": "张三，技术总监",
        "interview_scheme": "初面，考察技术能力",
        "constraint_info": json.dumps({"max_questions": 5, "max_duration": 900})
    })
    assert response.status_code == 200
    data = response.json()
    interview_id = data["interview_id"]
    results.append(f"✓ 创建面试成功，ID: {interview_id}")
    
    # 2. 获取面试配置
    response = requests.get(f"{BASE_URL}/interview/{interview_id}")
    assert response.status_code == 200
    results.append(f"✓ 获取面试配置成功")
    
    # 3. 获取面试记录列表
    response = requests.get(f"{BASE_URL}/interview/history")
    assert response.status_code == 200
    results.append(f"✓ 获取面试记录列表成功")
    
    # 4. 结束面试
    response = requests.post(f"{BASE_URL}/control/end/{interview_id}")
    assert response.status_code == 200
    results.append(f"✓ 结束面试成功")
    
    # 5. 生成报告
    response = requests.post(f"{BASE_URL}/report/generate/{interview_id}")
    assert response.status_code in [200, 500]  # 500可能是LLM调用失败
    if response.status_code == 200:
        results.append(f"✓ 生成报告成功")
    else:
        results.append(f"⚠ 报告生成需要配置 DASHSCOPE_API_KEY")
    
    # 6. 获取面试详情
    response = requests.get(f"{BASE_URL}/interview/{interview_id}/detail")
    assert response.status_code == 200
    results.append(f"✓ 获取面试详情成功")
    
    return results

# 执行验证
results = verify_api()
for r in results:
    print(r)
```

### 4.3 数据库验证脚本

```python
import sqlite3

def verify_database():
    conn = sqlite3.connect('/Users/hedengfeng/workspace/interviewpilot/backend/data/interviewpilot.db')
    cursor = conn.cursor()
    
    results = []
    
    # 检查表是否存在
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    required_tables = ['interviews', 'chat_messages', 'interview_reports']
    for table in required_tables:
        if (table,) in tables:
            results.append(f"✓ 表 {table} 存在")
        else:
            results.append(f"✗ 表 {table} 不存在")
    
    # 检查 interviews 表结构
    cursor.execute("PRAGMA table_info(interviews)")
    columns = cursor.fetchall()
    required_columns = ['id', 'jd_text', 'company_info', 'interviewer_info', 'status', 'ai_managed']
    for col in required_columns:
        if any(c[1] == col for c in columns):
            results.append(f"✓ interviews 表有 {col} 字段")
    
    conn.close()
    return results

results = verify_database()
for r in results:
    print(r)
```

---

## 5. 验证报告输出格式

完成验证后，输出以下格式的验证报告：

```
# InterviewPilot 验证报告

**验证时间**: [时间戳]
**验证状态**: [PASS/FAIL/PARTIAL]

## 功能验证结果

| 功能点 | 状态 | 截图 | 备注 |
|--------|------|------|------|
| 首页创建面试入口 | ✓ PASS | 01-homepage.png | 正常显示 |
| 配置页5项输入 | ✓ PASS | 02-config-page.png | 所有输入框可用 |
| 面试者流式聊天 | ✓ PASS | 05-first-question.png | 流式输出正常 |
| ... | ... | ... | ... |

## API 验证结果

| API | 状态 | 备注 |
|-----|------|------|
| POST /api/interview/create | ✓ PASS | 返回正确数据 |
| ... | ... | ... |

## 数据库验证结果

| 数据表 | 状态 | 备注 |
|--------|------|------|
| interviews | ✓ PASS | 结构正确 |
| ... | ... | ... |

## 未完成项

[如果有未完成的功能，列出清单]

## 验证覆盖率

- 功能覆盖率: X/Y (XX%)
- API覆盖率: X/Y (XX%)
- 数据库覆盖率: X/Y (XX%)

## 总体结论

[如果100%完成，输出 "✓ 100% COMPLETE - 所有需求已实现并验证通过"]
[如果有未完成项，输出 "⚠ PARTIAL - 存在N项未完成，需要继续实现"]
```

---

## 6. 验证失败的补救流程

如果验证发现未完成的功能：

1. **记录未完成项清单**
2. **回到实现计划文档**
3. **找到对应的 Task**
4. **执行该 Task 的所有 Step**
5. **重新验证该功能**
6. **重复直到100%完成**

---

## 7. Agent 自主验证指令

当 agent 完成实现计划后，应该自动执行以下验证流程：

**验证触发指令**:

```
执行自动化验证流程：

1. 启动后端和前端服务
2. 使用 /playwright skill 打开浏览器
3. 按照 VERIFICATION.md 第3节的验证清单逐项验证
4. 对每个验证点截图保存
5. 执行 API 和数据库验证脚本
6. 输出完整的验证报告

验证目标是100%完成所有需求，如果发现未完成项，继续实现直到全部完成。
```

---

## 8. 截图验证标准

每个截图应满足以下标准：

| 截图编号 | 验证内容 | 关键元素 |
|---------|---------|---------|
| 01-homepage.png | 首页 | 标题、创建面试按钮、面试记录按钮 |
| 02-config-page.png | 配置页 | 5个文本输入框、2个数字输入框、开始面试按钮 |
| 03-interviewer-page.png | 面试官页面 | 控制按钮面板、聊天框、手动输入框 |
| 04-candidate-page.png | 面试者页面 | 聊天框、准备好了按钮、输入框 |
| 05-first-question.png | AI问题 | 流式输出文本、光标动画 |
| 06-ai-response.png | AI回应 | AI生成的新问题 |
| 07-interviewer-sync.png | 实时同步 | 面试官页面显示面试者回答 |
| 08-interview-ended.png | 面试结束 | 结束提示 |
| 09-report-generated.png | 报告生成 | 报告内容显示 |
| 10-history-page.png | 历史列表 | 面试记录列表 |
| 11-detail-page-config.png | 详情配置 | 配置Tab内容 |
| 12-detail-page-chat.png | 详情聊天 | 聊天记录Tab内容 |
| 13-detail-page-report.png | 详情报告 | 报告Tab内容 |

---

**验证完成标志**: 所有27个P0功能验证点 + 10个API验证点 + 3个数据库验证点 = **40项全部PASS**

**自动化要求**: Agent 应自主执行验证，无需人工干预，直到输出 "✓ 100% COMPLETE"。