from fastapi import APIRouter, Depends
from ...utils.security import get_current_user
from ...db.models import User

router = APIRouter()


@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "active_project_id": current_user.active_project_id,
        "stripe_subscription_status": current_user.stripe_subscription_status,
    }
