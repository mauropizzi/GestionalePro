import { MadeWithDyad } from "@/components/made-with-dyad";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold mb-3">Benvenuto nella tua Dashboard!</h1>
        <p className="text-sm text-muted-foreground">
          Utilizza la sidebar a sinistra per navigare tra le sezioni dell'applicazione.
        </p>
      </div>
      <MadeWithDyad />
    </DashboardLayout>
  );
}