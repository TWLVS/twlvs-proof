"""TWLVS rule v1 reference implementation (scoring only; fetch and BLS checks are separate)."""
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

def quarter_score(game_id: str, side: str, q: int, anu_hex: str, drand_randomness_hex: str) -> int:
    msg = f"{RULE}|{game_id}|{side}|{q}|{anu_hex.lower()}|{drand_randomness_hex.lower()}"
    return hashlib.sha256(msg.encode("utf-8")).digest()[0] >> 6
