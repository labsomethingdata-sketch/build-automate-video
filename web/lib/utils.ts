/** Une clases condicionales (mini alternativa a clsx, sin dependencias). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
