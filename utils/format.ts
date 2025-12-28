export const formatCurrency = (amount: number, symbol: string = '₹') => {
  // Amount is in minor units (e.g. paise), so divide by 100
  const value = amount / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR', // Using INR format logic but replacing symbol if needed
    currencyDisplay: 'narrowSymbol',
  }).format(value).replace('₹', symbol);
};

export const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(timestamp));
};

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};