'use client';

import ForgotPassword from '../../components/auth/ForgotPassword';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  
  const handleBack = () => {
    router.push('/auth');
  };

  return <ForgotPassword onBack={handleBack} />;
}
