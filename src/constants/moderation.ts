export const REPORT_REASONS = {
  fake_profile: {
    id: 'fake_profile',
    label: 'Faux profil',
    description: 'Le profil semble être faux ou usurpé',
    icon: 'alert-circle-outline',
  },
  harassment: {
    id: 'harassment',
    label: 'Harcèlement',
    description: 'Comportement harcelant ou intimidant',
    icon: 'warning-outline',
  },
  inappropriate_content: {
    id: 'inappropriate_content',
    label: 'Contenu inapproprié',
    description: 'Photos ou textes inappropriés',
    icon: 'eye-off-outline',
  },
  spam: {
    id: 'spam',
    label: 'Spam',
    description: 'Messages publicitaires ou répétitifs',
    icon: 'megaphone-outline',
  },
  underage: {
    id: 'underage',
    label: 'Mineur suspecté',
    description: 'La personne semble avoir moins de 18 ans',
    icon: 'person-remove-outline',
  },
  solicitation: {
    id: 'solicitation',
    label: 'Sollicitation',
    description: 'Proposition de services rémunérés',
    icon: 'cash-outline',
  },
  other: {
    id: 'other',
    label: 'Autre',
    description: 'Autre raison',
    icon: 'ellipsis-horizontal-outline',
  },
} as const;

export type ReportReasonId = keyof typeof REPORT_REASONS;
export type ReportReason = typeof REPORT_REASONS[ReportReasonId];

export const REPORT_REASON_LIST = Object.values(REPORT_REASONS);
