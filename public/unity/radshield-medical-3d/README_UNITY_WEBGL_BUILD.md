# RadShield-MX Unity WebGL Build Intake

This folder is reserved for a real Unity WebGL export.

Expected final structure:

```text
public/unity/radshield-medical-3d/
  index.html
  Build/
    <project>.loader.js
    <project>.framework.js
    <project>.data
    <project>.wasm
  TemplateData/
    style.css
    favicon.ico
    fullscreen-button.png
    progress-bar-empty-dark.png
    progress-bar-full-dark.png
```

Audit patterns expected by RadShield-MX:

```text
Build/*.loader.js
Build/*.framework.js
Build/*.data
Build/*.wasm
TemplateData/*
```

Compressed Unity builds are allowed when the server is configured correctly:

```text
Build/*.framework.js.gz or .br
Build/*.data.gz or .br
Build/*.wasm.gz or .br
```

Activation:

```text
VITE_MEDICAL_3D_UNITY_LOCAL_BUILD=true
```

External hosted build:

```text
VITE_MEDICAL_3D_UNITY_WEBGL_URL=https://your-unity-host/index.html
```

Unity is visual-only. It consumes RadShield scene/case JSON and may return bookmarks or snapshots. It must not author signed shielding calculations, citations, TVL values or regulatory decisions.
