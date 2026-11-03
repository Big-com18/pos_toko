export const qk = {
  profile: (userId: string) => ['profile', userId] as const,
  products: ['products'] as const,
  stock: ['stock'] as const,
  movements: (productId: string) => ['movements', productId] as const,
  history: (date: string) => ['history', date] as const,
  reportDaily: (from: string, to: string) => ['report-daily', from, to] as const,
  reportProducts: (from: string, to: string) => ['report-products', from, to] as const,
  staff: ['staff'] as const,
  signupCodes: ['signup-codes'] as const,
}
