let recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
let editId = null;
let activeCategory = 'Alle';
let wakeLock = null; // NEU: Speichert den Status für das Display

const grid = document.getElementById('recipeGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');

function saveToStorage() {
  localStorage.setItem('recipes', JSON.stringify(recipes));
}

function setCategoryFilter(category) {
  activeCategory = category;
  renderRecipes();
}

function renderRecipes() {
  const search = searchInput.value.toLowerCase();

  const filtered = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search) || r.ingredients.toLowerCase().includes(search);
    const matchesCategory = activeCategory === 'Alle' || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
  }

  filtered.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const displayCategory = recipe.category || 'Sonstiges';
    const basePortions = recipe.portions || 1;
    
    let caloriesHtml = '';
    if (recipe.calories) {
      caloriesHtml = `
        <div style="margin-top: 10px; color: #ea580c; font-weight: bold; background: #fff7ed; padding: 8px 12px; border-radius: 6px; display: inline-block; border: 1px solid #ffedd5;">
          🔥 <span id="calTotal-${recipe.id}">${Math.round(recipe.calories * basePortions)}</span> kcal Gesamt 
          <span style="font-size: 0.85em; color: #f97316; font-weight: normal;">(ca. ${recipe.calories} kcal/Portion)</span>
        </div>
      `;
    }

    card.innerHTML = `
      <span class="tag">${displayCategory}</span>
      <h3>${recipe.title}</h3>
      <div class="meta">🍽️ Rezept gespeichert am ${recipe.date}</div>
      
      ${caloriesHtml}

      <div style="margin: 15px 0; padding: 10px; background: #f0fdf4; border-radius: 8px; display: flex; align-items: center; gap: 10px; border: 1px solid #bbf7d0;">
        <label style="font-weight: bold; color: #166534; margin: 0;">Portionen:</label>
        <input type="number" min="1" value="${basePortions}" id="portion-${recipe.id}" oninput="updatePortions('${recipe.id}')" style="width: 70px; margin: 0; padding: 5px; text-align: center;">
      </div>

      <strong>Zutaten:</strong>
      <p id="ingredients-${recipe.id}">${formatIngredients(recipe.ingredients, basePortions, basePortions)}</p>

      <br>
      <strong>Zubereitung:</strong>
      <p>${recipe.steps.replace(/\n/g, '<br>')}</p>

      <div class="actions">
        <button onclick="shareRecipe('${recipe.id}')" title="Teilen" style="background: #0284c7; border-color: #0284c7;">📤 Teilen</button>
        <button onclick="editRecipe('${recipe.id}')" title="Bearbeiten">✏️</button>
        <button class="danger" onclick="deleteRecipe('${recipe.id}')" title="Löschen">🗑️</button>
      </div>
    `;

    grid.appendChild(card);
  });
}

function updatePortions(id) {
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;

  const inputElement = document.getElementById(`portion-${id}`);
  const newPortions = parseFloat(inputElement.value);
  
  if (isNaN(newPortions) || newPortions <= 0) return;

  const basePortions = recipe.portions || 1;
  
  const ingredientsContainer = document.getElementById(`ingredients-${id}`);
  ingredientsContainer.innerHTML = formatIngredients(recipe.ingredients, basePortions, newPortions);

  if (recipe.calories) {
    const totalCalEl = document.getElementById(`calTotal-${id}`);
    if (totalCalEl) {
      totalCalEl.innerText = Math.round(recipe.calories * newPortions);
    }
  }
}

function formatIngredients(text, basePortions, currentPortions) {
  const ratio = currentPortions / basePortions;
  
  let updatedText = text.replace(/\b\d+([.,]\d+)?/g, (match) => {
    const num = parseFloat(match.replace(',', '.'));
    let newNum = num * ratio;
    newNum = Math.round(newNum * 100) / 100;
    return newNum.toString().replace('.', ',');
  });

  return updatedText.replace(/\n/g, '<br>');
}

async function shareRecipe(id) {
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;

  let shareText = `🍳 *${recipe.title}*\n`;
  shareText += `🍽️ Für ${recipe.portions || 1} Portion(en)\n`;
  
  if (recipe.calories) {
    shareText += `🔥 Ca. ${recipe.calories} kcal pro Portion\n`;
  }
  
  shareText += `\n🛒 *Zutaten:*\n${recipe.ingredients}\n`;
  shareText += `\n👨‍🍳 *Zubereitung:*\n${recipe.steps}\n`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: recipe.title,
        text: shareText
      });
    } catch (err) {
      console.log('Teilen abgebrochen', err);
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareText);
      alert('📋 Rezept in die Zwischenablage kopiert!');
    } catch (err) {
      alert('Kopieren fehlgeschlagen.');
    }
  }
}

// --- NEU: Display dauerhaft anlassen (Wake Lock) ---
async function toggleWakeLock() {
  const btn = document.getElementById('wakeLockBtn');
  
  if ('wakeLock' in navigator) {
    if (!wakeLock) {
      // Wenn das Display nicht geschützt ist, schalten wir den Schutz ein
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        btn.style.background = '#eab308'; // Gelb leuchten
        btn.style.borderColor = '#ca8a04';
        btn.innerText = '💡 Bleibt an!';
        
        // Falls das Handy in die Hosentasche gesteckt wird, wird der Lock automatisch gelöst
        wakeLock.addEventListener('release', () => {
          wakeLock = null;
          btn.style.background = '#64748b'; // Wieder Grau
          btn.style.borderColor = '#64748b';
          btn.innerText = '💡 Display an';
        });
      } catch (err) {
        alert('Fehler: Konnte das Display nicht wachhalten.');
      }
    } else {
      // Wenn der Schutz aktiv ist und der Nutzer nochmal klickt, schalten wir ihn aus
      await wakeLock.release();
      wakeLock = null;
    }
  } else {
    alert('Dein Browser unterstützt diese Funktion leider nicht.');
  }
}
// ----------------------------------------------------

function openRecipeModal() {
  editId = null;
  document.getElementById('modalTitle').textContent = 'Neues Rezept';
  document.getElementById('titleInput').value = '';
  document.getElementById('aiInput').value = ''; 
  document.getElementById('categoryInput').value = 'Hauptspeise'; 
  document.getElementById('portionsInput').value = '2'; 
  document.getElementById('caloriesInput').value = ''; 
  document.getElementById('ingredientsInput').value = '';
  document.getElementById('stepsInput').value = '';
  document.getElementById('recipeModal').showModal();
}

function closeModal() {
  document.getElementById('recipeModal').close();
}

function saveRecipe() {
  const title = document.getElementById('titleInput').value.trim();
  const category = document.getElementById('categoryInput').value;
  const portions = parseInt(document.getElementById('portionsInput').value) || 1; 
  const calories = parseInt(document.getElementById('caloriesInput').value) || ''; 
  const ingredients = document.getElementById('ingredientsInput').value.trim();
  const steps = document.getElementById('stepsInput').value.trim();

  if (!title || !ingredients || !steps) {
    alert('Bitte alle Pflichtfelder (Titel, Zutaten, Zubereitung) ausfüllen.');
    return;
  }

  if (editId) {
    recipes = recipes.map(r => r.id === editId ? {
      ...r,
      title,
      category,
      portions,
      calories, 
      ingredients,
      steps
    } : r);
  } else {
    recipes.unshift({
      id: crypto.randomUUID(),
      title,
      category,
      portions,
      calories, 
      ingredients,
      steps,
      date: new Date().toLocaleDateString('de-DE')
    });
  }

  saveToStorage();
  renderRecipes();
  closeModal();
}

function editRecipe(id) {
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;

  editId = id;
  document.getElementById('modalTitle').textContent = 'Rezept bearbeiten';
  document.getElementById('titleInput').value = recipe.title;
  document.getElementById('aiInput').value = '';
  document.getElementById('categoryInput').value = recipe.category || 'Sonstiges';
  document.getElementById('portionsInput').value = recipe.portions || 1;
  document.getElementById('caloriesInput').value = recipe.calories || ''; 
  document.getElementById('ingredientsInput').value = recipe.ingredients;
  document.getElementById('stepsInput').value = recipe.steps;

  document.getElementById('recipeModal').showModal();
}

function deleteRecipe(id) {
  if (!confirm('Rezept wirklich löschen?')) return;

  recipes = recipes.filter(r => r.id !== id);
  saveToStorage();
  renderRecipes();
}

if (searchInput) {
  searchInput.addEventListener('input', renderRecipes);
}

const urlParams = new URLSearchParams(window.location.search);
const categoryFromUrl = urlParams.get('cat');

if (categoryFromUrl) {
  setCategoryFilter(categoryFromUrl);
} else {
  renderRecipes();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .catch(err => console.error('Service Worker Fehler', err));
  });
}

async function importWithAI() {
  const rawText = document.getElementById('aiInput').value.trim();
  const aiBtn = document.querySelector('button[onclick="importWithAI()"]');
  
  if (!rawText) {
    alert("Bitte kopiere zuerst einen Rezept-Text in das hellblaue KI-Feld!");
    return;
  }

  const apiKey = localStorage.getItem('groqApiKey');
  if (!apiKey) {
    alert("⚠️ Es wurde noch kein Groq-Schlüssel hinterlegt! Bitte trage ihn zuerst in der Verwaltung (⚙️) ein.");
    return;
  }

  aiBtn.innerText = "⏳ Groq denkt nach...";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const systemPrompt = `
    Du bist ein hilfreicher Ernährungs- und Koch-Assistent. Extrahiere aus dem folgenden Text die Zutaten und die Zubereitungsschritte. 
    Falls im Text Kalorien stehen, übernimm diese. Falls nicht, schätze die realistischen Kalorien (kcal) für EINE Portion dieses Gerichts (nur als reine Zahl).
    Antworte AUSSCHLIESSLICH als valides JSON-Objekt.
    WICHTIG: Verwende KEINE echten Zeilenumbrüche innerhalb der JSON-Texte! Nutze für neue Zeilen zwingend die Zeichenfolge \\n .
    Format-Beispiel:
    {"zutaten": "Zutat 1\\nZutat 2", "zubereitung": "Schritt 1\\nSchritt 2", "kalorien": 450}
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Schnelles Modell von Groq
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Hier ist der Text:\n" + rawText }
        ],
        response_format: { type: "json_object" }, // Zwingt Groq dazu, sauberes JSON zu liefern
        temperature: 0.2 // Macht die Antwort sachlicher und stabiler
      })
    });

    const data = await response.json();
    
    // Fehler abfangen, z.B. wenn der API Schlüssel falsch ist
    if (data.error) {
      throw new Error(data.error.message);
    }

    // Groq verpackt die Antwort etwas anders als Gemini
    const textResponse = data.choices[0].message.content;
    
    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);

    document.getElementById('ingredientsInput').value = result.zutaten || '';
    document.getElementById('stepsInput').value = result.zubereitung || '';
    document.getElementById('caloriesInput').value = result.kalorien || '';

    aiBtn.innerText = "✅ Erfolgreich sortiert!";
    setTimeout(() => { aiBtn.innerText = "🤖 Text mit KI sortieren"; }, 2500);

  } catch (error) {
    console.error("KI Fehler:", error);
    alert("Fehler bei der Verbindung zu Groq. Ist dein API-Schlüssel aus den Einstellungen korrekt?");
    aiBtn.innerText = "🤖 Text mit KI sortieren";
  }
}
