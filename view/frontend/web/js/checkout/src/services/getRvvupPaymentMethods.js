import loadFromCheckout from '../helpers/loadFromCheckout';

export default async () => {
  const [
    getBaseRestUrl,
    tokenTypes,
    authenticatedRequest,
    cartStore,
    customerStore,
  ] = await loadFromCheckout([
    'helpers.getBaseRestUrl',
    'helpers.getTokenTypes',
    'services.authenticatedRequest',
    'stores.useCartStore',
    'stores.useCustomerStore',
  ]);

  const { customer: { tokenType } } = customerStore;
  const { maskedId } = cartStore;

  /**
   * For logged-in customers use: GET /V1/rvvup/vue-config/mine
   * For guests use: GET /V1/rvvup/vue-config/:quoteId
   */

  const guestUrl = `${getBaseRestUrl()}/rvvup/vue-config/${maskedId}`;
  const authUrl = `${getBaseRestUrl()}/rvvup/vue-config/mine`;

  const request = tokenType === tokenTypes.guestUser
    ? authenticatedRequest().get(guestUrl)
    : authenticatedRequest().get(authUrl);

  return request.then((response) => response.data);
};
