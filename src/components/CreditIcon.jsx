export default function CreditIcon({ size = 'sm' }) {
  const s = size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-7 w-7' : 'h-10 w-10'
  return <img src="/credit-coin-gold.webp" alt="" aria-hidden="true" className={`${s} object-contain`} />
}
