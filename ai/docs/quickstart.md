---
title: SPatho Quickstart
---

# Quickstart

This is the fastest path from installation to a first workflow run.

## 1. Install the package

```bash
pip install spatho
```

## 2. Set your OpenAI API key

In PowerShell:

```powershell
$env:OPENAI_API_KEY="your_api_key"
```

You can also run in heuristic mode without OpenAI, but the preferred product path
uses OpenAI-assisted annotation and review.

## 3. Generate a starter workflow

```bash
spatho init-workflow \
  --organ breast \
  --case-name breast_case_01 \
  --dataset-root /path/to/Xenium_outs \
  --base-pipeline-config /path/to/project/configs/breast_case_01.json \
  --output /path/to/workflows/breast_case_01_full_auto_openai.json
```

## 4. Check the workflow

```bash
spatho doctor --config /path/to/workflows/breast_case_01_full_auto_openai.json
```

This checks:

- whether the workflow JSON exists
- whether required inputs are present
- whether the selected organ pack is valid
- whether OpenAI is enabled and a key is available

## 5. Run the workflow

```bash
spatho run --config /path/to/workflows/breast_case_01_full_auto_openai.json
```

Force heuristic mode if you want to skip OpenAI:

```bash
spatho run --config /path/to/workflows/breast_case_01_full_auto_openai.json --heuristic-only
```

## 6. Review the outputs

Typical outputs include:

- `annotation_review.html`
- `pathology_review/index.html`
- `cluster_annotations_openai.csv`
- `structure_reviews.json`
- `case_summary.json`
- `structure_clustermap.pdf`
- `artifact_manifest.json`

## 7. Rebuild a manifest later

```bash
spatho build-manifest --config /path/to/workflows/breast_case_01_full_auto_openai.json
```

This is useful when packaging results for collaborators or customers.
