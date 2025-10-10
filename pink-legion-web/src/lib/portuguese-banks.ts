// Portuguese Banks BIC/SWIFT Lookup
// Based on the first 4 digits after PT50 in Portuguese IBANs

export interface PortugueseBank {
  code: string
  name: string
  bic: string
}

export const portugueseBanks: PortugueseBank[] = [
  { code: '0001', name: 'Banco de Portugal, E.P.', bic: 'BGALPTTG' },
  { code: '0007', name: 'Novo Banco, S.A.', bic: 'BESCPTPL' },
  { code: '0008', name: 'Banco BAI Europa, S.A.', bic: 'BAIPPTPL' },
  { code: '0010', name: 'Banco BPI, S.A.', bic: 'BBPIPTPL' },
  { code: '0014', name: 'Banco Invest, S.A.', bic: 'IVVSPTPL' },
  { code: '0018', name: 'Banco Santander Totta, S.A.', bic: 'TOTAPTPL' },
  { code: '0019', name: 'BBVA, S.A. – Sucursal em Portugal', bic: 'BBVAPTPL' },
  { code: '0022', name: 'Banco do Brasil, S.A. – Sucursal em Portugal', bic: 'BRASPTPL' },
  { code: '0023', name: 'ActivoBank, S.A.', bic: 'ACTVPTPL' },
  { code: '0025', name: 'Caixa Banco de Investimento, S.A.', bic: 'CXBIPTPL' },
  { code: '0027', name: 'Banco Português de Investimento, S.A.', bic: 'BPIPPTPL' },
  { code: '0032', name: 'Barclays Bank PLC – Sucursal em Portugal', bic: 'BARCPTPL' },
  { code: '0033', name: 'Banco Comercial Português, S.A. (Millennium BCP)', bic: 'BCOMPTPL' },
  { code: '0035', name: 'Caixa Geral de Depósitos, S.A.', bic: 'CGDIPTPL' },
  { code: '0036', name: 'Banco Montepio, S.A. (Caixa Económica Montepio Geral)', bic: 'MPIOPTPL' },
  { code: '0038', name: 'BANIF – Banco Internacional do Funchal, S.A.', bic: 'BNIFPTPL' },
  { code: '0045', name: 'Caixa Central de Crédito Agrícola Mútuo, C.R.L.', bic: 'CCCMPTPL' },
  { code: '0046', name: 'Banco Popular Portugal, S.A.', bic: 'CRBNPTPL' },
  { code: '0047', name: 'Haitong Bank, S.A.', bic: 'ESSIPTPL' },
  { code: '0048', name: 'Banco Finantia, S.A.', bic: 'BFIAPTPL' },
  { code: '0061', name: 'Banco de Investimento Global (BIG), S.A.', bic: 'BDIGPTPL' },
  { code: '0063', name: 'BANIF – Banco de Investimento, S.A.', bic: 'BNFIPTPL' },
  { code: '0064', name: 'Banco Português de Gestão, S.A.', bic: 'BPGPPTPL' },
  { code: '0065', name: 'BEST – Banco Eletrónico de Serviço Total, S.A.', bic: 'BESZPTPL' },
  { code: '0073', name: 'Banco Santander Consumer Portugal, S.A.', bic: 'IBNBPTPL' },
  { code: '0079', name: 'Banco BIC Português, S.A.', bic: 'BPNPPTPL' },
  { code: '0086', name: 'Banco Efisa, S.A.', bic: 'EFISPTPL' },
  { code: '0119', name: 'Banco BAI Europa, S.A.', bic: 'BAIPPTPL' },
  { code: '0160', name: 'Novo Banco dos Açores, S.A.', bic: 'BESAPTPA' },
  { code: '0189', name: 'Banco Privado Atlântico – Europa, S.A.', bic: 'BAPAPTPL' },
  { code: '0191', name: 'BNI – Banco de Negócios Internacional (Europa), S.A.', bic: 'BNICPTPL' },
  { code: '0193', name: 'Banco CTT, S.A.', bic: 'CTTVPTPL' },
  { code: '0235', name: 'Banco L.J. Carregosa, S.A.', bic: 'BLJCPTPT' },
  { code: '0269', name: 'Bankinter, S.A. – Sucursal em Portugal', bic: 'BKBKPTPL' },
  { code: '0698', name: 'UNICRE – Instituição Financeira de Crédito, S.A.', bic: 'UIFCPTP1' },
  { code: '0781', name: 'IGCP – Agência de Gestão da Tesouraria e da Dívida Pública, E.P.E.', bic: 'IGCPPTPL' },
  { code: '8888', name: 'Moey! (submarca do Millennium BCP)', bic: 'BCOMPTPL' }
]

/**
 * Extracts the bank code from a Portuguese IBAN
 * Portuguese IBAN format: PT50 XXXX YYYY ZZZZ ZZZZ ZZZZ Z
 * Where XXXX is the bank code
 */
export function extractBankCodeFromIban(iban: string): string | null {
  // Check if iban is valid
  if (!iban || typeof iban !== 'string') return null
  
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase()
  
  // Check if it's a Portuguese IBAN format (allow incomplete IBANs for bank detection)
  if (!cleanIban.startsWith('PT') || cleanIban.length < 8) {
    return null
  }
  
  // Extract bank code (positions 4-7, 0-indexed)
  return cleanIban.substring(4, 8)
}

/**
 * Gets bank information by IBAN
 */
export function getBankByIban(iban: string): PortugueseBank | null {
  const bankCode = extractBankCodeFromIban(iban)
  if (!bankCode) return null
  
  return portugueseBanks.find(bank => bank.code === bankCode) || null
}

/**
 * Gets bank information by bank code
 */
export function getBankByCode(code: string): PortugueseBank | null {
  return portugueseBanks.find(bank => bank.code === code) || null
}

/**
 * Gets BIC/SWIFT code by IBAN
 */
export function getBicByIban(iban: string): string | null {
  const bank = getBankByIban(iban)
  return bank ? bank.bic : null
}

/**
 * Validates Portuguese IBAN format
 */
export function isValidPortugueseIban(iban: string): boolean {
  // Check if iban is valid
  if (!iban || typeof iban !== 'string') return false
  
  const cleanIban = iban.replace(/\s/g, '').toUpperCase()
  
  // Basic format check
  if (!cleanIban.startsWith('PT') || cleanIban.length !== 25) {
    return false
  }
  
  // Check if bank code exists
  const bankCode = extractBankCodeFromIban(cleanIban)
  return bankCode !== null && portugueseBanks.some(bank => bank.code === bankCode)
}

/**
 * Formats IBAN with spaces for better readability
 */
export function formatIban(iban: string): string {
  // Check if iban is valid
  if (!iban || typeof iban !== 'string') return iban || ''
  
  const cleanIban = iban.replace(/\s/g, '').toUpperCase()
  
  if (cleanIban.length !== 25) return iban
  
  return cleanIban.replace(/(.{4})/g, '$1 ').trim()
}