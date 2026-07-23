from fastapi import APIRouter

from app.api.v1.endpoints import auth, cms, health, kitchen, menu, offers, orders, payments, reports, restaurants, staff, tables, tax

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(menu.router)
api_router.include_router(offers.router)
api_router.include_router(tax.router)
api_router.include_router(cms.router)
api_router.include_router(restaurants.router)
api_router.include_router(orders.router)
api_router.include_router(reports.router)
api_router.include_router(tables.router)
api_router.include_router(payments.router)
api_router.include_router(kitchen.router)
api_router.include_router(staff.router)

# Legacy alias for Expo client calling /auth/login directly
legacy_auth_router = APIRouter()
legacy_auth_router.include_router(auth.router)
