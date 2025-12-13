import styles from './App.module.css'

interface Trip {
  id: string
  title: string
  location: string
  date: string
  description: string
  tags: string[]
  status: 'upcoming' | 'ongoing' | 'past'
}

const TRIPS: Trip[] = [
  // Add trips here as they come up
  // {
  //   id: '1',
  //   title: 'Japan Spring 2025',
  //   location: 'Tokyo, Kyoto, Osaka',
  //   date: 'March 15 - April 2, 2025',
  //   description: 'Cherry blossom season adventure through Japan...',
  //   tags: ['Asia', 'Culture', 'Food'],
  //   status: 'upcoming'
  // }
]

function App() {
  const upcomingTrips = TRIPS.filter(t => t.status === 'upcoming')
  const ongoingTrips = TRIPS.filter(t => t.status === 'ongoing')
  const pastTrips = TRIPS.filter(t => t.status === 'past')

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          ✈️ Fresh<span>Silver</span>
        </div>
        <nav className={styles.nav}>
          <a href="#upcoming">Upcoming</a>
          <a href="#past">Past Trips</a>
          <a href="https://dhsilver.me" target="_blank" rel="noopener noreferrer">About</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroEmoji}>🌍</div>
        <h1 className={styles.heroTitle}>Fresh Silver</h1>
        <p className={styles.heroSubtitle}>
          Travel plans, adventures, and stories. Where I'm going, 
          what I'm doing, and photos along the way.
        </p>
      </section>

      {ongoingTrips.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            📍 Currently Traveling
          </h2>
          <div className={styles.tripGrid}>
            {ongoingTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      <section id="upcoming" className={styles.section}>
        <h2 className={styles.sectionTitle}>
          🗓️ Upcoming Adventures
        </h2>
        {upcomingTrips.length > 0 ? (
          <div className={styles.tripGrid}>
            {upcomingTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span>🧭</span>
            No trips planned yet... but something's brewing!
          </div>
        )}
      </section>

      <section id="past" className={styles.section}>
        <h2 className={styles.sectionTitle}>
          📸 Past Trips
        </h2>
        {pastTrips.length > 0 ? (
          <div className={styles.tripGrid}>
            {pastTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span>✨</span>
            Stories coming soon...
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        Made with ☀️ by <a href="https://dhsilver.me" target="_blank" rel="noopener noreferrer">David Silver</a>
      </footer>
    </div>
  )
}

function TripCard({ trip }: { trip: Trip }) {
  return (
    <article className={styles.tripCard}>
      <div className={styles.tripDate}>{trip.date}</div>
      <h3 className={styles.tripTitle}>{trip.title}</h3>
      <p className={styles.tripDescription}>{trip.description}</p>
      <div className={styles.tripTags}>
        {trip.tags.map(tag => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
      </div>
    </article>
  )
}

export default App
