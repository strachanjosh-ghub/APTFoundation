'use client';
import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="section">
      <div className="container prose center">
        <h1>Something went wrong</h1>
        <p>Please try again. If the problem continues, contact us.</p>
        <div className="btn-row btn-row--center">
          <button className="btn btn--primary" onClick={() => reset()}>Try again</button>
          <Link href="/Contact" className="btn btn--secondary">Contact</Link>
        </div>
      </div>
    </section>
  );
}
