const { createClient } = require('@supabase/supabase-js');

// Usando as mesmas credenciais do projeto
const supabaseUrl = 'https://bzkgjtxrzwzoibzesphi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjM0MDgsImV4cCI6MjA3NDI5OTQwOH0.6SUGAzZK6-8R4uJj_VDAXdz3log6Zux8mqaDiGdDZp0';

const supabase = createClient(supabaseUrl, supabaseKey);

const contractId = '1410125e-5c6d-4f1e-a16b-19fa7ab388b4';
const fileName = 'contrato-venda-329367234-2.pdf';

async function debugAllBuckets() {
  console.log('🔍 Investigando TODOS os buckets...\n');
  
  // 1. Listar todos os buckets
  console.log('📦 Buckets disponíveis:');
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
    } else {
      console.log(`   Total de buckets: ${buckets.length}`);
      buckets.forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
      });
      
      // 2. Verificar cada bucket
      for (const bucket of buckets) {
        console.log(`\n📁 Verificando bucket "${bucket.name}":`);
        
        // Listar arquivos na raiz
        try {
          const { data: rootFiles, error: rootError } = await supabase.storage
            .from(bucket.name)
            .list('', {
              limit: 100,
              offset: 0
            });
            
          if (rootError) {
            console.error(`   ❌ Erro ao listar arquivos da raiz: ${rootError.message}`);
          } else {
            console.log(`   📄 Arquivos na raiz: ${rootFiles.length}`);
            rootFiles.forEach((file, index) => {
              if (index < 5) { // Mostrar apenas os primeiros 5
                console.log(`      ${index + 1}. ${file.name}`);
              }
            });
            if (rootFiles.length > 5) {
              console.log(`      ... e mais ${rootFiles.length - 5} arquivos`);
            }
          }
        } catch (error) {
          console.error(`   ❌ Erro ao verificar raiz do bucket: ${error.message}`);
        }
        
        // Verificar se existe a pasta do contrato
        try {
          const { data: contractFiles, error: contractError } = await supabase.storage
            .from(bucket.name)
            .list(contractId, {
              limit: 100,
              offset: 0
            });
            
          if (contractError) {
            console.log(`   📂 Pasta do contrato: não encontrada`);
          } else {
            console.log(`   📂 Pasta do contrato: ${contractFiles.length} arquivos`);
            contractFiles.forEach((file, index) => {
              console.log(`      ${index + 1}. ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
              
              // Verificar se é o arquivo que procuramos
              if (file.name === fileName) {
                console.log(`      ✅ ARQUIVO ENCONTRADO! ${file.name}`);
                
                // Tentar gerar URL assinada
                const filePath = `${contractId}/${fileName}`;
                supabase.storage
                  .from(bucket.name)
                  .createSignedUrl(filePath, 3600)
                  .then(({ data: signedUrl, error: urlError }) => {
                    if (urlError) {
                      console.log(`      ❌ Erro ao gerar URL: ${urlError.message}`);
                    } else {
                      console.log(`      🔗 URL assinada: ${signedUrl.signedUrl}`);
                    }
                  });
              }
            });
          }
        } catch (error) {
          console.log(`   📂 Pasta do contrato: erro ao verificar (${error.message})`);
        }
        
        // Buscar arquivos similares
        try {
          const { data: allFiles, error: searchError } = await supabase.storage
            .from(bucket.name)
            .list('', {
              limit: 1000,
              offset: 0
            });
            
          if (!searchError && allFiles) {
            const similarFiles = allFiles.filter(f => 
              f.name.includes('contrato-venda') || 
              f.name.includes('329367234') ||
              f.name.includes(contractId.substring(0, 8))
            );
            
            if (similarFiles.length > 0) {
              console.log(`   🔍 Arquivos similares: ${similarFiles.length}`);
              similarFiles.forEach((file, index) => {
                console.log(`      ${index + 1}. ${file.name}`);
              });
            }
          }
        } catch (error) {
          // Ignorar erros de busca
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro geral ao verificar buckets:', error);
  }
}

debugAllBuckets().then(() => {
  console.log('\n✅ Debug de todos os buckets concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no debug:', error);
  process.exit(1);
});