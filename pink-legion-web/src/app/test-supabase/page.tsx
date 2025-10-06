'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testando...');
  const [envVars, setEnvVars] = useState<any>({});
  const [error, setError] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const testConnection = async () => {
      try {
        // Verificar variáveis de ambiente
        const env = {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Definida' : 'Não definida'
        };
        setEnvVars(env);

        // Testar conexão básica
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

        if (error) {
          setError(`Erro Supabase: ${error.message}`);
          setConnectionStatus('Erro na conexão');
        } else {
          setConnectionStatus('Conexão bem-sucedida');
        }
      } catch (err: any) {
        setError(`Erro JavaScript: ${err.message}`);
        setConnectionStatus('Erro na conexão');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teste de Conexão Supabase</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Status da Conexão</h2>
            <p className={`text-lg ${connectionStatus === 'Conexão bem-sucedida' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Variáveis de Ambiente</h2>
            <div className="space-y-2">
              <p><strong>SUPABASE_URL:</strong> {envVars.url || 'Não definida'}</p>
              <p><strong>SUPABASE_ANON_KEY:</strong> {envVars.key}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-red-800">Erro Detectado</h2>
              <p className="text-red-700 font-mono text-sm">{error}</p>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Informações do Cliente Supabase</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {mounted ? JSON.stringify({
                clienteInicializado: !!supabase,
                timestamp: new Date().toISOString()
              }, null, 2) : 'Carregando...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}