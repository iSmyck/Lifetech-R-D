from fastapi import APIRouter

from src.api import health, documents, audit, threads, projects, attachments, notifications, users, stakeholders, reviews, resources, settings, bmad

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, prefix="/health")
api_router.include_router(documents.router)
api_router.include_router(audit.router)
api_router.include_router(threads.router)
api_router.include_router(projects.router)
api_router.include_router(attachments.router)
api_router.include_router(notifications.router)
api_router.include_router(users.router)
api_router.include_router(stakeholders.router)
api_router.include_router(reviews.router)
api_router.include_router(resources.router)
api_router.include_router(settings.router)
api_router.include_router(bmad.router)
