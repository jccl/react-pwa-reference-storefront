/**
 * Copyright © 2018 Elastic Path Software Inc. All rights reserved.
 *
 * This is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this license. If not, see
 *
 *     https://www.gnu.org/licenses/
 *
 *
 */

import React from 'react';
import ReactRouterPropTypes from 'react-router-prop-types';
import intl from 'react-intl-universal';
import { login } from '../utils/AuthService';
import QuickOrderMain from '../components/quickorder.main';
import {
  setPaymentTotalDetails, showPaymentRequest, newPaymentRequest, isPaymentRequestAvailable,
} from '../utils/Payment';
import CartMain from '../components/cart.main';
import CheckoutSummaryList from '../components/checkout.summarylist';
import AddPromotionContainer from '../components/add.promotion.container';
import { cortexFetch } from '../utils/Cortex';
import './CartPage.less';

const Config = require('Config');

// Array of zoom parameters to pass to Cortex
const zoomArray = [
  'defaultcart',
  'defaultcart:total',
  'defaultcart:discount',
  'defaultcart:order',
  'defaultcart:order:tax',
  'defaultcart:order:total',
  'defaultcart:appliedpromotions:element',
  'defaultcart:order:couponinfo:coupon',
  'defaultcart:order:couponinfo:couponform',
  // zooms for billing address
  'defaultcart:order:billingaddressinfo:billingaddress',
  'defaultcart:order:billingaddressinfo:selector:choice',
  'defaultcart:order:billingaddressinfo:selector:choice:description',
  // zooms for shipping address
  'defaultcart:order:deliveries:element:destinationinfo:destination',
  'defaultcart:order:deliveries:element:destinationinfo:selector:choice',
  'defaultcart:order:deliveries:element:destinationinfo:selector:choice:description',
  // zooms for shipping options
  'defaultcart:order:deliveries:element:shippingoptioninfo:shippingoption',
  'defaultcart:order:deliveries:element:shippingoptioninfo:selector:choice',
  'defaultcart:order:deliveries:element:shippingoptioninfo:selector:choice:description',
  // zooms for payment methods
  'defaultcart:order:paymentmethodinfo:paymentmethod',
  'defaultcart:order:paymentmethodinfo:selector:choice',
  'defaultcart:order:paymentmethodinfo:selector:choice:description',
  'defaultcart:lineitems:element',
  'defaultcart:lineitems:element:total',
  'defaultcart:lineitems:element:price',
  'defaultcart:lineitems:element:availability',
  'defaultcart:lineitems:element:appliedpromotions',
  'defaultcart:lineitems:element:appliedpromotions:element',
  'defaultcart:lineitems:element:item',
  'defaultcart:lineitems:element:item:code',
  'defaultcart:lineitems:element:item:definition',
  'defaultcart:lineitems:element:item:definition:item',
  'defaultcart:lineitems:element:item:definition:details',
  'defaultcart:lineitems:element:dependentoptions:element:definition',
  'defaultcart:lineitems:element:dependentlineitems:element:item:definition',
  'defaultcart:lineitems:element:item:definition:options:element',
  'defaultcart:lineitems:element:item:definition:options:element:value',
  'defaultcart:lineitems:element:item:definition:options:element:selector:choice',
  'defaultcart:lineitems:element:item:definition:options:element:selector:chosen',
  'defaultcart:lineitems:element:item:definition:options:element:selector:choice:description',
  'defaultcart:lineitems:element:item:definition:options:element:selector:chosen:description',
];

class CartPage extends React.Component {
  static propTypes = {
    history: ReactRouterPropTypes.history.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      cartData: undefined,
      isLoading: false,
    };
  }

  componentDidMount() {
    this.fetchCartData();
  }

  componentWillReceiveProps() {
    this.fetchCartData();
  }

  fetchCartData() {
    login().then(() => {
      cortexFetch(`/?zoom=${zoomArray.sort().join()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem(`${Config.cortexApi.scope}_oAuthToken`),
        },
      })
        .then(res => res.json())
        .then((res) => {
          this.setState({
            cartData: res._defaultcart[0],
            isLoading: false,
          });
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(error.message);
        });
    });
  }

  handleQuantityChange() {
    this.setState({ isLoading: true });
    this.fetchCartData();
  }

  checkout() {
    const { history } = this.props;
    if (localStorage.getItem(`${Config.cortexApi.scope}_oAuthRole`) === 'REGISTERED') {
      history.push('/checkout');
    } else {
      history.push('/signIn');
    }
  }

  checkoutPaymentRequest() {
    // const { history } = this.props;
    const { cartData } = this.state;
    // if (localStorage.getItem(`${Config.cortexApi.scope}_oAuthRole`) === 'REGISTERED') {
    // history.push('/checkout');
    // orderData._lineitems[0]._element.map((product) => {
    //   const test = 'test';
    //   return (setPaymentDisplayItem(product._item[0]._definition[0]['display-name'], product._price[0]['purchase-price'][0].currency, product._price[0]['purchase-price'][0].amount));
    // });
    setPaymentTotalDetails(cartData._lineitems, cartData._total[0].cost[0].currency, cartData._order[0]._total[0].cost[0].amount);
    newPaymentRequest();
    showPaymentRequest();
    // } else {
    //   history.push('/signIn');
    // }
  }

  renderDiscount() {
    const { cartData } = this.state;
    if (cartData._discount) {
      return (
        <li className="cart-discount">
          <label htmlFor="cart_summary_discount_label" className="cart-summary-label-col">
            {intl.get('discount-at-checkout')}
            :&nbsp;
          </label>
          <span className="cart-summary-value-col">
            {cartData._discount[0].discount[0].display}
          </span>
        </li>
      );
    }
    return ('');
  }

  render() {
    const { cartData, isLoading } = this.state;
    // eslint-disable-next-line no-console
    console.log(cartData);
    return (
      <div className="cart-container container">
        <div className="cart-container-inner">
          <div data-region="cartTitleRegion" className="cart-title-container" style={{ display: 'block' }}>
            <div>
              {cartData && !isLoading && (
                <h1 className="view-title">
                  {intl.get('shopping-cart')}
                  &nbsp;
                  (
                    {cartData['total-quantity']}
                  )
                </h1>
              )}
              {(!cartData || isLoading) && (
                <h1 className="view-title">
                  {intl.get('shopping-cart')}
                  &nbsp;
                </h1>
              )}
            </div>
          </div>
          {(Config.b2b.enable) ? (
            <QuickOrderMain onAddToCart={() => { this.fetchCartData(); }} />
          ) : ('')}
          {cartData && !isLoading && (
            <div data-region="mainCartRegion" className="cart-main-container" style={{ display: 'block' }}>
              <CartMain empty={!cartData['total-quantity'] || cartData._lineitems === undefined} cartData={cartData} handleQuantityChange={() => { this.handleQuantityChange(); }} />
            </div>
          )}
          {cartData && !isLoading && (
            <div className="cart-sidebar" data-region="cartCheckoutMasterRegion" style={{ display: 'block' }}>
              <div>
                <div className="cart-sidebar-inner">
                  <div data-region="cartSummaryRegion" className="cart-summary-container" style={{ display: 'inline-block' }}>
                    <AddPromotionContainer data={cartData} onSubmittedPromotion={() => { this.fetchCartData(); }} />
                    <CheckoutSummaryList data={cartData} onChange={() => { this.fetchCartData(); }} />
                  </div>
                  <div data-region="cartCheckoutActionRegion" className="cart-checkout-container" style={{ display: 'block' }}>
                    <div>
                      <button className="ep-btn primary wide btn-cmd-checkout" disabled={!cartData['total-quantity']} type="button" onClick={() => { this.checkout(); }}>
                        {intl.get('proceed-to-checkout')}
                      </button>
                      {(isPaymentRequestAvailable)
                        ? (
                          <div>
                            <button className="btn-cmd-checkout" disabled={!cartData['total-quantity']} type="button" onClick={() => { this.checkoutPaymentRequest(); }}>
                              {intl.get('ep-pay')}
                            </button>
                          </div>
                        ) : ''
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {(!cartData || isLoading) && (
            <div data-region="mainCartRegion" className="cart-main-container" style={{ display: 'block' }}>
              <div className="loader" />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default CartPage;
