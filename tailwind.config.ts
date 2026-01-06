import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'mobile-landscape': {
          raw: '(orientation: landscape) and (max-height: 700px)',
        },
      },
      fontFamily: {
        // 更接近苹果官方的柔和无衬线字体
        sans: [
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          ...defaultTheme.fontFamily.sans,
        ],
        mono: defaultTheme.fontFamily.mono,
        primary: [
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          ...defaultTheme.fontFamily.sans,
        ],
      },
      colors: {
        // 成熟的影院式配色，结合苹果低饱和质感与 Netflix 式红色点缀
        primary: {
          50: '#fff1f2',
          100: '#ffd7dc',
          200: '#ffacb9',
          300: '#ff7a8b',
          400: '#ff4f66',
          500: '#e50914',
          600: '#c40811',
          700: '#9d0710',
          800: '#6e040c',
          900: '#4a0208',
        },
        ink: {
          50: '#f5f7fb',
          100: '#e8edf5',
          200: '#cfd7e6',
          300: '#a9b4c8',
          400: '#8c95a9',
          500: '#6d768c',
          600: '#575f73',
          700: '#414653',
          800: '#2b2f39',
          900: '#181c24',
        },
        retro: {
          bg: '#070a12', // 深邃背景
          surface: '#0d1220', // 玻璃面板底色
          border: '#1b2333', // 柔和描边
          text: '#f5f7fb', // 高对比白
          dim: '#b6bcc9', // 次级文字
          grid: '#0b1021',
        },
        dark: '#05070c',
      },
      backgroundImage: {
        // 微光渐变，营造影院级氛围
        aurora:
          'radial-gradient(circle at 20% 20%, rgba(229, 9, 20, 0.12), transparent 30%), radial-gradient(circle at 80% 0%, rgba(99, 121, 255, 0.12), transparent 32%), linear-gradient(140deg, #060910 0%, #080c16 55%, #060910 100%)',
      },
      keyframes: {
        // CRT 扫描线滚动
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        // 机械式闪烁（非渐变，而是硬切）
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        // 启动时的CRT展开效果
        turnOn: {
          '0%': { transform: 'scale(1, 0.01)', filter: 'brightness(2)' },
          '50%': { transform: 'scale(1, 0.05)', filter: 'brightness(2)' },
          '100%': { transform: 'scale(1, 1)', filter: 'brightness(1)' },
        },
      },
      animation: {
        scanline: 'scanline 8s linear infinite',
        blink: 'blink 1s step-end infinite', // step-end 产生机械的开关感
        'turn-on': 'turnOn 0.2s ease-out forwards',
      },
      // 定义机械式过渡：极快，线性
      transitionDuration: {
        mechanic: '75ms',
      },
      transitionTimingFunction: {
        mechanic: 'linear',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} satisfies Config;

export default config;
