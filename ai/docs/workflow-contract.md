---
title: Workflow Contract
---

# Workflow Contract

SPatho workflows are defined by a JSON configuration file.

The current workflow contract covers:

- case metadata
- study context
- input files
- organ pack selection
- OpenAI settings
- core workflow thresholds

## Current top-level fields

- `case_name`
- `study_context`
- `base_pipeline_config`
- `output_root`
- `annotation_taxonomy`
- `differential_expression_csv`
- `projection_csv`
- `openai_enabled`
- `openai_api_key_env`
- `openai_model`
- `openai_reasoning_effort`
- `openai_store`
- `force_recompute_annotation`
- `force_recompute_pipeline`
- `top_positive_markers`
- `top_negative_markers`
- `min_log2fc`
- `max_adjusted_p_value`
- `top_neighbors`
- `low_confidence_threshold`
- `ambiguity_margin_threshold`
- `top_clusters_per_structure`

## Schema support

The package can export a formal JSON schema:

```bash
spatho config-schema --output /path/to/workflow.schema.json
```

This is the recommended contract for:

- validation
- editor autocompletion
- workflow registry tooling
- future backward-compatible config upgrades

## Doctor checks

Run:

```bash
spatho doctor --config /path/to/workflow.json
```

The output reports:

- schema validity
- organ pack metadata
- required file existence
- OpenAI readiness
- overall `ready_to_run` status

## Artifact contract

Each organ pack also defines a required artifact contract for completed runs.

At a minimum, current public workflows expect:

- annotation evidence JSON
- cluster annotation JSON and CSV
- compatibility annotation CSV
- annotation report HTML
- pathology review HTML
- structure review JSON
- case summary JSON
- structure clustermap PDF
- cluster-to-structure lookup CSV
- workflow summary JSON
