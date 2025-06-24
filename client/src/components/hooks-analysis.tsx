import { Badge } from "@/components/ui/badge";
import { Link2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactHook } from "@shared/schema";

export function HooksAnalysis() {
  const { data: projects } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: parseResult } = useQuery({
    queryKey: ["/api/projects", projects?.[0]?.id, "results"],
    enabled: !!projects?.[0]?.id,
  });

  const hooks: ReactHook[] = parseResult?.hooks || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">React Hooks Analysis</h3>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {hooks.length} hooks detected
        </Badge>
      </div>

      <div className="space-y-4">
        {hooks.length > 0 ? (
          hooks.map((hook, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Link2 className="text-blue-600" size={16} />
                  <span className="font-mono text-sm font-medium text-gray-900">{hook.type}</span>
                  <span className="text-sm text-gray-600">in Component</span>
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
                    <div className="ml-4 text-green-600 italic">// Effect logic</div>
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
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Link2 size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No React hooks detected</p>
            <p className="text-sm">Upload React components to analyze hook usage</p>
          </div>
        )}
      </div>
    </div>
  );
}
