// Sistema de Geração de Contratos
class ContractGenerator {
    constructor() {
        this.form = document.getElementById('contractForm');
        this.previewBtn = document.getElementById('previewBtn');
        this.previewSection = document.getElementById('preview');
        this.previewContent = document.getElementById('previewContent');
        
        if (this.form) {
            this.initializeEventListeners();
            this.setupFormValidation();
        }
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Verificar se os elementos existem antes de adicionar event listeners
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.showPreview());
        }
        
        // Adicionar evento para o botão de gerar PDF
        const generatePDFBtn = document.getElementById('generatePDF');
        if (generatePDFBtn) {
            generatePDFBtn.addEventListener('click', () => this.generatePDF());
        }
        
        // Formatação automática de NIF
        const nifComprador = document.getElementById('nifComprador');
        if (nifComprador) {
            nifComprador.addEventListener('input', this.formatNIF);
        }
        
        // Formatação de matrícula portuguesa
        const matricula = document.getElementById('matricula');
        if (matricula) {
            matricula.addEventListener('input', this.formatMatricula);
        }
        
        // Formatação de IBAN
        const iban = document.getElementById('iban');
        if (iban) {
            iban.addEventListener('input', this.formatIBAN);
        }
        
        // Cálculo automático do valor remanescente
        const precoTotal = document.getElementById('precoTotal');
        const sinal = document.getElementById('sinal');
        const entradaInicial = document.getElementById('entradaInicial');
        
        if (precoTotal) {
            precoTotal.addEventListener('input', this.calculateRemaining);
        }
        if (sinal) {
            sinal.addEventListener('input', this.calculateRemaining);
        }
        if (entradaInicial) {
            entradaInicial.addEventListener('input', this.calculateRemaining);
        }
    }

    setupFormValidation() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
        });
    }

    formatNIF(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 9) {
            value = value.substring(0, 9);
        }
        
        e.target.value = value;
    }

    formatMatricula(e) {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Formato português: 00-AA-00 ou AA-00-AA
        if (value.length <= 6) {
            if (value.length > 2) {
                value = value.substring(0, 2) + '-' + value.substring(2);
            }
            if (value.length > 5) {
                value = value.substring(0, 5) + '-' + value.substring(5);
            }
        }
        
        e.target.value = value;
    }

    formatIBAN(e) {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Formato IBAN português: PT50 0000 0000 0000 0000 0000 0
        if (value.startsWith('PT')) {
            value = value.replace(/(.{4})/g, '$1 ').trim();
        }
        
        e.target.value = value;
    }

    calculateRemaining() {
        const precoTotal = parseFloat(document.getElementById('precoTotal').value) || 0;
        const sinal = parseFloat(document.getElementById('sinal').value) || 0;
        const entradaInicial = parseFloat(document.getElementById('entradaInicial').value) || 0;
        
        const remanescente = precoTotal - sinal - entradaInicial;
        
        // Atualizar campo visual se existir
        const remanescenteField = document.getElementById('remanescente');
        if (remanescenteField) {
            remanescenteField.textContent = `€ ${remanescente.toFixed(2)}`;
        }
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        
        // Remove previous error styling
        field.classList.remove('error');
        
        // Basic validation
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'Este campo é obrigatório');
            return false;
        }
        
        // Specific validations
        switch (fieldName) {
            case 'nifComprador':
                if (!this.isValidNIF(value)) {
                    this.showFieldError(field, 'NIF inválido (deve ter 9 dígitos)');
                    return false;
                }
                break;
            case 'cartaoCidadao':
                if (value.length < 8) {
                    this.showFieldError(field, 'Número do Cartão de Cidadão inválido');
                    return false;
                }
                break;
            case 'matricula':
                if (!this.isValidMatricula(value)) {
                    this.showFieldError(field, 'Matrícula inválida (formato: 00-AA-00)');
                    return false;
                }
                break;
            case 'chassis':
                if (!this.isValidChassis(value)) {
                    this.showFieldError(field, 'Número de chassis inválido (deve ter 17 caracteres)');
                    return false;
                }
                break;
            case 'ano':
                if (!this.isValidYear(value)) {
                    this.showFieldError(field, 'Ano inválido');
                    return false;
                }
                break;
            case 'quilometros':
                if (!this.isValidKilometers(value)) {
                    this.showFieldError(field, 'Quilometragem inválida');
                    return false;
                }
                break;
            case 'precoTotal':
            case 'sinal':
            case 'entradaInicial':
            case 'prestacaoMensal':
                const numValue = parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(',', '.'));
                if (isNaN(numValue) || numValue <= 0) {
                    this.showFieldError(field, 'Valor monetário inválido');
                    return false;
                }
                break;
            case 'numeroMeses':
                const months = parseInt(value);
                if (months <= 0 || months > 120) {
                    this.showFieldError(field, 'Número de meses deve ser entre 1 e 120');
                    return false;
                }
                break;
            case 'iban':
                if (!this.isValidIBAN(value)) {
                    this.showFieldError(field, 'IBAN inválido');
                    return false;
                }
                break;
        }
        
        this.clearFieldError(field);
        return true;
    }

    isValidNIF(nif) {
        if (!nif) return false;
        nif = nif.replace(/\s/g, '');
        if (!/^\d{9}$/.test(nif)) return false;
        
        const digits = nif.split('').map(Number);
        const checkDigit = digits[8];
        
        let sum = 0;
        for (let i = 0; i < 8; i++) {
            sum += digits[i] * (9 - i);
        }
        
        const remainder = sum % 11;
        const expectedCheckDigit = remainder < 2 ? 0 : 11 - remainder;
        
        return checkDigit === expectedCheckDigit;
    }

    isValidMatricula(matricula) {
        if (!matricula) return false;
        matricula = matricula.replace(/[-\s]/g, '').toUpperCase();
        
        // Formato português: XX-XX-XX (2 letras, 2 números, 2 letras) ou XX-XX-XX (números e letras)
        const oldFormat = /^[A-Z]{2}\d{2}[A-Z]{2}$/.test(matricula);
        const newFormat = /^(\d{2}[A-Z]{2}\d{2}|\d{2}\d{2}[A-Z]{2})$/.test(matricula);
        
        return oldFormat || newFormat;
    }

    isValidIBAN(iban) {
        if (!iban) return false;
        iban = iban.replace(/\s/g, '').toUpperCase();
        
        // IBAN português tem 25 caracteres e começa com PT50
        if (!/^PT\d{23}$/.test(iban)) return false;
        
        // Algoritmo de validação IBAN
        const rearranged = iban.slice(4) + iban.slice(0, 4);
        const numericString = rearranged.replace(/[A-Z]/g, (char) => (char.charCodeAt(0) - 55).toString());
        
        // Verificação módulo 97
        let remainder = 0;
        for (let i = 0; i < numericString.length; i++) {
            remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
        }
        
        return remainder === 1;
    }

    isValidChassis(chassis) {
        if (!chassis) return false;
        chassis = chassis.replace(/\s/g, '').toUpperCase();
        
        // VIN tem 17 caracteres alfanuméricos (sem I, O, Q)
        return /^[A-HJ-NPR-Z0-9]{17}$/.test(chassis);
    }

    isValidYear(year) {
        if (!year) return false;
        const currentYear = new Date().getFullYear();
        const yearNum = parseInt(year);
        return yearNum >= 1900 && yearNum <= currentYear;
    }

    isValidKilometers(km) {
        if (!km) return false;
        const kmNum = parseInt(km.toString().replace(/\D/g, ''));
        return kmNum >= 0 && kmNum <= 999999;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '0.9rem';
        errorDiv.style.marginTop = '5px';
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Coletar todos os dados do formulário
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Validar campos obrigatórios
        const requiredFields = [
            'nomeComprador', 'cartaoCidadao', 'nifComprador', 'moradaComprador',
            'marca', 'modelo', 'matricula', 'chassis', 'cilindrada', 'cor', 'ano', 'quilometros',
            'precoTotal', 'sinal', 'entradaInicial', 'prestacaoMensal', 'numeroMeses', 'iban',
            'dataEntrega', 'localEntrega'
        ];
        
        const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '');
        
        if (missingFields.length > 0) {
            throw new Error(`Por favor, preencha todos os campos obrigatórios: ${missingFields.join(', ')}`);
        }
        
        // Validar formato de valores numéricos
        const numericFields = ['precoTotal', 'sinal', 'entradaInicial', 'prestacaoMensal', 'numeroMeses', 'ano', 'quilometros'];
        for (let field of numericFields) {
            if (data[field] && isNaN(parseFloat(data[field].replace(',', '.')))) {
                throw new Error(`O campo ${field} deve conter um valor numérico válido`);
            }
        }
        
        // Validar formato do NIF (9 dígitos)
        if (data.nifComprador && !/^\d{9}$/.test(data.nifComprador)) {
            throw new Error('O NIF deve conter exatamente 9 dígitos');
        }
        
        // Validar formato do IBAN
        if (data.iban && !/^PT50\d{21}$/.test(data.iban.replace(/\s/g, ''))) {
            throw new Error('O IBAN deve ter o formato português válido (PT50 seguido de 21 dígitos)');
        }
        
        // Validar data de entrega (não pode ser no passado)
        if (data.dataEntrega) {
            const entregaDate = new Date(data.dataEntrega);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (entregaDate < today) {
                throw new Error('A data de entrega não pode ser no passado');
            }
        }
        
        return data;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    formatCurrency(value) {
        if (!value) return '';
        const numValue = parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(',', '.'));
        if (isNaN(numValue)) return '';
        return numValue.toLocaleString('pt-PT', { 
            style: 'currency', 
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    generateContractText(data) {
        const dataEntrega = this.formatDate(data.dataEntrega);
        const precoTotal = this.formatCurrency(data.precoTotal);
        const sinal = this.formatCurrency(data.sinal);
        const entradaInicial = this.formatCurrency(data.entradaInicial);
        const prestacaoMensal = this.formatCurrency(data.prestacaoMensal);
        const remanescente = parseFloat(data.precoTotal) - parseFloat(data.sinal) - parseFloat(data.entradaInicial);
        const numeroContrato = data.numeroContrato || `AUTO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        
        return `
            <h3>CONTRATO DE COMPRA E VENDA DE AUTOMÓVEL</h3>
            
            <p><strong>Contrato nº ${numeroContrato}</strong></p>
            
            <div style="margin: 30px 0;">
                <h4>ENTRE</h4>
                
                <p><strong>1. PINKLEGION - UNIPESSOAL LDA</strong>, pessoa colectiva n.º <strong>518 899 586</strong>,<br>
                com sede na Rua do Bacelo, n.º 266, 4475-325 Maia,<br>
                doravante designada <strong>"Vendedora"</strong>;</p>
                
                <p><strong>E</strong></p>
                
                <p><strong>2. ${data.nomeComprador}</strong>, titular do Cartão de Cidadão n.º <strong>${data.cartaoCidadao}</strong>,<br>
                NIF n.º <strong>${data.nifComprador}</strong>, residente em <strong>${data.moradaComprador}</strong>,<br>
                doravante designado <strong>"Comprador"</strong>.</p>
            </div>
            
            <p>A Vendedora e o Comprador, adiante designados em conjunto <strong>"Partes"</strong> e, individualmente, <strong>"Parte"</strong>,<br>
            celebram o presente <strong>Contrato de Compra e Venda de Automóvel</strong> (doravante <strong>"Contrato"</strong>),<br>
            que se rege pelas disposições legais aplicáveis – designadamente o Código Civil, o Decreto-Lei n.º 84/2021<br>
            e demais legislação em vigor – bem como pelas cláusulas seguintes.</p>
            
            <div class="clause">
                <div class="clause-title">CLÁUSULA 1.ª OBJETO</div>
                <p>1.1. O presente Contrato tem por objeto a compra e venda do veículo automóvel com as seguintes características:</p>
                <p style="margin-left: 20px;">
                    • Marca: <strong>${data.marca}</strong><br>
                    • Modelo: <strong>${data.modelo}</strong><br>
                    • Matrícula: <strong>${data.matricula}</strong><br>
                    • Nº de Chassis (VIN): <strong>${data.chassis}</strong><br>
                    • Cilindrada: <strong>${data.cilindrada}</strong><br>
                    • Cor: <strong>${data.cor}</strong><br>
                    • Ano de Fabrico: <strong>${data.ano}</strong><br>
                    • Quilómetros: <strong>${data.quilometros} km</strong>
                </p>
                <p>1.2. O veículo é vendido no estado em que se encontra, usado, tendo o Comprador declarado ter tido oportunidade de o inspecionar e aceitar as suas condições.</p>
            </div>
            
            <div class="clause">
                <div class="clause-title">CLÁUSULA 2.ª PREÇO E PAGAMENTO</div>
                <p>2.1. O preço global acordado para a compra e venda do veículo é de <strong>${precoTotal}</strong>.</p>
                <p>2.2. O pagamento será efetuado da seguinte forma:</p>
                <p style="margin-left: 20px;">
                    a) Um sinal no valor de <strong>${sinal}</strong>, pago na assinatura deste contrato;<br>
                    b) Uma entrada inicial de <strong>${entradaInicial}</strong>, paga na entrega do veículo;<br>
                    c) O remanescente, no valor de <strong>${this.formatCurrency(remanescente)}</strong>, será pago através de financiamento/transferência bancária em prestações mensais de <strong>${prestacaoMensal}</strong>, durante <strong>${data.numeroMeses} meses</strong>.
                </p>
                <p>2.3. O pagamento será realizado para o <strong>IBAN da Vendedora: ${data.iban}</strong>.</p>
            </div>
            
            <div class="clause">
                <div class="clause-title">CLÁUSULA 3.ª ENTREGA</div>
                <p>3.1. O veículo será entregue ao Comprador na data de <strong>${dataEntrega}</strong>, ${data.localEntrega || 'nas instalações da Vendedora'}.</p>
                <p>3.2. A partir do momento da entrega, o Comprador assume todos os riscos e responsabilidades inerentes ao uso do veículo.</p>
            </div>
            
            <div class="clause">
                <div class="clause-title">CLÁUSULA 4.ª GARANTIA</div>
                <p>4.1. O veículo é vendido com garantia de bom funcionamento pelo prazo de <strong>18 (dezoito) meses</strong>, contados da data da entrega, nos termos do Decreto-Lei n.º 84/2021.</p>
                <p>4.2. A garantia não abrange danos decorrentes de uso incorreto, acidentes, desgaste natural ou falta de manutenção adequada.</p>
            </div>
            
            <div class="clause">
                <div class="clause-title">CLÁUSULA 5.ª DESPESAS</div>
                <p>5.1. As despesas de registo e transmissão de propriedade do veículo ficam a cargo da Vendedora.</p>
                <p>5.2. O Comprador é exclusivamente responsável por quaisquer infrações rodoviárias a partir da data da entrega.</p>
            </div>
            
            <div class="clause">
                <div class="clause-title">CLÁUSULA 6.ª INCUMPRIMENTO</div>
                <p>6.1. O não pagamento de qualquer das prestações implica o vencimento imediato de todas as restantes prestações em dívida.</p>
                <p>6.2. Em caso de mora, serão devidos juros à taxa legal em vigor.</p>
            </div>
            
            <div class="clause">
                <div class="clause-title">CLÁUSULA 7.ª RESOLUÇÃO</div>
                <p>7.1. Qualquer das Partes poderá resolver o presente Contrato em caso de incumprimento grave da outra Parte.</p>
                <p>7.2. A resolução será comunicada por escrito, com aviso prévio de <strong>15 (quinze) dias</strong>.</p>
            </div>
            
            <div class="clause">
                <div class="clause-title">CLÁUSULA 8.ª FORO E LEI APLICÁVEL</div>
                <p>8.1. Para todas as questões emergentes do presente Contrato, é competente o <strong>Tribunal da Comarca da Maia</strong>.</p>
                <p>8.2. O presente Contrato rege-se pela <strong>lei portuguesa</strong>.</p>
            </div>
            
            <p style="margin-top: 40px;">Feito em duplicado, em ________________, aos ___ de ____________ de ${new Date().getFullYear()}.</p>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <p><strong>PINKLEGION - UNIPESSOAL LDA</strong><br>Vendedora</p>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <p><strong>${data.nomeComprador}</strong><br>Comprador</p>
                </div>
            </div>
        `;
    }

    showPreview() {
        if (!this.validateForm()) {
            alert('Por favor, corrija os erros no formulário antes de visualizar.');
            return;
        }
        
        const data = this.getFormData();
        const contractText = this.generateContractText(data);
        
        this.previewContent.innerHTML = contractText;
        this.previewSection.style.display = 'block';
        
        // Scroll to preview
        this.previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            alert('Por favor, corrija os erros no formulário antes de gerar o PDF.');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.textContent = 'Gerando PDF...';
            
            await this.generatePDF();
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar o PDF. Tente novamente.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.textContent = originalText;
        }
    }

    async generatePDF() {
        try {
            // Mostrar indicador de carregamento
            const generateBtn = document.getElementById('generatePDF');
            const originalText = generateBtn.textContent;
            generateBtn.textContent = 'Gerando PDF...';
            generateBtn.disabled = true;
            
            // Coletar dados do formulário com validação
            const data = this.getFormData();
            
            console.log('Dados enviados para o servidor:', data);
            
            // Enviar dados para o servidor
            const response = await fetch('/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro do servidor: ${response.status} ${response.statusText}`);
            }
            
            // Converter resposta para blob
            const blob = await response.blob();
            
            if (blob.size === 0) {
                throw new Error('PDF gerado está vazio');
            }
            
            // Criar URL para download
            const url = window.URL.createObjectURL(blob);
            
            // Criar link de download
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // Nome do arquivo com data e número do contrato
            const numeroContrato = data.numeroContrato || `AUTO-${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '')}`;
            a.download = `Contrato_${numeroContrato}_${new Date().toISOString().slice(0, 10)}.pdf`;
            
            // Adicionar ao DOM, clicar e remover
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // Mostrar mensagem de sucesso
            this.showMessage('PDF gerado e baixado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            
            // Mostrar mensagem de erro específica
            let errorMessage = 'Erro ao gerar PDF: ';
            if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando na porta 8080.';
            } else if (error.message.includes('campos obrigatórios')) {
                errorMessage = error.message;
            } else if (error.message.includes('formato')) {
                errorMessage = error.message;
            } else {
                errorMessage += error.message;
            }
            
            this.showMessage(errorMessage, 'error');
            
        } finally {
            // Restaurar botão
            const generateBtn = document.getElementById('generatePDF');
            generateBtn.textContent = originalText;
            generateBtn.disabled = false;
        }
    }
    
    showMessage(message, type = 'info') {
        // Remover mensagem anterior se existir
        const existingMessage = document.querySelector('.message-alert');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Criar elemento de mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-alert message-${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            max-width: 400px;
            word-wrap: break-word;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        // Definir cor baseada no tipo
        switch (type) {
            case 'success':
                messageDiv.style.backgroundColor = '#28a745';
                break;
            case 'error':
                messageDiv.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                messageDiv.style.backgroundColor = '#ffc107';
                messageDiv.style.color = '#212529';
                break;
            default:
                messageDiv.style.backgroundColor = '#17a2b8';
        }
        
        messageDiv.textContent = message;
        
        // Adicionar ao DOM
        document.body.appendChild(messageDiv);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    generateContractHTML(formData) {
        return `
        <div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; padding: 2cm; max-width: 21cm; margin: 0 auto;">
            
            <!-- Cabeçalho do Contrato -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
                <h1 style="font-size: 18pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                    CONTRATO DE COMPRA E VENDA DE AUTOMÓVEL
                </h1>
                <p style="font-size: 14pt; font-weight: bold; margin-bottom: 20px;">
                    <strong>Contrato nº ${formData.contractNumber}</strong>
                </p>
            </div>

            <!-- Seção das Partes -->
            <div style="margin: 30px 0; padding: 20px; border: 1px solid #ccc; background-color: #f9f9f9;">
                <h2 style="font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 20px; text-transform: uppercase;">
                    ENTRE
                </h2>
                
                <div style="margin-bottom: 20px; padding: 15px; background: white; border-left: 4px solid #333;">
                    <p style="font-weight: bold; font-size: 13pt; margin-bottom: 5px;">
                        1. ${formData.sellerName}
                    </p>
                    <div style="margin-left: 20px; line-height: 1.8;">
                        pessoa colectiva n.º <strong>${formData.sellerNIF}</strong>,<br>
                        com sede na ${formData.sellerAddress},<br>
                        doravante designada <strong>"Vendedora"</strong>;
                    </div>
                </div>

                <p style="text-align: center; font-weight: bold; margin: 15px 0;">E</p>

                <div style="margin-bottom: 20px; padding: 15px; background: white; border-left: 4px solid #333;">
                    <p style="font-weight: bold; font-size: 13pt; margin-bottom: 5px;">
                        2. ${formData.buyerName}
                    </p>
                    <div style="margin-left: 20px; line-height: 1.8;">
                        titular do Cartão de Cidadão n.º <strong>${formData.buyerCC}</strong>,<br>
                        NIF n.º <strong>${formData.buyerNIF}</strong>, residente em <strong>${formData.buyerAddress}</strong>,<br>
                        doravante designado <strong>"Comprador"</strong>.
                    </div>
                </div>
            </div>

            <!-- Introdução -->
            <div style="text-align: justify; margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
                <p>A Vendedora e o Comprador, adiante designados em conjunto <strong>"Partes"</strong> e, individualmente, <strong>"Parte"</strong>,<br>
                celebram o presente <strong>Contrato de Compra e Venda de Automóvel</strong> (doravante <strong>"Contrato"</strong>),<br>
                que se rege pelas disposições legais aplicáveis – designadamente o Código Civil, o Decreto-Lei n.º 84/2021<br>
                e demais legislação em vigor – bem como pelas cláusulas seguintes.</p>
            </div>

            <!-- Cláusula 1 - Objeto -->
            <div style="margin: 25px 0; page-break-inside: avoid;">
                <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-bottom: 15px; padding: 10px; background-color: #e8e8e8; border-left: 5px solid #333;">
                    CLÁUSULA 1.ª OBJETO
                </div>
                <div style="padding: 0 15px; text-align: justify;">
                    <p style="margin: 10px 0; padding-left: 20px;">1.1. O presente Contrato tem por objeto a compra e venda do veículo automóvel com as seguintes características:</p>
                    
                    <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <ul style="list-style: none; padding: 0;">
                            <li style="padding: 5px 0; border-bottom: 1px dotted #ccc;">• Marca: <strong>${formData.vehicleBrand}</strong></li>
                            <li style="padding: 5px 0; border-bottom: 1px dotted #ccc;">• Modelo: <strong>${formData.vehicleModel}</strong></li>
                            <li style="padding: 5px 0; border-bottom: 1px dotted #ccc;">• Matrícula: <strong>${formData.vehiclePlate}</strong></li>
                            <li style="padding: 5px 0; border-bottom: 1px dotted #ccc;">• Nº de Chassis (VIN): <strong>${formData.vehicleVIN}</strong></li>
                            <li style="padding: 5px 0; border-bottom: 1px dotted #ccc;">• Cilindrada: <strong>${formData.vehicleEngine}</strong></li>
                            <li style="padding: 5px 0; border-bottom: 1px dotted #ccc;">• Cor: <strong>${formData.vehicleColor}</strong></li>
                            <li style="padding: 5px 0; border-bottom: 1px dotted #ccc;">• Ano de Fabrico: <strong>${formData.vehicleYear}</strong></li>
                            <li style="padding: 5px 0;">• Quilómetros: <strong>${formData.vehicleKm}</strong></li>
                        </ul>
                    </div>
                    
                    <p style="margin: 10px 0; padding-left: 20px;">1.2. O veículo é vendido no estado em que se encontra, usado, tendo o Comprador declarado ter tido oportunidade de o inspecionar e aceitar as suas condições.</p>
                </div>
            </div>

            <!-- Cláusula 2 - Preço e Pagamento -->
            <div style="margin: 25px 0; page-break-inside: avoid;">
                <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-bottom: 15px; padding: 10px; background-color: #e8e8e8; border-left: 5px solid #333;">
                    CLÁUSULA 2.ª PREÇO E PAGAMENTO
                </div>
                <div style="padding: 0 15px; text-align: justify;">
                    <p style="margin: 10px 0; padding-left: 20px;">2.1. O preço global acordado para a compra e venda do veículo é de <strong>${formData.totalPrice} €</strong>.</p>
                    
                    <p style="margin: 10px 0; padding-left: 20px;">2.2. O pagamento será efetuado da seguinte forma:</p>
                    
                    <div style="background-color: #fff8dc; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="margin: 5px 0; padding-left: 20px;">a) Um sinal no valor de <strong>${formData.signalAmount} €</strong>, pago na assinatura deste contrato;</p>
                        <p style="margin: 5px 0; padding-left: 20px;">b) Uma entrada inicial de <strong>${formData.initialPayment} €</strong>, paga na entrega do veículo;</p>
                        <p style="margin: 5px 0; padding-left: 20px;">c) O remanescente, no valor de <strong>${formData.remainingAmount} €</strong>, será pago através de financiamento/transferência bancária em prestações mensais de <strong>${formData.monthlyPayment} €</strong>, durante <strong>${formData.paymentPeriod} meses</strong>.</p>
                    </div>
                    
                    <p style="margin: 10px 0; padding-left: 20px;">2.3. O pagamento será realizado para o <strong>IBAN da Vendedora: ${formData.sellerIBAN}</strong>.</p>
                </div>
            </div>

            <!-- Cláusula 3 - Entrega -->
            <div style="margin: 25px 0; page-break-inside: avoid;">
                <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-bottom: 15px; padding: 10px; background-color: #e8e8e8; border-left: 5px solid #333;">
                    CLÁUSULA 3.ª ENTREGA
                </div>
                <div style="padding: 0 15px; text-align: justify;">
                    <p style="margin: 10px 0; padding-left: 20px;">3.1. O veículo será entregue ao Comprador na data de <strong>${formData.deliveryDate}</strong>, ${formData.deliveryLocation}.</p>
                    <p style="margin: 10px 0; padding-left: 20px;">3.2. A partir do momento da entrega, o Comprador assume todos os riscos e responsabilidades inerentes ao uso do veículo.</p>
                </div>
            </div>

            <!-- Cláusula 4 - Garantia -->
            <div style="margin: 25px 0; page-break-inside: avoid;">
                <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-bottom: 15px; padding: 10px; background-color: #e8e8e8; border-left: 5px solid #333;">
                    CLÁUSULA 4.ª GARANTIA
                </div>
                <div style="padding: 0 15px; text-align: justify;">
                    <p style="margin: 10px 0; padding-left: 20px;">4.1. O veículo é vendido com garantia de bom funcionamento pelo prazo de <strong>${formData.warrantyPeriod}</strong>, contados da data da entrega, nos termos do Decreto-Lei n.º 84/2021.</p>
                    <p style="margin: 10px 0; padding-left: 20px;">4.2. A garantia não abrange danos decorrentes de uso incorreto, acidentes, desgaste natural ou falta de manutenção adequada.</p>
                </div>
            </div>

            <!-- Cláusula 5 - Despesas -->
            <div style="margin: 25px 0; page-break-inside: avoid;">
                <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-bottom: 15px; padding: 10px; background-color: #e8e8e8; border-left: 5px solid #333;">
                    CLÁUSULA 5.ª DESPESAS
                </div>
                <div style="padding: 0 15px; text-align: justify;">
                    <p style="margin: 10px 0; padding-left: 20px;">5.1. As despesas de registo e transmissão de propriedade do veículo ficam a cargo da Vendedora.</p>
                    <p style="margin: 10px 0; padding-left: 20px;">5.2. O Comprador é exclusivamente responsável por quaisquer infrações rodoviárias a partir da data da entrega.</p>
                </div>
            </div>

            <!-- Cláusula 6 - Incumprimento -->
            <div style="margin: 25px 0; page-break-inside: avoid;">
                <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-bottom: 15px; padding: 10px; background-color: #e8e8e8; border-left: 5px solid #333;">
                    CLÁUSULA 6.ª INCUMPRIMENTO
                </div>
                <div style="padding: 0 15px; text-align: justify;">
                    <p style="margin: 10px 0; padding-left: 20px;">6.1. O não pagamento de qualquer das prestações implica o vencimento imediato de todas as restantes prestações em dívida.</p>
                    <p style="margin: 10px 0; padding-left: 20px;">6.2. Em caso de mora, serão devidos juros à taxa legal em vigor.</p>
                </div>
            </div>

            <!-- Cláusula 7 - Resolução -->
            <div style="margin: 25px 0; page-break-inside: avoid;">
                <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-bottom: 15px; padding: 10px; background-color: #e8e8e8; border-left: 5px solid #333;">
                    CLÁUSULA 7.ª RESOLUÇÃO
                </div>
                <div style="padding: 0 15px; text-align: justify;">
                    <p style="margin: 10px 0; padding-left: 20px;">7.1. Qualquer das Partes poderá resolver o presente Contrato em caso de incumprimento grave da outra Parte.</p>
                    <p style="margin: 10px 0; padding-left: 20px;">7.2. A resolução será comunicada por escrito, com aviso prévio de <strong>15 (quinze) dias</strong>.</p>
                </div>
            </div>

            <!-- Cláusula 8 - Foro e Lei Aplicável -->
            <div style="margin: 25px 0; page-break-inside: avoid;">
                <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-bottom: 15px; padding: 10px; background-color: #e8e8e8; border-left: 5px solid #333;">
                    CLÁUSULA 8.ª FORO E LEI APLICÁVEL
                </div>
                <div style="padding: 0 15px; text-align: justify;">
                    <p style="margin: 10px 0; padding-left: 20px;">8.1. Para todas as questões emergentes do presente Contrato, é competente o <strong>${formData.competentCourt}</strong>.</p>
                    <p style="margin: 10px 0; padding-left: 20px;">8.2. O presente Contrato rege-se pela <strong>lei portuguesa</strong>.</p>
                </div>
            </div>

            <!-- Seção de Assinaturas -->
            <div style="margin-top: 50px; page-break-inside: avoid;">
                <div style="text-align: center; margin: 40px 0; font-style: italic;">
                    <p>Feito em duplicado, em ________________, aos ___ de ____________ de 2025.</p>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-top: 60px;">
                    <div style="width: 45%; text-align: center;">
                        <div style="border-bottom: 2px solid #000; height: 60px; margin-bottom: 10px;"></div>
                        <p style="font-weight: bold; font-size: 11pt;"><strong>${formData.sellerName}</strong><br>Vendedora</p>
                    </div>
                    <div style="width: 45%; text-align: center;">
                        <div style="border-bottom: 2px solid #000; height: 60px; margin-bottom: 10px;"></div>
                        <p style="font-weight: bold; font-size: 11pt;"><strong>${formData.buyerName}</strong><br>Comprador</p>
                    </div>
                </div>
            </div>

        </div>
        `;
    }
}

// Inicializar o sistema quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new ContractGenerator();
});

// Adicionar estilos CSS para campos com erro
const style = document.createElement('style');
style.textContent = `
    .form-group input.error,
    .form-group select.error,
    .form-group textarea.error {
        border-color: #e74c3c !important;
        background-color: #fdf2f2 !important;
    }
`;
document.head.appendChild(style);