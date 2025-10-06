'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugErrorPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    setLogs([]);
    
    try {
      addLog('Iniciando teste de conexão Supabase...');
      
      // Teste 1: Verificar se o cliente foi inicializado
      addLog(`Cliente Supabase inicializado: ${!!supabase}`);
      
      // Teste 2: Verificar variáveis de ambiente
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      addLog(`URL definida: ${!!url} (${url ? url.substring(0, 30) + '...' : 'undefined'})`);
      addLog(`Key definida: ${!!key} (${key ? key.substring(0, 30) + '...' : 'undefined'})`);
      
      // Teste 3: Testar query simples
      addLog('Testando query na tabela profiles...');
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        addLog(`❌ Erro na query: ${error.message}`);
        addLog(`Código do erro: ${error.code || 'N/A'}`);
        addLog(`Detalhes: ${error.details || 'N/A'}`);
        addLog(`Hint: ${error.hint || 'N/A'}`);
      } else {
        addLog(`✅ Query bem-sucedida! Registros encontrados: ${count}`);
        addLog(`Dados retornados: ${JSON.stringify(data, null, 2)}`);
      }
      
      // Teste 4: Testar autenticação
      addLog('Testando status de autenticação...');
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        addLog(`❌ Erro na autenticação: ${authError.message}`);
      } else {
        addLog(`✅ Status de autenticação: ${session ? 'Logado' : 'Não logado'}`);
        if (session) {
          addLog(`Usuário: ${session.user.email}`);
        }
      }
      
      // Teste 5: Testar conexão com auth
      addLog('Testando tentativa de login com credenciais inválidas...');
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: 'test@invalid.com',
        password: 'invalid'
      });
      
      if (loginError) {
        addLog(`✅ Erro esperado de login: ${loginError.message}`);
      } else {
        addLog(`❌ Login não deveria ter funcionado!`);
      }
      
    } catch (error) {
      addLog(`❌ Erro inesperado: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Debug - Erro de Schema</h1>
          
          <div className="mb-6">
            <button
              onClick={testSupabaseConnection}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Testando...' : 'Executar Testes de Conexão'}
            </button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p>Clique no botão acima para executar os testes...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          
          <div className="mt-6 text-sm text-gray-600">
            <p><strong>Objetivo:</strong> Identificar a origem do erro "Database error querying schema"</p>
            <p><strong>Testes:</strong> Conexão, variáveis de ambiente, queries, autenticação</p>
          </div>
        </div>
      </div>
    </div>
  );
}