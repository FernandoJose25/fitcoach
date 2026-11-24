// Regenera foods_pe.csv desde packages/core/src/data/foods.ts (fuente de verdad).
// Uso: node supabase/seed/gen-foods-csv.mjs   (Node 23.6+ por el soporte nativo de TypeScript)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { BASE_FOODS } = await import(new URL('../../packages/core/src/data/foods.ts', import.meta.url));
const { EXTRA_FOODS } = await import(new URL('../../packages/core/src/data/foods-extra.ts', import.meta.url));
const { PRODUCTS } = await import(new URL('../../packages/core/src/data/products.ts', import.meta.url));
const FOODS = { ...BASE_FOODS, ...EXTRA_FOODS, ...PRODUCTS };
const q = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const rows = Object.values(FOODS).map((f) => [f.id, f.name, f.emoji, f.kcal, f.p, f.c, f.f, f.role, f.tag ?? '', 'seed'].map(q).join(','));
const out = fileURLToPath(new URL('./foods_pe.csv', import.meta.url));
writeFileSync(out, ['id,name_es,emoji,kcal,p,c,f,role,tag,source', ...rows].join('\n') + '\n');
console.log(`${rows.length} alimentos → ${out}`);
