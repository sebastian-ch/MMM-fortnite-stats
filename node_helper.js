const NodeHelper = require("node_helper");
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = NodeHelper.create({
  start: function () {
    console.log('Starting node_helper for: ' + this.name);
    this.dataDir = path.join(__dirname, 'data');
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir);
    }
  },

  getPreviousStats: function () {
    try {
      const previousFile = 'fortnite_stats_2025-06-07.json';
      console.log(`[${this.name}] Looking for previous stats file: ${previousFile}`);

      if (fs.existsSync(path.join(this.dataDir, previousFile))) {
        console.log(`[${this.name}] Found previous stats file`);
        const previousStats = JSON.parse(
          fs.readFileSync(path.join(this.dataDir, previousFile))
        );
        return previousStats;
      }
      console.log(`[${this.name}] No previous stats file found`);
    } catch (error) {
      console.error(`[${this.name}] Error reading previous stats:`, error);
    }
    return null;
  },

  saveCurrentStats: function (stats) {
    try {
      const today = new Date();
      const filename = `fortnite_stats_${today.toISOString().split('T')[0]}.json`;
      const filepath = path.join(this.dataDir, filename);

      console.log(`[${this.name}] Saving current stats to: ${filename}`);
      fs.writeFileSync(filepath, JSON.stringify(stats, null, 2));

      // Clean up old files
      const files = fs.readdirSync(this.dataDir)
        .filter(file => file.startsWith('fortnite_stats_'))
        .sort();

      while (files.length > 2) {
        const oldFile = files.shift();
        console.log(`[${this.name}] Removing old stats file: ${oldFile}`);
        fs.unlinkSync(path.join(this.dataDir, oldFile));
      }
    } catch (error) {
      console.error(`[${this.name}] Error saving stats:`, error);
    }
  },

  async lookUpUserID(username, apiKey) {
    const url = `https://fortniteapi.io/v2/lookup?username=${username}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': apiKey
        }
      });
      return response.data.account_id;
    } catch (error) {
      console.error('Error looking up user:', error.response?.data || error.message);
      return null;
    }
  },

  async getPlayerStats(accountId, apiKey) {
    const url = `https://fortniteapi.io/v1/stats?account=${accountId}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting stats:', error.response?.data || error.message);
      return null;
    }
  },

  async socketNotificationReceived(notification, payload) {
    if (notification === "GET_PLAYER_STATS") {
      if (!payload.username || !payload.apiKey) {
        this.sendSocketNotification("PLAYER_STATS_ERROR", "Username and API key are required");
        return;
      }

      const accountId = await this.lookUpUserID(payload.username, payload.apiKey);
      if (!accountId) {
        this.sendSocketNotification("PLAYER_STATS_ERROR", "Could not find user ID");
        return;
      }

      const stats = await this.getPlayerStats(accountId, payload.apiKey);
      if (stats) {
        const previousStats = this.getPreviousStats();
        this.saveCurrentStats(stats);
        this.sendSocketNotification("PLAYER_STATS_RESULT", {
          current: stats,
          previous: previousStats
        });
      } else {
        this.sendSocketNotification("PLAYER_STATS_ERROR", "Could not fetch stats");
      }
    }
  }
});