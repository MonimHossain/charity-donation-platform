/** Large highlight numbers (lime green on purple sections). */
export const statValueClass =
  "font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-accent leading-none tabular-nums";

/** Stat numbers on light cards (about page, campaign landing, etc.). */
export const statValueSmClass =
  "font-serif text-3xl lg:text-4xl font-bold text-accent tabular-nums";

/** Donation totals and summary amounts on purple panels. */
export const statTotalClass =
  "font-serif text-4xl sm:text-5xl font-semibold text-accent tabular-nums leading-none";

/** Shared pill button styles aligned with yourimpactfdn.vercel.app */
export const publicButtonHoverClass = "hover:bg-primary hover:text-primary-foreground";

export const homeDonateButtonClass =
  `inline-flex items-center justify-center gap-1.5 rounded-full bg-accent text-accent-foreground font-semibold ${publicButtonHoverClass} transition-colors shadow-soft`;

export const homeOutlineButtonClass =
  `inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background text-foreground font-semibold ${publicButtonHoverClass} transition-colors`;
