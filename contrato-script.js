// Script específico para a página do contrato de veículo
class VehicleContractGenerator {
    constructor() {
        this.form = document.getElementById('contractForm');
        
        if (this.form) {
            this.initializeEventListeners();
            this.setupCalculations();
            // Remover setupFormValidation para evitar validação
        }
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Cálculo automático do valor remanescente
        const precoVenda = document.getElementById('precoVenda');
        const sinalPago = document.getElementById('sinalPago');
        const numeroPrestacoes = document.getElementById('numeroPrestacoes');
        
        if (precoVenda) {
            precoVenda.addEventListener('input', () => this.updateCalculations());
        }
        if (sinalPago) {
            sinalPago.addEventListener('input', () => this.updateCalculations());
        }
        if (numeroPrestacoes) {
            numeroPrestacoes.addEventListener('input', () => this.updateCalculations());
        }

        // Preenchimento automático do campo "Relativamente ao contrato" com o NIF da Empresa
        const nifEmpresaField = document.getElementById('nifEmpresa');
        const numeroContratoField = document.getElementById('numeroContrato');
        
        if (nifEmpresaField && numeroContratoField) {
            // Preencher inicialmente
            numeroContratoField.value = nifEmpresaField.value;
            
            // Atualizar quando o NIF da Empresa mudar
            nifEmpresaField.addEventListener('input', () => {
                numeroContratoField.value = nifEmpresaField.value;
            });
        }

        // Botão de limpar formulário
        const clearBtn = document.getElementById('clearForm');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearForm());
        }
        const generatePDFBtn = document.getElementById('generatePDF');
        if (generatePDFBtn) {
            generatePDFBtn.addEventListener('click', () => this.generatePDF());
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
        let value = e.target.value.replace(/\s/g, '').toUpperCase();
        
        if (value.length > 25) {
            value = value.substring(0, 25);
        }
        
        e.target.value = value;
    }

    setupCalculations() {
        this.updateCalculations();
    }

    updateCalculations() {
        const precoVenda = parseFloat(document.getElementById('precoVenda')?.value) || 0;
        const sinalPago = parseFloat(document.getElementById('sinalPago')?.value) || 0;
        const numeroPrestacoes = parseInt(document.getElementById('numeroPrestacoes')?.value) || 1;

        const valorRemanescente = precoVenda - sinalPago;
        const valorPrestacao = valorRemanescente / numeroPrestacoes;

        const valorRemanescenteField = document.getElementById('valorRestante');
        const valorPrestacaoField = document.getElementById('valorPrestacao');

        if (valorRemanescenteField) {
            valorRemanescenteField.value = valorRemanescente.toFixed(2);
        }

        if (valorPrestacaoField) {
            valorPrestacaoField.value = valorPrestacao.toFixed(2);
        }
    }

    calculateRemaining() {
        const precoVenda = parseFloat(document.getElementById('precoVenda')?.value || '0');
        const sinalPago = parseFloat(document.getElementById('sinalPago')?.value || '0');
        
        const valorRemanescente = precoVenda - sinalPago;
        
        const valorRemanescenteField = document.getElementById('valorRestante');
        if (valorRemanescenteField) {
            valorRemanescenteField.value = valorRemanescente.toFixed(2);
        }
        
        // Recalcular prestação automaticamente
        this.calculateInstallment();
    }

    calculateInstallment() {
        const valorRemanescente = parseFloat(document.getElementById('valorRestante')?.value || '0');
        const numeroPrestacoes = parseInt(document.getElementById('numeroPrestacoes')?.value || '1');
        
        if (numeroPrestacoes > 0) {
            const valorPrestacao = valorRemanescente / numeroPrestacoes;
            
            const valorPrestacaoField = document.getElementById('valorPrestacao');
            if (valorPrestacaoField) {
                valorPrestacaoField.value = valorPrestacao.toFixed(2);
            }
        }
    }

    validateField(field) {
        // Validação removida - permitir qualquer valor nos campos
        this.clearFieldError(field);
        return true;
    }

    isValidNIF(nif) {
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
        return /^[A-Z]{2}-\d{2}-[A-Z0-9]{2}$/.test(matricula);
    }

    isValidIBAN(iban) {
        if (iban.length < 15 || iban.length > 34) return false;
        
        const rearranged = iban.slice(4) + iban.slice(0, 4);
        const numericString = rearranged.replace(/[A-Z]/g, (char) => {
            return (char.charCodeAt(0) - 55).toString();
        });
        
        let remainder = '';
        for (let i = 0; i < numericString.length; i++) {
            remainder = (remainder + numericString[i]) % 97;
        }
        
        return remainder === 1;
    }

    isValidChassis(chassis) {
        return chassis.length === 17 && /^[A-HJ-NPR-Z0-9]+$/.test(chassis);
    }

    isValidYear(year) {
        const currentYear = new Date().getFullYear();
        const yearNum = parseInt(year);
        return yearNum >= 1900 && yearNum <= currentYear;
    }

    isValidKilometers(km) {
        return !isNaN(km) && parseFloat(km) >= 0;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Adicionar campos calculados
        data.valorRemanescente = document.getElementById('valorRemanescente')?.value || '0';
        data.numeroContrato = `AUTO-${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '')}`;
        
        return data;
    }

    validateForm() {
        // Remover validação - permitir geração do PDF sem validar campos
        return true;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        // Gerar PDF diretamente sem validação
        await this.generatePDF();
    }

    async generatePDF() {
        try {
            // Mostrar indicador de carregamento
            const submitBtn = this.form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Gerando PDF...';
            submitBtn.disabled = true;
            
            // Coletar dados do formulário
            const data = this.getFormData();
            
            console.log('Dados enviados para o servidor:', data);
            
            // Enviar dados para o servidor
            const response = await fetch('/api/generate-pdf', {
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
                errorMessage += 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando.';
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
            const submitBtn = this.form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Gerar Contrato PDF';
            submitBtn.disabled = false;
        }
    }

    showMessage(message, type = 'info') {
        // Remover mensagens existentes
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Criar nova mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // Estilos da mensagem
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
        
        // Cores baseadas no tipo
        switch (type) {
            case 'success':
                messageDiv.style.backgroundColor = '#4CAF50';
                break;
            case 'error':
                messageDiv.style.backgroundColor = '#f44336';
                break;
            case 'warning':
                messageDiv.style.backgroundColor = '#ff9800';
                break;
            default:
                messageDiv.style.backgroundColor = '#2196F3';
        }
        
        // Adicionar ao DOM
        document.body.appendChild(messageDiv);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    clearForm() {
        if (confirm('Tem certeza que deseja limpar todos os campos do formulário?')) {
            this.form.reset();
            
            // Limpar erros
            const errorElements = this.form.querySelectorAll('.field-error');
            errorElements.forEach(error => error.remove());
            
            const errorFields = this.form.querySelectorAll('.error');
            errorFields.forEach(field => field.classList.remove('error'));
            
            this.updateCalculations();
            
            this.showMessage('Formulário limpo com sucesso!', 'info');
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new VehicleContractGenerator();
});