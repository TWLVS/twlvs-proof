# TWLVS proof

Public record for every TWLVS game result. Results are set by the clock, not our servers: anyone can check any finished game's score from the files here and public drand data.

## What's here

| Path | What it is |
|---|---|
| `docs/rule-v1.md` | Rule v1, the exact rule every quarter score is computed by |
| `rule-v1/` | Reference code (Python and JavaScript), test vectors and tests |
| `commitments/YYYY/YYYY-MM-DD.json` | SHA-256 hashes of each game's ANU quantum value, published about 7 days before that League Time date |
| `reveals/YYYY/YYYY-MM-DD.json` | The ANU values themselves, published after that date ends (each game's value also appears on its Verify result page as soon as the game ends) |

## Ground rules

- Commitment files are never edited or deleted after they are committed. A correction would be a new, separate file.
- History on `main` is never rewritten: no force pushes, no deleted commits.
- This repo never contains website code, keys or secrets.
- The ANU values in `rule-v1/test_vectors.json` are public test data and are never used for a real game.

## Check a game yourself

Follow "How to verify a game" in `docs/rule-v1.md`. To check the reference code:

```bash
python3 rule-v1/test_rule_v1.py
node rule-v1/test_rule_v1.mjs
```

Both print `rule v1 test vectors: all pass`.

## Sources of randomness

- ANU Quantum Numbers (Australian National University), one value per game
- drand quicknet (League of Entropy), chain hash `52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971`
