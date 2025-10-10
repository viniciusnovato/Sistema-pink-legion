const { createClient } = require('@supabase/supabase-js');

// Usar as variáveis de ambiente diretamente (definidas no sistema ou .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzkgjtxrzwzoibzesphi.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjM0MDgsImV4cCI6MjA3NDI5OTQwOH0.6SUGAzZK6-8R4uJj_VDAXdz3log6Zux8mqaDiGdDZp0';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStorage() {
  console.log('🔍 Investigando storage do Supabase...\n');
  
  // 1. Listar todos os buckets
  console.log('📦 Buckets disponíveis:');
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
    } else {
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (público: ${bucket.public})`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao acessar buckets:', error);
  }
  
  console.log('\n');
  
  // 2. Listar arquivos no bucket 'documents'
  console.log('📁 Arquivos no bucket "documents":');
  try {
    const { data: files, error: filesError } = await supabase.storage
      .from('documents')
      .list('', { limit: 100 });
      
    if (filesError) {
      console.error('❌ Erro ao listar arquivos:', filesError);
    } else {
      console.log(`  Total de itens: ${files.length}`);
      files.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error);
  }
  
  console.log('\n');
  
  // 3. Verificar especificamente a pasta do contrato
  const contractId = '1410125e-5c6d-4f1e-a16b-19fa7ab388b4';
  console.log(`📂 Arquivos na pasta do contrato "${contractId}":`);
  try {
    const { data: contractFiles, error: contractError } = await supabase.storage
      .from('documents')
      .list(contractId, { limit: 100 });
      
    if (contractError) {
      console.error('❌ Erro ao listar arquivos do contrato:', contractError);
    } else {
      console.log(`  Total de arquivos: ${contractFiles.length}`);
      contractFiles.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
        console.log(`    Caminho completo: ${contractId}/${file.name}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao listar arquivos do contrato:', error);
  }
  
  console.log('\n');
  
  // 4. Tentar gerar URL assinada para o arquivo específico
  const filePath = '1410125e-5c6d-4f1e-a16b-19fa7ab388b4/contrato-venda-329367234-2.pdf';
  console.log(`🔗 Tentando gerar URL assinada para: ${filePath}`);
  try {
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60);
      
    if (urlError) {
      console.error('❌ Erro ao gerar URL assinada:', urlError);
    } else {
      console.log('✅ URL assinada gerada com sucesso!');
      console.log(`   URL: ${signedUrl.signedUrl}`);
    }
  } catch (error) {
    console.error('❌ Erro ao gerar URL:', error);
  }
  
  console.log('\n');
  
  // 5. Verificar se existe com nome ligeiramente diferente
  console.log('🔍 Procurando arquivos similares...');
  try {
    const { data: similarFiles, error: searchError } = await supabase.storage
      .from('documents')
      .list(contractId, { 
        limit: 100,
        search: 'contrato-venda'
      });
      
    if (searchError) {
      console.error('❌ Erro na busca:', searchError);
    } else {
      console.log(`  Arquivos encontrados com "contrato-venda": ${similarFiles.length}`);
      similarFiles.forEach(file => {
        console.log(`  - ${file.name}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro na busca:', error);
  }
}

debugStorage().then(() => {
  console.log('\n✅ Debug concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no debug:', error);
  process.exit(1);
});