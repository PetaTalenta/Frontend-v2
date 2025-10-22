import { Metadata } from 'next';
import ForgotPassword from '../../components/auth/ForgotPassword';
import { useRouter } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Lupa Password - FutureGuide',
  description: 'Reset password akun FutureGuide Anda. Masukkan email untuk menerima link reset password.',
  robots: {
    index: false, // Prevent indexing of password reset pages
    follow: false,
  },
};

export default function Page() {
  const router = useRouter();
  
  const handleBack = () => {
    router.push('/auth');
  };

  return <ForgotPassword onBack={handleBack} />;
}
