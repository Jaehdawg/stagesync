export const singerRegistrationFormCopy = {
  titles: {
    signup: 'Singer Sign-up',
    login: 'Singer Login',
    requestSignup: 'Request Sign-up',
    requestLogin: 'Request Login',
  },
  descriptions: {
    signup: 'Create your singer account with a password so you can join the queue right away.',
    login: 'Welcome back!',
    requestSignup: 'Create your request account with a password so you can jump into the queue.',
    requestLogin: 'Welcome back! Sign in to keep making requests.',
  },
  labels: {
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    password: 'Password',
  },
  placeholders: {
    firstName: 'Maya',
    lastName: 'Chen',
    email: 'maya@example.com',
    signupPassword: 'At least 8 characters with a number',
    loginPassword: 'Your password',
  },
  helperText: {
    signup: 'Use at least 8 characters with a letter and a number.',
    login: 'Enter the password for your singer account.',
  },
  buttons: {
    paused: 'Signups paused',
    signingIn: 'Signing in...',
    signup: 'Sign-up',
    login: 'Login',
    requestSignup: 'Request sign-up',
    requestLogin: 'Request login',
  },
  errors: {
    invalidEmail: 'Enter a valid email address.',
    missingNames: 'First name and last name are required.',
    weakPassword: 'Password must be at least 8 characters and include a letter and a number.',
    signupFailed: 'Unable to create your singer account.',
  },
  messages: {
    signupSuccess: 'You\'re signed up and signed in to StageSync.',
    loginSuccess: 'Welcome back! You\'re signed in to StageSync.',
  },
} as const
