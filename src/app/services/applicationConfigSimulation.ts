import type { ApplicationConfigResponse, TermConfigItem, InvestmentFeeItemBackend } from '../types/dto';

/**
 * Formulas aligned with BE (QuotaCalculationService):
 * - feeRate = fee/100, billRate = bill/100
 * - fee = feeBase * (1+iva), bills = billsBase * (1+iva)
 * - principal = amount + fee + bills (redondeado)
 * - TEM = TNA/100/12 (tasa mensual efectiva)
 *
 * Cuota (sistema francés):
 *   Inv = ( (1+TEM)^Cuotas - 1 ) / ( TEM * (1+TEM)^Cuotas )
 *   Cuota = Monto / Inv  =>  Cuota = Monto * ( TEM * (1+TEM)^Cuotas ) / ( (1+TEM)^Cuotas - 1 )
 * (Monto = principal a financiar)
 *
 * Amortización: por mes, interés = saldo*TEM, capital = cuota - interés, saldo -= capital
 */

function temFromTna(tna: number): number {
  return tna / 100 / 12;
}

function ivaMultiplier(iva: number): number {
  return iva > 2 ? 1 + iva / 100 : 1 + iva;
}

export type LoanSimulatorOptions = {
  /** Si false, no se aplica IVA a fee ni a bill (simula sin IVA). Por defecto true. */
  applyIva?: boolean;
};

export function calculateLoanQuota(
  config: ApplicationConfigResponse,
  amount: number,
  termName: string,
  options?: LoanSimulatorOptions
): { quota: number; principal: number; months: number; feeAmount: number; billsAmount: number } | null {
  const termConfig = config.termConfigs?.find(
    (t) => t.name.toLowerCase() === termName.toLowerCase()
  ) as TermConfigItem | undefined;
  if (!termConfig) return null;

  const months = termConfig.value * 12;
  const tem = temFromTna(termConfig.tna);
  const feeRate = config.fee / 100;
  const billRate = config.bill / 100;
  const withIva = options?.applyIva === false ? 1 : ivaMultiplier(Number(config.iva));

  const feeBase = amount * feeRate;
  const billsBase = amount * billRate;
  const feeAmount = feeBase * withIva;
  const billsAmount = billsBase * withIva;
  const principal = Math.round(amount + feeAmount + billsAmount);

  if (tem <= 0 || months <= 0) return null;
  const onePlusTem = 1 + tem;
  const pow = Math.pow(onePlusTem, months);
  const inv = (pow - 1) / (tem * pow);
  const quota = principal / inv;

  return { quota, principal, months, feeAmount, billsAmount };
}

export function generateAmortizationData(
  config: ApplicationConfigResponse,
  amount: number,
  termName: string,
  maxMonths: number,
  options?: LoanSimulatorOptions
): Array<{ mes: number; capital: number; interes: number; saldo: number; cuota: number }> {
  const result = calculateLoanQuota(config, amount, termName, options);
  if (!result) return [];

  const { quota, months } = result;
  const termConfig = config.termConfigs?.find(
    (t) => t.name.toLowerCase() === termName.toLowerCase()
  ) as TermConfigItem | undefined;
  if (!termConfig) return [];

  const tem = temFromTna(termConfig.tna);
  const data: Array<{ mes: number; capital: number; interes: number; saldo: number; cuota: number }> = [];
  let saldo = result.principal;
  const limit = Math.min(months, maxMonths);

  for (let i = 1; i <= limit; i++) {
    const interes = saldo * tem;
    const capital = quota - interes;
    saldo = Math.max(0, saldo - capital);
    data.push({ mes: i, capital, interes, saldo, cuota: quota });
  }
  return data;
}

export function getLoanSummary(
  amortizationData: Array<{ interes: number }>,
  principal: number,
  quota: number,
  months: number
): { totalInterest: number; totalPayed: number } {
  const totalInterest = amortizationData.reduce((sum, d) => sum + d.interes, 0);
  return { totalInterest, totalPayed: principal + totalInterest };
}

export function findInvestmentFeeByAmount(
  config: ApplicationConfigResponse,
  amount: number
): number | null {
  const fees = config.investmentFees ?? [];
  const sorted = [...fees].sort(
    (a, b) => (a.minAmount ?? 0) - (b.minAmount ?? 0)
  );
  for (const tier of sorted) {
    const minOk = tier.minAmount == null || amount >= tier.minAmount;
    const maxOk = tier.maxAmount == null || amount <= tier.maxAmount;
    if (minOk && maxOk) return Number(tier.fee);
  }
  return null;
}

export function investmentFeeAmount(config: ApplicationConfigResponse, amount: number): number | null {
  const feePct = findInvestmentFeeByAmount(config, amount);
  if (feePct == null) return null;
  return (amount * feePct) / 100;
}

/** Resultado de simulación de inversión: usa TEM del plazo para la cuota que recibe el inversor (flujo del préstamo asociado). */
export type InvestmentSimulationResult = {
  tem: number;
  tna: number;
  months: number;
  quota: number;
  totalExpectedToPay: number;
  principal: number;
  feePct: number | null;
  feeAmount: number | null;
};

/**
 * Simulación de inversión alineada al BE (InvestmentCreator): el monto se usa como principal del préstamo asociado;
 * TEM y meses vienen del plazo (termConfig). La cuota es la que paga el solicitante y recibe el inversor.
 */
export function getInvestmentSimulation(
  config: ApplicationConfigResponse,
  amount: number,
  termName: string,
  options?: LoanSimulatorOptions
): InvestmentSimulationResult | null {
  const loanResult = calculateLoanQuota(config, amount, termName, options);
  if (!loanResult) return null;
  const termConfig = config.termConfigs?.find(
    (t) => t.name.toLowerCase() === termName.toLowerCase()
  ) as TermConfigItem | undefined;
  if (!termConfig) return null;
  const tem = temFromTna(termConfig.tna);
  const tna = Number(termConfig.tna);
  const feePct = findInvestmentFeeByAmount(config, amount);
  const feeAmount = feePct != null ? (amount * feePct) / 100 : null;
  return {
    tem,
    tna,
    months: loanResult.months,
    quota: loanResult.quota,
    totalExpectedToPay: loanResult.quota * loanResult.months,
    principal: loanResult.principal,
    feePct: feePct ?? null,
    feeAmount,
  };
}

/** Serie mensual para gráfico: cobro por mes y acumulado (lo que recibe el inversor en el tiempo). */
export function generateInvestmentTimeSeries(
  months: number,
  quota: number
): Array<{ mes: number; cobro: number; acumulado: number }> {
  const data: Array<{ mes: number; cobro: number; acumulado: number }> = [];
  let acumulado = 0;
  for (let mes = 1; mes <= months; mes++) {
    acumulado += quota;
    data.push({ mes, cobro: quota, acumulado });
  }
  return data;
}
