import { Metadata } from 'next';
import AuthPage from '../../components/auth/AuthPage';

export const metadata: Metadata = {
  title: 'Masuk atau Daftar - FutureGuide',
  description: 'Masuk ke akun FutureGuide Anda atau daftar untuk memulai assessment kepribadian dan bakat berbasis AI.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <AuthPage />;
}
