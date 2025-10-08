import "./globals.css";

export const metadata = {
  title: "ARC — AI Health Consultant",
  description: "Grounded answers from your notes (PPAR, chlorella, etc.).",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
