import Binance, { Ticker } from 'binance-api-node';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CommonService } from './common-service/common.service';
import { KEY_REDIS } from './common/enum/key-redis.enum';

import { SocketGateway } from './providers/socket/socket.gateway';
import { SOCKET_EVENT } from './providers/socket/socket.enum';
import { SYMBOL_PAIR } from './common/enum/symbol-pair.enum';
import BigNumber from 'bignumber.js';
import { BREAK_EVEN } from './common/constants';
const dayjs = require('dayjs');

@Injectable()
export class CrawlerService implements OnModuleInit {
  private readonly logger = new Logger(CrawlerService.name);

  private count = 0;

  private bestBidBTCUSDT: string;
  private bestAskBTCUSDT: string;
  private bestBidETHBTC: string;
  private bestAskETHBTC: string;
  private bestBidETHUSDT: string;
  private bestAskETHUSDT: string;

  private profitRate: string;

  constructor(
    private readonly commonService: CommonService,
    private readonly socketGateway: SocketGateway
  ) {
    this.bestBidBTCUSDT = this.commonService.getCache(KEY_REDIS.BestBidBTCUSDT);
    this.bestAskBTCUSDT = this.commonService.getCache(KEY_REDIS.BestAskBTCUSDT);
    this.bestBidETHBTC = this.commonService.getCache(KEY_REDIS.BestBidETHBTC);
    this.bestAskETHBTC = this.commonService.getCache(KEY_REDIS.BestAskETHBTC);
    this.bestBidETHUSDT = this.commonService.getCache(KEY_REDIS.BestBidETHUSDT);
    this.bestAskETHUSDT = this.commonService.getCache(KEY_REDIS.BestAskETHUSDT);

    this.profitRate = BREAK_EVEN;
  }

  async onModuleInit() {
    this.logger.debug(`Initialization start crawler...`);

    this.innitialize();

    // this.test();

    this.logger.debug(`End Initialization data...`);
  }

  async test() {
    setInterval(async () => {
      const r = (Math.random() + 1).toString(36).substring(7);
      this.socketGateway.sendMessage('test', r);
    }, 5000);
  }

  private handleWhenTickerChange(
    rate: string,
    socketEvent: string,
    keyRedisRate: string,
    isRateToCalc: boolean = false
  ) {
    this.socketGateway.sendMessage(socketEvent, rate);
    this.commonService.setCache(keyRedisRate, rate);
    isRateToCalc && this.calculateProfitRate();
  }

  private isNewRate(storedRate: string, newRate: string) {
    if (newRate !== storedRate) {
      return true;
    }
    return false;
  }

  private async innitialize() {
    const client = Binance() as any;

    client.ws.bookTicker(SYMBOL_PAIR.BTCUSDT, async (ticker: Ticker) => {
      const isNewRateBid = this.isNewRate(this.bestBidBTCUSDT, ticker.bestBid);

      // when bid rate changes
      if (isNewRateBid) {
        this.bestBidBTCUSDT = ticker.bestBid;
        this.handleWhenTickerChange(
          ticker.bestBid,
          SOCKET_EVENT.BID_BTCUSDT,
          KEY_REDIS.BestBidBTCUSDT
        );
      }

      const isNewRateAsk = this.isNewRate(this.bestAskBTCUSDT, ticker.bestAsk);
      // when ask rate changes
      if (isNewRateAsk) {
        this.bestAskBTCUSDT = ticker.bestAsk;
        this.handleWhenTickerChange(
          ticker.bestAsk,
          SOCKET_EVENT.ASK_BTCUSDT,
          KEY_REDIS.BestAskBTCUSDT,
          false
        );
      }
    });

    client.ws.bookTicker(SYMBOL_PAIR.ETHBTC, async (ticker: Ticker) => {
      const isNewRateBid = this.isNewRate(this.bestBidETHBTC, ticker.bestBid);
      // when bid rate changes
      if (isNewRateBid) {
        this.bestBidETHBTC = ticker.bestBid;
        this.handleWhenTickerChange(
          ticker.bestBid,
          SOCKET_EVENT.BID_ETHBTC,
          KEY_REDIS.BestBidETHBTC
        );
      }

      const isNewRateAsk = this.isNewRate(this.bestAskETHBTC, ticker.bestAsk);
      // when ask rate changes
      if (isNewRateAsk) {
        this.bestAskETHBTC = ticker.bestAsk;
        this.handleWhenTickerChange(
          ticker.bestAsk,
          SOCKET_EVENT.ASK_ETHBTC,
          KEY_REDIS.BestAskETHBTC,
          true
        );
      }
    });

    client.ws.bookTicker(SYMBOL_PAIR.ETHUSDT, async (ticker: Ticker) => {
      const isNewRateBid = this.isNewRate(this.bestBidETHUSDT, ticker.bestBid);
      // when bid rate changes
      if (isNewRateBid) {
        this.bestBidETHUSDT = ticker.bestBid;
        this.handleWhenTickerChange(
          ticker.bestBid,
          SOCKET_EVENT.BID_ETHUSDT,
          KEY_REDIS.BestBidETHUSDT,
          true
        );
      }

      const isNewRateAsk = this.isNewRate(this.bestAskETHUSDT, ticker.bestAsk);
      // when ask rate changes
      if (isNewRateAsk) {
        this.bestAskETHUSDT = ticker.bestAsk;
        this.handleWhenTickerChange(
          ticker.bestAsk,
          SOCKET_EVENT.ASK_ETHUSDT,
          KEY_REDIS.BestAskETHUSDT
        );
      }
    });
  }

  calculateProfitRate() {
    this.profitRate = new BigNumber(this.bestAskBTCUSDT)
      .multipliedBy(new BigNumber(this.bestAskETHBTC))
      .dividedBy(new BigNumber(this.bestBidETHUSDT))
      .toFixed(6)
      .toString();

    // this.logger.debug(
    //   `Lợi nhuận::  ${this.profitRate} in timestamps: ${Date.now()}, count: ${this.count}`
    // );

    const profit = this.profitRate === 'NaN' ? BREAK_EVEN : this.profitRate;

    if (Number(profit) > 1) {
      const now = Date.now();
      const nowFormat = dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS');
      this.count++;
      const value = `[ ${nowFormat} ] USDT - buy(${Number(this.bestAskBTCUSDT).toFixed(
        2
      )}) => BTC - buy(${Number(this.bestAskETHBTC).toFixed(6)}) => ETH - sell(${Number(
        this.bestBidETHUSDT
      ).toFixed(4)}) => USDT. Profit rate: ${Number(profit).toFixed(6)}`;
      this.socketGateway.sendMessage(SOCKET_EVENT.PROFIT_RATE, value);
      this.logger.debug(`count:: ${this.count}`);

      this.commonService.zAddSortSet(value, now);
    }
  }
}
