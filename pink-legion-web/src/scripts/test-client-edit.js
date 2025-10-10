const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = 'https://bzkgjtxrzwzoibzesphi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyMzQwOCwiZXhwIjoyMDc0Mjk5NDA4fQ.KZ3cqy2fN5UDnp8TG_mV6fRJgqo1Myb0Djud77plDL8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testClientEdit() {
  const clientId = '823fa34b-74fc-49d1-b8b0-52034fe63d54'
  
  try {
    console.log('🔍 Buscando dados atuais do cliente...')
    
    // Buscar dados atuais do cliente
    const { data: currentClient, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
    
    if (fetchError) {
      console.error('❌ Erro ao buscar cliente:', fetchError)
      return
    }
    
    console.log('✅ Cliente encontrado:', {
      id: currentClient.id,
      full_name: currentClient.full_name,
      email: currentClient.email,
      phone: currentClient.phone,
      nif: currentClient.nif,
      profession: currentClient.profession,
      monthly_income: currentClient.monthly_income,
      address: currentClient.address,
      notes: currentClient.notes,
      updated_at: currentClient.updated_at
    })
    
    // Simular uma atualização de dados
    const testData = {
      full_name: currentClient.full_name + ' (TESTE)',
      profession: 'Profissão Teste',
      monthly_income: 2500.00,
      notes: 'Nota de teste adicionada em ' + new Date().toISOString(),
      address: {
        ...currentClient.address,
        street: 'Rua de Teste, 123'
      },
      updated_at: new Date().toISOString()
    }
    
    console.log('🔄 Testando atualização com dados:', testData)
    
    // Executar atualização
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update(testData)
      .eq('id', clientId)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Erro ao atualizar cliente:', updateError)
      return
    }
    
    console.log('✅ Cliente atualizado com sucesso:', {
      id: updatedClient.id,
      full_name: updatedClient.full_name,
      profession: updatedClient.profession,
      monthly_income: updatedClient.monthly_income,
      notes: updatedClient.notes,
      address: updatedClient.address,
      updated_at: updatedClient.updated_at
    })
    
    // Verificar se os dados foram realmente salvos
    console.log('🔍 Verificando se os dados foram persistidos...')
    
    const { data: verifyClient, error: verifyError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
    
    if (verifyError) {
      console.error('❌ Erro ao verificar dados:', verifyError)
      return
    }
    
    console.log('✅ Verificação concluída. Dados persistidos:', {
      full_name: verifyClient.full_name,
      profession: verifyClient.profession,
      monthly_income: verifyClient.monthly_income,
      notes: verifyClient.notes,
      address: verifyClient.address,
      updated_at: verifyClient.updated_at
    })
    
    // Restaurar dados originais
    console.log('🔄 Restaurando dados originais...')
    
    const { error: restoreError } = await supabase
      .from('clients')
      .update({
        full_name: currentClient.full_name,
        profession: currentClient.profession,
        monthly_income: currentClient.monthly_income,
        notes: currentClient.notes,
        address: currentClient.address,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
    
    if (restoreError) {
      console.error('❌ Erro ao restaurar dados:', restoreError)
      return
    }
    
    console.log('✅ Dados originais restaurados com sucesso!')
    console.log('🎉 Teste de persistência concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

testClientEdit()