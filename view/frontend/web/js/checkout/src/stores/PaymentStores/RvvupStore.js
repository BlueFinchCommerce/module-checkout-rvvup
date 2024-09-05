import { defineStore } from 'pinia';

import loadFromCheckout from '../../helpers/loadFromCheckout';

export default defineStore('rvvupStore', {
  state: () => ({
    cache: {},
    rvvupPaymentsActive: false,
  }),
  actions: {
    setData(data) {
      this.$patch(data);
    },

    async getInitialConfigValues() {
      const [
        graphQlRequest,
      ] = await loadFromCheckout([
        'services.graphQlRequest',
      ]);

      const request = async () => graphQlRequest(`{
        storeConfig {
          rvvup_payments_active
        }
      }`).then(this.handleInitialConfig).then(this.getVaultConfig);

      await this.getCachedResponse(request, 'getInitialConfig');
    },

    handleInitialConfig(config) {
      if (config?.data?.storeConfig) {
        this.setData({
          rvvupPaymentsActive: !!Number(config.data.storeConfig.rvvup_payments_active),
        });
      }
    },

    getCachedResponse(request, cacheKey, args = {}) {
      if (typeof this.$state.cache[cacheKey] !== 'undefined') {
        return this.$state.cache[cacheKey];
      }

      const data = request(args);
      this.$patch({
        cache: {
          [cacheKey]: data,
        },
      });
      return data;
    },
  },
});
