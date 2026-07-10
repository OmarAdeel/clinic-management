import fs from 'fs';
import path from 'path';

const filePath = path.join('node_modules', 'iconv-lite', 'lib', 'index.js');

try {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    const target = 'if (nodeVer) {';
    const replacement = 'if (false) { // Disabled for Cloudflare Workers compatibility';
    
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Successfully patched iconv-lite for Cloudflare Workers compatibility.');
    } else {
      console.log('iconv-lite is already patched or target check not found.');
    }
  } else {
    console.warn('iconv-lite index.js file not found at:', filePath);
  }
} catch (err) {
  console.error('Failed to patch iconv-lite:', err.message);
}
