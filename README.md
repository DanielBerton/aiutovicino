
# AiutoVicino Back-end project

Questo progetto contiene le funzioni utilizzate dal progetto Android **AiutoVicino** [https://github.com/bordi93Unive/AiutoVicino]

Il progetto è costituito da una serie di funzione scritte in Node.js (JavaScript lato server), e si basa su architettura **FireBase**.
Si connette ad un database **FireStore**, sempre appartenente della suite FireBase.
Il progetto è modularizzato, è presente un file per ogni categoria di servizio (Users, Category,Applications, ...), che vengono importati in *index.js* che è il main file (file principale che viene invocato).

Il progetto è serverless, utilizzando un'architettura Cloud, e non ha bisogno di avvio, ma è attivo al bisogno.

### Comando per il deploy

Questo comando permette di eseguire un deploy delle funzioni presenti sul progetto

```
firebase deploy --only functions
```

### LOG

I log delle funzioni sono presenti nella console fornita da Google, accedendo con un account abilitato all'accesso alla console Firebase:

[https://console.cloud.google.com]

# AiutoVicino Front-end project

I servizi utilizzati da questo progetto sono contenuti nel repository **aiutovicino** [https://github.com/DanielBerton/aiutovicino]

La parte front-end è sviluppata con Android Studio e il linguaggio di programmazione Java. E' sufficiente scaricare il progetto da Github ed importarlo in Android Studio per studiarne l'implementazione. All'interno del codice è presente una chiara suddivisione tra Activity, Fragment e modelli utilizzati per gli oggetti.
E' possibile eseguire l'applicazione tramite l'emulatore interno di Android Studio oppure collegando direttamente al computer un telefono Android (settato in modalità sviluppatore), in questo modo l'app verrà installata e ne sarà possibile l'utilizzo futuro senza collegamenti fisici tra smartphone e pc.

### Credenziali per testing

Riportiamo di seguenti 2 utenti con i quali è possibile testare le funzionalità dell'applicazione:

Utente Admin: mario.rossi@gmail.com psw: #Mario123

Utente Standard: test.unive@gmail.com psw: #Unive123

E' possibile creare altri utenti che possono essere approvati tramite la convalida dell'utente admin Mario Rossi.

### Requisiti

Per l'utilizzo di AiutoVicino è necessario:
- smartphone Android touchscreen con versione di sistema operativo almeno 6.0
- connessione internet per collegamento a database

