// @ts-check
/** @type {import('tailwindcss/tailwind-config').TailwindConfig} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms')],
}
