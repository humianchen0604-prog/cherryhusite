/**
 * Hand-off between the About sticker board and the envelope: the board's
 * "My design philosophy" hint sets this attribute and fires this event on
 * window once it has finished writing itself in, and the envelope holds its
 * resting letter bob until then, so the two play one after the other.
 */
export const HINT_WRITTEN_ATTR = 'data-written';
export const HINT_WRITTEN_EVENT = 'about:hint-written';
