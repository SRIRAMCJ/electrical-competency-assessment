# Architecture

## Design principles

1. Activity types are independent of the Electrical competency domain.
2. Activity rendering, interaction tracking, evaluation and scoring are separate concerns.
3. Assessment content is data-driven so administrators can add activities without changing the core engine.
4. The application must work fully on a local machine or company LAN without cloud dependencies.
5. Employee performance is stored at assessment, activity, competency and submodule levels.

## Initial competency domain

```text
Electrical
├── Motor Maintenance
├── LT & HT Feeder & Components Maintenance
├── Cable & Lighting System
├── Transformer
├── HT Relay Settings & Maintenance
├── UPS & Battery Maintenance
├── VFD Maintenance
├── Electrical Measurement Systems
├── Rectifier Cubicle Maintenance
├── Switchyard Maintenance
└── Basic Electrical Safety
```

## Core activity model

```text
Activity Definition
       |
       v
Activity Renderer
       |
       v
User Interactions / Events
       |
       v
Activity Evaluator
       |
       v
Normalized Activity Result
       |
       +----> Score Engine
       +----> Time Metrics
       +----> Accuracy Metrics
       +----> Competency Analytics
```

## Practical simulation model

Interactive simulations maintain a deterministic state machine.

Example: lamp circuit

```text
Battery -> Wire -> Switch -> Wire -> Lamp -> Wire -> Battery
                                  |
                                  v
                         Complete closed circuit
                                  |
                                  v
                              Lamp ON
```

The evaluator should inspect the resulting connection graph rather than rely only on UI actions.

## Planned repository layout

```text
frontend/
backend/
data/
docs/
tests/
```

Later, each domain can add its own content under `data/` without changing the activity engine.
