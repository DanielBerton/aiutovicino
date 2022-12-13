
# AiutoVicino Back-end project

Questo progetto contiene le funzioni utilizzate dal progetto Android **AiutoVicino** [https://github.com/bordi93Unive/AiutoVicino]

Il progetto è costituito da una serie di funzione scritte in Node.js (JavaScript lato server), e si basa su architettura *FireBase*.
Si connette ad un database *FireStore*, sembre della suite FireBase.
Il progetto è modularizzato, è presente un file per ogni categoria di servizio (Users, Cotegory,Applications, ...), che vengono importati in index.js che è il main file (file principale che viene invocato).


// serverless

## Comando per il deploy

firebase deploy --only functions