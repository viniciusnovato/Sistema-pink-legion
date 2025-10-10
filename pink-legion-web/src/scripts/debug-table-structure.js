const { createClient } = require('@supabase/supabase-js');

// Usar as variáveis de ambiente diretamente
const supabaseUrl = 'https://bzkgjtxrzwzoibzesphi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjM0MDgsImV4cCI6MjA3NDI5OTQwOH0.6SUGAzZK6-8R4uJj_VDAXdz3log6Zux8mqaDiGdDZp0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTableStructure() {
  console.log('🔍 Verificando estrutura das tabelas...\n');
  
  // Tentar inserir um documento de teste para ver quais campos são aceitos
  console.log('📋 Testando inserção na tabela documents:');
  
  // Primeiro, vamos tentar uma query simples para ver se a tabela existe
  try {
    const { data, error, count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('❌ Erro ao acessar tabela documents:', error);
      console.log('   Código:', error.code);
      console.log('   Mensagem:', error.message);
      console.log('   Detalhes:', error.details);
    } else {
      console.log(`✅ Tabela documents existe e tem ${count} registros`);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar tabela documents:', error);
  }
  
  console.log('\n');
  
  // Verificar tabela contracts
  console.log('📋 Testando inserção na tabela contracts:');
  try {
    const { data, error, count } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('❌ Erro ao acessar tabela contracts:', error);
      console.log('   Código:', error.code);
      console.log('   Mensagem:', error.message);
      console.log('   Detalhes:', error.details);
    } else {
      console.log(`✅ Tabela contracts existe e tem ${count} registros`);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar tabela contracts:', error);
  }
  
  console.log('\n');
  
  // Listar todas as tabelas disponíveis
  console.log('📊 Listando todas as tabelas disponíveis:');
  try {
    // Tentar algumas tabelas conhecidas
    const tables = ['profiles', 'clients', 'cars', 'contracts', 'documents', 'payments', 'installments'];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (!error) {
          console.log(`✅ ${table}: ${count} registros`);
        } else {
          console.log(`❌ ${table}: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Erro ao acessar`);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error);
  }
  
  console.log('\n');
  
  // Verificar se há dados em alguma tabela
  console.log('🔍 Procurando dados em tabelas existentes:');
  try {
    // Verificar clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);
      
    if (!clientsError && clients) {
      console.log(`📋 Clientes encontrados: ${clients.length}`);
      if (clients.length > 0) {
        console.log(`   Primeiro cliente: ${clients[0].full_name} (ID: ${clients[0].id})`);
      }
    }
    
    // Verificar cars
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .limit(5);
      
    if (!carsError && cars) {
      console.log(`🚗 Carros encontrados: ${cars.length}`);
      if (cars.length > 0) {
        console.log(`   Primeiro carro: ${cars[0].brand} ${cars[0].model} (ID: ${cars[0].id})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
  }
}

debugTableStructure().then(() => {
  console.log('\n✅ Debug da estrutura concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no debug:', error);
  process.exit(1);
});