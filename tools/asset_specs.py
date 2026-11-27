"""Which source image becomes which sprite, at what in-game height.

`grid` = pose sheet (cols, rows); `fallback` = single image used until the
sheet exists; `component` = index of an object inside a prop sheet.
"""

HERO_ANIMS = {"idle": [0], "run": [1, 2, 3, 4], "jump": [5], "attack": [6], "hurt": [7]}
ENEMY_ANIMS = {"idle": [0], "walk": [1, 2, 3, 4], "windup": [5], "attack": [6], "hurt": [7]}


def hero(form: str) -> dict:
    return {"src": f"anim/anim_hero_{form}.png", "grid": [4, 2], "h": 40,
            "fallback": f"base/hero_{form}.png", "anims": HERO_ANIMS}


def enemy(name: str, h: int, animated: bool = True) -> dict:
    if not animated:
        return {"src": f"base/en_{name}.png", "h": h}
    return {"src": f"anim/anim_en_{name}.png", "grid": [4, 2], "h": h,
            "fallback": f"base/en_{name}.png", "anims": ENEMY_ANIMS}


SPRITES = {
    **{f"hero_{f}": hero(f) for f in ["pawn", "rook", "knight", "bishop"]},
    "hero_queen": {**hero("queen"), "slice": "grid"},  # glowing spears touch: components would merge
    "en_pawn": {**enemy("pawn", 34), "radius": 1},  # sheet has captions under the frames
    "en_knight": enemy("knight", 46),
    "en_rook": {**enemy("rook", 44), "anims": {"idle": [0], "walk": [1, 2, 3, 4], "windup": [5, 6],
                                               "attack": [7], "hurt": [8]}},
    "en_bishop": enemy("bishop", 40),
    "en_corrupt": enemy("corrupt", 38),
    "en_bat": {"src": "anim/anim_en_bat.png", "grid": [4, 2], "h": 22, "fallback": "base/en_bat.png",
               "anims": {"idle": [0, 1, 2, 3, 4, 5, 6, 7]}},
    "en_wraith": enemy("wraith", 32, animated=False),
    "en_crawler": enemy("crawler", 16, animated=False),
    "boss_captain": {"src": "base/boss_captain.png", "h": 76},
    "boss_thorn": {"src": "base/boss_thorn.png", "h": 84},
    "boss_ironrook": {"src": "base/boss_ironrook.png", "h": 100},
    "boss_forge": {"src": "base/boss_forge.png", "h": 88},
    "boss_queen": {"src": "base/boss_queen.png", "h": 88},
    "boss_king": {"src": "base/boss_king.png", "h": 120},
    "npc_bard": {"src": "base/npc_bard.png", "h": 46},
}

PROP_A = ["altar", "chest", "chest_open", "shard", "crystal", "orb", "brazier", "statue_knight",
          "crystal_green", "orb2", "brazier_big", "statue_king", "crystal_blue", "orb3"]
PROP_A_H = {"altar": 30, "chest": 18, "chest_open": 20, "shard": 14, "crystal": 16, "orb": 10,
            "brazier": 30, "statue_knight": 40, "crystal_green": 16, "orb2": 10, "brazier_big": 34,
            "statue_king": 46, "crystal_blue": 16, "orb3": 10}
PROP_B = ["block_cracked", "block_crystal", "gate_red", "gate_blue", "spikes", "spikes_small",
          "torch", "candle", "lantern"]
PROP_B_H = {"block_cracked": 16, "block_crystal": 16, "gate_red": 48, "gate_blue": 48, "spikes": 10,
            "spikes_small": 10, "torch": 22, "candle": 26, "lantern": 40}

PROPS = {
    **{n: {"src": "base/props_a.png", "component": i, "h": PROP_A_H[n]} for i, n in enumerate(PROP_A)},
    **{n: {"src": "base/props_b.png", "component": i, "h": PROP_B_H[n], "radius": 3} for i, n in enumerate(PROP_B)},
}

ZONES = ["z1", "z2", "z3", "z4", "z5", "z6"]
