# F511 Source Expansion Audit

Date: 2026-09-19

## Scope

This audit starts the controlled expansion of PET, diagnostic and cyclotron
technical evidence. It does not promote a new calculation constant and does
not change shielding methodology.

## Evidence Read Back

The live `document_chunks` inventory contains:

- NCRP 144 / particle accelerators: 1,102 chunks.
- Cyclotron calculation memory: 332 chunks.
- Cyclotron analytic memory: 17 chunks.
- NCRP 147 / diagnostic: 309 chunks.
- AAPM TG-108 / nuclear medicine: 39 chunks.

The controlled material registry currently has two approved supplemental lead
values relevant to this audit:

- `lead-cast-tvl-primary-511kev`: 11.8 mm, source `src-norm-lead-cast`, page
  reference `p.227`.
- `lead-cast-tvl-diagnostic-120kvp`: 0.27 mm, source
  `src-norm-lead-cast`, page reference `p.227`.

These rows remain available to the existing controlled registry. They are not
re-labelled as direct TG-108 broad-beam constants by this audit.

## TG-108 Check

Source: `data/pdf/tg108_pet_shielding.pdf`

- SHA-256: `e049e205ca840cc158fc65a112388db7c040e39b7f8e3bdea391f047c708b3c1`
- 12 PDF pages.
- PDF page 4, Table IV, reports broad-beam 511 keV transmission factors.
- At 16 mm lead, transmission is 0.0990.
- At 20 cm normal concrete (density 2.35 g/cm3), transmission is 0.0904.
- Table V on the same PDF page provides fitted broad-beam transmission
  parameters for lead, concrete and iron.

TG-108 therefore supplies an energy-specific broad-beam transmission method.
It must not be silently reduced to a single TVL value, because geometry,
buildup and the selected transmission model matter.

## Decision

No PET, diagnostic or cyclotron value is promoted in F511 until the following
checks are complete:

1. Link each proposed value to its primary PDF, exact PDF page, table/formula
   and SHA-256.
2. Store TG-108 broad-beam entries as a transmission-model dataset, not as a
   generic TVL.
3. Reconcile the 511 keV 11.8 mm lead row with its actual `p.227` source
   before presenting it as PET-specific evidence.
4. Extract NCRP 147 diagnostic values and NCRP 144 accelerator/neutron values
   into separate modality datasets with an approved-reference review gate.
5. Add a numeric QA fixture for each approved dataset before allowing it to
   influence a final calculation or analytic memory.

## Static Beta Boundary

The beta static build keeps `VITE_ENABLE_BACKEND` disabled. A configured backend
URL is inert in this mode. MySQL, private RAG content and secrets remain outside
the static Vercel artifact.
