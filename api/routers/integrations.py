from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.database import get_db
from api.auth import get_current_active_user
from api.models import Integration, PersonaIntegration
from api.schemas import IntegrationResponse, PersonaIntegrationResponse

router = APIRouter()


@router.get("/", response_model=List[IntegrationResponse])
async def list_integrations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    integrations = db.query(Integration).all()
    return integrations


@router.get("/personas/{persona_id}", response_model=List[PersonaIntegrationResponse])
async def list_persona_integrations(
    persona_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Ownership check via a join on PersonaIntegration -> Persona
    from api.models import Persona
    persona = db.query(Persona).filter(
        Persona.id == persona_id,
        Persona.owner_id == current_user.id,
    ).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    links = db.query(PersonaIntegration).join(Integration).filter(
        PersonaIntegration.persona_id == persona_id
    ).all()
    return [
        PersonaIntegrationResponse(
            id=link.id,
            persona_id=link.persona_id,
            integration=link.integration,
            connected=link.connected,
            metadata=link.meta,
        )
        for link in links
    ]


