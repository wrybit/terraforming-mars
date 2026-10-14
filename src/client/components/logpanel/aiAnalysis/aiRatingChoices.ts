import {AiFeedbackRating} from '@/common/ai/AiFeedback';

// The three ratings with their labels (English keys): the same in the hover bar and in the dialog
export const AI_RATING_CHOICES: ReadonlyArray<{rating: AiFeedbackRating, label: string, barOrder: number}> = [
  {rating: 'flag', label: 'Check', barOrder: 3},
  {rating: 'up', label: 'Good', barOrder: 1},
  {rating: 'down', label: 'Bad', barOrder: 2},
];
