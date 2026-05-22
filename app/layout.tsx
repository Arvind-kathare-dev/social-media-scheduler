import "./globals.css";

export const metadata = {
  title: "Social Media Content Scheduler",
  description: "Role-based social media content scheduling workflow",
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" toastOptions={{ className: 'text-sm font-medium', duration: 4000 }} />
      </body>
    </html>
  );
}
