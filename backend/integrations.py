import os
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/api/integrations",
    tags=["Integrations"],
)


# --------------------------------------------------
# Integration configuration
# --------------------------------------------------

INTEGRATIONS: dict[str, dict[str, Any]] = {
    "github": {
        "name": "GitHub",
        "description": "Connect repositories and developer workflows.",
        "env_vars": ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
        "docs_url": "https://docs.github.com/en/apps/oauth-apps",
    },
    "google": {
        "name": "Google",
        "description": "Connect Google account services.",
        "env_vars": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
        "docs_url": "https://developers.google.com/identity/protocols/oauth2",
    },
    "gmail": {
        "name": "Gmail",
        "description": "Access Gmail through authorized Google OAuth.",
        "env_vars": [
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
        ],
        "docs_url": "https://developers.google.com/gmail/api",
    },
    "calendar": {
        "name": "Google Calendar",
        "description": "View and manage events through authorized Google OAuth.",
        "env_vars": [
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
        ],
        "docs_url": "https://developers.google.com/calendar/api",
    },
    "notion": {
        "name": "Notion",
        "description": "Connect Notion workspaces.",
        "env_vars": ["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET"],
        "docs_url": "https://developers.notion.com/docs/authorization",
    },
    "supabase": {
        "name": "Supabase",
        "description": "Connect your Supabase project and database.",
        "env_vars": ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
        "docs_url": "https://supabase.com/docs",
    },
    "instagram": {
        "name": "Instagram",
        "description": "Connect supported Instagram professional-account features.",
        "env_vars": ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"],
        "docs_url": "https://developers.facebook.com/docs/instagram-platform/",
    },
    "snapchat": {
        "name": "Snapchat",
        "description": "Connect supported Snapchat developer services.",
        "env_vars": ["SNAPCHAT_CLIENT_ID", "SNAPCHAT_CLIENT_SECRET"],
        "docs_url": "https://developers.snap.com/",
    },
}


# --------------------------------------------------
# Response models
# --------------------------------------------------

class IntegrationStatus(BaseModel):
    id: str
    name: str
    description: str
    configured: bool
    connected: bool
    missing_configuration: list[str]
    docs_url: str


class IntegrationListResponse(BaseModel):
    integrations: list[IntegrationStatus]
    total: int
    configured: int
    connected: int


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def is_configured(integration_id: str) -> tuple[bool, list[str]]:
    """
    Checks whether the required environment variables exist.

    Important:
    Configuration does not mean the user has completed OAuth.
    """

    integration = INTEGRATIONS[integration_id]

    missing = [
        variable
        for variable in integration["env_vars"]
        if not os.getenv(variable)
    ]

    return len(missing) == 0, missing


def build_integration_status(
    integration_id: str,
) -> IntegrationStatus:
    integration = INTEGRATIONS[integration_id]
    configured, missing = is_configured(integration_id)

    # This module checks configuration only.
    # A real OAuth callback or verified provider session
    # must establish whether the integration is connected.
    return IntegrationStatus(
        id=integration_id,
        name=integration["name"],
        description=integration["description"],
        configured=configured,
        connected=False,
        missing_configuration=missing,
        docs_url=integration["docs_url"],
    )


# --------------------------------------------------
# API routes
# --------------------------------------------------

@router.get("", response_model=IntegrationListResponse)
def list_integrations():
    """Return the configuration status of every integration."""

    integrations = [
        build_integration_status(integration_id)
        for integration_id in INTEGRATIONS
    ]

    return IntegrationListResponse(
        integrations=integrations,
        total=len(integrations),
        configured=sum(item.configured for item in integrations),
        connected=sum(item.connected for item in integrations),
    )


@router.get("/{integration_id}", response_model=IntegrationStatus)
def get_integration(integration_id: str):
    """Return configuration status for one integration."""

    integration_id = integration_id.lower().strip()

    if integration_id not in INTEGRATIONS:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=f"Integration '{integration_id}' was not found.",
        )

    return build_integration_status(integration_id)


@router.get("/{integration_id}/configuration")
def get_integration_configuration(integration_id: str):
    """
    Return safe configuration metadata.

    Never return API keys, secrets, tokens, or passwords.
    """

    integration_id = integration_id.lower().strip()

    if integration_id not in INTEGRATIONS:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=f"Integration '{integration_id}' was not found.",
        )

    configured, missing = is_configured(integration_id)

    return {
        "id": integration_id,
        "name": INTEGRATIONS[integration_id]["name"],
        "configured": configured,
        "missing_configuration": missing,
        "message": (
            "Required environment variables are present."
            if configured
            else "Some environment variables are missing."
        ),
    }
