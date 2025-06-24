import { CheckCircle, Clock, Loader2 } from "lucide-react";
import type { ParseStatus } from "@shared/schema";

interface ProgressTrackerProps {
  status: ParseStatus;
}

export function ProgressTracker({ status }: ProgressTrackerProps) {
  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'complete':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'running':
        return <Loader2 className="text-primary animate-spin" size={16} />;
      case 'error':
        return <CheckCircle className="text-red-500" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getProgress = (state: string) => {
    switch (state) {
      case 'complete':
        return 100;
      case 'running':
        return 75;
      case 'error':
        return 50;
      default:
        return 0;
    }
  };

  const getProgressColor = (state: string) => {
    switch (state) {
      case 'complete':
        return 'bg-green-500';
      case 'running':
        return 'bg-primary';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const steps = [
    { key: 'astGeneration', label: 'AST Generation', status: status.astGeneration },
    { key: 'hookDetection', label: 'Hook Detection', status: status.hookDetection },
    { key: 'importAnalysis', label: 'Import Analysis', status: status.importAnalysis },
    { key: 'schemaValidation', label: 'Schema Validation', status: status.schemaValidation },
  ];

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div key={step.key} className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{step.label}</span>
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(step.status)}`}
                style={{ width: `${getProgress(step.status)}%` }}
              />
            </div>
            {getStatusIcon(step.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
