from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.base import Base
from backend.database.connection import engine

from backend.models.client import Client
from backend.models.lead import Lead
from backend.models.project import Project
from backend.models.task import Task

from backend.api.clients import router as clients_router
from backend.api.leads import router as leads_router
from backend.api.projects import router as project_router
from backend.api.tasks import router as tasks_router


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


app.include_router(clients_router)
app.include_router(leads_router)
app.include_router(project_router)
app.include_router(tasks_router)


@app.get("/")
def root():
    return {"message": "Oatle Technologies API is running"}