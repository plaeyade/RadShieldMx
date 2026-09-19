# Respaldo integral en GitHub

Este repositorio se debe respaldar en un repositorio **privado** de GitHub. Los
PDF normativos y documentos de proveedores pueden estar sujetos a licencia, por
lo que no deben subirse a un repositorio público sin autorización expresa.

## Qué respalda Git

- Código fuente, infraestructura, migraciones, Docker, CI, manuales, manifests,
  configuraciones no secretas y pruebas.
- RAG reproducible: fuentes permitidas en `data/`, manifiestos, chunks
  preparados, hashes y scripts de ingesta.
- Assets y documentos binarios con Git LFS a partir de `.gitattributes`.

No se versionan `.env`, secretos, `node_modules`, builds transitorios, resultados
de pruebas ni backups duplicados. Esto evita publicar credenciales y convertir
el repositorio en un archivo no reproducible.

## Respaldo de base de datos

Git no sustituye un dump de MySQL. Antes de cada hito se debe crear y verificar
un backup lógico separado:

```powershell
npm run prepare:f153:db-backup-restore
```

Guarde el dump cifrado en almacenamiento privado y registre en Git solo su hash,
fecha, versión y resultado de restore probe. Nunca suba `DATABASE_URL`, dumps
con datos clínicos identificables ni contraseñas.

## Publicación inicial

1. Crear un repositorio privado vacío en GitHub, por ejemplo `gamma81/radshield-mx-backup`.
2. Configurar LFS y agregar el remoto:

```powershell
git lfs install
git remote add github https://github.com/<organizacion-o-usuario>/<repositorio>.git
git push -u github main
git lfs push --all github main
```

3. Verificar desde una carpeta distinta:

```powershell
git clone https://github.com/<organizacion-o-usuario>/<repositorio>.git radshield-mx-restore-check
cd radshield-mx-restore-check
git lfs pull
npm ci
npm run check:app
```

## Migración opcional de binarios históricos

Si se requiere que PDFs y medios ya presentes en commits anteriores pasen a LFS,
hágalo únicamente sobre un clon de respaldo y tras crear una etiqueta de
recuperación. La operación reescribe el historial:

```powershell
git clone --mirror <url-del-repo> radshield-mx-backup.git
cd radshield-mx-backup.git
git lfs migrate import --everything --include="*.pdf,*.dwg,*.dxf,*.ifc,*.glb,*.gltf,*.hdr,*.exr,*.mp4,*.webm,*.zip,*.7z,*.tar,*.gz"
git push --mirror --force
git lfs push --all github
```

No ejecute esta migración sobre el checkout de trabajo ni sin una copia del
repositorio original.
