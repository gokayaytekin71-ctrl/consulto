// app/dilekceler/page.js
import fs from 'fs';
import path from 'path';
import ClientDilekceler from './ClientDilekceler.client';

function getCategories() {
  const root = path.join(process.cwd(), 'veri', 'dilekceler');
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const category = d.name;
      const files = fs
        .readdirSync(path.join(root, category))
        .filter(fn => fn.endsWith('.txt'));
      return { category, files };
    });
}

export default function Page() {
  const categories = getCategories();
  return <ClientDilekceler categories={categories} />;
}