const { createClient } = require('@supabase/supabase-js');

// Credenciais de produção - você precisará fornecer as corretas
const productionUrl = process.env.SUPABASE_PRODUCTION_URL || 'https://bzkgjtxrzwzoibzesphi.supabase.co';
const productionKey = process.env.SUPABASE_PRODUCTION_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjM0MDgsImV4cCI6MjA3NDI5OTQwOH0.6SUGAzZK6-8R4uJj_VDAXdz3log6Zux8mqaDiGdDZp0';

const supabase = createClient(productionUrl, productionKey);

async function debugProductionStorage() {
  console.log('🔍 Investigando storage de PRODUÇÃO...\n');
  
  const contractId = '1410125e-5c6d-4f1e-a16b-19fa7ab388b4';
  const fileName = 'contrato-venda-329367234-2.pdf';
  const filePath = `${contractId}/${fileName}`;
  
  // 1. Verificar buckets disponíveis
  console.log('📦 Buckets disponíveis na produção:');
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
    } else {
      console.log(`   Total de buckets: ${buckets.length}`);
      buckets.forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar buckets:', error);
  }
  
  console.log('\n');
  
  // 2. Listar arquivos no bucket documents
  console.log('📁 Arquivos no bucket "documents":');
  try {
    const { data: files, error: filesError } = await supabase.storage
      .from('documents')
      .list('', {
        limit: 100,
        offset: 0
      });
      
    if (filesError) {
      console.error('❌ Erro ao listar arquivos:', filesError);
    } else {
      console.log(`   Total de itens: ${files.length}`);
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error);
  }
  
  console.log('\n');
  
  // 3. Verificar pasta específica do contrato
  console.log(`📂 Arquivos na pasta do contrato "${contractId}":`);
  try {
    const { data: contractFiles, error: contractError } = await supabase.storage
      .from('documents')
      .list(contractId, {
        limit: 100,
        offset: 0
      });
      
    if (contractError) {
      console.error('❌ Erro ao listar arquivos do contrato:', contractError);
    } else {
      console.log(`   Total de arquivos: ${contractFiles.length}`);
      contractFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
        console.log(`      Criado em: ${file.created_at}`);
        console.log(`      Atualizado em: ${file.updated_at}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar pasta do contrato:', error);
  }
  
  console.log('\n');
  
  // 4. Tentar gerar URL assinada para o arquivo específico
  console.log(`🔗 Tentando gerar URL assinada para: ${filePath}`);
  try {
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hora
      
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
  
  // 5. Verificar se o arquivo existe diretamente
  console.log(`📄 Verificando existência do arquivo: ${filePath}`);
  try {
    const { data: fileInfo, error: infoError } = await supabase.storage
      .from('documents')
      .list(contractId, {
        search: fileName
      });
      
    if (infoError) {
      console.error('❌ Erro ao buscar arquivo:', infoError);
    } else {
      const foundFile = fileInfo.find(f => f.name === fileName);
      if (foundFile) {
        console.log('✅ Arquivo encontrado!');
        console.log(`   Nome: ${foundFile.name}`);
        console.log(`   Tamanho: ${foundFile.metadata?.size || 'N/A'} bytes`);
        console.log(`   Tipo: ${foundFile.metadata?.mimetype || 'N/A'}`);
        console.log(`   Criado: ${foundFile.created_at}`);
      } else {
        console.log('❌ Arquivo não encontrado na pasta');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar arquivo:', error);
  }
  
  console.log('\n');
  
  // 6. Buscar por arquivos similares
  console.log('🔍 Procurando arquivos similares...');
  try {
    const { data: allFiles, error: searchError } = await supabase.storage
      .from('documents')
      .list('', {
        limit: 1000,
        offset: 0
      });
      
    if (searchError) {
      console.error('❌ Erro na busca:', searchError);
    } else {
      const similarFiles = allFiles.filter(f => 
        f.name.includes('contrato-venda') || 
        f.name.includes('329367234') ||
        f.name.includes(contractId.substring(0, 8))
      );
      
      console.log(`   Arquivos similares encontrados: ${similarFiles.length}`);
      similarFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro na busca de similares:', error);
  }
}

debugProductionStorage().then(() => {
  console.log('\n✅ Debug do storage de produção concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no debug:', error);
  process.exit(1);
});