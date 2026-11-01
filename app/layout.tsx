import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Par Mais Próximo no Teclado',
  description: 'Visualização do par de pontos mais próximo com Dividir e Conquistar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
