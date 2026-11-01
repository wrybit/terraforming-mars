import {validationDetails, ValidationErrors} from '@/common/game/validateNewGameConfig';

/**
 * Problems the fork form shows inline next to their setting rather than in the validation box under Create game.
 *
 * modularMAInDevelopment: the note under "Official Random α" already says it.
 */
export const INLINE_VALIDATION_PROBLEMS: ReadonlySet<keyof ValidationErrors> = new Set(['modularMAInDevelopment']);

/*
 * Returns true when this value represents the warning being engaged.
 *
 * For booleans that's 'true', for numbers that's non-zero, for strings and arrays that's non-empty.
 */
export function isProblemSet(value: ValidationErrors[keyof ValidationErrors]): boolean {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

/** Keys of the problems that are engaged and belong in the validation box. */
export function boxProblemKeys(errors: ValidationErrors): Array<keyof ValidationErrors> {
  return (Object.keys(validationDetails) as Array<keyof ValidationErrors>)
    .filter((key) => !INLINE_VALIDATION_PROBLEMS.has(key) && isProblemSet(errors[key]));
}

/** Whether any engaged problem blocks creating the game (inline ones included). */
export function hasBlockingProblem(errors: ValidationErrors): boolean {
  return (Object.keys(validationDetails) as Array<keyof ValidationErrors>)
    .some((key) => validationDetails[key].blocking && isProblemSet(errors[key]));
}
