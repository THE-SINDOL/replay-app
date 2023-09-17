// 10ⁿ
export const DEC_K = 1e3;
export const DEC_M = 1e6;
export const DEC_G = 1e9;
export const DEC_T = 1e12;
export const DEC_P = 1e15;

// 2ⁿ
export const K = 2 ** 10;
export const M = 2 ** 20;
export const G = 2 ** 30;
export const T = 2 ** 40;
export const P = 2 ** 50;

type Multiple = [string, number];

const SI: Multiple[] = [
  ["P", DEC_P],
  ["T", DEC_T],
  ["G", DEC_G],
  ["M", DEC_M],
  ["k", DEC_K],
];

const IEC: Multiple[] = [
  ["Pi", P],
  ["Ti", T],
  ["Gi", G],
  ["Mi", M],
  ["Ki", K],
];

const JEDEC: Multiple[] = [
  ["P", P],
  ["T", T],
  ["G", G],
  ["M", M],
  ["K", K],
];

const Standards = {
  SI,
  IEC,
  JEDEC,
};

type StandardName = keyof typeof Standards;

function isStandardName(std: string): std is StandardName {
  return std === "SI" || std === "IEC" || std === "JEDEC";
}

type RenderFunction<T> = (literal: string, symbol: string) => T;

interface IOptions<T> {
  std?: StandardName;
  decimalPlaces?: number;
  keepTrailingZeroes?: boolean;
  allowMultiples?: string[];
  render?: RenderFunction<T>;
}

const one = /^−?1$/;

const defaultOptions: IOptions<string> = {
  std: "SI",
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  allowMultiples: ["K", "M", "G", "T", "P"],
  render(literal: string, symbol: string): string {
    if (symbol) {
      return `${literal} ${symbol}B`;
    }
    return `${literal} ${one.test(literal) ? "byte" : "bytes"}`;
  },
};

const trailingZeroes = /\.?0*$/;

function toFixed(n: number, decimalPlaces: number, keepTrailingZeroes: boolean) {
  const a = n.toFixed(decimalPlaces);
  if (keepTrailingZeroes) {
    return a;
  }
  return a.replace(trailingZeroes, "");
}
const options = { std: "SI" } as IOptions<string>;
const opt: IOptions<string> = Object.assign({}, defaultOptions, options);

if (!isStandardName(opt.std!)) {
  throw Error(`Unknown std '${opt.std}'`);
}

const allowMultiples: Set<string> = new Set();
opt.allowMultiples!.forEach((a) => {
  allowMultiples.add(a.toUpperCase());
  allowMultiples.add(a.toLowerCase());
});
export function sizeFormatter(n: number): string {
  let sign = "";
  if (n < 0) {
    sign = "−";
    n = -n;
  }

  let literal = "" + n;
  let symbol = "";
  for (const [a, b] of Standards[opt.std!]) {
    if (n >= b && allowMultiples.has(a[0])) {
      literal = toFixed(n / b, opt.decimalPlaces!, opt.keepTrailingZeroes!);
      symbol = a;
      break;
    }
  }

  return opt.render!(sign + literal, symbol);
}
