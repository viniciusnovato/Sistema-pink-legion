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
        
        # Estilo para subtítulos
        self.styles.add(ParagraphStyle(
            name='ConfissaoSubtitle',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=12,
            spaceBefore=12,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para texto normal
        self.styles.add(ParagraphStyle(
            name='ConfissaoNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            spaceBefore=6,
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        ))
        
        # Estilo para texto centralizado
        self.styles.add(ParagraphStyle(
            name='ConfissaoCenter',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            spaceBefore=6,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))
        
        # Estilo para assinaturas
        self.styles.add(ParagraphStyle(
            name='ConfissaoSignature',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=30,
            spaceBefore=30,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))

    def generate_confissao_pdf(self, data):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
        
        story = []
        
        # Título
        story.append(Paragraph("CONFISSÃO DE DÍVIDA", self.styles['ConfissaoTitle']))
        story.append(Spacer(1, 20))
        
        # Dados do devedor
        story.append(Paragraph("DEVEDOR:", self.styles['ConfissaoSubtitle']))
        devedor_text = f"""
        Nome: {data.get('nomeDevedor', '')}<br/>
        NIF: {data.get('nifDevedor', '')}<br/>
        Morada: {data.get('moradaDevedor', '')}<br/>
        Telefone: {data.get('telefoneDevedor', '')}<br/>
        Email: {data.get('emailDevedor', '')}
        """
        story.append(Paragraph(devedor_text, self.styles['ConfissaoNormal']))
        story.append(Spacer(1, 15))
        
        # Dados do credor
        story.append(Paragraph("CREDOR:", self.styles['ConfissaoSubtitle']))
        credor_text = f"""
        Nome: {data.get('nomeCredor', '')}<br/>
        NIF: {data.get('nifCredor', '')}<br/>
        Morada: {data.get('moradaCredor', '')}<br/>
        Telefone: {data.get('telefoneCredor', '')}<br/>
        Email: {data.get('emailCredor', '')}
        """
        story.append(Paragraph(credor_text, self.styles['ConfissaoNormal']))
        story.append(Spacer(1, 15))
        
        # Informações da dívida
        story.append(Paragraph("INFORMAÇÕES DA DÍVIDA:", self.styles['ConfissaoSubtitle']))
        divida_text = f"""
        Valor Total da Dívida: {self.format_currency(data.get('valorTotalDivida', '0'))}<br/>
        Valor Já Pago: {self.format_currency(data.get('valorJaPago', '0'))}<br/>
        Valor em Dívida: {self.format_currency(data.get('valorEmDivida', '0'))}<br/>
        Número de Prestações: {data.get('numeroPrestacoes', '')}<br/>
        Valor da Prestação: {self.format_currency(data.get('valorPrestacao', '0'))}<br/>
        Data de Início dos Pagamentos: {self.format_date(data.get('dataInicioPagamentos', ''))}
        """
        story.append(Paragraph(divida_text, self.styles['ConfissaoNormal']))
        story.append(Spacer(1, 20))
        
        # Texto da confissão
        story.append(Paragraph("CONFISSÃO:", self.styles['ConfissaoSubtitle']))
        
        confissao_texto = f"""
        Eu, {data.get('nomeDevedor', '')}, portador do NIF {data.get('nifDevedor', '')}, 
        confesso dever ao Sr.(a) {data.get('nomeCredor', '')}, portador do NIF {data.get('nifCredor', '')}, 
        a quantia de {self.format_currency(data.get('valorEmDivida', '0'))}.
        """
        story.append(Paragraph(confissao_texto, self.styles['ConfissaoNormal']))
        story.append(Spacer(1, 15))
        
        # Condições de pagamento
        if data.get('numeroPrestacoes') and int(data.get('numeroPrestacoes', 0)) > 1:
            pagamento_texto = f"""
            Comprometo-me a liquidar esta dívida em {data.get('numeroPrestacoes', '')} prestações 
            de {self.format_currency(data.get('valorPrestacao', '0'))} cada, com início em 
            {self.format_date(data.get('dataInicioPagamentos', ''))}.
            """
        else:
            pagamento_texto = f"""
            Comprometo-me a liquidar esta dívida até {self.format_date(data.get('dataInicioPagamentos', ''))}.
            """
        
        story.append(Paragraph(pagamento_texto, self.styles['ConfissaoNormal']))
        story.append(Spacer(1, 20))
        
        # Observações
        if data.get('observacoes'):
            story.append(Paragraph("OBSERVAÇÕES:", self.styles['ConfissaoSubtitle']))
            story.append(Paragraph(data.get('observacoes', ''), self.styles['ConfissaoNormal']))
            story.append(Spacer(1, 20))
        
        # Data e local
        data_local = f"Data: {datetime.now().strftime('%d/%m/%Y')}, Local: ________________"
        story.append(Paragraph(data_local, self.styles['ConfissaoCenter']))
        story.append(Spacer(1, 40))
        
        # Assinaturas
        story.append(Paragraph("_" * 30 + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + "_" * 30, self.styles['ConfissaoSignature']))
        story.append(Paragraph("Devedor&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Credor", self.styles['ConfissaoSignature']))
        
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
            
            generator = ConfissaoDividaPDFGenerator()
            pdf_buffer = generator.generate_confissao_pdf(data)
            
            return Response(
                pdf_buffer.getvalue(),
                mimetype='application/pdf',
                headers={
                    'Content-Disposition': 'attachment; filename=confissao_divida.pdf',
                    'Content-Type': 'application/pdf'
                }
            )
        except Exception as e:
            return jsonify({'error': f'Erro ao gerar PDF: {str(e)}'}), 500
    else:
        return jsonify({'error': 'Método não permitido'}), 405