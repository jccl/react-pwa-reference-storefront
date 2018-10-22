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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ChatBot, { Loading } from 'react-simple-chatbot';
import { ThemeProvider } from 'styled-components';

import imgPlaceholder from '../images/img-placeholder.png';

import './chatbot.main.less';

const Config = require('Config');

const url = 'https://gateway.watsonplatform.net/assistant/api/v1/workspaces/ea9a8569-e4e0-46be-9440-5ba98465d915/message?version=2018-09-20';
const userAuth = '01c1efab-67b8-4952-8bd3-214ed36c36dd:uibLNrVJ8ciY';

class WatsonChat extends Component {
  static propTypes = {
    triggerNextStep: PropTypes.func,
    steps: PropTypes.objectOf(PropTypes.any),
  }

  static defaultProps = {
    triggerNextStep: () => {},
    steps: {},
  }

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      result: '',
      results: [],
    };
  }

  componentWillMount() {
    const apiAuth = `Basic ${btoa(userAuth)}`;
    const { steps } = this.props;
    const chatInput = steps.search.value;
    fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: apiAuth,
      },
      body: JSON.stringify({
        input: {
          text: chatInput,
        },
      }),
    })
      .then(res => res.json())
      .then((res) => {
        // eslint-disable-next-line no-console
        console.log(res);
        const outputText = res.output.text[0];
        if (res.entities && res.entities.length > 0) {
          const matches = outputText.match(/\[(.*?)\]/);
          let resultText = outputText;
          if (matches) {
            resultText = outputText.replace(matches[1], '').slice(0, -2);
          }
          this.setState({
            loading: false,
            results: res.entities,
            result: resultText,
          }, () => {
            const { triggerNextStep } = this.props;
            triggerNextStep();
          });
        } else {
          this.setState({
            loading: false,
            result: outputText,
          }, () => {
            const { triggerNextStep } = this.props;
            triggerNextStep();
          });
        }
      });
  }

  sentenceCase(str) {
    this.funcName = 'sentenceCase';
    return str.toLowerCase().split(' ').map(word => (word.charAt(0).toUpperCase() + word.slice(1))).join(' ');
  }

  render() {
    const { loading, result, results } = this.state;

    if (results.length > 0) {
      return (
        <div className="chatbot">
          <p className="chatbot-result-title">
            {result}
          </p>
          {
            results.map(resultsEntry => (
              <div key={resultsEntry.value} className="chatbot-results">
                <a href="https://s3.amazonaws.com/referenceexp/ar/VESTRI_21_TURBINE_WHEEL_PACKAGE_GRAY.usdz" rel="ar">
                  <img
                    src={Config.skuImagesUrl.replace('%sku%', resultsEntry.value)}
                    onError={(e) => { e.target.src = imgPlaceholder; }}
                    alt="default"
                    className="category-item-thumbnail img-responsive"
                    title=""
                  />
                </a>
                <label htmlFor="chatbot results entry" className="chatbot-results-entry">
                  {this.sentenceCase(resultsEntry.value.replace(/_/g, ' '))}
                </label>
              </div>
            ))
          }
        </div>
      );
    }
    return (
      <div
        className="chatbot"
      >
        {loading ? <Loading /> : result}
        {
          !loading
          && (
            <div
              className="chat-bot-loading"
            />)
        }
      </div>
    );
  }
}

const theme = {
  background: '#f5f8fb',
  headerBgColor: '#40b1f3',
  headerFontColor: '#fff',
  headerFontSize: '20px',
  botBubbleColor: '#40b1f3',
  botFontColor: '#fff',
  userBubbleColor: '#fff',
  userFontColor: '#4a4a4a',
};

const WatsonChatWrapper = () => (
  <ThemeProvider theme={theme}>
    <ChatBot
      floating
      hideBotAvatar
      headerTitle="Ask Arlene using Watson"
      enableMobileAutoFocus
      steps={[
        {
          id: '1',
          message: 'Type something to search on Cortex using Watson. (Ex.: find black shoes)',
          trigger: 'search',
        },
        {
          id: 'search',
          user: true,
          trigger: '3',
        },
        {
          id: '3',
          component: <WatsonChat />,
          waitAction: true,
          trigger: '1',
        },
      ]}
    />
  </ThemeProvider>
);

export default WatsonChatWrapper;
