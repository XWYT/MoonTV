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
        // 柔和的影院式配色方案，结合苹果玻璃质感与 Netflix 红色点缀
        primary: {
          50: '#fff1f3',
          100: '#ffd9e0',
          200: '#ffb4c2',
          300: '#ff829b',
          400: '#ff5375',
          500: '#ff2f5f',
          600: '#e0114a',
          700: '#c0063c',
          800: '#970632',
          900: '#7d052b',
        },
        retro: {
          bg: '#080b11', // 深邃背景
          surface: '#0f131b', // 玻璃面板底色
          border: '#1f2633', // 柔和描边
          text: '#f5f7fb', // 高对比白
          dim: '#b8becf', // 次级文字
          grid: '#111827',
        },
        dark: '#080b11',
      },
      backgroundImage: {
        // 微光渐变，营造影院级氛围
        aurora:
          'radial-gradient(circle at 20% 20%, rgba(255, 83, 117, 0.18), transparent 30%), radial-gradient(circle at 80% 0%, rgba(88, 111, 255, 0.14), transparent 32%), linear-gradient(135deg, #0b0f16 0%, #090c12 60%, #0a0c10 100%)',
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
