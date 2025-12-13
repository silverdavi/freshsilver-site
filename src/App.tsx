import styles from './App.module.css'

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
    location: 'JFK → Israel',
    sleepingIn: 'In Flight ✈️',
    events: [
      { time: 'Morning', title: 'Depart Poughkeepsie → JFK', emoji: '🚗' },
      { time: '13:30', title: 'Flight LY10 JFK → TLV', emoji: '✈️', description: 'El Al to Tel Aviv' },
    ]
  },
  {
    date: 'Dec 30',
    dayOfWeek: 'Tuesday',
    location: 'Safed → Haifa',
    sleepingIn: 'Haifa Hotel 🏨',
    events: [
      { time: '06:35', title: 'Land in Tel Aviv', emoji: '🛬' },
      { time: '07:00', title: 'Pick up rental car', emoji: '🚗' },
      { time: 'Morning', title: 'Family in Safed', emoji: '👨‍👩‍👧', location: 'Safed', mapUrl: 'https://maps.google.com/?q=Safed,Israel' },
      { time: 'Afternoon', title: 'Visit Tal', emoji: '👋', location: 'Haifa area' },
      { time: 'Evening', title: 'Irrelevant Group meetup', emoji: '🍻', location: 'Haifa', description: 'Friends gathering' },
    ]
  },
  {
    date: 'Dec 31',
    dayOfWeek: 'Wednesday',
    location: 'Haifa → Tel Aviv',
    sleepingIn: 'Tel Aviv Hotel 🏨',
    events: [
      { time: 'Morning', title: 'Canotera Work', emoji: '💼', description: 'Remote work session' },
      { time: 'Afternoon', title: 'Drive to Tel Aviv', emoji: '🚗' },
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
    location: 'Central Israel → Airport',
    sleepingIn: 'In Flight ✈️',
    events: [
      { time: '08:30', title: 'Visit Amos', emoji: '👤', location: 'Maasiyahu', description: 'Morning visit' },
      { time: 'Noon', title: 'Visit Rafi', emoji: '👤' },
      { time: 'Afternoon', title: 'Visit Perl', emoji: '👤', location: 'Givat Zeev' },
      { time: 'Evening', title: 'Ben Gurion Airport', emoji: '✈️', location: 'Natbag' },
      { time: '00:05', title: 'Flight LY3 TLV → JFK', emoji: '✈️', description: 'Overnight flight home' },
    ]
  },
  {
    date: 'Jan 2',
    dayOfWeek: 'Friday',
    location: 'Home',
    sleepingIn: 'Home 🏠',
    events: [
      { time: '05:05', title: 'Land at JFK', emoji: '🛬' },
      { time: 'Morning', title: 'Uber/Train home', emoji: '🚂' },
      { title: 'Rest & recover', emoji: '😴' },
    ]
  },
]

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function App() {
  const daysUntil = getDaysUntil('2025-12-29')
  const tripStatus = daysUntil > 0 ? 'upcoming' : daysUntil >= -5 ? 'ongoing' : 'past'

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          ✈️ Fresh<span>Silver</span>
        </div>
        <nav className={styles.nav}>
          <a href="#itinerary">Itinerary</a>
          <a href="https://dhsilver.me" target="_blank" rel="noopener noreferrer">About</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroFlag}>🇮🇱</div>
        <h1 className={styles.heroTitle}>Israel New Year's Trip</h1>
        <p className={styles.heroSubtitle}>
          Dec 29, 2025 — Jan 2, 2026
        </p>
        <div className={styles.countdown}>
          {tripStatus === 'upcoming' && (
            <>
              <span className={styles.countdownNumber}>{daysUntil}</span>
              <span className={styles.countdownLabel}>days to go</span>
            </>
          )}
          {tripStatus === 'ongoing' && (
            <span className={styles.statusBadge}>🟢 Currently traveling!</span>
          )}
          {tripStatus === 'past' && (
            <span className={styles.statusBadge}>✅ Trip complete</span>
          )}
        </div>
        <div className={styles.tripHighlights}>
          <span>👨‍👩‍👧 Family</span>
          <span>🍻 Friends</span>
          <span>🎤 Karaoke NYE</span>
          <span>🎱 Snooker</span>
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

      <section className={styles.highlights}>
        <h2 className={styles.sectionTitle}>✨ Trip Highlights</h2>
        <div className={styles.highlightGrid}>
          <div className={styles.highlightCard}>
            <div className={styles.highlightEmoji}>🎤</div>
            <h3>NYE Karaoke Party</h3>
            <p>BitBox Tel Aviv • 13 friends • Private room</p>
            <p className={styles.highlightMeta}>Dec 31, 19:30–22:30</p>
          </div>
          <div className={styles.highlightCard}>
            <div className={styles.highlightEmoji}>🎱</div>
            <h3>Dan Snooker Club 147</h3>
            <p>Afternoon pool session in Tel Aviv</p>
            <p className={styles.highlightMeta}>Dec 31, 17:00–20:00</p>
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
    </div>
  )
}

export default App
