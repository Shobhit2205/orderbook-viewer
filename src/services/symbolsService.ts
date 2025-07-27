export type Venue = 'OKX' | 'Bybit' | 'Deribit';

export interface VenueSymbol {
  symbol: string;
  base: string;
  quote: string;
}

const OKX_URL = 'https://www.okx.com/api/v5/public/instruments?instType=SPOT';
const BYBIT_URL = 'https://api.bybit.com/v5/market/instruments-info?category=spot';
const DERIBIT_URL = 'https://www.deribit.com/api/v2/public/get_instruments?currency=all&kind=spot';

const cache: Record<Venue, VenueSymbol[] | null> = {
  OKX: null,
  Bybit: null,
  Deribit: null,
};

export async function fetchVenueSymbols(venue: Venue): Promise<VenueSymbol[]> {
  if (cache[venue]) return cache[venue]!;
  let symbols: VenueSymbol[] = [];

  if (venue === 'OKX') {
    const res = await fetch(OKX_URL);
    const data = await res.json();
    console.log(data);
    symbols = (data.data || []).map((item: any) => ({
      symbol: item.instId,
      base: item.baseCcy,
      quote: item.quoteCcy,
    }));
  } else if (venue === 'Bybit') {
    const res = await fetch(BYBIT_URL);
    const data = await res.json();
    symbols = (data.result?.list || []).map((item: any) => ({
      symbol: item.symbol,
      base: item.baseCoin,
      quote: item.quoteCoin,
    }));
  } else if (venue === 'Deribit') {
    const res = await fetch(DERIBIT_URL);
    const data = await res.json();
    symbols = (data.result || []).map((item: any) => ({
      symbol: item.instrument_name,
      base: item.base_currency,
      quote: item.quote_currency,
    }));
  }

  cache[venue] = symbols;
  return symbols;
} 