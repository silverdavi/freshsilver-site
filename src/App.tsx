import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './App.module.css'
import * as api from './api'
import type { ChatMessage } from './api'

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
      { time: 'Afternoon', title: 'Client Meeting: Tal @ Canotera', emoji: '🤝', location: 'Haifa area', description: 'Kernel Keys business development' },
      { time: 'Evening', title: 'Irrelevant Group meetup', emoji: '🍻', location: 'Haifa', description: 'With the Haifa gang' },
    ]
  },
  {
    date: 'Dec 31',
    dayOfWeek: 'Wednesday',
    location: 'Haifa → Tel Aviv',
    sleepingIn: 'Tel Aviv Hotel 🏨',
    events: [
      { time: 'Morning', title: 'Canotera Client Work', emoji: '💼', location: 'Canotera Office, Haifa', description: 'On-site collaboration with key client • Kernel Keys LLC business' },
      { time: 'Afternoon', title: 'Drive to Tel Aviv', emoji: '🚗', description: '~1 hour south' },
      { time: '17:00–20:00', title: 'Dan @ Rhea Labs • Club 147', emoji: '🎱', location: 'Tel Aviv', description: 'Business networking + snooker' },
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

// Karaoke Song List Data
const KARAOKE_SONGS = [
  { title: 'Somewhere Only We Know', artist: 'Keane', url: 'https://www.youtube.com/watch?v=l5shwZTwHec' },
  { title: 'Should I Stay or Should I Go', artist: 'The Clash', url: 'https://www.youtube.com/watch?v=RlngN3tXpLU' },
  { title: "What's Up?", artist: '4 Non Blondes', url: 'https://www.youtube.com/watch?v=oLShwvZopls' },
  { title: 'Breezeblocks', artist: 'alt-J', url: 'https://www.youtube.com/watch?v=goXMCV9_IN0' },
  { title: "World's Smallest Violin", artist: 'AJR', url: 'https://www.youtube.com/watch?v=ClNkwd1u2eQ' },
  { title: "I Think I'm Paranoid", artist: 'Garbage', url: 'https://www.youtube.com/watch?v=NBYJ_xHr8kw' },
  { title: 'Hell Is Forever', artist: 'Hazbin Hotel', url: 'https://www.youtube.com/watch?v=_rztGoWeQVw' },
  { title: 'I Wanna Be Your Slave', artist: 'Måneskin', url: 'https://www.youtube.com/watch?v=3MzEbJHnmJk' },
  { title: 'All That She Wants', artist: 'Ace of Base', url: 'https://www.youtube.com/watch?v=8GcxmRJJH2o' },
  { title: 'Smile Like You Mean It', artist: 'The Killers', url: 'https://www.youtube.com/watch?v=ufEYnw31udA' },
  { title: 'Unholy', artist: 'Sam Smith & Kim Petras', url: 'https://www.youtube.com/watch?v=KoniFTHvqis' },
  { title: 'Flagpole Sitta', artist: 'Harvey Danger', url: 'https://www.youtube.com/watch?v=JKKpYFbgl8E' },
]

// Song List Component for Karaoke
function SongListCard() {
  const [suggestion, setSuggestion] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>(() => {
    const saved = localStorage.getItem('karaoke-suggestions')
    return saved ? JSON.parse(saved) : []
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!suggestion.trim()) return
    
    const newSuggestions = [...suggestions, suggestion.trim()]
    setSuggestions(newSuggestions)
    localStorage.setItem('karaoke-suggestions', JSON.stringify(newSuggestions))
    setSuggestion('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
  }

  return (
    <div className={styles.songListCard}>
      <div className={styles.songListHeader}>
        <div className={styles.songListEmoji}>🎤</div>
        <div className={styles.songListInfo}>
          <h3>NYE Karaoke Setlist</h3>
          <p>Dec 31, 19:30–22:30 • BeatBox Tel Aviv</p>
        </div>
      </div>

      <div className={styles.songGrid}>
        {KARAOKE_SONGS.map((song, i) => (
          <a 
            key={i}
            href={song.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.songItem}
          >
            <span className={styles.songTitle}>{song.title}</span>
            <span className={styles.songArtist}>{song.artist}</span>
            <span className={styles.songPlay}>▶</span>
          </a>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className={styles.songSuggestions}>
          <div className={styles.suggestionLabel}>💡 Suggestions:</div>
          <div className={styles.suggestionList}>
            {suggestions.map((s, i) => (
              <span key={i} className={styles.suggestionChip}>{s}</span>
            ))}
          </div>
        </div>
      )}

      <form className={styles.songSuggestForm} onSubmit={handleSubmit}>
        <input
          type="text"
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="Suggest a song..."
          className={styles.songSuggestInput}
          maxLength={60}
        />
        <button type="submit" className={styles.songSuggestButton}>
          {submitted ? '✓' : '+ Add'}
        </button>
      </form>
    </div>
  )
}


// Vault Component - PIN protected private info
const VAULT_PIN = '4169'

function VaultModal({ onClose }: { onClose: () => void }) {
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === VAULT_PIN) {
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  if (!unlocked) {
    return (
      <div className={styles.vaultOverlay} onClick={onClose}>
        <div className={styles.vaultPinBox} onClick={e => e.stopPropagation()}>
          <h2>🔐 Vault</h2>
          <p>Enter PIN to access private details</p>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="PIN"
              maxLength={4}
              autoFocus
              className={error ? styles.pinError : ''}
            />
            <button type="submit">Unlock</button>
          </form>
          {error && <p className={styles.pinErrorText}>Incorrect PIN</p>}
        </div>
      </div>
    )
  }

  const [activeTab, setActiveTab] = useState<'booking' | 'emergency'>('booking')

  return (
    <div className={styles.vaultOverlay} onClick={onClose}>
      <div className={styles.vaultContent} onClick={e => e.stopPropagation()}>
        <button className={styles.vaultClose} onClick={onClose}>✕</button>
        <h2>🔐 Private Vault</h2>
        
        <div className={styles.vaultTabs}>
          <button 
            className={`${styles.vaultTab} ${activeTab === 'booking' ? styles.vaultTabActive : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            📋 Booking Details
          </button>
          <button 
            className={`${styles.vaultTab} ${activeTab === 'emergency' ? styles.vaultTabActive : ''}`}
            onClick={() => setActiveTab('emergency')}
          >
            🆘 Emergency Plans
          </button>
        </div>

        {activeTab === 'booking' && (
          <>
            <div className={styles.vaultSection}>
              <h3>💰 Money & Access</h3>
              <p>$10,000 savings in KernelKeys Bank of America (Zelle to personal BofA)</p>
              <p>$10,000 in personal BofA savings</p>
              <p>$5,000 in Capital One savings</p>
              <p><em>Use main Apple Studio, password: DovAte twice (4...4...)</em></p>
            </div>

            <div className={styles.vaultSection}>
              <h3>✈️ Flight Booking</h3>
              <p><strong>El Al Code:</strong> ZDXQ7N</p>
              <p>LY10: JFK → TLV • Dec 29, 13:30 • Business (J)</p>
              <p>LY3: TLV → JFK • Jan 2, 00:05 • Premium (W)</p>
            </div>

            <div className={styles.vaultSection}>
              <h3>🚗 Car Rental</h3>
              <p><strong>Reservation:</strong> 1197383438</p>
              <p>Pick up: Dec 30, 07:00 • Ben Gurion Airport</p>
              <p>Return: Jan 1, 22:00 • Ben Gurion Airport</p>
            </div>

            <div className={styles.vaultSection}>
              <h3>🏨 Hotels</h3>
              <div className={styles.vaultHotel}>
                <h4>Haifa (Dec 30)</h4>
                <p><strong>Dovrinn Boutique Aparthotel</strong></p>
                <p>Confirmation: 2350932847</p>
                <p>9 Nahum Dovrin St, Haifa</p>
                <p>📞 +972-544000059</p>
              </div>
              <div className={styles.vaultHotel}>
                <h4>Tel Aviv (Dec 31 – Jan 1)</h4>
                <p><strong>Hotel B Berdichevsky</strong></p>
                <p>Confirmation: 6337469807</p>
                <p>Check-in: 15:00 – 16:00</p>
              </div>
            </div>

            <div className={styles.vaultSection}>
              <h3>📞 Emergency Contacts</h3>
              <p><strong>Israeli Lawyer:</strong> Uri Corb +972 50-621-6535</p>
              <p><strong>Dr Perl:</strong> +972 50-868-5987</p>
              <p><strong>Yael Gold-Zamir:</strong> +972 50-977-0671</p>
              <p><strong>US Legal (Daniel Cohen):</strong> +1 (917) 273-3876</p>
            </div>
          </>
        )}

        {activeTab === 'emergency' && (
          <>
            <div className={styles.vaultSection}>
              <h3>💝 For Enny — If Something Happens</h3>
              <p><em>Don't panic. You have resources, support, and time. Read through this calmly.</em></p>
            </div>

            <div className={styles.vaultSection}>
              <h3>💵 Immediate Finances</h3>
              <p>• <strong>Mortgage:</strong> ~$3,500/month via Shellpoint, on autopay. If needed, ask one of Tsion's sons for help for a few months until things are clearer.</p>
              <p>• <strong>Use $20,000 emergency funds</strong> for a month without hesitation. It's nothing — we get $110,000 from Rhea Labs on January 3rd.</p>
              <p>• <strong>Total accessible:</strong> ~$25,000 in savings + incoming $110k</p>
            </div>

            <div className={styles.vaultSection}>
              <h3>👶 Childcare Help</h3>
              <p>• <strong>Autumn:</strong> Hire for maximum hours. She will be paid promptly.</p>
              <p>• <strong>Sariel:</strong> Pay $5,000/month to come help in the USA. Good for everyone.</p>
              <p>• <strong>Alternatives:</strong> Shani, Araceli, or Araceli's friends can help.</p>
            </div>

            <div className={styles.vaultSection}>
              <h3>💼 Work Communications</h3>
              <p>• <strong>Margaret (Kernel Keys):</strong> Only after a few weeks, and only if she asks, send a simple email: "David is not feeling well and traveling, will contact her soon."</p>
              <p>• <strong>No rush</strong> to inform anyone else about work matters.</p>
            </div>

            <div className={styles.vaultSection}>
              <h3>🏫 School</h3>
              <p>• Don't worry about school — only use them if they're helpful.</p>
              <p>• <strong>Even a year out of school is completely fine.</strong> Focus on stability first.</p>
            </div>

            <div className={styles.vaultSection} style={{background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #f59e0b'}}>
              <h3>🏥 Scenario: David is Sick/Hospitalized</h3>
              <p>1. Contact Yael Gold-Zamir (+972 50-977-0671) — she can help coordinate in Israel</p>
              <p>2. Call Dr. Perl (+972 50-868-5987) for medical advice/connections</p>
              <p>3. US Embassy in Tel Aviv: +972-3-519-7575</p>
              <p>4. Travel insurance is through the credit card — check Chase Sapphire benefits</p>
              <p>5. If I need to be flown back, contact insurance first, then consider air ambulance</p>
            </div>

            <div className={styles.vaultSection} style={{background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '2px solid #ef4444'}}>
              <h3>⚖️ Scenario: David is Arrested/Detained</h3>
              <p>1. <strong>STAY CALM.</strong> Israeli system is slow but fair for tourists.</p>
              <p>2. Immediately call Uri Corb (lawyer): +972 50-621-6535</p>
              <p>3. US Embassy emergency: +972-3-519-7575 (ask for American Citizen Services)</p>
              <p>4. For US legal help: Daniel Cohen +1 (917) 273-3876, or ask Yariv</p>
              <p>5. Do NOT post on social media. Do NOT discuss details with anyone except lawyers.</p>
              <p>6. I have no criminal record — any issue is likely a misunderstanding.</p>
            </div>

            <div className={styles.vaultSection} style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', border: '2px solid #475569', color: 'white'}}>
              <h3>✈️ Scenario: Flight Emergency / Plane Crash</h3>
              <p style={{color: '#e2e8f0'}}>1. El Al will contact next of kin. Make sure they have your number.</p>
              <p style={{color: '#e2e8f0'}}>2. Israeli consulate in NYC: +1 (212) 499-5000</p>
              <p style={{color: '#e2e8f0'}}>3. Life insurance policy is with [check documents in safe]</p>
              <p style={{color: '#e2e8f0'}}>4. All accounts have you as beneficiary</p>
              <p style={{color: '#e2e8f0'}}>5. The house is jointly owned — you keep everything</p>
              <p style={{color: '#e2e8f0'}}>6. Kernel Keys LLC passes to you as surviving spouse</p>
              <p style={{color: '#94a3b8', marginTop: '0.5rem'}}><em>I love you and the kids more than anything. You will be okay. ❤️</em></p>
            </div>

            <div className={styles.vaultSection}>
              <h3>📱 Key Contacts Summary</h3>
              <p><strong>Israel Lawyer:</strong> Uri Corb +972 50-621-6535</p>
              <p><strong>Doctor:</strong> Dr Perl +972 50-868-5987</p>
              <p><strong>General Help:</strong> Yael Gold-Zamir +972 50-977-0671</p>
              <p><strong>US Legal:</strong> Daniel Cohen +1 (917) 273-3876</p>
              <p><strong>US Embassy Israel:</strong> +972-3-519-7575</p>
              <p><strong>Israeli Consulate NYC:</strong> +1 (212) 499-5000</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function App() {
  // Vault state
  const [vaultOpen, setVaultOpen] = useState(false)
  
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
            <button className={styles.vaultButton} onClick={() => setVaultOpen(true)}>🔐 Vault</button>
          </nav>
          
          {vaultOpen && <VaultModal onClose={() => setVaultOpen(false)} />}
        </header>

        <section className={styles.hero}>
          <div className={styles.heroEmoji}>✈️</div>
          <h1 className={styles.heroTitle}>Israel Business Trip 2025</h1>
          <p className={styles.heroSubtitle}>
            Kernel Keys LLC • Dec 29, 2025 — Jan 2, 2026
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
            <span>🤝 Client: Canotera</span>
            <span>💼 Office Day</span>
            <span>👨‍👩‍👧 Family</span>
            <span>🍻 Friends</span>
            <span>🎤 NYE Celebration</span>
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
          
          {/* Karaoke Song List - Featured */}
          <SongListCard />

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
