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
    this.previousStats = null;  // Add previous stats storage
    this.error = null;
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
      this.error = null;
      this.stats = payload.current;
      this.previousStats = payload.previous;
      this.updateDom();
    } else if (notification === "PLAYER_STATS_ERROR") {
      this.error = payload;
      this.updateDom();
    }
  },

  createStatDiff: function (current, previous, statKey) {
    if (!previous) return '';

    const currentValue = current[statKey] || 0;
    const previousValue = previous[statKey] || 0;
    const diff = currentValue - previousValue;

    if (diff === 0) return `<span class="stat-diff gray">&nbsp;0</span>`;

    const arrow = diff > 0 ? '▲' : '▼';
    const color = diff > 0 ? 'green' : 'red';
    const sign = diff > 0 ? '+' : '';
    const displayValue = statKey === 'kd' ? Math.abs(diff).toFixed(2) : Math.abs(diff);
    return `<div class="stat-diff ${color}">&nbsp;${arrow}${sign}${displayValue}</div>`;
  },

  createStatsRow: function (stats, mode) {
    const row = document.createElement("tr");
    row.className = "stats-row";

    const previousStats = this.previousStats?.global_stats?.[mode];
    const statsConfig = [
      { key: 'matchesplayed' },
      { key: 'placetop1' },
      { key: mode === 'solo' ? 'placetop10' : 'placetop12' },
      { key: 'kills' },
      { key: 'kd' }
    ];

    row.innerHTML = statsConfig.map(stat => {
      const currentValue = stats[stat.key] || 0;
      const diff = this.createStatDiff(stats, previousStats, stat.key);
      return `<td>${currentValue}${diff}</td>`;
    }).join('');

    return row;
  },

  createVerticalTable: function (stats, mode) {
    const table = document.createElement("table");
    table.className = "vertical-stats-table";

    const previousStats = this.previousStats?.global_stats?.[mode];
    const statsConfig = [
      { label: "Matches", key: "matchesplayed" },
      { label: "Wins", key: "placetop1" },
      { label: mode === "solo" ? "Top 10" : "Top 12", key: mode === "solo" ? "placetop10" : "placetop12" },
      { label: "Kills", key: "kills" },
      { label: "K/D", key: "kd" }
    ];

    statsConfig.forEach(stat => {
      const row = document.createElement("tr");
      const currentValue = stats[stat.key] || 0;
      const diff = this.createStatDiff(stats, previousStats, stat.key);
      row.innerHTML = `
        <td class="stat-label">${stat.label}</td>
        <td class="stat-value">${currentValue}</td>
        <td class="stat-diff-cell">${diff}</td>
      `;
      table.appendChild(row);
    });

    return table;
  },

  createHorizontalTable: function (stats, mode) {
    const table = document.createElement("table");
    table.className = "horizontal-stats-table";

    // Header row stays the same
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

    // Stats row without differences
    table.appendChild(this.createStatsRow(stats, mode));

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
