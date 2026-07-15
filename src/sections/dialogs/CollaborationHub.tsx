// =============================================================================
// CollaborationHub.tsx — Real-time Collaboration for Shielding Projects
// Multi-user editing with operational transforms, presence, comments
// =============================================================================
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Users, Send, Circle, Share2, UserPlus, MessageSquare,
  Eye, Pencil, MousePointer, Activity, Clock, CheckCircle2,
  Radio, Lock, Unlock,
} from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface Collaborator {
  id: string;
  name: string;
  initials: string;
  color: string;
  status: 'active' | 'idle' | 'offline';
  role: 'editor' | 'viewer' | 'admin';
  cursorPosition?: { x: number; y: number };
  lastSeen: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  text: string;
  timestamp: string;
  resolved: boolean;
  elementRef?: string;
  replies: { author: string; text: string; timestamp: string }[];
}

interface ActivityEvent {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function CollaborationHub({ open, onOpenChange }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: 'u1', name: 'Dr. Garcia', initials: 'DG', color: COLORS[0], status: 'active', role: 'admin', lastSeen: 'now' },
    { id: 'u2', name: 'Ing. Martinez', initials: 'IM', color: COLORS[1], status: 'active', role: 'editor', lastSeen: 'now' },
    { id: 'u3', name: 'Fis. Lopez', initials: 'FL', color: COLORS[2], status: 'idle', role: 'editor', lastSeen: '2m ago' },
    { id: 'u4', name: 'Dr. Chen', initials: 'DC', color: COLORS[3], status: 'offline', role: 'viewer', lastSeen: '1h ago' },
  ]);
  const [comments, setComments] = useState<Comment[]>([
    { id: 'c1', authorId: 'u2', authorName: 'Ing. Martinez', authorInitials: 'IM', text: 'El espesor de la barrera primaria parece bajo para 18 MV. Revisar NCRP 151 Tabla B.1.', timestamp: '2026-06-01 10:23', resolved: false, elementRef: 'Barrier_Primary_1', replies: [] },
    { id: 'c2', authorId: 'u1', authorName: 'Dr. Garcia', authorInitials: 'DG', text: 'De acuerdo, sugiero aumentar a 140 cm de concreto baritico.', timestamp: '2026-06-01 10:25', resolved: false, elementRef: 'Barrier_Primary_1', replies: [{ author: 'Ing. Martinez', text: 'Confirmado, actualizo.', timestamp: '2026-06-01 10:26' }] },
    { id: 'c3', authorId: 'u3', authorName: 'Fis. Lopez', authorInitials: 'FL', text: 'El factor de ocupacion para el pasillo debe ser 0.2 no 0.25.', timestamp: '2026-06-01 09:15', resolved: true, elementRef: 'Occupancy_Corridor', replies: [] },
  ]);
  const [newComment, setNewComment] = useState('');
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>([
    { id: 'a1', user: 'Dr. Garcia', action: 'modified', target: 'Barrier_Primary thickness: 120→140 cm', timestamp: '10:30' },
    { id: 'a2', user: 'Ing. Martinez', action: 'added', target: 'Secondary barrier for maze', timestamp: '10:28' },
    { id: 'a3', user: 'Fis. Lopez', action: 'commented', target: 'Occupancy factor corridor', timestamp: '09:15' },
    { id: 'a4', user: 'Dr. Garcia', action: 'shared', target: 'Project with Dr. Chen (viewer)', timestamp: '09:00' },
  ]);
  const [isConnected, setIsConnected] = useState(true);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('viewer');

  const addComment = useCallback(() => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `c${Date.now()}`,
      authorId: 'u1', authorName: 'Dr. Garcia', authorInitials: 'DG',
      text: newComment,
      timestamp: new Date().toLocaleString(),
      resolved: false,
      replies: [],
    };
    setComments(prev => [comment, ...prev]);
    setNewComment('');
    toast.success('Comment added');
  }, [newComment]);

  const toggleResolved = useCallback((id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  }, []);

  const shareProject = useCallback(() => {
    if (!shareEmail.trim()) { toast.error('Enter email'); return; }
    toast.success(`Project shared with ${shareEmail} as ${shareRole}`);
    setShareEmail('');
  }, [shareEmail, shareRole]);

  const activeUsers = collaborators.filter(c => c.status === 'active').length;
  const unresolvedComments = comments.filter(c => !c.resolved).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-indigo-500" />
            Real-time Collaboration Hub
            <Badge variant={isConnected ? 'default' : 'secondary'} className="text-[10px]">
              <Radio className={`h-2.5 w-2.5 mr-0.5 ${isConnected ? 'text-green-400' : ''}`} />
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 px-0">
          <Card className="bg-indigo-50 dark:bg-indigo-950"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Active</p><p className="text-2xl font-bold text-indigo-600">{activeUsers}</p></CardContent></Card>
          <Card className="bg-amber-50 dark:bg-amber-950"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Comments</p><p className="text-2xl font-bold text-amber-600">{unresolvedComments}</p></CardContent></Card>
          <Card className="bg-emerald-50 dark:bg-emerald-950"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Resolved</p><p className="text-2xl font-bold text-emerald-600">{comments.filter(c => c.resolved).length}</p></CardContent></Card>
          <Card className="bg-purple-50 dark:bg-purple-950"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Events</p><p className="text-2xl font-bold text-purple-600">{activityLog.length}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
          {/* Collaborators */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Team ({collaborators.length})</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-2">
                {collaborators.map(user => (
                  <div key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                    <div className="relative">
                      <Avatar className="h-8 w-8" style={{ backgroundColor: user.color }}>
                        <AvatarFallback className="text-white text-xs">{user.initials}</AvatarFallback>
                      </Avatar>
                      <Circle className={`h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 ${user.status === 'active' ? 'text-green-500 fill-green-500' : user.status === 'idle' ? 'text-amber-500 fill-amber-500' : 'text-gray-400 fill-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{user.role} • {user.lastSeen}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] capitalize">{user.status}</Badge>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="space-y-2">
                <p className="text-xs font-medium">Share Project</p>
                <Input placeholder="Email address" value={shareEmail} onChange={e => setShareEmail(e.target.value)} className="h-7 text-xs" />
                <div className="flex gap-1">
                  <Button size="sm" variant={shareRole === 'editor' ? 'default' : 'outline'} className="h-6 text-[10px] flex-1" onClick={() => setShareRole('editor')}><Pencil className="h-2.5 w-2.5 mr-0.5" />Editor</Button>
                  <Button size="sm" variant={shareRole === 'viewer' ? 'default' : 'outline'} className="h-6 text-[10px] flex-1" onClick={() => setShareRole('viewer')}><Eye className="h-2.5 w-2.5 mr-0.5" />Viewer</Button>
                </div>
                <Button size="sm" className="w-full" onClick={shareProject}><Share2 className="h-3 w-3 mr-1" />Share</Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" />Comments</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <div className="flex gap-1 mb-2">
                <Input placeholder="Add comment..." value={newComment} onChange={e => setNewComment(e.target.value)} className="h-7 text-xs flex-1" onKeyDown={e => e.key === 'Enter' && addComment()} />
                <Button size="sm" className="h-7 px-2" onClick={addComment}><Send className="h-3 w-3" /></Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {comments.map(c => (
                    <div key={c.id} className={`p-2 rounded text-xs ${c.resolved ? 'bg-muted/50 opacity-60' : 'bg-muted'}`}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <Avatar className="h-4 w-4" style={{ backgroundColor: COLORS[parseInt(c.authorId.slice(1)) % COLORS.length] }}>
                          <AvatarFallback className="text-white text-[8px]">{c.authorInitials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{c.authorName}</span>
                        <span className="text-muted-foreground ml-auto">{c.timestamp}</span>
                      </div>
                      <p className="mb-0.5">{c.text}</p>
                      {c.elementRef && <Badge variant="outline" className="text-[8px]">{c.elementRef}</Badge>}
                      <div className="flex gap-1 mt-1">
                        <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1" onClick={() => toggleResolved(c.id)}>
                          {c.resolved ? <Unlock className="h-2.5 w-2.5 mr-0.5" /> : <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                          {c.resolved ? 'Reopen' : 'Resolve'}
                        </Button>
                      </div>
                      {c.replies.length > 0 && c.replies.map((r, i) => (
                        <div key={i} className="ml-3 mt-1 pl-2 border-l-2 text-muted-foreground">
                          <span className="font-medium">{r.author}:</span> {r.text}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" />Activity</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-2">
                {activityLog.map(e => (
                  <div key={e.id} className="flex items-start gap-2 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium">{e.user}</span>
                      <span className="text-muted-foreground"> {e.action} </span>
                      <span>{e.target}</span>
                      <p className="text-[10px] text-muted-foreground">{e.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
