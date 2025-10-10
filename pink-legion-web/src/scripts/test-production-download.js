const { createClient } = require('@supabase/supabase-js');

// Usando as credenciais CORRETAS do .env.local
const supabaseUrl = 'https://bzkgjtxrzwzoibzesphi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjM0MDgsImV4cCI6MjA3NDI5OTQwOH0.6SUGAzZK6-8R4uJj_VDAXdz3log6Zux8mqaDiGdDZp0';

const supabase = createClient(supabaseUrl, supabaseKey);

const contractId = '1410125e-5c6d-4f1e-a16b-19fa7ab388b4';
const fileName = 'contrato-venda-329367234-2.pdf';
const filePath = `${contractId}/${fileName}`;

async function testProductionDownload() {
  console.log('🔍 Testando download com credenciais corretas...\n');
  
  console.log('📋 Configuração:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
  console.log(`   Bucket: documents`);
  console.log(`   Caminho: ${filePath}\n`);
  
  // 1. Verificar buckets
  console.log('📦 Verificando buckets...');
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return;
    }
    
    console.log(`✅ Buckets encontrados: ${buckets.length}`);
    buckets.forEach((bucket, index) => {
      console.log(`   ${index + 1}. ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    
    const documentsExists = buckets.some(b => b.name === 'documents');
    if (!documentsExists) {
      console.error('❌ Bucket "documents" não encontrado!');
      return;
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar buckets:', error);
    return;
  }
  
  console.log('\n');
  
  // 2. Listar arquivos no bucket documents
  console.log('📁 Verificando bucket "documents"...');
  try {
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('documents')
      .list('', {
        limit: 100,
        offset: 0
      });
      
    if (rootError) {
      console.error('❌ Erro ao listar raiz do bucket:', rootError);
      return;
    }
    
    console.log(`✅ Itens na raiz: ${rootFiles.length}`);
    rootFiles.forEach((file, index) => {
      if (index < 10) { // Mostrar apenas os primeiros 10
        console.log(`   ${index + 1}. ${file.name} ${file.metadata ? `(${file.metadata.size} bytes)` : ''}`);
      }
    });
    if (rootFiles.length > 10) {
      console.log(`   ... e mais ${rootFiles.length - 10} itens`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar bucket:', error);
    return;
  }
  
  console.log('\n');
  
  // 3. Verificar pasta específica do contrato
  console.log(`📂 Verificando pasta "${contractId}"...`);
  try {
    const { data: contractFiles, error: contractError } = await supabase.storage
      .from('documents')
      .list(contractId, {
        limit: 100,
        offset: 0
      });
      
    if (contractError) {
      console.error('❌ Erro ao listar pasta do contrato:', contractError);
      return;
    }
    
    console.log(`✅ Arquivos na pasta: ${contractFiles.length}`);
    contractFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
      console.log(`      Criado: ${file.created_at}`);
      console.log(`      Atualizado: ${file.updated_at}`);
      
      if (file.name === fileName) {
        console.log(`      ✅ ARQUIVO ALVO ENCONTRADO!`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar pasta do contrato:', error);
    return;
  }
  
  console.log('\n');
  
  // 4. Tentar gerar URL assinada
  console.log(`🔗 Gerando URL assinada para "${filePath}"...`);
  try {
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hora
      
    if (urlError) {
      console.error('❌ Erro ao gerar URL assinada:', urlError);
      console.error('   Detalhes:', {
        message: urlError.message,
        status: urlError.status,
        statusCode: urlError.statusCode
      });
      return;
    }
    
    console.log('✅ URL assinada gerada com sucesso!');
    console.log(`   URL: ${signedUrl.signedUrl}`);
    console.log(`   Válida até: ${new Date(Date.now() + 3600000).toLocaleString()}`);
    
    // 5. Testar a URL com fetch
    console.log('\n🌐 Testando acesso à URL...');
    try {
      const response = await fetch(signedUrl.signedUrl, { method: 'HEAD' });
      console.log(`✅ Status HTTP: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`);
      
      if (response.ok) {
        console.log('🎉 DOWNLOAD FUNCIONANDO PERFEITAMENTE!');
      } else {
        console.log('❌ Erro no acesso à URL');
      }
    } catch (fetchError) {
      console.error('❌ Erro ao testar URL:', fetchError);
    }
    
  } catch (error) {
    console.error('❌ Erro ao gerar URL:', error);
  }
}

testProductionDownload().then(() => {
  console.log('\n✅ Teste de download concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no teste:', error);
  process.exit(1);
});