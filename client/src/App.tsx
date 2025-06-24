import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth-provider";
import { Dashboard } from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { auth } from "@/lib/firebase";

// Set up auth headers for API requests
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (input, init = {}) => {
    const headers = new Headers(init.headers);
    
    // Add Firebase UID if user is authenticated
    if (auth.currentUser?.uid) {
      headers.set('x-firebase-uid', auth.currentUser.uid);
    }
    
    return originalFetch(input, {
      ...init,
      headers,
    });
  };
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
