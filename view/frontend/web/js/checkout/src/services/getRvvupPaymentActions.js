import loadFromCheckout from '../helpers/loadFromCheckout';

export default async (id) => {
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

  const guestUrl = `${getBaseRestUrl()}/rvvup/payments/${maskedId}/payment-actions`;
  const authUrl = `${getBaseRestUrl()}/rvvup/payments/mine/${id}/payment-actions`;

  const payload = {};

  const request = tokenType === tokenTypes.guestUser
    ? authenticatedRequest().get(guestUrl, { payload })
    : authenticatedRequest().get(authUrl, { payload });

  return request.then((response) => response.data);
};
