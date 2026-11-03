import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  ComposedChart,
  Bar,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Key, TrendingUp, PiggyBank, Scale, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom tap/click responsive Info Popover for Mobile & Desktop
function InfoPopover({
  title,
  children,
  iconSize = "w-5 h-5",
}: {
  title?: string;
  children: React.ReactNode;
  iconSize?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="text-slate-400 hover:text-indigo-600 focus:text-indigo-600 active:scale-95 transition-all p-1 -m-1 cursor-pointer rounded-full hover:bg-slate-100 active:bg-slate-200 inline-flex items-center justify-center"
        aria-label="Information"
      >
        <Info className={iconSize} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 sm:absolute sm:inset-auto sm:top-full sm:left-1/2 sm:-translate-x-1/2 sm:mt-2 z-50 flex items-center justify-center p-4 sm:p-0 bg-slate-900/40 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none animate-in fade-in-0 zoom-in-95">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 w-full max-w-xs sm:w-80 text-xs font-normal text-slate-700 relative text-left">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              {title ? (
                <p className="font-bold text-slate-900 text-xs tracking-tight">{title}</p>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 leading-relaxed">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to format currency
const formatCurrency = (value: number) => {
  if (value >= 1000000) return "$" + (value / 1000000).toFixed(2) + "M";
  if (value >= 1000) return "$" + Math.round(value / 1000) + "k";
  return "$" + Math.round(value).toLocaleString();
};

const formatCurrencyExact = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const SliderField = ({
  label,
  value,
  setter,
  max,
  step = 1,
  prefix = "",
  suffix = "",
}: any) => {
  const [localValue, setLocalValue] = React.useState(value.toString());

  React.useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    let parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      setLocalValue(value.toString());
    } else {
      if (parsed < 0) parsed = 0;
      if (parsed > max) parsed = max;
      setter([parsed]);
      setLocalValue(parsed.toString());
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
        <div className="relative flex items-center">
          {prefix && <span className="absolute left-2 text-xs font-medium text-slate-500">{prefix}</span>}
          <input 
            type="text"
            inputMode="decimal"
            className={cn(
              "h-7 w-20 text-sm font-bold text-slate-900 bg-slate-100 rounded-md border-transparent focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 text-right outline-none transition-all", 
              prefix ? "pl-5" : "pl-2", 
              suffix ? "pr-6" : "pr-2"
            )}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') handleBlur(); }}
          />
          {suffix && <span className="absolute right-2 text-xs font-medium text-slate-500">{suffix}</span>}
        </div>
      </div>
      <Slider
        value={[value]}
        max={max}
        step={step}
        onValueChange={(v: any) => setter(Array.isArray(v) ? v : [v])}
        className="py-2 cursor-pointer"
      />
    </div>
  );
};

const InputField = ({ label, value, setter, prefix = "" }: any) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-slate-700">{label}</Label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-2.5 text-slate-500 font-medium">
          {prefix}
        </span>
      )}
      <Input
        type="number"
        value={value}
        onChange={(e) => setter(Number(e.target.value))}
        className={cn(prefix ? "pl-7" : "")}
      />
    </div>
  </div>
);

function usePersistedState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const persisted = localStorage.getItem(key);
      if (persisted !== null) {
        return JSON.parse(persisted);
      }
    } catch (e) {
      console.warn("Could not read from local storage", e);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not write to local storage", e);
    }
  }, [key, state]);

  return [state, setState];
}

export default function App() {
  const [years, setYears] = usePersistedState("cal_years", [30]);

  // Buy Params
  const [homePrice, setHomePrice] = usePersistedState("cal_homePrice", 1200000);
  const [downPaymentPercent, setDownPaymentPercent] = usePersistedState("cal_downPaymentPercent", [20]);
  const [interestRate, setInterestRate] = usePersistedState("cal_interestRate", [6.5]);
  const [propertyTaxRate, setPropertyTaxRate] = usePersistedState("cal_propertyTaxRate", [1.25]); // Bay Area avg
  const [hoaFee, setHoaFee] = usePersistedState("cal_hoaFee", 0);
  const [homeInsurance, setHomeInsurance] = usePersistedState("cal_homeInsurance", 150);
  const [maintenanceRate, setMaintenanceRate] = usePersistedState("cal_maintenanceRate", [1.0]);
  const [homeAppreciation, setHomeAppreciation] = usePersistedState("cal_homeAppreciation", [4.0]);
  const [closingCosts, setClosingCosts] = usePersistedState("cal_closingCosts", [3.0]);
  const [sellingCosts, setSellingCosts] = usePersistedState("cal_sellingCosts", [6.0]);

  // Rent Params
  const [monthlyRent, setMonthlyRent] = usePersistedState("cal_monthlyRent", 4000);
  const [rentInflation, setRentInflation] = usePersistedState("cal_rentInflation", [3.0]);
  const [renterInsurance, setRenterInsurance] = usePersistedState("cal_renterInsurance", 25);

  // Market
  const [investmentReturn, setInvestmentReturn] = usePersistedState("cal_investmentReturn", [7.0]);
  const [savingsInvestedPercent, setSavingsInvestedPercent] = usePersistedState("cal_savingsInvestedPercent", [100]);

  // Tax
  const [marginalTaxRate, setMarginalTaxRate] = usePersistedState("cal_marginalTaxRate", [33]);
  const [standardDeduction, setStandardDeduction] = usePersistedState("cal_standardDeduction", 29200);
  const [saltCap, setSaltCap] = usePersistedState("cal_saltCap", 40400);

  // Calculations
  const data = useMemo(() => {
    const arr = [];
    const dpVal = homePrice * (downPaymentPercent[0] / 100);
    const loanAmount = homePrice - dpVal;
    const initialClosingCosts = homePrice * (closingCosts[0] / 100);
    const initialCashNeeded = dpVal + initialClosingCosts;

    const monthlyRate = interestRate[0] / 100 / 12;
    const totalPeriods = 30 * 12; // Standard 30 year fixed assumption
    const monthlyMortgage =
      monthlyRate > 0
        ? (loanAmount *
            (monthlyRate * Math.pow(1 + monthlyRate, totalPeriods))) /
          (Math.pow(1 + monthlyRate, totalPeriods) - 1)
        : loanAmount / totalPeriods;

    let remainingBalance = loanAmount;
    let rentPortfolio = initialCashNeeded; // Renter invests the down payment + closing costs immediately
    let buyPortfolio = 0;

    let cumulativeBuySunk = initialClosingCosts;
    let cumulativeRentSunk = 0;

    let currentAssessedValue = homePrice; // For Prop 13
    
    let cumulativeTaxSavings = 0;

    // Add Year 0 point
    arr.push({
      year: 0,
      buyNetWorth: Math.round(dpVal - (homePrice * (sellingCosts[0] / 100))),
      rentNetWorth: Math.round(initialCashNeeded),
      homeValue: Math.round(homePrice),
      mortgageBalance: Math.round(remainingBalance),
      equity: Math.round(dpVal - (homePrice * (sellingCosts[0] / 100))),
      buySunk: Math.round(initialClosingCosts),
      rentSunk: 0,
      yearlyTaxSavings: 0,
      cumulativeTaxSavings: 0,
    });

    const activeYears = years[0] || 1;

    for (let y = 1; y <= activeYears; y++) {
      let yearlyBuySunk = 0;
      let yearlyInterest = 0;
      let yearlyPropertyTax = 0;

      for (let m = 1; m <= 12; m++) {
        // Rent Cost Month
        const currentRent =
          monthlyRent * Math.pow(1 + rentInflation[0] / 100, y - 1);
        const currentRenterIns =
          renterInsurance * Math.pow(1 + rentInflation[0] / 100, y - 1);
        const totalRentMonth = currentRent + currentRenterIns;
        cumulativeRentSunk += totalRentMonth;

        // Buy Cost Month
        const propValue =
          homePrice *
          Math.pow(1 + homeAppreciation[0] / 100, y - 1 + (m - 1) / 12);
        const currentMaint = (propValue * (maintenanceRate[0] / 100)) / 12;
        const currentHoa = hoaFee * Math.pow(1 + rentInflation[0] / 100, y - 1);
        const currentBuyIns =
          homeInsurance * Math.pow(1 + rentInflation[0] / 100, y - 1);

        // Prop 13 CA Law cap: 2% annual increase max on assessed value for taxes
        const currentTax =
          (currentAssessedValue * (propertyTaxRate[0] / 100)) / 12;

        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = monthlyMortgage - interestPayment;

        let actualPrincipal = principalPayment;
        if (remainingBalance < principalPayment) {
          actualPrincipal = remainingBalance;
        }
        remainingBalance = Math.max(0, remainingBalance - actualPrincipal);

        yearlyInterest += interestPayment;
        yearlyPropertyTax += currentTax;

        const totalBuySunkMonth =
          interestPayment +
          currentTax +
          currentMaint +
          currentHoa +
          currentBuyIns;
        yearlyBuySunk += totalBuySunkMonth;
        cumulativeBuySunk += totalBuySunkMonth;

        const totalBuyMonthOutflow =
          monthlyMortgage +
          currentTax +
          currentMaint +
          currentHoa +
          currentBuyIns;

        // Opportunity Cost (Difference mapping)
        const cashDiff = totalBuyMonthOutflow - totalRentMonth;

        // Investment growth per month
        const monthlyMarketReturn =
          Math.pow(1 + investmentReturn[0] / 100, 1 / 12) - 1;
        rentPortfolio *= 1 + monthlyMarketReturn;
        buyPortfolio *= 1 + monthlyMarketReturn;

        if (cashDiff > 0) {
          // Buying costs more monthly, Renter invests the difference
          rentPortfolio += cashDiff * (savingsInvestedPercent[0] / 100);
        } else {
          // Renting costs more monthly, Buyer invests the difference
          buyPortfolio += Math.abs(cashDiff) * (savingsInvestedPercent[0] / 100);
        }
      }

      currentAssessedValue = currentAssessedValue * 1.02; // CA Prop 13 max

      // Calculate tax savings for the year
      const deductibleInterestRatio = Math.min(1, 750000 / loanAmount);
      const deductibleInterest = yearlyInterest * deductibleInterestRatio;
      const deductiblePropertyTax = Math.min(yearlyPropertyTax, saltCap);
      const houseItemizedDeductions = deductibleInterest + deductiblePropertyTax;
      const taxSavingsThisYear = Math.max(0, houseItemizedDeductions - standardDeduction) * (marginalTaxRate[0] / 100);
      
      // Apply tax savings (increases buy portfolio, reduces buy sunk cost)
      buyPortfolio += taxSavingsThisYear;
      cumulativeBuySunk -= taxSavingsThisYear;
      cumulativeTaxSavings += taxSavingsThisYear;

      const endOfYearPropValue =
        homePrice * Math.pow(1 + homeAppreciation[0] / 100, y);
      const sellCosts = endOfYearPropValue * (sellingCosts[0] / 100);
      const equity = endOfYearPropValue - remainingBalance - sellCosts;

      const buyNetWorth = equity + buyPortfolio;
      const rentNetWorth = rentPortfolio;

      arr.push({
        year: y,
        buyNetWorth: Math.round(buyNetWorth),
        rentNetWorth: Math.round(rentNetWorth),
        homeValue: Math.round(endOfYearPropValue),
        mortgageBalance: Math.round(remainingBalance),
        equity: Math.round(equity),
        buySunk: Math.round(cumulativeBuySunk),
        rentSunk: Math.round(cumulativeRentSunk),
        yearlyTaxSavings: Math.round(taxSavingsThisYear),
        cumulativeTaxSavings: Math.round(cumulativeTaxSavings),
      });
    }

    // Prepare metrics
    const finalYear = arr[arr.length - 1];
    const netWorthDiff =
      (finalYear?.buyNetWorth || 0) - (finalYear?.rentNetWorth || 0);

    return {
      points: arr,
      final: finalYear,
      netWorthDiff,
      initialCashNeeded,
      initialClosingCosts,
      monthlyMortgage,
      monthlyTax: (homePrice * (propertyTaxRate[0] / 100)) / 12,
      dpVal,
    };
  }, [
    years,
    homePrice,
    downPaymentPercent,
    interestRate,
    propertyTaxRate,
    hoaFee,
    homeInsurance,
    maintenanceRate,
    homeAppreciation,
    closingCosts,
    sellingCosts,
    monthlyRent,
    rentInflation,
    renterInsurance,
    investmentReturn,
    savingsInvestedPercent,
    marginalTaxRate,
    standardDeduction,
    saltCap
  ]);

  const monthlyMaintenance = (homePrice * (maintenanceRate[0] / 100)) / 12;
  const totalMonthlyPayment =
    data.monthlyMortgage +
    data.monthlyTax +
    hoaFee +
    homeInsurance +
    monthlyMaintenance;

  return (
      <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-indigo-100">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 p-4 md:px-8 bg-opacity-95 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-baseline gap-4 md:gap-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Scale className="w-6 h-6 text-indigo-600" />
              Rent vs Buy
            </h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">
              Bay Area Homeownership Visualizer
            </p>
          </div>
          <div className="flex-1 flex items-center gap-4 bg-slate-100 px-5 py-2.5 rounded-full hidden md:flex border border-slate-200/60 shadow-inner">
            <span className="text-sm font-semibold text-slate-500 w-32 shrink-0 uppercase tracking-widest text-xs">
              Time Horizon:
            </span>
            <Slider
              value={years}
              max={30}
              step={1}
              min={1}
              onValueChange={(v: any) => setYears(Array.isArray(v) ? v : [v])}
              className="flex-1 cursor-pointer"
            />
            <span className="text-sm font-bold w-12 text-right bg-white px-2 py-1 flex justify-center rounded text-indigo-700">
              {years[0]}
              <span className="text-xs ml-1 text-slate-400">y</span>
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Time Slider */}
      <div className="bg-white p-4 border-b border-slate-200 md:hidden sticky top-[72px] z-40 shadow-sm">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Years
          </span>
          <Slider
            value={years}
            max={30}
            step={1}
            min={1}
            onValueChange={(v: any) => setYears(Array.isArray(v) ? v : [v])}
            className="flex-1"
          />
          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            {years[0]}y
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Controls */}
        <div className="lg:col-span-4 space-y-6">
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-200/50 rounded-xl">
              <TabsTrigger
                value="buy"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 font-semibold tracking-tight transition-all"
              >
                <Home className="w-4 h-4 mr-2" /> Buy Parameters
              </TabsTrigger>
              <TabsTrigger
                value="rent"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-semibold tracking-tight transition-all"
              >
                <Key className="w-4 h-4 mr-2" /> Rent Parameters
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy">
              <Card className="border border-indigo-100 shadow-xl shadow-slate-200/30 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-indigo-50/80 pb-4 border-b border-indigo-100/50">
                  <CardTitle className="text-lg text-indigo-950 font-bold">
                    Initial Purchase
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <InputField
                    label="Home Price"
                    value={homePrice}
                    setter={setHomePrice}
                    prefix="$"
                  />
                  <SliderField
                    label="Down Payment (%)"
                    value={downPaymentPercent[0]}
                    setter={(v: number[]) => setDownPaymentPercent(v)}
                    max={100}
                    suffix="%"
                  />
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between shadow-sm">
                    <span>Downpayment Amount:</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrencyExact(data.dpVal)}
                    </span>
                  </div>
                  <SliderField
                    label={
                      <span className="flex items-center gap-1">
                        Closing Costs
                        <InfoPopover title="What's included in Closing Costs?" iconSize="w-3.5 h-3.5">
                          <p className="text-slate-600 mb-1">Typically 2% - 5% of the loan amount. Includes lender origination fees, appraisal, title insurance, and attorney/escrow fees.</p>
                          <p className="text-slate-600">Note: Buyer's broker commission is usually paid by the seller, but local practices may vary.</p>
                        </InfoPopover>
                      </span>
                    }
                    value={closingCosts[0]}
                    setter={(v: number[]) => setClosingCosts(v)}
                    max={10}
                    step={0.1}
                    suffix="%"
                  />
                  <SliderField
                    label="Interest Rate"
                    value={interestRate[0]}
                    setter={(v: number[]) => setInterestRate(v)}
                    max={15}
                    step={0.125}
                    suffix="%"
                  />
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between shadow-sm">
                    <span>Monthly P&I:</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrencyExact(data.monthlyMortgage)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6 border border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-slate-50/80 pb-4 border-b border-slate-100">
                  <CardTitle className="text-lg text-slate-800 font-bold tracking-tight">
                    Recurring & Rates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <SliderField
                    label="Property Tax Rate"
                    value={propertyTaxRate[0]}
                    setter={(v: number[]) => setPropertyTaxRate(v)}
                    max={3}
                    step={0.01}
                    suffix="%"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="HOA /mo"
                      value={hoaFee}
                      setter={setHoaFee}
                      prefix="$"
                    />
                    <InputField
                      label="Insurance /mo"
                      value={homeInsurance}
                      setter={setHomeInsurance}
                      prefix="$"
                    />
                  </div>
                  <SliderField
                    label="Maint. (Annual %)"
                    value={maintenanceRate[0]}
                    setter={(v: number[]) => setMaintenanceRate(v)}
                    max={3}
                    step={0.1}
                    suffix="%"
                  />
                  <SliderField
                    label="Home Appreciation"
                    value={homeAppreciation[0]}
                    setter={(v: number[]) => setHomeAppreciation(v)}
                    max={10}
                    step={0.1}
                    suffix="%"
                  />
                </CardContent>
              </Card>

              <Card className="mt-6 border border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-slate-50/80 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-slate-800 font-bold tracking-tight">
                      Tax & Deductions
                    </CardTitle>
                    <InfoPopover title="Tax & Deductions Information" iconSize="w-4 h-4">
                      <p className="text-slate-600">Calculates how much you save on taxes by itemizing mortgage interest and property taxes (up to SALT cap), compared to taking the standard deduction.</p>
                    </InfoPopover>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <SliderField
                    label="Marginal Tax Rate"
                    value={marginalTaxRate[0]}
                    setter={(v: number[]) => setMarginalTaxRate(v)}
                    max={50}
                    step={1}
                    suffix="%"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Std. Deduction"
                      value={standardDeduction}
                      setter={setStandardDeduction}
                      prefix="$"
                    />
                    <InputField
                      label="SALT Cap"
                      value={saltCap}
                      setter={setSaltCap}
                      prefix="$"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6 border border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-slate-50/80 pb-4 border-b border-slate-100">
                  <CardTitle className="text-lg text-slate-800 font-bold tracking-tight">Est. Payment Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Breakdown */}
                  <div className="space-y-6 text-xs font-medium">
                    {/* Monthly */}
                    <div>
                      <div className="flex justify-between items-end border-b border-slate-100 pb-2 mb-3">
                        <h4 className="text-sm uppercase tracking-wider font-bold text-slate-500">Monthly Recurring</h4>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">{formatCurrencyExact(data.monthlyMortgage + hoaFee)}</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-slate-700">
                          <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm border border-indigo-700/20"></div> Principal & Interest</div>
                          <span className="font-semibold text-slate-800">{formatCurrencyExact(data.monthlyMortgage)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                          <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm border border-amber-600/20"></div> HOA</div>
                          <span className="font-semibold text-slate-800">{formatCurrencyExact(hoaFee)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Semiannual */}
                    <div>
                      <div className="flex justify-between items-end border-b border-slate-100 pb-2 mb-3">
                        <h4 className="text-sm uppercase tracking-wider font-bold text-slate-500">Semi-Annual</h4>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">{formatCurrencyExact(data.monthlyTax * 6)} <span className="text-xs text-slate-400 font-normal ml-1">({formatCurrencyExact(data.monthlyTax)}/mo)</span></span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-slate-700">
                          <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-sky-500 shadow-sm border border-sky-600/20"></div> Property Taxes</div>
                          <span className="font-semibold text-slate-800">{formatCurrencyExact(data.monthlyTax * 6)} <span className="text-slate-400 font-normal text-[10px] ml-1">({formatCurrencyExact(data.monthlyTax)}/mo)</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Annual */}
                    <div>
                      <div className="flex justify-between items-end border-b border-slate-100 pb-2 mb-3">
                        <h4 className="text-sm uppercase tracking-wider font-bold text-slate-500">Annual</h4>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">{formatCurrencyExact((homeInsurance * 12) + (monthlyMaintenance * 12))} <span className="text-xs text-slate-400 font-normal ml-1">({formatCurrencyExact(homeInsurance + monthlyMaintenance)}/mo)</span></span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-slate-700">
                          <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm border border-rose-600/20"></div> Home Insurance</div>
                          <span className="font-semibold text-slate-800">{formatCurrencyExact(homeInsurance * 12)} <span className="text-slate-400 font-normal text-[10px] ml-1">({formatCurrencyExact(homeInsurance)}/mo)</span></span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                          <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm border border-emerald-600/20"></div> Maintenance</div>
                          <span className="font-semibold text-slate-800">{formatCurrencyExact(monthlyMaintenance * 12)} <span className="text-slate-400 font-normal text-[10px] ml-1">({formatCurrencyExact(monthlyMaintenance)}/mo)</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Effective Monthly */}
                  <div className="border-t border-slate-200 pt-5 mt-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm uppercase tracking-wider font-bold text-slate-800">Effective Monthly</span>
                      <span className="text-lg font-bold text-slate-900 tracking-tight">
                        {formatCurrencyExact(totalMonthlyPayment)}
                      </span>
                    </div>
                    
                    {/* Stacked bar */}
                    <div className="h-3 w-full flex rounded-full overflow-hidden">
                      <div style={{ width: `${(data.monthlyMortgage / totalMonthlyPayment) * 100}%` }} className="bg-indigo-600 transition-all duration-300"></div>
                      <div style={{ width: `${(data.monthlyTax / totalMonthlyPayment) * 100}%` }} className="bg-sky-500 transition-all duration-300"></div>
                      <div style={{ width: `${(hoaFee / totalMonthlyPayment) * 100}%` }} className="bg-amber-500 transition-all duration-300"></div>
                      <div style={{ width: `${(homeInsurance / totalMonthlyPayment) * 100}%` }} className="bg-rose-500 transition-all duration-300"></div>
                      <div style={{ width: `${(monthlyMaintenance / totalMonthlyPayment) * 100}%` }} className="bg-emerald-500 transition-all duration-300"></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t border-slate-100">
                      <span>One-time Closing Costs</span>
                      <span>{formatCurrencyExact(data.initialClosingCosts)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-emerald-600 mt-2">
                      <span>Est. Tax Savings (Annual, Yr 1)</span>
                      <span>-{formatCurrencyExact(data.points[1]?.yearlyTaxSavings || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-emerald-600 mt-1">
                      <span>Est. Tax Savings / mo (Yr 1)</span>
                      <span>-{formatCurrencyExact((data.points[1]?.yearlyTaxSavings || 0) / 12)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rent">
              <Card className="border border-emerald-100 shadow-xl shadow-slate-200/30 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-emerald-50/80 pb-4 border-b border-emerald-100/50">
                  <CardTitle className="text-lg text-emerald-950 font-bold tracking-tight">
                    Rental Economics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <InputField
                    label="Monthly Rent"
                    value={monthlyRent}
                    setter={setMonthlyRent}
                    prefix="$"
                  />
                  <SliderField
                    label="Annual Rent Increase"
                    value={rentInflation[0]}
                    setter={(v: number[]) => setRentInflation(v)}
                    max={10}
                    step={0.1}
                    suffix="%"
                  />
                  <InputField
                    label="Renter Insurance /mo"
                    value={renterInsurance}
                    setter={setRenterInsurance}
                    prefix="$"
                  />
                </CardContent>
              </Card>

              <Card className="mt-6 border border-amber-100 shadow-xl shadow-slate-200/30 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-amber-50/80 pb-4 border-b border-amber-100/50">
                  <CardTitle className="text-lg text-amber-950 font-bold tracking-tight">
                    Market Opportunity
                  </CardTitle>
                  <CardDescription className="text-xs text-amber-800/80 mt-1">
                    If you invest monthly savings into stocks.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <SliderField
                    label="Stock Mkt Return Rate"
                    value={investmentReturn[0]}
                    setter={(v: number[]) => setInvestmentReturn(v)}
                    max={15}
                    step={0.1}
                    suffix="%"
                  />
                  <SliderField
                    label="% of Savings Invested"
                    value={savingsInvestedPercent[0]}
                    setter={(v: number[]) => setSavingsInvestedPercent(v)}
                    max={100}
                    step={5}
                    suffix="%"
                  />
                  <p className="text-xs text-slate-500 font-medium leading-relaxed bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                    Most people don't invest all of their extra cash when renting. Lower this to model lifestyle creep.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Col: Visualization */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={cn(
                "rounded-2xl p-6 border transition-colors relative overflow-hidden",
                data.netWorthDiff > 0
                  ? "bg-indigo-600 border-indigo-700 text-white shadow-xl shadow-indigo-200/50"
                  : "bg-white border-slate-200 shadow-md",
              )}
            >
              {data.netWorthDiff > 0 && (
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp className="w-24 h-24" />
                </div>
              )}
              <div
                className={cn(
                  "text-xs font-bold tracking-wider uppercase mb-1",
                  data.netWorthDiff > 0 ? "text-indigo-200" : "text-indigo-600",
                )}
              >
                Buy Net Worth
              </div>
              <div className="text-4xl md:text-5xl font-black tracking-tighter shadow-sm mb-2">
                {formatCurrencyExact(data.final?.buyNetWorth || 0)}
              </div>
              <div
                className={cn(
                  "text-sm font-medium",
                  data.netWorthDiff > 0 ? "text-indigo-100" : "text-slate-500",
                )}
              >
                After {years[0]} years of payments & growth
              </div>
            </div>

            <div
              className={cn(
                "rounded-2xl p-6 border transition-colors relative overflow-hidden",
                data.netWorthDiff <= 0
                  ? "bg-emerald-600 border-emerald-700 text-white shadow-xl shadow-emerald-200/50"
                  : "bg-white border-slate-200 shadow-md",
              )}
            >
              {data.netWorthDiff <= 0 && (
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <PiggyBank className="w-24 h-24" />
                </div>
              )}
              <div
                className={cn(
                  "text-xs font-bold tracking-wider uppercase mb-1",
                  data.netWorthDiff <= 0
                    ? "text-emerald-200"
                    : "text-emerald-600",
                )}
              >
                Rent Net Worth
              </div>
              <div className="text-4xl md:text-5xl font-black tracking-tighter shadow-sm mb-2">
                {formatCurrencyExact(data.final?.rentNetWorth || 0)}
              </div>
              <div
                className={cn(
                  "text-sm font-medium",
                  data.netWorthDiff <= 0
                    ? "text-emerald-100"
                    : "text-slate-500",
                )}
              >
                Initial cash + savings invested
              </div>
            </div>
          </div>

          <div className="p-5 bg-blue-50/80 text-blue-900 border border-blue-100 rounded-2xl text-center shadow-inner">
            <span className="font-bold block text-xl tracking-tight">
              {data.netWorthDiff > 0 ? "Buying wins" : "Renting wins"} by{" "}
              <span className="underline decoration-blue-300 decoration-4 underline-offset-2">
                {formatCurrencyExact(Math.abs(data.netWorthDiff))}
              </span>
            </span>
            <span className="text-sm opacity-80 mt-1 block font-medium">
              Assuming you consistently invest any monthly savings in the
              market.
            </span>
          </div>

          {/* Detailed Charts */}
          <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-5">
              <CardTitle className="text-slate-800 text-xl font-black flex justify-between items-center tracking-tight">
                <div className="flex items-center gap-2">
                  Net Worth Trajectory
                  <InfoPopover title="Net Worth Trajectory Breakdown">
                    <p className="text-slate-600 mb-2">
                      <strong className="text-indigo-700">Includes Tax Savings? YES.</strong>
                      <br />• <em>Buyer Net Worth:</em> Home Equity (market value − loan debt − selling costs) + Stock Portfolio (initial cash diff + monthly savings + annual tax savings refunds).
                      <br />• <em>Renter Net Worth:</em> Stock Portfolio (initial cash + monthly cash flow savings invested at market rate).
                    </p>
                    <p className="text-slate-600">
                      <strong className="text-slate-800">Excludes:</strong> Out-of-pocket unrecoverable expenses (interest, taxes, maintenance, HOA, insurance) already factored out of cash flow.
                    </p>
                  </InfoPopover>
                </div>
                <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full shadow-sm tracking-wide">
                  Includes Opportunity Costs
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.points}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#4f46e5"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#4f46e5"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorRent"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      tickFormatter={(value) => `Yr ${value}`}
                      minTickGap={20}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      tickFormatter={formatCurrency}
                      width={65}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrencyExact(value)}
                      labelFormatter={(label) => `End of Year ${label}`}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                      }}
                      itemStyle={{ fontWeight: 600, fontSize: "14px" }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{
                        paddingTop: "20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    />
                    <Area
                      type="monotone"
                      name="Buy Net Worth"
                      dataKey="buyNetWorth"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorBuy)"
                    />
                    <Area
                      type="monotone"
                      name="Rent Net Worth"
                      dataKey="rentNetWorth"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRent)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white mt-6 mb-6">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-5">
              <CardTitle className="text-slate-800 text-xl font-black tracking-tight">
                <div className="flex items-center gap-2">
                  Home Ownership: Debt vs Equity
                  <InfoPopover title="Debt vs Equity Breakdown">
                    <p className="text-slate-600 mb-2">
                      <strong className="text-slate-800">Includes:</strong>
                      <br />• <em>Mortgage Debt:</em> Remaining loan principal balance over time.
                      <br />• <em>Home Equity:</em> Appreciated property market value minus remaining debt and estimated selling costs.
                    </p>
                    <p className="text-slate-600">
                      <strong className="text-slate-800">Includes Tax Savings? NO.</strong>
                      <br />• Excludes liquid stock investments, tax refunds, interest, taxes, HOA, insurance, and maintenance (these do not alter property value or loan balance directly).
                    </p>
                  </InfoPopover>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.points}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      tickFormatter={(value) => `Yr ${value}`}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      tickFormatter={formatCurrency}
                      width={65}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrencyExact(value)}
                      labelFormatter={(label) => `End of Year ${label}`}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                      }}
                      itemStyle={{ fontWeight: 600, fontSize: "14px" }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{
                        paddingTop: "20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    />
                    <Area
                      type="monotone"
                      name="Mortgage Debt"
                      dataKey="mortgageBalance"
                      stackId="1"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorDebt)"
                    />
                    <Area
                      type="monotone"
                      name="Home Equity"
                      dataKey="equity"
                      stackId="1"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorEquity)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white mb-10">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-5">
              <CardTitle className="text-slate-800 text-xl font-black flex items-center justify-between tracking-tight">
                <div className="flex items-center gap-2">
                  Sunk Costs Over Time
                  <InfoPopover title="Tax Savings Deduction in Sunk Costs">
                    <p className="text-slate-600 mb-2">
                      <strong className="text-slate-800">Buy Sunk Cost:</strong> Total unrecoverable expenses (Mortgage Interest + Property Taxes + Insurance + HOA + Maintenance + Closing Costs).
                    </p>
                    <p className="text-slate-600">
                      <strong className="text-slate-800">Tax Savings Offset:</strong> Each year's tax savings refund (mortgage interest & property taxes deducted above standard deduction) is subtracted directly from accumulated sunk costs to show true net unrecoverable costs.
                    </p>
                  </InfoPopover>
                </div>
              </CardTitle>
              <CardDescription className="text-sm font-medium text-slate-500 mt-1">
                Net unrecoverable costs (Rent paid vs. Interest, Taxes, Maint, HOA, Insurance — reduced by Tax Savings)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.points}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      tickFormatter={(value) => `Yr ${value}`}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      tickFormatter={formatCurrency}
                      width={65}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrencyExact(value)}
                      labelFormatter={(label) => `End of Year ${label}`}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                      }}
                      itemStyle={{ fontWeight: 600, fontSize: "14px" }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{
                        paddingTop: "20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    />
                    <Line
                      type="monotone"
                      name="Buy Sunk Cost (Including Tax Savings)"
                      dataKey="buySunk"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      name="Rent Sunk Cost"
                      dataKey="rentSunk"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white mb-10">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-5">
              <CardTitle className="text-slate-800 text-xl font-black flex items-center justify-between tracking-tight">
                <div className="flex items-center gap-2">
                  Tax Savings
                  <InfoPopover title="Tax Savings Breakdown">
                    <p className="text-slate-600 mb-2">
                      <strong className="text-emerald-700">Includes:</strong>
                      <br />• <em>Annual Tax Savings:</em> (Deductible Mortgage Interest up to $750k cap + Property Taxes up to SALT cap − Standard Deduction) × Marginal Tax Rate.
                      <br />• <em>Cumulative Tax Savings:</em> Running sum of annual tax savings over time.
                    </p>
                    <p className="text-slate-600">
                      <strong className="text-slate-800">Impact:</strong> This annual savings flows into the Buyer's stock portfolio in the Net Worth graph and reduces accumulated Buy Sunk Costs.
                    </p>
                  </InfoPopover>
                </div>
              </CardTitle>
              <CardDescription className="text-sm font-medium text-slate-500 mt-1">
                Annual and cumulative money saved on taxes due to homeownership deductions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data.points}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      tickFormatter={(value) => `Yr ${value}`}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      tickFormatter={formatCurrency}
                      width={65}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      tickFormatter={formatCurrency}
                      width={65}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrencyExact(value)}
                      labelFormatter={(label) => `End of Year ${label}`}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                      }}
                      itemStyle={{ fontWeight: 600, fontSize: "14px" }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{
                        paddingTop: "20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      name="Cumulative Tax Savings"
                      dataKey="cumulativeTaxSavings"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTax)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      name="Yearly Tax Savings"
                      dataKey="yearlyTaxSavings"
                      stroke="#059669"
                      strokeWidth={0}
                      dot={{ r: 4, fill: "#059669", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
