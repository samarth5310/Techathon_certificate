const fs = require('fs');
const files = ['src/components/Template1.jsx', 'src/components/Template2.jsx', 'src/components/Template3.jsx'];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/clamp\([^,]+,\s*[^,]+,\s*([^)]+)\)/g, '$1');
    fs.writeFileSync(file, content);
  }
});
