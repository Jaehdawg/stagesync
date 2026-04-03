export const adminCopy = {
  platformControl: 'Platform control',
  dashboardTitle: 'StageSync Admin',
  dashboardDescription: 'Manage bands, users, and system analytics from one place.',
  login: {
    title: 'Admin login',
    description: 'Use your admin username and password to access system controls.',
    pageTitle: 'StageSync Admin Login',
    pageDescription: 'Admins sign in here with a username and password to manage bands, users, and analytics.',
    submitLabel: 'Sign in',
    successMessage: 'Admin login successful.',
    switchTitle: 'Switch to an admin account',
    switchMessage: 'You\'re currently signed in as a singer. Use an admin username and password to access the admin dashboard.',
  },
  logoutLabel: 'Log out',
  cards: {
    bands: { title: 'Manage bands', description: 'CRUD bands and members.' },
    users: { title: 'User management', description: 'CRUD singers, band members, and admins.' },
    analytics: { title: 'System analytics', description: 'Track usage, queue volume, and show health.' },
    bandProfiles: { title: 'Band profiles', description: 'Modify public band profile records.' },
  },
} as const
