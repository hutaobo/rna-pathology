---
title: Organ Packs
---

# Organ Packs

Organ packs are the public-facing unit of workflow specialization in SPatho.

An organ pack defines:

- the annotation taxonomy
- default study context
- default workflow thresholds
- the expected artifact contract

## Current built-in packs

### Lung

The lung pack is currently designed around lung cancer Xenium workflows.

It includes:

- lung-specific annotation taxonomy
- lung-oriented study context defaults
- artifact expectations for review-ready pathology outputs

### Breast

The breast pack is currently designed around breast cancer Xenium workflows.

It includes:

- breast-specific annotation taxonomy
- breast-oriented study context defaults
- artifact expectations for review-ready pathology outputs

## Why organ packs matter

This design keeps the public product stable while allowing domain-specific logic
to evolve in a controlled way.

It also makes it possible to support:

- public community organ packs
- internal lab-specific organ packs
- commercial customer-specific organ packs

## Future direction

Likely future packs include:

- pancreas
- colorectal
- liver
- lymphoid / immune-focused panels

Public expansion should follow real validated workflows rather than adding organ names prematurely.
