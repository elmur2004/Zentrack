import { notFound } from 'next/navigation';

/** Any unmatched path under /en or /ar renders the localized 404 with a real 404 status. */
export default function CatchAll() {
  notFound();
}
