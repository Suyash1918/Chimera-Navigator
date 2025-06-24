import { useAuth } from '@/components/auth-provider';
import { DemoMode } from '@/components/demo-mode';
import { Dashboard as DashboardComponent } from '@/components/dashboard';
import { AuthHeader } from '@/components/auth-header';
import { AccountStatus } from '@/components/account-status';

export function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      
      <main className="container mx-auto px-4 py-8">
        {user ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <AccountStatus />
              </div>
              <div className="lg:col-span-3">
                <DashboardComponent />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold mb-4">ChimeraNavigator AI</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Advanced React/TypeScript Code Analysis Platform
            </p>
            <div className="max-w-2xl mx-auto text-left space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">AST Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Deep analysis of React components with Abstract Syntax Tree parsing
                  </p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Hooks Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    Identify and analyze React hooks usage patterns and dependencies
                  </p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Chat with AI for code insights, suggestions, and improvements
                  </p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Schema Editor</h3>
                  <p className="text-sm text-muted-foreground">
                    Modify JSON schemas using natural language commands
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;