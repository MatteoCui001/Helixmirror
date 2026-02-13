/**
 * OpenClaw 数据解析器
 * 
 * 用途：读取 OpenClaw 的真实日志，提取交互记录
 * 
 * 更新记录：
 * - Phase 2: 改进 Agent 识别逻辑，支持 Discord 多 Agent 区分
 * 
 * 数据来源：
 * - ~/.openclaw/logs/gateway.log
 * - 解析 deliver called 日志条目
 * 
 * Agent 识别策略：
 * 1. 飞书渠道 → Main
 * 2. Discord 渠道 → 根据消息内容关键词识别（craft/alpha/helix）
 */

import * as fs from 'fs';
import * as path from 'path';
import { identifyAgentByMessage, identifyAgentByWorkspace, getAgentInfo } from './agent-config';

/**
 * 消息批次类型
 * 用于聚合 5 分钟内的连续消息
 */
interface MessageBatch {
  timestamp: Date;
  messages: string[];
  channel: string;
  agentId?: string;
}

/**
 * OpenClaw 交互记录数据结构
 */
export interface OpenClawInteraction {
  agentId: string;
  agentName: string;
  channel: string;
  messagePreview: string;
  messageCount: number;
  timestamp: Date;
  source: string;
  confidence: number;  // 识别置信度 0-1
}

/**
 * 解析 gateway.log 文件
 * 
 * 日志格式：
 * 2026-02-11T09:17:44.806Z [feishu] feishu[default] deliver called: text=消息内容
 * 
 * 聚合策略：
 * 5 分钟内的连续消息视为一次交互
 */
export function parseGatewayLog(logPath: string): OpenClawInteraction[] {
  const interactions: OpenClawInteraction[] = [];
  
  if (!fs.existsSync(logPath)) {
    console.warn(`⚠️ 日志文件不存在: ${logPath}`);
    return interactions;
  }
  
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  
  // 按时间窗口聚合消息
  let currentBatch: MessageBatch | null = null;
  const batches: MessageBatch[] = [];
  
  for (const line of lines) {
    // 匹配时间戳和渠道
    const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+\[(\w+)\]/);
    if (!match) continue;
    
    const timestamp = new Date(match[1]);
    const channel = match[2] === 'feishu' ? '飞书' : 'Discord';
    
    // 提取消息内容
    const textMatch = line.match(/deliver called:\s*text=(.+)$/);
    if (!textMatch) continue;
    
    const message = textMatch[1].trim();
    
    // 飞书直接确定 Agent
    let agentId: string | undefined;
    if (channel === '飞书') {
      agentId = 'main';
    }
    
    // 检查是否在同一时间窗口（5分钟）
    if (currentBatch && 
        channel === currentBatch.channel &&
        (timestamp.getTime() - currentBatch.timestamp.getTime()) < 5 * 60 * 1000) {
      currentBatch.messages.push(message);
    } else {
      if (currentBatch) batches.push(currentBatch);
      currentBatch = { timestamp, messages: [message], channel, agentId };
    }
  }
  
  if (currentBatch) batches.push(currentBatch);
  
  // 转换为交互记录
  for (const batch of batches) {
    if (batch.messages.length === 0) continue;
    
    // 合并所有消息用于识别
    const fullContent = batch.messages.join(' ');
    
    // 识别 Agent
    let agentId = batch.agentId;
    let confidence = 1.0;
    
    if (!agentId) {
      // Discord 渠道需要分析内容
      const identification = identifyAgentByMessage(fullContent, batch.channel);
      agentId = identification.agentId;
      confidence = identification.confidence;
    }
    
    const agent = getAgentInfo(agentId);
    const preview = batch.messages[0].slice(0, 100) + 
      (batch.messages[0].length > 100 ? '...' : '');
    
    interactions.push({
      agentId: agentId,
      agentName: agent?.name || 'Unknown',
      channel: batch.channel,
      messagePreview: preview,
      messageCount: batch.messages.length,
      timestamp: batch.timestamp,
      source: logPath,
      confidence
    });
  }
  
  return interactions;
}

/**
 * 过滤已存在的记录（基于时间戳去重）
 */
export function filterNewInteractions(
  interactions: OpenClawInteraction[],
  existingTimestamps: Date[]
): OpenClawInteraction[] {
  return interactions.filter(interaction => {
    // 允许 1 分钟的时间差
    const timeExists = existingTimestamps.some(existing => 
      Math.abs(existing.getTime() - interaction.timestamp.getTime()) < 60 * 1000
    );
    return !timeExists;
  });
}

/**
 * 获取所有 OpenClaw 交互记录
 * 
 * 主入口函数
 */
export function getAllOpenClawInteractions(logPath?: string): OpenClawInteraction[] {
  const targetPath = logPath || path.join(process.env.HOME || '~', '.openclaw', 'logs', 'gateway.log');
  
  console.log(`🔍 解析日志: ${targetPath}`);
  
  const interactions = parseGatewayLog(targetPath);
  
  // 按时间排序
  interactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  // 打印识别统计
  const stats: Record<string, number> = {};
  for (const i of interactions) {
    stats[i.agentId] = (stats[i.agentId] || 0) + 1;
  }
  
  console.log('📊 识别统计:');
  for (const [agent, count] of Object.entries(stats)) {
    console.log(`   ${agent}: ${count} 条`);
  }
  
  return interactions;
}

// 导出配置模块的函数
export { identifyAgentByMessage, identifyAgentByWorkspace, getAgentInfo };
