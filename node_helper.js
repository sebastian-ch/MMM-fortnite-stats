const NodeHelper = require("node_helper")
const axios = require('axios');

module.exports = NodeHelper.create({
  start: function () {
    console.log('Starting node_helper for: ' + this.name);
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
        this.sendSocketNotification("PLAYER_STATS_RESULT", stats);
      } else {
        this.sendSocketNotification("PLAYER_STATS_ERROR", "Could not fetch stats");
      }
    }
  }
});