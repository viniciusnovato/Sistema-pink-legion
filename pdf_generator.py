#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Corrigir problema de compatibilidade do ReportLab com Python mais recente
# DEVE ser feito ANTES de importar qualquer coisa do ReportLab
import hashlib
import sys

# Patch completo para hashlib.md5 - remove usedforsecurity
_original_md5 = hashlib.md5

def _patched_md5(*args, **kwargs):
    # Remove o parâmetro usedforsecurity se presente
    kwargs.pop('usedforsecurity', None)
    return _original_md5(*args, **kwargs)

# Substitui a função md5 globalmente
hashlib.md5 = _patched_md5

# Agora importa o Flask e ReportLab
from flask import Flask, request, jsonify, send_file, render_template_string, Response
from flask_cors import CORS
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
import json
import os
from datetime import datetime
import tempfile
import io

app = Flask(__name__)
CORS(app)

class ConfissaoDividaPDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_styles()
    
    def setup_styles(self):
        # Estilo para título principal
        self.styles.add(ParagraphStyle(
            name='ConfissaoTitle',
            parent=self.styles['Heading1'],
            fontSize=14,
            spaceAfter=20,
            spaceBefore=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para seções principais
        self.styles.add(ParagraphStyle(
            name='MainSection',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=15,
            spaceBefore=20,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para cláusulas
        self.styles.add(ParagraphStyle(
            name='ClauseTitle',
            parent=self.styles['Heading3'],
            fontSize=11,
            spaceAfter=10,
            spaceBefore=15,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para texto normal
        self.styles.add(ParagraphStyle(
            name='ConfissaoText',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            fontName='Helvetica',
            leading=12
        ))
        
        # Estilo para texto com recuo
        self.styles.add(ParagraphStyle(
            name='IndentedText',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            alignment=TA_JUSTIFY,
            fontName='Helvetica',
            leftIndent=20,
            leading=12
        ))

    def generate_confissao_pdf(self, data):
        # Criar buffer em memória
        buffer = io.BytesIO()
        
        # Criar documento PDF
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=1.5*cm,
            bottomMargin=2*cm
        )
        
        # Lista para armazenar elementos do PDF
        story = []
        
        # Título
        title = Paragraph("TERMO DE CONFISSÃO DE DÍVIDA, RECONHECIMENTO DE OBRIGAÇÃO E TÍTULO EXECUTIVO EUROPEU", self.styles['ConfissaoTitle'])
        story.append(title)
        story.append(Spacer(1, 15))
        
        # Número da Confissão
        numero_confissao = data.get('numeroConfissao', data.get('nifDevedor', '____________'))
        numero_text = f"<b>Nº {numero_confissao}</b>"
        story.append(Paragraph(numero_text, self.styles['MainSection']))
        story.append(Spacer(1, 20))
        
        # Linha separadora
        story.append(Paragraph("_______________________________________________", self.styles['ConfissaoText']))
        story.append(Spacer(1, 20))
        
        # ENTRE
        story.append(Paragraph("ENTRE", self.styles['MainSection']))
        story.append(Spacer(1, 8))
        
        # Credor
        credor_text = """<b>I. PINKLEGION - UNIPESSOAL LDA</b>, pessoa colectiva n.º <b>518 899 586</b>,<br/>
        com sede em Rua do Bacelo, n.º 266, 4475-325 Maia,<br/>
        doravante designada <b>"Credor"</b>;"""
        story.append(Paragraph(credor_text, self.styles['ConfissaoText']))
        story.append(Spacer(1, 12))
        
        # Devedor
        nome_devedor = data.get('nomeDevedor', '_______________________________________')
        cartao_cidadao = data.get('cartaoCidadaoDevedor', '____________')
        nif_devedor = data.get('nifDevedor', '____________')
        morada_devedor = data.get('moradaDevedor', '_______________________________________')
        
        devedor_text = f"""<b>II. {nome_devedor}</b>, titular do Cartão de Cidadão n.º {cartao_cidadao},<br/>
        NIF n.º {nif_devedor}, residente em {morada_devedor},<br/>
        doravante designado <b>"Devedor"</b>."""
        story.append(Paragraph(devedor_text, self.styles['ConfissaoText']))
        story.append(Spacer(1, 12))
        
        story.append(Paragraph('(Em conjunto, "Partes".)', self.styles['ConfissaoText']))
        story.append(Spacer(1, 20))
        
        # Linha separadora
        story.append(Paragraph("_______________________________________________", self.styles['ConfissaoText']))
        story.append(Spacer(1, 20))
        
        # 1. Enquadramento e Origem da Dívida
        story.append(Paragraph("1. Enquadramento e Origem da Dívida", self.styles['ClauseTitle']))
        
        numero_contrato = data.get('numeroContrato', '______')
        clausula1_1 = f"""1.1. O Devedor adquiriu ao Credor o veículo automóvel identificado no <b>Contrato de Compra e Venda nº {numero_contrato}</b>,<br/>
        do qual recebeu cópia devidamente assinada."""
        story.append(Paragraph(clausula1_1, self.styles['ConfissaoText']))
        
        valor_total = self.format_currency(data.get('valorTotal', '0'))
        valor_extenso = data.get('valorTotalExtenso', '____________')
        clausula1_2 = f"""1.2. Em resultado dessa aquisição, o Devedor reconhece ter contraído perante o Credor uma obrigação pecuniária<br/>
        no montante total de <b>€ {valor_total} ({valor_extenso} euros)</b>, certa, líquida e exigível, relativa ao preço da viatura<br/>
        e despesas associadas."""
        story.append(Paragraph(clausula1_2, self.styles['ConfissaoText']))
        story.append(Spacer(1, 15))
        
        # 2. Confissão Expressa da Dívida
        story.append(Paragraph("2. Confissão Expressa da Dívida", self.styles['ClauseTitle']))
        
        clausula2_1 = """2.1. Nos termos do artigo 394.º, n.º 2 do Código Civil português, o Devedor confessa e reconhece integralmente<br/>
        a dívida referida na cláusula anterior, renunciando a qualquer alegação de compensação, condição, exceção<br/>
        ou dedução que a possa afetar."""
        story.append(Paragraph(clausula2_1, self.styles['ConfissaoText']))
        
        clausula2_2 = """2.2. A presente confissão constitui <b>título executivo extrajudicial</b>, para efeitos do artigo 703.º, n.º 1, alínea b) do Código<br/>
        de Processo Civil (CPC), permitindo ao Credor instaurar diretamente processo executivo em caso de incumprimento."""
        story.append(Paragraph(clausula2_2, self.styles['ConfissaoText']))
        
        clausula2_3 = """2.3. Para efeitos do <b>Regulamento (CE) n.º 805/2004 (Título Executivo Europeu – TEE)</b>, as Partes reconhecem que<br/>
        o presente documento contém uma obrigação não impugnada. O Devedor declara que:<br/>
        - a) Foi informado do direito de se opor à dívida e de instaurar processo declarativo, mas opta por não o fazer;<br/>
        - b) Concorda que o presente termo possa ser certificado como TEE, permitindo a execução direta em qualquer<br/>
        Estado-Membro da União Europeia sem necessidade de exequátur."""
        story.append(Paragraph(clausula2_3, self.styles['ConfissaoText']))
        story.append(Spacer(1, 15))
        
        # 3. Plano de Pagamento
        story.append(Paragraph("3. Plano de Pagamento", self.styles['ClauseTitle']))
        
        entrada_inicial = self.format_currency(data.get('entradaInicial', '0'))
        saldo_remanescente = self.format_currency(data.get('saldoRemanescente', '0'))
        numero_prestacoes = data.get('numeroPrestacoes', '____')
        valor_prestacao = self.format_currency(data.get('valorPrestacao', '0'))
        data_primeira = self.format_date(data.get('dataPrimeiraPrestacao', '__/__/____'))
        
        clausula3_1 = f"""3.1. As Partes acordam que a dívida será liquidada da seguinte forma:<br/>
        - a) Entrada inicial de <b>€ {entrada_inicial}</b>, paga na data de assinatura deste Termo;<br/>
        - b) Saldo remanescente de <b>€ {saldo_remanescente}</b>, em <b>{numero_prestacoes} prestações mensais</b> de <b>€ {valor_prestacao}</b> cada,<br/>
        vencendo-se a primeira em <b>{data_primeira}</b> e as restantes no mesmo dia dos meses subsequentes."""
        story.append(Paragraph(clausula3_1, self.styles['ConfissaoText']))
        
        iban_credor = data.get('ibanCredor', '____________________________')
        clausula3_2 = f"""3.2. Os pagamentos serão efetuados por transferência bancária para o <b>IBAN do Credor: {iban_credor}</b>,<br/>
        indicando como referência: <i>"Confissão de Dívida + [{nome_devedor}]"</i>."""
        story.append(Paragraph(clausula3_2, self.styles['ConfissaoText']))
        
        clausula3_3 = """3.3. O Devedor poderá antecipar, parcial ou totalmente, qualquer prestação, sem penalidade, devendo informar o Credor<br/>
        com 3 dias úteis de antecedência."""
        story.append(Paragraph(clausula3_3, self.styles['ConfissaoText']))
        story.append(Spacer(1, 20))
        
        # 4. Juros de Mora e Vencimento Antecipado
        story.append(Paragraph("4. Juros de Mora e Vencimento Antecipado", self.styles['ClauseTitle']))
        
        clausula4_1 = """4.1. O não pagamento pontual de qualquer parcela implica, a partir do respetivo vencimento:<br/>
        - a) Vencimento imediato de todas as quantias remanescentes (artigo 780.º do Código Civil);<br/>
        - b) Aplicação de juros moratórios à taxa legal civil (Portaria 291/2003), acrescida de 7 p.p., nos termos do DL 62/2013;<br/>
        - c) Obrigação do Devedor de suportar todas as despesas e custas inerentes à cobrança, judiciais e extrajudiciais,<br/>
        incluindo honorários de advogado."""
        story.append(Paragraph(clausula4_1, self.styles['ConfissaoText']))
        story.append(Spacer(1, 15))
        
        # Assinatura
        local_assinatura = data.get('localAssinatura', 'Maia')
        data_assinatura = self.format_date(data.get('dataAssinatura', '___ de __________ de 2025'))
        
        story.append(Spacer(1, 30))
        story.append(Paragraph(f"<b>Local e Data:</b> {local_assinatura}, {data_assinatura}", self.styles['ConfissaoText']))
        story.append(Spacer(1, 30))
        
        story.append(Paragraph("<b>Credor:</b>", self.styles['ConfissaoText']))
        story.append(Paragraph("PINKLEGION - UNIPESSOAL LDA", self.styles['ConfissaoText']))
        story.append(Paragraph("(assinatura reconhecida)", self.styles['ConfissaoText']))
        story.append(Spacer(1, 30))
        
        story.append(Paragraph("<b>Devedor:</b>", self.styles['ConfissaoText']))
        story.append(Paragraph("________________________________________", self.styles['ConfissaoText']))
        story.append(Paragraph("(assinatura reconhecida)", self.styles['ConfissaoText']))
        
        # Construir PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    def format_currency(self, value):
        try:
            if isinstance(value, str):
                # Remove caracteres não numéricos exceto ponto e vírgula
                clean_value = ''.join(c for c in value if c.isdigit() or c in '.,')
                if clean_value:
                    # Substitui vírgula por ponto para conversão
                    clean_value = clean_value.replace(',', '.')
                    value = float(clean_value)
                else:
                    value = 0.0
            elif not isinstance(value, (int, float)):
                value = 0.0
            
            return f"{value:,.2f}".replace(',', ' ').replace('.', ',')
        except (ValueError, TypeError):
            return "0,00"

    def format_date(self, date_string):
        try:
            if isinstance(date_string, str) and len(date_string) == 10 and '-' in date_string:
                # Formato YYYY-MM-DD
                date_obj = datetime.strptime(date_string, '%Y-%m-%d')
                return date_obj.strftime('%d/%m/%Y')
            return date_string or 'N/A'
        except (ValueError, TypeError):
            return date_string or 'N/A'

class ContractPDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_styles()
    
    def setup_styles(self):
        # Estilo para título principal - mais elegante
        self.styles.add(ParagraphStyle(
            name='ContractTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=20,
            spaceBefore=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para número do contrato
        self.styles.add(ParagraphStyle(
            name='ContractNumber',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))
        
        # Estilo para seções principais (ENTRE:, PREÂMBULO, etc.)
        self.styles.add(ParagraphStyle(
            name='MainSection',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=15,
            spaceBefore=20,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para cláusulas
        self.styles.add(ParagraphStyle(
            name='ClauseTitle',
            parent=self.styles['Heading3'],
            fontSize=11,
            spaceAfter=10,
            spaceBefore=15,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para texto normal do contrato
        self.styles.add(ParagraphStyle(
            name='ContractText',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            fontName='Helvetica',
            leading=12
        ))
        
        # Estilo para texto com recuo (subcláusulas)
        self.styles.add(ParagraphStyle(
            name='IndentedText',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            alignment=TA_JUSTIFY,
            fontName='Helvetica',
            leftIndent=20,
            leading=12
        ))
        
        # Estilo para rodapé
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
            fontName='Helvetica',
            textColor=colors.grey
        ))

    def generate_contract_pdf(self, data):
        # Criar buffer em memória
        buffer = io.BytesIO()
        
        # Criar documento PDF com margens menores para mais conteúdo
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=1.5*cm,
            bottomMargin=2*cm
        )
        
        # Lista para armazenar elementos do PDF
        story = []
        
        # Título do contrato
        title = Paragraph("CONTRATO DE COMPRA E VENDA DE AUTOMÓVEL", self.styles['ContractTitle'])
        story.append(title)
        story.append(Spacer(1, 10))
        
        # Número do contrato (usando NIF do comprador)
        nif_comprador = data.get('nif', f"AUTO-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        contract_number = Paragraph(f"Contrato nº {nif_comprador}", self.styles['ContractNumber'])
        story.append(contract_number)
        story.append(Spacer(1, 20))
        
        # ENTRE:
        story.append(Paragraph("ENTRE", self.styles['MainSection']))
        story.append(Spacer(1, 8))
        
        # Vendedora
        vendedora_text = f"""<b>1. PINKLEGION - UNIPESSOAL LDA</b>, pessoa colectiva n.º <b>518 899 586</b>, com sede na Rua do Bacelo, n.º 266, 4475-325 Maia, doravante designada "<b>Vendedora</b>";"""
        story.append(Paragraph(vendedora_text, self.styles['ContractText']))
        story.append(Spacer(1, 8))
        
        story.append(Paragraph("<b>E</b>", self.styles['ContractText']))
        story.append(Spacer(1, 8))
        
        # Comprador
        comprador_text = f"""<b>2. {data.get('nomeComprador', '______________________________________')}</b>, titular do Cartão de Cidadão n.º {data.get('cartaoCidadao', '____________')}, NIF n.º {data.get('nifComprador', '____________')}, residente em {data.get('moradaComprador', '______________________________________')}, doravante designado "<b>Comprador</b>"."""
        story.append(Paragraph(comprador_text, self.styles['ContractText']))
        story.append(Spacer(1, 15))
        
        # Texto introdutório
        intro_text = """A Vendedora e o Comprador, adiante designados em conjunto "<b>Partes</b>" e, individualmente, "<b>Parte</b>", celebram o presente <b>Contrato de Compra e Venda de Automóvel</b> (doravante "<b>Contrato</b>"), que se rege pelas disposições legais aplicáveis – designadamente o Código Civil, o Decreto-Lei n.º 84/2021 e demais legislação em vigor – bem como pelas cláusulas seguintes."""
        story.append(Paragraph(intro_text, self.styles['ContractText']))
        story.append(Spacer(1, 20))
        
        # CLÁUSULA 1.ª - OBJETO
        story.append(Paragraph("CLÁUSULA 1.ª&nbsp;&nbsp;&nbsp;&nbsp;OBJETO", self.styles['ClauseTitle']))
        
        clausula1_1 = """1.1. O presente Contrato tem por objeto a compra e venda do veículo automóvel identificado no <b>Anexo I</b>, incluindo marca, modelo, matrícula, número de chassis (VIN), cilindrada, cor, ano de fabrico e quilometragem."""
        story.append(Paragraph(clausula1_1, self.styles['ContractText']))
        
        clausula1_2 = """1.2. O veículo é vendido no estado em que se encontra, usado, tendo o Comprador declarado ter tido oportunidade de o inspecionar e aceitar as suas condições."""
        story.append(Paragraph(clausula1_2, self.styles['ContractText']))
        story.append(Spacer(1, 12))
        
        # CLÁUSULA 2.ª - PREÇO E PAGAMENTO
        story.append(Paragraph("CLÁUSULA 2.ª&nbsp;&nbsp;&nbsp;&nbsp;PREÇO E PAGAMENTO", self.styles['ClauseTitle']))
        
        preco_total = self.format_currency(data.get('precoTotal', '0'))
        clausula2_1 = f"""2.1. O preço global acordado para a compra e venda do veículo é de <b>{preco_total}</b>."""
        story.append(Paragraph(clausula2_1, self.styles['ContractText']))
        
        clausula2_2 = """2.2. O pagamento será efetuado da seguinte forma:"""
        story.append(Paragraph(clausula2_2, self.styles['ContractText']))
        
        sinal = self.format_currency(data.get('sinalPago', '0'))
        entrada_inicial = self.format_currency(data.get('valorRestante', '0'))
        prestacao_mensal = self.format_currency(data.get('valorPrestacao', '0'))
        numero_meses = data.get('numeroPrestacoes', '____________')
        
        pagamento_a = f"""a) Um sinal no valor de <b>{sinal}</b>, pago na assinatura deste contrato;"""
        story.append(Paragraph(pagamento_a, self.styles['IndentedText']))
        
        pagamento_b = f"""b) Uma entrada inicial de <b>{entrada_inicial}</b>, paga na entrega do veículo;"""
        story.append(Paragraph(pagamento_b, self.styles['IndentedText']))
        
        pagamento_c = f"""c) O remanescente será pago através de financiamento/transferência bancária em prestações mensais de <b>{prestacao_mensal}</b>, durante <b>{numero_meses} meses</b>."""
        story.append(Paragraph(pagamento_c, self.styles['IndentedText']))
        
        iban = data.get('ibanSepa', '____________________________')
        clausula2_3 = f"""2.3. O pagamento será realizado para o <b>IBAN da Vendedora: {iban}</b>."""
        story.append(Paragraph(clausula2_3, self.styles['ContractText']))
        story.append(Spacer(1, 12))
        
        # CLÁUSULA 3.ª - ENTREGA
        story.append(Paragraph("CLÁUSULA 3.ª&nbsp;&nbsp;&nbsp;&nbsp;ENTREGA", self.styles['ClauseTitle']))
        
        data_entrega = self.format_date(data.get('dataEntrega', ''))
        local_entrega = data.get('localEntrega', 'nas instalações da Vendedora ou em outro local acordado entre as Partes')
        clausula3_1 = f"""3.1. O veículo será entregue ao Comprador na data de <b>{data_entrega}</b>, {local_entrega}."""
        story.append(Paragraph(clausula3_1, self.styles['ContractText']))
        
        clausula3_2 = """3.2. A partir do momento da entrega, o Comprador assume todos os riscos e responsabilidades inerentes ao uso do veículo."""
        story.append(Paragraph(clausula3_2, self.styles['ContractText']))
        story.append(Spacer(1, 12))
        
        # CLÁUSULA 4.ª - GARANTIA
        story.append(Paragraph("CLÁUSULA 4.ª&nbsp;&nbsp;&nbsp;&nbsp;GARANTIA", self.styles['ClauseTitle']))
        
        clausula4_1 = """4.1. O veículo é vendido com garantia de bom funcionamento pelo prazo de <b>18 (dezoito) meses</b>, contados da data da entrega, nos termos do Decreto-Lei n.º 84/2021."""
        story.append(Paragraph(clausula4_1, self.styles['ContractText']))
        
        clausula4_2 = """4.2. A garantia não abrange danos decorrentes de uso incorreto, acidentes, desgaste natural ou falta de manutenção adequada."""
        story.append(Paragraph(clausula4_2, self.styles['ContractText']))
        story.append(Spacer(1, 12))
        
        # CLÁUSULA 5.ª - DESPESAS
        story.append(Paragraph("CLÁUSULA 5.ª&nbsp;&nbsp;&nbsp;&nbsp;DESPESAS", self.styles['ClauseTitle']))
        
        clausula5_1 = """5.1. As despesas de registo e transmissão de propriedade do veículo ficam a cargo da Vendedora."""
        story.append(Paragraph(clausula5_1, self.styles['ContractText']))
        
        clausula5_2 = """5.2. O Comprador é exclusivamente responsável por quaisquer infrações rodoviárias a partir da data da entrega."""
        story.append(Paragraph(clausula5_2, self.styles['ContractText']))
        story.append(Spacer(1, 12))
        
        # CLÁUSULA 6.ª - INCUMPRIMENTO
        story.append(Paragraph("CLÁUSULA 6.ª&nbsp;&nbsp;&nbsp;&nbsp;INCUMPRIMENTO", self.styles['ClauseTitle']))
        
        clausula6_1 = """6.1. O não pagamento de qualquer das prestações implica o vencimento imediato de todas as restantes prestações em dívida."""
        story.append(Paragraph(clausula6_1, self.styles['ContractText']))
        
        clausula6_2 = """6.2. Em caso de mora, serão devidos juros à taxa legal em vigor."""
        story.append(Paragraph(clausula6_2, self.styles['ContractText']))
        story.append(Spacer(1, 12))
        
        # CLÁUSULA 7.ª - RESOLUÇÃO
        story.append(Paragraph("CLÁUSULA 7.ª&nbsp;&nbsp;&nbsp;&nbsp;RESOLUÇÃO", self.styles['ClauseTitle']))
        
        clausula7_1 = """7.1. Qualquer das Partes poderá resolver o presente Contrato em caso de incumprimento grave da outra Parte."""
        story.append(Paragraph(clausula7_1, self.styles['ContractText']))
        
        clausula7_2 = """7.2. A resolução será comunicada por escrito, com aviso prévio de <b>15 (quinze) dias</b>."""
        story.append(Paragraph(clausula7_2, self.styles['ContractText']))
        story.append(Spacer(1, 12))
        
        # CLÁUSULA 8.ª - FORO E LEI APLICÁVEL
        story.append(Paragraph("CLÁUSULA 8.ª&nbsp;&nbsp;&nbsp;&nbsp;FORO E LEI APLICÁVEL", self.styles['ClauseTitle']))
        
        clausula8_1 = """8.1. Para todas as questões emergentes do presente Contrato, é competente o <b>Tribunal da Comarca da Maia</b>."""
        story.append(Paragraph(clausula8_1, self.styles['ContractText']))
        
        clausula8_2 = """8.2. O presente Contrato rege-se pela <b>lei portuguesa</b>."""
        story.append(Paragraph(clausula8_2, self.styles['ContractText']))
        story.append(Spacer(1, 20))
        
        # ANEXO I
        story.append(Paragraph("ANEXO I – Identificação do Veículo", self.styles['MainSection']))
        story.append(Spacer(1, 10))
        
        # Dados do veículo
        veiculo_data = [
            f"Marca: {data.get('marca', '____________')}",
            f"Modelo: {data.get('modelo', '____________')}",
            f"Matrícula: {data.get('matricula', '____________')}",
            f"Nº de Chassis (VIN): {data.get('numeroQuadro', '____________')}",
            f"Cilindrada: {data.get('cilindrada', '____________')}",
            f"Cor: {data.get('cor', '____________')}",
            f"Ano: {data.get('anoFabrico', '____________')}",
            f"Quilómetros: {data.get('quilometragem', '____________')}"
        ]
        
        for item in veiculo_data:
            story.append(Paragraph(f"• {item}", self.styles['ContractText']))
        
        story.append(Spacer(1, 30))
        
        # Data e local
        story.append(Paragraph("Maia, ____________", self.styles['ContractText']))
        story.append(Spacer(1, 20))
        
        # Assinaturas
        story.append(Paragraph("<b>VENDEDOR:</b>", self.styles['ContractText']))
        story.append(Paragraph("PINKLEGION - UNIPESSOAL LDA", self.styles['ContractText']))
        story.append(Spacer(1, 5))
        story.append(Paragraph("____________________________________", self.styles['ContractText']))
        story.append(Spacer(1, 25))
        
        story.append(Paragraph("<b>COMPRADOR:</b>", self.styles['ContractText']))
        story.append(Paragraph(f"{data.get('nome_comprador', '____________________________________')}", self.styles['ContractText']))
        story.append(Spacer(1, 5))
        story.append(Paragraph("____________________________________", self.styles['ContractText']))
        story.append(Spacer(1, 20))
        
        # Nova página para Autorização SEPA
        story.append(PageBreak())
        
        # Título da página SEPA
        story.append(Paragraph("Autorização de Débito Directo SEPA", self.styles['ContractTitle']))
        story.append(Spacer(1, 8))
        
        # Texto introdutório SEPA
        intro_sepa = """Ao subscrever esta autorização, está a autorizar (A) o Credor a enviar instruções ao seu banco para debitar a sua conta e (B) o seu banco a debitar a sua conta, de acordo com as instruções do Credor."""
        story.append(Paragraph(intro_sepa, self.styles['ContractText']))
        story.append(Spacer(1, 4))
        
        direitos_sepa = """Os seus direitos incluem a possibilidade de exigir do seu Banco o reembolso do montante debitado, nos termos e condições acordados com o seu banco. O reembolso deve ser solicitado até um prazo de oito semanas, a contar da data do débito na sua conta."""
        story.append(Paragraph(direitos_sepa, self.styles['ContractText']))
        story.append(Spacer(1, 4))
        
        declaracao_sepa = """Os seus direitos, referentes à autorização, são explicados em declaração que pode obter junto do seu Banco."""
        story.append(Paragraph(declaracao_sepa, self.styles['ContractText']))
        story.append(Spacer(1, 8))
        
        # Identificação da Autorização
        story.append(Paragraph("<b>Identificação da Autorização:</b> (a completar pelo Credor)", self.styles['ClauseTitle']))
        story.append(Spacer(1, 4))
        
        story.append(Paragraph(f"<b>Relativamente ao contrato:</b> {data.get('nif', '829550000006573380')}", self.styles['ContractText']))
        story.append(Spacer(1, 4))
        
        story.append(Paragraph("<b>Tipos de pagamento:</b>", self.styles['ContractText']))
        story.append(Paragraph("(X) recorrente", self.styles['ContractText']))
        story.append(Spacer(1, 6))
        
        # Identificação do Devedor
        story.append(Paragraph("<b>Identificação do Devedor</b> (a completar pelo Credor)", self.styles['ClauseTitle']))
        story.append(Spacer(1, 4))
        
        story.append(Paragraph(f"<b>Morada:</b> {data.get('moradaSepa', '37 Grange Park Road Thornton Heath')}", self.styles['ContractText']))
        story.append(Paragraph("(máximo 70 caracteres)", self.styles['ContractText']))
        story.append(Spacer(1, 3))
        
        story.append(Paragraph(f"<b>Código Postal:</b> {data.get('codigoPostalSepa', 'CR7-84E')}", self.styles['ContractText']))
        story.append(Spacer(1, 3))
        
        story.append(Paragraph(f"<b>Cidade:</b> {data.get('cidadeSepa', 'Surrey')}", self.styles['ContractText']))
        story.append(Spacer(1, 3))
        
        story.append(Paragraph(f"<b>País:</b> {data.get('paisSepa', 'Londres')}", self.styles['ContractText']))
        story.append(Spacer(1, 6))
        
        # Dados bancários
        story.append(Paragraph(f"<b>Número de conta (IBAN):</b> {data.get('ibanSepa', 'GB53HLFX11050312278466')}", self.styles['ContractText']))
        story.append(Paragraph("(Pode consultar o seu IBAN e BIC do Banco através do seu extracto de conta)", self.styles['ContractText']))
        story.append(Spacer(1, 3))
        
        story.append(Paragraph(f"<b>BIC SWIFT:</b> {data.get('bicSepa', 'HLFXGB21O05')}", self.styles['ContractText']))
        story.append(Paragraph("(BIC, máximo 11 caracteres, não é obrigatório na Bélgica)", self.styles['ContractText']))
        story.append(Spacer(1, 8))
        
        # Data e assinatura SEPA
        story.append(Paragraph(f"<b>Data:</b> {data.get('dataSepa', '11-09-2025')}", self.styles['ContractText']))
        story.append(Spacer(1, 3))
        
        story.append(Paragraph(f"<b>Localidade:</b> {data.get('localidadeSepa', 'Porto')}", self.styles['ContractText']))
        story.append(Spacer(1, 3))
        
        story.append(Paragraph(f"<b>Nome:</b> {data.get('nomeSepa', 'Portugal')}", self.styles['ContractText']))
        story.append(Spacer(1, 8))
        
        # Assinatura do Cliente (Devedor) - SEPA
        story.append(Paragraph("<b>ASSINATURA DO CLIENTE:</b>", self.styles['ClauseTitle']))
        story.append(Spacer(1, 6))
        
        story.append(Paragraph(f"Nome: {data.get('nomeComprador', 'Nome do Comprador')}", self.styles['ContractText']))
        story.append(Spacer(1, 8))
        story.append(Paragraph("_" * 50, self.styles['ContractText']))
        story.append(Paragraph("(Assinatura do Cliente autorizando débito direto SEPA)", self.styles['ContractText']))
        
        # Construir o PDF
        doc.build(story)
        
        # Retornar o buffer
        buffer.seek(0)
        return buffer
    
    def format_currency(self, value):
        """Formatar valor como moeda europeia"""
        try:
            if isinstance(value, str):
                # Remove caracteres não numéricos exceto ponto e vírgula
                clean_value = ''.join(c for c in value if c.isdigit() or c in '.,')
                if ',' in clean_value:
                    clean_value = clean_value.replace(',', '.')
                value = float(clean_value)
            else:
                value = float(value)
            return f"€ {value:,.2f}".replace(',', ' ').replace('.', ',').replace(' ', '.')
        except (ValueError, TypeError):
            return f"€ 0,00"
    
    def format_date(self, date_string):
        """Formatar data para formato português"""
        try:
            if date_string:
                date_obj = datetime.strptime(date_string, '%Y-%m-%d')
                months = [
                    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
                ]
                return f"{date_obj.day} de {months[date_obj.month - 1]} de {date_obj.year}"
            return 'N/A'
        except (ValueError, TypeError):
            return date_string or 'N/A'

@app.route('/')
def index():
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return '''
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sistema de Contratos</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                .container { max-width: 600px; margin: 0 auto; }
                .btn { display: inline-block; padding: 12px 24px; margin: 10px; 
                       background: #007bff; color: white; text-decoration: none; 
                       border-radius: 5px; }
                .btn:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Sistema de Contratos</h1>
                <p>Escolha o tipo de contrato que deseja criar:</p>
                <a href="/contrato-veiculo.html" class="btn">Contrato de Veículo</a>
                <a href="/confissao-divida.html" class="btn">Confissão de Dívida</a>
            </div>
        </body>
        </html>
        '''

@app.route('/index.html')
def index_html():
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return '''
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sistema de Contratos</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                .container { max-width: 600px; margin: 0 auto; }
                .btn { display: inline-block; padding: 12px 24px; margin: 10px; 
                       background: #007bff; color: white; text-decoration: none; 
                       border-radius: 5px; }
                .btn:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Sistema de Contratos</h1>
                <p>Escolha o tipo de contrato que deseja criar:</p>
                <a href="/contrato-veiculo.html" class="btn">Contrato de Veículo</a>
                <a href="/confissao-divida.html" class="btn">Confissão de Dívida</a>
            </div>
        </body>
        </html>
        '''

@app.route('/contrato-veiculo.html')
def contrato_veiculo():
    with open('contrato-veiculo.html', 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/styles.css')
def styles():
    with open('styles.css', 'r', encoding='utf-8') as f:
        response = app.response_class(
            response=f.read(),
            status=200,
            mimetype='text/css'
        )
        return response

@app.route('/script.js')
def script():
    try:
        with open('script.js', 'r', encoding='utf-8') as file:
            content = file.read()
        return Response(content, mimetype='application/javascript')
    except FileNotFoundError:
        return "Script não encontrado", 404

@app.route('/contrato-script.js')
def contrato_script():
    try:
        with open('contrato-script.js', 'r', encoding='utf-8') as file:
            content = file.read()
        return Response(content, mimetype='application/javascript')
    except FileNotFoundError:
        return "Script não encontrado", 404

@app.route('/confissao-divida.html')
def confissao_divida():
    with open('confissao-divida.html', 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/confissao-script.js')
def confissao_script():
    try:
        with open('confissao-script.js', 'r', encoding='utf-8') as file:
            content = file.read()
        return Response(content, mimetype='application/javascript')
    except FileNotFoundError:
        return "Script não encontrado", 404

@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Gerar PDF
        generator = ContractPDFGenerator()
        pdf_buffer = generator.generate_contract_pdf(data)
        
        # Retornar PDF
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'contrato-automovel-{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        )
        
    except Exception as e:
        print(f"Erro ao gerar PDF: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate_confissao_pdf', methods=['POST'])
def generate_confissao_pdf():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Gerar PDF da Confissão de Dívida
        generator = ConfissaoDividaPDFGenerator()
        pdf_buffer = generator.generate_confissao_pdf(data)
        
        # Retornar PDF
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'termo-confissao-divida-{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        )
        
    except Exception as e:
        print(f"Erro ao gerar PDF da Confissão de Dívida: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'message': 'Servidor funcionando'})

if __name__ == '__main__':
    app.run(debug=True, port=8080)