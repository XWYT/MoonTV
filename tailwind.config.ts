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
        // 强制使用等宽字体作为主字体，营造终端代码感
        sans: ['"Courier New"', 'Courier', 'monospace', ...defaultTheme.fontFamily.sans],
        mono: ['"Courier New"', 'Courier', 'monospace'],
        primary: ['"Courier New"', 'Courier', 'monospace'],
      },
      colors: {
        // 复古终端配色方案
        primary: {
          50: '#fffbea',
          100: '#fff0c2',
          200: '#ffe08a',
          300: '#ffc84d',
          400: '#ffb000', // 核心琥珀色
          500: '#e69500',
          600: '#b36e00',
          700: '#8c5200',
          800: '#663a00',
          900: '#402300',
        },
        retro: {
          bg: '#050505',       // 纯黑略带灰
          surface: '#111111',  // 控件背景
          border: '#333333',   // 机械边框
          text: '#ffb000',     // 荧光字
          dim: '#664400',      // 暗淡状态
          grid: '#1a1a1a',     // 背景网格线
        },
        dark: '#050505',
      },
      backgroundImage: {
        // 细微的网格背景，模拟工程图纸或老式UI背景
        'grid-pattern': "linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)",
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
        }
      },
      animation: {
        scanline: 'scanline 8s linear infinite',
        blink: 'blink 1s step-end infinite', // step-end 产生机械的开关感
        'turn-on': 'turnOn 0.2s ease-out forwards',
      },
      // 定义机械式过渡：极快，线性
      transitionDuration: {
        'mechanic': '75ms',
      },
      transitionTimingFunction: {
        'mechanic': 'linear',
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
} satisfies Config;

export default config;
