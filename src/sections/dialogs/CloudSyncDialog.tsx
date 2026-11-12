// =============================================================================
// CloudSyncDialog.tsx — Cloud Synchronization & Project Management
// Backend API client with offline support and sync queue
// =============================================================================
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Cloud, CloudOff, Download, RefreshCw, User, CheckCircle, AlertTriangle, LogOut,
  Globe, Shield
} from 'lucide-react';
import {
  apiHealthCheck, apiLogin, apiRegister, apiListProjects,
  apiGetCurrentUser, apiSyncAll, apiGetSyncStatus,
  type CloudUser, type CloudProject, type SyncStatus,
} from '@/lib/cloudSync';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function CloudSyncDialog({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState<'status' | 'login' | 'projects'>('status');
  const [user, setUser] = useState<CloudUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regInstitution, setRegInstitution] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const checkHealth = async () => {
    const h = await apiHealthCheck();
    setServerStatus(h.status === 'ok' ? 'online' : 'offline');
  };

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const [projs, status] = await Promise.all([apiListProjects(), apiGetSyncStatus()]);
      setProjects(projs);
      setSyncStatus(status);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load');
    } finally { setIsLoading(false); }
  };

  const checkAuth = useCallback(async () => {
    const u = await apiGetCurrentUser();
    setUser(u);
    if (u) { setTab('projects'); loadProjects(); }
  }, []);

  useEffect(() => { if (open) { checkHealth(); checkAuth(); } }, [open, checkAuth]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const data = await apiLogin(loginEmail, loginPassword);
      setUser(data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      setTab('projects');
      loadProjects();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsLoading(false); }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const data = await apiRegister(regName, regEmail, regPassword, regInstitution);
      setUser(data.user);
      toast.success('Account created successfully!');
      setTab('projects');
    } catch (err: any) { toast.error(err.message); }
    finally { setIsLoading(false); }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const status = await apiSyncAll();
      setSyncStatus(status);
      toast.success('Sync complete!');
    } catch (err: any) { toast.error(err.message); }
    finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    setUser(null);
    setTab('status');
    setProjects([]);
    toast.success('Logged out');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced': return <Badge className="bg-emerald-500"><CheckCircle className="h-3 w-3 mr-1" />Synced</Badge>;
      case 'syncing': return <Badge className="bg-blue-500"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Syncing</Badge>;
      case 'conflict': return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Conflict</Badge>;
      case 'offline': return <Badge variant="secondary"><CloudOff className="h-3 w-3 mr-1" />Offline</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Cloud className="h-5 w-5 text-sky-500" />
            Cloud Sync & Backup
          </DialogTitle>
        </DialogHeader>

        {/* Status Bar */}
        <div className="flex items-center gap-2 text-xs mb-2">
          <Badge variant={serverStatus === 'online' ? 'default' : 'secondary'} className="text-[10px]">
            <Globe className="h-2.5 w-2.5 mr-0.5" />
            {serverStatus === 'online' ? 'Server Online' : 'Server Offline'}
          </Badge>
          {syncStatus && getStatusBadge(syncStatus.status)}
          {user && (
            <Badge variant="outline" className="text-[10px] ml-auto">
              <User className="h-2.5 w-2.5 mr-0.5" />
              {user.name}
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            {/* User Actions */}
            {user ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSync} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync Now
                </Button>
                <Button size="sm" variant="outline" onClick={loadProjects} disabled={isLoading}>
                  <Download className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="pt-4 text-center">
                  <CloudOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Not Connected</p>
                  <p className="text-xs text-muted-foreground mb-3">Login to sync projects to cloud</p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={() => { setTab('login'); setShowRegister(false); }}>
                      <User className="h-4 w-4 mr-1" />Login
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setTab('login'); setShowRegister(true); }}>
                      Register
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Login / Register Form */}
            {!user && tab === 'login' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{showRegister ? 'Create Account' : 'Login'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {showRegister && (
                    <>
                      <Input placeholder="Full Name" value={regName} onChange={e => setRegName(e.target.value)} />
                      <Input placeholder="Institution" value={regInstitution} onChange={e => setRegInstitution(e.target.value)} />
                    </>
                  )}
                  <Input placeholder="Email" type="email" value={showRegister ? regEmail : loginEmail}
                    onChange={e => showRegister ? setRegEmail(e.target.value) : setLoginEmail(e.target.value)} />
                  <Input placeholder="Password" type="password"
                    value={showRegister ? regPassword : loginPassword}
                    onChange={e => showRegister ? setRegPassword(e.target.value) : setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (showRegister ? handleRegister() : handleLogin())}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={showRegister ? handleRegister : handleLogin} disabled={isLoading}>
                      {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : showRegister ? 'Register' : 'Login'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowRegister(!showRegister)}>
                      {showRegister ? 'Have account? Login' : 'Need account? Register'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project List */}
            {user && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Cloud Projects ({projects.length})</h4>
                  {projects.length === 0 && (
                    <p className="text-xs text-muted-foreground">No cloud projects yet. Save a project to sync.</p>
                  )}
                  {projects.map(p => (
                    <Card key={p.id}>
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">v{p.version} • {new Date(p.updatedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.success(`Downloading ${p.name}...`)}>
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Sync Status Details */}
            {syncStatus && (
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Sync Details</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Status:</span> <span>{syncStatus.status}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Last sync:</span> <span>{syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleString() : 'Never'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Pending changes:</span> <span>{syncStatus.pendingChanges}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Server projects:</span> <span>{syncStatus.serverProjects}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Local projects:</span> <span>{syncStatus.localProjects}</span></div>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cloud Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Project backup</div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Cross-device sync</div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Audit trail</div>
                  <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-amber-500" /> End-to-end encryption</div>
                  <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-amber-500" /> Team sharing</div>
                  <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-amber-500" /> Version history</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
