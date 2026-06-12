import Device from '@/components/Device';
import AdBanner from '@/components/AdBanner';

export default function Home() {
  return (
    <main className="page-bg">

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
