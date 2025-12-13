/**
 * API client for FreshSilver backend
 * Falls back to localStorage if API is not configured
 */

const API_URL = import.meta.env.VITE_API_URL || '';

// Generate or retrieve a unique visitor ID for this browser
function getVisitorId(): string {
  let id = localStorage.getItem('freshsilver-visitor-id');
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('freshsilver-visitor-id', id);
  }
  return id;
}

export const visitorId = getVisitorId();

export interface ChatMessage {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  color: string;
}

export interface RSVPEntry {
  id: string;
  name: string;
  timestamp: number;
  color: string;
  visitorId?: string;
}

// Check if API is available
export const isApiConfigured = (): boolean => !!API_URL;

// ============ Messages API ============

export async function fetchMessages(): Promise<ChatMessage[]> {
  if (!API_URL) {
    // Fallback to localStorage
    const stored = localStorage.getItem('freshsilver-messages');
    return stored ? JSON.parse(stored) : [];
  }

  try {
    const response = await fetch(`${API_URL}/messages`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('API error, falling back to localStorage:', error);
    const stored = localStorage.getItem('freshsilver-messages');
    return stored ? JSON.parse(stored) : [];
  }
}

export async function postMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage | null> {
  if (!API_URL) {
    // Fallback to localStorage
    const newMsg: ChatMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    const stored = localStorage.getItem('freshsilver-messages');
    const messages = stored ? JSON.parse(stored) : [];
    const updated = [...messages, newMsg].slice(-50);
    localStorage.setItem('freshsilver-messages', JSON.stringify(updated));
    
    // Broadcast to other tabs
    const channel = new BroadcastChannel('freshsilver-chat');
    channel.postMessage({ type: 'new-message', message: newMsg });
    channel.close();
    
    return newMsg;
  }

  try {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error('Failed to post message');
    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('API error:', error);
    return null;
  }
}

// ============ RSVP API ============

export async function fetchRSVP(eventId: string): Promise<RSVPEntry[]> {
  if (!API_URL) {
    const stored = localStorage.getItem(`freshsilver-rsvp-${eventId}`);
    return stored ? JSON.parse(stored) : [];
  }

  try {
    const response = await fetch(`${API_URL}/rsvp/${eventId}`);
    if (!response.ok) throw new Error('Failed to fetch RSVP');
    const data = await response.json();
    return data.attendees || [];
  } catch (error) {
    console.error('API error, falling back to localStorage:', error);
    const stored = localStorage.getItem(`freshsilver-rsvp-${eventId}`);
    return stored ? JSON.parse(stored) : [];
  }
}

export async function addRSVP(eventId: string, name: string, color: string): Promise<RSVPEntry | null> {
  if (!API_URL) {
    // Fallback to localStorage
    const entry: RSVPEntry = {
      id: `${eventId}-${visitorId}`,
      name,
      color,
      timestamp: Date.now(),
      visitorId,
    };
    const stored = localStorage.getItem(`freshsilver-rsvp-${eventId}`);
    const attendees = stored ? JSON.parse(stored) : [];
    const updated = [...attendees.filter((a: RSVPEntry) => a.visitorId !== visitorId), entry];
    localStorage.setItem(`freshsilver-rsvp-${eventId}`, JSON.stringify(updated));
    localStorage.setItem(`freshsilver-rsvp-${eventId}-myId`, visitorId);
    
    // Broadcast
    const channel = new BroadcastChannel(`freshsilver-rsvp-${eventId}`);
    channel.postMessage({ type: 'rsvp-update', attendees: updated });
    channel.close();
    
    return entry;
  }

  try {
    const response = await fetch(`${API_URL}/rsvp/${eventId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Visitor-Id': visitorId,
      },
      body: JSON.stringify({ name, color }),
    });
    if (!response.ok) throw new Error('Failed to add RSVP');
    const data = await response.json();
    localStorage.setItem(`freshsilver-rsvp-${eventId}-myId`, visitorId);
    return data.rsvp;
  } catch (error) {
    console.error('API error:', error);
    return null;
  }
}

export async function removeRSVP(eventId: string): Promise<boolean> {
  const myVisitorId = localStorage.getItem(`freshsilver-rsvp-${eventId}-myId`) || visitorId;
  
  if (!API_URL) {
    // Fallback to localStorage
    const stored = localStorage.getItem(`freshsilver-rsvp-${eventId}`);
    const attendees = stored ? JSON.parse(stored) : [];
    const updated = attendees.filter((a: RSVPEntry) => a.visitorId !== myVisitorId);
    localStorage.setItem(`freshsilver-rsvp-${eventId}`, JSON.stringify(updated));
    localStorage.removeItem(`freshsilver-rsvp-${eventId}-myId`);
    
    // Broadcast
    const channel = new BroadcastChannel(`freshsilver-rsvp-${eventId}`);
    channel.postMessage({ type: 'rsvp-update', attendees: updated });
    channel.close();
    
    return true;
  }

  try {
    const response = await fetch(`${API_URL}/rsvp/${eventId}/${myVisitorId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove RSVP');
    localStorage.removeItem(`freshsilver-rsvp-${eventId}-myId`);
    return true;
  } catch (error) {
    console.error('API error:', error);
    return false;
  }
}

export function getMyRSVPId(eventId: string): string | null {
  return localStorage.getItem(`freshsilver-rsvp-${eventId}-myId`);
}
