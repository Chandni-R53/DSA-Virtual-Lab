"""
dsa_engine/sorting/merge_sort.py  -  MERGE SORT

Split the array in half again and again until single numbers remain (a single number
is already sorted), then MERGE sorted halves back together by repeatedly taking the
smaller of the two front numbers. Drawn by js/renderers/mergetree.js (a tree of boxes).

The recursion goes depth first, like the real code: the whole left half is split and merged
before the right half starts.

Step fields:
    data     the array (a merge is written back when it finishes)
    nodes    every box of the tree, each {lo, hi, depth, vis, mode, cells}
               vis    False until its parent has been split
               mode   "raw" (not merged yet) | "merging" | "done" (merged, sorted)
               cells  [{v: number or None, f: [flags]}]   flags: "empty", "just", "head", "taken", "fin"
    line, message, vars, result   as usual.   result type "found" = success.
"""
import random

from dsa_engine.common import clean_list, plural

MAX_LENGTH = 20


def _counts(n):
    """(best, average, worst) number of comparisons for n numbers, using the same split as run()."""
    if n <= 1:
        return 0, 0.0, 0
    a, b = (n + 1) // 2, n // 2
    ba, aa, wa = _counts(a)
    bb, ab, wb = _counts(b)
    best = ba + bb + min(a, b)
    worst = wa + wb + n - 1
    average = aa + ab + (a + b) - a / (b + 1) - b / (a + 1)    # expected for a random order
    return best, average, worst


def complexity(values):
    n = len(values["array"])
    best, average, worst = _counts(n)
    average = round(average)
    top = max(worst, 1)
    return {
        "time": {
            "intro": "How many comparisons it needs. Shown for your array of {n} numbers.",
            "n": n,
            "cases": [
                {"name": "Best", "big": "O(n log n)", "checks": plural(best, "comparison"), "fraction": best / top,
                 "tone": "low", "note": "Already sorted: each merge ends as soon as one half is used up."},
                {"name": "Average", "big": "O(n log n)", "checks": "≈ " + plural(average, "comparison"),
                 "fraction": average / top, "tone": "mid", "note": "A random order is close to the worst case."},
                {"name": "Worst", "big": "O(n log n)", "checks": plural(worst, "comparison"), "fraction": 1,
                 "tone": "high", "note": "The halves are interleaved, so every merge compares until the very end."},
            ],
            "summary": "Doubling the array only a little more than doubles the work. That is what {big} means, "
                       "and it is far faster than O(n²) for big arrays.",
            "summary_big": "O(n log n)",
        },
        "space": {
            "big": "O(n)",
            "text": "Merging needs a helper list as big as the part being merged.",
        },
    }


META = {
    "id": "merge-sort",
    "title": "Merge Sort",
    "category": "Searching & Sorting",
    "renderer": "mergetree",
    "description": "Split the array in half again and again, then merge the sorted halves back together.",
    "legend": [
        {"cls": "", "label": "Waiting"},
        {"cls": "cur", "label": "Front numbers compared"},
        {"cls": "fnd", "label": "Number just taken"},
        {"cls": "tkn", "label": "Already taken"},
        {"cls": "srt", "label": "Merged (sorted)"},
    ],
    "inputs": [
        {"id": "array", "label": "Enter your array", "type": "list", "max_length": MAX_LENGTH,
         "placeholder": "Type numbers separated by commas, e.g. 38, 27, 43, 3, 9, 82",
         "hint": f"Up to {MAX_LENGTH} numbers. Duplicates and negatives are fine."},
    ],
    "defaults": {"array": [38, 27, 43, 3, 9, 82, 10]},
    "pseudocode": [
        {"t": "mergeSort(lo, hi):", "indent": 0},
        {"t": "if lo >= hi: return", "indent": 1},
        {"t": "mid = (lo + hi) // 2", "indent": 1},
        {"t": "mergeSort(lo, mid)", "indent": 1},
        {"t": "mergeSort(mid + 1, hi)", "indent": 1},
        {"t": "merge the two sorted halves", "indent": 1},
        {"t": "copy result into arr[lo..hi]", "indent": 1},
    ],
}
META["complexity"] = complexity(META["defaults"])


def validate(data):
    """Check the input from the website. Raise ValueError with a friendly message if it is bad."""
    return {"array": clean_list(data.get("array"), MAX_LENGTH)}


def random_input():
    n = random.randint(5, 10)
    return {"array": random.sample(range(-20, 100), n)}


def run(values):
    array = list(values["array"])            # the array, updated when a merge finishes
    original = list(values["array"])         # what the boxes show before they are merged
    n = len(array)

    steps = []
    comparisons = 0
    lo = mid = hi = None
    merged_strip = []                        # the "merged" list shown in the strip under the picture

    # ---- the tree of boxes, built once ----
    nodes = {}

    def build(a, b, depth):
        nodes[(a, b)] = {"lo": a, "hi": b, "depth": depth, "vis": False, "mode": "raw",
                         "merged": [], "taken": 0, "just": -1, "sorted": sorted(original[a:b + 1])}
        if a < b:
            m = (a + b) // 2
            build(a, m, depth + 1)
            build(m + 1, b, depth + 1)

    build(0, n - 1, 0)
    nodes[(0, n - 1)]["vis"] = True
    order = sorted(nodes, key=lambda k: (nodes[k]["depth"], k[0]))      # same order on every step

    def cells_of(node, heads):
        a, b = node["lo"], node["hi"]
        size = b - a + 1
        out = []
        for idx in range(size):
            flags = []
            if node["mode"] == "raw":
                value = original[a + idx]
            elif node["mode"] == "merging":
                if idx < len(node["merged"]):
                    value = node["merged"][idx]
                    if idx == len(node["merged"]) - 1:
                        flags.append("just")
                else:
                    value = None
                    flags.append("empty")
            else:                                                       # done
                value = node["sorted"][idx]
                if idx < node["taken"]:
                    flags.append("taken")
                if idx == node["just"]:
                    flags.append("just")
                if size > 1 and node["taken"] == 0 and node["just"] == -1:
                    flags.append("fin")
            if (a, b, idx) in heads:
                flags.append("head")
            out.append({"v": value, "f": flags})
        return out

    def snap(line, message, heads=(), result=None):
        heads = set(heads)
        steps.append({
            "data": list(array),
            "nodes": [{"lo": k[0], "hi": k[1], "depth": nodes[k]["depth"], "vis": nodes[k]["vis"],
                       "mode": nodes[k]["mode"], "cells": cells_of(nodes[k], heads)} for k in order],
            "line": line,
            "message": message,
            "vars": [
                {"k": "lo =", "v": "-" if lo is None else lo, "hl": False},
                {"k": "mid =", "v": "-" if mid is None else mid, "hl": False},
                {"k": "hi =", "v": "-" if hi is None else hi, "hl": False},
                {"k": "comparisons =", "v": comparisons, "hl": len(heads) > 0},
                {"k": "merged =", "v": "[" + ", ".join(str(x) for x in merged_strip) + "]" if merged_strip else "[ ]", "hl": False},
            ],
            "result": result,
        })

    def show(a, b):
        """'[38, 27]' for a box: sorted values if it is merged, otherwise the original order."""
        node = nodes[(a, b)]
        return str(node["sorted"] if node["mode"] == "done" else original[a:b + 1])

    if n == 1:
        nodes[(0, 0)]["mode"] = "done"
        snap(-1, "There is only one number, so it is already sorted.",
             result={"type": "found", "text": "Already sorted. 0 comparisons needed."})
        return steps

    snap(0, "Merge Sort splits the array into halves, again and again, until single numbers remain. "
            "Then it merges the sorted halves back together.")

    def sort(a, b):
        nonlocal lo, mid, hi, comparisons, merged_strip
        if a >= b:
            return
        m = (a + b) // 2                      # this call's own middle (the shared `mid` is only for the strip)
        lo, hi, mid = a, b, m
        merged_strip = []
        nodes[(a, m)]["vis"] = nodes[(m + 1, b)]["vis"] = True
        snap(2, f"Split {show(a, b)} into {show(a, m)} and {show(m + 1, b)}.")

        sort(a, m)                             # the whole left half is finished first ...
        sort(m + 1, b)                         # ... and only then the right half

        # ---- merge the two sorted halves ----
        lo, hi, mid = a, b, m
        left, right = nodes[(a, m)], nodes[(m + 1, b)]
        node = nodes[(a, b)]
        left["mode"] = right["mode"] = "done"
        left["taken"] = right["taken"] = 0
        left["just"] = right["just"] = -1
        node["mode"] = "merging"
        node["merged"] = []
        merged_strip = node["merged"]
        snap(5, f"Now merge {show(a, m)} and {show(m + 1, b)}. Compare their front numbers.",
             heads=[(a, m, 0), (m + 1, b, 0)])

        li = rj = 0
        while li < len(left["sorted"]) and rj < len(right["sorted"]):
            comparisons += 1
            x, y = left["sorted"][li], right["sorted"][rj]
            if x <= y:
                node["merged"].append(x)
                left["just"], right["just"] = li, -1
                li += 1
                left["taken"] = li
                text = f"Compare {x} and {y}: {x} is smaller or equal, so take {x}."
            else:
                node["merged"].append(y)
                right["just"], left["just"] = rj, -1
                rj += 1
                right["taken"] = rj
                text = f"Compare {x} and {y}: {y} is smaller, so take {y}."
            heads = []
            if li < len(left["sorted"]):
                heads.append((a, m, li))
            if rj < len(right["sorted"]):
                heads.append((m + 1, b, rj))
            snap(5, text, heads=heads)

        if li < len(left["sorted"]) or rj < len(right["sorted"]):
            from_left = li < len(left["sorted"])
            rest = left["sorted"][li:] if from_left else right["sorted"][rj:]
            node["merged"].extend(rest)
            side, other = (left, right) if from_left else (right, left)
            side["taken"] = len(side["sorted"])
            side["just"] = side["taken"] - 1
            other["just"] = -1
            snap(5, f"One half is used up, so the rest {rest} is copied over.")

        node["mode"] = "done"
        left["just"] = right["just"] = -1
        array[a:b + 1] = node["merged"]
        snap(6, f"{show(a, b)} is merged and sorted. It is copied back into indexes {a} to {b}.")

    sort(0, n - 1)

    lo = mid = hi = None
    merged_strip = []
    snap(0, "Everything is merged back into one sorted array!",
         result={"type": "found", "text": f"Sorted! {plural(comparisons, 'comparison')} in total."})
    return steps