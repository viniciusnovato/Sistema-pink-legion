import jsPDF from 'jspdf'

interface ContractData {
  car: {
    id: string
    brand: string
    model: string
    year: number
    license_plate: string
    vin?: string
    engine: string
    color: string
    mileage: number
  }
  client: {
    id: string
    full_name: string
    email: string
    phone: string
    address: string
    city: string
    postal_code: string
    country: string
    id_number: string
    nif: string
  }
  contract: {
    total_price: number
    down_payment: number
    financed_amount: number
    installments: number
    installment_amount: number
    contract_date: string
    delivery_date: string
    notes?: string
  }
}

// Função para converter números em valores por extenso em português
function numberToWords(num: number): string {
  const ones = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
  const teens = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove']
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

  if (num === 0) return 'zero'
  if (num === 100) return 'cem'

  let result = ''

  // Milhares
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000)
    if (thousands === 1) {
      result += 'mil '
    } else {
      result += convertHundreds(thousands) + ' mil '
    }
    num %= 1000
  }

  // Centenas, dezenas e unidades
  if (num > 0) {
    result += convertHundreds(num)
  }

  return result.trim()

  function convertHundreds(n: number): string {
    let str = ''

    if (n >= 100) {
      if (n === 100) {
        str += 'cem '
      } else {
        str += hundreds[Math.floor(n / 100)] + ' '
      }
      n %= 100
    }

    if (n >= 20) {
      str += tens[Math.floor(n / 10)]
      if (n % 10 > 0) {
        str += ' e ' + ones[n % 10]
      }
    } else if (n >= 10) {
      str += teens[n - 10]
    } else if (n > 0) {
      str += ones[n]
    }

    return str
  }
}

export function generateSaleContract(data: ContractData): jsPDF {
  const doc = new jsPDF()
  
  // Configurações de fonte
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  
  // Título
  doc.text('CONTRATO DE COMPRA E VENDA DE VEÍCULO AUTOMÓVEL', 105, 20, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  
  let yPosition = 40
  
  // Vendedor
  doc.setFont('helvetica', 'bold')
  doc.text('VENDEDOR:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  doc.text('PINK LEGION, LDA', 20, yPosition)
  yPosition += 7
  doc.text('NIF: 123456789', 20, yPosition)
  yPosition += 7
  doc.text('Morada: Rua da Empresa, 123, 1000-000 Lisboa', 20, yPosition)
  yPosition += 15
  
  // Comprador
  doc.setFont('helvetica', 'bold')
  doc.text('COMPRADOR:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  doc.text(`Nome: ${data.client.full_name}`, 20, yPosition)
  yPosition += 7
  doc.text(`NIF: ${data.client.nif}`, 20, yPosition)
  yPosition += 7
  doc.text(`Documento de Identificação: ${data.client.id_number}`, 20, yPosition)
  yPosition += 7
  doc.text(`Morada: ${data.client.address}, ${data.client.city}, ${data.client.postal_code}`, 20, yPosition)
  yPosition += 7
  doc.text(`Telefone: ${data.client.phone}`, 20, yPosition)
  yPosition += 7
  doc.text(`Email: ${data.client.email}`, 20, yPosition)
  yPosition += 15
  
  // Veículo
  doc.setFont('helvetica', 'bold')
  doc.text('IDENTIFICAÇÃO DO VEÍCULO:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  doc.text(`Marca: ${data.car.brand}`, 20, yPosition)
  yPosition += 7
  doc.text(`Modelo: ${data.car.model}`, 20, yPosition)
  yPosition += 7
  doc.text(`Matrícula: ${data.car.license_plate}`, 20, yPosition)
  yPosition += 7
  doc.text(`Número de Chassi (VIN): ${data.car.vin || 'N/A'}`, 20, yPosition)
  yPosition += 7
  doc.text(`Cilindrada: ${data.car.engine}`, 20, yPosition)
  yPosition += 7
  doc.text(`Cor: ${data.car.color}`, 20, yPosition)
  yPosition += 7
  doc.text(`Ano: ${data.car.year}`, 20, yPosition)
  yPosition += 7
  doc.text(`Quilometragem: ${data.car.mileage.toLocaleString()} km`, 20, yPosition)
  yPosition += 15
  
  // Preço e condições de pagamento
  doc.setFont('helvetica', 'bold')
  doc.text('PREÇO E CONDIÇÕES DE PAGAMENTO:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  
  const totalPriceWords = numberToWords(Math.floor(data.contract.total_price))
  doc.text(`Preço global: €${data.contract.total_price.toLocaleString()} (${totalPriceWords} euros)`, 20, yPosition)
  yPosition += 10
  
  if (data.contract.down_payment > 0) {
    const downPaymentWords = numberToWords(Math.floor(data.contract.down_payment))
    doc.text(`Sinal: €${data.contract.down_payment.toLocaleString()} (${downPaymentWords} euros)`, 20, yPosition)
    yPosition += 7
    
    const financedWords = numberToWords(Math.floor(data.contract.financed_amount))
    doc.text(`Valor financiado: €${data.contract.financed_amount.toLocaleString()} (${financedWords} euros)`, 20, yPosition)
    yPosition += 7
    
    const installmentWords = numberToWords(Math.floor(data.contract.installment_amount))
    doc.text(`Pagamento em ${data.contract.installments} prestações de €${data.contract.installment_amount.toLocaleString()} (${installmentWords} euros)`, 20, yPosition)
    yPosition += 10
  } else {
    doc.text('Pagamento: À vista', 20, yPosition)
    yPosition += 10
  }
  
  // Data de entrega
  const deliveryDate = new Date(data.contract.delivery_date).toLocaleDateString('pt-PT')
  doc.text(`Data de entrega: ${deliveryDate}`, 20, yPosition)
  yPosition += 15
  
  // Garantia
  doc.setFont('helvetica', 'bold')
  doc.text('GARANTIA:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  doc.text('O veículo é vendido no estado em que se encontra, com garantia legal de 6 meses.', 20, yPosition)
  yPosition += 15
  
  // Despesas
  doc.setFont('helvetica', 'bold')
  doc.text('DESPESAS:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  doc.text('Todas as despesas de transferência de propriedade são por conta do comprador.', 20, yPosition)
  yPosition += 15
  
  // Observações
  if (data.contract.notes) {
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVAÇÕES:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    yPosition += 10
    doc.text(data.contract.notes, 20, yPosition)
    yPosition += 15
  }
  
  // Nova página se necessário
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 30
  }
  
  // Cláusulas finais
  doc.setFont('helvetica', 'bold')
  doc.text('CLÁUSULAS GERAIS:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  
  const clauses = [
    '1. O não cumprimento das obrigações assumidas pelo comprador dará direito ao vendedor de resolver o contrato.',
    '2. Para resolução de qualquer litígio será competente o foro da comarca de Lisboa.',
    '3. O presente contrato é regido pela lei portuguesa.'
  ]
  
  clauses.forEach(clause => {
    doc.text(clause, 20, yPosition, { maxWidth: 170 })
    yPosition += 15
  })
  
  // Assinaturas
  yPosition += 20
  const contractDate = new Date(data.contract.contract_date).toLocaleDateString('pt-PT')
  doc.text(`Lisboa, ${contractDate}`, 20, yPosition)
  
  yPosition += 30
  doc.text('_________________________', 20, yPosition)
  yPosition += 7
  doc.text('O Vendedor', 20, yPosition)
  
  doc.text('_________________________', 120, yPosition - 7)
  yPosition += 7
  doc.text('O Comprador', 120, yPosition)
  
  return doc
}

export function generateDebtConfession(data: ContractData): jsPDF {
  const doc = new jsPDF()
  
  // Configurações de fonte
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  
  // Título
  doc.text('TERMO DE CONFISSÃO DE DÍVIDA', 105, 20, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  
  let yPosition = 40
  
  // Credor
  doc.setFont('helvetica', 'bold')
  doc.text('CREDOR:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  doc.text('PINK LEGION, LDA', 20, yPosition)
  yPosition += 7
  doc.text('NIF: 123456789', 20, yPosition)
  yPosition += 7
  doc.text('Morada: Rua da Empresa, 123, 1000-000 Lisboa', 20, yPosition)
  yPosition += 15
  
  // Devedor
  doc.setFont('helvetica', 'bold')
  doc.text('DEVEDOR:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  doc.text(`Nome: ${data.client.full_name}`, 20, yPosition)
  yPosition += 7
  doc.text(`NIF: ${data.client.nif}`, 20, yPosition)
  yPosition += 7
  doc.text(`Documento de Identificação: ${data.client.id_number}`, 20, yPosition)
  yPosition += 7
  doc.text(`Morada: ${data.client.address}, ${data.client.city}, ${data.client.postal_code}`, 20, yPosition)
  yPosition += 15
  
  // Origem da dívida
  doc.setFont('helvetica', 'bold')
  doc.text('ORIGEM DA DÍVIDA:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  const contractDate = new Date(data.contract.contract_date).toLocaleDateString('pt-PT')
  doc.text(`Contrato de compra e venda de veículo automóvel celebrado em ${contractDate}`, 20, yPosition)
  yPosition += 7
  doc.text(`Veículo: ${data.car.brand} ${data.car.model}, matrícula ${data.car.license_plate}`, 20, yPosition)
  yPosition += 15
  
  // Confissão expressa da dívida
  doc.setFont('helvetica', 'bold')
  doc.text('CONFISSÃO EXPRESSA DA DÍVIDA:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  
  const debtWords = numberToWords(Math.floor(data.contract.financed_amount))
  doc.text(`O devedor confessa dever ao credor a quantia de €${data.contract.financed_amount.toLocaleString()}`, 20, yPosition)
  yPosition += 7
  doc.text(`(${debtWords} euros), relativa ao financiamento do veículo acima identificado.`, 20, yPosition)
  yPosition += 15
  
  // Plano de pagamento
  doc.setFont('helvetica', 'bold')
  doc.text('PLANO DE PAGAMENTO:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  
  if (data.contract.down_payment > 0) {
    const downPaymentWords = numberToWords(Math.floor(data.contract.down_payment))
    doc.text(`Pagamento inicial: €${data.contract.down_payment.toLocaleString()} (${downPaymentWords} euros)`, 20, yPosition)
    yPosition += 7
  }
  
  const installmentWords = numberToWords(Math.floor(data.contract.installment_amount))
  doc.text(`Saldo remanescente: €${data.contract.financed_amount.toLocaleString()} (${debtWords} euros)`, 20, yPosition)
  yPosition += 7
  doc.text(`Pagamento em ${data.contract.installments} prestações mensais de €${data.contract.installment_amount.toLocaleString()}`, 20, yPosition)
  yPosition += 7
  doc.text(`(${installmentWords} euros) cada`, 20, yPosition)
  yPosition += 15
  
  // Juros de mora
  doc.setFont('helvetica', 'bold')
  doc.text('JUROS DE MORA:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  doc.text('Em caso de atraso no pagamento, serão devidos juros de mora à taxa legal em vigor.', 20, yPosition)
  yPosition += 15
  
  // Garantias adicionais
  doc.setFont('helvetica', 'bold')
  doc.text('GARANTIAS ADICIONAIS:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  doc.text('O veículo objeto do contrato serve de garantia ao cumprimento desta obrigação.', 20, yPosition)
  yPosition += 15
  
  // Foro competente
  doc.setFont('helvetica', 'bold')
  doc.text('FORO COMPETENTE:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  doc.text('Para resolução de qualquer litígio será competente o foro da comarca de Lisboa.', 20, yPosition)
  yPosition += 15
  
  // Lei aplicável
  doc.setFont('helvetica', 'bold')
  doc.text('LEI APLICÁVEL:', 20, yPosition)
  doc.setFont('helvetica', 'normal')
  yPosition += 10
  doc.text('O presente termo é regido pela lei portuguesa.', 20, yPosition)
  yPosition += 20
  
  // Assinaturas
  doc.text(`Lisboa, ${contractDate}`, 20, yPosition)
  
  yPosition += 30
  doc.text('_________________________', 20, yPosition)
  yPosition += 7
  doc.text('O Credor', 20, yPosition)
  
  doc.text('_________________________', 120, yPosition - 7)
  yPosition += 7
  doc.text('O Devedor', 120, yPosition)
  
  return doc
}