# RNA-Pathology Schema v0.2 (Conceptual)

This document describes the **conceptual schema** of RNA-Pathology.
It defines logical data layers and their intended roles, independent of
any specific file format or implementation.

---

## 1. Sample Layer

The Sample layer captures biological origin and experimental context.

It includes:
- Patient or model system information
- Disease or condition
- Sample preparation and acquisition metadata

This layer provides the anchor for all downstream spatial and molecular data.

---

## 2. Spatial Layer

The Spatial layer represents tissue geometry and spatial organization.

It includes:
- Spatial coordinates
- Grids or spot layouts
- Regions of interest and tissue boundaries

Spatial information is treated as a first-class entity rather than auxiliary metadata.

---

## 3. Molecular Layer

The Molecular layer contains quantitative molecular measurements.

Examples include:
- RNA expression
- Protein abundance
- Other molecular or epigenetic features

This layer is modality-agnostic and extensible.

---

## 4. Annotation Layer

The Annotation layer captures biological and pathological interpretation.

It may include:
- Cell type labels
- Spatial niches
- Histopathological structures

Annotations may be expert-derived or computationally inferred.

---

## 5. Derived Layer

The Derived layer stores computed representations and features.

Examples include:
- Spatial graphs
- Neighborhood definitions
- Quantitative spatial metrics

Derived data must be traceable to upstream layers.

---

## Versioning

Schema changes are versioned explicitly.
Backward compatibility and transparency are prioritized when evolving
from one schema version to the next.
