import ClientProviders from "../components/ClientProviders";
import "./globals.css";

export const metadata = {
  title: "Discord Colored Text Generator",
  description: "Create Discord messages with ANSI codes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#36393F", color: "#FFF" }}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
