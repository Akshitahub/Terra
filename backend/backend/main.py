from fastapi import FastAPI
from routes.energy import router as energy_router  # import router

app = FastAPI()

app.include_router(energy_router)  # connect it

@app.get("/")
def home():
    return {"message": "Backend is running!"}