"""
dsa_engine/arrays_strings/sliding_window.py  –  SLIDING WINDOW

A "window" is a stretch of neighbouring items. Instead of recomputing everything for every
possible window, we slide ONE window along the data: add the item that enters on the right,
remove the item that leaves on the left. Works on numbers (an array) and on text (a string).

Three classic problems:
    fixed    best window of size k      numbers: largest sum.   text: most vowels.
    norepeat longest window with no repeated item     (numbers and text)
    target   smallest window whose sum reaches a target   (positive numbers only)

Step fields (drawn by js/renderers/slider.js):
    data       the items as text (numbers become "12", characters stay "a")
    window     [lo, hi] the current window, or None when it is empty
    enter      position that just entered the window, or -1
    leave      position that just left the window, or -1
    cand       position of the item being considered next, or -1
    dup        position of the repeated item inside the window, or -1
    best       [lo, hi] best window found so far, or None
    best_label text shown on the best window bracket
    badges     [{"text": "sum = 8", "tone": "lime"|"gold"|"red"}]  chips above the data
    pointers   {position: "L" | "R" | "L = R"}
    moves      how many items have entered or left the window so far
    line, message, vars, result   as usual.   result type "found" = success, "missing" = cross.
"""
import random
import re

from dsa_engine.common import MAX_VALUE, clean_list, is_int, plural

MAX_LENGTH = 20
MAX_INPUT_CHARS = 100          # longest raw text the website may send
KINDS = ["numbers", "text"]
OPS = ["fixed", "norepeat", "target"]
VOWELS = "aeiouAEIOU"
WHOLE = re.compile(r"^-?\d+$")


# ------------------------------------------------------------------ helpers
def _printable(s):
    return all(32 <= ord(ch) <= 126 for ch in s)


def _show(x, kind):
    """How an item is written inside a sentence."""
    if kind == "numbers":
        return str(x)
    return "space" if x == " " else f"'{x}'"


def _score(x, kind):
    """What one item is worth in the 'best window of size k' problem."""
    if kind == "numbers":
        return x
    return 1 if x in VOWELS else 0


def _num(x):
    """A number inside a sum: negatives get brackets, so 3 + (-2) is not written 3 + -2."""
    return f"({x})" if x < 0 else str(x)


def _join(items, kind):
    return ", ".join(str(x) for x in items) if kind == "numbers" else "".join(items)


def _quoted(items, kind):
    return _join(items, kind) if kind == "numbers" else "'" + "".join(items) + "'"


# --------------------------------------------------------------- complexity
def complexity(values):
    kind, op, items = values["kind"], values["operation"], values["data"]
    n = len(items)
    moves = run(values)[-1]["moves"]
    if op == "fixed":
        k = values["k"]
        naive = k * (n - k + 1)
        rows = [("Sliding window", "O(n)", moves, "update",
                 "One update per slide: add the item that enters and remove the one that leaves."),
                ("Re-adding every window", "O(n × k)", naive, "addition",
                 f"Each of the {n - k + 1} windows is added up again from scratch.")]
        summary = "The sliding window never re-adds the middle items, so the work stays {big}, however big k is."
        big = "O(n)"
        unit = "updates"
    else:
        naive = n * (n + 1) // 2
        rows = [("Sliding window", "O(n)", moves, "move",
                 "Each item enters the window once and leaves at most once."),
                ("Checking every window", "O(n²)", naive, "window",
                 "Every possible start and end would be tried, one by one.")]
        summary = "Both pointers only ever move forward, so the work grows in a straight line: {big}."
        big = "O(n)"
        unit = "pointer moves"
    top = max(r[2] for r in rows) or 1
    cases = []
    smaller = min(r[2] for r in rows)
    for name, bigo, count, noun, note in rows:
        cases.append({"name": name, "big": bigo, "checks": plural(count, noun), "fraction": count / top,
                      "tone": "low" if count == smaller else "high", "note": note})
    space = {"fixed": "Only the running total and the best total are stored. No copy of the window is needed.",
             "norepeat": "A set remembers the items inside the window, which is at most {i} = all n of them.",
             "target": "Only the running sum and two pointers are stored."}[op]
    return {
        "time": {"intro": f"How many {unit} it needs. Shown for your {'numbers' if kind == 'numbers' else 'text'} of {{n}} items.",
                 "n": n, "cases": cases, "summary": summary, "summary_big": big},
        "space": {"big": "O(n)" if op == "norepeat" else "O(1)", "text": space},
    }


META = {
    "id": "sliding-window",
    "title": "Sliding Window",
    "category": "Arrays & Strings",
    "renderer": "slider",
    "description": "Slide one window along numbers or text. Add the item that enters, remove the item that leaves, and never start over.",
    "legend": [
        {"cls": "", "label": "An item"},
        {"cls": "win", "label": "Inside the window"},
        {"cls": "in", "label": "Entering"},
        {"cls": "out", "label": "Leaving"},
        {"cls": "dup", "label": "Repeated item"},
        {"cls": "best", "label": "Best window"},
    ],
    "inputs": [
        {"id": "kind", "label": "Data", "type": "choice",
         "options": [{"v": "numbers", "label": "Numbers"}, {"v": "text", "label": "Text"}]},
        {"id": "operation", "label": "Problem", "type": "choice",
         "options": [{"v": "fixed", "label": "Best window of size k"},
                     {"v": "norepeat", "label": "Longest with no repeats"},
                     {"v": "target", "label": "Smallest window with sum ≥ target"}]},
        {"id": "data", "label": "Enter your data", "type": "text", "noun": "numbers or text", "max_length": MAX_INPUT_CHARS,
         "trim": True, "placeholder": "Numbers: 2, 1, 5, 1, 3, 2      Text: abcabcbb",
         "hint": f"Numbers mode: whole numbers separated by commas. Text mode: any characters. Up to {MAX_LENGTH} items."},
        {"id": "k", "label": "Window size k", "type": "number", "optional": True,
         "needed_for": {"operation": ["fixed"]}, "placeholder": "e.g. 3"},
        {"id": "target", "label": "Target sum", "type": "number", "optional": True,
         "needed_for": {"operation": ["target"]}, "placeholder": "e.g. 7"},
    ],
    "defaults": {"kind": "numbers", "operation": "fixed", "data": "2, 1, 5, 1, 3, 2", "k": 3, "target": 7},
    "pseudocode": [
        {"t": "bestWindowOfSize(items, k):", "indent": 0},
        {"t": "total = first k items added up", "indent": 1},
        {"t": "best = total", "indent": 1},
        {"t": "for each next position:", "indent": 1},
        {"t": "total = total + in - out", "indent": 2},
        {"t": "keep the best total", "indent": 2},
        {"t": "longestNoRepeat(items):", "indent": 0},
        {"t": "left = 0", "indent": 1},
        {"t": "for each right position:", "indent": 1},
        {"t": "while items[right] is inside:", "indent": 2},
        {"t": "remove the left item", "indent": 3},
        {"t": "add items[right]", "indent": 2},
        {"t": "keep the longest window", "indent": 2},
        {"t": "smallestWithSum(items, target):", "indent": 0},
        {"t": "left = 0, sum = 0", "indent": 1},
        {"t": "for each right position:", "indent": 1},
        {"t": "add items[right] to sum", "indent": 2},
        {"t": "while sum ≥ target:", "indent": 2},
        {"t": "keep the shortest window", "indent": 3},
        {"t": "remove the left item", "indent": 3},
    ],
}


def _parse_numbers(raw):
    if isinstance(raw, list):                       # the API may send a real list
        return clean_list(raw, MAX_LENGTH)
    if not isinstance(raw, str):
        raise ValueError("Please enter some numbers.")
    parts = [p for p in re.split(r"[,\s]+", raw.strip()) if p]
    if not parts:
        raise ValueError("Please enter at least one number.")
    for p in parts:
        if not WHOLE.match(p):
            shown = p if len(p) <= 12 else p[:12] + "…"
            raise ValueError(f"'{shown}' is not a whole number. In Numbers mode, type whole numbers separated by commas, "
                             "like 2, 1, 5. To use letters, set Data to Text.")
    nums = [int(p) for p in parts]
    if len(nums) > MAX_LENGTH:
        raise ValueError(f"Please use at most {MAX_LENGTH} numbers. You entered {len(nums)}.")
    if any(abs(x) > MAX_VALUE for x in nums):
        raise ValueError(f"Please keep each number between -{MAX_VALUE} and {MAX_VALUE}.")
    return nums


def _parse_text(raw):
    if not isinstance(raw, str) or raw.strip() == "":
        raise ValueError("Please enter some text.")
    text = raw.strip()
    if len(text) > MAX_LENGTH:
        raise ValueError(f"Please use at most {MAX_LENGTH} characters. Your text has {len(text)}.")
    if not _printable(text):
        raise ValueError("Please use only letters, numbers, spaces and common symbols (no emoji or accented letters).")
    return list(text)


def validate(data):
    """Check the input from the website. Raise ValueError with a friendly message if it is bad."""
    if not isinstance(data, dict):
        raise ValueError("The input could not be read.")
    kind = data.get("kind")
    if kind not in KINDS:
        raise ValueError("Please choose Numbers or Text for the data.")
    op = data.get("operation")
    if op not in OPS:
        raise ValueError("Please choose a problem to solve.")
    if op == "target" and kind != "numbers":
        raise ValueError("The sum problem only works with numbers. Set Data to Numbers, or choose another problem.")

    items = _parse_numbers(data.get("data")) if kind == "numbers" else _parse_text(data.get("data"))
    n = len(items)

    k = None
    if op == "fixed":
        k = data.get("k")
        if k is None:
            raise ValueError("Please enter the window size k.")
        if not is_int(k):
            raise ValueError("The window size k must be a whole number.")
        if not 1 <= k <= n:
            raise ValueError(f"The window size k must be between 1 and {n} (you have {plural(n, 'item')}).")

    target = None
    if op == "target":
        if any(x < 1 for x in items):
            raise ValueError("This problem needs positive numbers (1 or more). Zero or negative numbers would break the "
                             "sliding idea, because removing an item would not always lower the sum.")
        target = data.get("target")
        if target is None:
            raise ValueError("Please enter the target sum.")
        if not is_int(target):
            raise ValueError("The target sum must be a whole number.")
        if not 1 <= target <= MAX_VALUE:
            raise ValueError(f"The target sum must be between 1 and {MAX_VALUE}.")
    return {"kind": kind, "operation": op, "data": items, "k": k, "target": target}


def random_input():
    kind = random.choice(["numbers", "numbers", "text"])
    if kind == "text":
        text = random.choice(["abcabcbb", "pwwkew", "education", "sliding window", "bbbbb", "dvdf", "abracadabra", "algorithm"])
        return {"kind": "text", "operation": random.choice(["fixed", "norepeat"]), "data": text,
                "k": random.randint(2, min(4, len(text))), "target": random.randint(3, 9)}
    n = random.randint(6, 10)
    op = random.choice(OPS)
    nums = [random.randint(1, 9) for _ in range(n)] if op != "fixed" else [random.randint(-5, 9) for _ in range(n)]
    if op == "norepeat" and random.random() < .5:
        nums = [random.randint(1, 4) for _ in range(n)]
    return {"kind": "numbers", "operation": op, "data": ", ".join(map(str, nums)),
            "k": random.randint(2, min(4, n)), "target": random.randint(max(3, min(nums)), max(4, sum(nums) // 2))}


# ---------------------------------------------------------------------- run
def run(values):
    kind, op, a = values["kind"], values["operation"], values["data"]
    n = len(a)
    data = [str(x) for x in a]
    steps = []
    st = {"moves": 0}

    def snap(line, message, window=None, enter=-1, leave=-1, dup=-1, cand=-1, best=None, best_label="",
             badges=(), extra=(), result=None):
        pointers = {}
        if window:
            lo, hi = window
            if lo == hi:
                pointers[lo] = "L = R"
            else:
                pointers[lo], pointers[hi] = "L", "R"
        steps.append({
            "data": list(data), "window": list(window) if window else None, "enter": enter, "leave": leave,
            "dup": dup, "cand": cand, "best": list(best) if best else None, "best_label": best_label,
            "badges": [dict(b) for b in badges], "pointers": pointers, "moves": st["moves"],
            "line": line, "message": message,
            "vars": [{"k": "window =", "v": "empty" if not window else f"[{window[0]}, {window[1]}]", "hl": bool(window)}] + list(extra),
            "result": result,
        })

    # --------------------------------------------------- best window of size k
    if op == "fixed":
        k = values["k"]
        what = "largest sum" if kind == "numbers" else "most vowels (a, e, i, o, u)"
        name = "sum" if kind == "numbers" else "vowels"
        unit = "numbers" if kind == "numbers" else "letters"
        snap(0, f"Find the {k} neighbouring {unit} with the {what}. Adding {k} items again for every position wastes work. "
                "Instead keep one window and slide it.")
        cur = sum(_score(x, kind) for x in a[:k])
        best, best_w = cur, (0, k - 1)
        st["moves"] = k
        label = lambda v: f"best {name} = {v}"
        if kind == "numbers":
            first_note = f"Add up the first {k} numbers: {' + '.join(_num(x) for x in a[:k])} = {cur}."
        else:
            first_note = f"Count the vowels in the first {k} letters: {cur}."
        snap(1, first_note + " This is the best window so far.", window=best_w, best=best_w, best_label=label(best),
             badges=[{"text": f"{name} = {cur}", "tone": "lime"}, {"text": f"best = {best}", "tone": "gold"}],
             extra=[{"k": f"{name} =", "v": cur, "hl": True}, {"k": "best =", "v": best, "hl": False}])
        for i in range(k, n):
            out_i, in_i = i - k, i
            old = cur
            cur += _score(a[in_i], kind) - _score(a[out_i], kind)
            st["moves"] += 1
            w = (i - k + 1, i)
            if kind == "numbers":
                math = f"{old} + {_num(a[in_i])} - {_num(a[out_i])} = {cur}"
                move = f"Slide right: {a[in_i]} enters, {a[out_i]} leaves. {math}."
            else:
                gain, lose = _score(a[in_i], kind), _score(a[out_i], kind)
                move = (f"Slide right: {_show(a[in_i], kind)} enters (+{gain}), {_show(a[out_i], kind)} leaves (-{lose}). "
                        f"{old} + {gain} - {lose} = {cur}.")
            if cur > best:
                best, best_w = cur, w
                move += " New best window!"
            else:
                move += f" Not better than the best, {best}."
            snap(4, move, window=w, enter=in_i, leave=out_i, best=best_w, best_label=label(best),
                 badges=[{"text": f"{name} = {cur}", "tone": "lime"}, {"text": f"best = {best}", "tone": "gold"}],
                 extra=[{"k": f"{name} =", "v": cur, "hl": True}, {"k": "best =", "v": best, "hl": False}])
        best_items = a[best_w[0]:best_w[1] + 1]
        if kind == "numbers":
            text = f"Best window: indexes {best_w[0]}–{best_w[1]} ({_join(best_items, kind)}), sum {best}."
        elif best == 0:
            text = f"No window has a vowel. The first window, {_quoted(best_items, kind)}, is shown with 0 vowels."
        else:
            text = f"Best window: indexes {best_w[0]}–{best_w[1]} ({_quoted(best_items, kind)}), {plural(best, 'vowel')}."
        snap(5, "Every window has been visited. The gold bracket marks the best one.", window=best_w, best=best_w,
             best_label=label(best),
             badges=[{"text": f"best = {best}", "tone": "gold"}],
             extra=[{"k": f"{name} =", "v": cur, "hl": False}, {"k": "best =", "v": best, "hl": True}],
             result={"type": "found", "text": text})

    # ------------------------------------------------------------ no repeats
    elif op == "norepeat":
        snap(6, "Find the longest stretch with no repeated item. Grow the window on the right. When the next item is "
                "already inside, shrink from the left until it is gone.")
        inside = set()
        left = 0
        best_len, best_w = 0, None
        def lab():
            return f"longest = {best_len}"
        def chips(size):
            return [{"text": f"window = {size}", "tone": "lime"}, {"text": f"longest = {best_len}", "tone": "gold"}]
        def ex(size):
            return [{"k": "size =", "v": size, "hl": True}, {"k": "longest =", "v": best_len, "hl": False}]
        for right in range(n):
            x = a[right]
            if x in inside:
                where = next(p for p in range(left, right) if a[p] == x)
                snap(9, f"Next is {_show(x, kind)} at position {right}, but it is already inside the window (position {where}). "
                        "Shrink from the left until it is gone.",
                     window=(left, right - 1), cand=right, dup=where, best=best_w, best_label=lab(),
                     badges=chips(right - left), extra=ex(right - left))
                while x in inside:
                    gone = left
                    inside.discard(a[gone])
                    left += 1
                    st["moves"] += 1
                    w = (left, right - 1) if left <= right - 1 else None
                    snap(10, f"Remove {_show(a[gone], kind)} from the left." +
                         (f" {_show(x, kind)} is no longer inside." if x not in inside else " It is still inside, so keep removing."),
                         window=w, leave=gone, cand=right, dup=where if x in inside and where >= left else -1,
                         best=best_w, best_label=lab(), badges=chips(right - left), extra=ex(right - left))
            inside.add(x)
            st["moves"] += 1
            size = right - left + 1
            note = f"Add {_show(x, kind)}. The window now has {plural(size, 'item')}, all different."
            if size > best_len:
                best_len, best_w = size, (left, right)
                note += " New longest window!"
            else:
                note += f" Not longer than the best, {best_len}."
            snap(11, note, window=(left, right), enter=right, best=best_w, best_label=lab(), badges=chips(size), extra=ex(size))
        items = a[best_w[0]:best_w[1] + 1]
        shown = _quoted(items, kind)
        snap(12, "Every item has been added once. The gold bracket marks the longest window.", window=best_w, best=best_w,
             best_label=lab(), badges=[{"text": f"longest = {best_len}", "tone": "gold"}], extra=ex(best_len),
             result={"type": "found",
                     "text": f"Longest window with no repeats: indexes {best_w[0]}–{best_w[1]} ({shown}), length {best_len}."})

    # ---------------------------------------------------------------- target
    else:
        target = values["target"]
        total = sum(a)
        snap(13, f"Find the shortest stretch of neighbouring numbers whose sum reaches {target}. Grow the window on the right. "
                 "Once the sum is big enough, shrink from the left as far as possible.",
             badges=[{"text": f"target = {target}", "tone": "gold"}],
             extra=[{"k": "target =", "v": target, "hl": True}, {"k": "sum =", "v": 0, "hl": False}])
        left, s = 0, 0
        best_len, best_w = None, None

        def lab():
            return "shortest = " + ("–" if best_len is None else str(best_len))

        def chips():
            return [{"text": f"sum = {s}", "tone": "lime"}, {"text": f"target = {target}", "tone": "gold"}]

        def ex():
            return [{"k": "target =", "v": target, "hl": False}, {"k": "sum =", "v": s, "hl": True},
                    {"k": "shortest =", "v": "–" if best_len is None else best_len, "hl": False}]
        for right in range(n):
            s += a[right]
            st["moves"] += 1
            tail = f", which reaches {target}." if s >= target else f", still below {target}, so keep growing."
            snap(16, f"Add {a[right]}. The sum is now {s}{tail}", window=(left, right), enter=right, best=best_w,
                 best_label=lab(), badges=chips(), extra=ex())
            while s >= target:
                length = right - left + 1
                if best_len is None or length < best_len:
                    best_len, best_w = length, (left, right)
                    verdict = " The shortest so far!"
                else:
                    verdict = f" Not shorter than the best, {best_len}."
                snap(18, f"Sum {s} ≥ {target}. This window has {plural(length, 'number')}.{verdict} Try shrinking from the left.",
                     window=(left, right), best=best_w, best_label=lab(), badges=chips(), extra=ex())
                gone = left
                s -= a[gone]
                left += 1
                st["moves"] += 1
                w = (left, right) if left <= right else None
                if s >= target:
                    more = f" It still reaches {target}, so keep shrinking."
                elif right == n - 1:
                    more = f" Now below {target}, and there is nothing left to add on the right."
                else:
                    more = f" Now below {target}, so grow on the right again."
                snap(19, f"Remove {a[gone]} from the left. The sum drops to {s}.{more}", window=w, leave=gone,
                     best=best_w, best_label=lab(), badges=chips(), extra=ex())
        if best_w:
            items = a[best_w[0]:best_w[1] + 1]
            snap(18, "Every position has been tried. The gold bracket marks the shortest window.", window=best_w, best=best_w,
                 best_label=lab(), badges=[{"text": f"shortest = {best_len}", "tone": "gold"}], extra=ex(),
                 result={"type": "found",
                         "text": f"Shortest window: indexes {best_w[0]}–{best_w[1]} ({_join(items, kind)}), sum {sum(items)}, length {best_len}."})
        else:
            snap(15, f"Every position has been tried and the sum never reached {target}.", window=None,
                 badges=[{"text": f"total = {total}", "tone": "red"}, {"text": f"target = {target}", "tone": "gold"}],
                 extra=ex(),
                 result={"type": "missing", "text": f"No window reaches {target}: all {plural(n, 'number')} together only add up to {total}."})
    return steps


META["complexity"] = complexity(validate(META["defaults"]))     # needs run(), so it is set last