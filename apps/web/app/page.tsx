export default function Home(): React.ReactNode {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>MajiBill staff console</h1>
      <p>Production app entry (root <code>npm run dev</code> → :3001).</p>
      <ul>
        <li>API: http://127.0.0.1:4000/v1/health</li>
        <li>Demo (separate): <code>npm run demo</code> → :3000</li>
      </ul>
      <p>Office workflows arrive in the billing slices.</p>
    </main>
  );
}
