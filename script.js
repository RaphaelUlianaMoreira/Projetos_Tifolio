// Configuração global
const CONFIG = {
  biomas: [
    "Amazônia",
    "Cerrado",
    "Mata Atlântica",
    "Caatinga",
    "Pampa",
    "Pantanal",
  ],
  especies: {
    categorias: [
      { nome: "Criticamente em perigo", cor: "#ff0000" },
      { nome: "Em perigo", cor: "#ff4d00" },
      { nome: "Vulnerável", cor: "#ffa700" },
    ],
  },
};

// Dados simulados
const MOCK_DATA = {
  especies: {
    categorias: [
      {
        nome: "Criticamente em perigo",
        cor: "#ff0000",
        count: 318,
        exemplos: ["Arara-azul-de-lear", "Mico-leão-dourado", "Onça-pintada"],
      },
      {
        nome: "Em perigo",
        cor: "#ff4d00",
        count: 425,
        exemplos: ["Lobo-guará", "Peixe-boi", "Tamanduá-bandeira"],
      },
      {
        nome: "Vulnerável",
        cor: "#ffa700",
        count: 512,
        exemplos: ["Boto-cor-de-rosa", "Tatu-bola", "Arara-canindé"],
      },
    ],
    fonte: "Dados simulados para demonstração",
  },
  desmatamento: {
    valores: {
      Amazônia: 8426,
      Cerrado: 6943,
      "Mata Atlântica": 2134,
      Caatinga: 1567,
      Pampa: 892,
      Pantanal: 1245,
    },
    fonte: "Dados simulados para demonstração",
  },
};

const APP_STATE = {
  especies: null,
  desmatamento: null,
};

const DOM = {
  errorContainer: document.getElementById("errorContainer"),
  loadingEspecies: document.getElementById("loadingEspecies"),
  loadingDesmatamento: document.getElementById("loadingDesmatamento"),
  dataTable: document.getElementById("dataTable"),
  updateDate: document.getElementById("updateDate"),
  especiesChart: document.getElementById("especiesChart"),
  desmatamentoChart: document.getElementById("desmatamentoChart"),
};

let especiesChart = null;
let desmatamentoChart = null;

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  setupEventListeners();
  await loadAllData();
  updateDateTime();
  setupResponsiveCharts();
}

function setupEventListeners() {
  document
    .getElementById("refreshEspecies")
    .addEventListener("click", loadEspeciesData);
  document
    .getElementById("refreshDesmatamento")
    .addEventListener("click", loadDesmatamentoData);
}

function setupResponsiveCharts() {
  window.addEventListener("resize", function () {
    if (especiesChart) {
      especiesChart.resize();
    }
    if (desmatamentoChart) {
      desmatamentoChart.resize();
    }
  });

  // Ajusta configurações baseadas no tamanho da tela
  const isMobile = window.innerWidth < 768;

  if (especiesChart) {
    especiesChart.options.plugins.legend.display = !isMobile;
    especiesChart.update();
  }

  if (desmatamentoChart) {
    desmatamentoChart.options.plugins.legend.position = isMobile
      ? "bottom"
      : "right";
    desmatamentoChart.update();
  }
}

function updateDateTime() {
  const now = new Date();
  DOM.updateDate.textContent = now.toLocaleString("pt-BR");
}

function showLoading(element, show = true) {
  element.style.display = show ? "flex" : "none";
}

function showError(message, error) {
  const errorDiv = document.createElement("div");
  errorDiv.className =
    "bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded";
  errorDiv.innerHTML = `
    <p class="font-bold">Erro:</p>
    <p>${message}</p>
    ${error ? `<p class="text-sm mt-2">${error.message || error}</p>` : ""}
  `;
  DOM.errorContainer.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

async function loadAllData() {
  showLoading(DOM.loadingEspecies);
  showLoading(DOM.loadingDesmatamento);

  try {
    await Promise.all([loadEspeciesData(), loadDesmatamentoData()]);
  } catch (error) {
    showError("Erro ao carregar dados iniciais", error);
  }
}

async function loadEspeciesData() {
  showLoading(DOM.loadingEspecies);
  try {
    const response = await fetch(
      "https://dadosabertos.icmbio.gov.br/public/especies"
    );
    const data = await response.json();

    const especiesData = {
      categorias: CONFIG.especies.categorias.map((cat) => ({
        ...cat,
        count: data.filter((esp) => esp.categoria_ameaca === cat.nome).length,
        exemplos: data
          .filter((esp) => esp.categoria_ameaca === cat.nome)
          .slice(0, 3)
          .map((esp) => esp.nome_comum || esp.nome_cientifico),
      })),
      fonte: "ICMBio - Instituto Chico Mendes de Conservação da Biodiversidade",
    };

    APP_STATE.especies = especiesData;
  } catch (error) {
    console.warn("Usando dados simulados para espécies:", error);
    APP_STATE.especies = MOCK_DATA.especies;
  } finally {
    updateEspeciesChart();
    updateDataTable();
    showLoading(DOM.loadingEspecies, false);
  }
}

async function loadDesmatamentoData() {
  showLoading(DOM.loadingDesmatamento);
  try {
    const response = await fetch(
      "https://terrabrasilis.dpi.inpe.br/api/deforestation/rates/prodes/amazon/yearly"
    );
    const data = await response.json();

    const latestYear = Math.max(...data.map((d) => d.year));
    const desmatamentoData = {
      valores: CONFIG.biomas.reduce((acc, bioma) => {
        const biomaData = data.find((d) => d.year === latestYear);
        acc[bioma] = biomaData ? Math.round(biomaData.area) : 0;
        return acc;
      }, {}),
      fonte: "INPE - Instituto Nacional de Pesquisas Espaciais",
    };

    APP_STATE.desmatamento = desmatamentoData;
  } catch (error) {
    console.warn("Usando dados simulados para desmatamento:", error);
    APP_STATE.desmatamento = MOCK_DATA.desmatamento;
  } finally {
    updateDesmatamentoChart();
    updateDataTable();
    showLoading(DOM.loadingDesmatamento, false);
  }
}

function updateEspeciesChart() {
  const ctx = DOM.especiesChart.getContext("2d");

  if (especiesChart) {
    especiesChart.destroy();
  }

  const isMobile = window.innerWidth < 768;

  especiesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: APP_STATE.especies.categorias.map((cat) => cat.nome),
      datasets: [
        {
          label: "Número de Espécies",
          data: APP_STATE.especies.categorias.map((cat) => cat.count),
          backgroundColor: APP_STATE.especies.categorias.map((cat) => cat.cor),
          borderColor: APP_STATE.especies.categorias.map((cat) => cat.cor),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: !isMobile,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.parsed.y.toLocaleString("pt-BR")} espécies`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value.toLocaleString("pt-BR");
            },
          },
        },
      },
    },
  });
}

function updateDesmatamentoChart() {
  const ctx = DOM.desmatamentoChart.getContext("2d");

  if (desmatamentoChart) {
    desmatamentoChart.destroy();
  }

  const data = APP_STATE.desmatamento;
  const cores = [
    "#2ecc71", // Verde
    "#e67e22", // Laranja
    "#3498db", // Azul
    "#f1c40f", // Amarelo
    "#9b59b6", // Roxo
    "#e74c3c", // Vermelho
  ];

  const isMobile = window.innerWidth < 768;

  desmatamentoChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: CONFIG.biomas,
      datasets: [
        {
          data: CONFIG.biomas.map((bioma) => data.valores[bioma]),
          backgroundColor: cores,
          borderColor: cores.map((cor) => cor + "88"),
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: isMobile ? "bottom" : "right",
          labels: {
            color: "#1f2937",
            font: {
              size: isMobile ? 10 : 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed;
              return `${context.label}: ${value.toLocaleString("pt-BR")} km²`;
            },
          },
        },
      },
    },
  });
}

function updateDataTable() {
  let html = "";

  // Tabela de Espécies
  if (APP_STATE.especies) {
    html += `
    <div class="mb-6">
      <h3 class="text-lg font-bold text-gray-800 mb-2">
        <i class="fas fa-paw mr-2"></i>
        Espécies Ameaçadas
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="text-left p-2 sm:p-3">Categoria</th>
              <th class="text-left p-2 sm:p-3">Quantidade</th>
              <th class="text-left p-2 sm:p-3">Exemplos</th>
            </tr>
          </thead>
          <tbody>
            ${APP_STATE.especies.categorias
              .map(
                (cat) => `
              <tr class="border-b">
                <td class="p-2 sm:p-3 font-medium" style="color: ${cat.cor}">${
                  cat.nome
                }</td>
                <td class="p-2 sm:p-3">${cat.count.toLocaleString("pt-BR")}</td>
                <td class="p-2 sm:p-3">${cat.exemplos.join(", ") || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <p class="text-xs text-gray-500 mt-1">Fonte: ${
        APP_STATE.especies.fonte
      }</p>
    </div>`;
  }

  // Tabela de Desmatamento
  if (APP_STATE.desmatamento) {
    html += `
    <div>
      <h3 class="text-lg font-bold text-gray-800 mb-2">
        <i class="fas fa-tree mr-2"></i>
        Desmatamento por Bioma
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="text-left p-2 sm:p-3">Bioma</th>
              <th class="text-left p-2 sm:p-3">Área (km²)</th>
            </tr>
          </thead>
          <tbody>
            ${CONFIG.biomas
              .map(
                (bioma) => `
              <tr class="border-b">
                <td class="p-2 sm:p-3">${bioma}</td>
                <td class="p-2 sm:p-3">${(
                  APP_STATE.desmatamento.valores[bioma] || 0
                ).toLocaleString("pt-BR")}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <p class="text-xs text-gray-500 mt-1">Fonte: ${
        APP_STATE.desmatamento.fonte
      }</p>
    </div>`;
  }

  DOM.dataTable.innerHTML =
    html || '<p class="text-gray-500">Nenhum dado disponível</p>';
}
