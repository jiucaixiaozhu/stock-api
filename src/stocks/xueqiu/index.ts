// Stocks
import Base from "@stocks/base";
import XueqiuStockTransform from "@stocks/xueqiu/transforms/stock";
import XueqiuCommonCodeTransform from "@stocks/xueqiu/transforms/common-code";

// Utils
import fetch from "@utils/fetch";

// Types
import Stock from "types/utils/stock";
import StockApi from "types/stocks/index";
import Dictionary from "types/utils/dictionary";

let token: string = '';

/**
 * 雪球股票代码接口
 */
const Xueqiu: StockApi & { getToken(): Promise<string> } = {
  /**
   * 获取 Token
   */
  async getToken(): Promise<string> {
    if (token !== '') return token;

    const res = await fetch.get('https://xueqiu.com/');
    const cookies: string[] = res.headers['set-cookie'];

    const param: string = cookies.filter(key => key.includes('xq_a_token'))[0] || '';
    token = param.split(';')[0] || '';

    return token;
  },

  /**
   * 获取股票数据
   * @param code 股票代码
   */
  async getStock(code: string): Promise<Stock> {
    const token = await this.getToken();
    const transform = (new XueqiuCommonCodeTransform).transform(code);

    // 数据获取
    const url = `https://stock.xueqiu.com/v5/stock/quote.json?symbol=${transform}`;
    const res = await fetch.get(url).set('Cookie', token);

    const body = JSON.parse(res.text);
    const row: Dictionary<number | string> = body.data.quote;

    // 数据深解析
    const params = row;
    const data = (new XueqiuStockTransform(code, params));

    return data.getStock();
  },

  /**
   * 获取股票数据组
   * @param codes 股票代码组
   */
  async getStocks(codes: string[]): Promise<Stock[]> {
    const token = await this.getToken();
    const transforms = (new XueqiuCommonCodeTransform).transforms(codes);

    // 数据获取
    const url = `https://stock.xueqiu.com/v5/stock/batch/quote.json?symbol=${transforms.join(',')}`;
    const res = await fetch.get(url).set('Cookie', token);

    const body = JSON.parse(res.text);
    const rows: Dictionary<Dictionary<number | string>>[] = body.data.items;

    return codes.map(code => {
      // 数据深解析
      const transform = (new XueqiuCommonCodeTransform).transform(code);
      const params = rows.find(i => i.quote.symbol === transform) || {};

      const data = (new XueqiuStockTransform(code, params.quote));
      return data.getStock();
    });
  },

  /**
   * 搜索股票代码
   * @param key 关键字
   */
  async searchStocks(key: string): Promise<Stock[]> {
    throw new Error("未实现搜索股票代码");
  }
}

export default Xueqiu;
