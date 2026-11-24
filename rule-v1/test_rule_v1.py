import json, pathlib
from twlvs_rule_v1 import quarter_round, quarter_score, anu_commitment
tv = json.loads((pathlib.Path(__file__).parent / "test_vectors.json").read_text())
for g in tv["games"]:
    assert anu_commitment(g["anu_value"]) == g["anu_sha256"]
    tot = {"home": 0, "away": 0}
    for row in g["quarters"]:
        assert quarter_round(g["game_id"], row["quarter"]) == row["round"]
        for side in ("home", "away"):
            s = quarter_score(g["game_id"], side, row["quarter"], g["anu_value"], row["drand_randomness"])
            assert s == row[side]; tot[side] += s
    assert tot == g["final"], (g["game_id"], tot)
print("rule v1 test vectors: all pass")
