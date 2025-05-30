Module.register("MMM-fortnite-stats", {
  defaults: {
    updateInterval: 1800000, // update every 30 min
    apiKey: "", // free api key here: https://fortniteapi.io/
    username: "",
    showSolo: true,
    showDuo: true,
    showSquad: false,
    displayDirection: 'horizontal' //  'horizontal' or 'vertical'
  },

  start: function () {
    this.stats = null;
    this.getStats();
    setInterval(() => {
      this.getStats();
    }, this.config.updateInterval);
  },

  getStats: function () {
    this.sendSocketNotification("GET_PLAYER_STATS", {
      username: this.config.username,
      apiKey: this.config.apiKey
    });
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "PLAYER_STATS_RESULT") {
      this.stats = payload;
      this.updateDom();
    }
  },

  createVerticalTable: function (stats, mode) {
    const table = document.createElement("table");
    table.className = "vertical-stats-table";

    const statsConfig = [
      { label: "Matches", key: "matchesplayed" },
      { label: "Wins", key: "placetop1" },
      { label: mode === "solo" ? "Top 10" : "Top 12", key: mode === "solo" ? "placetop10" : "placetop12" },
      { label: "Kills", key: "kills" },
      { label: "K/D", key: "kd" }
    ];

    statsConfig.forEach(stat => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="stat-label">${stat.label}</td>
        <td class="stat-value">${stats[stat.key] || 0}</td>
      `;
      table.appendChild(row);
    });

    return table;
  },

  createHorizontalTable: function (stats, mode) {
    const table = document.createElement("table");
    table.className = "horizontal-stats-table";

    const headerRow = document.createElement("tr");
    headerRow.className = "header-row";
    headerRow.innerHTML = `
      <td>Matches</td>
      <td>Wins</td>
      <td>${mode === "solo" ? "Top 10" : "Top 12"}</td>
      <td>Kills</td>
      <td>K/D</td>
    `;
    table.appendChild(headerRow);

    // Stats row
    const statsRow = document.createElement("tr");
    statsRow.className = "stats-row";
    statsRow.innerHTML = `
      <td>${stats.matchesplayed || 0}</td>
      <td>${stats.placetop1 || 0}</td>
      <td>${mode === "solo" ? stats.placetop10 || 0 : stats.placetop12 || 0}</td>
      <td>${stats.kills || 0}</td>
      <td>${stats.kd || 0}</td>
    `;
    table.appendChild(statsRow);

    return table;
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = `MMM-Fortnite ${this.config.displayDirection}`;

    if (!this.stats) {
      wrapper.innerHTML = "Loading...";
      return wrapper;
    }

    if (this.config.showSolo && this.stats.global_stats.solo) {
      const soloSection = document.createElement("div");
      soloSection.className = "game-mode-section";

      const soloHeader = document.createElement("h3");
      soloHeader.innerHTML = "Solo";
      soloSection.appendChild(soloHeader);

      const soloTable = this.config.displayDirection === 'vertical'
        ? this.createVerticalTable(this.stats.global_stats.solo, "solo")
        : this.createHorizontalTable(this.stats.global_stats.solo, "solo");
      soloSection.appendChild(soloTable);

      const soloLastMod = document.createElement("div");
      soloLastMod.className = "last-modified";
      const soloDate = new Date(this.stats.global_stats.solo.lastmodified * 1000);
      soloLastMod.innerHTML = `Last Updated: ${soloDate.toLocaleDateString()} ${soloDate.toLocaleTimeString()}`;
      soloSection.appendChild(soloLastMod);

      wrapper.appendChild(soloSection);
    }

    if (this.config.showDuo && this.stats.global_stats.duo) {
      const duoSection = document.createElement("div");
      duoSection.className = "game-mode-section";

      const duoHeader = document.createElement("h3");
      duoHeader.innerHTML = "Duo";
      duoSection.appendChild(duoHeader);

      const duoTable = this.config.displayDirection === 'vertical'
        ? this.createVerticalTable(this.stats.global_stats.duo, "duo")
        : this.createHorizontalTable(this.stats.global_stats.duo, "duo");
      duoSection.appendChild(duoTable);

      const duoLastMod = document.createElement("div");
      duoLastMod.className = "last-modified";
      const duoDate = new Date(this.stats.global_stats.duo.lastmodified * 1000);
      duoLastMod.innerHTML = `Last Updated: ${duoDate.toLocaleDateString()} ${duoDate.toLocaleTimeString()}`;
      duoSection.appendChild(duoLastMod);

      wrapper.appendChild(duoSection);
    }

    return wrapper;
  },

  getStyles: function () {
    return ["MMM-fortnite-stats.css"];
  }
});
