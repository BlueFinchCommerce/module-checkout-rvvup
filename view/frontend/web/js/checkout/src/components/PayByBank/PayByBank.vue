<template>
  <template v-if="rvvupPaymentsActive">
    <div
      v-if="isPayByBankActive"
      class="rvvup-method-container"
      :class="{ active: isMethodSelected, processing: isProcessing }"
      @click="selectPaymentCard"
      @keydown="selectPaymentCard"
    >
      <button
        class="rvvup-button payment-method"
        :aria-label="$t('rvvup.rvvupPaymentLabel')"
        type="button"
      >
        <span
          class="payment-method-radio"
          :class="{ selected: isMethodSelected }"
          aria-hidden="true"
        />
        <div class="payment-method-name">
          <span>
            {{ $t('rvvup.payByBankLabel') }}
          </span>
          <div v-html="icon" />
        </div>
      </button>

      <div
        v-if="isMethodSelected"
        class="rvvup-method"
      >
        <component
          :is="IframeComponent"
          v-if="payByBankDescriptionSrc && isMethodSelected"
          :title="'Rvvup payment modal'"
          :width="400"
          :height="480"
          :src="payByBankDescriptionSrc"
        />
        <button
          class="button button--primary button--checkout button--full"
          type="button"
          @click="startRvvupPayment"
        >
          <span>
            {{ $t('rvvup.payByBankButton') }}
          </span>
        </button>
      </div>
    </div>
    <component
      :is="Modal"
      :visible="showPaymentModal"
      :classes="'rvvup-modal'"
      :header="false"
      :footer="false"
      @close="cancelRvvupPayment"
    >
      <template #body>
        <component
          :is="IframeComponent"
          v-if="iframeUrl"
          :title="'Rvvup payment modal'"
          :width="frameWidth"
          :height="frameHeight"
          :src="iframeUrl"
        />
      </template>
    </component>
  </template>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import useRvvupStore from '../../stores/PaymentStores/RvvupStore';

import loadFromCheckout from '../../helpers/loadFromCheckout';

// Services
import getRvvupPaymentMethods from '../../services/getRvvupPaymentMethods';
import getRvvupPaymentActions from '../../services/getRvvupPaymentActions';

// icons
import rvvupPaymentSvg from '../../icons/rvvup-payment.svg';

export default {
  name: 'RvvupPayByBank',
  data() {
    return {
      isPayByBankActive: false,
      payByBankDescriptionSrc: '',
      isMethodSelected: false,
      showPaymentModal: false,
      frameWidth: null,
      frameHeight: null,
      orderId: null,
      iframeUrl: '',
      cancellationUrl: '',
      IframeComponent: null,
      Modal: null,
      icon: null,
      isProcessing: false,
    };
  },
  computed: {
    ...mapState(useRvvupStore, ['rvvupPaymentsActive']),
    /**
     * Get Cancel Url
     */
    getCancelActionUrl() {
      return this.cancelActions ? this.cancelActions.value : '';
    },
  },
  mounted() {
    window.addEventListener('message', (event) => {
      /* eslint-disable no-prototype-builtins */
      if (!this.isMethodSelected) {
        return;
      }

      const eventData = event.data;
      const eventType = eventData.type;

      if (eventType === 'rvvup-payment-modal|close') {
        this.cancelRvvupPayment();
      }

      if (eventType === 'rvvup-payment-modal|resize') {
        const height = eventData.hasOwnProperty('height') ? eventData.height : null;
        const width = eventData.hasOwnProperty('width') ? eventData.width : null;

        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const chosenWidth = width > windowWidth ? windowWidth - 100 : width;
        const chosenHeight = height > windowHeight ? windowHeight - 100 : height;

        this.frameHeight = chosenHeight;
        this.frameWidth = chosenWidth;
      }
    });
  },
  async created() {
    await this.getInitialConfigValues();
    await this.setPaymentErrors();

    const [
      IframeComponent,
      Modal,
      paymentStore,
    ] = await loadFromCheckout([
      'components.IframeComponent',
      'components.Modal',
      'stores.usePaymentStore',
    ]);

    this.IframeComponent = IframeComponent;
    this.Modal = Modal;
    this.icon = rvvupPaymentSvg;

    const availablePaymentMethods = await getRvvupPaymentMethods();

    const payByBank = this.getPayByBankMethod(availablePaymentMethods);

    // If there is no method then return early.
    if (!payByBank) {
      return;
    }

    this.isPayByBankActive = !!payByBank;
    this.payByBankDescriptionSrc = payByBank.summary_url;

    paymentStore.paymentEmitter.on('paymentProcessing', (processing) => {
      this.isProcessing = processing;
    });

    paymentStore.paymentEmitter.on('paymentMethodSelected', ({ type }) => {
      this.isMethodSelected = type === 'rvvup_yapily';
    });
  },
  methods: {
    ...mapActions(useRvvupStore, ['getInitialConfigValues']),

    /**
     * Remove URL Param
     * @param {*} key
     * @param {*} sourceURL
     */
    removeUrlErrorParam(key, sourceURL) {
      let rtn = sourceURL.split('?')[0];
      let param;
      let paramsArr = [];
      const queryString = (sourceURL.indexOf('?') !== -1) ? sourceURL.split('?')[1] : '';
      if (queryString !== '') {
        paramsArr = queryString.split('&');
        for (let i = paramsArr.length - 1; i >= 0; i -= 1) {
          [param] = paramsArr[i].split('=');
          if (param === key) {
            paramsArr.splice(i, 1);
          }
        }
        if (paramsArr.length) rtn = `${rtn}?${paramsArr.join('&')}`;
      }
      return rtn;
    },

    /**
     *
     * @param {*} paymentMethodsResponse
     */
    getPayByBankMethod(paymentMethodsResponse) {
      return paymentMethodsResponse.find((method) => method.code === 'rvvup_yapily');
    },

    /**
     * Select Pay by bank method
     */
    async selectPaymentCard() {
      const [
        paymentStore,
      ] = await loadFromCheckout([
        'stores.usePaymentStore',
      ]);

      // Emit event on RVVUP selected
      paymentStore.paymentEmitter.emit('paymentMethodSelected', { type: 'rvvup_yapily' });

      this.isMethodSelected = true;
      paymentStore.selectPaymentMethod('rvvup_yapily');
    },

    /**
     * Open modal
     * @param {*} event
     */
    openModal() {
      document.body.classList.add('no-scrollable');
      this.showPaymentModal = true;
    },

    /**
     * Close Modal
     */
    closeModal() {
      document.body.classList.remove('no-scrollable');
      this.showPaymentModal = false;
    },

    /**
     * set Iframe Url
     * @param {*} url
     */
    setIframeUrl(url) {
      this.iframeUrl = url;
    },

    /**
     * set Cancellation Url
     * @param {*} url
     */
    setCancellationUrl(url) {
      this.cancellationUrl = url;
    },

    /**
     * Set Payment Errors
     */
    async setPaymentErrors() {
      const [
        paymentStore,
      ] = await loadFromCheckout([
        'stores.usePaymentStore',
      ]);

      const { href } = window.location;
      const params = href.split('?')[1];

      // Be sure url params exist
      if (params && params !== '') {
        const result = params.split('&').reduce((res, item) => {
          const [key, value] = item.split('=');
          return { ...res, [key]: value };
        }, {});

        let message;

        Object.keys(result).forEach((objectKey) => {
          if (result[objectKey] === 'cancelled') {
            message = this.$t('errorMessages.rvvupPayment.cancelled');
          } else if (result[objectKey] === 'unexpected') {
            message = this.$t('errorMessages.rvvupPayment.unexpected');
          } else if (result[objectKey] === 'declined') {
            message = this.$t('errorMessages.rvvupPayment.declined');
          } else if (result[objectKey] === 'expired') {
            message = this.$t('errorMessages.rvvupPayment.expired');
          } else if (result[objectKey] === 'failed') {
            message = this.$t('errorMessages.rvvupPayment.failed');
          } else {
            message = this.$t('errorMessages.rvvupPayment.other');
          }
        });

        paymentStore.setPaymentErrorMessage(message);

        // remove url param after 5 seconds to clear checkout payments url
        // clear error messages after 5 seconds

        setTimeout(() => {
          const alteredURL = this.removeUrlErrorParam('status', href);
          window.history.replaceState(null, '', alteredURL);
          paymentStore.setPaymentErrorMessage('');
        }, 10000);
      }
    },

    /**
     * Start Rvvup Payment:
     * Create order and store order id
     * Call Rvvup once order is created
     */
    async startRvvupPayment() {
      const [
        createPaymentGraphQl,
        getQuote,
        loadingStore,
        paymentStore,
      ] = await loadFromCheckout([
        'services.createPaymentGraphQl',
        'services.getQuote',
        'stores.useLoadingStore',
        'stores.usePaymentStore',
      ]);

      paymentStore.paymentEmitter.emit('paymentProcessing', true);

      loadingStore.setLoadingState(true);

      const data = {
        code: 'rvvup_YAPILY',
      };

      const quote = await getQuote();

      createPaymentGraphQl(data)
        .then((response) => {
          this.orderId = response;
          this.rvvupPaymentActions(quote.id);
        })
        .catch((error) => {
          paymentStore.paymentEmitter.emit('paymentProcessing', false);
          /* @todo - handle errors */
          setTimeout(() => {
            paymentStore.setPaymentErrorMessage(this.$t('errorMessages.rvvupPayment.qtyNotAvailable'));
            this.isMethodSelected = false;
            throw Error(error);
          }, 5000);
        });

      setTimeout(() => {
        paymentStore.setPaymentErrorMessage('');
      }, 20000);
    },

    /**
     * Call Rvvup
     * On success then set the cancel and success actions.
     * If there is a success action and a url then use it to set the iframe url
     * Open modal on success and handle errors on fail.
     */
    async rvvupPaymentActions(id) {
      const [
        loadingStore,
      ] = await loadFromCheckout([
        'stores.useLoadingStore',
      ]);

      await getRvvupPaymentActions(id)
        .then((response) => {
          const authorization = response.find((method) => method.type === 'authorization');
          const cancel = response.find((method) => method.type === 'cancel');

          if (authorization && authorization.value) {
            loadingStore.setLoadingState(false);
            this.setIframeUrl(authorization.value);
            this.setCancellationUrl(cancel.value);
            this.openModal();
          } else {
            /* @todo - handle errors */
          }
        }).catch((error) => {
          /* @todo - handle errors */
          throw Error(error);
        });
    },

    /**
     * Cancel Rvvup Payment
     */
    cancelRvvupPayment() {
      if (this.cancellationUrl) {
        this.setIframeUrl(this.cancellationUrl);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./styles.scss";
</style>
