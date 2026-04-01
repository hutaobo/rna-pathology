---
title: Reports and Artifacts
---

# Reports and Artifacts

SPatho produces both human-readable and machine-readable outputs.

## Human-readable outputs

### Annotation report

The annotation report summarizes:

- cluster-level labels
- confidence
- alternative labels
- evidence
- review priorities

### Pathology review report

The pathology report summarizes:

- discovered structures
- structure-level pathology interpretations
- high-priority review targets
- case-level summary

## Machine-readable outputs

Typical output bundle includes:

- `cluster_evidence.json`
- `cluster_annotations_openai.json`
- `cluster_annotations_openai.csv`
- `cluster_celltype_annotation.csv`
- `annotation_case_review.json`
- `structure_reviews.json`
- `cluster_reviews.json`
- `case_summary.json`
- `workflow_summary.json`

## Spatial artifacts

Key spatial artifacts include:

- `structure_clustermap.pdf`
- `cluster_structure_lookup.csv`
- `structure_assignments.csv`
- validation summaries for downstream review

## Artifact manifest

SPatho can write or rebuild an `artifact_manifest.json` file.

This manifest records:

- case metadata
- organ pack metadata
- provider settings
- artifact paths
- relative paths
- media types
- sizes
- SHA256 hashes

That makes it easier to:

- hand off results to collaborators
- package outputs for customers
- validate a delivery bundle
- audit what was actually produced
