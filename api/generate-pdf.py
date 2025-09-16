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

def handler(request):
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Dados não fornecidos'}), 400
            
            generator = ContractPDFGenerator()
            pdf_buffer = generator.generate_contract_pdf(data)
            
            return Response(
                pdf_buffer.getvalue(),
                mimetype='application/pdf',
                headers={
                    'Content-Disposition': 'attachment; filename=contrato_veiculo.pdf',
                    'Content-Type': 'application/pdf'
                }
            )
        except Exception as e:
            return jsonify({'error': f'Erro ao gerar PDF: {str(e)}'}), 500
    else:
        return jsonify({'error': 'Método não permitido'}), 405