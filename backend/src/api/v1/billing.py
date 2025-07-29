"""
API endpoints for handling billing and subscriptions via Stripe.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel.ext.asyncio.session import AsyncSession

from ...db.models import User
from ...db.postgresql import get_session
from ...services.stripe import stripe_service
from ...utils.security import get_current_user

router = APIRouter()


@router.post("/create-checkout-session", status_code=status.HTTP_200_OK)
async def create_checkout_session(current_user: User = Depends(get_current_user)):
    """Creates and returns a Stripe Checkout Session URL for the user to subscribe."""
    session_url = await stripe_service.create_checkout_session(current_user)
    return {"url": session_url}


@router.post("/create-portal-session", status_code=status.HTTP_200_OK)
async def create_portal_session(current_user: User = Depends(get_current_user)):
    """Creates and returns a Stripe Customer Portal URL for the user to manage their subscription."""
    portal_url = await stripe_service.create_portal_session(current_user)
    return {"url": portal_url}


@router.post("/stripe-webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """
    Public endpoint to receive webhooks from Stripe.
    It verifies the signature and processes the event.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    await stripe_service.handle_webhook_event(payload, sig_header, session)
    return {"status": "ok"}
