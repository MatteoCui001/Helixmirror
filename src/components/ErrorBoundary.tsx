/**
 * 错误边界组件 - Helix Mirror
 * 
 * 用途：
 * - 捕获 React 组件树中的 JavaScript 错误
 * - 防止单个组件崩溃导致整个页面白屏
 * - 显示友好的错误提示和恢复选项
 * 
 * 为什么需要错误边界：
 * - Next.js 默认没有全局错误处理
 * - 数据库查询、API 调用可能失败
 * - 提升用户体验，避免白屏
 */

'use client';

import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary 组件
 * 
 * 使用方法：
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 * 
 * 或自定义 fallback：
 *   <ErrorBoundary fallback={<CustomError />}>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * 静态方法：在 render 阶段捕获错误
   * 返回新的 state，触发重新渲染
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * 在 commit 阶段捕获错误详情
   * 可用于日志上报
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // TODO: 可以在这里添加错误上报（如 Sentry）
    // reportError(error, errorInfo);
  }

  /**
   * 重置错误状态，尝试恢复
   */
  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-white mb-2">
              页面出错了
            </h2>
            <p className="text-gray-400 mb-6">
              抱歉，遇到了意外错误。请尝试刷新页面或返回首页。
            </p>
            
            {this.state.error && (
              <div className="bg-gray-900 rounded p-3 mb-6 text-left">
                <p className="text-red-400 text-sm font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
              >
                重试
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                返回首页
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 简化的错误边界 HOC
 * 
 * 用于快速包裹组件
 * 
 * 示例：
 *   const SafeComponent = withErrorBoundary(MyComponent);
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
