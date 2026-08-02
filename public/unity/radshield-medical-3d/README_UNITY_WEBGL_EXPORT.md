# RadShield-MX Unity WebGL Export Folder

Place the real Unity WebGL export here when available.

Required structure:

```text
public/unity/radshield-medical-3d/
  index.html
  Build/
    *.loader.js
    *.framework.js
    *.data
    *.wasm
  TemplateData/
    ...
```

Activation:

- Local static build: set `VITE_MEDICAL_3D_UNITY_LOCAL_BUILD=true`.
- External published build: set `VITE_MEDICAL_3D_UNITY_WEBGL_URL=https://.../index.html`.

Unity is a visual walkthrough only. RadShield-MX remains the source of truth for calculations, citations, warnings, reports and Evidence Pack.
