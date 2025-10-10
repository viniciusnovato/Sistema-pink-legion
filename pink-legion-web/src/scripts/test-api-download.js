const fetch = require('node-fetch');

const contractId = '1410125e-5c6d-4f1e-a16b-19fa7ab388b4';
const fileName = 'contrato-venda-329367234-2.pdf';
const filePath = `${contractId}/${fileName}`;

async function testApiDownload() {
  console.log('🔍 Testando nova API de download...\n');
  
  console.log('📋 Configuração:');
  console.log(`   Endpoint: http://localhost:3000/api/download`);
  console.log(`   Bucket: documents`);
  console.log(`   Caminho: ${filePath}\n`);
  
  try {
    console.log('📡 Fazendo requisição para API...');
    
    const response = await fetch('http://localhost:3000/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucketName: 'documents',
        filePath: filePath
      })
    });

    console.log(`✅ Status HTTP: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erro na API:', result);
      return;
    }
    
    console.log('✅ Resposta da API:', {
      hasSignedUrl: !!result.signedUrl,
      urlLength: result.signedUrl ? result.signedUrl.length : 0,
      urlPreview: result.signedUrl ? result.signedUrl.substring(0, 100) + '...' : 'N/A'
    });
    
    if (result.signedUrl) {
      console.log('\n🌐 Testando acesso à URL assinada...');
      
      const urlResponse = await fetch(result.signedUrl, { method: 'HEAD' });
      console.log(`✅ Status da URL: ${urlResponse.status} ${urlResponse.statusText}`);
      console.log(`   Content-Type: ${urlResponse.headers.get('content-type')}`);
      console.log(`   Content-Length: ${urlResponse.headers.get('content-length')} bytes`);
      
      if (urlResponse.ok) {
        console.log('🎉 API DE DOWNLOAD FUNCIONANDO PERFEITAMENTE!');
      } else {
        console.log('❌ Erro no acesso à URL gerada pela API');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

testApiDownload().then(() => {
  console.log('\n✅ Teste da API de download concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no teste:', error);
  process.exit(1);
});