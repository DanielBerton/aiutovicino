
# AiutoVicino Back-end project

Questo progetto contiene le funzioni utilizzate dal progetto Android **AiutoVicino** [https://github.com/bordi93Unive/AiutoVicino]

Il progetto è costituito da una serie di funzione scritte in Node.js (JavaScript lato server), e si basa su architettura **FireBase**.
Si connette ad un database **FireStore**, sempre appartenente della suite FireBase.
Il progetto è modularizzato, è presente un file per ogni categoria di servizio (Users, Cotegory,Applications, ...), che vengono importati in *index.js* che è il main file (file principale che viene invocato).

Il progetto è serverless, utilizzando un'architettura Cloud, e non ha bisogno di avvio, ma è attivo al bisono.

## Comando per il deploy

Questo comando permette di eseguire un deploy delle funzioni presenti sul progetto

```
firebase deploy --only functions
```

## LOG

I log delle funzioni sono presenti nella console fornita da Google, accedendo con un account abilitato all'accesso alla console Firebase:

[https://console.cloud.google.com]
