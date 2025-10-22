import { useMemo } from 'react';

/**
 * PasswordStrengthIndicator Component
 * 
 * Komponen untuk menampilkan validasi password secara real-time dengan visual feedback
 * Menampilkan checklist untuk setiap kriteria password yang harus dipenuhi
 */
interface PasswordStrengthIndicatorProps {
  password?: string;
}

const PasswordStrengthIndicator = ({ password = '' }: PasswordStrengthIndicatorProps) => {
  // Kriteria validasi password sesuai backend requirements
  const criteria = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    // Check for allowed special characters: @$!%*#?&
    const hasAllowedSpecialChar = /[@$!%*#?&]/.test(password);

    return [
      {
        id: 'minLength',
        label: 'Minimal 8 karakter',
        met: hasMinLength,
        required: true
      },
      {
        id: 'hasLetter',
        label: 'Mengandung minimal satu huruf',
        met: hasLetter,
        required: true
      },
      {
        id: 'hasNumber',
        label: 'Mengandung minimal satu angka',
        met: hasNumber,
        required: true
      },
      {
        id: 'hasSpecialChar',
        label: 'Mengandung karakter spesial (@$!%*#?&)',
        met: hasAllowedSpecialChar,
        required: false // Optional untuk keamanan ekstra
      }
    ];
  }, [password]);

  // Hitung persentase kekuatan password
  const strength = useMemo(() => {
    // Hitung only required criteria untuk base strength
    const requiredCriteria = criteria.filter(c => c.required);
    const requiredMet = requiredCriteria.filter(c => c.met).length;
    const requiredTotal = requiredCriteria.length;
    
    // Hitung semua criteria termasuk optional
    const allMet = criteria.filter(c => c.met).length;
    const allTotal = criteria.length;
    
    // Base percentage dari required criteria
    const basePercentage = (requiredMet / requiredTotal) * 100;
    
    // Bonus 20% jika ada special character (optional criteria met)
    const hasOptionalMet = criteria.some(c => !c.required && c.met);
    const bonusPercentage = hasOptionalMet ? 20 : 0;
    
    // Total percentage (max 100%)
    const percentage = Math.min(basePercentage + bonusPercentage, 100);
    
    let level = 'weak';
    let color = 'bg-red-500';
    let textColor = 'text-red-600';
    
    if (percentage >= 100) {
      level = 'strong';
      color = 'bg-green-500';
      textColor = 'text-green-600';
    } else if (percentage >= 80) {
      level = 'medium';
      color = 'bg-yellow-500';
      textColor = 'text-yellow-600';
    }
    
    return { percentage, level, color, textColor, metCount: allMet, totalCount: allTotal };
  }, [criteria]);

  // Jangan tampilkan jika password kosong
  if (!password) {
    return (
      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600 mb-2 font-medium">Syarat Password:</p>
        <ul className="space-y-1.5">
          {criteria.map((criterion) => (
            <li key={criterion.id} className="flex items-center text-xs text-gray-500">
              <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
              </svg>
              <span>
                {criterion.label}
                {!criterion.required && <span className="text-gray-400 ml-1">(Opsional)</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Progress bar kekuatan password */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-gray-700">Kekuatan Password</span>
          <span className={`text-xs font-semibold ${strength.textColor} capitalize`}>
            {strength.level === 'weak' && 'Lemah'}
            {strength.level === 'medium' && 'Sedang'}
            {strength.level === 'strong' && 'Kuat'}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${strength.color} transition-all duration-300 ease-out`}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {strength.metCount} dari {strength.totalCount} kriteria terpenuhi
        </p>
      </div>

      {/* Checklist kriteria password */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600 mb-2 font-medium">Detail Validasi:</p>
        <ul className="space-y-1.5">
          {criteria.map((criterion) => (
            <li 
              key={criterion.id} 
              className={`flex items-center text-xs transition-colors duration-200 ${
                criterion.met ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {criterion.met ? (
                // Checklist hijau untuk kriteria yang terpenuhi
                <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                // Circle abu-abu untuk kriteria yang belum terpenuhi
                <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                </svg>
              )}
              <span className={criterion.met ? 'font-medium' : ''}>
                {criterion.label}
                {!criterion.required && (
                  <span className={criterion.met ? 'text-green-500 ml-1' : 'text-gray-400 ml-1'}>(Opsional)</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pesan tambahan */}
      {strength.level === 'strong' && (
        <div className="flex items-start p-2 bg-green-50 border border-green-200 rounded-lg">
          <svg className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-green-700">Password Anda sudah kuat dan aman!</p>
        </div>
      )}
      
      {strength.level === 'weak' && password.length > 0 && (
        <div className="flex items-start p-2 bg-red-50 border border-red-200 rounded-lg">
          <svg className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-red-700">Password masih lemah. Penuhi lebih banyak kriteria untuk keamanan yang lebih baik.</p>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;