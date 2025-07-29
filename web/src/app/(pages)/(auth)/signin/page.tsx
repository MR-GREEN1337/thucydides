"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Github, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/global/logo';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.218,0-9.557-3.473-11.178-8.244l-6.571,4.819C9.21,39.774,16.023,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.089,5.574l6.19,5.238C39.99,34.546,44,28.728,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  // Show a toast if NextAuth redirects with an error
  useEffect(() => {
    if (error) {
      // Decode the error message in case it has URL-encoded characters
      const decodedError = decodeURIComponent(error);
      toast.error("Sign In Failed", { description: decodedError });
    }
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn('credentials', {
      redirect: false, // We handle the redirect manually after checking the result
      username: email,
      password: password,
    });

    setIsLoading(false);

    if (result?.ok) {
      toast.success("Welcome back!");
      // Redirect to the dashboard upon successful login
      router.push('/dashboard');
    } else {
      // The error is passed via URL query param, which the useEffect hook handles
      // We can also show a toast here for immediate feedback if desired
      toast.error("Sign In Failed", { description: result?.error || "Incorrect email or password." });
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="w-full max-w-md text-white mx-auto">
      <div className="mb-8">
        <Logo size="large" hideText />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Log in</h1>
      <p className="text-zinc-400 mb-8">Continue your dialogue with the past.</p>

      <div className="grid grid-cols-1 gap-3">
          <Button onClick={handleGoogleLogin} variant="outline" className="w-full justify-center gap-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white" disabled={isLoading}>
            <GoogleIcon className="size-5"/>
            Continue with Google
          </Button>
          <Button variant="outline" className="w-full justify-center gap-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white" disabled={isLoading}>
            <Github className="size-5"/>
            Continue with GitHub
          </Button>
      </div>

      <div className="flex items-center my-8">
        <div className="flex-grow border-t border-zinc-800"></div>
        <span className="flex-shrink mx-4 text-xs text-zinc-500 uppercase">Or</span>
        <div className="flex-grow border-t border-zinc-800"></div>
      </div>

      <form onSubmit={handleLogin} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email" type="email" placeholder="herodotus@halicarnassus.com" required
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
            className="bg-zinc-900 border-zinc-800 focus:bg-zinc-900 focus:ring-zinc-500"
          />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="ml-auto inline-block text-sm text-zinc-400 hover:text-white underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password" type="password" placeholder="••••••••" required
            value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
            className="bg-zinc-900 border-zinc-800 focus:bg-zinc-900 focus:ring-zinc-500"
          />
        </div>
        <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 mt-4" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log In
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-zinc-400">
        Don't have an account?{' '}
        <Link href="/signup" className="underline font-medium text-white hover:text-zinc-200">
          Create one
        </Link>
      </div>
    </div>
  );
}
