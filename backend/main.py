from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.base import Base
from backend.database.connection import engine

# Models
from backend.models.client import Client
from backend.models.lead import Lead
from backend.models.project import Project
from backend.models.task import Task
from backend.models.invoice import Invoice
from backend.models.pricing import Product, AddOn, Service
from backend.models.project_addon import ProjectAddOn
from backend.models.product_service import ProductService
from backend.models.staff import Staff

# API routers
from backend.api.clients import router as clients_router
from backend.api.leads import router as leads_router
from backend.api.projects import router as project_router
from backend.api.tasks import router as tasks_router
from backend.api.invoices import router as invoices_router
from backend.api.pricing import router as pricing_router
from backend.api.project_addons import router as project_addons_router
from backend.api.product_service import router as product_service_router
from backend.api.staff import router as staff_router
from backend.models.product_product_service import ProductProductService
from backend.api.product_product_services import (
    router as product_product_services_router,
)
from backend.api.dashboard import router as dashboard_router
from backend.api.auth import router as auth_router

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
app.include_router(invoices_router)
app.include_router(pricing_router)
app.include_router(product_service_router)
app.include_router(project_addons_router)
app.include_router(staff_router)
app.include_router(product_product_services_router)
app.include_router(dashboard_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Oatle Technologies API is running"
    }