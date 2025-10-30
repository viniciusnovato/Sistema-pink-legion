import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import path from 'path'
import fs from 'fs/promises'
import { getBicByIban } from '@/lib/portuguese-banks'

// Import puppeteer for development (includes Chromium)
const puppeteer = process.env.NODE_ENV === 'production' 
  ? puppeteerCore 
  : require('puppeteer')

type ContractType = 'sale' | 'debt_confession'

interface LibContractData {
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
    nationality?: string
    bank_name?: string
    iban?: string
    swift?: string
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
    first_payment_date?: string
    contract_number?: string
    notes?: string
    payment_method?: string
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

// Conversor simples de números para palavras em PT (euros inteiros)
function numberToWordsPt(amount: number): string {
  const units = ['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove']
  const teens = ['dez','onze','doze','treze','catorze','quinze','dezasseis','dezassete','dezoito','dezanove']
  const tens = ['', '', 'vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa']
  const hundreds = ['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos']

  const euros = Math.floor(Math.max(0, amount))
  if (euros === 0) return 'zero euros'
  if (euros === 100) return 'cem euros'

  let result = ''
  let n = euros

  if (n >= 1000) {
    const thousands = Math.floor(n / 1000)
    if (thousands === 1) {
      result += 'mil '
    } else {
      result += convertHundreds(thousands) + ' mil '
    }
    n %= 1000
  }

  if (n > 0) {
    result += convertHundreds(n)
  }

  return (result.trim() + ' euros')

  function convertHundreds(x: number): string {
    let str = ''
    if (x >= 100) {
      if (x === 100) {
        str += 'cem '
      } else {
        str += hundreds[Math.floor(x / 100)] + ' '
      }
      x %= 100
    }
    if (x >= 20) {
      str += tens[Math.floor(x / 10)]
      if (x % 10 > 0) str += ' e ' + units[x % 10]
    } else if (x >= 10) {
      str += teens[x - 10]
    } else if (x > 0) {
      str += units[x]
    }
    return str
  }
}

async function getTemplateHtml(type: ContractType) {
  // Use dedicated template for debt confession
  const filename = type === 'sale' ? 'contract-template.html' : 'confissao-divida.html'
  const templatePath = path.join(process.cwd(), 'pink-legion-web', 'public', filename)
  try {
    const content = await fs.readFile(templatePath, 'utf-8')
    return content
  } catch (err) {
    // Fallback for deployments where cwd is project root
    const altPath = path.join(process.cwd(), 'public', filename)
    const content = await fs.readFile(altPath, 'utf-8')
    return content
  }
}

function applyPlaceholders(template: string, data: LibContractData, type: ContractType) {
  // Derive banking details when possible
  const nationality = data.client.nationality || data.client.country || ''
  const bankName = data.client.bank_name || ''
  const iban = data.client.iban || ''
  // Fallback: derive SWIFT/BIC from IBAN if not provided
  const clientSwift = (() => {
    if (data.client?.swift) return data.client.swift
    if (iban) {
      const bic = getBicByIban(iban)
      return bic || ''
    }
    return ''
  })()
  const signatureLocation = data.client.city || 'Maia'
  const pinkCreditorIban = 'PT50000000000000000000000'

  // Derive first payment date (30 days after contract_date if not provided)
  const contractDate = new Date(data.contract.contract_date)
  const firstPaymentDate = (() => {
    if (data.contract.first_payment_date) {
      return new Date(data.contract.first_payment_date)
    }
    const d = new Date(contractDate)
    d.setDate(d.getDate() + 30)
    return d
  })()

  // Try to resolve contract number for CCV
  const ccvNumber = (
    (data as any)?.contract?.contract_number ||
    (data as any)?.contract_number ||
    ''
  )

  const sellerAddress = 'Rua do Bacelo, nº 266, 4475-325 Milheirós, Maia – Portugal'

  // Montar endereço completo corretamente
  const fullAddress = (() => {
    const parts = []
    
    // Adicionar rua/endereço
    if (data.client.address) {
      parts.push(data.client.address)
    }
    
    // Adicionar cidade
    if (data.client.city) {
      parts.push(data.client.city)
    }
    
    // Adicionar código postal
    if (data.client.postal_code) {
      parts.push(data.client.postal_code)
    }
    
    // Adicionar país se houver
    if (data.client.country && data.client.country !== 'Portugal') {
      parts.push(data.client.country)
    }
    
    return parts.filter(Boolean).join(', ')
  })()

  // 🔍 DEBUG - Log da montagem do endereço
  console.log('🔍 API - Montagem do endereço:', {
    'data.client.address': data.client.address,
    'data.client.city': data.client.city,
    'data.client.postal_code': data.client.postal_code,
    'fullAddress final': fullAddress
  })

  const placeholders: Record<string, string> = {
    full_name: data.client.full_name || '',
    nif: data.client.nif || '',
    id_number: data.client.id_number || '',
    address: fullAddress,
    email: data.client.email || '',
    phone: data.client.phone || '',
    nationality,
    // Aliases for debt confession template
    debtor_full_name: data.client.full_name || '',
    debtor_nif: data.client.nif || '',
    debtor_address: fullAddress,
    debtor_nationality: nationality,
    bank_name: bankName,
    iban,
    client_swift: clientSwift,
    brand: data.car.brand || '',
    model: data.car.model || '',
    license_plate: data.car.license_plate || '',
    vin: data.car.vin || 'N/A',
    year: String(data.car.year || ''),
    color: data.car.color || '',
    total_amount: formatCurrency(data.contract.total_price || 0),
    total_amount_text: numberToWordsPt(Number(data.contract.total_price || 0)),
    down_payment: formatCurrency(data.contract.down_payment || 0),
    down_payment_text: numberToWordsPt(Number(data.contract.down_payment || 0)),
    financed_amount: formatCurrency(data.contract.financed_amount || 0),
    installments: String(data.contract.installments || 0),
    installment_amount: formatCurrency(data.contract.installment_amount || 0),
    installment_amount_text: numberToWordsPt(Number(data.contract.installment_amount || 0)),
    delivery_date: new Date(data.contract.delivery_date).toLocaleDateString('pt-PT'),
    contract_date: contractDate.toLocaleDateString('pt-PT'),
    first_payment_date: firstPaymentDate.toLocaleDateString('pt-PT'),
    first_due_date: firstPaymentDate.toLocaleDateString('pt-PT'),
    notes: data.contract.notes || '',
    payment_method: data.contract.payment_method || 'Transferência Bancária',
    signature_location: signatureLocation,
    seller_address: sellerAddress,
    seller_bank: 'Banco BPI',
    seller_iban: 'PT50000000000000000000000',
    seller_swift: 'BPIEPTPL',
    // Specific placeholders for confissão de dívida
    creditor_iban: pinkCreditorIban,
    ccv_number: String(ccvNumber || '')
  }

  let html = template
  for (const [key, value] of Object.entries(placeholders)) {
    html = html.replaceAll(`{{${key}}}`, value)
  }
  // If generating debt confession, hide sections not applicable
  if (type === 'debt_confession') {
    html = html.replaceAll('{{is_debt_confession}}', 'true')
  } else {
    html = html.replaceAll('{{is_debt_confession}}', 'false')
  }
  return html
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data }: { type: ContractType, data: LibContractData } = body

    if (!type || !data) {
      return new Response(JSON.stringify({ error: 'Missing type or data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const template = await getTemplateHtml(type)
    const html = applyPlaceholders(template, data, type)

    const browser = await puppeteer.launch({
      args: process.env.NODE_ENV === 'production' 
        ? [...chromium.args, '--hide-scrollbars', '--disable-web-security']
        : [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
      executablePath: process.env.NODE_ENV === 'production' 
        ? await chromium.executablePath() 
        : undefined, // puppeteer (not puppeteer-core) will use bundled Chromium in dev
      headless: true
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    })
    await browser.close()

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store'
      }
    })
  } catch (error: any) {
    console.error('Error generating PDF via API:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate PDF', details: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}