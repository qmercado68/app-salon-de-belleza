'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center border border-gray-100">
        <div className="flex justify-center mb-6 text-red-500">
          <AlertCircle size={64} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Error de Autenticación
        </h1>
        <p className="text-gray-600 mb-8">
          El enlace de inicio de sesión es inválido o ha expirado. Por favor, solicita uno nuevo.
        </p>
        
        <Link href="/" passHref legacyBehavior>
          <Button 
            variant="primary" 
            fullWidth 
            icon={<ArrowLeft size={18} />}
          >
            Volver al Inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}
