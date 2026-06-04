import { login, signInWithGoogle } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return redirect("/dashboard");
  }

  return (
    <div className="relative flex flex-1 items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* ── Background effects ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-float" />
        <div
          className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-info/5 rounded-full blur-[100px] animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-[40%] left-[-5%] w-[300px] h-[300px] bg-accent/3 rounded-full blur-[80px] animate-float"
          style={{ animationDelay: "4s" }}
        />

        {/* Floating particles (CSS-only) */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${(i % 3) + 1}px`,
              height: `${(i % 3) + 1}px`,
              left: `${(i * 5 + 10) % 100}%`,
              top: `${(i * 7 + 50) % 100 + 100}%`,
              background: `rgba(57, 255, 20, ${(i % 4) * 0.08 + 0.08})`,
              animation: `particle-drift ${(i % 5) * 3 + 12}s linear infinite`,
              animationDelay: `${(i % 7) * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* ── Login Card ── */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Animated gradient border wrapper */}
        <div className="animated-border rounded-2xl">
          <div className="glass-strong rounded-2xl p-8">
            {/* Logo / Header */}
            <div className="text-center mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 mb-6 group"
              >
                <Sparkles className="w-7 h-7 text-primary group-hover:animate-pulse-glow transition-all" />
                <span className="font-bold text-2xl tracking-tighter text-primary">
                  STAKEMATE
                </span>
              </Link>
              <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
              <p className="text-muted-foreground text-sm">
                Sign in to continue your commitments
              </p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground/80"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl text-base"
                  />
                </div>
              </div>

              {/* Magic Link Button */}
              <Button
                formAction={login}
                className="relative w-full h-12 rounded-xl text-base font-semibold overflow-hidden group"
              >
                {/* Shimmer overlay */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <span className="relative inline-flex items-center gap-2">
                  Send Magic Link
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>

              {/* Status messages */}
              {params?.message && (
                <div className="p-4 rounded-xl glass text-center text-sm text-info animate-fade-in-up">
                  {params.message}
                </div>
              )}
              {params?.error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center text-sm text-destructive animate-fade-in-up">
                  {params.error}
                </div>
              )}
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-3 text-muted-foreground backdrop-blur-sm">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign-in */}
            <form action={signInWithGoogle}>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl text-base font-medium border-border/50 hover:bg-muted/30 hover:border-primary/30 transition-all"
                type="submit"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground/60 mt-8">
              By signing in, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
