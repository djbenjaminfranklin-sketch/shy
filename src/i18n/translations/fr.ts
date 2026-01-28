export const fr = {
  // Common
  common: {
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    next: 'Suivant',
    back: 'Retour',
    skip: 'Passer',
    done: 'Terminé',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    yes: 'Oui',
    no: 'Non',
    ok: 'OK',
  },

  // Welcome screen
  welcome: {
    tagline: 'La rencontre, simplement.',
    createAccount: 'Créer un compte',
    login: 'Se connecter',
    footerText: 'En continuant, tu acceptes nos conditions.',
    terms: 'CGU',
    privacy: 'Confidentialité',
    features: {
      verified: 'Profils vérifiés',
      nearby: 'Près de chez toi',
      connections: 'Connexions réelles',
    },
  },

  // Auth
  auth: {
    email: 'Email',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    loginButton: 'Se connecter',
    registerButton: "S'inscrire",
    noAccount: "Pas encore de compte ?",
    hasAccount: 'Déjà un compte ?',
    ageVerification: 'Je confirme avoir 18 ans ou plus',
    invalidEmail: 'Email invalide',
    passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
  },

  // Profile
  profile: {
    title: 'Mon profil',
    editProfile: 'Modifier mon profil',
    verification: 'Vérification',
    subscription: 'Abonnement',
    settings: 'Paramètres',
    privacy: 'Confidentialité',
    help: 'Aide',
    logout: 'Se déconnecter',
    deleteAccount: 'Supprimer mon compte',
    stats: {
      sent: 'Envoyées',
      received: 'Reçues',
      connections: 'Connexions',
    },
    logoutConfirm: {
      title: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
    },
    deleteConfirm: {
      title: 'Supprimer mon compte',
      message: 'Cette action est irréversible. Toutes vos données, photos, conversations et connexions seront définitivement supprimées.',
      finalTitle: 'Confirmation finale',
      finalMessage: 'Êtes-vous vraiment sûr(e) ? Votre compte sera supprimé dans les 30 jours.',
      keepAccount: 'Non, garder mon compte',
      confirmDelete: 'Oui, supprimer définitivement',
      successTitle: 'Compte supprimé',
      successMessage: 'Votre demande de suppression a été enregistrée. Votre compte sera supprimé sous 30 jours.',
    },
  },

  // Discover
  discover: {
    title: 'Découvrir',
    favorites: 'Coups de Coeur',
    nearby: 'Près de moi',
    noMoreProfiles: 'Plus de profils pour le moment',
    comeBackLater: 'Reviens plus tard !',
    km: 'km',
  },

  // Invitations
  invitations: {
    title: 'Invitations',
    received: 'Reçues',
    sent: 'Envoyées',
    pending: 'En attente',
    accepted: 'Acceptée',
    expired: 'Expirée',
    noInvitations: 'Aucune invitation',
    accept: 'Accepter',
    decline: 'Refuser',
    expiresIn: 'Expire dans',
    days: 'jours',
  },

  // Messages
  messages: {
    title: 'Messages',
    noMessages: 'Aucun message',
    startConversation: 'Commencez à discuter avec vos connexions',
    typeMessage: 'Écrire un message...',
    send: 'Envoyer',
  },

  // Direct Messaging (Femme → Homme, Non-binaire → Non-binaire)
  directMessage: {
    sendMessage: 'Envoyer un message',
    startConversation: 'Démarrer une conversation',
    privilegeWomen: 'Vous pouvez envoyer un message directement aux hommes qui vous intéressent.',
    privilegeNonBinary: 'Vous pouvez envoyer un message directement aux personnes non-binaires.',
    needInvitation: 'Envoyez une invitation pour démarrer une conversation.',
    messageSent: 'Message envoyé !',
    connectionCreated: 'Conversation démarrée',
  },

  // Intentions
  intentions: {
    social: 'Social / discuter',
    dating: 'Dating',
    amical: 'Amical',
    local: 'Découvrir localement',
  },

  // Availability
  availability: {
    today: "Disponible aujourd'hui",
    afternoon: 'Cet après-midi',
    tonight: 'Ce soir',
    weekend: 'Ce week-end',
  },

  // Errors
  errors: {
    networkError: 'Erreur de connexion',
    serverError: 'Erreur serveur',
    tryAgain: 'Réessayer',
    somethingWrong: "Une erreur s'est produite",
  },

  // Notifications
  notifications: {
    newInvitation: 'Nouvelle invitation',
    invitationAccepted: 'Invitation acceptée',
    newMessage: 'Nouveau message',
    nearbyUser: 'Quelqu\'un près de toi',
  },
};

export type TranslationKeys = typeof fr;
