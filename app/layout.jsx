export const metadata = {
  title: "Social Media Content Scheduler",
  description: "Role-based social media content scheduling workflow",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
