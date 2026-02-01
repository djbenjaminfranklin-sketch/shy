/**
 * Lifestyle options for profile
 */

export const DRINKING_OPTIONS = [
  { id: 'never', label: 'Jamais', icon: 'water-outline' },
  { id: 'socially', label: 'Socialement', icon: 'wine-outline' },
  { id: 'regularly', label: 'Regulierement', icon: 'beer-outline' },
] as const;

export type DrinkingId = typeof DRINKING_OPTIONS[number]['id'];

export const SMOKING_OPTIONS = [
  { id: 'never', label: 'Non-fumeur', icon: 'close-circle-outline' },
  { id: 'sometimes', label: 'Occasionnel', icon: 'remove-circle-outline' },
  { id: 'regularly', label: 'Fumeur', icon: 'checkmark-circle-outline' },
] as const;

export type SmokingId = typeof SMOKING_OPTIONS[number]['id'];

export const CHILDREN_OPTIONS = [
  { id: 'has', label: "J'ai des enfants", icon: 'people-outline' },
  { id: 'wants', label: "J'en veux", icon: 'heart-outline' },
  { id: 'doesnt_want', label: "Je n'en veux pas", icon: 'close-outline' },
  { id: 'not_sure', label: 'Pas encore sur(e)', icon: 'help-outline' },
] as const;

export type ChildrenId = typeof CHILDREN_OPTIONS[number]['id'];

export const HEIGHT_RANGE = {
  min: 140,
  max: 220,
  default: 170,
} as const;

/**
 * Profile prompts - users choose 3 to answer
 */
export const PROFILE_PROMPTS = [
  { id: 'perfect_date', label: 'Mon premier date parfait...' },
  { id: 'non_negotiable', label: 'Un non-negociable pour moi...' },
  { id: 'get_along', label: 'On va bien s\'entendre si...' },
  { id: 'excited_about', label: 'Je m\'emballe trop facilement pour...' },
  { id: 'superpower', label: 'Mon super-pouvoir dans la vie...' },
  { id: 'after_work', label: 'Apres le travail, tu me trouveras...' },
  { id: 'wont_judge', label: 'Je ne te jugerai pas si...' },
  { id: 'favorite_quality', label: 'Ma qualite preferee chez quelqu\'un...' },
  { id: 'great_plus_one', label: 'Je suis un super +1 parce que...' },
  { id: 'perfect_sunday', label: 'Mon dimanche parfait...' },
  { id: 'grateful_for', label: 'Je suis reconnaissant(e) pour...' },
  { id: 'hidden_talent', label: 'Mon talent cache...' },
  { id: 'dream_guest', label: 'Mon invite de reve pour un diner...' },
  { id: 'way_to_heart', label: 'Le chemin vers mon coeur passe par...' },
  { id: 'relationship_great', label: 'Ce qui rend une relation geniale...' },
  { id: 'looking_for', label: 'Ce que je recherche vraiment...' },
  { id: 'deal_breaker', label: 'Ce qui me ferait fuir...' },
  { id: 'make_laugh', label: 'Ce qui me fait toujours rire...' },
] as const;

export type PromptId = typeof PROFILE_PROMPTS[number]['id'];

export interface ProfilePromptAnswer {
  promptId: PromptId;
  answer: string;
}
