# BigMamaReps auf Vercel

Shop und Admin sind eine gemeinsame Next.js-App. `vercel.json` enthält die Installation mit fest gepinntem pnpm und den Build. Das eigene Hero-Video und sein Poster liegen bereits in `public/media`; hierfür ist kein zusätzlicher Upload-Dienst nötig.

## 1. Repository importieren

In Vercel **Add New → Project → poli180/BigMamaReps** importieren. Root Directory: Repository-Wurzel (`./`). Framework: Next.js. Node.js: 22.x. Installation und Build aus `vercel.json` übernehmen; Output Directory nicht überschreiben. `BUILD_STANDALONE` nicht setzen (nur für Docker).

## 2. Umgebungsvariablen

Unter Project Settings → Environment Variables für **Production** konfigurieren. Keine Zugangsdaten in GitHub eintragen. Die vollständige Vorlage ist `.env.example`.

| Variable | Zweck |
| --- | --- |
| `DATABASE_URL` | Gehostete PostgreSQL-Datenbank, mit TLS und für serverless geeigneter Verbindungsbegrenzung/Pooling laut Datenbankanbieter. Keine lokale 127.0.0.1-URL verwenden. |
| `APP_URL` | Exakte öffentliche HTTPS-Adresse, ohne abschließenden Slash, z. B. `https://dein-shop.vercel.app`. |
| `ADMIN_EMAIL` | Deine Admin-E-Mail. |
| `ADMIN_PASSWORD_HASH` | bcrypt-Hash des Passworts. Rohwert in Vercel einfügen, ohne Anführungszeichen oder Backslashes vor Dollarzeichen. |
| `NEXTAUTH_SECRET` | Zufälliges Secret mit mindestens 32 Zeichen. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Zunächst aus der Stripe-Testumgebung. |
| `CRON_SECRET` | Separates zufälliges Secret für den Wartungsendpunkt. |
| `EMAIL_API_KEY`, `EMAIL_FROM` | E-Mail-Dienst und verifizierter Absender. |
| `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET`, `STORAGE_BUCKET_URL`, `STORAGE_ENDPOINT`, `STORAGE_REGION` | Für eigene Bild-/Video-Uploads im Admin. Ohne Bucket können bereits öffentlich erreichbare Medien-URLs eingetragen werden. |

Optionale Telegram-Variablen stehen in der README. `SHOP_PREVIEW=true` zeigt bei Beispielprodukten einen Vorschauhinweis; vor echtem Verkauf entfernen. Ohne Datenbank funktioniert nur die öffentliche Demo, kein Admin. Ohne Stripe ist die Zahlung deaktiviert.

Die lokale Entwicklungsdatenbank und `.env.local` werden bewusst nicht hochgeladen. Die Anmeldung auf Vercel verwendet die dort eingetragenen Variablen. Preview-Deployments benötigen eigene Testdatenbank und Testschlüssel sowie ihre eigene `APP_URL`.

## 3. Datenbank vorbereiten

Vor dem ersten Aufruf mit der **produktiven** Datenbank-URL in einer lokalen `.env` ausführen:

```bash
npm run db:migrate
# Optional NUR für eine Demo: Beispielprodukte anlegen
npm run db:seed
```

Migrationen sind versioniert. Die Kategorienmigration übernimmt bestehende Produktkategorien; Umbenennen aktualisiert die Produktzuordnungen automatisch. Bei einem bestehenden Shop zuerst ein Backup erstellen. Migrationen laufen bewusst nicht bei jedem Preview-Build automatisch gegen Produktion.

Der Seed-Befehl lädt `.env` / `.env.local`. Prüfe die Zielumgebung, bevor du ihn ausführst; eine lokale `.env.local` hat Vorrang. Für die Migration gegebenenfalls die direkte Datenbank-URL des Anbieters statt einer Transaction-Pooling-URL verwenden. Danach die serverless-Verbindungs-URL in Vercel hinterlegen.

## 4. Deploy und Dienste verbinden

Deploy starten. Nach Änderungen an Umgebungsvariablen erneut deployen. Öffnen: `/` für den Shop, `/admin/login` für den Admin und `/admin/categories` für Kategorien. Unter **Home & Hero** Video, Poster und Texte bearbeiten.

Stripe-Webhook auf `https://DEINE-DOMAIN/api/webhooks/stripe` richten (Ereignisliste in README). Medien-Bucket-CORS für die produktive Domain freigeben. `/api/cron` alle fünf Minuten mit `Authorization: Bearer <CRON_SECRET>` aufrufen lassen. Ein Scheduler wird nicht automatisch bestellt oder aktiviert; wähle einen zu deinem Hosting-Tarif passenden Zeitplan. Vor dem Verkauf einen Stripe-Testkauf, Webhook, Bestandsänderung und Mailversand durchspielen.

Eigene Produktbilder, Bestände, Unternehmensdaten und Rechtstexte vor dem Verkauf eintragen. Die Vorlage übernimmt keine Steuerregistrierung oder automatische Steuerberechnung.

Grundlage: [Next.js auf Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs). Die Anwendung wurde lokal gebaut und getestet; ein Vercel-Deployment ist erst nach deiner Konfiguration möglich.
