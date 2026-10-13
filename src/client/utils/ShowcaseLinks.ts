// Addresses of the fork's showcase site (screens and changes of this UI)
const SHOWCASE_URL = 'https://tm.baiz.org/showcase-gallery';
// What changed in this UI – the start page "Updates" button leads here, not to the original's wiki changelog
export const FEATURE_LOG_URL = `${SHOWCASE_URL}/feature-log`;
// Same data as the feature log page (curated points + commits per day), read by the start page's update column.
// Built and uploaded with the showcase site; the game only reads it and works without it.
export const FEATURE_LOG_DATA_URL = `${SHOWCASE_URL}/feature-log.json`;
