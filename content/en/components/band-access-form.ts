export const bandAccessFormCopy = {
  usernameLabel: 'Username',
  passwordLabel: 'Password',
  usernamePlaceholder: (role: 'band' | 'admin') => `${role} username`,
  passwordPlaceholder: '••••••••',
  signingIn: 'Signing in...',
  signInError: 'Unable to sign in.',
} as const
