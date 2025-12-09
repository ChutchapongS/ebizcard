export function generateStaticParams() {
  const ids = ["1", "2", "3"]; 
  
  return ids.map((id) => ({ id }));
  }
  
  export default function CardLayout({ children }: { children: React.ReactNode }) {
    return children;
  }