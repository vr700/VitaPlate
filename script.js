let comidasDB = [];
let ingredientesExcluidos = [];
const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const preferencias = Object.fromEntries(dias.map(d => [d, 'cualquiera']));


// 🧩 Mapeo de preferencias a ingredientes
const preferenciasMapeadas = {
  pescado: ['atun', 'salmon', 'bonito', 'barracuda', 'caballa', 'merluza', 'bacalao'],
  pollo: ['pollo', 'pechuga de pollo', 'pierna de pollo', 'pollo a la brasa'],
  carne: ['bisteck', 'carne', 'chancho', 'cerdo', 'res', 'cordero'],
  carbohidrato: ['fideos', 'arroz', 'pasta', 'papas', 'quinoa', 'pan']
};

fetch('comidas.json')
  .then(response => response.json())
  .then(data => {
    comidasDB = data.comidas;
    generarMenu();
  });

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function generarMenu() {
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  let menu = [];
  let ultimaProteina = null;
  let carbohidratosUsados = false;

  const excluidosNormalizados = ingredientesExcluidos.map(normalizarTexto);

  const comidasDisponibles = comidasDB.filter(c => {
    const ingredientesNormalizados = c.ingredientes.map(normalizarTexto);
    return !excluidosNormalizados.some(ex => ingredientesNormalizados.includes(ex));
  });

  for (let dia of dias) {
    const tipoPreferido = preferencias[dia];
    let opciones = comidasDisponibles.filter(c => {
      const ingredientesNormalizados = c.ingredientes.map(normalizarTexto);
      const coincideTipo =
        tipoPreferido === 'cualquiera' ||
        (preferenciasMapeadas[tipoPreferido] &&
          preferenciasMapeadas[tipoPreferido].some(prefIng =>
            ingredientesNormalizados.includes(normalizarTexto(prefIng))
          ));
      return coincideTipo && c.proteina !== ultimaProteina && (!carbohidratosUsados || tipoPreferido !== 'carbohidrato');
    });

    if (opciones.length === 0) {
      alert(`No hay suficientes comidas disponibles para ${dia} con los filtros aplicados.`);
      return;
    }

    const comida = opciones[Math.floor(Math.random() * opciones.length)];

    if (preferenciasMapeadas['carbohidrato'].some(ing => comida.ingredientes.map(normalizarTexto).includes(normalizarTexto(ing)))) {
      carbohidratosUsados = true;
    }

    const index = comidasDisponibles.indexOf(comida);
    if (index > -1) comidasDisponibles.splice(index, 1);

    ultimaProteina = comida.proteina;
    menu.push({ dia, ...comida });
  }

  mostrarMenu(menu);
  localStorage.setItem('menu', JSON.stringify(menu));
}

function mostrarMenu(menu) {
  const contenedor = document.getElementById('menu');
  contenedor.innerHTML = '';

  menu.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.dia}: ${item.nombre}</h3>
      <ul>${item.ingredientes.map(i => `<li>${i}</li>`).join('')}</ul>
    `;
    contenedor.appendChild(card);
  });
}

function copiarMenu() {
  const menu = JSON.parse(localStorage.getItem('menu')) || [];
  const texto = menu.map(m => `${m.dia}: ${m.nombre}\nIngredientes: ${m.ingredientes.join(', ')}`).join('\n\n');
  navigator.clipboard.writeText(texto).then(() => {
    alert('Menú copiado al portapapeles ✅');
  });
}

function enviarWhatsApp() {
  const menu = JSON.parse(localStorage.getItem('menu')) || [];
  let texto = `*Menú Saludable de la Semana*\n\n`;
  menu.forEach(m => {
    texto += `*${m.dia}*:\n${m.nombre}\nIngredientes: ${m.ingredientes.join(', ')}\n\n`;
  });
  texto += `¡A comer rico y sano!`;
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
}

// Ingredientes dinámicos
const inputIngrediente = document.getElementById('inputIngrediente');
const listaIngredientes = document.getElementById('listaIngredientes');

inputIngrediente.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const valor = normalizarTexto(inputIngrediente.value);
    if (valor && !ingredientesExcluidos.includes(valor)) {
      ingredientesExcluidos.push(valor);
      renderizarIngredientes();
      inputIngrediente.value = '';
    }
  }
});

function renderizarIngredientes() {
  listaIngredientes.innerHTML = '';
  ingredientesExcluidos.forEach(ing => {
    const item = document.createElement('div');
    item.className = 'ingredient-item';
    item.innerHTML = `${ing} <button onclick="eliminarIngrediente('${ing}')">❌</button>`;
    listaIngredientes.appendChild(item);
  });
}

function eliminarIngrediente(nombre) {
  ingredientesExcluidos = ingredientesExcluidos.filter(i => i !== nombre);
  renderizarIngredientes();
}

// Calendario de preferencias
const calendario = document.getElementById('calendario');

dias.forEach(dia => {
  const container = document.createElement('div');
  container.className = 'preferencia-dia';

  container.innerHTML = `
    <label>${dia}:</label>
    <select onchange="actualizarPreferencia('${dia}', this.value)">
      <option value="cualquiera">Cualquiera</option>
      <option value="pescado">Pescado</option>
      <option value="pollo">Pollo</option>
      <option value="carne">Carne</option>
      <option value="carbohidrato">Carbohidrato</option>
    </select>
  `;

  calendario.appendChild(container);
});

function actualizarPreferencia(dia, valor) {
  preferencias[dia] = valor;
}
