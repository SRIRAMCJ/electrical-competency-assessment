# Electrical Competency Assessment

A fully local, interactive electrical competency assessment platform for technical employee evaluation.

## Initial scope

Electrical competency modules:

- Motor Maintenance
- LT & HT Feeder & Components Maintenance
- Cable & Lighting System
- Transformer
- HT Relay Settings & Maintenance
- UPS & Battery Maintenance
- VFD Maintenance
- Electrical Measurement Systems
- Rectifier Cubicle Maintenance
- Switchyard Maintenance
- Basic Electrical Safety

## Activity engine

The platform is designed to support:

- MCQ
- Multiple choice
- Fill in the blanks
- Drag & drop / pick & place
- Match the following
- Order / arrange items
- Image-based identification
- Scenario-based questions
- Typing / input questions
- Code / output questions
- Timed challenges
- Interactive simulations
- Practical electrical activities such as circuit wiring, measurement, fault finding and troubleshooting

## Architecture direction

- Frontend: React + TypeScript
- Backend: Python + FastAPI
- Database: PostgreSQL
- Fully local / LAN-first deployment
- Extensible activity engine independent of competency domain

## First practical simulation

**Connect the wires to turn ON the light**

The simulation will model a simple electrical circuit with terminals, components, connection validation, circuit state, timing and automatic scoring.
