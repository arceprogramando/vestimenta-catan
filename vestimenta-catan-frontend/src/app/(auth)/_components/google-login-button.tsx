'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useState } from 'react';

interface GoogleLoginButtonProps {
  onError?: (error: string) => void;
}

export function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      onError?.('No se recibio credencial de Google');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithGoogle(response.credential);
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesion con Google';
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    onError?.('Error al iniciar sesion con Google');
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width={320}
        locale="es"
      />
    </div>
  );
}
