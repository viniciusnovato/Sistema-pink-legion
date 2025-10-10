const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bzkgjtxrzwzoibzesphi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyMzQwOCwiZXhwIjoyMDc0Mjk5NDA4fQ.KZ3cqy2fN5UDnp8TG_mV6fRJgqo1Myb0Djud77plDL8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testClientFieldsLoading() {
  try {
    console.log('🔍 Testando carregamento de campos do cliente...')
    
    const clientId = '823fa34b-74fc-49d1-b8b0-52034fe63d54'
    
    // Buscar dados do cliente
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar cliente:', error)
      return
    }

    console.log('\n📊 Dados brutos do cliente:')
    console.log(JSON.stringify(data, null, 2))

    // Simular o processamento que acontece na função fetchClient
    let processedAddress = {
      street: '',
      number: '',
      complement: '',
      parish: '',
      city: '',
      district: '',
      postal_code: ''
    }

    if (data.address) {
      if (typeof data.address === 'string') {
        try {
          const parsedAddress = JSON.parse(data.address)
          processedAddress = {
            street: parsedAddress.street || '',
            number: parsedAddress.number || '',
            complement: parsedAddress.complement || '',
            parish: parsedAddress.parish || '',
            city: parsedAddress.city || '',
            district: parsedAddress.district || '',
            postal_code: parsedAddress.postal_code || ''
          }
          console.log('\n✅ Endereço processado como JSON string')
        } catch (e) {
          processedAddress.street = data.address
          console.log('\n⚠️ Endereço tratado como string simples')
        }
      } else if (typeof data.address === 'object') {
        processedAddress = {
          street: data.address.street || '',
          number: data.address.number || '',
          complement: data.address.complement || '',
          parish: data.address.parish || '',
          city: data.address.city || '',
          district: data.address.district || '',
          postal_code: data.address.postal_code || ''
        }
        console.log('\n✅ Endereço já é um objeto')
      }
    }

    const processedClient = {
      ...data,
      phone: data.phone || '',
      birth_date: data.birth_date || '',
      gender: data.gender || '',
      nationality: data.nationality || '',
      profession: data.profession || '',
      monthly_income: data.monthly_income || 0,
      marital_status: data.marital_status || 'single',
      iban: data.iban || '',
      bank_name: data.bank_name || '',
      account_holder: data.account_holder || '',
      card_number: data.card_number || '',
      card_holder_name: data.card_holder_name || '',
      card_expiry: data.card_expiry || '',
      card_cvv: data.card_cvv || '',
      notes: data.notes || '',
      address: processedAddress
    }

    console.log('\n📋 Dados processados para o formulário:')
    console.log('Nome completo:', processedClient.full_name)
    console.log('Email:', processedClient.email)
    console.log('Telefone:', processedClient.phone)
    console.log('NIF:', processedClient.nif)
    console.log('Data de nascimento:', processedClient.birth_date)
    console.log('Gênero:', processedClient.gender)
    console.log('Nacionalidade:', processedClient.nationality)
    console.log('Profissão:', processedClient.profession)
    console.log('Renda mensal:', processedClient.monthly_income)
    console.log('Estado civil:', processedClient.marital_status)
    console.log('IBAN:', processedClient.iban)
    console.log('Nome do banco:', processedClient.bank_name)
    console.log('Titular da conta:', processedClient.account_holder)
    console.log('Notas:', processedClient.notes)
    
    console.log('\n🏠 Endereço processado:')
    console.log('Rua:', processedAddress.street)
    console.log('Número:', processedAddress.number)
    console.log('Complemento:', processedAddress.complement)
    console.log('Freguesia:', processedAddress.parish)
    console.log('Cidade:', processedAddress.city)
    console.log('Distrito:', processedAddress.district)
    console.log('Código postal:', processedAddress.postal_code)

    // Verificar campos vazios
    const emptyFields = []
    if (!processedClient.phone) emptyFields.push('telefone')
    if (!processedClient.birth_date) emptyFields.push('data de nascimento')
    if (!processedClient.nationality) emptyFields.push('nacionalidade')
    if (!processedClient.profession) emptyFields.push('profissão')
    if (!processedClient.monthly_income) emptyFields.push('renda mensal')
    if (!processedClient.notes) emptyFields.push('notas')
    if (!processedAddress.number) emptyFields.push('número da casa')
    if (!processedAddress.complement) emptyFields.push('complemento')
    if (!processedAddress.parish) emptyFields.push('freguesia')
    if (!processedAddress.district) emptyFields.push('distrito')

    if (emptyFields.length > 0) {
      console.log('\n⚠️ Campos que aparecerão vazios no formulário:')
      emptyFields.forEach(field => console.log(`  - ${field}`))
    } else {
      console.log('\n✅ Todos os campos têm valores para preencher o formulário')
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testClientFieldsLoading()