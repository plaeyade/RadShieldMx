/**
 * useBroadcastChannel — Broadcast Channel API
 * Sincroniza estado entre pestañas del navegador en tiempo real
 * Útil para: colaboración, undo/redo cross-tab, notificaciones
 * Chrome 54+, Firefox 38+, Safari 15.4+
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const CHANNEL_NAME = 'radshield-mx-sync';

interface ChannelMessage {
  type: 'floorplan-update' | 'calculation-result' | 'project-loaded' | 'barrier-added' | 'undo-request' | 'ping' | 'pong';
  tabId: string;
  timestamp: number;
  payload?: any;
}

export function useBroadcastChannel() {
  const [isConnected, setIsConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef(`tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const peersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('Broadcast Channel API no disponible');
      return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    // Announce presence
    channel.postMessage({
      type: 'ping',
      tabId: tabIdRef.current,
      timestamp: Date.now(),
    } as ChannelMessage);

    const handleMessage = (event: MessageEvent<ChannelMessage>) => {
      const msg = event.data;
      if (!msg || msg.tabId === tabIdRef.current) return;

      switch (msg.type) {
        case 'ping':
          peersRef.current.add(msg.tabId);
          setPeerCount(peersRef.current.size);
          setIsConnected(true);
          // Respond with pong
          channel.postMessage({
            type: 'pong',
            tabId: tabIdRef.current,
            timestamp: Date.now(),
          });
          break;
        case 'pong':
          peersRef.current.add(msg.tabId);
          setPeerCount(peersRef.current.size);
          setIsConnected(true);
          break;
        case 'floorplan-update':
          toast.info('Otra pestaña actualizó el plano', {
            description: 'Recarga para sincronizar',
            action: { label: 'Recargar', onClick: () => window.location.reload() },
          });
          break;
        case 'calculation-result':
          toast.success('Cálculo completado en otra pestaña', {
            description: msg.payload?.description || '',
          });
          break;
        case 'project-loaded':
          toast.info(`Proyecto cargado en otra pestaña: ${msg.payload?.name || ''}`);
          break;
        case 'barrier-added':
          toast.info('Nueva barrera añadida desde otra pestaña');
          break;
      }
    };

    channel.addEventListener('message', handleMessage);

    // Heartbeat
    const heartbeat = setInterval(() => {
      channel.postMessage({
        type: 'ping',
        tabId: tabIdRef.current,
        timestamp: Date.now(),
      });
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      channel.removeEventListener('message', handleMessage);
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const broadcast = useCallback((type: ChannelMessage['type'], payload?: any) => {
    if (!channelRef.current) return;
    channelRef.current.postMessage({
      type,
      tabId: tabIdRef.current,
      timestamp: Date.now(),
      payload,
    } as ChannelMessage);
  }, []);

  return {
    isConnected,
    peerCount,
    tabId: tabIdRef.current,
    broadcast,
  };
}
