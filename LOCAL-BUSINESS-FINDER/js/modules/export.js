import { downloadFile } from '../utils/helpers.js';
import { toCsv } from '../utils/formatters.js';
import { toast } from './ui.js';
export const exportData = {
  run(companies, format = 'json') {
    if (!companies.length) return toast('Aucun résultat à exporter.', 'error');
    const date = new Date().toISOString().slice(0, 10);
    if (format === 'csv') downloadFile(`entreprises-${date}.csv`, toCsv(companies), 'text/csv;charset=utf-8');
    else downloadFile(`entreprises-${date}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), application: 'Local Business Finder', notice: 'Données publiques déclaratives, non vérifiées sur place. Photos personnelles non incluses.', companies }, null, 2), 'application/json');
    toast(`${companies.length} fiche${companies.length > 1 ? 's' : ''} exportée${companies.length > 1 ? 's' : ''}.`);
  },
};
