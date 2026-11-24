# TWLVS Rule v1: Score Generation Spec

Nov 24, 2026 · @Keith Wells

This is the exact rule every TWLVS quarter score is computed by, from the 13 Dec 2026 launch. The game runner, the public verifier and the website's "Check it yourself" button must all follow it byte for byte and reproduce the test vectors below.

## Constants

These values are fixed for rule v1; changing any of them requires a new rule version announced in advance.

| Name | Value |
| --- | --- |
| Rule version string | `twlvs-rule-v1` |
| League Time | UTC−8, fixed (no daylight saving). League Time date D starts at 08:00 UTC on calendar day D |
| Slots | 288 a day; slot n (1–288) starts (n−1) × 300 s after 00:00 League Time |
| Quarters | 4 per game, 60 s each; quarter q (1–4) ends q × 60 s after the slot start |
| ANU endpoint | `https://api.quantumnumbers.anu.edu.au?length=288&type=hex16&size=10` (header `x-api-key`) |
| ANU value | 20 bytes, received as 40 lowercase hex characters |
| drand chain | quicknet, League of Entropy mainnet |
| Chain hash | `52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971` |
| Scheme | `bls-unchained-g1-rfc9380` |
| Period | 3 s |
| Genesis time | 1692803367 (Unix seconds, 23 Aug 2023 15:09:27 UTC) |
| Public key | `83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a` |
| Hash function | SHA-256 |
| Sides | `home`, `away` |

## ANU values

Each League Time date gets exactly one ANU batch of 288 values, and the value in position n belongs to slot n.

1. About 7 days before date D, the fetcher makes one request to the ANU endpoint above. A successful response holds `data`, an array of 288 strings of 40 hex characters.
2. `data[n−1]` is the ANU value for slot n on date D, so it belongs to game `1-YYYYMMDD-nnn`. Every slot gets a value even if it has no game, as on Championship Day.
3. The first successful batch for a date is final. A failed request may be retried; a successful one is never replaced.
4. For each slot, the commitment is SHA-256 of the value's **20 raw bytes** (decode the hex first), written as 64 lowercase hex characters.
5. All 288 commitments are published straight away (see Published files). Each value is published when its game ends.

Picking among batches gives TWLVS no control, because no batch reveals anything about the drand rounds that haven't happened yet.

## drand round for each quarter

Each quarter uses the first quicknet round published strictly after the quarter ends.

```latex
T_q = T_{D} + (n - 1) \times 300 + q \times 60
```

```latex
R_q = \left\lfloor \frac{T_q - 1692803367}{3} \right\rfloor + 2
```

- T\_D is 00:00 League Time on date D, in Unix seconds (08:00 UTC on calendar day D). n is the slot, q the quarter (1–4). All times are whole Unix seconds.
- Round R is published at 1692803367 + (R − 1) × 3, which is always later than T\_q, by 3 seconds when T\_q falls on a round boundary.
- Both sides of a quarter use the same round.
- The value taken from the round is its `randomness` field: 32 bytes, 64 hex characters, equal to SHA-256 of the round's signature. Fetch it from any drand relay, e.g. `https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971/public/<R>`.

## Score calculation

A quarter score is the top two bits of one SHA-256 hash over a fixed text message.

1. Build the message as UTF-8 text, fields joined by `|`, with no spaces and all hex in lowercase:

```
twlvs-rule-v1|<game ID>|<side>|<quarter>|<ANU value hex>|<drand randomness hex>
```

Example: `twlvs-rule-v1|1-20261213-001|home|1|4617…da21|<64 hex>`

2. Compute H = SHA-256 of the message's bytes.
3. The score is the first byte of H shifted right by 6: values 0, 1, 2 or 3, each with probability exactly 1/4.
4. A side's game score is the sum of its four quarter scores (0–12). Win 2, tie 1, loss 0.

Knockout games on Championship Day that end tied go to overtime; the overtime format is not part of rule v1 and will be added in a later version before 12 Dec 2027.

## Published files

One commitment file per League Time date goes into a public GitHub repo as soon as its batch is fetched; the repo's commit time is the public proof of when.

Path: `commitments/YYYY/YYYY-MM-DD.json` (the League Time date). Keys in this order, 288 entries in slot order, UTF-8, no trailing spaces:

```json
{
  "rule": "twlvs-rule-v1",
  "league_date": "2026-12-13",
  "source": "anu-quantum-numbers",
  "fetched_at_utc": "2026-12-06T08:05:12Z",
  "commitments": [
    { "slot": 1, "game_id": "1-20261213-001", "anu_sha256": "<64 hex>" },
    { "slot": 2, "game_id": "1-20261213-002", "anu_sha256": "<64 hex>" }
  ]
}
```

The file is never edited after it is committed. A correction would be a new, separate file and would itself be logged.

**Reveal.** When a game ends, its ANU value (40 hex) is published on the game's Verify result page and through the website's read API. After the League Time date ends, a matching `reveals/YYYY/YYYY-MM-DD.json` with the same layout, plus an `anu_value` field per slot, is committed to the same repo.

## How to verify a game

Anyone can confirm a finished game's score with public data only, in seven steps.

1. Read the game ID and get D (the date) and n (the slot) from it.
2. Open `commitments/YYYY/YYYY-MM-DD.json` and check its commit time is before the game started (normally about 7 days before).
3. Take the game's ANU value from its Verify result page and check that SHA-256 of its 20 raw bytes equals the slot's `anu_sha256`.
4. For each quarter, compute T\_q and R\_q as above and fetch round R\_q from quicknet.
5. Check the round's BLS signature against the quicknet public key, and that `randomness` = SHA-256(signature).
6. Build the 8 messages (2 sides × 4 quarters), hash them and read the top 2 bits.
7. Sum each side's quarters and compare with the published final score.

Steps 2 and 5 are what make the check independent of TWLVS: the commitment existed before the game, and the drand round is signed by the League of Entropy, not TWLVS.

## Void conditions and chain cutover

A late input never voids a game; only an input that can never be produced or matched does.

A game is void when any of these holds permanently:

- its ANU value is lost from every copy, or the value held does not match the published commitment;
- no commitment file was published for its date before the game started;
- a quarter's drand round is never produced, or never passes signature verification.

What a void means:

- **Regular season:** "No result" for the whole game, even if some quarters were revealed. No win, loss, tie, goals or game played for either team; no replay.
- **Knockouts:** the higher seed advances.
- **Never:** a redraw, a local random generator, or a switch of source after the fact.

**Chain cutover.** If the League of Entropy announces quicknet's retirement, TWLVS publishes rule v2 naming the successor chain and a cutover League Time date, at least 7 days ahead, ideally at a season start. Games never mix chains.

## Test vectors

Every implementation must reproduce these exactly: game 1-20261122-001 ends **8–5** and game 1-20261122-288 ends **7–9**.

They use real quicknet rounds and two of the three ANU values from the 24 Nov API test. Those values are public, so they are test data only and must never be used for a real game. For both games T\_D = 1795334400 (22 Nov 2026, 00:00 League Time = 08:00 UTC).

Full message for game 001, home, quarter 1:

```
twlvs-rule-v1|1-20261122-001|home|1|4617093f1e7d86d18bac15d1342c9f4af875da21|aec224cda8170d4d703c304d6beefc239a132736efe1cc6bd4d5949fdf50b62d
```

SHA-256 = `60e4fa5058ea36236abbcd5ceae10659aedccd19102b34c339cd5cabbf625f94`. First byte 0x60 = 0110 0000, top two bits 01, so the score is 1.

**Game 1-20261122-001**

ANU value `4617093f1e7d86d18bac15d1342c9f4af875da21`, commitment `edde1d7aba9bf746a32fd8802bc0946ccf4a0ef3a14ca1e20f1a97ae3460d2b6`.

| Q | Quarter end (UTC) | Round | drand randomness | Home hash (first 8) | Home | Away hash (first 8) | Away |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2026-11-22 08:01:00 | 34177033 | `aec224cda8170d4d703c304d6beefc239a132736efe1cc6bd4d5949fdf50b62d` | `60e4fa50` | 1 | `b4463abe` | 2 |
| 2 | 2026-11-22 08:02:00 | 34177053 | `2d1058aa9e46f831f082270befcf8ce44da1e72bdd30be5fe9a27d4593c1a73e` | `5b77df99` | 1 | `33452c9a` | 0 |
| 3 | 2026-11-22 08:03:00 | 34177073 | `629745a8a6ae384539110184978ffde81bc7d80b9973824a03e6ac38ad5ac9ac` | `c74ad770` | 3 | `93f3c9c6` | 2 |
| 4 | 2026-11-22 08:04:00 | 34177093 | `a9014412c329a6061dfb5e4417a42899e99a654586b458c23c16979f585a7f0a` | `f3bd99d9` | 3 | `789c6f1a` | 1 |
|  |  |  |  | Total | **8** | Total | **5** |

**Game 1-20261122-288**

ANU value `d3f8b6d32380bf51b5d95539777d7fd2e7524a6a`, commitment `3f66f50258bb1b6c6266a227e9b5965cda1b93760e6c14f01dfc8f63907a92da`.

| Q | Quarter end (UTC) | Round | drand randomness | Home hash (first 8) | Home | Away hash (first 8) | Away |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2026-11-23 07:56:00 | 34205733 | `e37bfabaf7f0d2b1b9378df809835623ec05e30d8d175f551adf7a063120c417` | `f5b17a0a` | 3 | `f2f05956` | 3 |
| 2 | 2026-11-23 07:57:00 | 34205753 | `f34c96be7af10742e74f6a3e54c49e6d31752a28340afb9516af894ea5c0bcf4` | `4b44ac32` | 1 | `da3e6117` | 3 |
| 3 | 2026-11-23 07:58:00 | 34205773 | `2bc99341db9a76e5638b8d4c8b3b3ae529871c52755c615c2ad5cf2eb25c5b29` | `31d80fde` | 0 | `fb51c04f` | 3 |
| 4 | 2026-11-23 07:59:00 | 34205793 | `5698f24ee48642af1a52f7ede62fab596e302696fdadd5407fe5cc1bcbc479f7` | `fa01ead6` | 3 | `20653f4f` | 0 |
|  |  |  |  | Total | **7** | Total | **9** |

Slot 288 shows the date rule: the game is on League Time date 22 Nov but its quarters end at about 07:56–07:59 UTC on 23 Nov. Each drand randomness above was checked against SHA-256 of its round's signature; BLS signature checks belong in the verifier's own test suite.

## Reference code

These two implementations both reproduce the test vectors above (checked 24 Nov 2026). They cover scoring only; fetching from ANU and drand and checking drand's BLS signature are separate.

Python 3:

```python
import hashlib
from datetime import datetime, timezone

RULE = "twlvs-rule-v1"
GENESIS = 1692803367   # quicknet genesis, Unix seconds
PERIOD = 3             # quicknet period, seconds

def slot_start(game_id: str) -> int:
    _, ymd, slot = game_id.split("-")
    d = datetime(int(ymd[:4]), int(ymd[4:6]), int(ymd[6:]), 8, 0, tzinfo=timezone.utc)
    return int(d.timestamp()) + (int(slot) - 1) * 300

def quarter_round(game_id: str, q: int) -> int:
    t = slot_start(game_id) + q * 60
    return (t - GENESIS) // PERIOD + 2

def anu_commitment(anu_hex: str) -> str:
    return hashlib.sha256(bytes.fromhex(anu_hex)).hexdigest()

def quarter_score(game_id, side, q, anu_hex, drand_randomness_hex) -> int:
    msg = f"{RULE}|{game_id}|{side}|{q}|{anu_hex.lower()}|{drand_randomness_hex.lower()}"
    return hashlib.sha256(msg.encode("utf-8")).digest()[0] >> 6
```

JavaScript (browsers and Node 18+), for the "Check it yourself" button and the open-source verifier:

```javascript
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
```

## Sources

- [quicknet chain info](https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971/info): public key, period, genesis time and scheme, read 24 Nov 2026
- [drand HTTP API](https://docs.drand.love/dev-guide/API%20Documentation%20v2/drand-http-api): round endpoints and the quicknet chain hash
- ANU Quantum Numbers API: endpoint, x-api-key header, hex16 block size limit of 10 and length 288 in one call, tested from Keith's Mac on 24 Nov 2026
- [TWLVS Score Generation Plan](https://claude.ai/artifact/DMdsXavRiKpEwthsWm4Tkm) and [TWLVS Decision Log](https://claude.ai/artifact/9nkLnqenUZ8YqZSSj7Vuq9): the decisions this rule implements
