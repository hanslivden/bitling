import Device from '@/components/Device';
import AdBanner from '@/components/AdBanner';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px 40px',
      gap: 20,
      background: 'radial-gradient(ellipse at 50% 0%, #2D0A6B 0%, #0F0F23 60%)',
    }}>

      {/* Game device */}
      <Device />

      {/* Ad banner */}
      <div style={{ marginTop: 4 }}>
        <AdBanner />
      </div>

      {/* Tiny footer */}
      <p style={{
        fontFamily: 'var(--font-press-start)',
        fontSize: 6,
        color: '#2D1060',
        letterSpacing: 1,
        textAlign: 'center',
      }}>
        BITLING · RAISE · SHARE · SURVIVE
      </p>
    </main>
  );
}
