import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Wand2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SchemaModifierProps {
  projectId?: number;
  currentSchema: any;
  onSchemaUpdate?: (newSchema: any) => void;
}

interface SchemaModificationResult {
  success: boolean;
  modifiedSchema: any;
  explanation: string;
}

export function SchemaModifier({ projectId, currentSchema, onSchemaUpdate }: SchemaModifierProps) {
  const [command, setCommand] = useState('');
  const [lastResult, setLastResult] = useState<SchemaModificationResult | null>(null);
  const { toast } = useToast();

  const modifyMutation = useMutation({
    mutationFn: async (command: string): Promise<SchemaModificationResult> => {
      const response = await apiRequest('/api/ai/modify-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          currentSchema,
          projectId,
        }),
      });
      return response;
    },
    onSuccess: (result) => {
      setLastResult(result);
      if (result.success) {
        toast({
          title: "Schema Modified",
          description: result.explanation,
        });
        if (onSchemaUpdate) {
          onSchemaUpdate(result.modifiedSchema);
        }
      } else {
        toast({
          title: "Modification Failed",
          description: result.explanation,
          variant: "destructive",
        });
      }
      setCommand('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process schema modification",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    modifyMutation.mutate(command.trim());
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Schema Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Natural Language Command
              </label>
              <Textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Example: Add a required email field with validation..."
                className="min-h-[80px]"
                disabled={modifyMutation.isPending}
              />
            </div>
            <Button 
              type="submit" 
              disabled={!command.trim() || modifyMutation.isPending}
              className="w-full"
            >
              {modifyMutation.isPending ? 'Processing...' : 'Modify Schema'}
            </Button>
          </form>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Example Commands:</h4>
            <div className="flex flex-wrap gap-2">
              {[
                "Add a required name field",
                "Remove the deprecated field",
                "Make age field optional",
                "Add email validation",
                "Create a nested address object"
              ].map((example) => (
                <Badge 
                  key={example}
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => setCommand(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Modification Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">{lastResult.explanation}</p>
            {lastResult.success && (
              <div>
                <h4 className="text-sm font-medium mb-2">Modified Schema:</h4>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(lastResult.modifiedSchema, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}