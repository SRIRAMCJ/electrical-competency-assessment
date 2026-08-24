from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import ActivityDefinition, CircuitAttempt, ActivityResult

app = FastAPI(title="Electrical Competency Assessment API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

ACTIVITY = ActivityDefinition(id="circuit-lamp-001", type="circuit_simulation", title="Connect the wires to turn ON the light", submodule="Basic Electrical Safety", time_limit_seconds=180, max_score=100)
CORRECT_CONNECTIONS = {frozenset(("battery_plus", "lamp_plus")), frozenset(("lamp_minus", "switch_in")), frozenset(("switch_out", "battery_minus"))}

def evaluate(attempt: CircuitAttempt) -> ActivityResult:
    actual = {frozenset((c.from_terminal, c.to_terminal)) for c in attempt.connections}
    matched = len(actual & CORRECT_CONNECTIONS)
    complete = actual == CORRECT_CONNECTIONS
    score = 100 if complete else min(70, round((matched / 3) * 70))
    return ActivityResult(activity_id=ACTIVITY.id, score=score, max_score=100, accuracy=score, completed=complete, elapsed_seconds=max(0, attempt.elapsed_seconds), feedback=("Circuit complete. The lamp can receive a closed electrical path." if complete else "The circuit is incomplete. Check every terminal and make one continuous path through the lamp and switch."))

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "electrical-competency-assessment"}

@app.get("/api/activities/circuit-lamp", response_model=ActivityDefinition)
def get_circuit_activity():
    return ACTIVITY

@app.post("/api/activities/circuit-lamp/evaluate", response_model=ActivityResult)
def evaluate_circuit(attempt: CircuitAttempt):
    return evaluate(attempt)
