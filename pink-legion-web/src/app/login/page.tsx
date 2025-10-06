'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    logger.info('Login page loaded', 'LOGIN_PAGE');
    
    // Verificar se já está logado
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          logger.auth('User already authenticated, redirecting to dashboard', { userId: session.user.id });
          router.push('/dashboard');
        }
      } catch (error) {
        logger.authError('Error checking authentication status', error as Error);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    logger.auth('Login attempt started', { email });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.authError('Login failed', error, { email, errorCode: error.message });
        setError(error.message);
      } else {
        logger.auth('Login successful', { 
          userId: data.user?.id, 
          email: data.user?.email,
          sessionId: data.session?.access_token?.substring(0, 10) + '...'
        });
        
        // Redirecionar para o dashboard após login bem-sucedido
        router.push('/dashboard');
      }
    } catch (unexpectedError) {
      logger.authError('Unexpected login error', unexpectedError as Error, { email });
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
      logger.auth('Login attempt completed', { email, loading: false });
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-gold-50 to-rose-gold-100 dark:from-bg-dark dark:to-bg-dark-surface p-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-rose-gold-600 dark:text-rose-gold-400 mb-2">
            Pink Legion
          </CardTitle>
          <CardDescription>
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="Email"
                placeholder="seu@email.com"
              />

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Senha"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium"
              size="lg"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}