import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: username.trim(),
          password: password.trim(),
        }),
      });

      if (response.ok) {
        const { user } = await response.json();
        localStorage.setItem("userId", user.id);
        localStorage.setItem("username", user.username);
        setLocation("/");
      } else {
        const { error } = await response.json();
        toast({
          variant: "destructive",
          title: isLogin ? "Login failed" : "Registration failed",
          description: error || "Please try again",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary p-4">
              <MessageCircle className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-sm">
            {isLogin 
              ? "Enter your credentials to continue" 
              : "Choose a username and password to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoFocus
                data-testid="input-username"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                data-testid="input-password"
                className="h-12 text-base"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading || !username.trim() || !password.trim()}
              data-testid="button-submit"
            >
              {isLoading ? "Please wait..." : (isLogin ? "Login" : "Create Account")}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                disabled={isLoading}
                data-testid="button-toggle-mode"
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Login"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
