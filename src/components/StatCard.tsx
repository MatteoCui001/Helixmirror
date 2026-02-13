/**
 * 统计卡片组件
 * 
 * 用途：展示今日概览的关键指标
 * 
 * 设计特点：
 * - 大号数字突出显示
 * - 图标+颜色快速识别
 * - 简洁，只展示一个数字
 */

interface StatCardProps {
  title: string;      // 指标名称
  value: number;      // 数值
  icon: string;       // Emoji 图标
  color: 'blue' | 'purple' | 'green';  // 颜色主题
}

/**
 * 根据颜色主题返回对应的样式类
 */
function getColorClasses(color: StatCardProps['color']): { bg: string; icon: string } {
  const colorMap = {
    blue: {
      bg: 'bg-blue-900/20 border-blue-700',
      icon: 'bg-blue-500'
    },
    purple: {
      bg: 'bg-purple-900/20 border-purple-700',
      icon: 'bg-purple-500'
    },
    green: {
      bg: 'bg-green-900/20 border-green-700',
      icon: 'bg-green-500'
    }
  };
  return colorMap[color];
}

export function StatCard({ title, value, icon, color }: StatCardProps) {
  const colors = getColorClasses(color);

  return (
    <div className={`${colors.bg} border rounded-lg p-5 flex items-center space-x-4`}>
      {/* 图标 */}
      <div className={`${colors.icon} w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      
      {/* 文字内容 */}
      <div>
        <div className="text-gray-400 text-sm">{title}</div>
        <div className="text-3xl font-bold text-white">{value}</div>
      </div>
    </div>
  );
}
