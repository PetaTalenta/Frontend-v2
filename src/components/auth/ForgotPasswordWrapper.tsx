'use client';

import { useRouter } from 'next/navigation';
import ForgotPassword from './ForgotPassword';

export default function ForgotPasswordWrapper() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/auth');
  };

  return <ForgotPassword onBack={handleBack} />;
}
