[![CircleCI](https://dl.circleci.com/status-badge/img/gh/bluefinchcommerce/module-checkout-rvvup/tree/main.svg?style=svg&circle-token=CCIPRJ_N1JCqhHWWgbpN2D3HLFU5X_777eea46813bc2d747d939a06c3250a3c8adcdc9)](https://dl.circleci.com/status-badge/redirect/gh/bluefinchcommerce/module-checkout-rvvup/tree/main)

![Checkout Powered by BlueFinch](./assets/logo.svg)

# Checkout Rvvup Module

## Requirements

- Magento 2.4.6 or higher
- Node 16 or higher (for development purposes only)
- Latest version of BlueFinch Checkout

## Installation

Ensure you have installed the latest version of BlueFinch Checkout, which can be found here, [BlueFinch Checkout](https://github.com/bluefinchcommerce/module-checkout).

To install the Checkout Rvvup module, run the following command in your Magento 2 root directory:

``` composer require bluefinch/module-checkout-rvvup ```

Checkout Rvvup follows the standard installation process for Adobe Commerce.

For information about a module installation in Adobe Commerce, see [Enable or disable modules](https://experienceleague.adobe.com/en/docs/commerce-operations/installation-guide/tutorials/manage-modules).

Remember to clear any appropriate caches.

Once installed the module follows the same configuration settings as prescribed by the official rvvup integration documentation, see [Rvvup for Magento](https://help.rvvup.com/hc/en-gb/articles/13742786115217-Rvvup-for-Magento-Installation-Guide).

## CircleCi

CircleCi is a tool for us to use to allow for tested to be run on our modules before they are deployed.

This template comes with EsLint and PHPStan.

You can add more tests to this if you need to.


### Testing your module locally

You can test CircleCi before you push your code.

To do this you need to install circleci locally.

``` brew install circleci```

Then once this has been installed in the main directory of your package then.

```circleci local execute```