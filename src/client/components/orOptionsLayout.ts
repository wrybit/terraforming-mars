// Contract between WaitingFor (provider) and OrOptions (consumer):
// The top-level OrOptions in the action area is shown as a tab bar instead of a radio list.
// OrOptions passes false on again for nested selections, so only the top level gets tabs.
export const OR_OPTIONS_AS_TABS = 'orOptionsAsTabs';
