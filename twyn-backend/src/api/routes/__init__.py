"""
Routes package for the Twyn SSE API.
"""

from fastapi import APIRouter
from src.api.routes import simulations, architect, simulator, analyst

api_router = APIRouter()

api_router.include_router(simulations.router)
api_router.include_router(architect.router)
api_router.include_router(simulator.router)
api_router.include_router(analyst.router)
