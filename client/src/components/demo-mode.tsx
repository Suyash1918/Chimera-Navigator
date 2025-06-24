import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Play, Brain, Code, Zap } from 'lucide-react';

export function DemoMode() {
  const [demoStep, setDemoStep] = useState(0);

  const demoSteps = [
    {
      title: "Welcome to ChimeraNavigator Demo",
      content: "Experience the power of AI-driven code analysis without authentication.",
      icon: <Brain className="h-6 w-6" />
    },
    {
      title: "Upload React Project",
      content: "In production, you'd upload your React/TypeScript files for analysis.",
      icon: <Code className="h-6 w-6" />
    },
    {
      title: "AI Analysis",
      content: "Our AI would parse your code, extract components, hooks, and dependencies.",
      icon: <Zap className="h-6 w-6" />
    },
    {
      title: "Project Chimera Integration",
      content: "Natural language commands would trigger automated code transformations.",
      icon: <Brain className="h-6 w-6" />
    }
  ];

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Demo Mode: Authentication is currently unavailable. This demo shows the platform's capabilities.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {demoSteps[demoStep].icon}
            {demoSteps[demoStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{demoSteps[demoStep].content}</p>
          
          <div className="flex gap-2">
            {demoStep > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setDemoStep(demoStep - 1)}
              >
                Previous
              </Button>
            )}
            {demoStep < demoSteps.length - 1 && (
              <Button onClick={() => setDemoStep(demoStep + 1)}>
                Next Step
              </Button>
            )}
            {demoStep === demoSteps.length - 1 && (
              <Button onClick={() => setDemoStep(0)} variant="outline">
                Restart Demo
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-500">
            Step {demoStep + 1} of {demoSteps.length}
          </div>
        </CardContent>
      </Card>

      {demoStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Platform Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• AI-powered React/TypeScript analysis</li>
              <li>• Natural language schema modifications</li>
              <li>• Automated code transformations with Project Chimera</li>
              <li>• Real-time AI chat for code insights</li>
              <li>• Subscription-based access (Free trial + Pro plans)</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}