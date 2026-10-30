"""
backend/routes.py  –  the web addresses (endpoints) the website calls.

These three match the "contract" written at the top of frontend/js/visualizer/main.js.
Every algorithm uses the same three, so you never edit this file when you add
a new algorithm – you only add a file to dsa_engine/ and register it.
"""
from fastapi import APIRouter, Body, HTTPException

from dsa_engine import registry

router = APIRouter(prefix="/api")


def find_algorithm(algo_id: str):
    """Look the algorithm up, or answer 404 (the website then shows 'Coming soon')."""
    algorithm = registry.get(algo_id)
    if algorithm is None:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    return algorithm


@router.get("/algorithms")
def list_algorithms():
    """Handy for checking what is registered."""
    return [{"id": a.META["id"], "title": a.META["title"]} for a in registry.ALGORITHMS.values()]


@router.get("/algorithms/{algo_id}")
def get_info(algo_id: str):
    """Title, description, pseudocode, complexity, input fields... (everything the page needs)."""
    return find_algorithm(algo_id).META


@router.post("/algorithms/{algo_id}/run")
def run_algorithm(algo_id: str, payload: dict = Body(...)):
    """Receive the user's input, run the algorithm, send back the list of steps."""
    algorithm = find_algorithm(algo_id)
    try:
        values = algorithm.validate(payload)       # never trust the browser's input
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    reply = {"steps": algorithm.run(values)}
    # Algorithms that explain their complexity for this input send it along too
    if hasattr(algorithm, "complexity"):
        reply["complexity"] = algorithm.complexity(values)
    return reply


@router.get("/algorithms/{algo_id}/random")
def random_input(algo_id: str):
    """A random valid input for the 'Random' button."""
    return find_algorithm(algo_id).random_input()