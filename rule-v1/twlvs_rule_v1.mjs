// TWLVS rule v1 reference implementation for browsers and Node 18+ (Web Crypto).
export const RULE = "twlvs-rule-v1", GENESIS = 1692803367, PERIOD = 3;
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const bytes = (h) => Uint8Array.from(h.match(/../g), (x) => parseInt(x, 16));
export function slotStart(gameId) {
  const [, ymd, slot] = gameId.split("-");
  return Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6), 8) / 1000 + (+slot - 1) * 300;
}
export const quarterRound = (gameId, q) => Math.floor((slotStart(gameId) + q * 60 - GENESIS) / PERIOD) + 2;
export const anuCommitment = async (anuHex) => hex(await crypto.subtle.digest("SHA-256", bytes(anuHex)));
export async function quarterScore(gameId, side, q, anuHex, drandRandomnessHex) {
  const msg = `${RULE}|${gameId}|${side}|${q}|${anuHex.toLowerCase()}|${drandRandomnessHex.toLowerCase()}`;
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg)));
  return h[0] >> 6;
}
