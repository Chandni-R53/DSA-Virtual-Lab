"""
backend/main.py  –  starts the web server.

This file only does the "web" part: create the app, allow the website to talk
to it (CORS), and plug in the routes. It knows NOTHING about algorithms –
that is the job of the dsa_engine folder.

Run it from the PROJECT folder (the one that contains backend/ and dsa_engine/):
    uvicorn backend.main:app --reload
Then open http://localhost:8000/docs to try the API in your browser.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import router

app = FastAPI(title="DSA Virtual Lab API")

# CORS: the website (Live Server, port 5500) and this server (port 8000) are
# different "origins", so the browser blocks requests unless we allow them.
# "*" is fine while developing; when you deploy, replace it with your site's address.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def home():
    return {"message": "DSA Virtual Lab API is running. See /docs"}