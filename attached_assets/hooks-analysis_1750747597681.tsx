import { Badge } from "@/components/ui/badge";
import { Link2 } from "lucide-react";
import type { ReactHook } from "@shared/schema";

const mockHooks: ReactHook[] = [
  {
    type: 'useState',
    astPath: '/VariableDeclarator[id.type=ArrayPattern][init.callee.name=useState]',
    sourceLocation: { startLine: 15, endLine: 18 },
    state: 'isVisible',
    setter: 'setIsVisible',
    initialValue: false
  },
  {
    type: 'useEffect',
    astPath: '/CallExpression[callee.name=useEffect]',
    sourceLocation: { startLine: 20, endLine: 25 },
    dependencies: ['isVisible']
  }
];

export function HooksAnalysis() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">React Hooks Analysis</h3>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {mockHooks.length} hooks detected
        </Badge>
      </div>

      <div className="space-y-4">
        {mockHooks.map((hook, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Link2 className="text-blue-600" size={16} />
                <span className="font-mono text-sm font-medium text-gray-900">{hook.type}</span>
                <span className="text-sm text-gray-600">in HeroSection.jsx</span>
              </div>
              <span className="text-xs text-gray-500">
                Line {hook.sourceLocation.startLine}-{hook.sourceLocation.endLine}
              </span>
            </div>

            <div className="bg-white rounded border p-3 font-mono text-sm mb-3">
              {hook.type === 'useState' ? (
                <div>
                  <span className="text-purple-600">const</span>{' '}
                  <span className="text-gray-900">[</span>
                  <span className="text-red-600">{hook.state}</span>
                  <span className="text-gray-900">, </span>
                  <span className="text-red-600">{hook.setter}</span>
                  <span className="text-gray-900">] = </span>
                  <span className="text-red-600">useState</span>
                  <span className="text-gray-900">(</span>
                  <span className="text-purple-600">{String(hook.initialValue)}</span>
                  <span className="text-gray-900">)</span>
                </div>
              ) : (
                <div>
                  <div>
                    <span className="text-red-600">useEffect</span>
                    <span className="text-gray-900">(() =&gt; &#123;</span>
                  </div>
                  <div className="ml-4 text-green-600 italic">// Animation trigger logic</div>
                  <div>
                    <span className="text-purple-600">&#125;, [</span>
                    <span className="text-red-600">{hook.dependencies?.join(', ')}</span>
                    <span className="text-purple-600">])</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              {hook.dependencies && (
                <div className="text-gray-600">
                  <span className="font-medium">Dependencies:</span>{' '}
                  {hook.dependencies.map((dep, i) => (
                    <Badge key={i} variant="outline" className="ml-1 bg-blue-100 text-blue-800">
                      {dep}
                    </Badge>
                  ))}
                </div>
              )}
              <code className="bg-gray-200 px-2 py-1 rounded">
                {hook.astPath.split('/').pop()}
              </code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
