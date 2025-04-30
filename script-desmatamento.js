// script-desmatamento.js

document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById("desmatamentoChart").getContext("2d");

  const desmatamentoChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["2017", "2018", "2019", "2020", "2021", "2022", "2023"],
      datasets: [
        {
          label: "Área Desmatada (km²)",
          data: [6900, 7500, 8100, 10500, 11500, 9700, 8900],
          borderColor: "rgb(34, 197, 94)", // Cor da linha (verde)
          backgroundColor: "rgba(34, 197, 94, 0.2)", // Cor de preenchimento abaixo da linha
          pointBackgroundColor: "rgb(34, 197, 94)", // Cor dos pontos
          pointBorderColor: "#fff", // Borda branca nos pontos
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(34, 197, 94)",
          fill: true,
          tension: 0.4, // Suavizar a curva
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "rgb(34, 197, 94)",
            font: {
              size: 14,
              weight: "bold",
            },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
      scales: {
        x: {
          grid: {
            color: "rgba(0,0,0,0.05)",
          },
          ticks: {
            color: "#4B5563", // cinza escuro
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0,0,0,0.05)",
          },
          ticks: {
            color: "#4B5563", // cinza escuro
          },
        },
      },
    },
  });
});
