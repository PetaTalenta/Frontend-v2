import { Metadata } from 'next';
import ForgotPasswordWrapper from '../../components/auth/ForgotPasswordWrapper';

export const metadata: Metadata = {
  title: 'Lupa Password - FutureGuide',
  description: 'Reset password akun FutureGuide Anda. Masukkan email untuk menerima link reset password.',
  robots: {
    index: false, // Prevent indexing of password reset pages
    follow: false,
  },
};

export default function Page() {
  return <ForgotPasswordWrapper />;
}
