/**
 * Glassmorphic UI Utility Classes
 * Use these consistently across all pages
 */

export const glassClasses = {
  // Container backgrounds
  background: "bg-gradient-to-br from-black via-slate-900 to-black",
  backgroundAnimation: `
    absolute inset-0 overflow-hidden
    after:absolute after:-top-40 after:-right-40 after:w-80 after:h-80 
    after:bg-gradient-to-br after:from-white/5 after:to-transparent 
    after:rounded-full after:blur-3xl after:animate-pulse
  `,
  
  // Glass cards
  card: "backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-lg",
  cardHover: "backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-lg hover:bg-white/10 hover:shadow-xl transition-all",
  
  // Text colors
  heading: "text-white",
  subheading: "text-gray-300",
  body: "text-gray-400",
  muted: "text-gray-500",
  
  // Buttons
  buttonPrimary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg",
  buttonOutline: "border border-white/10 text-gray-200 hover:bg-white/10 bg-transparent",
  
  // Inputs
  input: "bg-white/5 border border-white/10 text-gray-100 placeholder:text-gray-400",
  
  // Badges
  badge: (color: 'green' | 'yellow' | 'blue' | 'purple' | 'red') => {
    const colors = {
      green: "bg-emerald-500/20 text-emerald-300 border-white/10",
      yellow: "bg-yellow-500/20 text-yellow-300 border-white/10",
      blue: "bg-blue-500/20 text-blue-300 border-white/10",
      purple: "bg-purple-500/20 text-purple-300 border-white/10",
      red: "bg-red-500/20 text-red-300 border-white/10",
    };
    return colors[color];
  },
  
  // Separators
  separator: "border-white/10",
  
  // Shadows
  shadow: "shadow-[0_8px_30px_rgba(0,0,0,0.25)]",
  
  // Status colors
  active: "bg-emerald-500/20 text-emerald-300",
  pending: "bg-yellow-500/20 text-yellow-300",
  inactive: "bg-white/10 text-gray-200",
};

