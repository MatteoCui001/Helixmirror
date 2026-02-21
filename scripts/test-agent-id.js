/**
 * Agent 识别测试脚本
 * 
 * 使用方法：node scripts/test-agent-id.js
 */

const { identifyAgentByMessage, getAgentInfo } = require('./lib/agent-config');

const testCases = [
  { message: "收到了，我来处理这个任务", channel: "飞书", expected: "main" },
  { message: "我来修复这个代码bug", channel: "Discord", expected: "craft" },
  { message: "分析一下特斯拉的财报", channel: "Discord", expected: "alpha" },
  { message: "你好，有什么可以帮你的？", channel: "Discord", expected: "helix" },
  { message: "npm run build 构建失败了", channel: "Discord", expected: "craft" },
  { message: "  Helix Mirror   同步失败", channel: "Discord", expected: "craft" },
  { message: "这支股票值得买吗？", channel: "Discord", expected: "alpha" }
];

console.log('🧪 Agent 识别测试\n');
console.log('='.repeat(60));

let passed = 0;

for (const test of testCases) {
  const result = identifyAgentByMessage(test.message, test.channel);
  const agent = getAgentInfo(result.agentId);
  const success = result.agentId === test.expected;
  
  console.log(`\n${success ? '✅' : '❌'} ${test.message.slice(0, 30)}...`);
  console.log(`   渠道: ${test.channel} → 识别: ${agent?.name} (${(result.confidence * 100).toFixed(0)}%)`);
  
  if (success) passed++;
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 结果: ${passed}/${testCases.length} 通过`);
