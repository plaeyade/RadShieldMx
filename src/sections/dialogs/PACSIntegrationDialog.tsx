import { DatosEjemploBanner } from '@/components/SyntheticResultBanner';
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search, Server, Link, FileImage, Wifi, WifiOff,
  Download, Eye, Folders, Globe, Shield, RefreshCw, Plug, HardDrive, CheckCircle, AlertTriangle
} from 'lucide-react';

// PACS Vendor configurations
interface PACSVendor {
  id: string;
  name: string;
  protocol: 'DICOMweb' | 'DIMSE' | 'WADO-RS' | 'FHIR' | 'HL7';
  host: string;
  port: number;
  aet?: string;
  supportsQIDO: boolean;
  supportsWADO: boolean;
  supportsSTOW: boolean;
  authType: 'none' | 'basic' | 'bearer' | 'apikey';
}

const PACS_VENDORS: PACSVendor[] = [
  { id: 'orthanc', name: 'Orthanc (Open Source)', protocol: 'DICOMweb', host: 'localhost', port: 8042, aet: 'ORTHANC', supportsQIDO: true, supportsWADO: true, supportsSTOW: true, authType: 'none' },
  { id: 'dcm4chee', name: 'dcm4chee-arc-light', protocol: 'DICOMweb', host: 'localhost', port: 8080, aet: 'DCM4CHEE', supportsQIDO: true, supportsWADO: true, supportsSTOW: true, authType: 'basic' },
  { id: 'conquest', name: 'Conquest DICOM', protocol: 'DIMSE', host: 'localhost', port: 5678, aet: 'CONQUESTSRV1', supportsQIDO: false, supportsWADO: false, supportsSTOW: false, authType: 'none' },
  { id: 'pacsone', name: 'PacsOne Server', protocol: 'DICOMweb', host: 'localhost', port: 8080, supportsQIDO: true, supportsWADO: true, supportsSTOW: true, authType: 'basic' },
  { id: 'siemens', name: 'Siemens syngo.share', protocol: 'DICOMweb', host: 'syngo.hospital.local', port: 443, supportsQIDO: true, supportsWADO: true, supportsSTOW: false, authType: 'bearer' },
  { id: 'ge', name: 'GE Centricity PACS', protocol: 'DIMSE', host: 'gepacs.hospital.local', port: 104, aet: 'GEPACS', supportsQIDO: false, supportsWADO: false, supportsSTOW: false, authType: 'none' },
  { id: 'fuji', name: 'Fuji Synapse PACS', protocol: 'DICOMweb', host: 'synapse.hospital.local', port: 443, supportsQIDO: true, supportsWADO: true, supportsSTOW: true, authType: 'apikey' },
  { id: 'philips', name: 'Philips IntelliSpace', protocol: 'DICOMweb', host: 'intellispace.hospital.local', port: 443, supportsQIDO: true, supportsWADO: true, supportsSTOW: false, authType: 'bearer' },
];

// Simulated DICOM Study
interface DICOMStudy {
  studyInstanceUID: string;
  patientName: string;
  patientID: string;
  accessionNumber: string;
  studyDate: string;
  studyDescription: string;
  modality: string;
  numSeries: number;
  numInstances: number;
  institution: string;
  radiationDose?: { ctdivol: number; dlp: number };
  shieldingRelevant: boolean;
}

const MOCK_STUDIES: DICOMStudy[] = [
  {
    studyInstanceUID: '1.2.840.113619.2.55.3.2831164358.123.1234567890.1',
    patientName: 'DEMO^PACIENTE 01', patientID: 'PAT-2024-001',
    accessionNumber: 'ACC-2024-00001', studyDate: '2026-05-28',
    studyDescription: 'CT CHEST ABDOMEN PELVIS W CONTRAST',
    modality: 'CT', numSeries: 3, numInstances: 512,
    institution: 'Hospital General de Mexico', radiationDose: { ctdivol: 15.2, dlp: 850 },
    shieldingRelevant: true,
  },
  {
    studyInstanceUID: '1.2.840.113619.2.55.3.2831164358.123.1234567890.2',
    patientName: 'DEMO^PACIENTE 02', patientID: 'PAT-2024-002',
    accessionNumber: 'ACC-2024-00002', studyDate: '2026-05-29',
    studyDescription: 'PET/CT WHOLE BODY FDG',
    modality: 'PT', numSeries: 5, numInstances: 1024,
    institution: 'INCMNSZ', radiationDose: { ctdivol: 8.5, dlp: 420 },
    shieldingRelevant: true,
  },
  {
    studyInstanceUID: '1.2.840.113619.2.55.3.2831164358.123.1234567890.3',
    patientName: 'DEMO^PACIENTE 03', patientID: 'PAT-2024-003',
    accessionNumber: 'ACC-2024-00003', studyDate: '2026-05-30',
    studyDescription: 'LINAC VMAT PLANNING CT 120kV',
    modality: 'CT', numSeries: 2, numInstances: 256,
    institution: 'Hospital General de Mexico', radiationDose: { ctdivol: 12.8, dlp: 680 },
    shieldingRelevant: true,
  },
  {
    studyInstanceUID: '1.2.840.113619.2.55.3.2831164358.123.1234567890.4',
    patientName: 'DEMO^PACIENTE 04', patientID: 'PAT-2024-004',
    accessionNumber: 'ACC-2024-00004', studyDate: '2026-05-27',
    studyDescription: 'SPECT MYOCARDIAL PERFUSION REST STRESS',
    modality: 'NM', numSeries: 4, numInstances: 180,
    institution: 'Hospital Juarez de Mexico', shieldingRelevant: true,
  },
  {
    studyInstanceUID: '1.2.840.113619.2.55.3.2831164358.123.1234567890.5',
    patientName: 'DEMO^PACIENTE 05', patientID: 'PAT-2024-005',
    accessionNumber: 'ACC-2024-00005', studyDate: '2026-06-01',
    studyDescription: 'XR CHEST PA AND LATERAL',
    modality: 'XR', numSeries: 1, numInstances: 2,
    institution: 'Hospital General de Mexico', shieldingRelevant: false,
  },
  {
    studyInstanceUID: '1.2.840.113619.2.55.3.2831164358.123.1234567890.6',
    patientName: 'DEMO^PACIENTE 06', patientID: 'PAT-2024-006',
    accessionNumber: 'ACC-2024-00006', studyDate: '2026-06-01',
    studyDescription: 'CBCT PLANNING HEAD AND NECK',
    modality: 'CT', numSeries: 1, numInstances: 384,
    institution: 'Instituto Nacional de Cancerologia', radiationDose: { ctdivol: 6.2, dlp: 310 },
    shieldingRelevant: true,
  },
  {
    studyInstanceUID: '1.2.840.113619.2.55.3.2831164358.123.1234567890.7',
    patientName: 'DEMO^PACIENTE 07', patientID: 'PAT-2024-007',
    accessionNumber: 'ACC-2024-00007', studyDate: '2026-05-31',
    studyDescription: 'BUNKER RADIATION SURVEY DOSE MAP',
    modality: 'OT', numSeries: 1, numInstances: 12,
    institution: 'Hospital de Oncologia CMN SXXI', shieldingRelevant: true,
  },
  {
    studyInstanceUID: '1.2.840.113619.2.55.3.2831164358.123.1234567890.8',
    patientName: 'DEMO^PACIENTE 08', patientID: 'PAT-2024-008',
    accessionNumber: 'ACC-2024-00008', studyDate: '2026-05-30',
    studyDescription: 'MAMMOGRAPHY BILATERAL CC MLO',
    modality: 'MG', numSeries: 2, numInstances: 8,
    institution: 'Hospital General de Mexico', shieldingRelevant: false,
  },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function PACSIntegrationDialog({ open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedVendor, setSelectedVendor] = useState<string>('orthanc');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'patientName' | 'patientID' | 'accessionNumber' | 'modality' | 'studyDescription'>('patientName');
  const [studies, setStudies] = useState<DICOMStudy[]>(MOCK_STUDIES);
  const [selectedStudy, setSelectedStudy] = useState<DICOMStudy | null>(null);
  const [importedStudies, setImportedStudies] = useState<DICOMStudy[]>([]);
  const [pacsHost, setPacsHost] = useState('');
  const [pacsPort, setPacsPort] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [useLocalArchive, setUseLocalArchive] = useState(false);

  const vendor = PACS_VENDORS.find(v => v.id === selectedVendor);

  const connect = useCallback(() => {
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
      toast.success(`Connected to ${vendor?.name}`);
    }, 1500);
  }, [vendor]);

  const disconnect = useCallback(() => {
    setConnectionStatus('disconnected');
    setSelectedStudy(null);
    toast.info('Disconnected from PACS');
  }, []);

  const performSearch = useCallback(() => {
    if (connectionStatus !== 'connected' && !useLocalArchive) {
      toast.error('Connect to PACS first or enable local archive');
      return;
    }
    const filtered = MOCK_STUDIES.filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      switch (searchField) {
        case 'patientName': return s.patientName.toLowerCase().includes(q);
        case 'patientID': return s.patientID.toLowerCase().includes(q);
        case 'accessionNumber': return s.accessionNumber.toLowerCase().includes(q);
        case 'modality': return s.modality.toLowerCase().includes(q);
        case 'studyDescription': return s.studyDescription.toLowerCase().includes(q);
        default: return true;
      }
    });
    setStudies(filtered);
    toast.success(`${filtered.length} studies found`);
  }, [searchQuery, searchField, connectionStatus, useLocalArchive]);

  const importStudy = useCallback((study: DICOMStudy) => {
    if (!importedStudies.find(s => s.studyInstanceUID === study.studyInstanceUID)) {
      setImportedStudies(prev => [...prev, study]);
      toast.success(`Imported: ${study.patientName} - ${study.studyDescription}`);
    } else {
      toast.info('Study already imported');
    }
  }, [importedStudies]);

  const downloadViaWADO = useCallback((study: DICOMStudy) => {
    const wadoUrl = `wadouri:${vendor?.protocol === 'DICOMweb' ? `http://${pacsHost || vendor?.host}:${pacsPort || vendor?.port}/wado` : ''}?requestType=WADO&studyUID=${study.studyInstanceUID}&rows=512&columns=512`;
    toast.success(`WADO-RS URL generated for ${study.patientName}`);
    navigator.clipboard.writeText(wadoUrl);
  }, [vendor, pacsHost, pacsPort]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Server className="w-5 h-5 text-blue-500" />
            PACS Integration — SmartSearch DICOM Real
            <Badge variant="outline" className="text-[10px]">v1.1</Badge>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'} className="text-[10px] gap-1">
              {connectionStatus === 'connected' ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
              {connectionStatus}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <DatosEjemploBanner detalle="Los estudios mostrados sin servidor son de demostración y están anonimizados." />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-4 w-full shrink-0">
            <TabsTrigger value="search" className="text-xs gap-1"><Search className="w-3.5 h-3.5" />SmartSearch</TabsTrigger>
            <TabsTrigger value="connection" className="text-xs gap-1"><Plug className="w-3.5 h-3.5" />Connection</TabsTrigger>
            <TabsTrigger value="archive" className="text-xs gap-1"><HardDrive className="w-3.5 h-3.5" />Local Archive</TabsTrigger>
            <TabsTrigger value="about" className="text-xs gap-1"><Globe className="w-3.5 h-3.5" />About</TabsTrigger>
          </TabsList>

          {/* SEARCH TAB */}
          <TabsContent value="search" className="flex-1 flex flex-col min-h-0 mt-2 gap-2">
            {/* Search bar */}
            <div className="flex items-center gap-2 shrink-0">
              <Select value={searchField} onValueChange={(v) => setSearchField(v as any)}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="patientName" className="text-xs">Patient Name</SelectItem>
                  <SelectItem value="patientID" className="text-xs">Patient ID</SelectItem>
                  <SelectItem value="accessionNumber" className="text-xs">Accession #</SelectItem>
                  <SelectItem value="modality" className="text-xs">Modality</SelectItem>
                  <SelectItem value="studyDescription" className="text-xs">Description</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="text"
                placeholder={`Search by ${searchField}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && performSearch()}
                className="flex-1 h-8 px-3 border rounded text-xs"
              />
              <Button size="sm" className="h-8 text-xs gap-1" onClick={performSearch}>
                <Search className="w-3 h-3" />Search
              </Button>
              <div className="flex items-center gap-2 ml-2">
                <Switch checked={useLocalArchive} onCheckedChange={setUseLocalArchive} id="local" />
                <Label htmlFor="local" className="text-[10px] cursor-pointer">Local</Label>
              </div>
            </div>

            {/* Studies list */}
            <ScrollArea className="flex-1 border rounded">
              <div className="p-2 space-y-1">
                {studies.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-xs">No studies found</div>
                ) : (
                  studies.map(study => (
                    <div
                      key={study.studyInstanceUID}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted transition-colors ${selectedStudy?.studyInstanceUID === study.studyInstanceUID ? 'bg-muted border' : ''}`}
                      onClick={() => setSelectedStudy(study)}
                    >
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                        study.modality === 'CT' ? 'bg-blue-500' : study.modality === 'PT' ? 'bg-amber-500' : study.modality === 'NM' ? 'bg-violet-500' : study.modality === 'XR' ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}>
                        {study.modality}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium truncate">{study.patientName}</span>
                          {study.shieldingRelevant && <Badge variant="outline" className="text-[8px] bg-amber-50 text-amber-700 border-amber-200">Shielding</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{study.studyDescription}</p>
                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                          <span>{study.patientID}</span>
                          <span>|</span>
                          <span>{study.studyDate}</span>
                          <span>|</span>
                          <span>{study.numInstances} imgs</span>
                          <span>|</span>
                          <span>{study.institution}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); downloadViaWADO(study); }} title="WADO-RS">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); importStudy(study); }} title="Import to project">
                          <Plug className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Selected study detail */}
            {selectedStudy && (
              <Card className="shrink-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-blue-500" />
                      {selectedStudy.patientName}
                      <Badge className="text-[9px]">{selectedStudy.modality}</Badge>
                    </CardTitle>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => importStudy(selectedStudy)}>
                      <Plug className="w-3 h-3" />Import to Project
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div><p className="text-[10px] text-muted-foreground">Study UID</p><p className="font-mono text-[10px] truncate">{selectedStudy.studyInstanceUID}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Description</p><p>{selectedStudy.studyDescription}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Date</p><p>{selectedStudy.studyDate}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Institution</p><p>{selectedStudy.institution}</p></div>
                  </div>
                  {selectedStudy.radiationDose && (
                    <div className="mt-2 p-2 bg-amber-50 rounded text-xs flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span><strong>Radiation Dose:</strong> CTDIvol = {selectedStudy.radiationDose.ctdivol} mGy | DLP = {selectedStudy.radiationDose.dlp} mGy·cm</span>
                      <Badge variant="outline" className="text-[9px]">Shielding Relevant</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* CONNECTION TAB */}
          <TabsContent value="connection" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Server className="w-4 h-4" />PACS Server Configuration</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div>
                      <Label className="text-[10px]">PACS Vendor / Type</Label>
                      <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PACS_VENDORS.map(v => <SelectItem key={v.id} value={v.id} className="text-xs">{v.name} ({v.protocol})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {vendor && (
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[10px]">Protocol</Label><p className="font-medium">{vendor.protocol}</p></div>
                        <div><Label className="text-[10px]">Auth</Label><p className="font-medium">{vendor.authType}</p></div>
                        <div><Label className="text-[10px]">QIDO-RS</Label><p className="font-medium">{vendor.supportsQIDO ? 'Yes' : 'No'}</p></div>
                        <div><Label className="text-[10px]">WADO-RS</Label><p className="font-medium">{vendor.supportsWADO ? 'Yes' : 'No'}</p></div>
                        <div><Label className="text-[10px]">STOW-RS</Label><p className="font-medium">{vendor.supportsSTOW ? 'Yes' : 'No'}</p></div>
                        <div><Label className="text-[10px]">Default Port</Label><p className="font-medium">{vendor.port}</p></div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-[10px]">Host</Label>
                        <input type="text" value={pacsHost} onChange={e => setPacsHost(e.target.value)}
                          placeholder={vendor?.host} className="w-full h-8 px-2 border rounded text-xs" /></div>
                      <div><Label className="text-[10px]">Port</Label>
                        <input type="text" value={pacsPort} onChange={e => setPacsPort(e.target.value)}
                          placeholder={String(vendor?.port)} className="w-full h-8 px-2 border rounded text-xs" /></div>
                    </div>
                    {vendor?.authType !== 'none' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[10px]">Username</Label>
                          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full h-8 px-2 border rounded text-xs" /></div>
                        <div><Label className="text-[10px]">Password / Token</Label>
                          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full h-8 px-2 border rounded text-xs" /></div>
                      </div>
                    )}
                    {vendor?.aet && (
                      <div><Label className="text-[10px]">Called AET (Application Entity Title)</Label>
                        <input type="text" value={vendor.aet} readOnly className="w-full h-8 px-2 border rounded text-xs bg-muted font-mono" /></div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs gap-1" onClick={connect} disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}>
                        {connectionStatus === 'connecting' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                        {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={disconnect} disabled={connectionStatus !== 'connected'}>
                        <WifiOff className="w-3 h-3" />Disconnect
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm">DICOMweb Endpoints</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-[10px] font-mono">
                    <p><strong>QIDO-RS (Query):</strong> GET {vendor?.protocol === 'DICOMweb' ? `http://${pacsHost || vendor?.host}:${pacsPort || vendor?.port}/rs/studies` : 'N/A'}</p>
                    <p><strong>WADO-RS (Retrieve):</strong> GET {vendor?.protocol === 'DICOMweb' ? `http://${pacsHost || vendor?.host}:${pacsPort || vendor?.port}/rs/studies/{studyUID}/series` : 'N/A'}</p>
                    <p><strong>STOW-RS (Store):</strong> POST {vendor?.protocol === 'DICOMweb' ? `http://${pacsHost || vendor?.host}:${pacsPort || vendor?.port}/rs/studies` : 'N/A'}</p>
                    {vendor?.protocol === 'DIMSE' && (
                      <div className="text-amber-600 mt-2">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        DIMSE requires WebSocket bridge or native C++ addon. Use DICOMweb when possible.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ARCHIVE TAB */}
          <TabsContent value="archive" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Folders className="w-4 h-4" />Imported Studies</h3>
                  <Badge variant="outline" className="text-[10px]">{importedStudies.length} studies</Badge>
                </div>
                {importedStudies.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-xs">
                    <HardDrive className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No studies imported yet</p>
                    <p className="text-[10px]">Search and import studies from the SmartSearch tab</p>
                  </div>
                ) : (
                  importedStudies.map(study => (
                    <Card key={study.studyInstanceUID} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Badge className="text-[9px]">{study.modality}</Badge>
                          <span className="text-xs font-medium">{study.patientName}</span>
                          <span className="text-[10px] text-muted-foreground">{study.studyDescription}</span>
                          <div className="flex-1" />
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => { setSelectedStudy(study); setActiveTab('search'); }}>
                            <Eye className="w-3 h-3" />View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ABOUT TAB */}
          <TabsContent value="about" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2 text-xs">
                <Card>
                  <CardHeader><CardTitle className="text-sm">PACS Integration v1.1</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p>Real-time integration with PACS (Picture Archiving and Communication Systems) for retrieving DICOM studies relevant to radiation shielding calculations.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/30 p-2 rounded"><strong className="flex items-center gap-1"><Globe className="w-3 h-3" />DICOMweb (RESTful)</strong><p className="text-[10px] mt-1">QIDO-RS for query, WADO-RS for retrieve, STOW-RS for storage. Recommended modern approach.</p></div>
                      <div className="bg-muted/30 p-2 rounded"><strong className="flex items-center gap-1"><Link className="w-3 h-3" />DIMSE (Traditional)</strong><p className="text-[10px] mt-1">C-FIND, C-MOVE, C-GET over TCP. Legacy but widely supported. Requires C++ bridge for browser.</p></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Supported PACS Vendors</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    {PACS_VENDORS.map(v => (
                      <div key={v.id} className="flex items-center gap-2 py-1 border-b last:border-0">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span className="font-medium">{v.name}</span>
                        <Badge variant="outline" className="text-[9px]">{v.protocol}</Badge>
                        <div className="flex-1" />
                        <span className="text-[10px] text-muted-foreground">Port {v.port}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Shielding-Relevant Modalities</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-4 gap-2 text-[10px]">
                    {[{ m: 'CT', desc: 'Computed Tomography', relevant: true }, { m: 'PT', desc: 'PET/CT', relevant: true }, { m: 'NM', desc: 'Nuclear Medicine', relevant: true }, { m: 'RT', desc: 'Radiotherapy', relevant: true }, { m: 'XR', desc: 'General X-Ray', relevant: false }, { m: 'MG', desc: 'Mammography', relevant: false }, { m: 'RF', desc: 'Fluoroscopy', relevant: true }, { m: 'OT', desc: 'Other (Dose Maps)', relevant: true }].map(item => (
                      <div key={item.m} className={`p-2 rounded text-center ${item.relevant ? 'bg-amber-50 border border-amber-200' : 'bg-muted/30'}`}>
                        <Badge className="text-[9px]">{item.m}</Badge>
                        <p className="mt-1">{item.desc}</p>
                        {item.relevant && <p className="text-amber-600 text-[9px]">Shielding relevant</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
