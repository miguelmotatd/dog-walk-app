import MyWalksPanel from '../components/MyWalksPanel'

export default function MyWalksPage() {
  const personPublicToken = localStorage.getItem('person_public_token')

  return (
    <div style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto' }}>
      <h1>My walks</h1>
      <p>Here you can see your active dog walks.</p>

      <MyWalksPanel personPublicToken={personPublicToken} />
    </div>
  )
}