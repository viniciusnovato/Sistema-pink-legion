const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bzkgjtxrzwzoibzesphi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6a2dqdHhyend6b2liemVzcGhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyMzQwOCwiZXhwIjoyMDc0Mjk5NDA4fQ.KZ3cqy2fN5UDnp8TG_mV6fRJgqo1Myb0Djud77plDL8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugClientForm() {
  try {
    console.log('🔍 Debugando formulário de edição do cliente...')
    
    const clientId = '823fa34b-74fc-49d1-b8b0-52034fe63d54'
    
    console.log('\n1️⃣ Buscando dados do cliente no banco...')
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar cliente:', error)
      return
    }

    console.log('\n2️⃣ Dados brutos encontrados:')
    console.log('- Nome:', data.full_name)
    console.log('- Email:', data.email)
    console.log('- Telefone:', data.phone)
    console.log('- NIF:', data.nif)
    console.log('- Endereço (raw):', typeof data.address, data.address)
    console.log('- IBAN:', data.iban)
    console.log('- Banco:', data.bank_name)

    console.log('\n3️⃣ Processando endereço...')
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
      console.log('Tipo do endereço:', typeof data.address)
      
      if (typeof data.address === 'string') {
        try {
          console.log('Tentando fazer parse do JSON...')
          const parsedAddress = JSON.parse(data.address)
          console.log('Parse bem-sucedido:', parsedAddress)
          
          processedAddress = {
            street: parsedAddress.street || '',
            number: parsedAddress.number || '',
            complement: parsedAddress.complement || '',
            parish: parsedAddress.parish || '',
            city: parsedAddress.city || '',
            district: parsedAddress.district || '',
            postal_code: parsedAddress.postal_code || ''
          }
        } catch (e) {
          console.log('Erro no parse, tratando como string simples:', e.message)
          processedAddress.street = data.address
        }
      } else if (typeof data.address === 'object') {
        console.log('Endereço já é um objeto')
        processedAddress = {
          street: data.address.street || '',
          number: data.address.number || '',
          complement: data.address.complement || '',
          parish: data.address.parish || '',
          city: data.address.city || '',
          district: data.address.district || '',
          postal_code: data.address.postal_code || ''
        }
      }
    }

    console.log('\n4️⃣ Endereço processado:')
    console.log('- Rua:', processedAddress.street)
    console.log('- Número:', processedAddress.number)
    console.log('- Complemento:', processedAddress.complement)
    console.log('- Freguesia:', processedAddress.parish)
    console.log('- Cidade:', processedAddress.city)
    console.log('- Distrito:', processedAddress.district)
    console.log('- Código Postal:', processedAddress.postal_code)

    console.log('\n5️⃣ Simulando o que apareceria no formulário:')
    
    // Campos de informação pessoal
    console.log('\n📝 Informação Pessoal:')
    console.log('Nome completo:', data.full_name || '[VAZIO]')
    console.log('Email:', data.email || '[VAZIO]')
    console.log('Telefone:', data.phone || '[VAZIO]')
    console.log('NIF:', data.nif || '[VAZIO]')
    console.log('CC/Passaporte:', data.cc || data.passport || '[VAZIO]')
    console.log('Data nascimento:', data.birth_date || '[VAZIO]')
    console.log('Gênero:', data.gender || '[VAZIO]')
    console.log('Nacionalidade:', data.nationality || '[VAZIO]')

    // Campos profissionais
    console.log('\n💼 Informação Profissional:')
    console.log('Profissão:', data.profession || '[VAZIO]')
    console.log('Renda mensal:', data.monthly_income || '[VAZIO]')
    console.log('Estado civil:', data.marital_status || '[VAZIO]')

    // Campos bancários
    console.log('\n🏦 Informação Bancária:')
    console.log('IBAN:', data.iban || '[VAZIO]')
    console.log('Banco:', data.bank_name || '[VAZIO]')
    console.log('Titular:', data.account_holder || '[VAZIO]')

    // Endereço
    console.log('\n🏠 Endereço:')
    console.log('Rua e Número:', processedAddress.street || '[VAZIO]')
    console.log('Cidade:', processedAddress.city || '[VAZIO]')
    console.log('Código Postal:', processedAddress.postal_code || '[VAZIO]')
    console.log('Complemento:', processedAddress.complement || '[VAZIO]')
    console.log('Freguesia:', processedAddress.parish || '[VAZIO]')
    console.log('Distrito:', processedAddress.district || '[VAZIO]')

    // Notas
    console.log('\n📋 Notas:')
    console.log('Notas:', data.notes || '[VAZIO]')

    // Resumo de campos vazios
    const emptyFields = []
    if (!data.phone) emptyFields.push('Telefone')
    if (!data.birth_date) emptyFields.push('Data de nascimento')
    if (!data.nationality) emptyFields.push('Nacionalidade')
    if (!data.profession) emptyFields.push('Profissão')
    if (!data.monthly_income) emptyFields.push('Renda mensal')
    if (!data.marital_status) emptyFields.push('Estado civil')
    if (!processedAddress.number) emptyFields.push('Número da casa')
    if (!processedAddress.complement) emptyFields.push('Complemento')
    if (!processedAddress.parish) emptyFields.push('Freguesia')
    if (!processedAddress.district) emptyFields.push('Distrito')
    if (!data.notes) emptyFields.push('Notas')

    console.log('\n⚠️ Campos que aparecerão vazios no formulário:')
    if (emptyFields.length > 0) {
      emptyFields.forEach(field => console.log(`  - ${field}`))
    } else {
      console.log('  ✅ Todos os campos têm dados!')
    }

    console.log('\n✅ Campos que DEVEM aparecer preenchidos:')
    const filledFields = []
    if (data.full_name) filledFields.push('Nome completo')
    if (data.email) filledFields.push('Email')
    if (data.nif) filledFields.push('NIF')
    if (data.cc || data.passport) filledFields.push('CC/Passaporte')
    if (data.gender) filledFields.push('Gênero')
    if (data.iban) filledFields.push('IBAN')
    if (data.bank_name) filledFields.push('Banco')
    if (data.account_holder) filledFields.push('Titular da conta')
    if (processedAddress.street) filledFields.push('Rua')
    if (processedAddress.city) filledFields.push('Cidade')
    if (processedAddress.postal_code) filledFields.push('Código postal')

    filledFields.forEach(field => console.log(`  ✅ ${field}`))

  } catch (error) {
    console.error('❌ Erro no debug:', error)
  }
}

debugClientForm()