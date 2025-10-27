import { redirect } from 'next/navigation';

export default function Home() {
  // Reindirizza alla pagina di login o a una dashboard se l'utente non è autenticato
  // Questo è un esempio, adatta al flusso di autenticazione della tua app
  redirect('/auth/login'); 
  // Oppure, se hai una dashboard come homepage per utenti autenticati:
  // redirect('/dashboard'); 
  
  // Puoi anche mostrare un contenuto statico se preferisci
  // return (
  //   <main className="flex min-h-screen flex-col items-center justify-between p-24">
  //     <h1>Benvenuto nella tua applicazione!</h1>
  //     <p>Accedi per continuare.</p>
  //   </main>
  // );
}