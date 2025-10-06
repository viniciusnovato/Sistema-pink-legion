// Portuguese Banks BIC/SWIFT Lookup
// Based on the first 4 digits after PT50 in Portuguese IBANs

export interface PortugueseBank {
  code: string
  name: string
  bic: string
}

export const portugueseBanks: PortugueseBank[] = [
  { code: '0007', name: 'Banco Comercial Português (BCP)', bic: 'BCOMPTPL' },
  { code: '0010', name: 'Banco BPI', bic: 'BBPIPTPL' },
  { code: '0018', name: 'Banco Santander Totta', bic: 'TOTAPTPL' },
  { code: '0023', name: 'Banco CTT', bic: 'CTTBPTPL' },
  { code: '0033', name: 'Banco Millennium BCP', bic: 'BCOMPTPL' },
  { code: '0035', name: 'Caixa Geral de Depósitos', bic: 'CGDIPTPL' },
  { code: '0036', name: 'Banco Montepio', bic: 'MPIOPTPL' },
  { code: '0045', name: 'Banco Credibom', bic: 'CCCMPTPL' },
  { code: '0079', name: 'Banco Português de Gestão', bic: 'BPGAPTPL' },
  { code: '0119', name: 'Banco BAI Europa', bic: 'BAIEPTPL' },
  { code: '0269', name: 'Banco Invest', bic: 'BINVPTPL' },
  { code: '0781', name: 'Banco Carregosa', bic: 'CARSPTPL' },
  { code: '8888', name: 'Moey!', bic: 'BCOMPTPL' },
  { code: '0065', name: 'Banco Atlântico Europa', bic: 'BATEPTPL' },
  { code: '0074', name: 'Banco Finantia', bic: 'FINAPTPL' },
  { code: '0086', name: 'Banco BiG', bic: 'BIGAPTPL' },
  { code: '0093', name: 'Banco Português do Atlântico', bic: 'BPATPTPL' },
  { code: '0101', name: 'Banco Best', bic: 'BESTPTPL' },
  { code: '0155', name: 'Banco Económico', bic: 'ECOCPTPL' },
  { code: '0191', name: 'Banco de Fomento Angola', bic: 'BFAOAOLU' },
  { code: '0193', name: 'Banco Comercial do Atlântico', bic: 'BCATPTPL' },
  { code: '0194', name: 'Banco Africano de Investimentos', bic: 'BAIAPTPL' },
  { code: '0195', name: 'Banco Angolano de Negócios e Comércio', bic: 'BANCAOLU' },
  { code: '0205', name: 'Banco Espírito Santo', bic: 'BESCPTPL' },
  { code: '0224', name: 'Banco Português de Negócios', bic: 'BPNPPTPL' },
  { code: '0229', name: 'Banco Primus', bic: 'PRIMPTPL' },
  { code: '0263', name: 'Banco Efisa', bic: 'EFISPTPL' },
  { code: '0273', name: 'Banco Mais', bic: 'MAISPTPL' },
  { code: '0274', name: 'Banco da Caixa Geral', bic: 'CGDIPTPL' },
  { code: '0388', name: 'Banco Comercial e de Investimentos', bic: 'BCIPTPL' },
  { code: '0434', name: 'Banco de Investimento Imobiliário', bic: 'BIIMPTPL' },
  { code: '0504', name: 'Banco Português de Investimento', bic: 'BPIPPTPL' },
  { code: '0558', name: 'Banco de Negócios Internacional', bic: 'BNIPPTPL' },
  { code: '0559', name: 'Banco Privado Português', bic: 'BPPIPTPL' },
  { code: '0721', name: 'Banco Ativo', bic: 'BATIVPTPL' },
  { code: '0755', name: 'Banco de Investimento Global', bic: 'BIGIPTPL' },
  { code: '0756', name: 'Banco Único', bic: 'BUNICPTPL' },
  { code: '0757', name: 'Banco Português de Gestão', bic: 'BPGAPTPL' },
  { code: '0758', name: 'Banco de Desenvolvimento e Crédito', bic: 'BDCRIPTPL' },
  { code: '0759', name: 'Banco Português de Negócios', bic: 'BPNPPTPL' },
  { code: '0761', name: 'Banco de Crédito Predial Português', bic: 'BCPPPTPL' },
  { code: '0762', name: 'Banco Comercial de Macau', bic: 'BCMAPTPL' },
  { code: '0763', name: 'Banco Nacional Ultramarino', bic: 'BNULPTPL' },
  { code: '0764', name: 'Banco Totta & Açores', bic: 'TOTAPTPL' },
  { code: '0765', name: 'Banco Pinto & Sotto Mayor', bic: 'BPSMPTPL' },
  { code: '0766', name: 'Banco Borges & Irmão', bic: 'BBIPPTPL' },
  { code: '0767', name: 'Banco Fonsecas & Burnay', bic: 'BFBUPTPL' },
  { code: '0768', name: 'Banco Mello', bic: 'BMELLPTPL' },
  { code: '0769', name: 'Banco Espírito Santo e Comercial de Lisboa', bic: 'BESCPTPL' },
  { code: '0770', name: 'Banco Internacional de Crédito', bic: 'BICRIPTPL' },
  { code: '0771', name: 'Banco Intercontinental Português', bic: 'BIPOPTPL' },
  { code: '0772', name: 'Banco Comercial Português', bic: 'BCOMPTPL' },
  { code: '0773', name: 'Banco Português do Atlântico', bic: 'BPATPTPL' },
  { code: '0774', name: 'Banco de Fomento Nacional', bic: 'BFNAPTPL' },
  { code: '0775', name: 'Banco Popular Português', bic: 'BPOPPTPL' },
  { code: '0776', name: 'Banco Comercial de Lisboa', bic: 'BCLIPTPL' },
  { code: '0777', name: 'Banco Industrial do Porto', bic: 'BIPOPTPL' },
  { code: '0778', name: 'Banco de Lisboa & Açores', bic: 'BLACPTPL' },
  { code: '0779', name: 'Banco Fomento Exterior', bic: 'BFEXPTPL' },
  { code: '0780', name: 'Banco Comercial de Macau', bic: 'BCMAPTPL' },
  { code: '0782', name: 'Banco Luso Americano', bic: 'BLUSPTPL' },
  { code: '0783', name: 'Banco Comercial dos Açores', bic: 'BCACPTPL' },
  { code: '0784', name: 'Banco Insular', bic: 'BINSPTPL' },
  { code: '0785', name: 'Banco Madeirense', bic: 'BMADPTPL' },
  { code: '0786', name: 'Banco Comercial da Madeira', bic: 'BCMDPTPL' },
  { code: '0787', name: 'Banco Internacional do Funchal', bic: 'BIFUPTPL' },
  { code: '0788', name: 'Banco da Madeira', bic: 'BMADPTPL' },
  { code: '0789', name: 'Banco Comercial do Porto', bic: 'BCPOPTPL' },
  { code: '0790', name: 'Banco do Minho', bic: 'BMINPTPL' },
  { code: '0791', name: 'Banco do Nordeste', bic: 'BNORPTPL' },
  { code: '0792', name: 'Banco Regional do Centro', bic: 'BRCNPTPL' },
  { code: '0793', name: 'Banco do Sul e Ilhas', bic: 'BSILPTPL' },
  { code: '0794', name: 'Banco Regional de Desenvolvimento', bic: 'BRDEPTPL' },
  { code: '0795', name: 'Banco de Crédito Agrícola', bic: 'BCAGPTPL' },
  { code: '0796', name: 'Banco Central de Crédito Popular', bic: 'BCCPPTPL' },
  { code: '0797', name: 'Banco Popular de Braga', bic: 'BPBRPTPL' },
  { code: '0798', name: 'Banco Popular do Centro', bic: 'BPCNPTPL' },
  { code: '0799', name: 'Banco Popular do Sul', bic: 'BPSUPTPL' }
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