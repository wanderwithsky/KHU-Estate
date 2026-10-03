export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  
  // Format as Indian Rupee (INR)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
