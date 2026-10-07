import {reactive} from 'vue';

// While a milestone or award is being chosen, the log box shows the milestones & awards tab
// (just like trading shows the Colonies board and delegating the Turmoil board).
// A counter instead of a flag: during a remount the new choice may mount before the old one unmounts.
export const milestonesAwardsFocusState = reactive({
  requests: 0,
});

// Returns the function that releases the focus again; the log box then returns to its previous view
export function focusMilestonesAwards(): () => void {
  milestonesAwardsFocusState.requests++;
  let released = false;
  return () => {
    if (!released) {
      released = true;
      milestonesAwardsFocusState.requests--;
    }
  };
}
