export default function SinSesion({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="acceso">
      <div className="acceso-card">
        <h1>{titulo}</h1>
        <p>{texto}</p>
      </div>
    </main>
  )
}
