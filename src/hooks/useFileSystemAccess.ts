/**
 * useFileSystemAccess — File System Access API
 * Permite guardar/cargar proyectos .radshield nativamente
 * Chrome 86+ | Edge 86+ | Opera 72+
 * Fallback: download/upload tradicional para navegadores no soportados
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const FILE_TYPE = {
  description: 'RadShield-MX Project',
  accept: { 'application/json': ['.radshield'] },
};

export interface FileSystemCapabilities {
  canOpen: boolean;
  canSave: boolean;
  canSaveAs: boolean;
  isNative: boolean;
}

export function useFileSystemAccess() {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileName, setFileName] = useState<string>('proyecto.radshield');

  // Check if File System Access API is available
  const capabilities: FileSystemCapabilities = {
    canOpen: typeof window !== 'undefined' && 'showOpenFilePicker' in window,
    canSave: typeof window !== 'undefined' && 'showSaveFilePicker' in window,
    canSaveAs: typeof window !== 'undefined' && 'showSaveFilePicker' in window,
    isNative: typeof window !== 'undefined' && 'showSaveFilePicker' in window,
  };

  /**
   * Open a .radshield project file using native file picker
   */
  const openProject = useCallback(async (): Promise<any | null> => {
    if (!capabilities.canOpen) {
      // Fallback: use hidden input element
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.radshield,.json';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) { resolve(null); return; }
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            setFileName(file.name);
            toast.success(`Proyecto cargado: ${file.name}`);
            resolve(data);
          } catch (err) {
            toast.error('Error al cargar proyecto: ' + (err as Error).message);
            resolve(null);
          }
        };
        input.click();
      });
    }

    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [FILE_TYPE],
        multiple: false,
      });
      setFileHandle(handle);
      const file = await handle.getFile();
      setFileName(file.name);
      const text = await file.text();
      const data = JSON.parse(text);
      toast.success(`Proyecto cargado: ${file.name}`);
      return data;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Error al abrir: ' + err.message);
      }
      return null;
    }
  }, [capabilities.canOpen]);

  /**
   * Save project to existing file handle (overwrite)
   */
  const saveProject = useCallback(async (data: any): Promise<boolean> => {
    if (!capabilities.canSave) {
      // Fallback: traditional download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Proyecto descargado: ${fileName}`);
      return true;
    }

    try {
      let handle = fileHandle;
      if (!handle) {
        handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [FILE_TYPE],
        });
        setFileHandle(handle);
      }
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      toast.success(`Proyecto guardado: ${handle.name || fileName}`);
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Error al guardar: ' + err.message);
      }
      return false;
    }
  }, [capabilities.canSave, fileHandle, fileName]);

  /**
   * Save As — always show picker
   */
  const saveProjectAs = useCallback(async (data: any): Promise<boolean> => {
    if (!capabilities.canSaveAs) {
      return saveProject(data);
    }
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [FILE_TYPE],
      });
      setFileHandle(handle);
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      toast.success(`Proyecto guardado como: ${handle.name || fileName}`);
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Error: ' + err.message);
      }
      return false;
    }
  }, [capabilities.canSaveAs, fileName, saveProject]);

  /**
   * Create new project (clear handle)
   */
  const newProject = useCallback(() => {
    setFileHandle(null);
    setFileName('proyecto.radshield');
    toast.info('Nuevo proyecto creado');
  }, []);

  return {
    capabilities,
    fileHandle,
    fileName,
    openProject,
    saveProject,
    saveProjectAs,
    newProject,
  };
}
