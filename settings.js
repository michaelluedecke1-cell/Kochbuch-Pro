let recipes = JSON.parse(localStorage.getItem('recipes') || '[]');

function backupRecipes() {
  const blob = new Blob([
    JSON.stringify(recipes, null, 2)
  ], { type: 'application/json' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kochbuch-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function restoreRecipes() {
  document.getElementById('restoreInput').click();
}

document.getElementById('restoreInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = event => {
    try {
      const importedRecipes = JSON.parse(event.target.result);
      if (Array.isArray(importedRecipes)) {
        localStorage.setItem('recipes', JSON.stringify(importedRecipes));
        alert('Backup erfolgreich wiederhergestellt! Du wirst jetzt zur Übersicht weitergeleitet.');
        window.location.href = 'index.html';
      } else {
        alert('Ungültiges Dateiformat.');
      }
    } catch {
      alert('Ungültige Datei.');
    }
  };

  reader.readAsText(file);
});

function exportPDF() {
  const printWindow = window.open('', '', 'width=800,height=600');

  let html = `
    <html>
    <head>
      <title>Kochbuch PDF</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; }
        h1 { color: #c2410c; border-bottom: 2px solid #c2410c; padding-bottom: 10px; }
        .recipe {
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ccc;
          page-break-inside: avoid;
        }
        h2 { color: #9a3412; margin-top: 20px; }
        h3 { color: #444; font-size: 1.1rem; margin-top: 15px; margin-bottom: 5px; }
        p { line-height: 1.5; color: #2d2d2d; }
      </style>
    </head>
    <body>
      <h1>🍳 Mein Kochbuch</h1>
  `;

  recipes.forEach(r => {
    html += `
      <div class="recipe">
        <h2>${r.title}</h2>
        <h3>Zutaten</h3>
        <p>${r.ingredients.replace(/\n/g, '<br>')}</p>
        <h3>Zubereitung</h3>
        <p>${r.steps.replace(/\n/g, '<br>')}</p>
      </div>
    `;
  });

  html += '</body></html>';

  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
// --- NEU: KI-API-Schlüssel Verwaltung ---

// Lädt den Schlüssel, falls schon einer gespeichert wurde, sobald die Seite lädt
document.addEventListener('DOMContentLoaded', () => {
  const savedKey = localStorage.getItem('geminiApiKey');
  if (savedKey) {
    document.getElementById('apiKeyInput').value = savedKey;
  }
});

// Speichert oder löscht den Schlüssel, wenn der Button geklickt wird
function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  
  if (key) {
    localStorage.setItem('geminiApiKey', key);
    alert('✅ API-Schlüssel wurde sicher auf deinem Gerät gespeichert!');
  } else {
    // Wenn das Feld leer ist und man auf Speichern klickt, wird der alte Schlüssel gelöscht
    localStorage.removeItem('geminiApiKey');
    alert('🗑️ API-Schlüssel wurde entfernt.');
  }
}