import { defineStore } from 'pinia';

import loadFromCheckout from '../../helpers/loadFromCheckout';

export default defineStore('rvvupStore', {
  state: () => ({
    cache: {},
  }),
  getters: {
  },
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
          adyen_environment_mode
          adyen_vault_enabled
          adyen_client_key_live
          adyen_client_key_test
          adyen_version_number
        }
      }`).then(this.handleInitialConfig).then(this.getVaultConfig);

      await this.getCachedResponse(request, 'getInitialConfig');
    },

    handleInitialConfig(config) {
      if (config?.data?.storeConfig) {
        this.setData({
          // Adyen's modes are '0' = live, '1' = test.
          adyenEnvironmentMode: config.data.storeConfig.adyen_environment_mode === '0' ? 'live' : 'test',
          adyenVaultEnabled: config.data.storeConfig.adyen_vault_enabled,
          keyLive: config.data.storeConfig.adyen_client_key_live,
          keyTest: config.data.storeConfig.adyen_client_key_test,
          version: config.data.storeConfig.adyen_version_number,
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

    clearPaymentReponseCache() {
      this.clearCaches(['getAdyenPaymentMethods']);
    },

    clearCaches(cacheKeys) {
      if (cacheKeys.length) {
        cacheKeys.forEach((cacheKey) => {
          this.setData({
            cache: {
              [cacheKey]: undefined,
            },
          });
        });
      }
    },
  },
});
