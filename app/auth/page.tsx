import { Metadata } from 'next';
import AuthPage from '../../components/auth/AuthPage';

export const metadata: Metadata = {
  title: 'Masuk atau Daftar - PetaTalenta',
  description: 'Masuk ke akun PetaTalenta Anda atau daftar untuk memulai assessment kepribadian dan bakat berbasis AI.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <AuthPage />;
}
