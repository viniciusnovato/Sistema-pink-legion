from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
import hashlib
import json

# Patch para hashlib.md5 para compatibilidade com Python 3.9+
original_md5 = hashlib.md5
def patched_md5(*args, **kwargs):
    kwargs.pop('usedforsecurity', None)
    return original_md5(*args, **kwargs)
hashlib.md5 = patched_md5

class ContractPDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_styles()
    
    def setup_styles(self):
        # Estilo para título principal
        self.styles.add(ParagraphStyle(
            name='ContractTitle',
            parent=self.styles['Heading1'],
            fontSize=14,
            spaceAfter=20,
            spaceBefore=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para subtítulos
        self.styles.add(ParagraphStyle(
            name='ContractSubtitle',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=12,
            spaceBefore=12,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para texto normal
        self.styles.add(ParagraphStyle(
            name='ContractNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            spaceBefore=6,
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        ))
        
        # Estilo para texto centralizado
        self.styles.add(ParagraphStyle(
            name='ContractCenter',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            spaceBefore=6,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))
        
        # Estilo para assinaturas
        self.styles.add(ParagraphStyle(
            name='ContractSignature',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=30,
            spaceBefore=30,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))

    def generate_contract_pdf(self, data):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
        
        story = []
        
        # Título
        story.append(Paragraph("CONTRATO DE COMPRA E VENDA DE VEÍCULO", self.styles['ContractTitle']))
        story.append(Spacer(1, 20))
        
        # Dados do vendedor
        story.append(Paragraph("VENDEDOR:", self.styles['ContractSubtitle']))
        vendedor_text = f"""
        Nome: {data.get('nomeVendedor', '')}<br/>
        NIF: {data.get('nifVendedor', '')}<br/>
        Morada: {data.get('moradaVendedor', '')}<br/>
        Telefone: {data.get('telefoneVendedor', '')}<br/>
        Email: {data.get('emailVendedor', '')}
        """
        story.append(Paragraph(vendedor_text, self.styles['ContractNormal']))
        story.append(Spacer(1, 15))
        
        # Dados do comprador
        story.append(Paragraph("COMPRADOR:", self.styles['ContractSubtitle']))
        comprador_text = f"""
        Nome: {data.get('nomeComprador', '')}<br/>
        NIF: {data.get('nifComprador', '')}<br/>
        Morada: {data.get('moradaComprador', '')}<br/>
        Telefone: {data.get('telefoneComprador', '')}<br/>
        Email: {data.get('emailComprador', '')}
        """
        story.append(Paragraph(comprador_text, self.styles['ContractNormal']))
        story.append(Spacer(1, 15))
        
        # Dados do veículo
        story.append(Paragraph("DADOS DO VEÍCULO:", self.styles['ContractSubtitle']))
        veiculo_text = f"""
        Marca: {data.get('marca', '')}<br/>
        Modelo: {data.get('modelo', '')}<br/>
        Matrícula: {data.get('matricula', '')}<br/>
        Ano: {data.get('ano', '')}<br/>
        Cor: {data.get('cor', '')}<br/>
        Quilometragem: {data.get('quilometragem', '')} km<br/>
        Número do Chassi: {data.get('numeroChassi', '')}<br/>
        Combustível: {data.get('combustivel', '')}
        """
        story.append(Paragraph(veiculo_text, self.styles['ContractNormal']))
        story.append(Spacer(1, 15))
        
        # Informações financeiras
        story.append(Paragraph("INFORMAÇÕES FINANCEIRAS:", self.styles['ContractSubtitle']))
        financeiro_text = f"""
        Preço de Venda: {self.format_currency(data.get('precoVenda', '0'))}<br/>
        Sinal Pago: {self.format_currency(data.get('sinalPago', '0'))}<br/>
        Valor Restante: {self.format_currency(data.get('valorRestante', '0'))}<br/>
        Número de Prestações: {data.get('numeroPrestacoes', '')}<br/>
        Valor da Prestação: {self.format_currency(data.get('valorPrestacao', '0'))}<br/>
        Data de Início dos Pagamentos: {self.format_date(data.get('dataInicioPagamentos', ''))}
        """
        story.append(Paragraph(financeiro_text, self.styles['ContractNormal']))
        story.append(Spacer(1, 20))
        
        # Cláusulas do contrato
        story.append(Paragraph("CLÁUSULAS DO CONTRATO:", self.styles['ContractSubtitle']))
        
        clausulas = [
            "1. O vendedor declara ser o legítimo proprietário do veículo descrito neste contrato.",
            "2. O veículo é vendido no estado em que se encontra, tendo o comprador examinado o mesmo.",
            "3. O comprador compromete-se a efetuar o pagamento nas condições acordadas.",
            "4. A transferência de propriedade será efetuada após o pagamento integral do valor acordado.",
            "5. Qualquer alteração a este contrato deverá ser feita por escrito e assinada por ambas as partes.",
            "6. Este contrato é regido pela legislação portuguesa."
        ]
        
        for clausula in clausulas:
            story.append(Paragraph(clausula, self.styles['ContractNormal']))
            story.append(Spacer(1, 6))
        
        story.append(Spacer(1, 30))
        
        # Observações
        if data.get('observacoes'):
            story.append(Paragraph("OBSERVAÇÕES:", self.styles['ContractSubtitle']))
            story.append(Paragraph(data.get('observacoes', ''), self.styles['ContractNormal']))
            story.append(Spacer(1, 20))
        
        # Data e local
        data_local = f"Data: {datetime.now().strftime('%d/%m/%Y')}, Local: ________________"
        story.append(Paragraph(data_local, self.styles['ContractCenter']))
        story.append(Spacer(1, 40))
        
        # Assinaturas
        story.append(Paragraph("_" * 30 + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + "_" * 30, self.styles['ContractSignature']))
        story.append(Paragraph("Vendedor&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Comprador", self.styles['ContractSignature']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer

    def format_currency(self, value):
        try:
            if isinstance(value, str):
                # Remove caracteres não numéricos exceto vírgula e ponto
                clean_value = ''.join(c for c in value if c.isdigit() or c in '.,')
                if ',' in clean_value:
                    clean_value = clean_value.replace(',', '.')
                value = float(clean_value) if clean_value else 0
            elif not isinstance(value, (int, float)):
                value = 0
            
            return f"{value:,.2f} €".replace(',', ' ').replace('.', ',').replace(' ', '.')
        except:
            return "0,00 €"

    def format_date(self, date_string):
        if not date_string:
            return ""
        try:
            # Assume formato dd/mm/yyyy
            return date_string
        except:
            return date_string

from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Ler dados do corpo da requisição
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({'error': 'Dados não fornecidos'})
                self.wfile.write(error_response.encode('utf-8'))
                return
            
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            generator = ContractPDFGenerator()
            pdf_buffer = generator.generate_contract_pdf(data)
            
            # Enviar resposta
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', 'attachment; filename=contrato_veiculo.pdf')
            self.end_headers()
            
            # Enviar PDF
            self.wfile.write(pdf_buffer.getvalue())
            
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({'error': 'JSON inválido'})
            self.wfile.write(error_response.encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({'error': f'Erro ao gerar PDF: {str(e)}'})
            self.wfile.write(error_response.encode('utf-8'))
    
    def do_GET(self):
        self.send_response(405)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        error_response = json.dumps({'error': 'Método não permitido'})
        self.wfile.write(error_response.encode('utf-8'))