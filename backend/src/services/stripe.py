"""
Service layer for handling all interactions with the Stripe API.
"""

import stripe
from loguru import logger
from fastapi import HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from ..core.settings import get_settings
from ..db.models import User

settings = get_settings()
stripe.api_key = settings.STRIPE_API_KEY


class StripeService:
    async def create_checkout_session(self, user: User) -> str:
        """Creates a Stripe Checkout session for a user to subscribe."""
        try:
            checkout_session = stripe.checkout.Session.create(
                line_items=[{"price": settings.STRIPE_PRICE_ID_SCHOLAR, "quantity": 1}],
                mode="subscription",
                success_url=f"{settings.FRONTEND_URL}/billing?success=true",
                cancel_url=f"{settings.FRONTEND_URL}/billing?canceled=true",
                customer_email=user.email,
                # Pass our internal user ID to Stripe. This is crucial for webhooks.
                client_reference_id=str(user.id),
            )
            return checkout_session.url
        except Exception as e:
            logger.error(f"Stripe Checkout creation failed for user {user.email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create a billing session.",
            )

    async def create_portal_session(self, user: User) -> str:
        """Creates a Stripe Customer Portal session for a user to manage their subscription."""
        if not user.stripe_customer_id:
            logger.warning(
                f"User {user.email} attempted to access portal without stripe_customer_id."
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has no billing account.",
            )
        try:
            portal_session = stripe.billing_portal.Session.create(
                customer=user.stripe_customer_id,
                return_url=f"{settings.FRONTEND_URL}/billing",
            )
            return portal_session.url
        except Exception as e:
            logger.error(f"Stripe Portal creation failed for user {user.email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create a billing management session.",
            )

    async def handle_webhook_event(
        self, payload: bytes, sig_header: str, db: AsyncSession
    ):
        """
        Handles incoming webhook events from Stripe.
        This is the source of truth for subscription statuses.
        """
        try:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=sig_header,
                secret=settings.STRIPE_WEBHOOK_SECRET,
            )
        except ValueError as e:
            logger.error(f"Webhook payload error: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Webhook signature error: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")

        event_type = event["type"]
        data = event["data"]["object"]

        logger.info(f"Received Stripe webhook event: {event_type}")

        if event_type == "checkout.session.completed":
            user_id = data["client_reference_id"]
            customer_id = data["customer"]
            subscription_id = data["subscription"]

            user = await db.get(User, user_id)
            if not user:
                logger.error(f"Webhook Error: User with ID {user_id} not found.")
                return

            user.stripe_customer_id = customer_id
            user.stripe_subscription_id = subscription_id
            user.stripe_subscription_status = "active"  # The checkout was successful
            db.add(user)
            await db.commit()
            logger.info(
                f"User {user.email} successfully subscribed. Customer ID: {customer_id}"
            )

        elif event_type in (
            "customer.subscription.updated",
            "customer.subscription.deleted",
        ):
            subscription_id = data["id"]
            status = data["status"]

            # Find the user by their subscription ID
            statement = select(User).where(
                User.stripe_subscription_id == subscription_id
            )
            result = await db.execute(statement)
            user = result.scalars().first()

            if not user:
                logger.error(
                    f"Webhook Error: User for subscription ID {subscription_id} not found."
                )
                return

            user.stripe_subscription_status = status
            db.add(user)
            await db.commit()
            logger.info(
                f"Subscription status for user {user.email} updated to '{status}'."
            )

        else:
            logger.info(f"Unhandled Stripe event type: {event_type}")

        return {"status": "success"}


stripe_service = StripeService()
