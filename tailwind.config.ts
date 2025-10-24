import type { Config } from "tailwindcss";

// all in fixtures is set to tailwind v3 as interims solutions

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
  			colors: {
  				background: 'hsl(var(--background))',
  				foreground: 'hsl(var(--foreground))',
  				card: {
  					DEFAULT: 'hsl(var(--card))',
  					foreground: 'hsl(var(--card-foreground))'
  				},
  				popover: {
  					DEFAULT: 'hsl(var(--popover))',
  					foreground: 'hsl(var(--popover-foreground))'
  				},
  				primary: {
  					DEFAULT: 'hsl(var(--primary))',
  					foreground: 'hsl(var(--primary-foreground))'
  				},
  				secondary: {
  					DEFAULT: 'hsl(var(--secondary))',
  					foreground: 'hsl(var(--secondary-foreground))'
  				},
  				muted: {
  					DEFAULT: 'hsl(var(--muted))',
  					foreground: 'hsl(var(--muted-foreground))'
  				},
  				accent: {
  					DEFAULT: 'hsl(var(--accent))',
  					foreground: 'hsl(var(--accent-foreground))'
  				},
  				destructive: {
  					DEFAULT: 'hsl(var(--destructive))',
  					foreground: 'hsl(var(--destructive-foreground))'
  				},
  				border: 'hsl(var(--border))',
  				input: 'hsl(var(--input))',
  				ring: 'hsl(var(--ring))',
  				chart: {
  					'1': 'hsl(var(--chart-1))',
  					'2': 'hsl(var(--chart-2))',
  					'3': 'hsl(var(--chart-3))',
  					'4': 'hsl(var(--chart-4))',
  					'5': 'hsl(var(--chart-5))'
  				},
  				sidebar: {
  					DEFAULT: 'hsl(var(--sidebar-background))',
  					foreground: 'hsl(var(--sidebar-foreground))',
  					primary: 'hsl(var(--sidebar-primary))',
  					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  					accent: 'hsl(var(--sidebar-accent))',
  					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  					border: 'hsl(var(--sidebar-border))',
  					ring: 'hsl(var(--sidebar-ring))'
  				},
  				// Dashboard specific colors
  				'dashboard': {
  					'text-primary': '#1e1e1e',
  					'text-secondary': '#64707d',
  					'text-light': '#f1f1f1',
  					'primary-blue': '#6475e9',
  					'primary-blue-hover': '#5a6bd8',
  					'light-blue': '#a2acf2',
  					'border': '#eaecf0',
  					'background-white': '#ffffff',
  					'background-light': '#f3f3f3',
  					'background-card': '#f8f9fa',
  					'background-indicator': '#e5e7eb',
  					'success-bg': '#dcfce7',
  					'success-text': '#166534',
  					'success-border': '#bbf7d0',
  					'warning-bg': '#fef3c7',
  					'warning-text': '#92400e',
  					'warning-border': '#fde68a',
  					'danger-text': '#dc2626',
  					'danger-bg': '#fef2f2',
  					'danger-hover': '#b91c1c'
  				}
  			},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			// Dashboard specific border radius
  			'dashboard-sm': '0.375rem',
  			'dashboard-md': '0.5rem',
  			'dashboard-lg': '0.75rem',
  			'dashboard-xl': '1rem',
  			'dashboard-2xl': '1.5rem'
  		},
  		spacing: {
  			// Dashboard specific spacing
  			'dashboard-xs': '0.25rem',
  			'dashboard-sm': '0.5rem',
  			'dashboard-md': '1rem',
  			'dashboard-lg': '1.5rem',
  			'dashboard-xl': '2rem'
  		},
  		boxShadow: {
  			// Dashboard specific shadows
  			'dashboard-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  			'dashboard-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
  		},
  		fontSize: {
  			// Dashboard specific font sizes
  			'dashboard-xs': '0.75rem',
  			'dashboard-sm': '0.875rem',
  			'dashboard-base': '1rem',
  			'dashboard-lg': '1.125rem',
  			'dashboard-xl': '1.25rem',
  			'dashboard-2xl': '1.5rem',
  			'dashboard-3xl': '1.875rem'
  		},
  		minHeight: {
  			// Dashboard specific heights
  			'dashboard-chart': '128px',
  			'dashboard-card-mobile': '140px'
  		},
  		width: {
  			// Dashboard specific widths
  			'dashboard-chart-bar': '2rem'
  		},
  		minWidth: {
  			// Dashboard specific minimum widths
  			'dashboard-chart-bar': '20px'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
export default config;
