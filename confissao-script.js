class ConfissaoDividaGenerator {
    constructor() {
        this.initializeEventListeners();
        this.setupCalculations();
    }

    initializeEventListeners() {
        const form = document.getElementById('confissaoForm');
        const clearButton = document.getElementById('clearForm');

        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        if (clearButton) {
            clearButton.addEventListener('click', this.clearForm.bind(this));
        }

        // Cálculos automáticos
        const valorTotalInput = document.getElementById('valorTotal');
        const entradaInicialInput = document.getElementById('entradaInicial');
        const numeroPrestacoesInput = document.getElementById('numeroPrestacoes');
        const nifDevedorInput = document.getElementById('nifDevedor');

        if (valorTotalInput) {
            valorTotalInput.addEventListener('input', this.updateCalculations.bind(this));
        }
        if (entradaInicialInput) {
            entradaInicialInput.addEventListener('input', this.updateCalculations.bind(this));
        }
        if (numeroPrestacoesInput) {
            numeroPrestacoesInput.addEventListener('input', this.updateCalculations.bind(this));
        }
        if (nifDevedorInput) {
            nifDevedorInput.addEventListener('input', this.updateNumeroConfissao.bind(this));
        }
    }

    setupCalculations() {
        this.updateCalculations();
    }

    updateCalculations() {
        const valorTotal = parseFloat(document.getElementById('valorTotal')?.value) || 0;
        const entradaInicial = parseFloat(document.getElementById('entradaInicial')?.value) || 0;
        const numeroPrestacoes = parseInt(document.getElementById('numeroPrestacoes')?.value) || 1;

        const saldoRemanescente = valorTotal - entradaInicial;
        const valorPrestacao = saldoRemanescente / numeroPrestacoes;

        const saldoRemanescenteInput = document.getElementById('saldoRemanescente');
        const valorPrestacaoInput = document.getElementById('valorPrestacao');

        if (saldoRemanescenteInput) {
            saldoRemanescenteInput.value = saldoRemanescente.toFixed(2);
        }

        if (valorPrestacaoInput) {
            valorPrestacaoInput.value = valorPrestacao.toFixed(2);
        }

        // Atualizar valores por extenso
        this.updateValuesInWords();
        
        // Atualizar número da confissão
        this.updateNumeroConfissao();
    }

    updateNumeroConfissao() {
        const nifDevedor = document.getElementById('nifDevedor')?.value || '';
        const numeroConfissaoInput = document.getElementById('numeroConfissao');
        
        if (numeroConfissaoInput && nifDevedor.trim() !== '') {
            numeroConfissaoInput.value = nifDevedor;
        } else if (numeroConfissaoInput) {
            numeroConfissaoInput.value = '';
        }
    }

    updateValuesInWords() {
        const valorTotal = parseFloat(document.getElementById('valorTotal')?.value) || 0;
        const entradaInicial = parseFloat(document.getElementById('entradaInicial')?.value) || 0;
        const valorPrestacao = parseFloat(document.getElementById('valorPrestacao')?.value) || 0;

        // Atualizar valor total por extenso
        const valorTotalExtensoInput = document.getElementById('valorTotalExtenso');
        if (valorTotalExtensoInput && valorTotal > 0) {
            valorTotalExtensoInput.value = this.numberToWords(valorTotal);
        }

        // Atualizar entrada inicial por extenso
        const entradaInicialExtensoInput = document.getElementById('entradaInicialExtenso');
        if (entradaInicialExtensoInput && entradaInicial > 0) {
            entradaInicialExtensoInput.value = this.numberToWords(entradaInicial);
        }

        // Atualizar valor da prestação por extenso
        const valorPrestacaoExtensoInput = document.getElementById('valorPrestacaoExtenso');
        if (valorPrestacaoExtensoInput && valorPrestacao > 0) {
            valorPrestacaoExtensoInput.value = this.numberToWords(valorPrestacao);
        }
    }

    validateForm() {
        return true; // Sem validação para permitir geração direta
    }

    handleFormSubmit(event) {
        event.preventDefault();
        this.generatePDF();
    }

    generatePDF() {
        const formData = this.getFormData();
        
        fetch('/generate_confissao_pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Termo_Confissao_Divida_${formData.nomeDevedor.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar o PDF. Verifique os dados e tente novamente.');
        });
    }

    getFormData() {
        const form = document.getElementById('confissaoForm');
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    }

    clearForm() {
        const form = document.getElementById('confissaoForm');
        if (form) {
            form.reset();
            this.updateCalculations();
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Função para converter números em texto por extenso
    numberToWords(num) {
        if (num === 0) return 'zero';
        
        const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

        const convertGroup = (n) => {
            if (n === 0) return '';
            
            let result = '';
            const c = Math.floor(n / 100);
            const d = Math.floor((n % 100) / 10);
            const u = n % 10;

            if (c > 0) {
                if (n === 100) {
                    result += 'cem';
                } else {
                    result += centenas[c];
                }
            }

            if (d === 1 && u > 0) {
                if (result) result += ' e ';
                result += especiais[u];
            } else {
                if (d > 1) {
                    if (result) result += ' e ';
                    result += dezenas[d];
                }
                if (u > 0) {
                    if (result) result += ' e ';
                    result += unidades[u];
                }
            }

            return result;
        };

        // Separar em grupos de milhares
        const groups = [];
        let tempNum = Math.floor(num);
        
        while (tempNum > 0) {
            groups.unshift(tempNum % 1000);
            tempNum = Math.floor(tempNum / 1000);
        }

        const groupNames = ['', 'mil', 'milhão', 'bilhão'];
        let result = '';

        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const groupIndex = groups.length - 1 - i;
            
            if (group === 0) continue;

            if (result) result += ' ';

            const groupText = convertGroup(group);
            result += groupText;

            if (groupIndex > 0) {
                if (groupIndex === 1) {
                    result += ' mil';
                } else if (groupIndex === 2) {
                    if (group === 1) {
                        result += ' milhão';
                    } else {
                        result += ' milhões';
                    }
                } else if (groupIndex === 3) {
                    if (group === 1) {
                        result += ' bilhão';
                    } else {
                        result += ' bilhões';
                    }
                }
            }
        }

        // Tratar centavos se houver
        const cents = Math.round((num - Math.floor(num)) * 100);
        if (cents > 0) {
            result += ' euros';
            if (cents === 1) {
                result += ' e um cêntimo';
            } else {
                result += ' e ' + convertGroup(cents) + ' cêntimos';
            }
        } else {
            result += ' euros';
        }

        return result;
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    new ConfissaoDividaGenerator();
});