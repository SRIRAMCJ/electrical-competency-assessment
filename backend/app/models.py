from typing import Literal
from pydantic import BaseModel, Field

class WireConnection(BaseModel):
    from_terminal: str
    to_terminal: str

class CircuitAttempt(BaseModel):
    connections: list[WireConnection] = Field(default_factory=list)
    elapsed_seconds: float = 0

class ActivityResult(BaseModel):
    activity_id: str
    score: float
    max_score: float
    accuracy: float
    completed: bool
    elapsed_seconds: float
    feedback: str

class ActivityDefinition(BaseModel):
    id: str
    type: Literal["circuit_simulation"]
    title: str
    submodule: str
    time_limit_seconds: int
    max_score: int
