const { createClient } = require('@supabase/supabase-js');

// Usar as variáveis de ambiente diretamente
const supabaseUrl = 'https://bzkgjtxrzwzoibzesphi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjM0MDgsImV4cCI6MjA3NDI5OTQwOH0.6SUGAzZK6-8R4uJj_VDAXdz3log6Zux8mqaDiGdDZp0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAllContracts() {
  console.log('🔍 Investigando todos os contratos e documentos...\n');
  
  // 1. Listar todos os contratos
  console.log('📋 Todos os contratos:');
  try {
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (contractsError) {
      console.error('❌ Erro ao buscar contratos:', contractsError);
    } else {
      console.log(`   Total de contratos (últimos 10): ${contracts.length}`);
      contracts.forEach((contract, index) => {
        console.log(`\n   Contrato ${index + 1}:`);
        console.log(`     ID: ${contract.id}`);
        console.log(`     Cliente: ${contract.client_id}`);
        console.log(`     Carro: ${contract.car_id}`);
        console.log(`     Status: ${contract.status || 'N/A'}`);
        console.log(`     Criado em: ${contract.created_at}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar contratos:', error);
  }
  
  console.log('\n');
  
  // 2. Listar todos os documentos
  console.log('📄 Todos os documentos:');
  try {
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (docsError) {
      console.error('❌ Erro ao buscar documentos:', docsError);
    } else {
      console.log(`   Total de documentos (últimos 20): ${documents.length}`);
      documents.forEach((doc, index) => {
        console.log(`\n   Documento ${index + 1}:`);
        console.log(`     ID: ${doc.id}`);
        console.log(`     Nome: ${doc.file_name || doc.document_name || 'N/A'}`);
        console.log(`     Caminho: ${doc.file_path || 'N/A'}`);
        console.log(`     URL: ${doc.document_url || doc.file_url || 'N/A'}`);
        console.log(`     Contrato: ${doc.contract_id || 'N/A'}`);
        console.log(`     Categoria: ${doc.category || 'N/A'}`);
        console.log(`     Tipo: ${doc.document_type || doc.file_type || 'N/A'}`);
        console.log(`     Criado em: ${doc.created_at}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar documentos:', error);
  }
  
  console.log('\n');
  
  // 3. Verificar estrutura das tabelas
  console.log('🏗️ Estrutura das tabelas:');
  try {
    // Verificar colunas da tabela contracts
    const { data: contractColumns, error: contractColError } = await supabase
      .rpc('get_table_columns', { table_name: 'contracts' });
      
    if (!contractColError && contractColumns) {
      console.log('   Colunas da tabela contracts:');
      contractColumns.forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type})`);
      });
    }
  } catch (error) {
    console.log('   Não foi possível obter estrutura das tabelas via RPC');
  }
  
  console.log('\n');
  
  // 4. Buscar por qualquer arquivo PDF
  console.log('📎 Arquivos PDF no sistema:');
  try {
    const { data: pdfDocs, error: pdfError } = await supabase
      .from('documents')
      .select('*')
      .ilike('file_name', '%.pdf')
      .limit(10);
      
    if (pdfError) {
      console.error('❌ Erro na busca de PDFs:', pdfError);
    } else {
      console.log(`   PDFs encontrados: ${pdfDocs.length}`);
      pdfDocs.forEach((doc, index) => {
        console.log(`\n   PDF ${index + 1}:`);
        console.log(`     Nome: ${doc.file_name}`);
        console.log(`     Caminho: ${doc.file_path}`);
        console.log(`     Contrato: ${doc.contract_id}`);
        console.log(`     Categoria: ${doc.category}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro na busca de PDFs:', error);
  }
}

debugAllContracts().then(() => {
  console.log('\n✅ Debug completo concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no debug:', error);
  process.exit(1);
});