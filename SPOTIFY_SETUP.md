# Configuration Spotify

Ce guide vous explique comment connecter votre compte Spotify à Audio Visualizer.

## Prérequis

- Un compte Spotify (gratuit ou premium)
- Accès au [Dashboard Développeur Spotify](https://developer.spotify.com/dashboard)

## Étapes de configuration

### 1. Créer une application Spotify

1. Allez sur https://developer.spotify.com/dashboard
2. Connectez-vous avec votre compte Spotify
3. Cliquez sur **"Create app"**
4. Remplissez les informations :
   - **App name**: `Audio Visualizer` (ou le nom de votre choix)
   - **App description**: `Music visualizer application`
   - **Redirect URI**: `http://localhost:8888/callback` ⚠️ **IMPORTANT**
   - Cochez **"Web API"** dans les API/SDKs
5. Acceptez les conditions et cliquez sur **"Save"**

### 2. Récupérer vos identifiants

1. Dans votre nouvelle application, cliquez sur **"Settings"**
2. Vous verrez :
   - **Client ID** : Une chaîne de caractères (ex: `abc123def456...`)
   - **Client Secret** : Cliquez sur **"View client secret"** pour le voir
3. Gardez cette page ouverte, vous allez en avoir besoin

### 3. Configurer l'application

1. Ouvrez le fichier `main.js` dans un éditeur de texte
2. Trouvez les lignes suivantes (vers le début du fichier) :

```javascript
const spotifyApi = new SpotifyWebApi({
  clientId: 'YOUR_SPOTIFY_CLIENT_ID',
  clientSecret: 'YOUR_SPOTIFY_CLIENT_SECRET',
  redirectUri: 'http://localhost:8888/callback'
});
```

3. Remplacez :
   - `YOUR_SPOTIFY_CLIENT_ID` par votre **Client ID**
   - `YOUR_SPOTIFY_CLIENT_SECRET` par votre **Client Secret**

Exemple :
```javascript
const spotifyApi = new SpotifyWebApi({
  clientId: 'abc123def456ghi789jkl012',
  clientSecret: 'mno345pqr678stu901vwx234',
  redirectUri: 'http://localhost:8888/callback'
});
```

4. Sauvegardez le fichier

### 4. Utiliser Spotify dans l'application

1. Lancez l'application : `npm start`
2. Dans la barre latérale, cliquez sur l'onglet **"Spotify"**
3. Cliquez sur **"Connect Spotify"**
4. Votre navigateur s'ouvrira pour l'authentification
5. Autorisez l'application à accéder à votre compte
6. Retournez dans l'application
7. Cliquez sur **"Load Playlists"** pour charger vos playlists
8. Sélectionnez une playlist, puis une chanson pour la visualiser !

## Fonctionnalités Spotify

- ✅ Connexion sécurisée OAuth 2.0
- ✅ Accès à toutes vos playlists (publiques et privées)
- ✅ Lecture des aperçus de 30 secondes
- ✅ Détection automatique du BPM depuis Spotify
- ✅ Affichage des pochettes d'album
- ✅ Informations sur les artistes
- ✅ Synchronisation automatique des tokens

## Notes importantes

⚠️ **Limitations** :
- Spotify ne fournit que des **aperçus de 30 secondes** pour les pistes via leur API Web
- Certaines pistes peuvent ne pas avoir d'aperçu disponible
- Pour une lecture complète, utilisez l'application Spotify officielle

🔒 **Sécurité** :
- Vos tokens sont stockés localement et jamais partagés
- La connexion utilise le protocole OAuth 2.0 standard
- Vous pouvez vous déconnecter à tout moment

## Dépannage

### L'authentification échoue
- Vérifiez que le Redirect URI est exactement `http://localhost:8888/callback`
- Vérifiez que vos Client ID et Client Secret sont corrects
- Assurez-vous que le port 8888 n'est pas déjà utilisé

### Aucune playlist ne s'affiche
- Cliquez sur le bouton "Load Playlists"
- Vérifiez votre connexion Internet
- Reconnectez-vous à Spotify

### "No preview available"
- Certaines pistes n'ont pas d'aperçu disponible dans l'API Spotify
- Essayez une autre chanson de la playlist

## Support

Pour plus d'informations sur l'API Spotify, consultez :
- [Documentation officielle Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Guide OAuth 2.0](https://developer.spotify.com/documentation/general/guides/authorization/)
