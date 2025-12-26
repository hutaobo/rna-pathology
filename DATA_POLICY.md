# DATA_POLICY — RNA-Pathology (Draft v0.1)

This document defines the data policy for **RNA-Pathology**, a schema-driven research database framework for spatial molecular pathology data.

The policy is intentionally conservative and may evolve as the project scales. When the policy changes, updates will be versioned and dated.

---

## 1. Scope

RNA-Pathology may host or reference datasets that include:

- Spatial molecular measurements (e.g., RNA expression; potentially protein/other modalities)
- Spatial structure (coordinates, grids, tissue geometry, regions of interest)
- Biological and pathological annotations (expert-derived and/or computationally inferred)
- Derived computational representations (graphs, neighborhoods, features)

RNA-Pathology is not intended to store clinical decision-making outputs or provide medical advice.

---

## 2. Data Classes

RNA-Pathology recognizes the following broad data classes:

1. **Public research data**
   - Data that can be openly distributed under an explicit license.

2. **Controlled-access research data**
   - Data that is subject to access restrictions (e.g., human data with consent limitations, institutional agreements, or other constraints).

3. **Sensitive data (restricted)**
   - Data that includes personally identifiable information (PII) or data that is prohibited from redistribution under applicable agreements.
   - RNA-Pathology aims to avoid hosting such data directly.

---

## 3. Human Data and Privacy

For datasets derived from human tissue:

- Contributors must ensure the dataset is **appropriately de-identified** and compliant with applicable laws, ethical approvals, and data use agreements.
- RNA-Pathology will not intentionally host direct identifiers (e.g., names, personal identity numbers, full dates of birth, addresses).
- If a dataset contains sensitive metadata, it should be:
  - removed, or
  - transformed into a safer representation (e.g., age bins), or
  - placed under controlled access with explicit governance.

**Important:** RNA-Pathology cannot verify ethical approvals on behalf of contributors. Responsibility for compliance remains with data providers.

---

## 4. Access Control (Planned)

RNA-Pathology aims to support tiered access:

- **Public**: openly downloadable datasets and documentation.
- **Controlled**: access requires an application or approval process.
- **Internal / embargoed**: limited to specific collaborators for a defined period.

Access mechanisms (accounts, review steps, API tokens) are planned and will be documented when implemented.

---

## 5. Licensing and Reuse

All datasets must have a clearly stated license and attribution requirements.

- Public datasets should use a standard open license when possible (e.g., Creative Commons for data, permissive licenses for code).
- Controlled-access datasets must include explicit terms describing permitted uses and redistribution limits.

If licensing is unclear or incompatible with hosting, RNA-Pathology may link to an external primary source rather than mirroring the data.

---

## 6. Provenance and Metadata Requirements

Each dataset should provide sufficient provenance to support reproducible science, including:

- Dataset name and version
- Source publication or preprint (if applicable)
- Technology/platform details
- Processing overview (high-level)
- Contact point (for access or questions)
- Checksums or identifiers where relevant
- Schema version used by RNA-Pathology (e.g., v0.2)

---

## 7. Data Quality and Integrity

RNA-Pathology may apply basic checks to ensure data is consistent with the documented schema and does not contain prohibited content.

RNA-Pathology does not guarantee that contributed datasets are error-free. Users should validate fitness for purpose and cite the original sources.

---

## 8. Security (Principles)

For any hosted data, RNA-Pathology aims to:

- minimize collection of sensitive information,
- restrict access to controlled datasets,
- keep infrastructure and dependencies updated,
- log access where appropriate (especially for controlled data).

Detailed security practices will be documented as infrastructure is introduced.

---

## 9. Embargoes and Takedown Requests

### Embargoes
RNA-Pathology may support time-limited embargoes for pilot datasets, if agreed in writing with data providers.

### Takedown
If you believe data hosted or referenced by RNA-Pathology violates rights, agreements, or privacy requirements, please open a GitHub issue (or contact the maintainers privately if disclosure would cause harm).

RNA-Pathology will:
- acknowledge the request,
- assess the claim,
- and remove or restrict access when appropriate.

---

## 10. Attribution and Citation

Users of RNA-Pathology datasets should:

- cite the original dataset source (paper, accession, or repository),
- cite RNA-Pathology when it materially contributes to access, standardization, or derived artifacts.

A recommended citation format will be provided as the project matures.

---

## 11. Policy Versioning

- **Draft v0.1**
- Last updated: 2025-12-26

Substantive changes will be tracked via repository history and documented in release notes when applicable.
