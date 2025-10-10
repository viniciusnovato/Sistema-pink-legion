const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkFileStructure() {
  try {
    console.log('Listando arquivos no bucket documents...');
    
    const { data: files, error } = await supabase.storage
      .from('documents')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Erro ao listar arquivos:', error);
      return;
    }

    console.log('Arquivos encontrados:', files.length);
    
    files.forEach(file => {
      console.log(`- ${file.name} (${file.metadata?.size || 'tamanho desconhecido'} bytes)`);
    });

    // Verificar especificamente a pasta do contrato
    const contractId = '1410125e-5c6d-4f1e-a16b-19fa7ab388b4';
    console.log(`\nVerificando pasta do contrato: ${contractId}`);
    
    const { data: contractFiles, error: contractError } = await supabase.storage
      .from('documents')
      .list(contractId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (contractError) {
      console.error('Erro ao listar arquivos do contrato:', contractError);
    } else {
      console.log(`Arquivos na pasta ${contractId}:`, contractFiles.length);
      contractFiles.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'tamanho desconhecido'} bytes)`);
      });
    }

    // Verificar se existe o arquivo específico
    const fileName = 'contrato-venda-329367234.pdf';
    const fullPath = `${contractId}/${fileName}`;
    
    console.log(`\nVerificando arquivo específico: ${fullPath}`);
    
    const { data: fileInfo, error: fileError } = await supabase.storage
      .from('documents')
      .list(contractId, {
        search: fileName
      });

    if (fileError) {
      console.error('Erro ao verificar arquivo específico:', fileError);
    } else {
      console.log('Resultado da busca:', fileInfo);
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

checkFileStructure();