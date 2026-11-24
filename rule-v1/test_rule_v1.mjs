import { readFileSync } from "node:fs";
import { quarterRound, quarterScore, anuCommitment } from "./twlvs_rule_v1.mjs";
const tv = JSON.parse(readFileSync(new URL("./test_vectors.json", import.meta.url)));
for (const g of tv.games) {
  if ((await anuCommitment(g.anu_value)) !== g.anu_sha256) throw new Error("commitment " + g.game_id);
  const tot = { home: 0, away: 0 };
  for (const r of g.quarters) {
    if (quarterRound(g.game_id, r.quarter) !== r.round) throw new Error("round " + g.game_id);
    for (const side of ["home", "away"]) {
      const s = await quarterScore(g.game_id, side, r.quarter, g.anu_value, r.drand_randomness);
      if (s !== r[side]) throw new Error(`score ${g.game_id} ${side} q${r.quarter}`);
      tot[side] += s;
    }
  }
  if (tot.home !== g.final.home || tot.away !== g.final.away) throw new Error("final " + g.game_id);
}
console.log("rule v1 test vectors: all pass");
