#!/bin/bash

set -x
set -e

echo "🚀 开始清理 OpenCode 会话..."

# 1. 获取会话列表
# 这一步会将输出重定向到 session.list 文件
opencode session list > session.list

# 2. 提取纯净的 Session ID
# 使用 grep 筛选包含 'ses_' 的行，再用 awk 提取第一列（即ID），存入 ses.list
cat session.list | grep "ses_" | awk '{print $1}' > ses.list

# 3. 循环删除
# 读取 ses.list 中的每一个 ID 并执行删除命令
if [ -s ses.list ]; then
    count=0
    while read -r session_id; do
        # 执行删除命令
        opencode session delete "$session_id"
        
        # 简单的计数器，用于显示进度（可选）
        count=$((count + 1))
        echo "✅ 已删除: $session_id"
    done < ses.list
    echo "🎉 清理完成！共删除了 $count 个会话。"
else
    echo "⚠️ 未找到任何会话 ID，无需删除。"
fi

# 4. 清理临时文件 (可选，保持目录整洁)
rm -f session.list ses.list
echo "🧹 临时文件已清理。"
