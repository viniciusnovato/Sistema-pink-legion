'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from './Button'

interface CarCarouselProps {
  photos: string[] // Array de URLs de fotos
  altText?: string
}

export function CarCarousel({ photos, altText = 'Foto do veículo' }: CarCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (photos.length === 0) {
    return null
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? photos.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === photos.length - 1 ? 0 : prevIndex + 1
    )
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <>
      {/* Carrossel Normal */}
      <div className="relative w-full">
        {/* Imagem Principal */}
        <div 
          className="relative w-full h-[400px] rounded-lg overflow-hidden bg-surface-light dark:bg-surface-dark cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        >
          <Image
            src={photos[currentIndex]}
            alt={`${altText} ${currentIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            priority
          />
          
          {/* Contador de Fotos */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>

        {/* Botões de Navegação */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200 dark:border-gray-700"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200 dark:border-gray-700"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Miniaturas */}
        {photos.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-primary-600 dark:border-primary-400 scale-105'
                    : 'border-border-light dark:border-border-dark hover:border-primary-400 dark:hover:border-primary-600'
                }`}
              >
                <Image
                  src={photo}
                  alt={`Miniatura ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Fullscreen */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Botão Fechar */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200 dark:border-gray-700"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Contador de Fotos */}
          <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 text-text-primary-light dark:text-text-primary-dark px-4 py-2 rounded-full font-medium">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Imagem Fullscreen */}
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto">
            <Image
              src={photos[currentIndex]}
              alt={`${altText} ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Botões de Navegação Fullscreen */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all hover:scale-110 border border-gray-200 dark:border-gray-700"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all hover:scale-110 border border-gray-200 dark:border-gray-700"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Miniaturas Fullscreen */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-2">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-primary-400 scale-110'
                      : 'border-white/50 hover:border-white'
                  }`}
                >
                  <Image
                    src={photo}
                    alt={`Miniatura ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

