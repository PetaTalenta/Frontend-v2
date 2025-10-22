import { Metadata } from 'next';
import ResetPassword from '../../components/auth/ResetPassword';

export const metadata: Metadata = {
  title: 'Reset Password - FutureGuide',
  description: 'Buat password baru untuk akun FutureGuide Anda.',
  robots: {
    index: false, // Prevent indexing of password reset pages
    follow: false,
  },
};

export default function Page() {
  return <ResetPassword />;
}
