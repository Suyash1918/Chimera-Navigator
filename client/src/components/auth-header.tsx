import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Brain } from 'lucide-react';
import { useAuth } from './auth-provider';
import { signInWithGoogle, logout } from '@/lib/firebase';

export function AuthHeader() {
  const { user, loading } = useAuth();

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
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-none">Chimera</span>
            {/* MODIFICATION START: Changed to positive margin for rightward shift */}
            <span className="text-xs text-muted-foreground opacity-70 ml-14">By CIVA</span>
            {/* MODIFICATION END */}
          </div>
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