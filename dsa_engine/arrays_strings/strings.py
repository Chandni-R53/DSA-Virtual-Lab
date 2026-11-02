"""
dsa_engine/arrays_strings/strings.py  –  STRINGS (four classic operations)

A string is a row of characters, like an array. This file shows four things you can do with one:
reverse it, check if it is a palindrome, count one character, and find a word inside it.
Drawn by js/renderers/letters.js.

Step fields:
    data       the characters right now (one-character strings)
    ids        ids[position] = which original character sits there (lets reversed characters slide)
    active     positions being looked at                     (lime ring)
    match      positions that matched / were counted          (lime)
    mismatch   positions that did not match                   (red)
    swapping   two positions just swapped                     (amber)
    done       positions already in their final place         (dark green)
    dim        positions that are ignored (spaces, symbols)   (faded)
    window     [lo, hi] part of the text the word is lined up with, or None
    pattern    None, or {"chars": [...], "offset": start, "ok": [...], "bad": k or -1}  (Find)
    badge      None, or {"text": "count = 2", "tone": "lime"}
    pointers   {position: "i"}  small labels under the characters
    line, message, vars, result   as usual.   result type "found" = success, "missing" = cross.
"""
import random

from dsa_engine.common import plural

MAX_LENGTH = 20
OPS = ["reverse", "palindrome", "count", "find"]
NEEDS_TARGET = ["count", "find"]


def _printable(s):
    return all(32 <= ord(ch) <= 126 for ch in s)


def _alnum_positions(text):
    return [i for i, ch in enumerate(text) if ch.isalnum()]


def _case(name, big, count, unit, worst, tone, note, approx=False):
    return {"name": name, "big": big, "checks": ("≈ " if approx else "") + plural(count, unit),
            "fraction": min(1, count / max(worst, 1)), "tone": tone, "note": note}


def complexity(values):
    op, text = values["operation"], values["text"]
    n = len(text)
    if op == "reverse":
        k = n // 2
        cases = [_case(nm, "O(n)", k, "swap", k, "high", "Every pair of characters is swapped once: half the length.")
                 for nm in ("Best", "Average", "Worst")]
        summary, big = "Double the text and you double the swaps. That straight-line growth is {big}.", "O(n)"
        space = "The swaps happen inside the same row of characters, so only {i} and j are extra. (Python and Java strings cannot be changed, so real code first copies into a list: O(n).)"
        count_label = "swaps"
    elif op == "palindrome":
        pairs = len(_alnum_positions(text)) // 2
        best = 1 if pairs >= 1 else 0
        avg = (pairs + 1) // 2 if pairs >= 1 else 0
        cases = [
            _case("Best", "O(1)", best, "comparison", pairs, "low", "The first and last characters already differ, so it stops at once."),
            _case("Average", "O(n)", avg, "comparison", pairs, "mid", "A mismatch usually shows up somewhere along the way.", approx=True),
            _case("Worst", "O(n)", pairs, "comparison", pairs, "high", "It really is a palindrome, so every pair has to be checked."),
        ]
        summary, big = "At most half the characters are compared, and that grows with the text: {big}.", "O(n)"
        space = "Two pointers {i} and j walk inwards. No extra copy of the text is needed."
    elif op == "count":
        cases = [_case(nm, "O(n)", n, "comparison", n, "high", "Every character has to be looked at once.")
                 for nm in ("Best", "Average", "Worst")]
        summary, big = "Every character is checked exactly once, whatever the text is. That is {big}.", "O(n)"
        space = "Just one counter and the index {i}."
    else:
        m = len(values["target"])
        windows = n - m + 1
        best = m
        avg = max(best, windows)
        worst = max(avg, windows * m)
        cases = [
            _case("Best", "O(m)", best, "comparison", worst, "low", "The word sits right at the start of the text."),
            _case("Average", "O(n)", avg, "comparison", worst, "mid", "Most windows fail on their first character.", approx=True),
            _case("Worst", "O(n × m)", worst, "comparison", worst, "high",
                  "Almost every window matches for a long time before failing."),
        ]
        summary, big = "The word is slid along the text. In the worst case that is {big} comparisons (n = text length, m = word length).", "O(n × m)"
        space = "Only the start position {i} and a counter are needed."
    return {
        "time": {"intro": "How many " + {"reverse": "swaps", "palindrome": "comparisons", "count": "comparisons", "find": "comparisons"}[op]
                          + " it needs. Shown for your text of {n} characters.",
                 "n": n, "cases": cases, "summary": summary, "summary_big": big},
        "space": {"big": "O(1)", "text": space},
    }


META = {
    "id": "strings",
    "title": "Strings",
    "category": "Arrays & Strings",
    "renderer": "letters",
    "description": "A string is a row of characters. See how to reverse it, test for a palindrome, count a character and find a word.",
    "legend": [
        {"cls": "", "label": "A character"},
        {"cls": "cur", "label": "Being looked at"},
        {"cls": "fnd", "label": "Match"},
        {"cls": "bad", "label": "Mismatch"},
        {"cls": "swp", "label": "Swapped"},
        {"cls": "srt", "label": "Finished"},
        {"cls": "ign", "label": "Skipped (space or symbol)"},
    ],
    "inputs": [
        {"id": "operation", "label": "Operation", "type": "choice",
         "options": [{"v": "reverse", "label": "Reverse"}, {"v": "palindrome", "label": "Palindrome check"},
                     {"v": "count", "label": "Count a character"}, {"v": "find", "label": "Find a word"}]},
        {"id": "text", "label": "Enter your text", "type": "text", "noun": "text", "max_length": MAX_LENGTH, "trim": True,
         "placeholder": "Type letters, numbers or symbols, e.g. Virtual Lab",
         "hint": f"Up to {MAX_LENGTH} characters. Spaces at the start and end are removed."},
        {"id": "target", "label": "Look for", "type": "text", "noun": "character or word to look for",
         "max_length": MAX_LENGTH, "trim": False, "compact": True, "needed_for": {"operation": NEEDS_TARGET},
         "placeholder": "e.g. a", "hint": "One character to count, or a word to find. Capitals matter."},
    ],
    "defaults": {"operation": "reverse", "text": "Virtual Lab", "target": "a"},
    "pseudocode": [
        {"t": "reverse(s):", "indent": 0},
        {"t": "i = first, j = last position", "indent": 1},
        {"t": "while i is left of j:", "indent": 1},
        {"t": "swap s[i] and s[j]", "indent": 2},
        {"t": "move i right, move j left", "indent": 2},
        {"t": "isPalindrome(s):", "indent": 0},
        {"t": "i = first, j = last position", "indent": 1},
        {"t": "while i is left of j:", "indent": 1},
        {"t": "if s[i] ≠ s[j]: return false", "indent": 2},
        {"t": "move i right, move j left", "indent": 2},
        {"t": "return true", "indent": 1},
        {"t": "count(s, c):", "indent": 0},
        {"t": "total = 0", "indent": 1},
        {"t": "for each character ch in s:", "indent": 1},
        {"t": "if ch = c: add 1 to total", "indent": 2},
        {"t": "return total", "indent": 1},
        {"t": "find(s, p):", "indent": 0},
        {"t": "for each start from 0 to n - m:", "indent": 1},
        {"t": "for each k from 0 to m - 1:", "indent": 2},
        {"t": "if s[start+k] ≠ p[k]: stop", "indent": 3},
        {"t": "all matched: return start", "indent": 2},
        {"t": "return not found", "indent": 1},
    ],
}
META["complexity"] = complexity(META["defaults"])


def validate(data):
    """Check the input from the website. Raise ValueError with a friendly message if it is bad."""
    if not isinstance(data, dict):
        raise ValueError("The input could not be read.")
    op = data.get("operation")
    if op not in OPS:
        raise ValueError("Please choose an operation: reverse, palindrome check, count or find.")
    text = data.get("text")
    if not isinstance(text, str) or text.strip() == "":
        raise ValueError("Please enter some text.")
    text = text.strip()
    if len(text) > MAX_LENGTH:
        raise ValueError(f"Please use at most {MAX_LENGTH} characters. Your text has {len(text)}.")
    if not _printable(text):
        raise ValueError("Please use only letters, numbers, spaces and common symbols (no emoji or accented letters).")
    if op == "palindrome" and not _alnum_positions(text):
        raise ValueError("A palindrome check needs at least one letter or number in the text.")

    target = None
    if op in NEEDS_TARGET:
        target = data.get("target")
        what = "the character to count" if op == "count" else "the word to look for"
        if not isinstance(target, str) or target == "":
            raise ValueError(f"Please enter {what}.")
        if not _printable(target):
            raise ValueError("Please use only letters, numbers, spaces and common symbols (no emoji or accented letters).")
        if op == "count" and len(target) != 1:
            raise ValueError(f"Please enter exactly one character to count (you entered {len(target)}). To search for a longer word, choose Find a word.")
        if op == "find":
            if target.strip() == "":
                raise ValueError("Please enter the word to look for (it cannot be only spaces).")
            if len(target) > len(text):
                raise ValueError(f"The word to look for ({len(target)} characters) is longer than the text ({len(text)}). Please make it shorter.")
    return {"operation": op, "text": text, "target": target}


def random_input():
    text = random.choice(["level", "hello world", "racecar", "data structures", "Madam", "algorithm",
                          "Never odd or even", "banana", "Stack and Queue", "noon"])
    op = random.choice(OPS)
    letters = [c for c in text if c.isalnum()]
    if op == "count":
        target = random.choice(letters)
    else:
        i = random.randint(0, max(0, len(text) - 3))
        target = text[i:i + random.randint(2, 3)].strip() or text[:2]
        if random.random() < 0.2:
            target = "zq"
    return {"operation": op, "text": text, "target": target}


def run(values):
    op, text, target = values["operation"], values["text"], values["target"]
    data = list(text)
    n = len(data)
    ids = list(range(n))
    steps = []
    state = {"i": None, "j": None, "swaps": 0, "comparisons": 0, "count": 0}

    def q(word):
        return f"'{word}'"

    def show(ch):
        return "space" if ch == " " else f"'{ch}'"

    def snap(line, message, active=(), match=(), mismatch=(), swapping=(), done=(), dim=(), window=None,
             pattern=None, badge=None, pointers=None, result=None):
        extra = {"reverse": [("swaps =", state["swaps"])],
                 "palindrome": [("comparisons =", state["comparisons"])],
                 "count": [("count =", state["count"])],
                 "find": [("comparisons =", state["comparisons"])]}[op]
        steps.append({
            "data": list(data), "ids": list(ids), "active": list(active), "match": list(match),
            "mismatch": list(mismatch), "swapping": list(swapping), "done": sorted(done), "dim": list(dim),
            "window": list(window) if window else None, "pattern": pattern, "badge": badge,
            "pointers": dict(pointers or {}), "line": line, "message": message,
            "vars": [{"k": "operation =", "v": op, "hl": False}, {"k": "length =", "v": n, "hl": False}] +
                    [{"k": k, "v": v, "hl": v not in (0, "–")} for k, v in extra],
            "result": result,
        })

    intro = f"The text has {plural(n, 'character')}. Each one sits in its own position, counted from 0."

    # ---------------------------------------------------------------- reverse
    if op == "reverse":
        if n == 1:
            snap(0, intro)
            snap(0, "With a single character there is nothing to swap.", done=[0],
                 result={"type": "found", "text": f"Reversed: '{text}'. It is the same, no swaps needed."})
            return steps
        done = set()
        i, j = 0, n - 1
        snap(0, intro + " To reverse it, swap the first and last character, then move inwards.", pointers={i: "i", j: "j"})
        while i < j:
            a, b = data[i], data[j]
            data[i], data[j] = data[j], data[i]
            ids[i], ids[j] = ids[j], ids[i]
            state["swaps"] += 1
            done.update([i, j])
            note = " They are the same character, so it looks unchanged." if a == b else ""
            snap(3, f"Swap {show(a)} (position {i}) with {show(b)} (position {j}).{note}",
                 swapping=[i, j], done=done - {i, j}, pointers={i: "i", j: "j"})
            i, j = i + 1, j - 1
        if i == j:
            done.add(i)
            snap(2, f"i and j meet at position {i}. The middle character stays where it is.", done=done, pointers={i: "i = j"})
        else:
            snap(2, "i has passed j, so every pair has been swapped.", done=done)
        reversed_text = "".join(data)
        snap(-1, "Every character is in its new place, so the text is reversed!", done=done,
             result={"type": "found", "text": f"Reversed: '{reversed_text}' ({plural(state['swaps'], 'swap')})."})

    # ------------------------------------------------------------- palindrome
    elif op == "palindrome":
        keep = _alnum_positions(text)
        dim = [p for p in range(n) if p not in keep]
        L = len(keep)
        skipped = ("" if not dim else " Spaces and symbols are ignored.")
        tags = {p: "skip" for p in dim}                # ignored characters are labelled "skip" under the letters
        snap(5, intro + " A palindrome reads the same forwards and backwards. Capital letters count the same as small ones." + skipped,
             dim=dim, pointers={**tags, **({keep[0]: "L", keep[-1]: "R"} if L > 1 else {keep[0]: "L = R"})})
        matched = []
        a, b = 0, L - 1
        while a < b:
            p, q = keep[a], keep[b]
            state["comparisons"] += 1
            if data[p].lower() == data[q].lower():
                matched += [p, q]
                snap(8, f"Compare {show(data[p])} and {show(data[q])}: they are the same, so move both pointers inwards.",
                     match=matched, dim=dim, pointers={**tags, p: "L", q: "R"})
            else:
                snap(8, f"Compare {show(data[p])} and {show(data[q])}: they are different. This is not a palindrome.",
                     match=matched, mismatch=[p, q], dim=dim, pointers={**tags, p: "L", q: "R"},
                     result={"type": "missing", "text": f"Not a palindrome: {show(data[p])} and {show(data[q])} do not match."})
                return steps
            a, b = a + 1, b - 1
        if a == b:
            matched.append(keep[a])
            snap(7, f"The pointers meet on {show(data[keep[a]])}. A single character always matches itself.",
                 match=matched, dim=dim, pointers=tags)
        snap(10, "Every pair matched.", match=matched, dim=dim, pointers=tags,
             result={"type": "found", "text": f"'{text}' is a palindrome ({plural(state['comparisons'], 'comparison')})."})

    # ------------------------------------------------------------------ count
    elif op == "count":
        matched = []
        snap(11, intro + f" Count how many of them are {show(target)}, one by one.",
             badge={"text": "count = 0", "tone": "lime"})
        for k in range(n):
            ch = data[k]
            if ch == target:
                state["count"] += 1
                matched.append(k)
                snap(14, f"Position {k} is {show(ch)}. It matches, so the count goes up to {state['count']}.",
                     match=matched, pointers={k: "i"},
                     badge={"text": f"count = {state['count']}", "tone": "lime"})
            else:
                snap(14, f"Position {k} is {show(ch)}. Not a match, so the count stays at {state['count']}.",
                     active=[k], match=matched, pointers={k: "i"},
                     badge={"text": f"count = {state['count']}", "tone": "lime"})
        c = state["count"]
        if c:
            result = {"type": "found", "text": f"{show(target)} appears {plural(c, 'time')} in '{text}'."}
        else:
            result = {"type": "missing", "text": f"{show(target)} does not appear in '{text}'."}
        snap(-1, "The whole text has been checked.", match=matched, badge={"text": f"count = {c}", "tone": "lime" if c else "red"},
             result=result)

    # ------------------------------------------------------------------- find
    else:
        m = len(target)
        pat = list(target)

        def pattern(s, ok, bad=-1):
            return {"chars": pat, "offset": s, "ok": list(ok), "bad": bad}

        snap(16, intro + f" Slide the word {show(target) if m == 1 else q(target)} along the text and check each window.",
             window=[0, m - 1], pattern=pattern(0, []))
        for s in range(0, n - m + 1):
            ok = []
            for k in range(m):
                state["comparisons"] += 1
                t, p = data[s + k], pat[k]
                head = f"Window starts at {s}. " if k == 0 else ""
                if t == p:
                    ok.append(k)
                    snap(19, f"{head}Compare {show(t)} with {show(p)}: same.",
                         active=[s + k], match=[s + x for x in ok[:-1]], window=[s, s + m - 1], pattern=pattern(s, ok),
                         pointers={s: "start"})
                else:
                    snap(19, f"{head}Compare {show(t)} with {show(p)}: different, so slide the word one place right."
                         if s < n - m else f"{head}Compare {show(t)} with {show(p)}: different. There is no room left to slide.",
                         active=[], match=[s + x for x in ok], mismatch=[s + k], window=[s, s + m - 1],
                         pattern=pattern(s, ok, k), pointers={s: "start"})
                    break
            else:
                snap(20, f"All {plural(m, 'character')} match. The word starts at position {s}.",
                     match=list(range(s, s + m)), window=[s, s + m - 1], pattern=pattern(s, range(m)), pointers={s: "start"},
                     result={"type": "found", "text": f"Found {q(target)} at position {s} after {plural(state['comparisons'], 'comparison')}."})
                return steps
        snap(21, "The word has been tried at every position without a full match.", window=None,
             pattern=pattern(n - m, [], -1) | {"gone": True},
             result={"type": "missing", "text": f"{q(target)} is not in the text ({plural(state['comparisons'], 'comparison')})."})
    return steps