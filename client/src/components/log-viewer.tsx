import { Terminal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Log } from "@shared/schema";

interface LogViewerProps {
  projectId?: number;
}

export function LogViewer({ projectId }: LogViewerProps) {
  const { data: logs = [] } = useQuery<Log[]>({
    queryKey: ["/api/projects", projectId, "logs"],
    enabled: !!projectId,
  });

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
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Terminal className="mr-2 text-gray-600" size={20} />
          Processing Logs
        </h3>
      </div>
      <div className="p-6">
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
          <div className="space-y-1 text-gray-100">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-2">
                  <span className={getLogColor(log.level)}>[{log.level}]</span>
                  <span className="text-gray-400">{formatTime(log.timestamp!)}</span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Terminal size={32} className="mx-auto mb-2 text-gray-600" />
                <p>No logs available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
