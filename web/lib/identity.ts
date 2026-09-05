// A small, fixed palette so remote cursors and presence avatars stay
// legible against the ink background (each is AA-contrast on --ink-900).
const PALETTE = [
  "#E8A33D", // accent amber (assigned last to avoid colliding with Run button meaning)
  "#4FD1A5", // mint
  "#6FA8FF", // periwinkle
  "#E8637A", // rose
  "#B98CE8", // lavender
  "#5FC9D1", // teal
  "#F2C14E", // gold
  "#8FD16F", // leaf
];

export function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

const ADJECTIVES = ["Swift", "Quiet", "Bold", "Lucid", "Amber", "Northern", "Curious", "Steady"];
const NOUNS = ["Falcon", "Cursor", "Otter", "Comet", "Lynx", "Ember", "Harbor", "Willow"];

export function randomGuestName(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a} ${n}`;
}
