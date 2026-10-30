"""
dsa_engine/registry.py  –  the phone book of the engine.

The website only knows an algorithm's id (the ?sub=binary-search in the URL).
The backend needs to turn that id into the right Python file. This file does that:

    registry.get("binary-search")  ->  the binary_search.py module

It finds algorithms BY ITSELF: it looks inside every folder under dsa_engine/
(searching/, sorting/, trees/ ...) and registers each file that has META, validate,
run and random_input. So to add a new algorithm you only create its file –
you never edit this registry again.
"""
import importlib
import pkgutil

import dsa_engine

REQUIRED = ("META", "validate", "run", "random_input")


def _discover():
    found = {}
    for info in pkgutil.walk_packages(dsa_engine.__path__, prefix="dsa_engine."):
        if info.ispkg or info.name.endswith(".registry"):
            continue
        module = importlib.import_module(info.name)
        if all(hasattr(module, name) for name in REQUIRED):      # helper files are skipped
            algo_id = module.META["id"]
            if algo_id in found:
                raise RuntimeError(f"Two algorithms use the id '{algo_id}'")
            found[algo_id] = module
    return found


ALGORITHMS = _discover()


def get(algo_id):
    """Return the algorithm module for an id like 'linear-search', or None."""
    return ALGORITHMS.get(algo_id)