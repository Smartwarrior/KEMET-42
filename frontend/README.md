# KEMET-42 — front-end React + Three.js

Jeu éducatif 3D pour le **NASA Space Apps Challenge 2026** (Junior Astronaut Mission Trainer).

Parcours : compte optionnel → hangar Terre → ressources → **Lune ou Mars** → terrain d'atterrissage → survie jour après jour avec **trade-offs**, **délai de communication Terre**, questions NASA et sources affichées.

Une mauvaise réponse ou un choix risqué réduit la **vie de l'astronaute**.

## Lancer
```
npm install
npm run dev      # développement
npm run build    # produit dist/index.html : UN seul fichier, fonctionne hors-ligne (double-clic)
npm test         # 16 tests de la logique (Node)
npm run sim      # simulation d'équilibrage
```

## Données : réelles uniquement
`src/kemet/facts.js` ne contient que des valeurs lues sur des pages officielles NASA (fiches Mars/Lune du NSSDC, page Jezero, page Gale/Mont Sharp, communiqué Artemis III), avec **source + date de mise à jour** affichées dans l'interface.
Ce qu'une page ne dit pas n'est pas affiché (ex. : aucun diamètre de cratère). `src/kemet/questions.js` : chaque bonne réponse pointe vers sa source ; les mauvaises réponses sont des leurres.
Distance Terre→astre et temps-lumière : appel **en direct** à l'API JPL Horizons (`fetchHorizons`). Hors-ligne ou refus CORS : « indisponible » (aucune valeur inventée).
Les anciennes fiches « Le savais-tu ? » (`verified:false`) sont désactivées.

## Règles de jeu (≠ données)
Étiquetées « règle de jeu » dans l'interface : 320 points de ressources (30–100 chacune), bonus de terrain +6, bonne réponse +15 crédits, mauvaise réponse −15 vie, choix à risque élevé −10 vie, pas de tempête de poussière sur la Lune (atmosphère quasi nulle d'après la fiche NASA).

## Backend
`src/kemet/api.js` : **contrat supposé** (à aligner sur votre backend) — `POST /auth/register`, `POST /auth/login` → `{ token, user:{name} }`, `POST /scores`, `GET /scores`. Variable `VITE_API_URL`. Sans elle : mode démo local (comptes dans le navigateur).

## Mode serveur (contrat `/api/mission`)

Construire le front contre votre backend : `VITE_API_URL=http://localhost:3000 npm run build` (sans cette variable : mode démo local, comptes dans localStorage).
Le serveur calcule les 4 jauges (`GET /status`) ; le front appelle `GET /briefing`, `POST /launch`, `POST /next-day`, `POST /reset`, et ajoute 3D, questions, vie, accidents visuels (déduits des alertes de `/next-day` par mots-clés : dust/storm, night, radiation, leak…).
Faux serveur de test : `PORT=3917 node scripts/mock-backend.js` (formules du cahier des charges, **non vérifiées**). `node --test tests/*.test.js` lance un parcours complet contre lui.

### Routes à ajouter dans Express (comptes et scores)
```js
app.post("/auth/register", (req,res)=>{ /* {name,password} → 409 si existe ; sinon {token,user:{name}} (hacher le mot de passe) */ });
app.post("/auth/login",    (req,res)=>{ /* 401 si invalide ; sinon {token,user:{name}} */ });
app.post("/scores", (req,res)=>{ /* Authorization: Bearer <token> ; {score,success,dest,site,sol} */ });
app.get("/scores",  (req,res)=>{ /* classement */ });
```
