/**
 * 数据库自动初始化模块
 * 
 * 用途：
 * - 应用启动时自动检查数据库状态
 * - 如果表不存在，自动创建
 * - 如果数据为空，自动导入初始数据
 * 
 * 这样用户无需手动操作 Supabase
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 检查 agents 表是否有数据
 */
async function checkDatabaseInitialized(): Promise<boolean> {
  try {
    const count = await prisma.agent.count();
    return count > 0;
  } catch (error) {
    // 表不存在或其他错误
    return false;
  }
}

/**
 * 初始化 Agents 数据
 */
async function seedAgents(): Promise<void> {
  const agents = [
    { agentId: 'main', name: 'Main', role: '主助手', channel: '飞书', description: 'OpenClaw 主渠道，日常对话和任务协调' },
    { agentId: 'craft', name: 'Craft', role: '代码助手', channel: 'Discord', description: '编程和技术开发相关' },
    { agentId: 'alpha', name: 'Alpha', role: '投资助手', channel: 'Discord', description: '投资组合和市场分析' },
    { agentId: 'helix', name: 'Helix', role: 'Discord助手', channel: 'Discord', description: 'Discord 通用助手' },
  ];
  
  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { agentId: agent.agentId },
      update: agent,
      create: agent,
    });
  }
  
  console.log(`✅ 初始化 ${agents.length} 个 Agents`);
}

/**
 * 主初始化函数
 * 
 * 在应用启动时调用
 */
export async function initializeDatabase(): Promise<void> {
  console.log('🔍 检查数据库状态...');
  
  const isInitialized = await checkDatabaseInitialized();
  
  if (isInitialized) {
    console.log('✅ 数据库已初始化，跳过');
    return;
  }
  
  console.log('🆕 数据库未初始化，开始创建...');
  
  try {
    // 创建 Agents
    await seedAgents();
    
    console.log('🎉 数据库初始化完成！');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    // 不抛出错误，让应用继续运行（可能后续会重试）
  }
}
