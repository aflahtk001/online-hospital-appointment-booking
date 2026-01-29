/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'apple-gray': '#f5f5f7',
                'apple-blue': '#0071e3', // Apple's call-to-action blue
                'apple-text': '#1d1d1f', // Primary black text
                'apple-subtext': '#86868b', // Secondary gray text
                'apple-card': '#ffffff',
            },
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"Segoe UI"',
                    'Roboto',
                    '"Helvetica Neue"',
                    'Arial',
                    'sans-serif',
                ],
            },
        },
    },
    plugins: [],
}
