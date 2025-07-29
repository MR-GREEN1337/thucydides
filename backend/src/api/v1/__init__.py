from fastapi import APIRouter
from . import auth, users, figures, dialogues, billing

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(figures.router, prefix="/figures", tags=["Figures"])
router.include_router(dialogues.router, prefix="/dialogues", tags=["Dialogues"])
router.include_router(billing.router, prefix="/billing", tags=["Billing"])
