import { NextRequest, NextResponse } from 'next/server'
import { createSignedDownloadUrl } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { bucketName, filePath } = await request.json()

    if (!bucketName || !filePath) {
      return NextResponse.json(
        { error: 'bucketName e filePath são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('[Download API] Gerando URL para:', { bucketName, filePath })

    const { signedUrl, error } = await createSignedDownloadUrl(bucketName, filePath)

    if (error) {
      console.error('[Download API] Erro ao gerar URL:', error)
      return NextResponse.json(
        { error: 'Erro ao gerar URL de download', details: error instanceof Error ? error.message : 'Erro desconhecido' },
        { status: 500 }
      )
    }

    return NextResponse.json({ signedUrl })
  } catch (error) {
    console.error('[Download API] Exceção:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}