import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container prose center">
        <h1>Page not found</h1>
        <p>Sorry, we couldn’t find the page you were looking for.</p>
        <div className="btn-row btn-row--center">
          <Link href="/" className="btn btn--primary">Go to the homepage</Link>
          <Link href="/causes" className="btn btn--secondary">Explore causes</Link>
        </div>
      </div>
    </section>
  );
}
