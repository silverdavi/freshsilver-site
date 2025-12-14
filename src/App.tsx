import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './App.module.css'
import * as api from './api'
import type { ChatMessage, RSVPEntry } from './api'

interface DayEvent {
  time?: string
  title: string
  location?: string
  emoji?: string
  description?: string
  mapUrl?: string
}

interface TripDay {
  date: string
  dayOfWeek: string
  location: string
  events: DayEvent[]
  sleepingIn: string
}

const ISRAEL_TRIP: TripDay[] = [
  {
    date: 'Dec 29',
    dayOfWeek: 'Monday',
    location: 'JFK → Tel Aviv',
    sleepingIn: 'In Flight ✈️',
    events: [
      { time: '08:30', title: 'Leave house', emoji: '🏠', description: 'Poughkeepsie → JFK (~2 hours drive)' },
      { time: '10:30', title: 'Arrive JFK Terminal 4', emoji: '🛫', description: 'El Al check-in & security (3 hours before)' },
      { 
        time: '13:30', 
        title: 'Flight LY10 Departs', 
        emoji: '✈️', 
        location: 'JFK Terminal 4 → Ben Gurion T3',
        description: '10h 5m flight • Seat 04A • Vegan meal 🥗'
      },
    ]
  },
  {
    date: 'Dec 30',
    dayOfWeek: 'Tuesday',
    location: 'Safed → Haifa',
    sleepingIn: 'Haifa Hotel 🏨',
    events: [
      { time: '06:35', title: 'Land at Ben Gurion T3', emoji: '🛬', description: 'After 10h 5m flight' },
      { time: '~07:30', title: 'Pick up rental car', emoji: '🚗', description: 'Immigration + baggage + car rental' },
      { time: 'Morning', title: 'Drive to Safed', emoji: '🚗', description: '~2 hours north' },
      { time: 'Late Morning', title: 'Family in Safed', emoji: '👨‍👩‍👧', location: 'Safed', mapUrl: 'https://maps.google.com/?q=Safed,Israel' },
      { time: 'Noon', title: 'Visit Safsufa', emoji: '🏘️', location: 'Safsufa', mapUrl: 'https://maps.google.com/?q=Safsufa,Israel', description: 'On the way to Haifa' },
      { time: 'Afternoon', title: 'Visit Tal', emoji: '👋', location: 'Haifa area' },
      { time: 'Evening', title: 'Irrelevant Group meetup', emoji: '🍻', location: 'Haifa', description: 'With the Haifa gang' },
    ]
  },
  {
    date: 'Dec 31',
    dayOfWeek: 'Wednesday',
    location: 'Haifa → Tel Aviv',
    sleepingIn: 'Tel Aviv Hotel 🏨',
    events: [
      { time: 'Morning', title: 'Canotera Work', emoji: '💼', location: 'Canotera Office, Haifa', description: 'Working from the office in the morning 🏢' },
      { time: 'Afternoon', title: 'Drive to Tel Aviv', emoji: '🚗', description: '~1 hour south' },
      { time: '17:00–20:00', title: 'Dan Snooker Club 147', emoji: '🎱', location: 'Tel Aviv', description: 'Pool & snooker with friends' },
      { 
        time: '19:30–22:30', 
        title: 'NYE Karaoke Party! 🎤', 
        emoji: '🎉', 
        location: 'BitBox Karaoke, Hashmonaim 90, Tel Aviv',
        description: '13 friends • Private room • 2 drinks + unlimited snacks',
        mapUrl: 'https://maps.google.com/?q=Hashmonaim+90+Tel+Aviv'
      },
    ]
  },
  {
    date: 'Jan 1',
    dayOfWeek: 'Thursday',
    location: 'Central → Airport',
    sleepingIn: 'In Flight ✈️',
    events: [
      { time: '08:30', title: 'Visit Amos', emoji: '👤', location: 'Maasiyahu', description: 'Morning visit' },
      { time: 'Noon', title: 'Visit cousins & lunch', emoji: '👨‍👩‍👧‍👦', location: 'Ramat Gan' },
      { time: 'Afternoon', title: 'Visit friends', emoji: '👋', location: "Giva'at Ze'ev", mapUrl: 'https://maps.google.com/?q=Givat+Zeev,Israel' },
      { time: '~20:30', title: 'Arrive Ben Gurion T3', emoji: '🛫', description: 'El Al security (3+ hours before midnight flight)' },
      { 
        time: '00:05', 
        title: 'Flight LY3 Departs', 
        emoji: '✈️', 
        location: 'Ben Gurion T3 → JFK T4',
        description: '12h flight • Seat 13H'
      },
    ]
  },
  {
    date: 'Jan 2',
    dayOfWeek: 'Friday',
    location: 'Home',
    sleepingIn: 'Home 🏠',
    events: [
      { time: '05:05', title: 'Land at JFK Terminal 4', emoji: '🛬', description: 'After 12h flight' },
      { time: '~06:30', title: 'Immigration & baggage', emoji: '🧳' },
      { time: '~08:00', title: 'Uber/Train home', emoji: '🚂', description: '~2 hours to Poughkeepsie' },
      { time: '~10:00', title: 'Arrive home', emoji: '🏠' },
      { title: 'Rest & recover', emoji: '😴', description: 'Jet lag recovery day' },
    ]
  },
]

// Anonymous animal names for chat
const ANIMALS = ['Fox', 'Wolf', 'Bear', 'Eagle', 'Hawk', 'Owl', 'Lion', 'Tiger', 'Panda', 'Koala', 'Otter', 'Seal', 'Dolphin', 'Whale', 'Shark', 'Raven', 'Crow', 'Falcon', 'Phoenix', 'Dragon']
const COLORS = ['#E11D48', '#DB2777', '#9333EA', '#6366F1', '#0EA5E9', '#14B8A6', '#22C55E', '#EAB308', '#F97316', '#EF4444']

function getRandomAnimal(): string {
  return ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
}

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function getStoredIdentity() {
  const stored = localStorage.getItem('freshsilver-identity')
  if (stored) {
    return JSON.parse(stored)
  }
  const identity = {
    name: `Anonymous ${getRandomAnimal()}`,
    color: getRandomColor()
  }
  localStorage.setItem('freshsilver-identity', JSON.stringify(identity))
  return identity
}

// World Clock Component
function WorldClocks() {
  const [times, setTimes] = useState<{ ny: string; tlv: string; local: string }>({ ny: '', tlv: '', local: '' })

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date()
      const ny = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      const tlv = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      const local = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      setTimes({ ny, tlv, local })
    }
    updateTimes()
    const interval = setInterval(updateTimes, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.worldClocks}>
      <h3>🌍 World Time</h3>
      <div className={styles.clockGrid}>
        <div className={styles.clockItem}>
          <span className={styles.clockCity}>🗽 New York</span>
          <span className={styles.clockTime}>{times.ny}</span>
        </div>
        <div className={styles.clockItem}>
          <span className={styles.clockCity}>🌅 Tel Aviv</span>
          <span className={styles.clockTime}>{times.tlv}</span>
        </div>
        <div className={styles.clockItem}>
          <span className={styles.clockCity}>📍 Local</span>
          <span className={styles.clockTime}>{times.local}</span>
        </div>
      </div>
    </div>
  )
}

// Countdown Component
interface CountdownProps {
  label: string
  emoji: string
  targetDate: string
  targetTime?: string
}

function Countdown({ label, emoji, targetDate, targetTime }: CountdownProps) {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null)
  const [status, setStatus] = useState<'upcoming' | 'happening' | 'past'>('upcoming')

  useEffect(() => {
    const target = new Date(`${targetDate}${targetTime ? `T${targetTime}` : 'T00:00:00'}`)
    // For events with duration, consider them "happening" for a few hours
    const duration = 3 * 60 * 60 * 1000 // 3 hours
    
    const update = () => {
      const now = new Date()
      const diff = target.getTime() - now.getTime()
      
      if (diff > 0) {
        setStatus('upcoming')
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const secs = Math.floor((diff % (1000 * 60)) / 1000)
        setRemaining({ days, hours, mins, secs })
      } else if (diff > -duration) {
        setStatus('happening')
        setRemaining(null)
      } else {
        setStatus('past')
        setRemaining(null)
      }
    }
    
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetDate, targetTime])

  return (
    <div className={`${styles.countdownItem} ${styles[status]}`}>
      <div className={styles.countdownLabel}>
        <span className={styles.countdownEmoji}>{emoji}</span>
        <span>{label}</span>
      </div>
      {status === 'upcoming' && remaining && (
        <div className={styles.countdownValues}>
          {remaining.days > 0 && <span className={styles.countdownUnit}><strong>{remaining.days}</strong>d</span>}
          <span className={styles.countdownUnit}><strong>{remaining.hours}</strong>h</span>
          <span className={styles.countdownUnit}><strong>{remaining.mins}</strong>m</span>
          <span className={styles.countdownUnit}><strong>{remaining.secs}</strong>s</span>
        </div>
      )}
      {status === 'happening' && (
        <div className={styles.statusBadge}>🔴 NOW!</div>
      )}
      {status === 'past' && (
        <div className={styles.statusBadgePast}>✅ Done</div>
      )}
    </div>
  )
}

// Chat Component - uses API with localStorage fallback
function ChatSidebar() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [identity] = useState(getStoredIdentity)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadMessages = useCallback(async () => {
    const msgs = await api.fetchMessages()
    setMessages(msgs)
    setIsLoading(false)
  }, [])

  // Load messages on mount
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Poll for new messages if API is configured (every 5 seconds)
  useEffect(() => {
    if (!api.isApiConfigured()) return
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [loadMessages])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for local updates via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel('freshsilver-chat')
    channel.onmessage = (event) => {
      if (event.data.type === 'new-message') {
        setMessages(prev => {
          const exists = prev.some(m => m.id === event.data.message.id)
          if (exists) return prev
          return [...prev, event.data.message].slice(-50)
        })
      }
    }
    return () => channel.close()
  }, [])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const result = await api.postMessage({
      text: newMessage.trim(),
      author: identity.name,
      color: identity.color
    })

    if (result) {
      setMessages(prev => [...prev, result].slice(-50))
      setNewMessage('')
    }
    setIsSending(false)
    inputRef.current?.focus()
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h3>💬 Trip Chat</h3>
        <span 
          className={styles.chatMode} 
          title={api.isApiConfigured() ? 'Synced to cloud' : 'Saved locally'}
        >
          {api.isApiConfigured() ? '☁️' : '💾'}
        </span>
      </div>
      
      <div className={styles.chatMessages}>
        {isLoading && (
          <div className={styles.chatEmpty}>Loading messages...</div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className={styles.chatEmpty}>
            No messages yet. Be the first to say something! 👋
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={styles.chatMessage}>
            <div className={styles.chatMeta}>
              <span className={styles.chatAuthor} style={{ color: msg.color }}>{msg.author}</span>
              <span className={styles.chatTime}>{formatTime(msg.timestamp)}</span>
            </div>
            <div className={styles.chatText}>{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.chatForm} onSubmit={sendMessage}>
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className={styles.chatInput}
          maxLength={500}
          disabled={isSending}
        />
        <button type="submit" className={styles.chatSend} disabled={isSending}>
          {isSending ? '...' : '➤'}
        </button>
      </form>
      
      <div className={styles.chatIdentity}>
        You are: <strong style={{ color: identity.color }}>{identity.name}</strong>
      </div>
    </div>
  )
}

// RSVP Component for event attendance
interface RSVPProps {
  eventId: string
  eventName: string
  eventEmoji: string
  eventDate: string
}

function RSVPCard({ eventId, eventName, eventEmoji, eventDate }: RSVPProps) {
  const [attendees, setAttendees] = useState<RSVPEntry[]>([])
  const [name, setName] = useState('')
  const [hasRSVPd, setHasRSVPd] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadAttendees = useCallback(async () => {
    const list = await api.fetchRSVP(eventId)
    setAttendees(list)
    
    // Check if current user already RSVPd
    const myId = api.getMyRSVPId(eventId)
    if (myId) {
      const isInList = list.some(a => a.visitorId === myId || a.id?.includes(myId))
      setHasRSVPd(isInList)
    }
    setIsLoading(false)
  }, [eventId])

  // Load attendees on mount
  useEffect(() => {
    loadAttendees()
  }, [loadAttendees])

  // Poll for updates if API is configured
  useEffect(() => {
    if (!api.isApiConfigured()) return
    const interval = setInterval(loadAttendees, 10000) // every 10s
    return () => clearInterval(interval)
  }, [loadAttendees])

  // Listen for local updates via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel(`freshsilver-rsvp-${eventId}`)
    channel.onmessage = (event) => {
      if (event.data.type === 'rsvp-update') {
        setAttendees(event.data.attendees)
      }
    }
    return () => channel.close()
  }, [eventId])

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || hasRSVPd || isSubmitting) return

    setIsSubmitting(true)
    const color = getRandomColor()
    const result = await api.addRSVP(eventId, name.trim(), color)

    if (result) {
      setAttendees(prev => [...prev, result])
      setHasRSVPd(true)
      setName('')
    }
    setIsSubmitting(false)
  }

  const handleCancel = async () => {
    if (!hasRSVPd || isSubmitting) return

    setIsSubmitting(true)
    const success = await api.removeRSVP(eventId)

    if (success) {
      await loadAttendees()
      setHasRSVPd(false)
    }
    setIsSubmitting(false)
  }

  const myVisitorId = api.visitorId

  return (
    <div className={styles.rsvpCard}>
      <div className={styles.rsvpHeader}>
        <div className={styles.rsvpEmoji}>{eventEmoji}</div>
        <div className={styles.rsvpInfo}>
          <h3>{eventName}</h3>
          <p>{eventDate}</p>
        </div>
        <span 
          className={styles.rsvpMode} 
          title={api.isApiConfigured() ? 'Synced to cloud' : 'Saved locally'}
        >
          {api.isApiConfigured() ? '☁️' : '💾'}
        </span>
      </div>

      <div className={styles.rsvpAttendees}>
        <div className={styles.rsvpCount}>
          <span className={styles.rsvpCountNumber}>
            {isLoading ? '...' : attendees.length}
          </span>
          <span className={styles.rsvpCountLabel}>confirmed</span>
        </div>
        
        {attendees.length > 0 && (
          <div className={styles.rsvpList}>
            {attendees.map((a) => {
              const isMe = a.visitorId === myVisitorId || a.id?.includes(myVisitorId)
              return (
                <span 
                  key={a.id} 
                  className={`${styles.rsvpName} ${isMe ? styles.rsvpNameMe : ''}`}
                  style={{ borderColor: a.color }}
                >
                  {a.name} {isMe && '(you)'}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {!hasRSVPd ? (
        <form className={styles.rsvpForm} onSubmit={handleRSVP}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name..."
            className={styles.rsvpInput}
            maxLength={30}
            disabled={isSubmitting}
          />
          <button type="submit" className={styles.rsvpButton} disabled={isSubmitting}>
            {isSubmitting ? '...' : "✓ I'm coming!"}
          </button>
        </form>
      ) : (
        <div className={styles.rsvpConfirmed}>
          <span>✅ You're on the list!</span>
          <button onClick={handleCancel} className={styles.rsvpCancel} disabled={isSubmitting}>
            {isSubmitting ? '...' : 'Cancel'}
          </button>
        </div>
      )}
    </div>
  )
}

function App() {
  // Start with sidebar closed on mobile (< 900px)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 900
    }
    return true
  })

  return (
    <div className={styles.appLayout}>
      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <div 
          className={styles.sidebarOverlay} 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar toggle button - always visible on mobile */}
      <button 
        className={`${styles.sidebarToggle} ${sidebarOpen ? styles.sidebarToggleOpen : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Left Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>

        {sidebarOpen && (
          <>
            <div className={styles.sidebarLogo}>
              ✈️ Fresh<span>Silver</span>
            </div>

            {/* World Clocks */}
            <WorldClocks />

            {/* Countdowns */}
            <div className={styles.countdowns}>
              <h3>⏰ Countdowns</h3>
              <Countdown 
                label="Leave House" 
                emoji="🏠" 
                targetDate="2025-12-29"
                targetTime="08:30:00"
              />
              <Countdown 
                label="Flight LY10" 
                emoji="✈️" 
                targetDate="2025-12-29"
                targetTime="13:30:00"
              />
              <Countdown 
                label="NYE 2026" 
                emoji="🎆" 
                targetDate="2026-01-01"
                targetTime="00:00:00"
              />
              <Countdown 
                label="Karaoke Party" 
                emoji="🎤" 
                targetDate="2025-12-31"
                targetTime="19:30:00"
              />
              <Countdown 
                label="Snooker" 
                emoji="🎱" 
                targetDate="2025-12-31"
                targetTime="17:00:00"
              />
            </div>

            {/* Chat */}
            <ChatSidebar />
          </>
        )}
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <nav className={styles.nav}>
            <a href="#itinerary">Itinerary</a>
            <a href="#highlights">Highlights</a>
            <a href="https://dhsilver.me" target="_blank" rel="noopener noreferrer">About</a>
          </nav>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroEmoji}>🎉</div>
          <h1 className={styles.heroTitle}>New Year's Trip 2025–2026</h1>
          <p className={styles.heroSubtitle}>
            Dec 29, 2025 — Jan 2, 2026
          </p>
          
          <a 
            href="https://www.easy-rsvp.com/WKuGpL-beatbox-karakoke-dec-31-7-30pm" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.rsvpCta}
          >
            🎤 RSVP for NYE Karaoke →
          </a>
          <div className={styles.tripHighlights}>
            <span>👨‍👩‍👧 Family</span>
            <span>🍻 Friends</span>
            <span>🎤 Karaoke NYE</span>
            <span>🎱 Snooker</span>
            <span>💼 Canotera Office</span>
          </div>
        </section>

        <section id="itinerary" className={styles.itinerary}>
          <h2 className={styles.sectionTitle}>📅 Day by Day</h2>
          
          <div className={styles.timeline}>
            {ISRAEL_TRIP.map((day) => (
              <div key={day.date} className={styles.dayCard}>
                <div className={styles.dayHeader}>
                  <div className={styles.dayDate}>
                    <span className={styles.dayNumber}>{day.date}</span>
                    <span className={styles.dayName}>{day.dayOfWeek}</span>
                  </div>
                  <div className={styles.dayLocation}>
                    📍 {day.location}
                  </div>
                </div>
                
                <div className={styles.events}>
                  {day.events.map((event, i) => (
                    <div key={i} className={styles.event}>
                      <div className={styles.eventTime}>{event.time || '—'}</div>
                      <div className={styles.eventContent}>
                        <div className={styles.eventTitle}>
                          {event.emoji} {event.title}
                        </div>
                        {event.description && (
                          <div className={styles.eventDescription}>{event.description}</div>
                        )}
                        {event.location && (
                          <div className={styles.eventLocation}>
                            {event.mapUrl ? (
                              <a href={event.mapUrl} target="_blank" rel="noopener noreferrer">
                                📍 {event.location}
                              </a>
                            ) : (
                              <>📍 {event.location}</>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={styles.sleepingIn}>
                  🛏️ {day.sleepingIn}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="highlights" className={styles.highlights}>
          <h2 className={styles.sectionTitle}>✨ Trip Highlights</h2>
          
          {/* Karaoke RSVP - Featured */}
          <RSVPCard 
            eventId="karaoke-nye-2025"
            eventName="NYE Karaoke Party"
            eventEmoji="🎤"
            eventDate="Dec 31, 19:30–22:30 • BitBox Tel Aviv"
          />

          <div className={styles.highlightGrid}>
            <div className={styles.highlightCard}>
              <div className={styles.highlightEmoji}>🎱</div>
              <h3>Dan Snooker Club 147</h3>
              <p>Afternoon pool session in Tel Aviv</p>
              <p className={styles.highlightMeta}>Dec 31, 17:00–20:00</p>
            </div>
            <div className={styles.highlightCard}>
              <div className={styles.highlightEmoji}>💼</div>
              <h3>Canotera Office</h3>
              <p>Working from the Haifa office</p>
              <p className={styles.highlightMeta}>Dec 31, Morning</p>
            </div>
            <div className={styles.highlightCard}>
              <div className={styles.highlightEmoji}>👨‍👩‍👧</div>
              <h3>Family in Safed</h3>
              <p>Quality time in the mystical city</p>
              <p className={styles.highlightMeta}>Dec 30</p>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          Made with ☀️ by <a href="https://dhsilver.me" target="_blank" rel="noopener noreferrer">David Silver</a>
        </footer>
      </main>
    </div>
  )
}

export default App
