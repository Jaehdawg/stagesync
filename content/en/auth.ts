export const authCopy = {
  bandLogin: {
    title: 'Band login',
    description: 'Use your band username and password to access show controls.',
    submitLabel: 'Sign in',
    successMessage: 'Band login successful.',
    pageTitle: 'StageSync Band Login',
    pageDescription: 'Band members sign in here with a username and password to manage the show, queue, and profile settings.',
    switchMessage: 'You\'re currently signed in as a singer. Use a band email to get the band dashboard.',
    switchTitle: 'Switch to a band account',
  },
  adminLogin: {
    title: 'Admin login',
    description: 'Use your admin username and password to access system controls.',
    submitLabel: 'Sign in',
    successMessage: 'Admin login successful.',
    pageTitle: 'StageSync Admin Login',
    pageDescription: 'Admins sign in here with a username and password to manage bands, users, and analytics.',
    switchMessage: 'You\'re currently signed in as a singer. Use an admin username and password to access the admin dashboard.',
    switchTitle: 'Switch to an admin account',
  },
  logoutLabel: 'Log out',
  platformControl: 'Platform control',
  bandPortal: 'Band portal',
  adminPortal: 'Platform control',
  adminDashboardTitle: 'StageSync Admin',
  adminDashboardDescription: 'Manage bands, users, and system analytics from one place.',
  adminDashboardLinks: {
    bands: {
      title: 'Manage bands',
      description: 'CRUD bands and members.',
    },
    users: {
      title: 'User management',
      description: 'CRUD singers, band members, and admins.',
    },
    analytics: {
      title: 'System analytics',
      description: 'Track usage, queue volume, and show health.',
    },
    bandProfiles: {
      title: 'Band profiles',
      description: 'Modify public band profile records.',
    },
  },
} as const
