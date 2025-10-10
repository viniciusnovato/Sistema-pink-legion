const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkDocumentData() {
  try {
    const contractId = '1410125e-5c6d-4f1e-a16b-19fa7ab388b4';
    
    console.log(`Verificando documentos do contrato: ${contractId}`);
    
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('contract_id', contractId);

    if (error) {
      console.error('Erro ao buscar documentos:', error);
      return;
    }

    console.log(`Documentos encontrados: ${documents.length}`);
    
    documents.forEach((doc, index) => {
      console.log(`\nDocumento ${index + 1}:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Nome: ${doc.document_name || doc.file_name || 'N/A'}`);
      console.log(`  file_path: ${doc.file_path || 'N/A'}`);
      console.log(`  document_url: ${doc.document_url || 'N/A'}`);
      console.log(`  category: ${doc.category || 'N/A'}`);
    });

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

checkDocumentData();