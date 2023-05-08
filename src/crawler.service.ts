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
import { Graph } from '@dagrejs/graphlib';
import { CURRENCY } from './common/enum/currency.enum';

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

  private graph: Graph;

  constructor(
    private readonly commonService: CommonService,
    private readonly socketGateway: SocketGateway
  ) {
    this.profitRate = BREAK_EVEN;
    this.graph = new Graph();
  }

  async onModuleInit() {
    this.logger.debug(`Initialization start crawler...`);
    await this.getRateCache();
    await this.buildGraph();

    setTimeout(() => this.start(), 3000);

    this.logger.debug(`End Initialization data...`);
  }

  async getRateCache() {
    this.bestBidBTCUSDT = await this.commonService.getCache(KEY_REDIS.BestBidBTCUSDT);
    this.bestAskBTCUSDT = await this.commonService.getCache(KEY_REDIS.BestAskBTCUSDT);
    this.bestBidETHBTC = await this.commonService.getCache(KEY_REDIS.BestBidETHBTC);
    this.bestAskETHBTC = await this.commonService.getCache(KEY_REDIS.BestAskETHBTC);
    this.bestBidETHUSDT = await this.commonService.getCache(KEY_REDIS.BestBidETHUSDT);
    this.bestAskETHUSDT = await this.commonService.getCache(KEY_REDIS.BestAskETHUSDT);
  }

  async buildGraph() {
    // Add nodes to the graph
    this.graph.setNode(CURRENCY.USDT); // USDT
    this.graph.setNode(CURRENCY.BTC); // BTC
    this.graph.setNode(CURRENCY.ETH); // ETH
    // Add edges to the graph
    this.graph.setEdge(CURRENCY.USDT, CURRENCY.BTC, 0);
    this.graph.setEdge(CURRENCY.BTC, CURRENCY.USDT, 0);
    this.graph.setEdge(CURRENCY.BTC, CURRENCY.ETH, 0);
    this.graph.setEdge(CURRENCY.ETH, CURRENCY.BTC, 0);
    this.graph.setEdge(CURRENCY.ETH, CURRENCY.USDT, 0);
    this.graph.setEdge(CURRENCY.USDT, CURRENCY.ETH, 0);
  }

  private updateEdgeOfGraph(from: string, to: string, newValue: number) {
    this.graph.setEdge(from, to, newValue);
  }

  private async handleWhenTickerChange(rate: string, socketEvent: string, keyRedisRate: string) {
    this.socketGateway.sendMessage(socketEvent, rate);
    // this.commonService.setCache(keyRedisRate, rate);
    await this.calculateArbitrage();
  }

  private isNewRate(storedRate: string, newRate: string) {
    if (newRate !== storedRate) {
      return true;
    }
    return false;
  }

  private start() {
    const client = Binance() as any;

    client.ws.bookTicker(SYMBOL_PAIR.BTCUSDT, async (ticker: Ticker) => {
      const isNewRateBid = this.isNewRate(this.bestBidBTCUSDT, ticker.bestBid);

      // when bid rate changes
      if (isNewRateBid) {
        this.bestBidBTCUSDT = ticker.bestBid;
        this.updateEdgeOfGraph(CURRENCY.BTC, CURRENCY.USDT, Number(ticker.bestBid));
        await this.handleWhenTickerChange(
          ticker.bestBid,
          SOCKET_EVENT.BID_BTCUSDT,
          KEY_REDIS.BestBidBTCUSDT
        );
      }

      const isNewRateAsk = this.isNewRate(this.bestAskBTCUSDT, ticker.bestAsk);
      // when ask rate changes
      if (isNewRateAsk) {
        this.bestAskBTCUSDT = ticker.bestAsk;
        this.updateEdgeOfGraph(CURRENCY.USDT, CURRENCY.BTC, 1 / Number(ticker.bestAsk));
        await this.handleWhenTickerChange(
          ticker.bestAsk,
          SOCKET_EVENT.ASK_BTCUSDT,
          KEY_REDIS.BestAskBTCUSDT
        );
      }
    });

    client.ws.bookTicker(SYMBOL_PAIR.ETHBTC, async (ticker: Ticker) => {
      const isNewRateBid = this.isNewRate(this.bestBidETHBTC, ticker.bestBid);
      // when bid rate changes
      if (isNewRateBid) {
        this.bestBidETHBTC = ticker.bestBid;
        this.updateEdgeOfGraph(CURRENCY.ETH, CURRENCY.BTC, Number(ticker.bestBid));
        await this.handleWhenTickerChange(
          ticker.bestBid,
          SOCKET_EVENT.BID_ETHBTC,
          KEY_REDIS.BestBidETHBTC
        );
      }

      const isNewRateAsk = this.isNewRate(this.bestAskETHBTC, ticker.bestAsk);
      // when ask rate changes
      if (isNewRateAsk) {
        this.bestAskETHBTC = ticker.bestAsk;
        this.updateEdgeOfGraph(CURRENCY.BTC, CURRENCY.ETH, 1 / Number(ticker.bestAsk));

        await this.handleWhenTickerChange(
          ticker.bestAsk,
          SOCKET_EVENT.ASK_ETHBTC,
          KEY_REDIS.BestAskETHBTC
        );
      }
    });

    client.ws.bookTicker(SYMBOL_PAIR.ETHUSDT, async (ticker: Ticker) => {
      const isNewRateBid = this.isNewRate(this.bestBidETHUSDT, ticker.bestBid);
      // when bid rate changes
      if (isNewRateBid) {
        this.bestBidETHUSDT = ticker.bestBid;
        this.updateEdgeOfGraph(CURRENCY.ETH, CURRENCY.USDT, Number(ticker.bestBid));
        await this.handleWhenTickerChange(
          ticker.bestBid,
          SOCKET_EVENT.BID_ETHUSDT,
          KEY_REDIS.BestBidETHUSDT
        );
      }

      const isNewRateAsk = this.isNewRate(this.bestAskETHUSDT, ticker.bestAsk);
      // when ask rate changes
      if (isNewRateAsk) {
        this.bestAskETHUSDT = ticker.bestAsk;
        this.updateEdgeOfGraph(CURRENCY.USDT, CURRENCY.ETH, 1 / Number(ticker.bestAsk));
        await this.handleWhenTickerChange(
          ticker.bestAsk,
          SOCKET_EVENT.ASK_ETHUSDT,
          KEY_REDIS.BestAskETHUSDT
        );
      }
    });
  }

  private async calculateArbitrage() {
    await Promise.all(
      this.graph.nodes().map(async (node) => {
        this.calculateArbitrageFromNode(node);
      })
    );
  }

  private calculateArbitrageFromNode(node: string) {
    const distances = {};
    const predecessors = {};
    for (const node of this.graph.nodes()) {
      distances[node] = Infinity;
    }
    distances[node] = 0;

    // Loop |V| to cal distance
    for (let i = 1; i <= this.graph.nodeCount(); i++) {
      for (const edge of this.graph.edges()) {
        const u = edge.v;
        const v = edge.w;
        const weight = -Math.log(this.graph.edge(edge)); // Change weight

        if (distances[u] + weight < distances[v]) {
          distances[v] = distances[u] + weight;
          predecessors[v] = u;
        }
      }
    }

    // find distance negative
    if (distances[node] < 0) {
      const profit = Math.exp(-distances[node]);
      const path = this.getPath(node, predecessors);
      this.count++;
      const now = Date.now();
      const nowFormat = dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS');
      this.profitRate = `[${nowFormat}] Execution from ${node}: ${path.join(
        ' -> '
      )}. Profit rate: ${profit}`;
      this.socketGateway.sendMessage(SOCKET_EVENT.PROFIT_RATE, this.profitRate);
      this.logger.debug(`count:: ${this.count}`);

      this.commonService.zAddSortSet(this.profitRate, now);
    }
  }

  private getPath(startNode: string, predecessors: any) {
    const path = [startNode];
    let u = predecessors[startNode];
    while (u !== startNode) {
      path.unshift(u);
      u = predecessors[u];
    }
    path.unshift(startNode);
    return path;
  }
}
