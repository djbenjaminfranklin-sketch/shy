import { TranslationKeys } from './fr';

export const en: TranslationKeys = {
  // Common
  common: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    done: 'Done',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
  },

  // Welcome screen
  welcome: {
    tagline: 'Dating, simplified.',
    createAccount: 'Create an account',
    login: 'Log in',
    footerText: 'By continuing, you agree to our terms.',
    terms: 'Terms',
    privacy: 'Privacy',
    features: {
      verified: 'Verified profiles',
      nearby: 'Near you',
      connections: 'Real connections',
    },
  },

  // Auth
  auth: {
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    forgotPassword: 'Forgot password?',
    loginButton: 'Log in',
    registerButton: 'Sign up',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    ageVerification: 'I confirm I am 18 years or older',
    invalidEmail: 'Invalid email',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordMismatch: 'Passwords do not match',
  },

  // Profile
  profile: {
    title: 'My profile',
    editProfile: 'Edit my profile',
    verification: 'Verification',
    subscription: 'Subscription',
    settings: 'Settings',
    privacy: 'Privacy',
    help: 'Help',
    logout: 'Log out',
    deleteAccount: 'Delete my account',
    stats: {
      sent: 'Sent',
      received: 'Received',
      connections: 'Connections',
    },
    logoutConfirm: {
      title: 'Log out',
      message: 'Are you sure you want to log out?',
    },
    deleteConfirm: {
      title: 'Delete my account',
      message: 'This action is irreversible. All your data, photos, conversations and connections will be permanently deleted.',
      finalTitle: 'Final confirmation',
      finalMessage: 'Are you absolutely sure? Your account will be deleted within 30 days.',
      keepAccount: 'No, keep my account',
      confirmDelete: 'Yes, delete permanently',
      successTitle: 'Account deleted',
      successMessage: 'Your deletion request has been registered. Your account will be deleted within 30 days.',
    },
  },

  // Discover
  discover: {
    title: 'Discover',
    favorites: 'Favorites',
    nearby: 'Near me',
    noMoreProfiles: 'No more profiles for now',
    comeBackLater: 'Come back later!',
    km: 'km',
  },

  // Invitations
  invitations: {
    title: 'Invitations',
    received: 'Received',
    sent: 'Sent',
    pending: 'Pending',
    accepted: 'Accepted',
    expired: 'Expired',
    noInvitations: 'No invitations',
    accept: 'Accept',
    decline: 'Decline',
    expiresIn: 'Expires in',
    days: 'days',
  },

  // Messages
  messages: {
    title: 'Messages',
    noMessages: 'No messages',
    startConversation: 'Start chatting with your connections',
    typeMessage: 'Type a message...',
    send: 'Send',
  },

  // Direct Messaging (Women → Men, Non-binary → Non-binary)
  directMessage: {
    sendMessage: 'Send a message',
    startConversation: 'Start a conversation',
    privilegeWomen: 'You can send a message directly to men you\'re interested in.',
    privilegeNonBinary: 'You can send a message directly to non-binary people.',
    needInvitation: 'Send an invitation to start a conversation.',
    messageSent: 'Message sent!',
    connectionCreated: 'Conversation started',
  },

  // Intentions
  intentions: {
    social: 'Social / chat',
    dating: 'Dating',
    amical: 'Friendly',
    local: 'Discover locally',
  },

  // Availability
  availability: {
    today: 'Available today',
    afternoon: 'This afternoon',
    tonight: 'Tonight',
    weekend: 'This weekend',
  },

  // Errors
  errors: {
    networkError: 'Connection error',
    serverError: 'Server error',
    tryAgain: 'Try again',
    somethingWrong: 'Something went wrong',
  },

  // Notifications
  notifications: {
    newInvitation: 'New invitation',
    invitationAccepted: 'Invitation accepted',
    newMessage: 'New message',
    nearbyUser: 'Someone near you',
  },
};
