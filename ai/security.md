---
title: Security and Data Handling
---

# Security and Data Handling

SPatho should be used with clear data-handling expectations.

## Current recommended baseline

- prefer de-identified research data
- use OpenAI API rather than consumer chat interfaces
- keep `store=false` for production workflow runs when appropriate
- separate customer workspaces and output bundles

## Data sensitivity

Not all projects have the same risk level.

### Lower-risk research workflows

Typical characteristics:

- de-identified samples
- exploratory or method-development use
- local workflow execution or managed academic service

### Higher-governance workflows

Typical characteristics:

- customer-controlled environments
- stricter retention requirements
- stronger governance expectations

For these cases, private deployment and customer-managed credentials are the preferred path.

## OpenAI usage model

When OpenAI-assisted analysis is enabled, customers should understand:

- which model is used
- whether they provide their own key
- how outputs are stored
- whether runs are centrally managed or customer-managed

## Security roadmap

The long-term security roadmap should include:

- usage logging
- customer workspace isolation
- artifact manifests for delivery traceability
- private deployment support
- organization-level governance controls
