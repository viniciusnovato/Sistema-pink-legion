const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = 'https://bzkgjtxrzwzoibzesphi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyMzQwOCwiZXhwIjoyMDc0Mjk5NDA4fQ.KZ3cqy2fN5UDnp8TG_mV6fRJgqo1Myb0Djud77plDL8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkClientDataComplete() {
  const clientId = '823fa34b-74fc-49d1-b8b0-52034fe63d54'
  
  try {
    console.log('🔍 Verificando dados completos do cliente...')
    
    // Buscar todos os dados do cliente
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
    
    if (error) {
      console.error('❌ Erro ao buscar cliente:', error)
      return
    }
    
    console.log('📋 DADOS COMPLETOS DO CLIENTE:')
    console.log('=====================================')
    
    // Informações Pessoais
    console.log('\n👤 INFORMAÇÕES PESSOAIS:')
    console.log(`ID: ${client.id}`)
    console.log(`Nome Completo: ${client.full_name || 'VAZIO'}`)
    console.log(`Email: ${client.email || 'VAZIO'}`)
    console.log(`Telefone: ${client.phone || 'VAZIO'}`)
    console.log(`NIF: ${client.nif || 'VAZIO'}`)
    console.log(`CC: ${client.cc || 'VAZIO'}`)
    console.log(`Passaporte: ${client.passport || 'VAZIO'}`)
    console.log(`Tem CC: ${client.has_cc}`)
    console.log(`Data de Nascimento: ${client.birth_date || 'VAZIO'}`)
    console.log(`Género: ${client.gender || 'VAZIO'}`)
    console.log(`Nacionalidade: ${client.nationality || 'VAZIO'}`)
    console.log(`Status: ${client.status || 'VAZIO'}`)
    
    // Informações Profissionais
    console.log('\n💼 INFORMAÇÕES PROFISSIONAIS:')
    console.log(`Profissão: ${client.profession || 'VAZIO'}`)
    console.log(`Rendimento Mensal: ${client.monthly_income || 'VAZIO'}`)
    console.log(`Estado Civil: ${client.marital_status || 'VAZIO'}`)
    
    // Informações Bancárias
    console.log('\n💳 INFORMAÇÕES BANCÁRIAS:')
    console.log(`IBAN: ${client.iban || 'VAZIO'}`)
    console.log(`Nome do Banco: ${client.bank_name || 'VAZIO'}`)
    console.log(`Titular da Conta: ${client.account_holder || 'VAZIO'}`)
    console.log(`Número do Cartão: ${client.card_number || 'VAZIO'}`)
    console.log(`Nome no Cartão: ${client.card_holder_name || 'VAZIO'}`)
    console.log(`Validade do Cartão: ${client.card_expiry || 'VAZIO'}`)
    console.log(`CVV: ${client.card_cvv || 'VAZIO'}`)
    
    // Endereço
    console.log('\n🏠 ENDEREÇO:')
    if (client.address) {
      if (typeof client.address === 'string') {
        console.log(`Endereço (string): ${client.address}`)
        try {
          const addressObj = JSON.parse(client.address)
          console.log(`Rua: ${addressObj.street || 'VAZIO'}`)
          console.log(`Número: ${addressObj.number || 'VAZIO'}`)
          console.log(`Complemento: ${addressObj.complement || 'VAZIO'}`)
          console.log(`Freguesia: ${addressObj.parish || 'VAZIO'}`)
          console.log(`Cidade: ${addressObj.city || 'VAZIO'}`)
          console.log(`Distrito: ${addressObj.district || 'VAZIO'}`)
          console.log(`Código Postal: ${addressObj.postal_code || 'VAZIO'}`)
        } catch (e) {
          console.log('❌ Erro ao fazer parse do endereço JSON')
        }
      } else {
        console.log(`Rua: ${client.address.street || 'VAZIO'}`)
        console.log(`Número: ${client.address.number || 'VAZIO'}`)
        console.log(`Complemento: ${client.address.complement || 'VAZIO'}`)
        console.log(`Freguesia: ${client.address.parish || 'VAZIO'}`)
        console.log(`Cidade: ${client.address.city || 'VAZIO'}`)
        console.log(`Distrito: ${client.address.district || 'VAZIO'}`)
        console.log(`Código Postal: ${client.address.postal_code || 'VAZIO'}`)
      }
    } else {
      console.log('Endereço: VAZIO')
    }
    
    // Notas
    console.log('\n📝 NOTAS:')
    console.log(`Notas: ${client.notes || 'VAZIO'}`)
    
    // Timestamps
    console.log('\n⏰ TIMESTAMPS:')
    console.log(`Criado em: ${client.created_at}`)
    console.log(`Atualizado em: ${client.updated_at}`)
    
    // Análise de campos vazios
    console.log('\n🔍 ANÁLISE DE CAMPOS VAZIOS:')
    const emptyFields = []
    
    if (!client.full_name) emptyFields.push('full_name')
    if (!client.email) emptyFields.push('email')
    if (!client.phone) emptyFields.push('phone')
    if (!client.nif) emptyFields.push('nif')
    if (!client.cc && !client.passport) emptyFields.push('cc/passport')
    if (!client.birth_date) emptyFields.push('birth_date')
    if (!client.gender) emptyFields.push('gender')
    if (!client.nationality) emptyFields.push('nationality')
    if (!client.profession) emptyFields.push('profession')
    if (!client.monthly_income) emptyFields.push('monthly_income')
    if (!client.marital_status) emptyFields.push('marital_status')
    if (!client.iban) emptyFields.push('iban')
    if (!client.address) emptyFields.push('address')
    if (!client.notes) emptyFields.push('notes')
    
    if (emptyFields.length > 0) {
      console.log(`❌ Campos vazios encontrados: ${emptyFields.join(', ')}`)
    } else {
      console.log('✅ Todos os campos principais estão preenchidos')
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error)
  }
}

checkClientDataComplete()