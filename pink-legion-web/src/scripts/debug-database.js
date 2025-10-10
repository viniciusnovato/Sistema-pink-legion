const { createClient } = require('@supabase/supabase-js');

// Usar as variáveis de ambiente diretamente
const supabaseUrl = 'https://bzkgjtxrzwzoibzesphi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjM0MDgsImV4cCI6MjA3NDI5OTQwOH0.6SUGAzZK6-8R4uJj_VDAXdz3log6Zux8mqaDiGdDZp0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDatabase() {
  console.log('🔍 Investigando banco de dados...\n');
  
  const contractId = '1410125e-5c6d-4f1e-a16b-19fa7ab388b4';
  
  // 1. Verificar se o contrato existe
  console.log('📋 Verificando contrato:');
  try {
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();
      
    if (contractError) {
      console.error('❌ Erro ao buscar contrato:', contractError);
    } else if (contract) {
      console.log('✅ Contrato encontrado:');
      console.log(`   ID: ${contract.id}`);
      console.log(`   Cliente: ${contract.client_id}`);
      console.log(`   Carro: ${contract.car_id}`);
      console.log(`   Criado em: ${contract.created_at}`);
    } else {
      console.log('❌ Contrato não encontrado');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar contrato:', error);
  }
  
  console.log('\n');
  
  // 2. Verificar documentos relacionados ao contrato
  console.log('📄 Documentos do contrato:');
  try {
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('contract_id', contractId);
      
    if (docsError) {
      console.error('❌ Erro ao buscar documentos:', docsError);
    } else {
      console.log(`   Total de documentos: ${documents.length}`);
      documents.forEach((doc, index) => {
        console.log(`\n   Documento ${index + 1}:`);
        console.log(`     ID: ${doc.id}`);
        console.log(`     Nome: ${doc.file_name || doc.document_name || 'N/A'}`);
        console.log(`     Caminho: ${doc.file_path || 'N/A'}`);
        console.log(`     URL: ${doc.document_url || doc.file_url || 'N/A'}`);
        console.log(`     Categoria: ${doc.category || 'N/A'}`);
        console.log(`     Tipo: ${doc.document_type || doc.file_type || 'N/A'}`);
        console.log(`     Criado em: ${doc.created_at}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar documentos:', error);
  }
  
  console.log('\n');
  
  // 3. Verificar especificamente contratos assinados
  console.log('✍️ Contratos assinados:');
  try {
    const { data: signedContracts, error: signedError } = await supabase
      .from('documents')
      .select('*')
      .eq('contract_id', contractId)
      .eq('category', 'contract_signed');
      
    if (signedError) {
      console.error('❌ Erro ao buscar contratos assinados:', signedError);
    } else {
      console.log(`   Total de contratos assinados: ${signedContracts.length}`);
      signedContracts.forEach((doc, index) => {
        console.log(`\n   Contrato assinado ${index + 1}:`);
        console.log(`     ID: ${doc.id}`);
        console.log(`     Nome: ${doc.file_name}`);
        console.log(`     Caminho: ${doc.file_path}`);
        console.log(`     Tamanho: ${doc.file_size} bytes`);
        console.log(`     Tipo MIME: ${doc.mime_type}`);
        console.log(`     Criado em: ${doc.created_at}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar contratos assinados:', error);
  }
  
  console.log('\n');
  
  // 4. Buscar por arquivos com nome similar
  console.log('🔍 Buscando arquivos similares no banco:');
  try {
    const { data: similarDocs, error: searchError } = await supabase
      .from('documents')
      .select('*')
      .ilike('file_name', '%contrato-venda-329367234%');
      
    if (searchError) {
      console.error('❌ Erro na busca:', searchError);
    } else {
      console.log(`   Arquivos encontrados: ${similarDocs.length}`);
      similarDocs.forEach((doc, index) => {
        console.log(`\n   Arquivo ${index + 1}:`);
        console.log(`     ID: ${doc.id}`);
        console.log(`     Nome: ${doc.file_name}`);
        console.log(`     Caminho: ${doc.file_path}`);
        console.log(`     Contrato: ${doc.contract_id}`);
        console.log(`     Categoria: ${doc.category}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro na busca:', error);
  }
}

debugDatabase().then(() => {
  console.log('\n✅ Debug do banco concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no debug:', error);
  process.exit(1);
});