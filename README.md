# Quiz Squad Arena

Crea l'applicazione web "Quiz Squad". L'app deve essere in stile moderno, giocoso, divertente e invitante, con tema chiaro di default e la possibilità per l'utente di passare comodamente al tema scuro (Dark/Light mode). L'app deve essere perfettamente responsive per tutti i dispositivi, priva di bug e progettata con basi solide e sicure (anti-cheat e anti-hacker).

### 1. Sezioni dell'Applicazione

L'utente ha accesso alle seguenti sezioni principali tramite una barra di navigazione pulita:

- **Home:** Plancia di comando con layout moderno, visualizzazione del profilo, accesso rapido ai quiz e la "Vetrina dei Premi" visibile graficamente.

- **Shop:** Sezione per l'acquisto di personalizzazioni (nickname, cornici, avatar, titoli) utilizzando i crediti (monete).

- **Missioni:** Sezione dedicata alle attività giornaliere.

- **Chat:** Scrittura libera disabilitata; interazione basata unicamente su messaggi e sticker pre-impostati.

- **Profilo:** Raccolta di tutte le personalizzazioni collezionate o acquistate dall'utente.

*(Nota: Il pannello admin e le automazioni avanzate saranno configurati in seguito).*

### 2. Sistema di Ticket e Quiz

- **Ticket Giornalieri:** Ogni utente riceve 5 ticket gratuiti al giorno. È possibile sbloccare fino a 3 ticket bonus guardando video (1 video = 1 ticket bonus, massimo 3 video al giorno). I ticket bonus si possono guardare *solo* quando i 5 ticket gratuiti giornalieri sono completamente esauriti.

- **Tipologia di Quiz:** 1 ticket = 1 quiz. I quiz non sono di cultura generale, ma indovinelli e trabocchetti suddivisi in 3 livelli di difficoltà: medio, difficile e impossibile.

- **Ordine Giornaliero dei Quiz:**

  - Con i 5 ticket gratuiti: 2 quiz medi, 2 difficili e 1 impossibile (in questo ordine).

  - Con i ticket bonus video: 1 medio, 1 difficile e 1 impossibile (in questo ordine).

- **Punti e Crediti:** Le risposte corrette assegnano punti (per le classifiche) e crediti (per lo shop). I quantitativi devono essere personalizzabili per ogni domanda. Alla risposta corretta, l'app mostra chiaramente all'utente quanti punti e crediti sono stati accreditati.

- **Unicità:** Un utente non deve mai visualizzare lo stesso quiz più di una volta.

- **Blocco Iniziale:** Per poter fare i quiz, gli utenti devono prima aver scelto la squadra stagionale.

### 3. Logica delle Squadre Stagionali (2 Squadre)

- **Lunedì (Scelta Libera):** L'utente seleziona una delle 2 squadre; la scelta viene bloccata e resa definitiva per tutta la settimana.

- **Martedì - Domenica (Assegnazione / Bilanciamento 50/50):**

  - *Caso 1 (Scambio possibile se non troppo sbilanciato):* Mostra due bottoni: "Accetta la squadra" (conferma, bloccata) e "Cambia squadra (Guarda Video)" (guarda video, assegna l'altra squadra, bloccata).

  - *Caso 2 (Scambio NON possibile):* Mostra solo "Accetta la squadra" con un testo statico accanto: "L'altra squadra è al completo".

- Dopo l'accettazione o il cambio, la squadra è definitiva per la settimana.

### 4. Vetrina dei Premi

Gli utenti visualizzano graficamente nella home i premi in palio a fine stagione:

1. **Premio Campione:** Cornice con corona (personalizzabile a livello grafico), assegnata a fine stagione al primo in classifica generale.

2. **Premio Squadra:** Titolo (personalizzabile), assegnato a fine stagione a tutti i membri della squadra vincitrice della classifica a squadre.

### 5. Classifiche e UI Profilo

- **Classifiche:** 

  1. Classifica Generale (punteggi singoli).

  2. Classifica a Squadre (somma dei punti dei membri di ciascuna squadra).

- **Visualizzazione Utente:** In classifica, in home e in chat, per ogni utente devono essere chiaramente visibili: Nome, Avatar, Cornice, Titolo e Squadra di appartenenza di quella settimana.

### 6. Componenti Extra (Solo Scheletri / Placeholder UI)

- **Ruota del Mattino:** Inserire solo il componente grafico della ruota con gli spicchi visibili e un placeholder per il giro giornaliero (senza logiche complesse di backend per ora).

- **Weekly Streak:** Inserire solo il componente grafico della serie settimanale (es. i 7 giorni con il premio del settimo giorno visibile) come segnaposto visivo.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/abae4eb9-ed5a-4865-90f4-3b58a3b545ed).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
