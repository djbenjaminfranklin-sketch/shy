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
    continue: 'Continue',
    later: 'Later',
    close: 'Close',
    search: 'Search',
    refresh: 'Refresh',
    retry: 'Retry',
    send: 'Send',
    years: 'years',
    km: 'km',
  },

  // Tabs
  tabs: {
    home: 'Home',
    explore: 'Explore',
    likes: 'Likes',
    messages: 'Messages',
    profile: 'Profile',
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
    loginTitle: 'Login',
    loginSubtitle: 'Welcome back!',
    registerTitle: 'Create an account',
    registerSubtitle: 'Join the SHY community',
    fillAllFields: 'Please fill in all fields',
    incorrectCredentials: 'Incorrect email or password',
    acceptTerms: 'You must accept the terms to continue',
    acceptTermsLabel: 'I accept the',
    and: 'and the',
    privacyPolicy: 'privacy policy',
    errorOccurred: 'An error occurred. Please try again.',
    min8Chars: 'Minimum 8 characters',
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
    completeProfile: 'Complete my profile',
    user: 'User',
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
    adminPanel: 'Admin Panel',
  },

  // Edit profile
  editProfile: {
    title: 'Edit profile',
    photos: 'Photos',
    nameLabel: 'First name or nickname',
    namePlaceholder: 'How would you like to be called?',
    aboutLabel: 'About you',
    aboutPlaceholder: 'Tell us about yourself...',
    intentionLabel: 'Your intention',
    availabilityLabel: 'Availability',
    notSpecified: 'Not specified',
    permissionRequired: 'Permission required',
    photoPermissionMessage: 'Please allow access to your photos in settings.',
    errorSelectPhoto: 'Unable to select photo. Please try again.',
  },

  // Settings
  settings: {
    title: 'Settings',
    languageSection: 'Language / Langue',
    locationSection: 'Location',
    enableLocation: 'Enable location',
    locationDescription: 'Allows you to see and be seen by people nearby',
    locationHint: 'Only an approximate distance is shared, never your exact address.',
    searchPreferences: 'Search Preferences',
    maxDistance: 'Maximum distance',
    ageRange: 'Age range',
    minAge: 'Minimum age',
    maxAge: 'Maximum age',
    lookingFor: "I'm looking for",
    lookingForHint: 'Leave empty to see everyone',
    savePreferences: 'Save preferences',
    saving: 'Saving...',
    preferencesSaved: 'Your preferences have been saved',
    notifications: 'Notifications',
    newInvitations: 'New invitations',
    newInvitationsDesc: 'Receive a notification when you get a new invitation',
    messagesNotif: 'Messages',
    messagesNotifDesc: 'Receive a notification for new messages',
    soundVibration: 'Sound and vibration',
    soundVibrationDesc: 'Enable sound and vibration for notifications',
    accountSection: 'Account',
    accountHint: 'To change your email or password, use the "Forgot password" feature on the login screen.',
  },

  // Subscription
  subscription: {
    title: 'Subscription',
    mySubscription: 'My subscription',
    activeSubscription: 'Active subscription',
    expiresOn: 'Expires on',
    yourBenefits: 'Your benefits',
    restorePurchases: 'Restore purchases',
    manageHint: 'Manage your subscription in App Store or Google Play settings',
    firstMonthFree: 'FIRST MONTH FREE',
    includedFeatures: 'Included features',
    chooseDuration: 'Choose your duration',
    comingSoon: 'Coming soon',
    comingSoonMessage: 'Subscriptions will be available very soon!',
    welcomePremium: 'Welcome to SHY Premium!',
    tryFree: 'Try for FREE',
    subscribe: 'Subscribe',
    termsApple: 'Payment will be charged to your iTunes Account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your App Store account settings after purchase.',
    termsOfService: 'Terms of Service',
    privacyPolicyLink: 'Privacy Policy',
    appleEULA: 'Apple EULA',
    best: 'BEST',
    popular: 'POPULAR',
    month: 'month',
  },

  // Duration labels
  duration: {
    week: 'Week',
    month: 'Month',
    threeMonths: '3 months',
    sixMonths: '6 months',
    year: 'Year',
  },

  // Discover
  discover: {
    title: 'Discover',
    favorites: 'Favorites',
    nearby: 'Near me',
    noMoreProfiles: 'No more profiles',
    comeBackLater: 'Come back later to discover new people',
    km: 'km',
    at: 'at',
    active: 'Active',
    agoMinutes: '{0} min ago',
    agoHours: '{0}h ago',
    boostTitle: 'Boost',
    boostDescription: 'Boost makes your profile more visible for 30 minutes. You appear first in searches.',
    activateBoost: 'Activate Boost',
    invitationRequired: 'Invitation required',
    invitationRequiredMessage: 'Send an invitation first by swiping right',
    locationDisabled: 'Location disabled',
    // Availability modes
    activateMode: 'Mode',
    modeActivated: 'Mode activated',
    modeActivatedMessage: 'You will only see profiles in the same mode.',
    deactivateMode: 'Deactivate mode',
    deactivateModeConfirm: 'Are you sure you want to deactivate the mode?',
    noProfilesInMode: 'No profiles in this mode',
    noProfilesInModeHint: 'No one has activated this mode yet. Come back later!',
  },

  // Availability Modes
  availabilityModes: {
    activateTitle: 'Activate a mode',
    description: 'Activate a mode to only see profiles in the same mindset as you.',
    activationsThisWeek: 'Activations this week',
    unlimited: 'Unlimited',
    chooseMode: 'Choose a mode',
    duration: 'Duration',
    activateButton: 'Activate mode',
    limitReached: 'Limit reached',
    limitReachedMessage: 'Upgrade to Premium for unlimited activations',
    seeOffers: 'See offers',
    premium: 'Premium',
    modeActive: 'Mode active',
    // Mode names
    relaxed: 'Relaxed',
    spontaneous: 'Spontaneous',
    explorer: 'Explorer',
    // Mode badges
    relaxedBadge: 'Available today',
    spontaneousBadge: 'Available now',
    explorerBadge: 'Open this week',
    // Mode descriptions
    relaxedDescription: 'Take your time to chat calmly',
    spontaneousDescription: 'Ready to meet people quickly',
    explorerDescription: 'Curious to discover new people',
    // Durations
    duration24h: '24 hours',
    duration72h: '72 hours',
  },

  // Explore
  explore: {
    title: 'Explore',
    map: 'Map',
    grid: 'Grid',
    onlineNow: 'Online now',
    nearbySection: 'Nearby',
    noOneNearby: 'No one nearby',
    enableLocationHint: 'Enable your location to discover profiles around you.',
    locationDisabled: 'Location disabled',
  },

  // Invitations
  invitations: {
    title: 'Invitations',
    received: 'Received',
    sent: 'Sent',
    pending: 'Pending',
    accepted: 'Accepted',
    expired: 'Expired',
    noInvitations: 'No invitations yet',
    noInvitationsHint: 'People interested in your profile will appear here. Keep exploring!',
    accept: 'Accept',
    decline: 'Decline',
    expiresIn: 'Expires in',
    days: 'days',
    refuseTitle: 'Decline this invitation?',
    refuseMessage: 'Are you sure you want to decline the invitation from {0}?',
    exploreProfiles: 'Explore profiles',
    justNow: 'Just now',
    minutesAgo: '{0} min ago',
    hoursAgo: '{0}h ago',
    yesterday: 'Yesterday',
    daysAgo: '{0} days ago',
    weeksAgo: '{0} weeks ago',
  },

  // Connections / Matches
  connections: {
    title: 'My Connections',
    noConnections: 'No connections yet',
    noConnectionsHint: "When someone accepts your invitation, you'll be able to chat here!",
    discoverProfiles: 'Discover profiles',
    startChatting: 'Start chatting!',
  },

  // Messages
  messages: {
    title: 'Messages',
    noMessages: 'No messages',
    startConversation: 'Start chatting with your connections',
    typeMessage: 'Type a message...',
    send: 'Send',
    conversationNotFound: 'Conversation not found',
    startConversationHint: 'Start the conversation',
    sendFirstMessage: 'Send a first message to get to know each other',
  },

  // Direct Messaging
  directMessage: {
    sendMessage: 'Send a message',
    startConversation: 'Start a conversation',
    privilegeWomen: "You can send a message directly to men you're interested in.",
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

  // Onboarding
  onboarding: {
    // Profile photo
    addPhoto: 'Add a photo',
    photoHelps: 'A profile photo helps others recognize you',
    addPhotoButton: 'Add a photo',
    gallery: 'Gallery',
    camera: 'Camera',
    photoPermission: 'Permission required',
    photoPermissionMessage: 'Please allow access to your photos in settings.',
    cameraPermission: 'Please allow access to the camera in settings.',
    photoError: 'Unable to select photo. Please try again.',
    cameraError: 'Unable to take photo. Please try again.',

    // Face verification
    verifyIdentity: 'Verify your identity',
    protectYourself: 'Protect yourself and others from fake profiles',
    yourProfilePhoto: 'Your profile photo',
    howItWorks: 'How does it work?',
    step1Title: 'Look at the camera',
    step1Desc: 'Position your face in the frame',
    step2Title: 'Follow the instructions',
    step2Desc: 'Turn your head left, then right',
    step3Title: 'Automatic verification',
    step3Desc: 'We verify that it is you in the photo',
    startVerification: 'Start verification',
    photoRequired: 'Photo required',
    photoRequiredMessage: 'You must first add a profile photo.',
    verificationFailed: 'Verification failed',
    verificationFailedMessage: 'The detected face does not match your profile photo. Please try again.',
    retry: 'Retry',
    skipVerification: 'Skip verification?',
    skipVerificationMessage: 'Your profile will not be verified and may have less visibility.',
    ignore: 'Skip',
    profileVerified: 'Profile verified!',
    verificationConfirmed: 'Your identity has been confirmed. You will have a verification badge on your profile.',
    verificationBadge: 'Verification badge',
    benefit1: 'Other users will know you are authentic',
    benefit2: 'More chances to get matches',
    benefit3: 'Priority in search results',

    // Basic info
    tellUsAboutYou: 'Tell us about yourself',
    infoVisibleOnProfile: 'This information will be visible on your profile',
    nameLabel: 'First name or nickname *',
    namePlaceholder: 'How would you like to be called?',
    birthDateLabel: 'Date of birth *',
    birthDatePlaceholder: 'DD/MM/YYYY',
    must18: 'You must be 18 or older',
    genderLabel: 'Gender *',
    hairColorLabel: 'Hair color',

    // Intention
    intentionTitle: 'What is your intention?',
    intentionSubtitle: 'This helps others understand what you are looking for',

    // Interests
    interestsTitle: 'Your interests',
    interestsSubtitle: 'Select up to 10 interests ({0}/10)',

    // Location
    enableLocationTitle: 'Enable location',
    enableLocationDesc: 'To show you people nearby, SHY needs access to your location.',
    approxLocation: 'Approximate location',
    approxLocationDesc: 'Only an approximate distance is shared, never your exact address.',
    fullControl: 'Full control',
    fullControlDesc: 'You can hide your location at any time from settings.',
    disabledByDefault: 'Disabled by default',
    disabledByDefaultDesc: 'Even if you grant access, it remains disabled until you enable it.',
    authorizeLocation: 'Authorize location',
    maybeLater: 'Maybe later',
    gettingLocation: 'Getting location...',
    creatingProfile: 'Creating profile...',
    profileCreationError: 'An error occurred while creating your profile. Please try again.',
  },

  // Errors
  errors: {
    networkError: 'Connection error',
    serverError: 'Server error',
    tryAgain: 'Try again',
    somethingWrong: 'Something went wrong',
    unableToLoad: 'Unable to load',
    unableToLoadInvitations: 'Unable to load invitations',
    unableToAccept: 'Unable to accept invitation',
    unableToRefuse: 'Unable to decline invitation',
  },

  // Notifications
  notifications: {
    newInvitation: 'New invitation',
    invitationAccepted: 'Invitation accepted',
    newMessage: 'New message',
    nearbyUser: 'Someone near you',
  },

  // Alerts
  alerts: {
    errorTitle: 'Error',
    successTitle: 'Success',
    confirmTitle: 'Confirmation',
  },

  // Legal
  legal: {
    disclaimer: 'This application is a social platform for connecting consenting adults. It does not offer or facilitate any paid sexual services.',
  },

  // Moderation
  moderation: {
    blockUser: 'Block',
    reportUser: 'Report',
    block: 'Block',
    blockConfirmation: 'Are you sure you want to block {name}? This person will no longer be able to contact you and your conversation will be deleted.',
    userBlocked: 'User blocked',
    userBlockedMessage: 'This person can no longer contact you.',
    reportReason: 'Why are you reporting this profile?',
    reportSent: 'Report sent',
    reportSentMessage: 'Thank you for your report. Our team will review this profile.',
    thisUser: 'this user',
  },

  // Time ago helpers
  time: {
    justNow: 'Just now',
    minutesAgo: '{0} min',
    hoursAgo: '{0}h',
    daysAgo: '{0}d',
    weeksAgo: '{0}w',
  },

  // Connection Rhythm
  connectionRhythm: {
    title: 'Connection rhythm',
    loading: 'Loading...',
    pendingTitle: 'Connection rhythm',
    pendingSubtitle: '{count} more messages to calculate your score',
    howItWorks: 'How does it work?',
    explanation: 'This score reflects the quality of your exchanges: response time, common active hours, message length and regularity.',
    // Labels
    perfectHarmony: 'Perfect harmony',
    greatConnection: 'Great connection',
    goodCompatibility: 'Good compatibility',
    building: 'Building',
    developing: 'Developing',
    // Descriptions
    perfectHarmonyDesc: 'You\'re on the same wavelength',
    greatConnectionDesc: 'Your communication is flowing',
    goodCompatibilityDesc: 'You\'re getting to know each other',
    buildingDesc: 'Your rhythm is adjusting',
    developingDesc: 'Keep exchanging',
    // Trends
    trendUp: 'Your connection is improving',
    trendDown: 'Exchange more regularly',
    trendStable: 'Your rhythm is steady',
  },

  // Comfort Level
  comfortLevel: {
    title: 'Comfort level',
    explanation: 'This system lets you progress at your own pace. Features unlock only when you\'re both ready.',
    mutual: 'Mutual level',
    otherReady: 'Ready to move to the next level',
    otherUserAt: '{name} is ready to go further',
    mutualLevel: 'You\'re at the same comfort level',
    selectLevel: 'Choose your level',
    safetyTitle: 'Your comfort, your choice',
    safetyText: 'You can change your level at any time. Nothing is permanent and you stay in control.',
    resetLevel: 'Return to initial level',
    resetTitle: 'Reset level',
    resetMessage: 'Do you want to return to Chatting level? The other person will be notified.',
    updateError: 'Unable to update level',
    // Levels
    chatting: 'Chatting',
    chattingDesc: 'Getting to know each other calmly',
    flirting: 'Connection',
    flirtingDesc: 'Ready to deepen the relationship',
    openToMeet: 'Meeting',
    openToMeetDesc: 'Open to meeting in person',
  },

  // Quick Meet (Coffee Break)
  quickMeet: {
    title: 'Coffee Break',
    button: 'Suggest a break',
    viewProposal: 'View proposal',
    proposalSent: 'Proposal sent',
    // Create
    createTitle: 'Suggest a break',
    createSubtitle: 'A short and casual moment in a public place to get to know each other',
    duration: 'Duration',
    timeSlots: 'Available slots',
    placeType: 'Type of place',
    addMessage: 'Add a message (optional)',
    messagePlaceholder: 'E.g.: It would be nice to meet for a coffee!',
    sendProposal: 'Send proposal',
    selectSlotError: 'Select at least one time slot',
    proposalSentTitle: 'Proposal sent!',
    proposalSentMessage: 'You will be notified of the response.',
    // Receive
    receivedTitle: '{name} suggests a break',
    receivedSubtitle: 'A short moment to meet',
    theirMessage: 'Their message',
    selectTime: 'Choose a time slot',
    selectPlace: 'Choose a place',
    selectResponseError: 'Select a time slot and a place',
    accept: 'Accept',
    decline: 'Decline',
    acceptedTitle: 'Meeting confirmed!',
    acceptedMessage: 'You have a meeting with {name}. Chat to finalize the details.',
    declineTitle: 'Decline the proposal',
    declineMessage: 'Why would you like to decline?',
    declineNotReady: 'Not ready yet',
    declinePreferChat: 'I prefer to keep chatting',
    // Waiting
    waitingTitle: 'Waiting for response',
    waitingText: '{name} has not responded yet. You will be notified of their decision.',
    cancelProposal: 'Cancel my proposal',
    cancelTitle: 'Cancel the proposal?',
    cancelMessage: 'Are you sure you want to cancel this proposal?',
    // Safety
    safetyInfo: 'Always choose a public place. Let someone know about your meeting.',
    safetyTip: 'Meet in a busy public place. Your safety is important.',
  },

  // Engagement Score
  engagementScore: {
    title: 'Engagement score',
    boostActive: '+{multiplier}% visibility',
    responsiveness: 'Responsiveness',
    conversation: 'Conversations',
    meetings: 'Meetings',
    activity: 'Activity',
    notEnoughData: 'Keep using the app to see your detailed score.',
    explanation: 'This score reflects your engagement on the app. The more active you are and respond to messages, the more visible your profile will be.',
    // Levels
    veryActive: 'Very active',
    active: 'Active',
    moderate: 'Moderate',
    casual: 'Casual',
    new: 'New',
  },
};
