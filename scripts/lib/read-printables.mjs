import fs from 'node:fs';
import path from 'node:path';
export function printable(root,slug) {
  const bytes=fs.readFileSync(path.join(root,'read',slug,slug+'.pdf'));
  if(bytes.subarray(0,5).toString()!=='%PDF-')throw Error('Invalid PDF: '+slug);
  const data=bytes.toString('latin1');
  const pages=(data.match(/\/Type\s*\/Page\b/g)||[]).length;
  const pictures=(data.match(/\/Subtype\s*\/Image\b/g)||[]).length;
  return {pages,mb:(bytes.length/1048576).toFixed(1),questionStart:pictures+1};
}
export function printableLabel(info){return `${info.pages} printed pages · ${info.mb} MB`;}
