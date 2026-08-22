# Lancer le projet (back + front)

Backend = Docker (API NestJS + PostgreSQL + Redis) sur le port **3003**.
Frontend = serveur de dev Vite sur le port **5173**.
Le front sait déjà joindre le back via `frontend/.env` (`VITE_API_URL=http://localhost:3003`).

> **Important :** toujours utiliser `-p renel-enerji` avec `docker compose`. C'est le nom de
> projet Docker qui pointe sur ta base existante. Sans ça, Docker crée une base vide et
> bloque sur le port 3003.

---

## Démarrage rapide (le backend tourne souvent déjà)

Vérifier si le backend répond :

```bash
curl http://localhost:3003/api/health      # {"status":"ok"...} = déjà lancé
```

- **Si OK** → lance juste le frontend :

  ```bash
  cd /Users/mohamedlyazidi/Desktop/dev-local/blog-website/renel-enerji-pulserecipe/frontend
  npm run dev
  ```

  → ouvre **http://localhost:5173**

- **Sinon** → suis la procédure complète ci-dessous.

---

## Procédure complète (depuis zéro)

### 1. Backend (Docker : API + PostgreSQL + Redis)

```bash
cd /Users/mohamedlyazidi/Desktop/dev-local/blog-website/renel-enerji-pulserecipe

# Si Docker Desktop est éteint :
open -ga Docker        # puis attendre ~15s qu'il démarre

docker compose -p renel-enerji up -d db redis backend
curl http://localhost:3003/api/health        # doit répondre {"status":"ok"...}
```

### 2. Frontend (serveur de dev Vite)

```bash
cd frontend
npm install     # 1ère fois seulement
npm run dev     # → http://localhost:5173
```

---

## Adresses

| Adresse | Rôle |
| --- | --- |
| http://localhost:5173 | Site public |
| http://localhost:5173/rnl-panel | Panneau admin |
| http://localhost:3003/api | API backend |

---

## Après une modification de code

- **Frontend** : rien à faire, Vite recharge tout seul (hot reload).
- **Backend** : reconstruire l'image puis relancer :

  ```bash
  cd /Users/mohamedlyazidi/Desktop/dev-local/blog-website/renel-enerji-pulserecipe
  docker compose -p renel-enerji build backend && docker compose -p renel-enerji up -d backend
  ```

---

## Arrêter

```bash
docker compose -p renel-enerji stop     # arrête sans perdre les données
# Ctrl+C dans le terminal du frontend pour couper Vite
```

---

## Commandes utiles

```bash
docker logs -f renel-enerji-backend-1     # logs backend en direct
cd backend  && npm test                   # tests backend
cd frontend && npm test                   # tests frontend
```

---

## Config IA (rappel)

Le backend lit le `.env` à la racine. Pour l'IA (chatbot + auto-fill des collections) :

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...        # ta vraie clé (jamais dans le frontend / jamais en VITE_)
OPENAI_MODEL=gpt-5-nano
```

Après modification du `.env` : `docker compose -p renel-enerji up -d backend` pour que le conteneur relise les variables.

Rollback IA d'urgence vers Groq, sans redéployer : `AI_PROVIDER=groq docker compose -p renel-enerji up -d backend`.
