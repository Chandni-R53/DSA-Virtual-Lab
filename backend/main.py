from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "dsa_engine"))
from binary_search import binary_search

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/run/binary-search")
def run_binary_search():
    steps = binary_search([5, 2, 9, 1, 7, 3], target=7)
    return steps