import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogOut, User, Brain, HelpCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from './auth-provider';
import { signInWithGoogle, logout } from '@/lib/firebase';

export function AuthHeader() {
  const { user, dbUser, loading } = useAuth();
  const [showAuthHelp, setShowAuthHelp] = useState(false);
  const currentDomain = window.location.hostname;

  const handleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      console.log('Sign in successful:', result.user?.displayName);
    } catch (error: any) {
      console.error('Sign in failed:', error);
      
      // Show user-friendly error message
      if (error.message) {
        alert(`Sign-in error: ${error.message}`);
      } else {
        alert('Sign-in failed. Please check your internet connection and try again.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">ChimeraNavigator</span>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user.displayName || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Dialog open={showAuthHelp} onOpenChange={setShowAuthHelp}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Setup Help
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Firebase Authentication Setup</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Domain Authorization Required</AlertTitle>
                      <AlertDescription>
                        This domain needs to be authorized in your Firebase Console for sign-in to work.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Quick Fix Steps:</h4>
                      <ol className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                          <div>
                            Go to{' '}
                            <Button variant="link" className="p-0 h-auto" asChild>
                              <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">
                                Firebase Console <ExternalLink className="h-3 w-3 inline" />
                              </a>
                            </Button>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                          <span>Navigate to Authentication → Settings → Authorized domains</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                          <div>
                            Add this domain: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{currentDomain}</code>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
                          <span>Or add <code className="bg-gray-100 px-2 py-1 rounded text-xs">*.replit.dev</code> for all Replit domains</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">5</span>
                          <span>Save and refresh this page</span>
                        </li>
                      </ol>
                    </div>
                    
                    <Button 
                      onClick={() => window.location.reload()} 
                      className="w-full"
                    >
                      Refresh Page After Setup
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={handleSignIn} className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Sign In with Google
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}