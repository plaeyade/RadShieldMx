# DWG Fixtures For F262

Place non-sensitive DWG test files here. Do not commit private patient, hospital, or proprietary construction drawings.

Required fixtures:

- `small-architectural-plan.dwg`: simple 2D plan with known scale, wall layers and at least one dimension.
- `equipment-layout.dwg`: plan with medical equipment blocks or equipment-like symbols.

Optional negative fixture:

- `known-bad-or-empty.dwg`: corrupt/empty/unmappable file to test safe failure.

Acceptance:

- Record input SHA256.
- Convert with the selected backend provider.
- Record output SHA256.
- Validate DXF layer mapping before applying to canvas.
- Confirm scale manually before calculations.
