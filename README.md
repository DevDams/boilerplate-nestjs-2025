# NestJS API Boilerplate

A modern, secure, and feature-rich NestJS API boilerplate with MongoDB integration, advanced authentication, file storage, and optimized query capabilities.

## Stack Technique

- **Backend Framework**: NestJS avec TypeScript
- **Base de données**: MongoDB avec Mongoose
- **Authentification**: JWT (JSON Web Tokens)
- **Documentation API**: Swagger/OpenAPI
- **Stockage de fichiers**: Abstraction modulaire (support local et Cloudflare R2)
- **Validation**: class-validator et ValidationPipe
- **Sécurité**: Helmet, CORS, hachage de mots de passe
- **Planification**: @nestjs/schedule pour les tâches programmées
- **Email**: Service d'email intégré

## Fonctionnalités Principales

1. **Configuration de l'API**
   - Architecture modulaire NestJS
   - Documentation Swagger complète
   - Variables d'environnement configurables

2. **Sécurité**
   - Authentification JWT
   - Autorisation basée sur les rôles et permissions
   - Protection contre les attaques courantes avec Helmet
   - Gestion de blacklist des tokens

3. **Intégration MongoDB**
   - Schémas optimisés: Utilisateurs, Rôles, Catégories, etc.
   - Pattern Repository pour l'accès aux données

4. **Fonctionnalités de Requête Avancées**
   - Pagination basée sur curseur
   - Filtrage, tri et recherche
   - Sélection de champs (projection)
   - Optimisation des performances de requête

5. **Gestion des Fichiers**
   - Upload et gestion de fichiers
   - Abstraction de stockage (local/cloud)

6. **Standardisation des Réponses**
   - Format de réponse uniforme
   - Gestion globale des erreurs
   - Intercepteurs de transformation

## Configuration du Projet

### Prérequis

- Node.js (v16+)
- npm ou yarn
- MongoDB (local ou distant)
- (Optionnel) Compte Cloudflare pour R2 Storage

### Variables d'Environnement

Créez un fichier `.env` à la racine du projet en vous basant sur `.env.example`:

```
# Application
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/nestjs-boilerplate

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Storage (local ou cloudflare)
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./uploads

# Cloudflare R2 (si STORAGE_TYPE=cloudflare)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
```

## Installation et Démarrage

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Démarrer en mode développement**
   ```bash
   npm run start:dev
   ```

3. **Démarrer en mode production**
   ```bash
   npm run build
   npm run start:prod
   ```

4. **Accéder à la documentation API**
   Ouvrez votre navigateur à l'adresse: `http://localhost:3000/api/docs`

## Structure du Projet

```
src/
├── auth/                 # Module d'authentification
├── common/               # Utilitaires, intercepteurs, filtres partagés
├── config/               # Configuration de l'application
├── database/             # Modules de base de données
│   ├── categories/       # Module de catégories
│   ├── roles/            # Module de rôles
│   ├── users/            # Module d'utilisateurs
│   └── schemas/          # Schémas Mongoose
├── storage/              # Module de stockage de fichiers
├── app.module.ts         # Module principal
└── main.ts               # Point d'entrée de l'application
```

## Guide de Développement

### Créer un Nouveau Module

1. **Créer un nouveau répertoire dans `src/database/`**
   ```bash
   mkdir -p src/database/my-feature
   ```

2. **Créer les fichiers essentiels**
   ```bash
   touch src/database/my-feature/my-feature.module.ts
   touch src/database/my-feature/my-feature.controller.ts
   touch src/database/my-feature/my-feature.service.ts
   mkdir -p src/database/my-feature/dto
   ```

3. **Créer le schema Mongoose dans `src/database/schemas/`**
   ```bash
   touch src/database/schemas/my-feature.schema.ts
   ```

4. **Exemple de structure de module**:

   ```typescript
   // my-feature.module.ts
   import { Module } from '@nestjs/common';
   import { MongooseModule } from '@nestjs/mongoose';
   import { MyFeature, MyFeatureSchema } from '../schemas/my-feature.schema';
   import { MyFeatureController } from './my-feature.controller';
   import { MyFeatureService } from './my-feature.service';
   import { CommonModule } from '../../common/common.module';
   import { RolesModule } from '../roles/roles.module';

   @Module({
     imports: [
       MongooseModule.forFeature([
         { name: MyFeature.name, schema: MyFeatureSchema },
       ]),
       CommonModule,
       RolesModule, // Si vous utilisez les gardes de rôles
     ],
     controllers: [MyFeatureController],
     providers: [MyFeatureService],
     exports: [MyFeatureService],
   })
   export class MyFeatureModule {}
   ```

5. **Importer votre module dans `app.module.ts`**

### Implémentation de la Pagination par Curseur

Pour implémenter la pagination par curseur dans votre module, utilisez le `QueryService` du module `CommonModule`:

```typescript
// my-feature.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MyFeature } from '../schemas/my-feature.schema';
import { QueryService } from '../../common/services/query.service';
import { QueryOptionsDto } from '../../common/dto/query-options.dto';

@Injectable()
export class MyFeatureService {
  constructor(
    @InjectModel(MyFeature.name) private myFeatureModel: Model<MyFeature>,
    private queryService: QueryService,
  ) {}

  async findAll(queryOptions: QueryOptionsDto) {
    return this.queryService.executeCursorPaginatedQuery(
      this.myFeatureModel,
      queryOptions,
    );
  }
}
```

### Sécurité et Autorisations

Pour protéger vos endpoints avec des autorisations basées sur les rôles:

```typescript
// my-feature.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('my-features')
export class MyFeatureController {
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  findAll() {
    // Votre code ici
  }
}
```

## Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture de code
npm run test:cov
```

## Déploiement

Pour déployer en production:

1. Assurez-vous que les variables d'environnement sont correctement configurées
2. Construisez l'application: `npm run build`
3. Utilisez un gestionnaire de processus comme PM2: `pm2 start dist/main.js --name api`

## Bonnes Pratiques

1. **Respectez l'architecture modulaire** de NestJS
2. **Utilisez les DTOs** pour la validation des entrées
3. **Documentez vos endpoints** avec Swagger
4. **Implémentez des tests** pour chaque fonctionnalité
5. **Utilisez les filtres d'exception globaux** pour gérer les erreurs

## Ressources

- [Documentation NestJS](https://docs.nestjs.com)
- [Documentation Mongoose](https://mongoosejs.com/docs/guide.html)
- [Documentation JWT](https://jwt.io/introduction)
