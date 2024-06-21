import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,jsx,mdx,ts,tsx}',
    './src/components/**/*.{js,jsx,mdx,ts,tsx}',
    './src/pages/**/*.{js,jsx,mdx,ts,tsx}'
  ]
}

export default config