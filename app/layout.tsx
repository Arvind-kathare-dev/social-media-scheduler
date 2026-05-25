import "./globals.css";
import { Toaster } from "react-hot-toast";


export const metadata = {
  title: "Social Media Content Scheduler",
  description: "Role-based social media content scheduling workflow",
};


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
