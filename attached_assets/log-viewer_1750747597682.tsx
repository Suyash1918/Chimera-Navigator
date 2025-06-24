import { Terminal } from "lucide-react";
import type { Log } from "@shared/schema";

interface LogViewerProps {
  logs: Log[];
}

const mockLogs: Log[] = [
  {
    id: 1,
    projectId: 1,
    level: 'INFO',
    message: 'AST parsing started for HeroSection.jsx',
    metadata: {},
    timestamp: new Date('2024-01-15T10:32:15Z')
  },
  {
    id: 2,
    projectId: 1,
    level: 'DEBUG',
    message: 'Generated AST path: /FunctionDeclaration[name=HeroSection]/JSXElement[0]',
    metadata: {},
    timestamp: new Date('2024-01-15T10:32:16Z')
  },
  {
    id: 3,
    projectId: 1,
    level: 'INFO',
    message: 'Detected useState hook at line 15: isVisible, setIsVisible',
    metadata: {},
    timestamp: new Date('2024-01-15T10:32:16Z')
  },
  {
    id: 4,
    projectId: 1,
    level: 'INFO',
    message: 'Mapped dependency: react → useState, useEffect, useCallback',
    metadata: {},
    timestamp: new Date('2024-01-15T10:32:17Z')
  },
  {
    id: 5,
    projectId: 1,
    level: 'SUCCESS',
    message: 'Schema validation completed successfully',
    metadata: {},
    timestamp: new Date('2024-01-15T10:32:18Z')
  }
];

export function LogViewer({ logs }: LogViewerProps) {
  const displayLogs = logs.length > 0 ? logs : mockLogs;

  const getLogColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-400';
      case 'WARN':
        return 'text-yellow-400';
      case 'INFO':
        return 'text-green-400';
      case 'DEBUG':
        return 'text-blue-400';
      case 'SUCCESS':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Terminal className="mr-2 text-gray-600" size={20} />
          Structured Logs
        </h3>
      </div>
      <div className="p-6">
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
          <div className="space-y-1 text-gray-100">
            {displayLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2">
                <span className={getLogColor(log.level)}>[{log.level}]</span>
                <span className="text-gray-400">{formatTime(log.timestamp!)}</span>
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
