import Book3D from '../../components/Book3D';

export default function BookPreviewPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#1f1f1f',
      }}
    >
      <Book3D width={300} />
    </main>
  );
}
