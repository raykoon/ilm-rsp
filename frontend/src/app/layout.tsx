import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Sans_SC } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })
const notoSansSC = Noto_Sans_SC({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-sc'
})

export const metadata: Metadata = {
  title: '儿童口腔快速筛查报告平台',
  description: '基于AI的儿童口腔快速筛查和智能报告生成平台',
  keywords: ['儿童口腔', '口腔筛查', 'AI分析', '医疗报告', '口腔诊断'],
  authors: [{ name: 'ILM-RSP Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${notoSansSC.variable}`}>
      <body className={`${inter.className} ${notoSansSC.className} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1E293B',
                color: '#fff',
                fontSize: '14px',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}