// Mock authV2Service for testing
const authV2Service = {
  login: jest.fn(async (email, password) => {
    return {
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      uid: 'mock-uid',
      email,
      displayName: null,
      photoURL: null,
    };
  }),
  
  register: jest.fn(async (email, password, displayName) => {
    return {
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      uid: 'mock-new-uid',
      email,
      displayName: displayName || null,
      photoURL: null,
    };
  }),
  
  refreshToken: jest.fn(async (refreshToken) => {
    return {
      idToken: 'mock-refreshed-id-token',
      refreshToken: 'mock-new-refresh-token',
      expiresIn: 3600,
    };
  }),
  
  forgotPassword: jest.fn(async (email) => {
    return {
      success: true,
      message: 'Email reset password telah dikirim',
    };
  }),
  
  resetPassword: jest.fn(async (oobCode, newPassword) => {
    return {
      success: true,
      message: 'Password berhasil direset',
    };
  }),
  
  logout: jest.fn(async () => {
    return {
      success: true,
      message: 'Logout berhasil',
    };
  }),
  
  updateProfile: jest.fn(async (updates) => {
    return {
      uid: 'mock-uid',
      displayName: updates.displayName || null,
      photoURL: updates.photoURL || null,
    };
  }),
  
  deleteAccount: jest.fn(async (password) => {
    return {
      success: true,
      message: 'Akun berhasil dihapus',
    };
  }),
};

export default authV2Service;
