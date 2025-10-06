'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
}) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md transition-all duration-300"
        onClick={handleOverlayClick}
      />
      
      {/* Modal */}
      <div
        className={`
          relative w-full mx-4 
          bg-gradient-to-br from-bg-light-surface via-white to-bg-light-surface/95 
          dark:from-bg-dark-surface dark:via-bg-dark-surface/90 dark:to-bg-dark-surface/95
          rounded-2xl shadow-2xl border border-border-light/30 dark:border-border-dark/30
          backdrop-blur-sm transform transition-all duration-300 ease-out
          animate-in zoom-in-95 slide-in-from-bottom-4
          hover:shadow-3xl
          ${sizeClasses[size]}
          ${className}
        `}
      >
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-gold-400/5 via-transparent to-rose-gold-500/5 pointer-events-none" />
        
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="relative flex items-center justify-between p-6 border-b border-border-light/20 dark:border-border-dark/20 bg-gradient-to-r from-transparent via-rose-gold-50/10 to-transparent dark:via-rose-gold-900/5">
            {title && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-text-light-primary to-text-light-primary/80 dark:from-text-dark-primary dark:to-text-dark-primary/80 bg-clip-text text-transparent">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-gradient-to-r hover:from-rose-gold-50 hover:to-rose-gold-100 dark:hover:from-rose-gold-900/20 dark:hover:to-rose-gold-800/20 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="relative p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`mb-6 pb-4 border-b border-border-light/20 dark:border-border-dark/20 ${className}`}>
      {children}
    </div>
  );
};

const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={`mb-6 space-y-4 ${className}`}>
      {children}
    </div>
  );
};

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex justify-end space-x-3 pt-6 mt-6 border-t border-border-light/20 dark:border-border-dark/20 bg-gradient-to-r from-transparent via-rose-gold-50/5 to-transparent dark:via-rose-gold-900/5 ${className}`}>
      {children}
    </div>
  );
};

export { Modal, ModalHeader, ModalBody, ModalFooter };